# rtsp_routes.py

import os
import re
import json
import time
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from tracemalloc import start

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sklearn.cluster import DBSCAN as _DBSCAN

import state
from clustering_service import _detect_faces_tiled, _build_ui_mask

logger = logging.getLogger("ml_service.rtsp_routes")
router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ground_truth")

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# ── Global stop flag ──────────────────────────────────────────────────────────
_stop_event = threading.Event()

# ── Preview frame store ───────────────────────────────────────────────────────
_preview_frame = None
_preview_lock  = threading.Lock()


class _RTSPReader:
    def __init__(self, cap: cv2.VideoCapture, decode_every: int = 1):
        self._cap          = cap
        self._decode_every = max(decode_every, 1)
        self._lock         = threading.Lock()
        self._frame        = None
        self._ok           = True
        self._seq          = 0
        self._n            = 0
        self._stop         = threading.Event()
        self._t            = threading.Thread(target=self._run, daemon=True)
        self._t.start()

    def _run(self):
        while not self._stop.is_set():
            try:
                ret, frame = self._cap.read()
            except Exception as exc:
                logger.debug("_RTSPReader._run exiting: %s", exc)
                with self._lock:
                    self._ok = False
                break
            with self._lock:
                self._ok = ret
                if ret and self._n % self._decode_every == 0:
                    self._frame = frame
                    self._seq  += 1
            self._n += 1
            if not ret:
                break

    def latest(self):
        with self._lock:
            return self._ok, self._frame, self._seq, self._n

    def release(self):
        self._stop.set()
        self._cap.release()


def _open_capture(rtsp_url: str) -> cv2.VideoCapture:
    url = rtsp_url if "rtsp_transport" in rtsp_url else rtsp_url + "?rtsp_transport=tcp"
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap


def _update_preview(frame, zoom_boxes, current_pass=0):
    global _preview_frame
    vis    = frame.copy()
    colors = [
        (0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0),
        (0, 255, 255), (255, 0, 255), (0, 128, 255),
    ]
    for idx, box in enumerate(zoom_boxes):
        x1, y1, x2, y2 = box
        color     = colors[idx % len(colors)]
        thickness = 4 if idx == current_pass else 2
        cv2.rectangle(vis, (x1, y1), (x2, y2), color, thickness)
        if idx == current_pass:
            label = f"SCANNING Z{idx + 1}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            cv2.rectangle(vis, (x1, y1), (x1 + tw + 10, y1 + th + 10), color, -1)
            cv2.putText(vis, label, (x1 + 5, y1 + th + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        else:
            cv2.putText(vis, f"Z{idx + 1}", (x1 + 5, y1 + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    prev = cv2.resize(vis, (960, 540))
    _, buf = cv2.imencode('.jpg', prev, [cv2.IMWRITE_JPEG_QUALITY, 95])
    with _preview_lock:
        _preview_frame = buf.tobytes()


# ── Request models ────────────────────────────────────────────────────────────

class RTSPRequest(BaseModel):
    rtspUrl:             str
    batch:               str
    detSize:             int   = 320
    frameSkip:           int   = 10
    targetImgsPerPerson: int   = 10
    minSamples:          int   = 3
    clusterThreshold:    float = 0.45


class RTSPAttendanceRequest(BaseModel):
    rtspUrl:          str
    rtspUrl2:         str   = ''
    batch:            str
    room:             str
    slot:             str
    date:             str
    durationSec:      int   = 60
    checkIntervalMin: int   = 5
    frameSkip:        int   = 10
    clusterThreshold: float = 0.45
    minSamples:       int   = 2
    autoThreshold:    float = 0.40
    reviewThreshold:  float = 0.20
    subject:          str   = ''
    faculty:          str   = ''
    semester:         str   = ''
    locksemId:        str   = ''
    enrolledRollNos:  list  = []


# ── Preview endpoint ──────────────────────────────────────────────────────────

@router.get("/rtsp-preview")
def rtsp_preview():
    def generate():
        try:
            while not _stop_event.is_set():
                with _preview_lock:
                    frame = _preview_frame
                if frame:
                    yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                    time.sleep(0.033)
                else:
                    time.sleep(0.05)
        except GeneratorExit:
            pass
    _stop_event.clear()
    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/stop-rtsp-stream")
def stop_rtsp_stream():
    _stop_event.set()
    return {"status": "stop_requested"}


# ── Ground Truth SSE acquisition endpoint ─────────────────────────────────────

@router.post("/extract-rtsp-stream")
def extract_rtsp_stream(req: RTSPRequest):
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")

    if req.detSize != state.current_det_size and state.load_model_fn:
        state.load_model_fn(det_size=req.detSize)

    def generate():
        def sse(obj):
            return f"data: {json.dumps(obj)}\n\n"
        print("🟢 GENERATOR STARTED", flush=True)
        _stop_event.clear()

        batch_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batch)
        os.makedirs(batch_dir, exist_ok=True)

        start = time.time()

        logger.info("─" * 60)
        logger.info("RTSP session starting")
        logger.info("  url        : %s", req.rtspUrl)
        logger.info("  batch      : %s", req.batch)
        logger.info("  frameSkip  : %s", req.frameSkip)
        logger.info("  detSize    : %s", req.detSize)
        logger.info("  target/person: %s  minSamples: %s  clusterThr: %s",
                    req.targetImgsPerPerson, req.minSamples, req.clusterThreshold)

        yield sse({"type": "stage", "message": f"Connecting to {req.rtspUrl}…"})

        cap = _open_capture(req.rtspUrl)
        if not cap.isOpened():
            logger.error("RTSP open FAILED: %s", req.rtspUrl)
            yield sse({"type": "error", "message": f"Cannot open RTSP stream: {req.rtspUrl}"})
            return

        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        H   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask = _build_ui_mask(H, W)

        logger.info("Stream open — %dx%d @ %.1f fps", W, H, fps)
        yield sse({"type": "stage",
                   "message": f"Stream open — {W}×{H} @ {fps:.1f}fps, skip every {req.frameSkip} frames"})

        all_embeddings  = []
        all_face_images = []
        all_timestamps  = []
        all_quality     = []

        CLUSTER_EVERY = max(req.minSamples * 5, 20)

        person_counts:      dict[str, int]        = {}
        existing_mean_embs: dict[str, np.ndarray] = {}
        _load_existing_folders(batch_dir, existing_mean_embs)

        existing_person_nums = [
            int(d.split("_")[1])
            for d in os.listdir(batch_dir)
            if re.match(r"^person_\d+$", d, re.IGNORECASE)
            and os.path.isdir(os.path.join(batch_dir, d))
        ]
        next_serial = (max(existing_person_nums) + 1) if existing_person_nums else 1

        frame_count      = 0
        detections_since = 0
        last_progress_t  = time.time()
        PROGRESS_EVERY   = 10
        reconnect_attempts = 0
        MAX_RECONNECTS     = 5

        _cluster_passes      = 0
        _last_person_count   = 0
        _last_new_person_t   = time.time()
        NEW_PERSON_TIMEOUT   = 60

        reader   = _RTSPReader(cap, decode_every=req.frameSkip)
        last_seq = 0

        cluster_pool   = ThreadPoolExecutor(max_workers=1)
        cluster_future = None

        try:
            while True:
                if _stop_event.is_set():
                    logger.info("Stop signal received")
                    yield sse({"type": "stage", "message": "Stop signal received — finishing up…"})
                    break

                ok, frame, seq, grab_n = reader.latest()

                if not ok:
                    reconnect_attempts += 1
                    logger.warning("Stream lost — reconnect attempt %d/%d", reconnect_attempts, MAX_RECONNECTS)
                    if reconnect_attempts > MAX_RECONNECTS:
                        yield sse({"type": "error", "message": "Stream reconnect failed — stopping"})
                        break
                    yield sse({"type": "stage",
                               "message": f"Stream dropped — reconnect attempt {reconnect_attempts}/{MAX_RECONNECTS}…"})
                    reader.release()
                    time.sleep(1)
                    new_cap = _open_capture(req.rtspUrl)
                    reader   = _RTSPReader(new_cap, decode_every=req.frameSkip)
                    last_seq = 0
                    if new_cap.isOpened():
                        reconnect_attempts = 0
                        yield sse({"type": "stage", "message": "Stream reconnected"})
                    continue

                if seq == last_seq or frame is None:
                    time.sleep(0.005)
                    continue

                last_seq           = seq
                reconnect_attempts = 0
                frame_count       += 1
                ts = round(time.time() - start, 2)

                try:
                    prev_raw = cv2.resize(frame, (960, 540))
                    _, raw_buf = cv2.imencode('.jpg', prev_raw, [cv2.IMWRITE_JPEG_QUALITY, 95])
                    with _preview_lock:
                        _preview_frame = raw_buf.tobytes()
                except Exception:
                    pass

                t_detect = time.time()
                try:
                    detections = _detect_faces_tiled(
                        state.face_app, frame, ui_mask,
                        preview_cb=_update_preview,
                    )
                except Exception as e:
                    print(f"🔴 DETECTION CRASHED frame={frame_count}: {type(e).__name__}: {e}", flush=True)
                    import traceback; traceback.print_exc()
                    detections = []

                detect_ms        = (time.time() - t_detect) * 1000
                faces_this_frame = len(detections)

                for d in detections:
                    all_embeddings.append(d["embedding"])
                    all_face_images.append(d["crop"])
                    all_timestamps.append(ts)
                    all_quality.append(d["quality"])
                    detections_since += 1

                yield sse({"type": "frame", "frame": frame_count, "faces_this_frame": faces_this_frame})
                yield sse({"type": "ping"})

                if cluster_future is not None and cluster_future.done():
                    try:
                        new_serial, updated, new_mean_embs, new_pcounts = cluster_future.result()
                        next_serial = new_serial
                        existing_mean_embs.update(new_mean_embs)
                        person_counts.update(new_pcounts)
                        _cluster_passes += 1
                        if len(person_counts) > _last_person_count:
                            _last_new_person_t = time.time()
                        _last_person_count = len(person_counts)
                        for person_id, new_count in updated.items():
                            done = new_count >= req.targetImgsPerPerson
                            yield sse({"type": "person_update", "person_id": person_id,
                                       "count": new_count, "target": req.targetImgsPerPerson, "done": done})
                    except Exception as exc:
                        logger.exception("Background clustering failed: %s", exc)
                    cluster_future = None

                if (cluster_future is None
                        and detections_since >= CLUSTER_EVERY
                        and len(all_embeddings) >= req.minSamples):
                    detections_since = 0
                    pass_num   = _cluster_passes + 1
                    embs_snap  = list(all_embeddings)
                    imgs_snap  = list(all_face_images)
                    ts_snap    = list(all_timestamps)
                    q_snap     = list(all_quality)
                    mean_snap  = {k: v.copy() for k, v in existing_mean_embs.items()}
                    pc_snap    = dict(person_counts)
                    serial_now = next_serial

                    def _cluster_job(embs, imgs, tss, qs, mean_embs, pcounts, serial, p):
                        t0 = time.time()
                        lbl, ulbl = _cluster(embs, req.clusterThreshold, req.minSamples)
                        logger.info("  pass #%d: DBSCAN %.0fms — %d clusters", p, (time.time()-t0)*1000, len(ulbl))
                        new_s, upd = _save_clusters(lbl, ulbl, embs, imgs, tss, qs,
                                                     batch_dir, mean_embs, serial,
                                                     req.targetImgsPerPerson, pcounts, req.clusterThreshold)
                        return new_s, upd, mean_embs, pcounts

                    cluster_future = cluster_pool.submit(
                        _cluster_job, embs_snap, imgs_snap, ts_snap, q_snap,
                        mean_snap, pc_snap, serial_now, pass_num)

                now = time.time()
                if now - last_progress_t >= PROGRESS_EVERY:
                    last_progress_t = now
                    n_persons = len(person_counts)
                    n_done = sum(1 for c in person_counts.values() if c >= req.targetImgsPerPerson)
                    yield sse({"type": "progress",
                               "message": f"Frame {frame_count} | {len(all_embeddings)} detections | {n_persons} people | {n_done}/{n_persons} done"})

                secs_since_new = time.time() - _last_new_person_t
                if (person_counts
                        and all(c >= req.targetImgsPerPerson for c in person_counts.values())
                        and secs_since_new >= NEW_PERSON_TIMEOUT):
                    yield sse({"type": "stage",
                               "message": f"All persons reached target — no new person for {int(secs_since_new)}s, stopping"})
                    break

        finally:
            reader.release()
            cluster_pool.shutdown(wait=False, cancel_futures=True)
            print("GENERATOR FINALLY BLOCK REACHED", flush=True)

        if len(all_embeddings) >= req.minSamples:
            yield sse({"type": "stage", "message": f"Saving {len(all_embeddings)} buffered detections…"})
            try:
                labels, unique_labels = _cluster(all_embeddings, req.clusterThreshold, req.minSamples)
                next_serial, updated = _save_clusters(
                    labels, unique_labels, all_embeddings, all_face_images,
                    all_timestamps, all_quality, batch_dir, existing_mean_embs,
                    next_serial, req.targetImgsPerPerson, person_counts, req.clusterThreshold)
                for person_id, new_count in updated.items():
                    yield sse({"type": "person_update", "person_id": person_id,
                               "count": new_count, "target": req.targetImgsPerPerson,
                               "done": new_count >= req.targetImgsPerPerson})
            except Exception as exc:
                logger.exception("Final clustering pass failed: %s", exc)

        images_saved = sum(person_counts.values())
        elapsed = round(time.time() - start, 2)
        yield sse({"type": "done", "people_detected": len(person_counts),
                   "images_saved": images_saved, "batch_dir": batch_dir,
                   "elapsed_sec": elapsed, "frames_read": frame_count,
                   "message": f"Done in {elapsed}s — {len(person_counts)} people, {images_saved} images, {frame_count} frames read"})

    return StreamingResponse(
        generate(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no",
                 "Content-Type": "text/event-stream; charset=utf-8"})


# ══════════════════════════════════════════════════════════════════════════════
# ATTENDANCE PIPELINE — shared generator (yields plain dicts, not SSE strings)
# Both the SSE route and the sync route consume this.
# ══════════════════════════════════════════════════════════════════════════════

def _attendance_pipeline(req: RTSPAttendanceRequest):
    """
    Core attendance logic as a regular (synchronous) generator.
    Yields plain dicts: {"type": "stage"|"frame"|"done"|"error", ...}
    No SSE wrapping here — callers decide how to use the events.
    """
    batch_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batch)
    logger.info("[attendance] batch_dir=%s", batch_dir)
    _stop_event.clear()

    if not os.path.isdir(batch_dir):
        yield {"type": "error", "message": f"Ground truth folder not found: {batch_dir}."}
        return

    yield {"type": "stage", "message": f"Loading ground truth for batch: {req.batch}…"}

    enrolled = {}
    IMG_EXTS_LOCAL = (".jpg", ".jpeg", ".png", ".webp")

    for folder in sorted(os.listdir(batch_dir)):
        fp = os.path.join(batch_dir, folder)
        if not os.path.isdir(fp):
            continue
        if re.match(r'^person_\d+$', folder, re.IGNORECASE):
            continue
        roll_no = folder
        info_path = os.path.join(fp, '_info.json')
        photos = []
        if os.path.exists(info_path):
            try:
                with open(info_path) as fi:
                    info = json.load(fi)
                photos = [f for f in info.get('embedding_files', [])
                          if os.path.exists(os.path.join(fp, f))]
            except Exception:
                photos = []
        if not photos:
            photos = [f for f in os.listdir(fp)
                      if f.lower().endswith(IMG_EXTS_LOCAL) and not f.startswith('_')]

        embs, emb_weights = [], []
        for photo in photos[:5]:
            img = cv2.imread(os.path.join(fp, photo))
            if img is None:
                continue
            faces = state.face_app.get(img)
            if not faces:
                continue
            face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
            fw, fh = face.bbox[2] - face.bbox[0], face.bbox[3] - face.bbox[1]
            if min(fw, fh) < 40:
                continue
            det_score = float(getattr(face, 'det_score', 1.0))
            if det_score < 0.5:
                continue
            emb = face.embedding
            norm = np.linalg.norm(emb)
            if norm == 0:
                continue
            x1, y1, x2, y2 = map(int, face.bbox)
            crop = img[max(0,y1):y2, max(0,x1):x2]
            quality = (det_score * min(float(cv2.Laplacian(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY),
                       cv2.CV_64F).var()), 500) / 500) if crop.size > 0 else det_score
            embs.append(emb / norm)
            emb_weights.append(max(quality, 0.01))

        if embs:
            weights = np.array(emb_weights, dtype=np.float32)
            weights /= weights.sum()
            mean_emb = np.average(np.array(embs, dtype=np.float32), axis=0, weights=weights)
            norm = np.linalg.norm(mean_emb)
            if norm > 0:
                enrolled[roll_no] = mean_emb / norm

    if not enrolled:
        yield {"type": "error", "message": f"No enrolled students found in '{batch_dir}'."}
        return

    # Sir's list filter
    sir_list = [r.strip().upper() for r in req.enrolledRollNos if r.strip()]
    has_sir_list = len(sir_list) > 0
    if has_sir_list:
        enrolled_in_list     = {k: v for k, v in enrolled.items() if k.upper() in sir_list}
        enrolled_not_in_list = {k: v for k, v in enrolled.items() if k.upper() not in sir_list}
        missing_from_gt      = [r for r in sir_list if r not in {k.upper() for k in enrolled}]
        if missing_from_gt:
            yield {"type": "stage", "message": f"⚠️ {len(missing_from_gt)} roll nos have no ground truth photos"}
        yield {"type": "stage", "message": f"{len(enrolled_in_list)} in list, {len(enrolled_not_in_list)} others flagged if detected"}
    else:
        enrolled_in_list     = enrolled
        enrolled_not_in_list = {}
        yield {"type": "stage", "message": f"{len(enrolled)} students loaded — connecting…"}

    # Open RTSP
    cap = _open_capture(req.rtspUrl)
    if not cap.isOpened():
        yield {"type": "error", "message": f"Cannot open RTSP stream: {req.rtspUrl}"}
        return

    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    scale = min(1.0, 1080 / H) if H > 1080 else 1.0
    disp_H, disp_W = int(H * scale), int(W * scale)
    ui_mask = _build_ui_mask(disp_H, disp_W)

    yield {"type": "stage", "message": f"Stream open {W}×{H} — recording {req.durationSec}s…"}

    all_embeddings, all_face_images, all_timestamps, all_quality = [], [], [], []
    CAMERA_SWITCH_SEC = 30
    cameras = [req.rtspUrl]
    if req.rtspUrl2:
        cameras.append(req.rtspUrl2)
    frame_snapshots = []

    DEBUG_CROP_DIR = os.path.join(BASE_DIR, "attendance-debug-crops", f"{req.date}_{req.slot}")
    os.makedirs(DEBUG_CROP_DIR, exist_ok=True)
    crop_counter = 0
    logger.info("[attendance] Debug crops → %s", DEBUG_CROP_DIR)
    yield {"type": "stage", "message": f"Debug crops → attendance-debug-crops/{req.date}_{req.slot}/"}

    start_t = time.time()
    frame_count, cam_idx, last_switch = 0, 0, 0.0
    SNAPSHOT_INTERVAL_SEC = 5
    last_snapshot_elapsed = -999.0
    reader  = _RTSPReader(cap, decode_every=req.frameSkip)
    last_seq = 0

    try:
        while True:
            elapsed = time.time() - start_t
            if elapsed >= req.durationSec:
                break

            if len(cameras) > 1 and (elapsed - last_switch) >= CAMERA_SWITCH_SEC:
                reader.release()
                cam_idx = (cam_idx + 1) % len(cameras)
                new_cap = _open_capture(cameras[cam_idx])
                reader  = _RTSPReader(new_cap, decode_every=req.frameSkip)
                last_seq = 0
                last_switch = elapsed
                last_snapshot_elapsed = -999.0
                yield {"type": "stage", "message": f"Switched to camera {cam_idx+1} at {round(elapsed)}s"}

            ok, frame, seq, _ = reader.latest()
            if not ok or frame is None or seq == last_seq:
                time.sleep(0.01)
                continue

            last_seq = seq
            frame_count += 1

            if scale < 1.0:
                frame = cv2.resize(frame, (disp_W, disp_H), interpolation=cv2.INTER_AREA)

            # MJPEG preview
            try:
                prev = cv2.resize(frame, (960, 540)) if frame.shape[1] > 960 else frame.copy()
                _, prev_buf = cv2.imencode('.jpg', prev, [cv2.IMWRITE_JPEG_QUALITY, 70])
                with _preview_lock:
                    _preview_frame = prev_buf.tobytes()
            except Exception:
                pass

            detections = _detect_faces_tiled(
                state.face_app, frame, ui_mask,
                debug_dir=DEBUG_CROP_DIR,
                debug_frame_id=frame_count,
            )
            faces_this_frame = len(detections)

            for d in detections:
                all_embeddings.append(d["embedding"])
                all_face_images.append(d["crop"])
                all_timestamps.append(round(elapsed, 2))
                all_quality.append(d["quality"])
                crop_counter += 1

            # Annotated full frame
            if faces_this_frame > 0:
                try:
                    ann = frame.copy()
                    for d in detections:
                        bx1, by1, bx2, by2 = d["bbox"]
                        cv2.rectangle(ann, (bx1, by1), (bx2, by2), (0, 255, 0), 2)
                        cv2.putText(ann, f"q={d['quality']:.1f}", (bx1, by1 - 5),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                    ann_dir = os.path.join(DEBUG_CROP_DIR, "annotated_frames")
                    os.makedirs(ann_dir, exist_ok=True)
                    cv2.imwrite(
                        os.path.join(ann_dir, f"fr{frame_count:04d}_cam{cam_idx+1}_{faces_this_frame}faces.jpg"),
                        ann, [cv2.IMWRITE_JPEG_QUALITY, 85])
                except Exception:
                    pass

            # Frame snapshot every N seconds
            if faces_this_frame > 0 and (elapsed - last_snapshot_elapsed) >= SNAPSHOT_INTERVAL_SEC:
                _, jpeg_buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                frame_snapshots.append({
                    "cam_idx":     cam_idx,
                    "cam_url":     cameras[cam_idx],
                    "elapsed_sec": round(elapsed, 1),
                    "faces_count": faces_this_frame,
                    "jpeg_bytes":  jpeg_buf.tobytes(),
                })
                last_snapshot_elapsed = elapsed

            yield {"type": "frame", "frame": frame_count, "faces": faces_this_frame,
                   "total_embs": len(all_embeddings), "elapsed": round(elapsed, 1),
                   "remaining": round(req.durationSec - elapsed, 1), "camera": cam_idx + 1}
    finally:
        reader.release()
        _stop_event.set()

    # Save frame snapshots to disk (strip jpeg_bytes before returning paths)
    SNAPSHOT_DIR = os.path.join(BASE_DIR, "frame-snapshots")
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    saved_snapshot_paths = []
    for snap in frame_snapshots:
        fname = (f"{req.date}_{req.slot}_cam{snap['cam_idx']+1}"
                 f"_{int(snap['elapsed_sec'])}s_{snap['faces_count']}faces.jpg")
        fpath = os.path.join(SNAPSHOT_DIR, fname)
        with open(fpath, 'wb') as f:
            f.write(snap["jpeg_bytes"])
        # Only plain JSON-serialisable types here
        saved_snapshot_paths.append({
            "path":        str(fpath),
            "cam":         int(snap["cam_idx"] + 1),
            "elapsed_sec": float(snap["elapsed_sec"]),
            "faces_count": int(snap["faces_count"]),
        })

    yield {"type": "stage",
           "message": (f"📁 {crop_counter} accepted crops | {len(saved_snapshot_paths)} snapshots"
                       f" | Check attendance-debug-crops/{req.date}_{req.slot}/")}

    if not all_embeddings:
        yield {"type": "error",
               "message": "No faces detected. Check attendance-debug-crops/raw/ and /rejected/ for diagnostics."}
        return

    yield {"type": "stage", "message": f"{len(all_embeddings)} embeddings — clustering…"}

    labels, unique_labels = _cluster(all_embeddings, req.clusterThreshold, req.minSamples)
    yield {"type": "stage", "message": f"{len(unique_labels)} clusters — matching {len(enrolled)} enrolled…"}

    match_enrolled = enrolled_in_list if has_sir_list else enrolled
    enrolled_ids   = list(match_enrolled.keys())
    enroll_matrix  = (np.array([match_enrolled[r] for r in enrolled_ids], dtype=np.float32)
                      if enrolled_ids else np.array([]))

    attendance = {
        roll_no: {
            "status": "absent", "avg_confidence": 0.0, "confidence_zone": "low",
            "first_seen_sec": None, "detections": 0, "in_list": True, "flagged": False,
        }
        for roll_no in enrolled_ids
    }
    if has_sir_list:
        for roll_no in sir_list:
            if roll_no not in {k.upper() for k in attendance}:
                # 'no_photo' is not a valid Mongoose enum value — use 'absent'
                # (students with no ground truth cannot be matched, so absent is correct)
                attendance[roll_no] = {
                    "status": "absent", "avg_confidence": 0.0, "confidence_zone": "low",
                    "first_seen_sec": None, "detections": 0, "in_list": True, "flagged": False,
                }

    for cluster_id in unique_labels:
        indices      = np.where(labels == cluster_id)[0]
        cluster_embs = np.array([all_embeddings[i] for i in indices], dtype=np.float32)
        cluster_mean = cluster_embs.mean(axis=0)
        norm = np.linalg.norm(cluster_mean)
        if norm == 0:
            continue
        cluster_mean /= norm
        scores   = enroll_matrix @ cluster_mean
        best_idx = int(np.argmax(scores))
        score    = float(scores[best_idx])

        if score >= req.reviewThreshold:
            roll_no = enrolled_ids[best_idx]
            rec     = attendance[roll_no]
            status  = "present" if score >= req.autoThreshold else "review"
            zone    = "high"    if score >= req.autoThreshold else "medium"
            n       = len(indices)
            prev_n, prev_avg = rec["detections"], rec["avg_confidence"]
            new_avg = ((prev_avg * prev_n) + (score * n)) / (prev_n + n)
            if rec["status"] == "absent" or (rec["status"] == "review" and status == "present"):
                rec["status"], rec["confidence_zone"] = status, zone
            rec["avg_confidence"] = round(new_avg, 4)
            rec["detections"]     = prev_n + n
            if rec["first_seen_sec"] is None:
                rec["first_seen_sec"] = round(float(all_timestamps[indices[0]]), 1)

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    review  = sum(1 for v in attendance.values() if v["status"] == "review")
    absent  = sum(1 for v in attendance.values() if v["status"] == "absent")

    # Unmatched clusters
    unmatched_clusters = []
    for cluster_id in unique_labels:
        indices      = np.where(labels == cluster_id)[0]
        cluster_mean = np.array([all_embeddings[i] for i in indices], dtype=np.float32).mean(axis=0)
        norm = np.linalg.norm(cluster_mean)
        if norm == 0:
            continue
        cluster_mean /= norm
        score = float(np.max(enroll_matrix @ cluster_mean))
        if score < req.reviewThreshold:
            unmatched_clusters.append({
                "cluster_id": int(cluster_id),
                "detections": int(len(indices)),
                "best_score": round(score, 4),
                "first_seen": round(float(all_timestamps[indices[0]]), 1),
            })

    # Flag not-in-list
    if has_sir_list and enrolled_not_in_list:
        not_in_list_ids    = list(enrolled_not_in_list.keys())
        not_in_list_matrix = np.array([enrolled_not_in_list[r] for r in not_in_list_ids], dtype=np.float32)
        for cluster_id in unique_labels:
            indices      = np.where(labels == cluster_id)[0]
            cluster_mean = np.array([all_embeddings[i] for i in indices], dtype=np.float32).mean(axis=0)
            norm = np.linalg.norm(cluster_mean)
            if norm == 0:
                continue
            cluster_mean /= norm
            scores   = not_in_list_matrix @ cluster_mean
            best_idx = int(np.argmax(scores))
            score    = float(scores[best_idx])
            if score >= req.autoThreshold:
                flagged_roll = not_in_list_ids[best_idx]
                attendance[flagged_roll] = {
                    "status":          "present",
                    "avg_confidence":  round(score, 4),
                    "confidence_zone": "high",
                    "first_seen_sec":  round(float(all_timestamps[indices[0]]), 1),
                    "detections":      int(len(indices)),
                    "in_list":         False,
                    "flagged":         True,
                }

    # Save per-cluster matched crops
    MATCH_CROP_DIR = os.path.join(BASE_DIR, "attendance-matched-crops", f"{req.date}_{req.slot}")
    os.makedirs(MATCH_CROP_DIR, exist_ok=True)

    for cluster_id in unique_labels:
        indices      = np.where(labels == cluster_id)[0]
        cluster_mean = np.array([all_embeddings[i] for i in indices], dtype=np.float32).mean(axis=0)
        norm = np.linalg.norm(cluster_mean)
        if norm == 0:
            continue
        cluster_mean /= norm
        if len(enroll_matrix) > 0:
            scores       = enroll_matrix @ cluster_mean
            best_idx     = int(np.argmax(scores))
            score        = float(scores[best_idx])
            matched_roll = enrolled_ids[best_idx] if score >= req.reviewThreshold else "UNMATCHED"
        else:
            matched_roll, score = "UNMATCHED", 0.0

        folder_name      = f"{matched_roll}_c{cluster_id:03d}_s{score:.3f}"
        cluster_crop_dir = os.path.join(MATCH_CROP_DIR, folder_name)
        os.makedirs(cluster_crop_dir, exist_ok=True)
        sorted_indices = sorted(indices, key=lambda i: all_quality[i], reverse=True)
        for rank, idx in enumerate(sorted_indices):
            crop = all_face_images[idx]
            if crop is not None and crop.size > 0:
                fname = f"rank{rank:02d}_t{all_timestamps[idx]:.1f}s_q{all_quality[idx]:.2f}.jpg"
                cv2.imwrite(os.path.join(cluster_crop_dir, fname), crop, [cv2.IMWRITE_JPEG_QUALITY, 95])

    logger.info("[attendance] Matched crops → %s", MATCH_CROP_DIR)
    yield {"type": "stage", "message": f"✅ {len(unique_labels)} cluster folders saved for verification"}

    # Final result event
    yield {
        "type": "done",
        "result": {
            "attendance": attendance,
            "metadata": {
                "batch":     req.batch,
                "subject":   req.subject,
                "faculty":   req.faculty,
                "sem":       req.semester,
                "locksemId": req.locksemId,
                "dept":      req.batch.split("_")[1] if "_" in req.batch else "",
            },
            "summary": {
                "total_faces_extracted": int(len(all_embeddings)),
                "unique_clusters_found": int(len(unique_labels)),
                "total_enrolled":        int(len(enrolled)),
                "present":               int(present),
                "review":                int(review),
                "absent":                int(absent),
                "unmatched_faces":       int(len(unmatched_clusters)),
                "flagged_faces":         int(sum(1 for v in attendance.values() if v.get("flagged"))),
                "processing_time":       round(time.time() - start_t, 2),
                "frames_read":           int(frame_count),
                "duration_sec":          int(req.durationSec),
                "debug_crops_saved":     int(crop_counter),
                "debug_crops_dir":       str(DEBUG_CROP_DIR),
                "matched_crops_dir":     str(MATCH_CROP_DIR),
            },
            "unmatched_clusters": unmatched_clusters,
            "frame_snapshots":    saved_snapshot_paths,
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# ATTENDANCE ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/run-attendance-rtsp")
def run_attendance_rtsp(req: RTSPAttendanceRequest):
    """SSE streaming endpoint — used by the frontend live view."""
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")

    def generate():
        def sse(obj):
            return f"data: {json.dumps(obj)}\n\n"
        for event in _attendance_pipeline(req):
            yield sse(event)

    return StreamingResponse(
        generate(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no",
                 "Content-Type": "text/event-stream; charset=utf-8"})


@router.post("/run-attendance-rtsp-sync")
def run_attendance_rtsp_sync(req: RTSPAttendanceRequest):
    """
    Synchronous JSON endpoint — called by attendanceSessionController.js
    (Node.js) via axios.post().  Blocks until done, returns plain JSON.
    """
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")

    result_payload = None
    error_message  = None
    stages         = []

    for event in _attendance_pipeline(req):
        t = event.get("type")
        if t == "done":
            result_payload = event.get("result")
        elif t == "error":
            error_message = event.get("message")
        elif t == "stage":
            stages.append(event.get("message", ""))
        # "frame" events are dropped — too verbose for a sync response

    if error_message:
        raise HTTPException(status_code=422, detail=error_message)
    if result_payload is None:
        raise HTTPException(status_code=500, detail="Pipeline finished without a result")

    return JSONResponse(content={**result_payload, "stages": stages})


# ── Preview helper ────────────────────────────────────────────────────────────

class PreviewRequest(BaseModel):
    rtspUrl: str

@router.post("/start-preview")
def start_preview(req: PreviewRequest):
    global _preview_frame
    _stop_event.clear()
    placeholder = np.zeros((540, 960, 3), dtype=np.uint8)
    cv2.putText(placeholder, "Connecting to stream...", (300, 270),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (80, 80, 80), 2, cv2.LINE_AA)
    _, buf = cv2.imencode('.jpg', placeholder, [cv2.IMWRITE_JPEG_QUALITY, 70])
    with _preview_lock:
        _preview_frame = buf.tobytes()
    return {"status": "ok"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cluster(embeddings, threshold, min_samples):
    eps = float(np.sqrt(2.0 * (1.0 - threshold)))
    clustering = _DBSCAN(eps=eps, min_samples=min_samples,
                          metric="euclidean", algorithm="ball_tree", n_jobs=-1).fit(np.array(embeddings))
    labels        = clustering.labels_
    unique_labels = sorted(set(labels) - {-1})
    return labels, unique_labels


def _load_existing_folders(batch_dir, existing_mean_embs):
    for folder_name in os.listdir(batch_dir):
        fp = os.path.join(batch_dir, folder_name)
        if not os.path.isdir(fp) or folder_name.startswith("_"):
            continue
        imgs = [f for f in os.listdir(fp) if f.lower().endswith(IMG_EXTS)]
        if not imgs:
            continue
        info_p = os.path.join(fp, "_info.json")
        if os.path.exists(info_p):
            try:
                with open(info_p) as fi:
                    info = json.load(fi)
                ef = [f for f in info.get("embedding_files", []) if f in imgs]
                if ef:
                    imgs = ef
            except Exception:
                pass
        folder_embs, folder_weights = [], []
        for img_f in imgs[:5]:
            img = cv2.imread(os.path.join(fp, img_f))
            if img is None:
                continue
            faces = state.face_app.get(img)
            if not faces:
                continue
            face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
            det_score = float(getattr(face, 'det_score', 1.0))
            if det_score < 0.5:
                continue
            emb  = face.embedding
            norm = np.linalg.norm(emb)
            if norm == 0:
                continue
            x1, y1, x2, y2 = map(int, face.bbox)
            crop = img[max(0,y1):y2, max(0,x1):x2]
            if crop.size > 0:
                gray    = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
                lap     = float(cv2.Laplacian(gray, cv2.CV_64F).var())
                quality = det_score * min(lap, 500) / 500
            else:
                quality = det_score
            folder_embs.append(emb / norm)
            folder_weights.append(max(quality, 0.01))
        if folder_embs:
            weights  = np.array(folder_weights, dtype=np.float32)
            weights /= weights.sum()
            mean_emb = np.average(np.array(folder_embs, dtype=np.float32), axis=0, weights=weights)
            norm     = np.linalg.norm(mean_emb)
            if norm > 0:
                existing_mean_embs[folder_name] = mean_emb / norm


def _save_clusters(labels, unique_labels, all_embeddings, all_face_images,
                    all_timestamps, all_quality, batch_dir, existing_mean_embs,
                    next_serial, target_per_person, person_counts,
                    cluster_threshold, top_n=10, embed_n=5):
    updated = {}
    MATCH_THRESHOLD = max(cluster_threshold, 0.50)

    for cluster_id in unique_labels:
        indices      = np.where(labels == cluster_id)[0]
        cluster_embs = np.array([all_embeddings[i] for i in indices])
        cluster_mean = cluster_embs.mean(axis=0)
        norm = np.linalg.norm(cluster_mean)
        if norm == 0:
            continue
        cluster_mean /= norm

        best_folder, best_score = None, 0.0
        for fname, ex_emb in existing_mean_embs.items():
            score = float(np.dot(cluster_mean, ex_emb))
            if score > best_score:
                best_score, best_folder = score, fname

        if best_folder and best_score >= MATCH_THRESHOLD:
            folder_name = best_folder
            folder_path = os.path.join(batch_dir, folder_name)
        else:
            folder_name = f"person_{next_serial:03d}"
            next_serial += 1
            folder_path = os.path.join(batch_dir, folder_name)
            os.makedirs(folder_path, exist_ok=True)

        existing_mean_embs[folder_name] = cluster_mean
        current_count = person_counts.get(folder_name, 0)
        if current_count >= target_per_person:
            continue

        still_need     = target_per_person - current_count
        cluster_sorted = sorted(
            [(all_face_images[i], all_quality[i], all_timestamps[i], i) for i in indices],
            key=lambda x: x[1], reverse=True)[:still_need]

        saved, scores = 0, {}
        for (crop, quality, ts, idx) in cluster_sorted:
            if crop.size == 0:
                continue
            fname = f"gt_{ts:.1f}s_f{idx}.jpg"
            fpath = os.path.join(folder_path, fname)
            if not os.path.exists(fpath):
                cv2.imwrite(fpath, crop, [cv2.IMWRITE_JPEG_QUALITY, 100])
                saved += 1
            scores[fname] = round(quality, 4)

        if saved == 0:
            continue
        _update_info(folder_path, scores, top_n, embed_n)
        new_count = _count_images(folder_path)
        person_counts[folder_name] = new_count
        updated[folder_name]       = new_count

    return next_serial, updated


def _count_images(folder_path):
    return sum(1 for f in os.listdir(folder_path) if f.lower().endswith(IMG_EXTS))


def _update_info(folder_path, new_scores, top_n, embed_n):
    info_path = os.path.join(folder_path, "_info.json")
    info = {"embedding_files": [], "backup_files": [], "scores": {}}
    if os.path.exists(info_path):
        try:
            with open(info_path) as fi:
                info = json.load(fi)
        except Exception:
            pass

    info["scores"].update(new_scores)
    all_imgs = [f for f in os.listdir(folder_path) if f.lower().endswith(IMG_EXTS)]
    for f in all_imgs:
        if f not in info["scores"]:
            img = cv2.imread(os.path.join(folder_path, f))
            if img is not None:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                lap  = float(cv2.Laplacian(gray, cv2.CV_64F).var())
                h, w = img.shape[:2]
                info["scores"][f] = round((w*h)**0.5 * min(lap, 500) / 500, 4)
            else:
                info["scores"][f] = 0.5

    scored = sorted(
        [(f, info["scores"].get(f, 0)) for f in all_imgs if f in info["scores"]],
        key=lambda x: x[1], reverse=True)
    if len(scored) > top_n:
        for (fn, _) in scored[top_n:]:
            try:
                os.remove(os.path.join(folder_path, fn))
                info["scores"].pop(fn, None)
            except Exception:
                pass
        scored = scored[:top_n]

    info["embedding_files"] = [f for (f, _) in scored[:embed_n]]
    info["backup_files"]    = [f for (f, _) in scored[embed_n:]]
    with open(info_path, "w") as fi:
        json.dump(info, fi, indent=2)
