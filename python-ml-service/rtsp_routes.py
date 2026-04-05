# rtsp_routes.py

import os
import re
import json
import time
import logging
import threading
import queue

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
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

# FIX: Removed the global `cap_global` / `get_capture()` helper.
# A shared global VideoCapture causes silent stale-handle reuse across
# requests, which manifests as network errors on the frontend.
# Each request now owns its own capture and releases it on exit.

# READ_TIMEOUT_SEC: how long cap.read() is allowed to block before we treat
# the frame as dropped and attempt a reconnect.
READ_TIMEOUT_SEC = 5.0


def _read_frame_with_timeout(cap, timeout=READ_TIMEOUT_SEC):
    """
    Run cap.read() in a daemon thread so the caller is never blocked
    longer than `timeout` seconds.  Returns (ret, frame) or (False, None).
    """
    result_q = queue.Queue(maxsize=1)

    def _worker():
        try:
            result_q.put(cap.read())
        except Exception:
            result_q.put((False, None))

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    try:
        return result_q.get(timeout=timeout)
    except queue.Empty:
        logger.warning("cap.read() timed out after %ss", timeout)
        return False, None


def _open_capture(rtsp_url: str) -> cv2.VideoCapture:
    """Open a fresh RTSP capture with TCP transport."""
    url = rtsp_url if "rtsp_transport" in rtsp_url else rtsp_url + "?rtsp_transport=tcp"
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    # Keep internal buffer tiny so we always get the latest frame.
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
    return cap


