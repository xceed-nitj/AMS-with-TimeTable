# ground_truth_routes.py
# Ground-truth and student management endpoints:
#   GET  /enrolled-students
#   POST /build-embeddings            (SSE via subprocess)
#   POST /build-embeddings-sync
#   POST /assign-rollno
#   POST /update-student-embedding
#   GET  /student-ground-truth/{batch_name}/{roll_no}

import os
import re
import json
import pickle
import sys
import subprocess
import logging
import base64

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse

import state
from models import (
    BuildEmbeddingsRequest,
    AssignRollNoRequest,
    UpdateEmbeddingRequest,
    PhotoBytes,
)
from pydantic import BaseModel
from typing import List, Optional
from clustering_service import _detect_faces_tiled, _build_ui_mask

logger = logging.getLogger("ml_service.ground_truth_routes")
router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH  = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings_db.pkl")
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ml-data", "ground_truth")

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# ─── ERP Models ───────────────────────────────────────────────────────────────
# All ERP embedding endpoints below operate purely on bytes Node sends —
# the ML service never reads/writes server/ml-data/erp_photos or
# server/ml-data/embeddings/erp directly, since it may run on a machine
# with no access to that filesystem. Node (which owns those directories)
# reads/writes the actual files; Python only computes embeddings and
# returns updated pickle bytes for Node to persist. The saved .pkl format —
# {roll_no: {"name", "embedding", "num_photos"}} — is unchanged.

class ERPStudentPhotos(BaseModel):
    roll_no: str
    photos: List[PhotoBytes] = []

class ERPSyncRequest(BaseModel):
    existing_pkl_data: Optional[str] = None  # base64 of the current .pkl, if one exists
    students: List[ERPStudentPhotos] = []

class ERPRenameRequest(BaseModel):
    pkl_data: str  # base64 of the current .pkl — required, rename is a no-op without one
    old_roll_no: str
    new_roll_no: str

class ERPDeleteRequest(BaseModel):
    pkl_data: str  # base64 of the current .pkl — required, delete is a no-op without one
    roll_no: str

class ERPInspectRequest(BaseModel):
    pkl_data: Optional[str] = None  # base64 of a .pkl, or None if it doesn't exist yet


# ─── Enrolled Students ────────────────────────────────────────────────────────

@router.get("/enrolled-students")
def enrolled_students():
    students = []
    if os.path.exists(CLIENT_GROUND_TRUTH):
        for folder in sorted(os.listdir(CLIENT_GROUND_TRUTH)):
            fp = os.path.join(CLIENT_GROUND_TRUTH, folder)
            if not os.path.isdir(fp):
                continue
            parts      = folder.split("_", 1)
            student_id = parts[0]
            name       = parts[1].replace("_", " ") if len(parts) > 1 else folder
            photos     = [f for f in os.listdir(fp)
                          if f.lower().endswith((".jpg", ".jpeg", ".png"))]
            students.append({
                "student_id":     student_id,
                "name":           name,
                "folder":         folder,
                "photo_count":    len(photos),
                "enrolled_in_db": student_id in state.embeddings_db,
                "first_photo":    f"/student-photos/{folder}/{photos[0]}" if photos else None,
            })
    return {
        "total":         len(students),
        "enrolled_in_db": sum(1 for s in students if s["enrolled_in_db"]),
        "students":      students,
    }


# ─── Build Embeddings (sync) ──────────────────────────────────────────────────

@router.post("/build-embeddings-sync")
async def build_embeddings_sync(req: BuildEmbeddingsRequest):
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _build_embeddings_sync, req)

def _decode_photo(photo) -> np.ndarray:
    """Decode a base64-encoded PhotoBytes payload into a cv2 BGR image (or None)."""
    try:
        img_bytes = base64.b64decode(photo.data)
        img_arr   = np.frombuffer(img_bytes, dtype=np.uint8)
        return cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    except Exception:
        return None


