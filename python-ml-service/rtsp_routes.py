# rtsp_routes.py

import os
import re
import uuid
import json
import time
import base64
import pickle
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from tracemalloc import start
from typing import Optional

import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from pydantic import BaseModel
from sklearn.cluster import DBSCAN as _DBSCAN

import state
import clustering_service
import liveness_config_store
import faiss_config_store
import max_k_config_store
import adaface_config_store
import pipeline_config_store
import detector_config_store
import detector_utils
import adaface_utils
from clustering_service import (
    _detect_faces_tiled, _build_ui_mask,
    reset_liveness_rejection_count, get_liveness_rejection_count,
)
from clustering_service import _detect_faces_tiled, _build_ui_mask
from faiss_utils import _recognize_face

logger = logging.getLogger("ml_service.rtsp_routes")
router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ml-data", "ground_truth")

SNAP_EVERY_SEC = 15   # save raw + annotated frame snapshot every N seconds during attendance

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# ── Per-job registry (enables parallel attendance AND ground-truth runs) ──────
# Each entry: { "stop": Event, "frame": bytes|None, "lock": Lock }
_jobs: dict = {}
_jobs_lock  = threading.Lock()

def _new_job() -> tuple:
    job_id = str(uuid.uuid4())
    job    = {"stop": threading.Event(), "frame": None, "lock": threading.Lock()}
    with _jobs_lock:
        _jobs[job_id] = job
    return job_id, job

def _finish_job(job_id: str, job: dict):
    job["stop"].set()
    def _cleanup():
        time.sleep(10)          # keep entry briefly so preview drain can finish
        with _jobs_lock:
            _jobs.pop(job_id, None)
    threading.Thread(target=_cleanup, daemon=True).start()


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
            # Use grab() + retrieve() instead of read() to avoid
            # the SIGSEGV / av_read_frame crash on macOS ARM64.
            # grab() only demuxes; retrieve() decodes — we skip
            # decode on frames we are going to throw away anyway.
            try:
                ret = self._cap.grab()
            except Exception as exc:
                logger.debug("_RTSPReader._run grab exiting: %s", exc)
                with self._lock:
                    self._ok = False
                break

            if not ret:
                with self._lock:
                    self._ok = False
                break

            self._n += 1
            if self._n % self._decode_every != 0:
                continue

            try:
                ret2, frame = self._cap.retrieve()
            except Exception as exc:
                logger.debug("_RTSPReader._run retrieve exiting: %s", exc)
                with self._lock:
                    self._ok = False
                break

            with self._lock:
                self._ok = ret2
                if ret2 and frame is not None:
                    self._frame = frame
                    self._seq  += 1

    def latest(self):
        with self._lock:
            return self._ok, self._frame, self._seq, self._n

    def release(self):
        self._stop.set()
        # Wait for the reader thread to finish before releasing the
        # capture object — avoids a use-after-free SIGSEGV on macOS.
        self._t.join(timeout=2.0)
        self._cap.release()


# def _open_capture(rtsp_url: str) -> cv2.VideoCapture:
#     url = rtsp_url if "rtsp_transport" in rtsp_url else rtsp_url + "?rtsp_transport=tcp"
#     # Force FFmpeg to use 1 decode thread — the default multi-thread
#     # decode spawns internal pthreads that race on macOS ARM64 and
#     # trigger a SIGSEGV inside av_read_frame.
#     os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS",
#                           "threads;1|rtsp_transport;tcp")
#     cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
#     cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
#     return cap


def _open_capture(rtsp_url: str) -> cv2.VideoCapture:
    url = rtsp_url if "rtsp_transport" in rtsp_url else rtsp_url + "?rtsp_transport=tcp"
    # Force FFmpeg to use 1 decode thread — the default multi-thread
    # decode spawns internal pthreads that race on macOS ARM64 and
    # trigger a SIGSEGV inside av_read_frame.

    is_file = rtsp_url.startswith("/") or rtsp_url.startswith("./")
    if is_file:
        url = rtsp_url
    else:
        url = rtsp_url if "rtsp_transport" in rtsp_url else rtsp_url + "?rtsp_transport=tcp"
    os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS",
                          "threads;1|rtsp_transport;tcp")
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap


def _make_preview_cb(job: dict):
    """Return a frame-annotation callback that writes into the given job's frame buffer."""
    colors = [
        (0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0),
        (0, 255, 255), (255, 0, 255), (0, 128, 255),
    ]
    def cb(frame, zoom_boxes, current_pass=0):
        vis = frame.copy()
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
        with job["lock"]:
            job["frame"] = buf.tobytes()
    return cb


# ── Request models ────────────────────────────────────────────────────────────

class RTSPRequest(BaseModel):
    rtspUrl:             str
    batch:               str
    detSize:             int   = 320
    frameSkip:           int   = 10
    targetImgsPerPerson: int   = 10
    minSamples:          int   = 3
    clusterThreshold:    float = 0.45
    jobId:               str   = ""
    # [{folderName, infoJson, photos: [{filename, data}]}] — sent by Node so this
    # process never needs direct filesystem access to ground_truth/ (may run on a
    # separate machine).
    existingFolders:     list  = []


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
    # { rollNo: mean_embedding } sent by Node (from cached _info.json values) so
    # this process never needs direct filesystem access to ground_truth/ (may
    # run on a separate machine).
    enrolledEmbeddings: dict = {}
    # { rollNo: [embedding, ...] } — each student's top-K individually stored
    # embeddings (falls back to a 1-item list built from mean_embedding for
    # students not yet regenerated). Used only for the optional "max-of-K"
    # shadow comparison (state.max_k_config) run alongside the primary
    # mean-embedding assignment below — never for the actual attendance
    # decision. See /max-k-config (ML Fine Tuning page).
    enrolledEmbeddingsTopK: dict = {}
    # Alternative enrollment source: a base64-encoded subject-level .pkl
    # ({roll_no: {name, embedding, num_photos}}), as built by
    # /build-embeddings-sync and sent by schedulerController.js /
    # autoAttendanceScheduler.js. Used only as a fallback when
    # enrolledEmbeddings is empty — both are never sent together in
    # practice, but enrolledEmbeddings wins if both are present.
    embeddingsPklData: Optional[str] = None
    # Set by Node only on the one run nearest the middle of a scheduled
    # period — requests the optional FAISS shadow comparison (state.
    # faiss_config["shadow_enabled"], ML Fine Tuning page) for this run.
    # Diagnostic only — searches the full FAISS index, never affects the
    # primary mean-embedding assignment.
    runFaissShadow: bool = False
    # Set by Node only on the one run nearest the middle of a scheduled
    # period — requests the optional AdaFace shadow comparison (state.
    # adaface_config["enabled"], ML Fine Tuning page). AdaFace embeddings
    # live in a different vector space than InsightFace's, so this also
    # triggers AdaFace inference during live capture for that one run only
    # (see _attendance_pipeline) — never affects the primary mean-embedding
    # assignment, and is a no-op if no AdaFace ONNX model is loaded.
    runAdafaceShadow: bool = False
    # { rollNo: mean_adaface_embedding } / { rollNo: [adaface_embedding, ...] }
    # — same shape/semantics as enrolledEmbeddings/enrolledEmbeddingsTopK,
    # but for AdaFace's independent embedding space.
    enrolledEmbeddingsAdaface: dict = {}
    enrolledEmbeddingsAdafaceTopK: dict = {}
    # Umbrella middle-of-period flag: when True, every model whose shadow
    # toggle is on in state.pipeline_config (Model Pipeline card, ML Fine
    # Tuning page) runs its diagnostic comparison against the primary this
    # run. Supersedes the per-model runFaissShadow/runAdafaceShadow flags
    # above, which are kept for back-compat and OR'd in.
    runShadows: bool = False


# ── Preview endpoint ──────────────────────────────────────────────────────────

@router.get("/rtsp-preview")
def rtsp_preview(jobId: str = ""):
    with _jobs_lock:
        job = _jobs.get(jobId) if jobId else None
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or already finished")
    def generate():
        try:
            while not job["stop"].is_set():
                with job["lock"]:
                    frame = job["frame"]
                if frame:
                    yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                    time.sleep(0.033)
                else:
                    time.sleep(0.05)
        except GeneratorExit:
            pass
    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class StopRequest(BaseModel):
    jobId: str = ""

@router.post("/stop-rtsp-stream")
def stop_rtsp_stream(req: StopRequest = StopRequest()):
    if req.jobId:
        with _jobs_lock:
            job = _jobs.get(req.jobId)
        if job:
            job["stop"].set()
    else:
        with _jobs_lock:
            for j in _jobs.values():
                j["stop"].set()
    return {"status": "stop_requested"}


# ── Ground Truth SSE acquisition endpoint ─────────────────────────────────────