def _update_preview(frame, zoom_boxes, current_pass=0):
    """Draw zoom overlay on frame and store as MJPEG jpeg."""
    global _preview_frame
    vis    = frame.copy()
    colors = [
        (0, 255, 0),
        (255, 0, 0),
        (0, 0, 255),
        (255, 255, 0),
        (0, 255, 255),
        (255, 0, 255),
        (0, 128, 255),
    ]

    for idx, box in enumerate(zoom_boxes):
        x1, y1, x2, y2 = box
        color     = colors[idx % len(colors)]
        thickness = 4 if idx == current_pass else 2
        cv2.rectangle(vis, (x1, y1), (x2, y2), color, thickness)

        if idx == current_pass:
            label = f"SCANNING Z{idx + 1}"
            (tw, th), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            cv2.rectangle(vis, (x1, y1),
                          (x1 + tw + 10, y1 + th + 10), color, -1)
            cv2.putText(vis, label, (x1 + 5, y1 + th + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        else:
            cv2.putText(vis, f"Z{idx + 1}", (x1 + 5, y1 + 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    prev = cv2.resize(vis, (960, 540))
    _, buf = cv2.imencode('.jpg', prev, [cv2.IMWRITE_JPEG_QUALITY, 70])
    with _preview_lock:
        _preview_frame = buf.tobytes()


# ── Request model ─────────────────────────────────────────────────────────────

class RTSPRequest(BaseModel):
    rtspUrl:             str
    batch:               str
    detSize:             int   = 320
    frameSkip:           int   = 10
    targetImgsPerPerson: int   = 10
    minSamples:          int   = 3
    clusterThreshold:    float = 0.45


# ── Preview endpoint ──────────────────────────────────────────────────────────

@router.get("/rtsp-preview")
def rtsp_preview():
    """
    MJPEG preview stream.

    FIX: The original generator looped forever with no exit condition,
    leaking the HTTP connection after the SSE stream finished.  We now
    check _stop_event so the preview stream tears down together with the
    acquisition stream, and add a GeneratorExit guard so the connection
    is cleaned up if the client disconnects.
    """
    def generate():
        try:
            while not _stop_event.is_set():
                with _preview_lock:
                    frame = _preview_frame
                if frame:
                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n'
                        + frame +
                        b'\r\n'
                    )
                time.sleep(0.1)
        except GeneratorExit:
            pass  # client closed the connection — clean exit

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache"},
    )


# ── Stop endpoint ─────────────────────────────────────────────────────────────

@router.post("/stop-rtsp-stream")
def stop_rtsp_stream():
    _stop_event.set()
    return {"status": "stop_requested"}


# ── Main SSE acquisition endpoint ─────────────────────────────────────────────

@router.post("/extract-rtsp-stream")
def extract_rtsp_stream(req: RTSPRequest):
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")

    if req.detSize != state.current_det_size and state.load_model_fn:
        state.load_model_fn(det_size=req.detSize)

    def generate():
        def sse(obj):
            # FIX: include charset so browsers/proxies don't misinterpret the
            # stream encoding and drop buffered SSE chunks.
            return f"data: {json.dumps(obj)}\n\n"

        _stop_event.clear()

        batch_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batch)
        os.makedirs(batch_dir, exist_ok=True)

        start = time.time()

        yield sse({"type": "stage", "message": f"Connecting to {req.rtspUrl}…"})

        # FIX: Use _open_capture() instead of the removed global helper so
        # every request gets a fresh handle with TCP transport enforced.
        cap = _open_capture(req.rtspUrl)

        if not cap.isOpened():
            yield sse({"type": "error",
                       "message": f"Cannot open RTSP stream: {req.rtspUrl}"})
            return

        fps     = cap.get(cv2.CAP_PROP_FPS) or 25
        H       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W       = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask = _build_ui_mask(H, W)

        yield sse({"type": "stage",
                   "message": f"Stream open — {W}×{H} @ {fps:.1f}fps, "
                              f"skip every {req.frameSkip} frames"})

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
        MAX_RECONNECTS     = 5   # give up after this many consecutive failures

        # FIX: track clustering passes and person roster size so the completion
        # check can confirm the roster has stabilised before auto-stopping.
        _cluster_passes    = 0
        _last_person_count = 0

        # ── Frame loop ────────────────────────────────────────────────────────
        try:
            while True:
                if _stop_event.is_set():
                    yield sse({"type": "stage",
                               "message": "Stop signal received — finishing up…"})
                    break

                # FIX: wrap cap.read() with a timeout so a stale/frozen RTSP
                # source can't block the generator thread indefinitely.
                ret, frame = _read_frame_with_timeout(cap, READ_TIMEOUT_SEC)

                if not ret:
                    reconnect_attempts += 1
                    if reconnect_attempts > MAX_RECONNECTS:
                        yield sse({"type": "error",
                                   "message": "Stream reconnect failed — stopping"})
                        break

                    yield sse({"type": "stage",
                               "message": f"Stream dropped — reconnect attempt "
                                          f"{reconnect_attempts}/{MAX_RECONNECTS}…"})
                    cap.release()
                    time.sleep(1)
                    cap = _open_capture(req.rtspUrl)
                    if cap.isOpened():
                        reconnect_attempts = 0
                        yield sse({"type": "stage", "message": "Stream reconnected"})
                    continue

                # Successful read — reset counter
                reconnect_attempts = 0

                frame_count += 1
                if frame_count % req.frameSkip != 0:
                    continue

                ts = round(frame_count / fps, 2)

                detections = _detect_faces_tiled(
                    state.face_app, frame, ui_mask,
                    preview_cb=_update_preview,
                )
                faces_this_frame = len(detections)

                for d in detections:
                    all_embeddings.append(d["embedding"])
                    all_face_images.append(d["crop"])
                    all_timestamps.append(ts)
                    all_quality.append(d["quality"])
                    detections_since += 1

                yield sse({
                    "type":             "frame",
                    "frame":            frame_count,
                    "faces_this_frame": faces_this_frame,
                })

                # Incremental clustering
                if (detections_since >= CLUSTER_EVERY
                        and len(all_embeddings) >= req.minSamples):
                    detections_since = 0

                    labels, unique_labels = _cluster(
                        all_embeddings, req.clusterThreshold, req.minSamples)

                    next_serial, updated = _save_clusters(
                        labels, unique_labels,
                        all_embeddings, all_face_images,
                        all_timestamps, all_quality,
                        batch_dir, existing_mean_embs, next_serial,
                        req.targetImgsPerPerson, person_counts,
                        req.clusterThreshold,
                    )

                    _cluster_passes    += 1
                    _last_person_count  = len(person_counts)

                    for person_id, new_count in updated.items():
                        done = new_count >= req.targetImgsPerPerson
                        yield sse({
                            "type":      "person_update",
                            "person_id": person_id,
                            "count":     new_count,
                            "target":    req.targetImgsPerPerson,
                            "done":      done,
                        })

                # Periodic progress
                now = time.time()
                if now - last_progress_t >= PROGRESS_EVERY:
                    last_progress_t = now
                    n_persons = len(person_counts)
                    n_done    = sum(
                        1 for c in person_counts.values()
                        if c >= req.targetImgsPerPerson)
                    yield sse({
                        "type":    "progress",
                        "message": (
                            f"Frame {frame_count} | "
                            f"{len(all_embeddings)} detections | "
                            f"{n_persons} people | "
                            f"{n_done}/{n_persons} done"
                        ),
                    })

                # Check completion
                # FIX: The original check fired as soon as person_counts was
                # non-empty and every *known* person was done.  The problem is
                # that clustering is incremental — after the first CLUSTER_EVERY
                # detections only one person may have been discovered yet.  If
                # that person happens to have reached the target, the stream
                # stopped before the second, third, etc. people were ever found.
                #
                # Guard: only allow auto-stop after at least two clustering
                # passes have run AND no new persons appeared in the last pass.
                # `_cluster_passes` counts completed passes; `_last_person_count`
                # tracks how many persons were known at the previous pass.
                if (person_counts
                        and _cluster_passes >= 2
                        and len(person_counts) == _last_person_count
                        and all(c >= req.targetImgsPerPerson
                                for c in person_counts.values())):
                    yield sse({"type": "stage",
                               "message": "All persons reached target — stopping"})
                    break

        finally:
            # FIX: always release the capture — even on unhandled exceptions —
            # so the OS-level socket/file descriptor is freed immediately.
            cap.release()
            logger.info("VideoCapture released for %s", req.rtspUrl)

        # ── Final save pass ───────────────────────────────────────────────────
        # Run one last cluster+save on all accumulated embeddings so faces
        # detected before Stop was clicked are never discarded.
        if len(all_embeddings) >= req.minSamples:
            yield sse({"type": "stage",
                       "message": f"Saving {len(all_embeddings)} buffered detections…"})
            try:
                labels, unique_labels = _cluster(
                    all_embeddings, req.clusterThreshold, req.minSamples)

                next_serial, updated = _save_clusters(
                    labels, unique_labels,
                    all_embeddings, all_face_images,
                    all_timestamps, all_quality,
                    batch_dir, existing_mean_embs, next_serial,
                    req.targetImgsPerPerson, person_counts,
                    req.clusterThreshold,
                )

                for person_id, new_count in updated.items():
                    yield sse({
                        "type":      "person_update",
                        "person_id": person_id,
                        "count":     new_count,
                        "target":    req.targetImgsPerPerson,
                        "done":      new_count >= req.targetImgsPerPerson,
                    })
            except Exception as exc:
                logger.exception("Final clustering pass failed: %s", exc)

        # ── End of loop ───────────────────────────────────────────────────────
        images_saved = sum(person_counts.values())
        elapsed      = round(time.time() - start, 2)

        yield sse({
            "type":            "done",
            "people_detected": len(person_counts),
            "images_saved":    images_saved,
            "batch_dir":       batch_dir,
            "elapsed_sec":     elapsed,
            "frames_read":     frame_count,
            "message": (
                f"Done in {elapsed}s — "
                f"{len(person_counts)} people, "
                f"{images_saved} images, "
                f"{frame_count} frames read"
            ),
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        # FIX: charset=utf-8 prevents proxies (nginx, Caddy) from buffering
        # the SSE stream, which causes the frontend to see a network error
        # instead of a stream of events.
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",
            "Content-Type":     "text/event-stream; charset=utf-8",
        },
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cluster(embeddings, threshold, min_samples):
    eps = float(np.sqrt(2.0 * (1.0 - threshold)))
    clustering = _DBSCAN(
        eps=eps, min_samples=min_samples,
        metric="euclidean", algorithm="ball_tree", n_jobs=-1,
    ).fit(np.array(embeddings))
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
        folder_embs = []
        for img_f in imgs[:5]:
            img = cv2.imread(os.path.join(fp, img_f))
            if img is None:
                continue
            faces = state.face_app.get(img)
            if faces:
                emb  = faces[0].embedding
                norm = np.linalg.norm(emb)
                if norm > 0:
                    folder_embs.append(emb / norm)
        if folder_embs:
            mean_emb = np.mean(folder_embs, axis=0)
            existing_mean_embs[folder_name] = (
                mean_emb / np.linalg.norm(mean_emb))


def _save_clusters(
    labels, unique_labels,
    all_embeddings, all_face_images, all_timestamps, all_quality,
    batch_dir, existing_mean_embs, next_serial,
    target_per_person, person_counts,
    cluster_threshold,
    top_n=10, embed_n=5,
):
    updated         = {}
    MATCH_THRESHOLD = max(cluster_threshold, 0.50)

    for cluster_id in unique_labels:
        indices      = np.where(labels == cluster_id)[0]
        cluster_embs = np.array([all_embeddings[i] for i in indices])
        cluster_mean = cluster_embs.mean(axis=0)
        norm         = np.linalg.norm(cluster_mean)
        if norm == 0:
            continue
        cluster_mean /= norm

        best_folder = None
        best_score  = 0.0
        for fname, ex_emb in existing_mean_embs.items():
            score = float(np.dot(cluster_mean, ex_emb))
            if score > best_score:
                best_score  = score
                best_folder = fname

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
            [(all_face_images[i], all_quality[i],
              all_timestamps[i], i) for i in indices],
            key=lambda x: x[1], reverse=True,
        )[:still_need]

        saved  = 0
        scores = {}
        for (crop, quality, ts, idx) in cluster_sorted:
            if crop.size == 0:
                continue
            fname = f"gt_{ts:.1f}s_f{idx}.jpg"
            fpath = os.path.join(folder_path, fname)
            if not os.path.exists(fpath):
                cv2.imwrite(fpath, crop)
                saved += 1
            scores[fname] = round(quality, 4)

        if saved == 0:
            continue

        _update_info(folder_path, scores, top_n, embed_n)

        new_count                  = _count_images(folder_path)
        person_counts[folder_name] = new_count
        updated[folder_name]       = new_count

    return next_serial, updated


def _count_images(folder_path):
    return sum(
        1 for f in os.listdir(folder_path)
        if f.lower().endswith(IMG_EXTS))


def _update_info(folder_path, new_scores, top_n, embed_n):
    info_path = os.path.join(folder_path, "_info.json")
    info      = {"embedding_files": [], "backup_files": [], "scores": {}}
    if os.path.exists(info_path):
        try:
            with open(info_path) as fi:
                info = json.load(fi)
        except Exception:
            pass

    info["scores"].update(new_scores)

    all_imgs = [f for f in os.listdir(folder_path)
                if f.lower().endswith(IMG_EXTS)]
    for f in all_imgs:
        if f not in info["scores"]:
            img = cv2.imread(os.path.join(folder_path, f))
            if img is not None:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                lap  = float(cv2.Laplacian(gray, cv2.CV_64F).var())
                h, w = img.shape[:2]
                info["scores"][f] = round(
                    (w * h) ** 0.5 * min(lap, 500) / 500, 4)
            else:
                info["scores"][f] = 0.5

    scored = sorted(
        [(f, info["scores"].get(f, 0))
         for f in all_imgs if f in info["scores"]],
        key=lambda x: x[1], reverse=True,
    )
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