def _compute_mean_embedding_from_bytes(photos):
    """Same as _compute_mean_embedding, but reads from in-memory PhotoBytes
    (base64) instead of files on disk — used so the ML service never needs
    filesystem access to server/ml-data/ground_truth/."""
    embeddings  = []
    emb_weights = []
    for photo in photos:
        img = _decode_photo(photo)
        if img is None:
            continue
        with state.face_lock:
            faces = state.face_app.get(img)
        if not faces:
            continue
        face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        det_score = float(getattr(face, 'det_score', 1.0))
        if det_score < 0.5:
            continue
        emb  = face.embedding
        norm = np.linalg.norm(emb)
        if norm == 0:
            continue
        embeddings.append(emb / norm)
        emb_weights.append(max(det_score, 0.01))

    if embeddings:
        weights  = np.array(emb_weights, dtype=np.float32)
        weights /= weights.sum()
        mean_emb = np.average(np.array(embeddings, dtype=np.float32), axis=0, weights=weights)
        norm     = np.linalg.norm(mean_emb)
        mean_emb = mean_emb / norm
        return mean_emb, len(embeddings)
    return None, 0


def _build_embeddings_sync(req: BuildEmbeddingsRequest):
    """
    Builds a {roll_no: {name, embedding, num_photos}} pickle entirely from
    what Node sends in the request — never touches server/ml-data/ on disk.
    For each student: use student.cached_mean_embedding if Node already had
    it cached (fast path, no face detection needed), otherwise compute it
    fresh from student.photos (base64 bytes Node read from its own disk).
    The resulting pickle is returned as base64 ("pkl_data") for Node to
    write wherever server/ml-data/embeddings/ actually lives.
    """
    db = {}

    for student in req.students:
        roll_no = student.roll_no
        name    = student.name or roll_no

        if student.cached_mean_embedding:
            mean_emb = np.array(student.cached_mean_embedding, dtype=np.float32)
            norm     = np.linalg.norm(mean_emb)
            if norm > 0:
                db[roll_no] = {
                    "name":       name,
                    "embedding":  mean_emb / norm,
                    "num_photos": student.num_photos_cached,
                }
                logger.info(f"✓ {roll_no}: used cached embedding")
                continue

        mean_emb, num_photos_used = _compute_mean_embedding_from_bytes(student.photos)
        if mean_emb is not None:
            db[roll_no] = {"name": name, "embedding": mean_emb, "num_photos": num_photos_used}
        else:
            logger.warning(f"✗ {roll_no}: no faces detected")

    pkl_bytes = pickle.dumps(db)
    state.embeddings_db.update(db)

    return {
        "status":            "done",
        "students_enrolled": len(db),
        "pkl_data":          base64.b64encode(pkl_bytes).decode('ascii'),
    }

# ─── ERP Embeddings Automation ────────────────────────────────────────────────
# Stateless: Node owns server/ml-data/erp_photos and server/ml-data/embeddings/erp.
# It reads the existing .pkl (if any) and the relevant photo bytes, sends them
# here, and persists whatever pkl_data comes back. Saved format is unchanged:
# {roll_no: {"name", "embedding", "num_photos"}}.

def _erp_sync_sync(req: ERPSyncRequest) -> dict:
    db = {}
    if req.existing_pkl_data:
        try:
            db = pickle.loads(base64.b64decode(req.existing_pkl_data))
        except Exception as e:
            logger.error(f"ERP Sync: failed to load existing pkl: {e}")
            db = {}

    processed = 0
    skipped   = []
    for student in req.students:
        roll_no = student.roll_no
        mean_emb, num_photos_used = _compute_mean_embedding_from_bytes(student.photos)
        if mean_emb is not None:
            db[roll_no] = {
                "name":       roll_no,
                "embedding":  mean_emb,
                "num_photos": num_photos_used,
            }
            processed += 1
        else:
            logger.warning(f"ERP Sync: No face found for {roll_no}")
            skipped.append(roll_no)

    pkl_bytes = pickle.dumps(db)
    return {
        "status":         "done",
        "processed":      processed,
        "skipped":        skipped,
        "total_roll_nos": len(db),
        "pkl_data":       base64.b64encode(pkl_bytes).decode('ascii'),
    }

@router.post("/erp-embedding/sync")
def erp_embedding_sync(req: ERPSyncRequest):
    return _erp_sync_sync(req)

@router.post("/erp-embedding/sync-all")
def erp_embedding_sync_all(req: ERPSyncRequest):
    # Identical to /sync — kept for compatibility. Node always supplies the
    # explicit roll_no/photo list itself now (no more "scan everything" mode).
    return _erp_sync_sync(req)


def _erp_rename_sync(req: ERPRenameRequest) -> dict:
    try:
        db = pickle.loads(base64.b64decode(req.pkl_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load pkl: {e}")

    renamed = False
    if req.old_roll_no in db:
        db[req.new_roll_no] = db.pop(req.old_roll_no)
        db[req.new_roll_no]["name"] = req.new_roll_no
        renamed = True

    pkl_bytes = pickle.dumps(db)
    return {
        "status":   "done",
        "renamed":  renamed,
        "pkl_data": base64.b64encode(pkl_bytes).decode('ascii'),
    }

@router.post("/erp-embedding/rename")
def erp_embedding_rename(req: ERPRenameRequest):
    return _erp_rename_sync(req)


def _erp_delete_sync(req: ERPDeleteRequest) -> dict:
    try:
        db = pickle.loads(base64.b64decode(req.pkl_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load pkl: {e}")

    deleted = False
    if req.roll_no in db:
        del db[req.roll_no]
        deleted = True

    pkl_bytes = pickle.dumps(db)
    return {
        "status":   "done",
        "deleted":  deleted,
        "pkl_data": base64.b64encode(pkl_bytes).decode('ascii'),
    }

@router.post("/erp-embedding/delete")
def erp_embedding_delete(req: ERPDeleteRequest):
    return _erp_delete_sync(req)


@router.post("/erp-embedding/inspect")
def erp_embedding_inspect(req: ERPInspectRequest):
    """Returns the roll numbers present in a .pkl Node sends as bytes —
    used by Node to compute both /erp-embedding/check (roll_count) and the
    sync-status comparison (missing/orphaned), without Python ever touching
    server/ml-data/ itself."""
    if not req.pkl_data:
        return {"roll_nos": []}
    try:
        db = pickle.loads(base64.b64decode(req.pkl_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load pkl: {e}")
    return {"roll_nos": list(db.keys())}

# ─── Build Embeddings (streaming subprocess) ──────────────────────────────────

def _run_script_stream(script_path, args_list):
    def generate():
        proc = subprocess.Popen(
            [sys.executable, script_path] + args_list,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, cwd=os.path.dirname(script_path),
        )
        for line in iter(proc.stdout.readline, ""):
            yield f"data: {json.dumps({'log': line.rstrip()})}\n\n"
        proc.wait()
        code = "done" if proc.returncode == 0 else "error"
        yield f"data: {json.dumps({'status': code, 'code': proc.returncode})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/build-embeddings")
def build_embeddings(req: BuildEmbeddingsRequest):
    script = os.path.join(BASE_DIR, "build_embeddings_db.py")
    if not os.path.exists(script):
        raise HTTPException(status_code=404, detail="build_embeddings_db.py not found")
    photos_dir = os.path.abspath(req.photos_dir)
    if not os.path.exists(photos_dir):
        raise HTTPException(status_code=404, detail=f"Photos dir not found: {photos_dir}")
    return _run_script_stream(script, ["--photos-dir", photos_dir, "--output", req.output_path])


# ─── Assign Roll Number ───────────────────────────────────────────────────────

@router.post("/assign-rollno")
def assign_rollno(req: AssignRollNoRequest):
    old_path = os.path.join(req.output_dir, req.cluster_folder)
    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail=f"Folder not found: {old_path}")

    new_name = f"{req.roll_no}_{req.name.replace(' ', '_')}" if req.name else req.roll_no
    new_path = os.path.join(req.output_dir, new_name)
    if os.path.exists(new_path):
        raise HTTPException(status_code=409, detail=f"Folder exists: {new_name}")

    os.rename(old_path, new_path)

    meta_path = os.path.join(req.output_dir, "cluster_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        for c in meta.get("clusters", []):
            if c["folder_name"] == req.cluster_folder:
                c["folder_name"]   = new_name
                c["roll_no"]       = req.roll_no
                c["assigned_name"] = req.name
                break
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

    return {"status": "ok", "old_folder": req.cluster_folder, "new_folder": new_name}


# ─── Update Student Embedding ─────────────────────────────────────────────────

@router.post("/update-student-embedding")
async def update_student_embedding(req: UpdateEmbeddingRequest):
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _update_student_embedding_sync, req)

def _update_student_embedding_sync(req: UpdateEmbeddingRequest):
    """
    Computes a fresh mean embedding for one student purely from the photo
    bytes Node sends — never reads server/ml-data/ground_truth/ from disk.
    Returns the embedding (as a plain float list) for Node to merge into
    that student's _info.json itself, since Node already owns that file.
    """
    if state.face_app is None:
        raise ValueError("Model not loaded")

    new_embeddings = []
    new_weights    = []
    missing        = []
    for photo in req.photos:
        if photo.filename.startswith("_"):
            continue
        img = _decode_photo(photo)
        if img is None:
            missing.append(photo.filename)
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
        new_embeddings.append(emb / norm)
        new_weights.append(max(quality, 0.01))

    if not new_embeddings:
        raise ValueError(f"No faces detected. Missing: {missing}")

    weights  = np.array(new_weights, dtype=np.float32)
    weights /= weights.sum()
    mean_emb = np.average(np.array(new_embeddings, dtype=np.float32), axis=0, weights=weights)
    norm     = np.linalg.norm(mean_emb)
    mean_emb = mean_emb / norm

    if req.roll_no in state.embeddings_db:
        state.embeddings_db[req.roll_no]["embedding"]  = mean_emb
        state.embeddings_db[req.roll_no]["num_photos"] = len(new_embeddings)
    else:
        state.embeddings_db[req.roll_no] = {
            "name":       req.roll_no,
            "embedding":  mean_emb,
            "num_photos": len(new_embeddings),
        }

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with open(DB_PATH, "wb") as f:
        pickle.dump(state.embeddings_db, f)

    return {
        "status":               "ok",
        "roll_no":              req.roll_no,
        "embedding_files_used": len(new_embeddings),
        "total_selected":       len(req.photos),
        "missing_files":        missing,
        "mean_embedding":       mean_emb.tolist(),
    }


# ─── Get Student Ground Truth ─────────────────────────────────────────────────

@router.get("/student-ground-truth/{batch_name}/{roll_no}")
def get_student_ground_truth(batch_name: str, roll_no: str):
    student_dir = os.path.join(CLIENT_GROUND_TRUTH, batch_name, roll_no)
    if not os.path.isdir(student_dir):
        raise HTTPException(status_code=404, detail="Student dir not found")

    all_imgs  = sorted([f for f in os.listdir(student_dir) if f.lower().endswith(IMG_EXTS)])
    info_path = os.path.join(student_dir, "_info.json")
    info      = {}
    if os.path.exists(info_path):
        try:
            with open(info_path) as fi:
                info = json.load(fi)
        except Exception:
            info = {}

    ef        = [f for f in info.get("embedding_files", []) if f in all_imgs]
    bf        = [f for f in info.get("backup_files",    []) if f in all_imgs]
    tracked   = set(ef) | set(bf)
    untracked = [f for f in all_imgs if f not in tracked]

    return {
        "batch_name":       batch_name,
        "roll_no":          roll_no,
        "embedding_files":  ef,
        "backup_files":     bf,
        "untracked_files":  untracked,
        "scores":           info.get("scores", {}),
        "total_images":     len(all_imgs),
        "has_info":         bool(ef or bf),
    }

# ─── RTSP Live Preview (MJPEG) ───────────────────────────────────────────────

import threading

_preview_frame      = None
_preview_lock       = threading.Lock()
_preview_cap        = None
_preview_thread     = None
_preview_stop_event = threading.Event()
_preview_last_error = None


def _preview_reader(rtsp_url: str, stop_event: threading.Event, first_frame_event: threading.Event):
    """Background thread — continuously reads latest frame from RTSP."""
    global _preview_frame, _preview_cap, _preview_last_error

    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
        "rtsp_transport;tcp|buffer_size;1048576|max_delay;500000"
    )
    cap = None
    try:
        cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        _preview_cap = cap

        if not cap.isOpened():
            _preview_last_error = "Could not open RTSP stream (camera unreachable or credentials invalid)."
            first_frame_event.set()
            return

        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                if not first_frame_event.is_set():
                    _preview_last_error = "RTSP stream opened but no frames were received."
                    first_frame_event.set()
                break

            # Enforce minimum 960px width for preview quality
            h, w = frame.shape[:2]
            if w < 960:
                scale = 960 / w
                frame = cv2.resize(frame, (960, int(h * scale)),
                                   interpolation=cv2.INTER_LANCZOS4)

            with _preview_lock:
                _preview_frame = frame.copy()

            if not first_frame_event.is_set():
                first_frame_event.set()
    except Exception as exc:
        _preview_last_error = f"Preview reader crashed: {exc}"
        first_frame_event.set()
    finally:
        if cap is not None:
            cap.release()


@router.post("/start-preview")
def start_preview(body: dict = Body(...)):
    global _preview_thread, _preview_stop_event, _preview_frame, _preview_last_error

    rtsp_url = body.get("rtspUrl")
    if not rtsp_url:
        raise HTTPException(status_code=400, detail="rtspUrl required")

    # Stop existing preview thread if running
    _preview_stop_event.set()
    if _preview_thread and _preview_thread.is_alive():
        _preview_thread.join(timeout=3)

    with _preview_lock:
        _preview_frame = None
    _preview_last_error = None

    _preview_stop_event = threading.Event()
    first_frame_event = threading.Event()
    _preview_thread = threading.Thread(
        target=_preview_reader,
        args=(rtsp_url, _preview_stop_event, first_frame_event),
        daemon=True,
    )
    _preview_thread.start()

    # Do not report success until at least one frame is available.
    if not first_frame_event.wait(timeout=8):
        _preview_stop_event.set()
        if _preview_thread and _preview_thread.is_alive():
            _preview_thread.join(timeout=2)
        raise HTTPException(status_code=504, detail="Timed out waiting for first frame from RTSP stream.")

    with _preview_lock:
        has_frame = _preview_frame is not None
    if not has_frame:
        detail = _preview_last_error or "RTSP stream did not produce frames."
        raise HTTPException(status_code=502, detail=detail)

    return {"status": "ok"}


@router.get("/rtsp-preview")
def rtsp_preview(quality: int = 92, scale: float = 1.0):
    """MJPEG stream endpoint — one persistent connection per session."""

    import time
    ready_deadline = time.time() + 5
    while True:
        with _preview_lock:
            ready = _preview_frame is not None
        if ready:
            break
        if time.time() > ready_deadline:
            raise HTTPException(status_code=503, detail=_preview_last_error or "Preview stream is not ready.")
        time.sleep(0.05)

    def frame_generator():
        while True:
            with _preview_lock:
                frame = _preview_frame.copy() if _preview_frame is not None else None

            if frame is None:
                time.sleep(0.05)
                continue

            # Optional downscale for bandwidth (scale param from frontend)
            if scale != 1.0 and 0.1 < scale < 1.0:
                h, w  = frame.shape[:2]
                frame = cv2.resize(frame,
                                   (int(w * scale), int(h * scale)),
                                   interpolation=cv2.INTER_AREA)

            # JPEG encode quality from frontend. Wider range makes quality changes easier to notice.
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, min(max(quality, 20), 95)]
            _, buf = cv2.imencode('.jpg', frame, encode_params)

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + buf.tobytes()
                + b"\r\n"
            )

            time.sleep(1 / 15)  # 15 fps preview

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache"},
    )