@router.post("/extract-rtsp-stream")
def extract_rtsp_stream(req: RTSPRequest):
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")

    if req.detSize != state.current_det_size and state.load_model_fn:
        state.load_model_fn(det_size=req.detSize)

    def generate():
        if req.jobId:
            with _jobs_lock:
                _existing = _jobs.get(req.jobId)
            if _existing:
                job_id, job = req.jobId, _existing
                job["stop"].clear()
            else:
                job_id, job = _new_job()
        else:
            job_id, job = _new_job()
        preview_cb = _make_preview_cb(job)
        def sse(obj):
            return f"data: {json.dumps(obj)}\n\n"
        yield sse({"type": "job_id", "jobId": job_id})
        print("🟢 GENERATOR STARTED", flush=True)

        batch_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batch)

        # Ask Node.js server to create the batch directory
        yield sse({"type": "mkdir_batch", "batch": req.batch})

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

        # Existing-folder state comes from Node as photo bytes (req.existingFolders) —
        # this process may run on a separate machine with no access to ground_truth/.
        folder_state: dict = _load_folder_state_from_payload(req.existingFolders)
        existing_mean_embs: dict[str, np.ndarray] = {}
        _load_existing_folders_from_payload(req.existingFolders, existing_mean_embs)

        person_counts: dict[str, int] = {
            k: len(v.get("scores", {}))
            for k, v in folder_state.items()
            if re.match(r"^person_\d+$", k, re.IGNORECASE)
        }
        existing_person_nums = [
            int(k.split("_")[1])
            for k in folder_state.keys()
            if re.match(r"^person_\d+$", k, re.IGNORECASE)
        ]
        next_serial = (max(existing_person_nums) + 1) if existing_person_nums else 1

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

        frame_count      = 0
        detections_since = 0
        last_progress_t  = time.time()
        PROGRESS_EVERY   = 10
        reconnect_attempts = 0
        MAX_RECONNECTS     = 5

        _cluster_passes      = 0
        _last_person_count   = 0
        _last_new_person_t   = time.time()
        NEW_PERSON_TIMEOUT   = state.gt_config.get("new_person_timeout", 60)

        reader   = _RTSPReader(cap, decode_every=req.frameSkip)
        last_seq = 0

        cluster_pool   = ThreadPoolExecutor(max_workers=1)
        cluster_future = None

        try:
            while True:
                if job["stop"].is_set():
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
                    with job["lock"]:
                        job["frame"] = raw_buf.tobytes()
                except Exception:
                    pass

                t_detect = time.time()
                try:
                    detections = _detect_faces_tiled(
                        state.face_app, frame, ui_mask,
                        preview_cb=preview_cb,
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
                        new_serial, updated, new_mean_embs, new_pcounts, crops_to_emit, returned_fstate = cluster_future.result()
                        next_serial = new_serial
                        existing_mean_embs.update(new_mean_embs)
                        person_counts.update(new_pcounts)
                        for k, v in returned_fstate.items():
                            folder_state[k] = v
                        _cluster_passes += 1
                        if len(person_counts) > _last_person_count:
                            _last_new_person_t = time.time()
                        _last_person_count = len(person_counts)
                        for crop_event in crops_to_emit:
                            yield sse(crop_event)
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
                    pass_num    = _cluster_passes + 1
                    embs_snap   = list(all_embeddings)
                    imgs_snap   = list(all_face_images)
                    ts_snap     = list(all_timestamps)
                    q_snap      = list(all_quality)
                    mean_snap   = {k: v.copy() for k, v in existing_mean_embs.items()}
                    pc_snap     = dict(person_counts)
                    serial_now  = next_serial
                    fstate_snap = {k: {"scores": dict(v.get("scores", {}))} for k, v in folder_state.items()}

                    def _cluster_job(embs, imgs, tss, qs, mean_embs, pcounts, serial, p, fstate):
                        t0 = time.time()
                        lbl, ulbl = _cluster(embs, req.clusterThreshold, req.minSamples)
                        logger.info("  pass #%d: DBSCAN %.0fms — %d clusters", p, (time.time()-t0)*1000, len(ulbl))
                        new_s, upd, crops = _save_clusters(lbl, ulbl, embs, imgs, tss, qs,
                                                            batch_dir, mean_embs, serial,
                                                            req.targetImgsPerPerson, pcounts,
                                                            req.clusterThreshold, fstate,
                                                            top_n=state.gt_config.get("top_n", 10),
                                                            embed_n=state.gt_config.get("embed_n", 5))
                        return new_s, upd, mean_embs, pcounts, crops, fstate

                    cluster_future = cluster_pool.submit(
                        _cluster_job, embs_snap, imgs_snap, ts_snap, q_snap,
                        mean_snap, pc_snap, serial_now, pass_num, fstate_snap)

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
            _finish_job(job_id, job)
            print("GENERATOR FINALLY BLOCK REACHED", flush=True)

        if len(all_embeddings) >= req.minSamples:
            yield sse({"type": "stage", "message": f"Saving {len(all_embeddings)} buffered detections…"})
            try:
                labels, unique_labels = _cluster(all_embeddings, req.clusterThreshold, req.minSamples)
                fstate_final = {k: {"scores": dict(v.get("scores", {}))} for k, v in folder_state.items()}
                next_serial, updated, crops_to_emit = _save_clusters(
                    labels, unique_labels, all_embeddings, all_face_images,
                    all_timestamps, all_quality, batch_dir, existing_mean_embs,
                    next_serial, req.targetImgsPerPerson, person_counts, req.clusterThreshold,
                    fstate_final,
                    top_n=state.gt_config.get("top_n", 10),
                    embed_n=state.gt_config.get("embed_n", 5))
                for crop_event in crops_to_emit:
                    yield sse(crop_event)
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


def _build_top_k_score_matrix(cluster_matrix, topk_dict, top_k):
    """
    Shared score-matrix builder for top-K (max-similarity) scoring — used by
    both the max-of-K PRIMARY path and _max_k_shadow_comparison, and by the
    AdaFace primary path (in AdaFace's own vector space).

    Expands every (student, k) embedding into one big matrix, does a single
    matmul against cluster_matrix (n_clusters, 512), then max-reduces each
    student's K columns back down to one — same (n_clusters, n_students)
    shape a plain mean-embedding matmul produces, so the exact same Hungarian
    assignment logic applies unchanged downstream.

    Returns (ids, score_matrix) or (None, None) when there's nothing to score.
    """
    row_owner, vectors = [], []
    for roll_no, vecs in (topk_dict or {}).items():
        for vec in (vecs or [])[:top_k]:
            arr = np.array(vec, dtype=np.float32)
            norm = np.linalg.norm(arr)
            if norm == 0:
                continue
            vectors.append(arr / norm)
            row_owner.append(roll_no)
    if not vectors or cluster_matrix is None or len(cluster_matrix) == 0:
        return None, None
    ids = sorted(set(row_owner))
    id_index = {roll_no: i for i, roll_no in enumerate(ids)}

    big_matrix = np.array(vectors, dtype=np.float32)
    raw_scores = np.array(cluster_matrix, dtype=np.float32) @ big_matrix.T

    score_matrix = np.full((len(cluster_matrix), len(ids)), -1.0, dtype=np.float32)
    for col, roll_no in enumerate(row_owner):
        sid = id_index[roll_no]
        score_matrix[:, sid] = np.maximum(score_matrix[:, sid], raw_scores[:, col])
    return ids, score_matrix


def _max_k_shadow_comparison(cluster_means, cluster_meta,
                              primary_matches, enrolled_topk_raw, top_k, review_threshold):
    """
    Optional diagnostic pass (state.max_k_config) — scores the same cluster
    means already computed for the primary mean-embedding assignment against
    each enrolled student's top-K individually stored embeddings instead
    (max-similarity across the K vectors), then compares the resulting
    assignment to the primary one. Read-only: never mutates `attendance` or
    any of the primary-path variables it's passed.

    primary_matches: {cluster_row_index: (roll_no, score)} from the primary
                      mean-embedding Hungarian assignment, for the same
                      cluster rows this function scores.
    enrolled_topk_raw: {roll_no: [vec, ...]} — req.enrolledEmbeddingsTopK,
                       already restricted to the same roster the primary
                       assignment matched against (in-list students only,
                       mirroring `match_enrolled`).
    Returns a JSON-safe summary dict, or None if there was nothing to compare
    (e.g. no cached top-K embeddings yet for anyone in this roster).
    """
    ids, score_matrix = _build_top_k_score_matrix(cluster_means, enrolled_topk_raw, top_k)
    if ids is None:
        return None

    row_ind, col_ind = linear_sum_assignment(-score_matrix)
    shadow_matches = {}
    for r, c in zip(row_ind, col_ind):
        score = float(score_matrix[r, c])
        if score >= review_threshold:
            shadow_matches[r] = (ids[c], score)

    agree, disagree, mean_only, max_k_only, details = 0, 0, 0, 0, []
    # Roll-indexed view — one entry per roll_no that either mode matched, so
    # the frontend can render a per-student "Max-of-K" table column rather
    # than only an aggregate count. Keyed by roll_no (not cluster row), since
    # the attendance table itself is roll-indexed.
    per_student = {}
    compared_rows = set(primary_matches) | set(shadow_matches)
    for r in compared_rows:
        mean_roll, mean_score   = primary_matches.get(r, (None, 0.0))
        max_k_roll, max_k_score = shadow_matches.get(r, (None, 0.0))
        row_agree = (mean_roll == max_k_roll)
        if row_agree:
            agree += 1
        else:
            disagree += 1
            if mean_roll and not max_k_roll:
                mean_only += 1
            elif max_k_roll and not mean_roll:
                max_k_only += 1
            cluster_id, _ = cluster_meta[r]
            details.append({
                "cluster_id":   int(cluster_id),
                "mean_roll":    mean_roll,
                "mean_score":   round(mean_score, 4),
                "max_k_roll":   max_k_roll,
                "max_k_score":  round(max_k_score, 4),
            })
        if mean_roll:
            per_student[mean_roll] = {
                "mean_score":  round(mean_score, 4),
                "max_k_score": round(max_k_score, 4) if row_agree else None,
                "max_k_roll":  max_k_roll if not row_agree else None,
                "agree":       row_agree,
            }
        if max_k_roll and not row_agree:
            per_student[max_k_roll] = {
                "mean_score":  None,
                "max_k_score": round(max_k_score, 4),
                "max_k_roll":  None,
                "agree":       False,
            }

    return {
        "enabled":           True,
        "top_k":             top_k,
        "students_compared":  len(ids),
        "clusters_compared":  len(compared_rows),
        "agree":              agree,
        "disagree":           disagree,
        "mean_only_matches":  mean_only,
        "max_k_only_matches": max_k_only,
        "details":            details[:20],  # cap payload size
        "per_student":        per_student,
    }


def _faiss_shadow_comparison(cluster_means, primary_matches, faiss_top_k, faiss_threshold):
    """
    Optional diagnostic pass (state.faiss_config["shadow_enabled"]) — scores
    the same cluster means already computed for the primary mean-embedding
    assignment against the FULL FAISS index (top-k voting, exactly like the
    live tracked-attendance pipeline) instead, then compares the resulting
    match to the primary assignment. Read-only: never mutates `attendance`.

    Unlike _max_k_shadow_comparison, this searches the whole FAISS index
    (all departments/batches), not just this session's enrolled roster —
    a FAISS-only match outside the roster is itself a meaningful diagnostic
    signal (surfaced as "no primary match" disagreement), not an error.
    """
    if state.faiss_index is None or not cluster_means:
        return None

    shadow_matches = {}
    for r, cluster_mean in enumerate(cluster_means):
        roll, score = _recognize_face(
            np.array(cluster_mean, dtype=np.float32),
            state.faiss_index, state.vid_to_roll,
            top_k=faiss_top_k, threshold=faiss_threshold,
        )
        if roll:
            shadow_matches[r] = (roll, score)

    agree, disagree, mean_only, faiss_only = 0, 0, 0, 0
    per_student = {}
    compared_rows = set(primary_matches) | set(shadow_matches)
    if not compared_rows:
        return None

    for r in compared_rows:
        mean_roll, mean_score   = primary_matches.get(r, (None, 0.0))
        faiss_roll, faiss_score = shadow_matches.get(r, (None, 0.0))
        row_agree = (mean_roll == faiss_roll)
        if row_agree:
            agree += 1
        else:
            disagree += 1
            if mean_roll and not faiss_roll:
                mean_only += 1
            elif faiss_roll and not mean_roll:
                faiss_only += 1
        if mean_roll:
            per_student[mean_roll] = {
                "mean_score":  round(mean_score, 4),
                "faiss_score": round(faiss_score, 4) if row_agree else None,
                "faiss_roll":  faiss_roll if not row_agree else None,
                "agree":       row_agree,
            }
        if faiss_roll and not row_agree:
            per_student[faiss_roll] = {
                "mean_score":  None,
                "faiss_score": round(faiss_score, 4),
                "faiss_roll":  None,
                "agree":       False,
            }

    return {
        "enabled":            True,
        "top_k":              faiss_top_k,
        "recog_threshold":    faiss_threshold,
        "clusters_compared":  len(compared_rows),
        "agree":              agree,
        "disagree":           disagree,
        "mean_only_matches":  mean_only,
        "faiss_only_matches": faiss_only,
        "per_student":        per_student,
    }


def _adaface_shadow_comparison(adaface_cluster_rows, primary_matches, enrolled_adaface_topk, top_k, recog_threshold):
    """
    Optional diagnostic pass (state.adaface_config["enabled"]) — scores
    AdaFace cluster means against each enrolled student's top-K AdaFace
    embeddings via max-similarity (same technique as _max_k_shadow_comparison,
    just in AdaFace's independent vector space), then compares the resulting
    assignment to the primary mean-embedding (InsightFace) assignment.
    Read-only: never mutates `attendance`.

    adaface_cluster_rows: [(original_row_index, adaface_cluster_mean), ...] —
    only clusters where at least one detection's AdaFace embedding succeeded
    (built by averaging AdaFace vectors within each InsightFace-derived
    cluster's member indices — no re-clustering). original_row_index matches
    the same row indexing primary_matches uses (into cluster_meta/cluster_means).
    """
    if not adaface_cluster_rows:
        return None

    row_owner, vectors = [], []
    for roll_no, vecs in enrolled_adaface_topk.items():
        for vec in (vecs or [])[:top_k]:
            arr = np.array(vec, dtype=np.float32)
            norm = np.linalg.norm(arr)
            if norm == 0:
                continue
            vectors.append(arr / norm)
            row_owner.append(roll_no)
    if not vectors:
        return None
    ids = sorted(set(row_owner))
    id_index = {roll_no: i for i, roll_no in enumerate(ids)}

    local_means  = np.array([m for _, m in adaface_cluster_rows], dtype=np.float32)
    big_matrix   = np.array(vectors, dtype=np.float32)
    raw_scores   = local_means @ big_matrix.T  # (n_local_clusters, n_vecs)

    score_matrix = np.full((len(adaface_cluster_rows), len(ids)), -1.0, dtype=np.float32)
    for col, roll_no in enumerate(row_owner):
        sid = id_index[roll_no]
        score_matrix[:, sid] = np.maximum(score_matrix[:, sid], raw_scores[:, col])

    row_ind, col_ind = linear_sum_assignment(-score_matrix)
    shadow_matches = {}
    for local_r, c in zip(row_ind, col_ind):
        score = float(score_matrix[local_r, c])
        if score >= recog_threshold:
            original_r = adaface_cluster_rows[local_r][0]
            shadow_matches[original_r] = (ids[c], score)

    agree, disagree, mean_only, adaface_only = 0, 0, 0, 0
    per_student = {}
    compared_rows = set(primary_matches) | set(shadow_matches)
    if not compared_rows:
        return None

    for r in compared_rows:
        mean_roll, mean_score       = primary_matches.get(r, (None, 0.0))
        adaface_roll, adaface_score = shadow_matches.get(r, (None, 0.0))
        row_agree = (mean_roll == adaface_roll)
        if row_agree:
            agree += 1
        else:
            disagree += 1
            if mean_roll and not adaface_roll:
                mean_only += 1
            elif adaface_roll and not mean_roll:
                adaface_only += 1
        if mean_roll:
            per_student[mean_roll] = {
                "mean_score":    round(mean_score, 4),
                "adaface_score": round(adaface_score, 4) if row_agree else None,
                "adaface_roll":  adaface_roll if not row_agree else None,
                "agree":         row_agree,
            }
        if adaface_roll and not row_agree:
            per_student[adaface_roll] = {
                "mean_score":    None,
                "adaface_score": round(adaface_score, 4),
                "adaface_roll":  None,
                "agree":         False,
            }

    return {
        "enabled":              True,
        "top_k":                top_k,
        "recog_threshold":      recog_threshold,
        "clusters_compared":    len(compared_rows),
        "agree":                agree,
        "disagree":             disagree,
        "mean_only_matches":    mean_only,
        "adaface_only_matches": adaface_only,
        "per_student":          per_student,
    }


def _mean_shadow_comparison(cluster_means, enrolled_ids, enroll_matrix,
                             primary_matches, review_threshold):
    """
    Diagnostic pass for when Mean (InsightFace) is NOT the primary model
    (state.pipeline_config) — runs the classic mean-embedding Hungarian
    assignment and compares it to whichever model actually decided
    attendance this run. Read-only: never mutates `attendance`.

    In per_student entries, "primary_*" is the deciding model's match and
    "mean_*" is this shadow's — the reverse orientation of the other three
    helpers (where mean IS the primary).
    """
    if not cluster_means or enroll_matrix is None or len(enroll_matrix) == 0:
        return None

    score_matrix = np.array(cluster_means, dtype=np.float32) @ enroll_matrix.T
    row_ind, col_ind = linear_sum_assignment(-score_matrix)
    shadow_matches = {}
    for r, c in zip(row_ind, col_ind):
        score = float(score_matrix[r, c])
        if score >= review_threshold:
            shadow_matches[r] = (enrolled_ids[c], score)

    agree, disagree, primary_only, mean_only = 0, 0, 0, 0
    per_student = {}
    compared_rows = set(primary_matches) | set(shadow_matches)
    if not compared_rows:
        return None

    for r in compared_rows:
        primary_roll, primary_score = primary_matches.get(r, (None, 0.0))
        mean_roll, mean_score       = shadow_matches.get(r, (None, 0.0))
        row_agree = (primary_roll == mean_roll)
        if row_agree:
            agree += 1
        else:
            disagree += 1
            if primary_roll and not mean_roll:
                primary_only += 1
            elif mean_roll and not primary_roll:
                mean_only += 1
        if primary_roll:
            per_student[primary_roll] = {
                "primary_score": round(primary_score, 4),
                "mean_score":    round(mean_score, 4) if row_agree else None,
                "mean_roll":     mean_roll if not row_agree else None,
                "agree":         row_agree,
            }
        if mean_roll and not row_agree:
            per_student[mean_roll] = {
                "primary_score": None,
                "mean_score":    round(mean_score, 4),
                "mean_roll":     None,
                "agree":         False,
            }

    return {
        "enabled":              True,
        "clusters_compared":    len(compared_rows),
        "agree":                agree,
        "disagree":             disagree,
        "primary_only_matches": primary_only,
        "mean_only_matches":    mean_only,
        "per_student":          per_student,
    }


# ══════════════════════════════════════════════════════════════════════════════
# ATTENDANCE PIPELINE — shared generator (yields plain dicts, not SSE strings)
# Both the SSE route and the sync route consume this.
# ══════════════════════════════════════════════════════════════════════════════

def _attendance_pipeline(req: RTSPAttendanceRequest, job: dict):
    """
    Core attendance logic as a regular (synchronous) generator.
    Yields plain dicts: {"type": "stage"|"frame"|"frame_snapshot"|"done"|"error", ...}
    "frame_snapshot" carries base64-encoded raw + annotated JPEG bytes — the
    pipeline never reads or writes local disk, so it runs correctly even when
    this process is on a separate machine from the Node server (e.g. a remote
    GPU box). Enrollment data comes in via req.enrolledEmbeddings; snapshot
    bytes go out via "frame_snapshot" events. Callers (the sync and SSE
    routes below) are responsible for persisting those bytes wherever
    server/ml-data/ actually lives.
    No SSE wrapping here — callers decide how to use the events.
    job: per-request dict with keys "stop" (Event), "frame" (bytes|None), "lock" (Lock).
    """
    job["stop"].clear()

    # Issue: liveness/anti-spoofing — reset the rejection counter so this
    # run's summary reports only what it rejected (see note on the counter's
    # concurrency tradeoff in clustering_service.py).
    reset_liveness_rejection_count()

    run_dept = req.batch.split("_")[1] if "_" in req.batch else ""

    yield {"type": "stage", "message": f"Loading enrolled embeddings for batch: {req.batch}…"}

    # Enrollment embeddings come from Node's cached _info.json mean_embedding
    # values (req.enrolledEmbeddings) — this process may run on a separate
    # machine with no access to ground_truth/, and re-detecting faces from
    # raw photos on every attendance run was both unnecessary (the mean
    # embedding is already cached) and risked pulling in unmarked/backup
    # images if a student had no embedding_files tracked.
    enrolled = {}
    for roll_no, vec in (req.enrolledEmbeddings or {}).items():
        arr = np.array(vec, dtype=np.float32)
        norm = np.linalg.norm(arr)
        if norm > 0:
            enrolled[roll_no] = arr / norm

    # Fallback: subject-level .pkl bytes (schedulerController.js /
    # autoAttendanceScheduler.js send this instead of enrolledEmbeddings —
    # a pre-built {roll_no: {name, embedding, num_photos}} pickle rather
    # than per-roll cached mean_embedding values from ground_truth/).
    if not enrolled and req.embeddingsPklData:
        try:
            pkl_db = pickle.loads(base64.b64decode(req.embeddingsPklData))
            for roll_no, data in (pkl_db or {}).items():
                arr = np.array(data.get("embedding"), dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 0:
                    enrolled[roll_no] = arr / norm
        except Exception:
            logger.exception("Failed to decode embeddingsPklData")

    if not enrolled:
        yield {"type": "error", "message": f"No enrolled students found for batch '{req.batch}' (enrolledEmbeddings/embeddingsPklData empty)."}
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

    # ── Model Pipeline roles (Model Pipeline card, ML Fine Tuning page) ─────
    # Which model's Hungarian assignment decides attendance this run, and
    # which run as diagnostic middle-of-period shadows. If the requested
    # primary's prerequisites are missing, fall back to "mean" with a logged
    # warning — attendance is never lost to a misconfiguration.
    with state.pipeline_config_lock:
        pipeline = dict(state.pipeline_config)
    requested_primary = pipeline.get("primary", "mean")
    effective_primary = requested_primary
    fallback_reason   = None
    if requested_primary == "max_k" and not req.enrolledEmbeddingsTopK:
        effective_primary, fallback_reason = "mean", "no cached top-K embeddings sent"
    elif requested_primary == "adaface":
        if state.adaface_session is None:
            effective_primary, fallback_reason = "mean", "AdaFace ONNX model not loaded"
        elif not (req.enrolledEmbeddingsAdaface or req.enrolledEmbeddingsAdafaceTopK):
            effective_primary, fallback_reason = "mean", "no cached AdaFace enrolled embeddings sent"
    elif requested_primary == "faiss" and state.faiss_index is None:
        effective_primary, fallback_reason = "mean", "no FAISS index loaded"
    if fallback_reason:
        yield {"type": "stage",
               "message": f"⚠️ Primary model '{requested_primary}' unavailable ({fallback_reason}) — falling back to mean"}
    elif effective_primary != "mean":
        yield {"type": "stage", "message": f"Primary model for this run: {effective_primary}"}

    # Umbrella middle-of-period flag (legacy per-model flags OR'd in for
    # back-compat with older Node deployments).
    run_shadows = req.runShadows or req.runFaissShadow or req.runAdafaceShadow

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
    all_demographics = []  # [{"age": int|None, "gender": "M"|"F"|None}, ...] — parallel to all_embeddings
    # AdaFace — entirely separate embedding space (see adaface_utils.py),
    # populated when AdaFace is this run's primary model (every run) or its
    # shadow comparison is due (middle-of-period runs), and a model is
    # actually loaded. Parallel to all_embeddings (same index per detection,
    # None on failure) so cluster means can be built later from the same
    # DBSCAN cluster indices InsightFace's own clustering already produced —
    # no re-clustering.
    all_adaface_embeddings = []
    need_adaface = state.adaface_session is not None and (
        effective_primary == "adaface"
        or (run_shadows and pipeline.get("shadow_adaface", False))
    )
    # Back-compat alias — the capture loop below reads this name.
    run_adaface_shadow = need_adaface
    CAMERA_SWITCH_SEC = 30
    cameras = [req.rtspUrl]
    if req.rtspUrl2:
        cameras.append(req.rtspUrl2)
    start_t = time.time()
    frame_count, cam_idx, last_switch = 0, 0, 0.0
    reader  = _RTSPReader(cap, decode_every=req.frameSkip)
    last_seq = 0

    # ── Frame snapshot tracking ────────────────────────────────────────────────
    # Snapshots are never written to local disk here — this generator may run
    # on a GPU machine with no shared filesystem with the Node server. Each
    # snapshot is instead base64-encoded and yielded as a "frame_snapshot"
    # event (same pattern as the ground-truth "crop_save" event); the caller
    # (Node, via the sync or SSE route) is responsible for writing the bytes
    # to server/ml-data/. `frame_snapshots` below stays a lightweight
    # metadata-only summary (no image bytes) for the final "done" result.
    room_clean = re.sub(r'[^\w]', '_', (req.room or 'ROOM').upper().strip())
    slot_clean = re.sub(r'[^\w]', '_', (req.slot or 'SLOT').upper().strip())
    date_clean = (req.date or '').replace('-', '') or time.strftime('%Y%m%d')
    snap_folder_name = f"{room_clean}_{slot_clean}_{date_clean}"
    frame_snapshots: list = []
    last_snap_t = -SNAP_EVERY_SEC  # trigger a snap on the first eligible frame
 
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
                with job["lock"]:
                    job["frame"] = prev_buf.tobytes()
            except Exception:
                pass
 
            detections = _detect_faces_tiled(state.face_app, frame, ui_mask, dept=run_dept)
            faces_this_frame = len(detections)

            for d in detections:
                all_embeddings.append(d["embedding"])
                all_face_images.append(d["crop"])
                all_timestamps.append(round(elapsed, 2))
                all_quality.append(d["quality"])
                all_demographics.append({"age": d.get("age"), "gender": d.get("gender")})

                if run_adaface_shadow:
                    ada_emb = None
                    try:
                        ada_emb = adaface_utils.get_adaface_embedding_for_face(
                            d.get("align_frame"), d.get("kps"))
                    except Exception:
                        logger.exception("[AdaFace] Shadow embedding failed for one detection")
                    all_adaface_embeddings.append(ada_emb)

          # ── Emit raw + annotated frame every SNAP_EVERY_SEC seconds ──────
            # Encoded in-memory and shipped as a "frame_snapshot" event —
            # nothing is written to disk here (see note above).
            if elapsed - last_snap_t >= SNAP_EVERY_SEC:
                last_snap_t = elapsed
                fname = f"frame_{int(elapsed):04d}s_cam{cam_idx + 1}.jpg"
                try:
                    ok_raw, raw_buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

                    # Quick per-face roll number lookup for labelling
                    snap_enrolled = enrolled_in_list if has_sir_list else enrolled
                    snap_ids      = list(snap_enrolled.keys())
                    snap_matrix   = (
                        np.array([snap_enrolled[r] for r in snap_ids], dtype=np.float32)
                        if snap_ids else None
                    )
                    face_labels = []
                    if snap_matrix is not None and len(snap_matrix) > 0 and len(detections) > 0:
                        # Build score matrix: (n_faces x n_enrolled)
                        det_embs   = np.array([d["embedding"] for d in detections], dtype=np.float32)
                        score_mat  = det_embs @ snap_matrix.T
                        # One-to-one Hungarian assignment — no two faces get same roll no
                        row_ind, col_ind = linear_sum_assignment(-score_mat)
                        assigned = {}
                        for r, c in zip(row_ind, col_ind):
                            if float(score_mat[r, c]) >= req.reviewThreshold:
                                assigned[r] = snap_ids[c]
                        for i in range(len(detections)):
                            face_labels.append(assigned.get(i, "?"))
                    else:
                        face_labels = ["?" for _ in detections]

                    annot = frame.copy()
                    img_h, img_w = annot.shape[:2]
                    for d, roll_label in zip(detections, face_labels):
                        x1, y1, x2, y2 = d["bbox"]
                        color = (0, 255, 0) if roll_label != "?" else (0, 165, 255)
                        cv2.rectangle(annot, (x1, y1), (x2, y2), color, 1)
                        # Fixed font — consistent, readable at wide-angle distances
                        font_scale = 0.35
                        thickness  = 1
                        pad = 2
                        (tw, th), _ = cv2.getTextSize(roll_label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
                        # Anchor label to left edge of face box; shift left if it goes off screen right
                        lx1 = x1
                        lx2 = lx1 + tw + pad * 2
                        if lx2 > img_w:
                            lx1 = max(0, img_w - tw - pad * 2)
                            lx2 = img_w
                        # Label above box; flip below only if touching top edge
                        if y1 - th - pad * 2 >= 2:
                            ly1 = y1 - th - pad * 2
                            ly2 = y1
                        else:
                            ly1 = y2
                            ly2 = y2 + th + pad * 2
                        cv2.rectangle(annot, (lx1, ly1), (lx2, ly2), color, -1)
                        cv2.putText(annot, roll_label,
                                    (lx1 + pad, ly2 - pad),
                                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), thickness,
                                    cv2.LINE_AA)
                    cv2.putText(annot,
                                f"t={int(elapsed)}s  faces={faces_this_frame}  cam={cam_idx + 1}",
                                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                                (0, 200, 255), 2, cv2.LINE_AA)
                    ok_annot, annot_buf = cv2.imencode('.jpg', annot, [cv2.IMWRITE_JPEG_QUALITY, 85])
            

                    if ok_raw and ok_annot:
                        yield {
                            "type":         "frame_snapshot",
                            "folder":       snap_folder_name,
                            "filename":     fname,
                            "cam":          cam_idx + 1,
                            "elapsed_sec":  round(elapsed, 1),
                            "faces_count":  faces_this_frame,
                            "raw_data":     base64.b64encode(raw_buf.tobytes()).decode('ascii'),
                            "annotated_data": base64.b64encode(annot_buf.tobytes()).decode('ascii'),
                        }
                        frame_snapshots.append({
                            "cam":         cam_idx + 1,
                            "elapsed_sec": round(elapsed, 1),
                            "faces_count": faces_this_frame,
                            "filename":    fname,
                            "folder":      snap_folder_name,
                        })
                except Exception:
                    logger.exception("Failed to encode frame snapshot at elapsed=%s", elapsed)

            yield {"type": "frame", "frame": frame_count, "faces": faces_this_frame,
                   "total_embs": len(all_embeddings), "elapsed": round(elapsed, 1),
                   "remaining": round(req.durationSec - elapsed, 1), "camera": cam_idx + 1}
    finally:
        reader.release()
        job["stop"].set()

    if not all_embeddings:
        yield {"type": "error", "message": "No faces detected during the recording."}
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
                attendance[roll_no] = {
                    "status": "absent", "avg_confidence": 0.0, "confidence_zone": "low",
                    "first_seen_sec": None, "detections": 0, "in_list": True, "flagged": False,
                }
 
    # ── Build cluster means once ───────────────────────────────────────────
    cluster_means = []
    cluster_meta  = []  # list of (cluster_id, indices)
 
    for cluster_id in unique_labels:
        indices      = np.where(labels == cluster_id)[0]
        cluster_embs = np.array([all_embeddings[i] for i in indices], dtype=np.float32)
        cluster_mean = cluster_embs.mean(axis=0)
        norm         = np.linalg.norm(cluster_mean)
        if norm == 0:
            continue
        cluster_mean /= norm
        cluster_means.append(cluster_mean)
        cluster_meta.append((cluster_id, indices))

    # AdaFace — average AdaFace vectors within these SAME cluster indices
    # (no re-clustering; DBSCAN above stays driven entirely by InsightFace).
    # Row index here matches cluster_means/cluster_meta's list position, so
    # it lines up with primary_matches for the shadow comparison below.
    # Empty whenever this wasn't the requested/enabled run (see run_adaface_shadow).
    adaface_cluster_rows = []
    if all_adaface_embeddings:
        for row_idx, (_cluster_id, indices) in enumerate(cluster_meta):
            vecs = [all_adaface_embeddings[i] for i in indices if all_adaface_embeddings[i] is not None]
            if not vecs:
                continue
            ada_mean = np.mean(np.array(vecs, dtype=np.float32), axis=0)
            ada_norm = np.linalg.norm(ada_mean)
            if ada_norm == 0:
                continue
            adaface_cluster_rows.append((row_idx, ada_mean / ada_norm))

    # ── Primary score matrix (Model Pipeline: mean | max_k | adaface | faiss) ──
    # Each branch produces the same (n_clusters, n_ids) shape so the Hungarian
    # assignment and every downstream consumer stay identical — only how the
    # scores are computed differs. A branch that can't produce a matrix at
    # run time cascades to the classic mean path with a logged warning.
    assign_ids, assign_matrix = None, None

    if effective_primary == "max_k":
        with state.max_k_config_lock:
            _primary_top_k = state.max_k_config["top_k"]
        topk_roster = {r: v for r, v in (req.enrolledEmbeddingsTopK or {}).items()
                       if r in match_enrolled}
        assign_ids, assign_matrix = _build_top_k_score_matrix(
            cluster_means, topk_roster, _primary_top_k)

    elif effective_primary == "adaface":
        with state.adaface_config_lock:
            _primary_top_k = state.adaface_config["top_k"]
        ada_topk = {r: v for r, v in (req.enrolledEmbeddingsAdafaceTopK or {}).items()
                    if r in match_enrolled}
        if not ada_topk:  # K=1 fallback from the mean AdaFace dict
            ada_topk = {r: [v] for r, v in (req.enrolledEmbeddingsAdaface or {}).items()
                        if r in match_enrolled}
        if adaface_cluster_rows:
            local_means = [m for _, m in adaface_cluster_rows]
            local_ids, local_matrix = _build_top_k_score_matrix(
                local_means, ada_topk, _primary_top_k)
            if local_ids is not None:
                # Expand back to full cluster height — clusters with no valid
                # AdaFace vectors score -1 everywhere (never assigned).
                assign_ids    = local_ids
                assign_matrix = np.full((len(cluster_means), len(local_ids)), -1.0,
                                        dtype=np.float32)
                for local_r, (orig_r, _) in enumerate(adaface_cluster_rows):
                    assign_matrix[orig_r, :] = local_matrix[local_r, :]

    elif effective_primary == "faiss":
        # Full-index top-k voting per cluster, folded into the same matrix
        # shape: matrix[r, roster_col] = vote score for roster hits only.
        # Hungarian then resolves duplicates (no optimality claim here —
        # scores exist only where the index voted, everything else is -1).
        with state.faiss_config_lock:
            _f_top_k     = state.faiss_config["top_k"]
            _f_threshold = state.faiss_config["recog_threshold"]
        if cluster_means and enrolled_ids:
            roster_index = {roll: i for i, roll in enumerate(enrolled_ids)}
            assign_ids    = enrolled_ids
            assign_matrix = np.full((len(cluster_means), len(enrolled_ids)), -1.0,
                                    dtype=np.float32)
            any_hit = False
            for r, cm in enumerate(cluster_means):
                roll, score = _recognize_face(
                    np.array(cm, dtype=np.float32),
                    state.faiss_index, state.vid_to_roll,
                    top_k=_f_top_k, threshold=_f_threshold,
                )
                if roll and roll in roster_index:
                    assign_matrix[r, roster_index[roll]] = score
                    any_hit = True
            if not any_hit:
                assign_ids, assign_matrix = None, None

    if effective_primary != "mean" and assign_ids is None:
        yield {"type": "stage",
               "message": f"⚠️ Primary model '{effective_primary}' produced no usable scores — falling back to mean"}
        fallback_reason   = fallback_reason or f"'{effective_primary}' produced no usable scores"
        effective_primary = "mean"

    if effective_primary == "mean" and cluster_means and len(enroll_matrix) > 0:
        assign_ids    = enrolled_ids
        assign_matrix = np.array(cluster_means, dtype=np.float32) @ enroll_matrix.T

    # ── One-to-one Hungarian assignment ───────────────────────────────────
    assigned_cluster_rows = set()  # row indices (into cluster_meta) with a valid assignment
    primary_matches = {}  # row index -> (roll_no, score), for the shadow comparisons below

    if cluster_means and assign_ids is not None and assign_matrix is not None and assign_matrix.size > 0:
        score_matrix = assign_matrix
        # shape: (n_clusters, n_ids)

        row_ind, col_ind = linear_sum_assignment(-score_matrix)  # negate → maximise similarity

        for r, c in zip(row_ind, col_ind):
            score   = float(score_matrix[r, c])
            roll_no = assign_ids[c]
            _, indices = cluster_meta[r]

            if score < req.reviewThreshold:
                continue  # below threshold → treat as unmatched
            if roll_no not in attendance:
                continue  # non-roster id (defensive — branches restrict to roster already)

            assigned_cluster_rows.add(r)
            primary_matches[r] = (roll_no, score)
            rec    = attendance[roll_no]
            status = "present" if score >= req.autoThreshold else "review"
            zone   = "high"    if score >= req.autoThreshold else "medium"
            n      = len(indices)
            prev_n, prev_avg = rec["detections"], rec["avg_confidence"]
            new_avg = ((prev_avg * prev_n) + (score * n)) / (prev_n + n)
            if rec["status"] == "absent" or (rec["status"] == "review" and status == "present"):
                rec["status"], rec["confidence_zone"] = status, zone
            rec["avg_confidence"] = round(new_avg, 4)
            rec["detections"]     = prev_n + n
            if rec["first_seen_sec"] is None:
                rec["first_seen_sec"] = round(float(all_timestamps[indices[0]]), 1)

            # ── Demographics: aggregate age/gender across this cluster's
            # detections, so a single noisy frame doesn't decide the value.
            # Gender → majority vote (most frequent value wins).
            # Age    → median of all valid readings (robust to outliers).
            cluster_demo = [all_demographics[i] for i in indices]
            ages    = [d["age"]    for d in cluster_demo if d.get("age")    is not None]
            genders = [d["gender"] for d in cluster_demo if d.get("gender") is not None]

            if ages:
                ages_sorted  = sorted(ages)
                median_age   = ages_sorted[len(ages_sorted) // 2]
                rec["age_samples"] = rec.get("age_samples", []) + ages
                rec["age"] = sorted(rec["age_samples"])[len(rec["age_samples"]) // 2]
            if genders:
                rec["gender_samples"] = rec.get("gender_samples", []) + genders
                rec["gender"] = max(set(rec["gender_samples"]), key=rec["gender_samples"].count)

    # ── Max-of-K shadow comparison (diagnostic only, Model Pipeline card) ──
    # Never touches `attendance` — purely reports how often scoring against
    # each student's top-K individual embeddings would have agreed with the
    # primary assignment above. Runs only on middle-of-period runs
    # (req.runShadows) and never when max-of-K is itself the primary.
    matching_comparison = None
    with state.max_k_config_lock:
        max_k_top_k = state.max_k_config["top_k"]
    if run_shadows and pipeline.get("shadow_max_k", False) and effective_primary != "max_k":
        enrolled_topk_raw = {
            roll_no: vecs for roll_no, vecs in (req.enrolledEmbeddingsTopK or {}).items()
            if roll_no in match_enrolled
        }
        try:
            matching_comparison = _max_k_shadow_comparison(
                cluster_means, cluster_meta, primary_matches,
                enrolled_topk_raw, max_k_top_k, req.reviewThreshold,
            )
        except Exception:
            logger.exception("Max-of-K shadow comparison failed — skipping")
        if matching_comparison is None:
            matching_comparison = {"enabled": True, "top_k": max_k_top_k, "skipped": True,
                                    "reason": "No cached top_k_embeddings yet for this roster."}
    else:
        matching_comparison = {"enabled": False}

    # ── FAISS shadow comparison (diagnostic only, Model Pipeline card) ──────
    # Never touches `attendance` — purely reports how often the FULL FAISS
    # index's top-k voting would have agreed with the primary assignment
    # above. Runs only on middle-of-period runs (req.runShadows) and never
    # when FAISS is itself the primary.
    faiss_comparison = None
    with state.faiss_config_lock:
        faiss_top_k          = state.faiss_config["top_k"]
        faiss_recog_threshold = state.faiss_config["recog_threshold"]
    if run_shadows and pipeline.get("shadow_faiss", False) and effective_primary != "faiss":
        try:
            faiss_comparison = _faiss_shadow_comparison(
                cluster_means, primary_matches, faiss_top_k, faiss_recog_threshold,
            )
        except Exception:
            logger.exception("FAISS shadow comparison failed — skipping")
        if faiss_comparison is None:
            faiss_comparison = {"enabled": True, "top_k": faiss_top_k, "skipped": True,
                                 "reason": "No FAISS index loaded, or no clusters/matches to compare."}
    else:
        faiss_comparison = {"enabled": False}

    # ── AdaFace shadow comparison (diagnostic only, Model Pipeline card) ────
    # Never touches `attendance` — purely reports how often AdaFace's
    # independent embedding space would have agreed with the primary
    # assignment above. Runs only on middle-of-period runs (req.runShadows),
    # never when AdaFace is itself the primary, and is a no-op if no AdaFace
    # ONNX model is loaded (adaface_cluster_rows stays empty — see need_adaface).
    adaface_comparison = None
    with state.adaface_config_lock:
        adaface_top_k          = state.adaface_config["top_k"]
        adaface_recog_threshold = state.adaface_config["recog_threshold"]
    if run_shadows and pipeline.get("shadow_adaface", False) and effective_primary != "adaface":
        enrolled_adaface_topk = {
            roll_no: vecs for roll_no, vecs in (req.enrolledEmbeddingsAdafaceTopK or {}).items()
            if roll_no in match_enrolled
        }
        try:
            adaface_comparison = _adaface_shadow_comparison(
                adaface_cluster_rows, primary_matches,
                enrolled_adaface_topk, adaface_top_k, adaface_recog_threshold,
            )
        except Exception:
            logger.exception("AdaFace shadow comparison failed — skipping")
        if adaface_comparison is None:
            adaface_comparison = {"enabled": True, "top_k": adaface_top_k, "skipped": True,
                                   "reason": "No cached AdaFace embeddings yet for this roster, "
                                             "or no AdaFace ONNX model loaded."}
    else:
        adaface_comparison = {"enabled": False}

    # ── Mean shadow comparison (diagnostic only, Model Pipeline card) ───────
    # Only meaningful when Mean is NOT the primary — runs the classic
    # mean-embedding Hungarian assignment and reports agreement with whatever
    # model actually decided attendance this run. Never touches `attendance`.
    mean_comparison = None
    if run_shadows and pipeline.get("shadow_mean", False) and effective_primary != "mean":
        try:
            mean_comparison = _mean_shadow_comparison(
                cluster_means, enrolled_ids, enroll_matrix,
                primary_matches, req.reviewThreshold,
            )
        except Exception:
            logger.exception("Mean shadow comparison failed — skipping")
        if mean_comparison is None:
            mean_comparison = {"enabled": True, "skipped": True,
                                "reason": "No mean enrolled embeddings or no clusters to compare."}
    else:
        mean_comparison = {"enabled": False}

    # ── Unmatched clusters ─────────────────────────────────────────────────
    unmatched_clusters = []
    for r, (cluster_id, indices) in enumerate(cluster_meta):
        if r not in assigned_cluster_rows:
            best_score = 0.0
            closest_roll_no = None
            if len(enroll_matrix) > 0:
                scores = np.array(cluster_means[r]) @ enroll_matrix.T
                best_idx = int(np.argmax(scores))
                best_score = float(scores[best_idx])
                closest_roll_no = enrolled_ids[best_idx]
            
            cluster_sorted = sorted(
                [(all_face_images[i], all_quality[i], all_timestamps[i], i) for i in indices],
                key=lambda x: x[1], reverse=True
            )
            
            failure_reason = "NO_MATCH_FOUND"
            if best_score > 0 and closest_roll_no:
                failure_reason = "LOW_CONFIDENCE"
            
            if len(cluster_sorted) > 0 and cluster_sorted[0][1] < 0.2:
                failure_reason = "POOR_QUALITY"

            crops_base64 = []
            for crop, quality, ts, idx in cluster_sorted[:5]:
                if crop.size > 0:
                    ok, buf = cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 95])
                    if ok:
                        crops_base64.append({
                            "data": base64.b64encode(buf.tobytes()).decode('ascii'),
                            "quality": round(quality, 4),
                            "timestamp": round(float(ts), 1)
                        })

            unmatched_clusters.append({
                "cluster_id": int(cluster_id),
                "detections": int(len(indices)),
                "best_score": round(best_score, 4),
                "first_seen": round(float(all_timestamps[indices[0]]), 1),
                "failureReason": failure_reason,
                "closestRollNo": closest_roll_no,
                "recognitionThreshold": req.reviewThreshold,
                "crops": crops_base64
            })
 
    present = sum(1 for v in attendance.values() if v["status"] == "present")
    review  = sum(1 for v in attendance.values() if v["status"] == "review")
    absent  = sum(1 for v in attendance.values() if v["status"] == "absent")
 
    # ── Flag not-in-list (Hungarian, only against unassigned clusters) ─────
    if has_sir_list and enrolled_not_in_list:
        not_in_list_ids    = list(enrolled_not_in_list.keys())
        not_in_list_matrix = np.array([enrolled_not_in_list[r] for r in not_in_list_ids], dtype=np.float32)
 
        # Only unassigned clusters can be flagged
        nil_cluster_means = [cluster_means[r] for r in range(len(cluster_meta))
                             if r not in assigned_cluster_rows]
        nil_cluster_meta  = [cluster_meta[r]  for r in range(len(cluster_meta))
                             if r not in assigned_cluster_rows]
 
        if nil_cluster_means and len(not_in_list_matrix) > 0:
            nil_score_matrix         = np.array(nil_cluster_means, dtype=np.float32) @ not_in_list_matrix.T
            nil_row_ind, nil_col_ind = linear_sum_assignment(-nil_score_matrix)
 
            for r, c in zip(nil_row_ind, nil_col_ind):
                score        = float(nil_score_matrix[r, c])
                flagged_roll = not_in_list_ids[c]
                _, indices   = nil_cluster_meta[r]
 
                if score >= req.autoThreshold:
                    attendance[flagged_roll] = {
                        "status":          "present",
                        "avg_confidence":  round(score, 4),
                        "confidence_zone": "high",
                        "first_seen_sec":  round(float(all_timestamps[indices[0]]), 1),
                        "detections":      int(len(indices)),
                        "in_list":         False,
                        "flagged":         True,
                    }
 
    yield {"type": "stage", "message": f"✅ {len(unique_labels)} clusters matched against {len(enrolled)} enrolled students"}

    # ── Strip internal working fields before emitting ───────────────────────
    # age_samples/gender_samples were only needed to compute the running
    # median/majority-vote during the assignment loop above.
    for rec in attendance.values():
        rec.pop("age_samples", None)
        rec.pop("gender_samples", None)
        rec.setdefault("age", None)
        rec.setdefault("gender", None)

 
    # ── Final result event ─────────────────────────────────────────────────
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
                # Which model actually decided attendance this run (Model
                # Pipeline card) — differs from the configured primary only
                # when prerequisites were missing and the run fell back.
                "primary_model":           effective_primary,
                "primary_fallback":        bool(fallback_reason),
                "primary_fallback_reason": fallback_reason,
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
                # Issue: liveness/anti-spoofing — count of face detections
                # rejected as likely printed-photo/screen-replay spoofs during
                # this run. Surfaced so dept-admins can see spoof attempts
                # were caught rather than silently dropped.
                "liveness_rejected":     int(get_liveness_rejection_count()),
            },
            "unmatched_clusters": unmatched_clusters,
            "frame_snapshots":    frame_snapshots,
            "snapshot_folder":    snap_folder_name if frame_snapshots else "",
            # Diagnostic-only side-by-side comparison against max-of-K
            # embedding scoring (state.max_k_config, ML Fine Tuning page).
            # Never factored into `attendance` above.
            "matching_comparison": matching_comparison,
            # Same, but against the full FAISS index (state.faiss_config
            # ["shadow_enabled"], ML Fine Tuning page).
            "faiss_comparison": faiss_comparison,
            # Same, but against AdaFace's independent embedding space
            # (state.adaface_config["enabled"], ML Fine Tuning page).
            "adaface_comparison": adaface_comparison,
            # Classic mean-embedding assignment as a shadow — only populated
            # when a different model is the primary (Model Pipeline card).
            "mean_comparison": mean_comparison,
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

    job_id, job = _new_job()

    def generate():
        def sse(obj):
            return f"data: {json.dumps(obj)}\n\n"
        yield sse({"type": "job_id", "jobId": job_id})
        try:
            for event in _attendance_pipeline(req, job):
                yield sse(event)
        finally:
            _finish_job(job_id, job)

    return StreamingResponse(
        generate(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no",
                 "Content-Type": "text/event-stream; charset=utf-8"})


@router.post("/run-attendance-rtsp-sync")
def run_attendance_rtsp_sync(req: RTSPAttendanceRequest):
    """
    Synchronous JSON endpoint — called by attendanceSessionController.js
    and autoAttendanceScheduler.js (Node.js) via axios.post().
    Blocks until done, returns plain JSON.

    Since this is a single request/response (no incremental streaming to
    the caller), every "frame_snapshot" event emitted by the pipeline is
    buffered here and returned in the response under "frame_files" — Node
    decodes the base64 payloads and writes them to server/ml-data/ itself.
    """
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")

    job_id, job = _new_job()
    result_payload = None
    error_message  = None
    stages         = []
    frame_files    = []

    try:
        for event in _attendance_pipeline(req, job):
            t = event.get("type")
            if t == "done":
                result_payload = event.get("result")
            elif t == "error":
                error_message = event.get("message")
            elif t == "stage":
                stages.append(event.get("message", ""))
            elif t == "frame_snapshot":
                frame_files.append(event)
            # "frame" events are dropped — too verbose for a sync response
    finally:
        _finish_job(job_id, job)

    if error_message:
        raise HTTPException(status_code=422, detail=error_message)
    if result_payload is None:
        raise HTTPException(status_code=500, detail="Pipeline finished without a result")

    return JSONResponse(content={**result_payload, "stages": stages, "frame_files": frame_files})


# ── Per-job attendance preview (MJPEG, one stream per parallel run) ───────────

@router.get("/attendance-frame-preview")
def attendance_frame_preview(jobId: str = ""):
    """MJPEG stream for a specific parallel attendance job."""
    job = _jobs.get(jobId)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or already finished")

    def generate():
        try:
            while not job["stop"].is_set():
                with job["lock"]:
                    frame = job["frame"]
                if frame:
                    yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n'
                    time.sleep(0.033)
                else:
                    time.sleep(0.05)
        except GeneratorExit:
            pass

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Preview helper (ground-truth acquisition) ─────────────────────────────────

class PreviewRequest(BaseModel):
    rtspUrl: str

@router.post("/start-preview")
def start_preview(req: PreviewRequest):
    job_id, job = _new_job()
    placeholder = np.zeros((540, 960, 3), dtype=np.uint8)
    cv2.putText(placeholder, "Connecting to stream...", (300, 270),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (80, 80, 80), 2, cv2.LINE_AA)
    _, buf = cv2.imencode('.jpg', placeholder, [cv2.IMWRITE_JPEG_QUALITY, 70])
    with job["lock"]:
        job["frame"] = buf.tobytes()
    return {"status": "ok", "jobId": job_id}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cluster(embeddings, threshold, min_samples):
    eps = float(np.sqrt(2.0 * (1.0 - threshold)))
    clustering = _DBSCAN(eps=eps, min_samples=min_samples,
                          metric="euclidean", algorithm="ball_tree", n_jobs=-1).fit(np.array(embeddings))
    labels        = clustering.labels_
    unique_labels = sorted(set(labels) - {-1})
    return labels, unique_labels


def _load_existing_folders_from_payload(existing_folders, existing_mean_embs):
    """
    Same purpose as the old disk-based _load_existing_folders, but consumes
    photo bytes Node already sent (req.existingFolders) instead of reading
    ground_truth/ off local disk — this process may run on a separate
    machine from the Node server.
    """
    for folder in existing_folders:
        folder_name = folder.get("folderName")
        photos      = folder.get("photos") or []
        if not photos:
            continue
        folder_embs, folder_weights = [], []
        for photo in photos[:5]:
            try:
                img_bytes = base64.b64decode(photo.get("data", ""))
                img_arr   = np.frombuffer(img_bytes, dtype=np.uint8)
                img       = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
            except Exception:
                img = None
            if img is None:
                continue
            with state.face_lock:
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


def _select_diverse(pool, stored_embs, new_embs, n):
    """
    Greedy farthest-point selection from pool (list of (filename, score) tuples).
    Picks n images that maximise minimum pairwise cosine distance, using
    embedding vectors from stored_embs (persisted across DBSCAN passes) and
    new_embs (from this pass). Falls back to quality order if embeddings are
    unavailable.
    """
    all_embs = {**stored_embs, **new_embs}
    filenames = [f for f, _ in pool]
    available = [f for f in filenames if f in all_embs]

    # Fallback: not enough embeddings yet — use quality rank
    if len(available) < 2:
        return filenames[:n]

    # Anchor = highest-quality image that has an embedding (pool is quality-sorted)
    selected = [available[0]]
    while len(selected) < n and len(selected) < len(available):
        best_f, best_min_d = None, -1.0
        for f in available:
            if f in selected:
                continue
            emb_f = all_embs[f]
            # Minimum cosine distance to any already-selected image
            min_d = min(
                1.0 - float(np.dot(emb_f, all_embs[s]))
                for s in selected
            )
            if min_d > best_min_d:
                best_min_d, best_f = min_d, f
        if best_f:
            selected.append(best_f)

    # Append any quality-ordered filenames that have no embedding
    for f in filenames:
        if len(selected) >= n:
            break
        if f not in selected:
            selected.append(f)

    return selected[:n]


def _save_clusters(labels, unique_labels, all_embeddings, all_face_images,
                    all_timestamps, all_quality, batch_dir, existing_mean_embs,
                    next_serial, target_per_person, person_counts,
                    cluster_threshold, folder_state, top_n=10, embed_n=5):
    """
    Returns (next_serial, updated, crops_to_emit).
    crops_to_emit is a list of SSE event dicts (mkdir, crop_save, info_save, file_delete).
    Node.js intercepts these and saves the files — Python writes nothing to disk here.
    """
    updated       = {}
    crops_to_emit = []
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
        else:
            folder_name = f"person_{next_serial:03d}"
            next_serial += 1
            crops_to_emit.append({"type": "mkdir", "folder": folder_name})

        existing_mean_embs[folder_name] = cluster_mean
        current_count = len(folder_state.get(folder_name, {}).get("scores", {}))
        if current_count >= target_per_person:
            continue

        still_need      = target_per_person - current_count
        cluster_sorted  = sorted(
            [(all_face_images[i], all_quality[i], all_timestamps[i], i) for i in indices],
            key=lambda x: x[1], reverse=True)[:still_need]

        new_scores      = {}
        new_embs        = {}   # filename → L2-normalised embedding for diversity selection
        existing_scores = folder_state.get(folder_name, {}).get("scores", {})
        for (crop, quality, ts, idx) in cluster_sorted:
            if crop.size == 0:
                continue
            fname = f"gt_{ts:.1f}s_f{idx}.jpg"
            if fname not in existing_scores:
                _, buf = cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 100])
                crops_to_emit.append({
                    "type":     "crop_save",
                    "folder":   folder_name,
                    "filename": fname,
                    "data":     base64.b64encode(buf.tobytes()).decode('ascii'),
                })
                new_scores[fname] = round(quality, 4)
                new_embs[fname]   = all_embeddings[idx]  # already L2-normalised

        if not new_scores:
            continue

        _update_info_inmem(folder_name, new_scores, folder_state, crops_to_emit,
                           top_n, embed_n, new_embs=new_embs)
        new_count = len(folder_state.get(folder_name, {}).get("scores", {}))
        person_counts[folder_name] = new_count
        updated[folder_name]       = new_count

    return next_serial, updated, crops_to_emit


