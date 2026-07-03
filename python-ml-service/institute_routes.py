# institute_gate_routes.py
import time
import json
import base64
import logging
import os
import tempfile
import cv2
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse

import state
from clustering_service import _detect_faces_tiled, _build_ui_mask
from faiss_utils import (
    _recognize_face,
    _iou,
    _centroid,
    _centroid_drift,
    _get_reverify_interval,
)

logger = logging.getLogger("ml_service.institute_gate_routes")
router = APIRouter()

try:
    from deep_sort_realtime.deepsort_tracker import DeepSort
    _DEEPSORT_AVAILABLE = True
except ImportError:
    _DEEPSORT_AVAILABLE = False
    logger.warning("deep-sort-realtime not installed.")

def _tracked_video_pipeline(video_path: str):
    """
    Processes an uploaded video for institute gate identification.
    Yields SSE events with recognized students and marked frames.
    """
    if not _DEEPSORT_AVAILABLE:
        yield f"data: {json.dumps({'type': 'error', 'message': 'deep-sort-realtime not installed'})}\n\n"
        return

    if state.faiss_index is None:
        yield f"data: {json.dumps({'type': 'error', 'message': 'No FAISS index loaded'})}\n\n"
        return

    total_students = len(set(state.vid_to_roll.values()))
    yield f"data: {json.dumps({'type': 'stage', 'message': f'Processing video against index ({total_students} students)'})}\n\n"

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        yield f"data: {json.dumps({'type': 'error', 'message': 'Cannot open video file'})}\n\n"
        return

    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    scale = min(1.0, 480 / H) if H > 480 else 1.0
    disp_H = int(H * scale)
    disp_W = int(W * scale)
    ui_mask = _build_ui_mask(disp_H, disp_W)

    tracker = DeepSort(max_age=20, n_init=3, nms_max_overlap=0.5, embedder=None)
    track_memory = {}
    marked = {}

    frame_count = 0
    start_t = time.time()
    
    # Configuration params 
    driftThresholdPx = 30
    iouMin = 0.3
    recogThreshold = 0.4
    trackExpirySec = 5.0

    try:
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                
                # Simulate real-time playback (prevent flooding frontend)
                time.sleep(0.03)
                
                frame_count += 1
                now = time.time()

                if scale < 1.0:
                    frame = cv2.resize(frame, (disp_W, disp_H), interpolation=cv2.INTER_AREA)

                # Only run heavy detection every 3rd frame
                if frame_count % 3 == 0:
                    # Prune stale per-track identity cache
                    stale = [uid for uid, m in track_memory.items()
                             if now - m["last_update"] > trackExpirySec]
                    for uid in stale:
                        del track_memory[uid]

                    with state.face_lock:
                        faces = state.face_app.get(frame)

                    detections = []
                    if faces:
                        for face in faces:
                            x1, y1, x2, y2 = map(int, face.bbox)
                            crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
                            if crop.size > 0:
                                detections.append({
                                    "bbox": [x1, y1, x2, y2],
                                    "det_score": float(face.det_score),
                                    "embedding": face.embedding,
                                    "crop": crop
                                })
                                
                    ds_input = [
                        ([d["bbox"][0], d["bbox"][1],
                          d["bbox"][2] - d["bbox"][0], d["bbox"][3] - d["bbox"][1]],
                         float(d["det_score"]), "person")
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
                        uid = str(track.track_id)
                        cx, cy = _centroid(l, t, r, b)

                        mem = track_memory.get(uid)
                        if mem is not None:
                            drift = _centroid_drift((cx, cy), mem["last_centroid"])
                            age = now - mem["last_update"]
                            if drift < driftThresholdPx and age < mem["ttl"]:
                                mem["last_centroid"] = (cx, cy)
                                continue

                        best_d, best_iou_val = None, 0.0
                        for d in detections:
                            val = _iou([l, t, r, b], d["bbox"])
                            if val > best_iou_val:
                                best_iou_val, best_d = val, d

                        if best_d is None or best_iou_val < iouMin:
                            continue

                        roll, score = _recognize_face(
                            best_d["embedding"], state.faiss_index, state.vid_to_roll,
                            top_k=5, threshold=recogThreshold,
                        )

                        w, h = r - l, b - t
                        ttl = _get_reverify_interval(score) if roll else 0.0
                        track_memory[uid] = {
                            "roll": roll, "score": score, "ttl": ttl,
                            "last_update": now, "last_centroid": (cx, cy),
                            "size": (w, h)
                        }

                        if roll:
                            if roll not in marked:
                                marked[roll] = {
                                    "time": time.strftime("%Y-%m-%d %H:%M:%S"),
                                    "score": round(score, 4)
                                }
                                ok_crop, crop_buf = cv2.imencode(
                                    ".jpg", best_d["crop"], [cv2.IMWRITE_JPEG_QUALITY, 90])
                                event_data = {
                                    "type": "marked",
                                    "roll": roll,
                                    "score": round(score, 4),
                                    "time": marked[roll]["time"],
                                    "evidence": base64.b64encode(crop_buf.tobytes()).decode("ascii") if ok_crop else None
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"

                # Always draw the tracks on the current frame, even if we skipped detection!
                for uid, m in track_memory.items():
                    if now - m["last_update"] < trackExpirySec:
                        cx, cy = m["last_centroid"]
                        w, h = m.get("size", (80, 80))
                        
                        l, t = int(cx - w/2), int(cy - h/2)
                        r, b = int(cx + w/2), int(cy + h/2)
                        
                        color = (0, 255, 0) if m["roll"] else (0, 0, 255)
                        label = f"{m['roll']} ({m['score']:.2f})" if m["roll"] else f"? ({m['score']:.2f})"
                        cv2.rectangle(frame, (l, t), (r, b), color, 2)
                        cv2.putText(frame, label, (l, max(0, t - 10)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                    # End of tracking loop

                # Send preview frame
                try:
                    prev = cv2.resize(frame, (960, 540)) if frame.shape[1] > 960 else frame
                    _, buf = cv2.imencode(".jpg", prev, [cv2.IMWRITE_JPEG_QUALITY, 50]) # Lower quality for faster transmission
                    frame_b64 = base64.b64encode(buf.tobytes()).decode('ascii')
                    
                    yield f"data: {json.dumps({'type': 'frame_image', 'image': frame_b64, 'marked_count': len(marked)})}\n\n"
                except Exception:
                    logger.exception("Failed to encode preview frame")
        except Exception as e:
            logger.exception("Pipeline crashed")
            yield f"data: {json.dumps({'type': 'error', 'message': f'Pipeline crashed: {str(e)}'})}\n\n"

    finally:
        cap.release()
        try:
            os.remove(video_path) # Cleanup temp file
        except OSError:
            pass

    result_data = {
        "type": "done",
        "result": {
            "marked": marked,
            "summary": {
                "total_marked": len(marked),
                "frames_processed": frame_count,
                "duration_sec": round(time.time() - start_t, 1),
            },
        },
    }
    yield f"data: {json.dumps(result_data)}\n\n"

@router.post("/institute-gate-identify-video")
async def institute_gate_identify_video(file: UploadFile = File(...)):
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")
    if not _DEEPSORT_AVAILABLE:
        raise HTTPException(status_code=503, detail="deep-sort-realtime not installed")

    # Save uploaded file to temp path
    fd, temp_path = tempfile.mkstemp(suffix=".mp4")
    with os.fdopen(fd, 'wb') as f:
        f.write(await file.read())
    
    return StreamingResponse(
        _tracked_video_pipeline(temp_path),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )
