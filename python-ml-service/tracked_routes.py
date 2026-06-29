# tracked_routes.py
#
# Live, per-frame tracked attendance: detect -> DeepSort track -> recognize
# every confirmed track against the FULL FAISS index -> draw the roll
# number on the frame, every frame, as it happens.
#
# Endpoint: POST /run-attendance-rtsp-tracked
# Watch live: GET /attendance-frame-preview?jobId=<jobId>   (existing route)
# Stop early: POST /stop-rtsp-stream {"jobId": "<jobId>"}   (existing route)
#
# Requires: pip install deep-sort-realtime  (added to requirements.txt)

import time
import json
import base64
import logging

import cv2
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

import state
from models import RTSPTrackedAttendanceRequest
from clustering_service import _detect_faces_tiled, _build_ui_mask
from faiss_utils import (
    _recognize_face,
    _iou,
    _centroid,
    _centroid_drift,
    _get_reverify_interval,
)
# Reuse rtsp_routes' job registry + helpers so /stop-rtsp-stream and
# /attendance-frame-preview work for tracked sessions without new routes.
from rtsp_routes import _new_job, _finish_job, _open_capture, _RTSPReader

logger = logging.getLogger("ml_service.tracked_routes")
router = APIRouter()

try:
    from deep_sort_realtime.deepsort_tracker import DeepSort
    _DEEPSORT_AVAILABLE = True
except ImportError:
    _DEEPSORT_AVAILABLE = False
    logger.warning(
        "deep-sort-realtime not installed — /run-attendance-rtsp-tracked "
        "will return 503 until `pip install deep-sort-realtime` is run."
    )


# ─── Core pipeline ────────────────────────────────────────────────────────────