def _load_folder_state_from_payload(existing_folders):
    """
    Same purpose as the old disk-based _load_folder_state, but consumes the
    infoJson/photos Node already sent (req.existingFolders) instead of
    reading _info.json off local disk.
    """
    folder_state = {}
    for folder in existing_folders:
        folder_name = folder.get("folderName")
        info_json   = folder.get("infoJson") or {}
        photos      = folder.get("photos") or []
        scores = {k: v for k, v in (info_json.get("scores") or {}).items()}
        if not scores:
            scores = {p.get("filename"): 0.5 for p in photos if p.get("filename")}
        folder_state[folder_name] = {"scores": scores}
    return folder_state


def _update_info_inmem(folder_name, new_scores, folder_state, crops_to_emit,
                       top_n=10, embed_n=5, new_embs=None):
    """
    Update folder_state in memory and append info_save / file_delete events.
    Embeddings (new_embs: filename → np.ndarray) are stored in folder_state so
    that diversity selection can draw on all frames seen so far, not just the
    current DBSCAN pass.
    """
    fs = folder_state.setdefault(folder_name, {"scores": {}, "embs": {}})
    fs["scores"].update(new_scores)
    if new_embs:
        fs.setdefault("embs", {}).update(new_embs)

    all_scored = sorted(fs["scores"].items(), key=lambda x: x[1], reverse=True)

    if len(all_scored) > top_n:
        for fname, _ in all_scored[top_n:]:
            crops_to_emit.append({"type": "file_delete", "folder": folder_name, "filename": fname})
            fs["scores"].pop(fname, None)
            fs.get("embs", {}).pop(fname, None)
        all_scored = all_scored[:top_n]

    # Select embed_n images by diversity (greedy farthest-point in embedding
    # space) rather than pure quality rank, so different angles are preferred.
    embed_files = _select_diverse(all_scored, fs.get("embs", {}), {}, embed_n)
    embed_set   = set(embed_files)

    crops_to_emit.append({
        "type":   "info_save",
        "folder": folder_name,
        "info": {
            "embedding_files": embed_files,
            "backup_files":    [f for f, _ in all_scored if f not in embed_set],
            "scores":          dict(fs["scores"]),
        },
    })

# ══════════════════════════════════════════════════════════════════════════════
# RTSP VIDEO RECORDING ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

import subprocess
import shutil

# Override via RECORDINGS_DIR env var to control save path without code changes.
# Falls back to server/recordings/ relative to this file.
RECORDINGS_DIR = os.environ.get(
    "RECORDINGS_DIR",
    os.path.join(BASE_DIR, "..", "server", "recordings"),
)
os.makedirs(RECORDINGS_DIR, exist_ok=True)

_recordings: dict = {}
_rec_lock = threading.Lock()

class RecordRequest(BaseModel):
    rtspUrl: str
    label:   str
    durationSec: int = 0
    # "video+audio" | "video" | "audio"
    format: str = "video+audio"

class StopRecordRequest(BaseModel):
    recordingId: str

@router.post("/start-recording")
def start_recording(req: RecordRequest):
    rec_id     = str(uuid.uuid4())
    safe_label = re.sub(r'[^\w\-]', '_', req.label)
    ts         = time.strftime('%Y%m%d_%H%M%S')
    filename   = f"{safe_label}_{ts}.mp4"
    out_path   = os.path.join(RECORDINGS_DIR, filename)

    fmt = req.format if req.format in ("video+audio", "video", "audio") else "video+audio"

    cmd = ["ffmpeg", "-y", "-rtsp_transport", "tcp", "-i", req.rtspUrl]

    if fmt == "video+audio":
        cmd += ["-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart"]
    elif fmt == "video":
        cmd += ["-c:v", "copy", "-an", "-movflags", "+faststart"]
    else:  # audio only
        cmd += ["-vn", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart"]

    if req.durationSec > 0:
        cmd += ["-t", str(req.durationSec)]
    cmd.append(out_path)

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with _rec_lock:
        _recordings[rec_id] = {
            "proc": proc, "path": out_path,
            "filename": filename, "label": req.label,
            "started": time.time(), "rtspUrl": req.rtspUrl,
            "format": fmt,
        }
    return {"recordingId": rec_id, "filename": filename, "format": fmt, "status": "recording"}


@router.post("/stop-recording")
def stop_recording_ep(req: StopRecordRequest):
    with _rec_lock:
        rec = _recordings.get(req.recordingId)
    if not rec:
        raise HTTPException(status_code=404, detail="Recording not found")
    proc = rec["proc"]
    if proc.poll() is None:
        try:
            proc.stdin.write(b'q\n')   # graceful FFmpeg quit → writes moov atom
            proc.stdin.flush()
            proc.wait(timeout=10)
        except Exception:
            proc.kill()
    size = 0
    try:
        size = os.path.getsize(rec["path"])
    except Exception:
        pass
    return {"recordingId": req.recordingId, "filename": rec["filename"],
            "status": "done", "sizeBytes": size}


@router.get("/recordings")
def list_recordings_ep():
    with _rec_lock:
        result = []
        for rec_id, rec in _recordings.items():
            running = rec["proc"].poll() is None
            size = 0
            try: size = os.path.getsize(rec["path"])
            except: pass
            result.append({
                "recordingId": rec_id,
                "filename":    rec["filename"],
                "label":       rec["label"],
                "started":     rec["started"],
                "status":      "recording" if running else "done",
                "sizeBytes":   size,
                "format":      rec.get("format", "video+audio"),
            })
    return result


def _recording_path(filename: str) -> str:
    # Recordings live wherever RECORDINGS_DIR points on THIS (the ML service's)
    # machine — Node has no local copy, so it must stream bytes from here
    # rather than reading its own disk.
    safe = os.path.basename(filename)  # prevent path traversal
    path = os.path.join(RECORDINGS_DIR, safe)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Recording not found")
    return path


@router.get("/recordings/{filename}/download")
def download_recording(filename: str):
    path = _recording_path(filename)
    return FileResponse(path, media_type="video/mp4", filename=os.path.basename(path))


@router.get("/recordings/{filename}/audio")
def download_recording_audio(filename: str):
    path = _recording_path(filename)
    audio_name = re.sub(r"\.mp4$", ".mp3", os.path.basename(path))

    def generate():
        proc = subprocess.Popen(
            ["ffmpeg", "-i", path, "-vn", "-acodec", "mp3", "-q:a", "2", "-f", "mp3", "pipe:1"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        )
        try:
            while True:
                chunk = proc.stdout.read(65536)
                if not chunk:
                    break
                yield chunk
        finally:
            proc.stdout.close()
            proc.wait()

    return StreamingResponse(
        generate(),
        media_type="audio/mpeg",
        headers={"Content-Disposition": f'attachment; filename="{audio_name}"'},
    )


# ═══════════════════════════════════════════════════════════════════════════
# Liveness / anti-spoofing — runtime config (ML Fine Tuning page)
# ═══════════════════════════════════════════════════════════════════════════
#
# Backs the dropdown threshold selectors + enable/disable toggle on the
# new "ML Fine Tuning" admin page. Reads/writes state.liveness_config,
# persisted to ml-data/liveness_config.json via liveness_config_store.py
# so changes survive a server restart. clustering_service.py reads this
# dict fresh on every face detection — no restart needed after a change.

class LivenessConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    heuristic_threshold: Optional[float] = None
    onnx_threshold: Optional[float] = None
    save_rejected_crops: Optional[bool] = None


@router.get("/liveness-config")
def get_liveness_config_ep():
    """Current liveness config + whether an ONNX model is actually loaded."""
    with state.liveness_config_lock:
        config = dict(state.liveness_config)
    return {
        **config,
        "onnx_model_loaded": state.liveness_session is not None,
        "rejected_this_run": clustering_service.get_liveness_rejection_count(),
    }


@router.post("/liveness-config")
def update_liveness_config_ep(req: LivenessConfigUpdate):
    """
    Partial update — only fields present in the request body are changed.
    Validates threshold ranges before applying so a typo from the frontend
    (e.g. a stray "1.5") can't silently break detection.
    """
    updates = req.dict(exclude_none=True)

    for key in ("heuristic_threshold", "onnx_threshold"):
        if key in updates and not (0.0 <= updates[key] <= 1.0):
            return JSONResponse(
                status_code=400,
                content={"error": f"{key} must be between 0.0 and 1.0, got {updates[key]}"},
            )

    new_config = liveness_config_store.update_liveness_config(updates)
    logger.info(f"[LivenessConfig] Updated: {updates} → {new_config}")
    return {
        **new_config,
        "onnx_model_loaded": state.liveness_session is not None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# GT Acquisition config  (ML Fine Tuning page — GT Acquisition section)
# ═══════════════════════════════════════════════════════════════════════════

class GTConfigUpdate(BaseModel):
    frame_skip:             Optional[int]   = None
    target_imgs_per_person: Optional[int]   = None
    cluster_threshold:      Optional[float] = None
    min_samples:            Optional[int]   = None
    det_size:               Optional[int]   = None
    merge_threshold:        Optional[float] = None
    nms_iou_thresh:         Optional[float] = None
    det_score_floor:        Optional[float] = None
    new_person_timeout:     Optional[int]   = None
    top_n:                  Optional[int]   = None
    embed_n:                Optional[int]   = None


@router.get("/gt-config")
def get_gt_config_ep():
    with state.gt_config_lock:
        return dict(state.gt_config)


@router.post("/gt-config")
def update_gt_config_ep(req: GTConfigUpdate):
    updates = req.dict(exclude_none=True)

    # Validate ranges
    float_ranges = {
        "cluster_threshold": (0.3, 0.9),
        "merge_threshold":   (0.5, 0.95),
        "nms_iou_thresh":    (0.1, 0.7),
        "det_score_floor":   (0.3, 0.8),
    }
    int_ranges = {
        "frame_skip":             (1, 60),
        "target_imgs_per_person": (3, 50),
        "min_samples":            (2, 15),
        "new_person_timeout":     (15, 300),
        "top_n":                  (5, 30),
        "embed_n":                (3, 15),
    }
    for key, (lo, hi) in float_ranges.items():
        if key in updates and not (lo <= updates[key] <= hi):
            return JSONResponse(status_code=400,
                content={"error": f"{key} must be {lo}–{hi}, got {updates[key]}"})
    for key, (lo, hi) in int_ranges.items():
        if key in updates and not (lo <= updates[key] <= hi):
            return JSONResponse(status_code=400,
                content={"error": f"{key} must be {lo}–{hi}, got {updates[key]}"})
    if "det_size" in updates and updates["det_size"] not in (320, 640):
        return JSONResponse(status_code=400,
            content={"error": "det_size must be 320 or 640"})
    # embed_n must not exceed top_n
    new_top_n   = updates.get("top_n",   state.gt_config["top_n"])
    new_embed_n = updates.get("embed_n", state.gt_config["embed_n"])
    if new_embed_n > new_top_n:
        return JSONResponse(status_code=400,
            content={"error": f"embed_n ({new_embed_n}) cannot exceed top_n ({new_top_n})"})

    with state.gt_config_lock:
        state.gt_config.update(updates)
        cfg = dict(state.gt_config)

    logger.info(f"[GTConfig] Updated: {updates} → {cfg}")
    return cfg


# ═══════════════════════════════════════════════════════════════════════════
# FAISS recognition config  (ML Fine Tuning page — FAISS Recognition Thresholds)
# ═══════════════════════════════════════════════════════════════════════════
# Backs the live tracked-attendance recognition pipeline (faiss_utils.py,
# tracked_routes.py, institute_identification_routes.py). Persisted to
# ml-data/faiss_config.json via faiss_config_store.py so changes survive a
# restart — those modules read state.faiss_config fresh on every recognition
# call, so a change here takes effect on the very next detection.

class FaissConfigUpdate(BaseModel):
    top_k:               Optional[int]   = None
    recog_threshold:      Optional[float] = None
    reverify_high_score:  Optional[float] = None
    reverify_high_ttl:    Optional[float] = None
    reverify_med_score:   Optional[float] = None
    reverify_med_ttl:     Optional[float] = None
    reverify_low_score:   Optional[float] = None
    reverify_low_ttl:     Optional[float] = None
    shadow_enabled:       Optional[bool]  = None


@router.get("/faiss-config")
def get_faiss_config_ep():
    with state.faiss_config_lock:
        return dict(state.faiss_config)


@router.post("/faiss-config")
def update_faiss_config_ep(req: FaissConfigUpdate):
    updates = req.dict(exclude_none=True)

    if "top_k" in updates and not (1 <= updates["top_k"] <= 50):
        return JSONResponse(status_code=400,
            content={"error": f"top_k must be 1–50, got {updates['top_k']}"})
    if "recog_threshold" in updates and not (0.0 <= updates["recog_threshold"] <= 1.0):
        return JSONResponse(status_code=400,
            content={"error": f"recog_threshold must be 0.0–1.0, got {updates['recog_threshold']}"})
    for key in ("reverify_high_score", "reverify_med_score", "reverify_low_score"):
        if key in updates and not (0.0 <= updates[key] <= 1.0):
            return JSONResponse(status_code=400,
                content={"error": f"{key} must be 0.0–1.0, got {updates[key]}"})
    for key in ("reverify_high_ttl", "reverify_med_ttl", "reverify_low_ttl"):
        if key in updates and updates[key] < 0:
            return JSONResponse(status_code=400,
                content={"error": f"{key} must be >= 0, got {updates[key]}"})

    # Cross-field: score tiers must stay strictly ordered high > med > low,
    # otherwise faiss_utils._get_reverify_interval()'s cascading if/elif
    # would silently pick the wrong tier.
    high = updates.get("reverify_high_score", state.faiss_config["reverify_high_score"])
    med  = updates.get("reverify_med_score",  state.faiss_config["reverify_med_score"])
    low  = updates.get("reverify_low_score",  state.faiss_config["reverify_low_score"])
    if not (high > med > low):
        return JSONResponse(status_code=400,
            content={"error": f"Score tiers must satisfy high > med > low, got {high} > {med} > {low}"})

    new_config = faiss_config_store.update_faiss_config(updates)
    logger.info(f"[FaissConfig] Updated: {updates} → {new_config}")
    return new_config


# ═══════════════════════════════════════════════════════════════════════════
# Max-of-K shadow comparison config  (ML Fine Tuning page)
# ═══════════════════════════════════════════════════════════════════════════
# Controls the optional shadow comparison run inside _attendance_pipeline
# (Hungarian batch-matching, RTSP attendance). When enabled, every batch
# attendance run additionally scores each detected face cluster against
# enrolled students' top-K individually stored embeddings (max-similarity)
# and reports agreement with the primary mean-embedding assignment — purely
# for tuning/comparison, never affecting the actual attendance decision.

class MaxKConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    top_k:   Optional[int]  = None


@router.get("/max-k-config")
def get_max_k_config_ep():
    with state.max_k_config_lock:
        return dict(state.max_k_config)


@router.post("/max-k-config")
def update_max_k_config_ep(req: MaxKConfigUpdate):
    updates = req.dict(exclude_none=True)

    if "top_k" in updates and not (1 <= updates["top_k"] <= 10):
        return JSONResponse(status_code=400,
            content={"error": f"top_k must be 1–10, got {updates['top_k']}"})

    new_config = max_k_config_store.update_max_k_config(updates)
    logger.info(f"[MaxKConfig] Updated: {updates} → {new_config}")
    return new_config


# ═══════════════════════════════════════════════════════════════════════════
# AdaFace shadow comparison config  (ML Fine Tuning page)
# ═══════════════════════════════════════════════════════════════════════════
# Controls the optional AdaFace shadow comparison inside _attendance_pipeline
# — an entirely independent face-recognition model (see adaface_utils.py),
# never affecting the primary mean-embedding (InsightFace) assignment. Off by
# default, and a no-op even when enabled if no AdaFace ONNX model is loaded.

class AdafaceConfigUpdate(BaseModel):
    enabled:         Optional[bool]  = None
    recog_threshold: Optional[float] = None
    top_k:           Optional[int]   = None


@router.get("/adaface-config")
def get_adaface_config_ep():
    with state.adaface_config_lock:
        config = dict(state.adaface_config)
    return {**config, "model_loaded": state.adaface_session is not None}


@router.post("/adaface-config")
def update_adaface_config_ep(req: AdafaceConfigUpdate):
    updates = req.dict(exclude_none=True)

    if "top_k" in updates and not (1 <= updates["top_k"] <= 10):
        return JSONResponse(status_code=400,
            content={"error": f"top_k must be 1–10, got {updates['top_k']}"})
    if "recog_threshold" in updates and not (0.0 <= updates["recog_threshold"] <= 1.0):
        return JSONResponse(status_code=400,
            content={"error": f"recog_threshold must be 0.0–1.0, got {updates['recog_threshold']}"})

    new_config = adaface_config_store.update_adaface_config(updates)
    logger.info(f"[AdafaceConfig] Updated: {updates} → {new_config}")
    return new_config


# ═══════════════════════════════════════════════════════════════════════════
# Model Pipeline config  (Model Pipeline card, ML Fine Tuning page)
# ═══════════════════════════════════════════════════════════════════════════
# Which model's assignment DECIDES attendance (primary) and which run as
# diagnostic middle-of-period shadow comparisons — see state.pipeline_config.

class PipelineConfigUpdate(BaseModel):
    primary:        Optional[str]  = None
    shadow_mean:    Optional[bool] = None
    shadow_max_k:   Optional[bool] = None
    shadow_faiss:   Optional[bool] = None
    shadow_adaface: Optional[bool] = None


@router.get("/pipeline-config")
def get_pipeline_config_ep():
    with state.pipeline_config_lock:
        config = dict(state.pipeline_config)
    # Readiness hints so the UI can warn before a primary choice that would
    # just fall back to mean at run time.
    return {
        **config,
        "adaface_model_loaded": state.adaface_session is not None,
        "faiss_index_loaded":   state.faiss_index is not None,
    }


@router.post("/pipeline-config")
def update_pipeline_config_ep(req: PipelineConfigUpdate):
    updates = req.dict(exclude_none=True)

    if "primary" in updates and updates["primary"] not in pipeline_config_store.PRIMARY_CHOICES:
        return JSONResponse(status_code=400,
            content={"error": f"primary must be one of {list(pipeline_config_store.PRIMARY_CHOICES)}, "
                              f"got {updates['primary']!r}"})

    new_config = pipeline_config_store.update_pipeline_config(updates)
    logger.info(f"[PipelineConfig] Updated: {updates} → {new_config}")
    return {
        **new_config,
        "adaface_model_loaded": state.adaface_session is not None,
        "faiss_index_loaded":   state.faiss_index is not None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# Face Detector config  (Face Detector card, ML Fine Tuning page)
# ═══════════════════════════════════════════════════════════════════════════
# Which detection model the shared FaceAnalysis instance runs: SCRFD-10G
# (buffalo_l's built-in det_10g.onnx, the default) or an optional RetinaFace
# ONNX. Detection-only swap — embeddings/recognition are untouched, since
# both detectors hand over the same bboxes + 5-point landmarks contract.

class DetectorConfigUpdate(BaseModel):
    active: Optional[str] = None   # scrfd | retinaface


@router.get("/detector-config")
def get_detector_config_ep():
    with state.detector_config_lock:
        config = dict(state.detector_config)
    return {
        **config,
        "retinaface_model_loaded": state.retinaface_det_model is not None,
    }


@router.post("/detector-config")
def update_detector_config_ep(req: DetectorConfigUpdate):
    updates = req.dict(exclude_none=True)

    if "active" in updates:
        if updates["active"] not in detector_config_store.DETECTOR_CHOICES:
            return JSONResponse(status_code=400,
                content={"error": f"active must be one of {list(detector_config_store.DETECTOR_CHOICES)}, "
                                  f"got {updates['active']!r}"})
        if updates["active"] == "retinaface" and state.retinaface_det_model is None:
            return JSONResponse(status_code=400,
                content={"error": "RetinaFace ONNX is not loaded on the ML machine — "
                                  "drop it at models/retinaface.onnx (see README_RETINAFACE.md) "
                                  "and restart the service first."})

    new_config = detector_config_store.update_detector_config(updates)
    detector_utils.apply_active_detector()
    logger.info(f"[DetectorConfig] Updated: {updates} → {new_config}")
    return {
        **new_config,
        "retinaface_model_loaded": state.retinaface_det_model is not None,
    }


def _parse_dept_from_filename(fname: str) -> str:
    """
    Extract the dept tag from a rejected-crop filename.
    New format:  {ts_ms}_{DEPT}_{method}{score}_det{score}.jpg
    Old format:  {ts_ms}_{method}{score}_det{score}.jpg  (no dept)
    """
    stem = fname.rsplit(".", 1)[0]          # strip .jpg
    parts = stem.split("_")
    if len(parts) < 2:
        return ""
    # If parts[1] starts with a known method prefix it's the old format
    if parts[1].startswith(("heur", "onnx")):
        return ""
    return parts[1]


@router.get("/liveness-rejected-samples")
def list_liveness_rejected_samples(limit: int = 50, dept: str = ""):
    """
    Recent rejected-crop filenames (and a base64 thumbnail of each) for the
    ML Fine Tuning page's accuracy-review panel.  Optionally filtered by
    the dept tag encoded in the filename (pass dept= query param).
    Also returns the full list of depts seen across all saved files.
    """
    rejected_dir = clustering_service.LIVENESS_REJECTED_DIR
    if not os.path.isdir(rejected_dir):
        return {"samples": [], "total": 0, "depts": []}

    all_files = sorted(
        (f for f in os.listdir(rejected_dir) if f.lower().endswith(".jpg")),
        reverse=True,  # ms-timestamp prefix → newest first
    )

    # Collect unique dept tags for the filter dropdown
    depts = sorted({d for d in (_parse_dept_from_filename(f) for f in all_files) if d})

    # Apply dept filter when requested
    if dept:
        files = [f for f in all_files if _parse_dept_from_filename(f) == dept]
    else:
        files = all_files

    total = len(files)
    samples = []
    for fname in files[:limit]:
        try:
            with open(os.path.join(rejected_dir, fname), "rb") as fh:
                b64 = base64.b64encode(fh.read()).decode("ascii")
            samples.append({
                "filename": fname,
                "image": f"data:image/jpeg;base64,{b64}",
                "dept": _parse_dept_from_filename(fname),
            })
        except Exception:
            continue

    return {"samples": samples, "total": total, "depts": depts}