def _tracked_attendance_pipeline(req: RTSPTrackedAttendanceRequest, job: dict):
    """
    Synchronous generator. Yields SSE events:
      {"type": "stage",  "message": ...}
      {"type": "marked", "roll":..., "score":..., "time":..., "in_roster":..., "evidence": base64|None}
      {"type": "frame",  "frame": n, "marked_count": n, "elapsed": secs}
      {"type": "done",   "result": {...}}
      {"type": "error",  "message": ...}
    """
    job["stop"].clear()

    if not _DEEPSORT_AVAILABLE:
        yield {"type": "error", "message":
               "deep-sort-realtime is not installed. Run: pip install deep-sort-realtime"}
        return

    if state.faiss_index is None:
        yield {"type": "error", "message":
               "No FAISS index loaded — run Generate_embeddings.py first."}
        return

    roster_upper  = {r.strip().upper() for r in req.enrolledRollNos if r.strip()}
    total_students = len(set(state.vid_to_roll.values()))
    msg = f"Live tracking against the full index ({total_students} students, all departments)"
    if roster_upper:
        msg += f" — {len(roster_upper)} on this session's roster"
    yield {"type": "stage", "message": msg}

    cap = _open_capture(req.rtspUrl)
    if not cap.isOpened():
        yield {"type": "error", "message": f"Cannot open stream: {req.rtspUrl}"}
        return

    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    scale  = min(1.0, 1080 / H) if H > 1080 else 1.0
    disp_H = int(H * scale)
    disp_W = int(W * scale)
    ui_mask = _build_ui_mask(disp_H, disp_W)

    tracker = DeepSort(max_age=20, n_init=3, nms_max_overlap=0.5, embedder=None)

    track_memory: dict = {}   # track_id -> {roll, score, ttl, last_update, last_centroid}
    marked: dict       = {}   # roll -> {time, score, in_roster}

    reader    = _RTSPReader(cap, decode_every=max(req.frameSkip, 1))
    last_seq  = 0
    frame_count = 0
    start_t   = time.time()

    yield {"type": "stage", "message": f"Stream open {W}x{H} — tracking live…"}

    try:
        while True:
            if job["stop"].is_set():
                break
            if req.durationSec and (time.time() - start_t) >= req.durationSec:
                break

            ok, frame, seq, _ = reader.latest()
            if not ok:
                yield {"type": "error",
                       "message": f"RTSP stream ended or disconnected: {req.rtspUrl}"}
                break
            if frame is None or seq == last_seq:
                time.sleep(0.01)
                continue
            last_seq = seq
            frame_count += 1
            now = time.time()

            if scale < 1.0:
                frame = cv2.resize(frame, (disp_W, disp_H), interpolation=cv2.INTER_AREA)

            # Prune stale per-track identity cache
            stale = [uid for uid, m in track_memory.items()
                     if now - m["last_update"] > req.trackExpirySec]
            for uid in stale:
                del track_memory[uid]

            detections = _detect_faces_tiled(state.face_app, frame, ui_mask)

            ds_input = [
                ([d["bbox"][0], d["bbox"][1],
                  d["bbox"][2] - d["bbox"][0], d["bbox"][3] - d["bbox"][1]],
                 float(d["det_score"]), d["embedding"])
                for d in detections
            ]
            embeds = [d["embedding"].tolist() for d in detections]
            tracks = tracker.update_tracks(ds_input, embeds=embeds, frame=frame)

            for track in tracks:
                if not track.is_confirmed():
                    continue

                l, t, r, b = map(int, track.to_ltrb())
                l, t = max(0, l), max(0, t)
                r, b = min(frame.shape[1], r), min(frame.shape[0], b)
                uid  = str(track.track_id)
                cx, cy = _centroid(l, t, r, b)

                label, color = "?", (0, 0, 255)

                # Adaptive cache check
                mem = track_memory.get(uid)
                if mem is not None:
                    drift = _centroid_drift((cx, cy), mem["last_centroid"])
                    age   = now - mem["last_update"]
                    if drift < req.driftThresholdPx and age < mem["ttl"]:
                        mem["last_centroid"] = (cx, cy)
                        if mem["roll"]:
                            label, color = f"{mem['roll']} ({mem['score']:.2f})", (0, 255, 0)
                        else:
                            label, color = f"? ({mem['score']:.2f})", (0, 0, 255)
                        cv2.rectangle(frame, (l, t), (r, b), color, 2)
                        cv2.putText(frame, label, (l, max(t - 10, 12)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                        continue

                # Match track box to closest detection this frame
                best_d, best_iou_val = None, 0.0
                for d in detections:
                    val = _iou([l, t, r, b], d["bbox"])
                    if val > best_iou_val:
                        best_iou_val, best_d = val, d

                if best_d is None or best_iou_val < req.iouMin:
                    cv2.rectangle(frame, (l, t), (r, b), color, 2)
                    cv2.putText(frame, label, (l, max(t - 10, 12)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    continue

                # Recognition — searches the WHOLE FAISS index
                roll, score = _recognize_face(
                    best_d["embedding"], state.faiss_index, state.vid_to_roll,
                    top_k=5, threshold=req.recogThreshold,
                )

                ttl = _get_reverify_interval(score) if roll else 0.0
                track_memory[uid] = {
                    "roll": roll, "score": score, "ttl": ttl,
                    "last_update": now, "last_centroid": (cx, cy),
                }

                if roll:
                    label, color = f"{roll} ({score:.2f})", (0, 255, 0)
                    if roll not in marked:
                        in_roster = (not roster_upper) or (roll.upper() in roster_upper)
                        marked[roll] = {
                            "time":      time.strftime("%Y-%m-%d %H:%M:%S"),
                            "score":     round(score, 4),
                            "in_roster": in_roster,
                        }
                        ok_crop, crop_buf = cv2.imencode(
                            ".jpg", best_d["crop"], [cv2.IMWRITE_JPEG_QUALITY, 90])
                        yield {
                            "type":      "marked",
                            "roll":      roll,
                            "score":     round(score, 4),
                            "time":      marked[roll]["time"],
                            "in_roster": in_roster,
                            "evidence":  (base64.b64encode(crop_buf.tobytes()).decode("ascii")
                                          if ok_crop else None),
                        }
                        logger.info("[TRACKED] roll=%s score=%.3f in_roster=%s",
                                    roll, score, in_roster)
                else:
                    label, color = f"? ({score:.2f})", (0, 0, 255)

                cv2.rectangle(frame, (l, t), (r, b), color, 2)
                cv2.putText(frame, label, (l, max(t - 10, 12)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            cv2.putText(frame, f"Marked: {len(marked)}", (10, 24),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2, cv2.LINE_AA)

            # Write into the existing job["frame"] buffer for /attendance-frame-preview
            try:
                prev = cv2.resize(frame, (960, 540)) if frame.shape[1] > 960 else frame
                _, buf = cv2.imencode(".jpg", prev, [cv2.IMWRITE_JPEG_QUALITY, 75])
                with job["lock"]:
                    job["frame"] = buf.tobytes()
            except Exception:
                logger.exception("Failed to encode preview frame")

            if frame_count % 15 == 0:
                yield {
                    "type":         "frame",
                    "frame":        frame_count,
                    "marked_count": len(marked),
                    "elapsed":      round(now - start_t, 1),
                }
    finally:
        reader.release()
        job["stop"].set()

    yield {
        "type": "done",
        "result": {
            "marked": marked,
            "summary": {
                "total_marked":     len(marked),
                "frames_processed": frame_count,
                "duration_sec":     round(time.time() - start_t, 1),
            },
        },
    }


# ─── Route ────────────────────────────────────────────────────────────────────

@router.post("/run-attendance-rtsp-tracked")
def run_attendance_rtsp_tracked(req: RTSPTrackedAttendanceRequest):
    """
    SSE streaming endpoint for live per-frame tracked attendance.
    Roll numbers appear on the video as each student is recognized.
    """
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")
    if not _DEEPSORT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="deep-sort-realtime is not installed. Run: pip install deep-sort-realtime",
        )

    job_id, job = _new_job()

    def generate():
        def sse(obj):
            return f"data: {json.dumps(obj)}\n\n"
        yield sse({"type": "job_id", "jobId": job_id})
        try:
            for event in _tracked_attendance_pipeline(req, job):
                yield sse(event)
        finally:
            _finish_job(job_id, job)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",
            "Content-Type":     "text/event-stream; charset=utf-8",
        },
    )
