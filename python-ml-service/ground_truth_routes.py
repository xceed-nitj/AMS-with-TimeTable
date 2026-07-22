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
import adaface_utils

logger = logging.getLogger("ml_service.ground_truth_routes")
router = APIRouter()

from paths import BASE_DIR, ROOT_DIR, data_path

DB_PATH  = data_path("embeddings_db.pkl")
CLIENT_GROUND_TRUTH = data_path("ground_truth")

# Institute-wide sibling galleries to embeddings_db.pkl — local to THIS
# machine, same accumulation pattern. Feed the multi-model scoring on the
# Institute Identification page (see state.py / institute_identification_routes.py).
TOPK_DB_PATH    = data_path("embeddings_db_topk.pkl")
ADAFACE_DB_PATH = data_path("embeddings_db_adaface.pkl")


def _persist_institute_galleries():
    """Write the top-K and AdaFace institute-wide galleries beside
    embeddings_db.pkl. Failures are non-fatal — the in-memory dicts still
    serve the current process."""
    try:
        os.makedirs(os.path.dirname(TOPK_DB_PATH), exist_ok=True)
        with open(TOPK_DB_PATH, "wb") as f:
            pickle.dump(state.topk_embeddings_db, f)
        with open(ADAFACE_DB_PATH, "wb") as f:
            pickle.dump(state.adaface_embeddings_db, f)
        
        # Trigger automated FAISS index rebuild
        rebuild_faiss_index_async()
    except Exception as e:
        logger.warning(f"Failed to persist institute galleries: {e}")
    

# ─── Automated FAISS Rebuild ──────────────────────────────────────────────────
FAISS_INDEX_PATH = data_path("embeddings", "faiss.index")
FAISS_DB_PATH    = data_path("embeddings", "metadata.db")

def rebuild_faiss_index_async():
    """Rebuilds the FAISS index and metadata.db completely from state.topk_embeddings_db."""
    import threading
    def _rebuild():
        import faiss
        import sqlite3
        try:
            logger.info("Starting automated FAISS index rebuild from memory...")
            all_data = []
            for roll, embs in state.topk_embeddings_db.items():
                for emb in embs:
                    all_data.append((emb, roll))
            
            if not all_data:
                logger.warning("No embeddings found to build FAISS index.")
                return

            embeddings_arr = np.array([x[0] for x in all_data], dtype="float32")
            labels = [x[1] for x in all_data]
            n, dim = embeddings_arr.shape

            faiss.normalize_L2(embeddings_arr)

            if n < 1000:
                index = faiss.IndexFlatIP(dim)
                index.add(embeddings_arr)
            else:
                nlist = min(100, n // 10)
                nprobe = max(10, nlist // 5)
                quantizer = faiss.IndexFlatIP(dim)
                index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_INNER_PRODUCT)
                index.train(embeddings_arr)
                index.add(embeddings_arr)
                index.set_direct_map(faiss.DirectMap.Array)
                index.nprobe = nprobe

            # Save to disk
            os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
            tmp_index = FAISS_INDEX_PATH + ".tmp"
            faiss.write_index(index, tmp_index)
            os.replace(tmp_index, FAISS_INDEX_PATH)

            with sqlite3.connect(FAISS_DB_PATH) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS embeddings (
                        vector_id INTEGER PRIMARY KEY,
                        roll      TEXT,
                        quality   REAL
                    )
                """)
                conn.execute("BEGIN")
                conn.execute("DELETE FROM embeddings")
                conn.executemany(
                    "INSERT INTO embeddings (vector_id, roll, quality) VALUES (?, ?, ?)",
                    [(i, labels[i], 1.0) for i in range(n)]
                )
                conn.commit()

            # Update live state
            state.faiss_index = index
            state.vid_to_roll = {i: labels[i] for i in range(n)}
            logger.info(f"FAISS index automated rebuild complete: {n} vectors.")
        except Exception as e:
            logger.exception(f"Automated FAISS index rebuild failed: {e}")

    threading.Thread(target=_rebuild, daemon=True).start()

@router.post("/rebuild-faiss-index")
def trigger_faiss_rebuild():
    """Manual trigger to rebuild FAISS index."""
    rebuild_faiss_index_async()
    return {"status": "started"}


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
    filesystem access to server/ml-data/ground_truth/.

    Quality weighting and top-K retention deliberately MIRROR
    _update_student_embedding_sync (quality = det_score × clipped Laplacian
    sharpness; keep the top-3 individual embeddings by that weight) so a
    student gets identical ground-truth quality whether they were enrolled
    via bulk /build-embeddings-sync or individually re-enrolled via
    /update-student-embedding — previously the bulk path was blur-unaware
    and kept no top-K gallery at all.

    Also computes AdaFace mean + top-K from the same detected faces, ranked
    by the same quality weight — entirely separate from and never affecting
    the InsightFace computation; a no-op (both stay None) when no AdaFace
    ONNX model is loaded (state.adaface_session is None). See adaface_utils.py.

    Returns a dict:
      { mean_emb, num_photos, top_k_embeddings,          # InsightFace
        adaface_mean_emb, adaface_top_k_embeddings }     # AdaFace (or None)
    mean_emb is None when no usable face was found.
    """
    TOP_K = 3
    embeddings  = []
    emb_weights = []
    adaface_embeddings = []
    adaface_weights    = []
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
        if det_score < state.gt_config.get("det_score_floor", 0.5):
            continue
        emb  = face.embedding
        norm = np.linalg.norm(emb)
        if norm == 0:
            continue
        # Same blur-aware quality as _update_student_embedding_sync.
        x1, y1, x2, y2 = map(int, face.bbox)
        crop = img[max(0, y1):y2, max(0, x1):x2]
        if crop.size > 0:
            gray    = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            lap     = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            quality = det_score * min(lap, 500) / 500
        else:
            quality = det_score
        embeddings.append(emb / norm)
        emb_weights.append(max(quality, 0.01))

        if state.adaface_session is not None:
            ada_emb = adaface_utils.get_adaface_embedding_for_face(img, getattr(face, 'kps', None))
            if ada_emb is not None:
                adaface_embeddings.append(ada_emb)
                adaface_weights.append(max(quality, 0.01))

    if not embeddings:
        return {"mean_emb": None, "num_photos": 0, "top_k_embeddings": None,
                "adaface_mean_emb": None, "adaface_top_k_embeddings": None}

    weights  = np.array(emb_weights, dtype=np.float32)
    weights /= weights.sum()
    mean_emb = np.average(np.array(embeddings, dtype=np.float32), axis=0, weights=weights)
    norm     = np.linalg.norm(mean_emb)
    mean_emb = mean_emb / norm

    ranked_idx = np.argsort(emb_weights)[::-1][:TOP_K]
    top_k_embeddings = [embeddings[i].tolist() for i in ranked_idx]

    adaface_mean_emb = None
    adaface_top_k_embeddings = None
    if adaface_embeddings:
        ada_weights  = np.array(adaface_weights, dtype=np.float32)
        ada_weights /= ada_weights.sum()
        ada_mean = np.average(np.array(adaface_embeddings, dtype=np.float32), axis=0, weights=ada_weights)
        ada_norm = np.linalg.norm(ada_mean)
        if ada_norm > 0:
            adaface_mean_emb = ada_mean / ada_norm
            ada_ranked_idx = np.argsort(adaface_weights)[::-1][:TOP_K]
            adaface_top_k_embeddings = [adaface_embeddings[i].tolist() for i in ada_ranked_idx]

    return {
        "mean_emb":                 mean_emb,
        "num_photos":               len(embeddings),
        "top_k_embeddings":         top_k_embeddings,
        "adaface_mean_emb":         adaface_mean_emb,
        "adaface_top_k_embeddings": adaface_top_k_embeddings,
    }


def _build_embeddings_sync(req: BuildEmbeddingsRequest):
    """
    Builds a {roll_no: {name, embedding, num_photos}} pickle entirely from
    what Node sends in the request — never touches server/ml-data/ on disk.
    For each student: use student.cached_mean_embedding if Node already had
    it cached (fast path, no face detection needed), otherwise compute it
    fresh from student.photos (base64 bytes Node read from its own disk).
    The resulting pickle is returned as base64 ("pkl_data") for Node to
    write wherever server/ml-data/embeddings/ actually lives.

    Also builds a second, independent {roll_no: {name, embedding, num_photos}}
    pickle for AdaFace (adaface_pkl_data), only populated when an AdaFace
    ONNX model is loaded — never affects the InsightFace pickle above.
    """
    db = {}
    adaface_db = {}
    students_detail = {}

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
                if student.cached_adaface_mean_embedding:
                    ada_emb  = np.array(student.cached_adaface_mean_embedding, dtype=np.float32)
                    ada_norm = np.linalg.norm(ada_emb)
                    if ada_norm > 0:
                        adaface_db[roll_no] = {
                            "name": name, "embedding": ada_emb / ada_norm,
                            "num_photos": student.num_photos_cached,
                        }
                logger.info(f"✓ {roll_no}: used cached embedding")
                continue

        computed = _compute_mean_embedding_from_bytes(student.photos)
        mean_emb, num_photos_used = computed["mean_emb"], computed["num_photos"]
        adaface_mean_emb = computed["adaface_mean_emb"]
        if mean_emb is not None:
            db[roll_no] = {"name": name, "embedding": mean_emb, "num_photos": num_photos_used}
            if adaface_mean_emb is not None:
                adaface_db[roll_no] = {"name": name, "embedding": adaface_mean_emb, "num_photos": num_photos_used}
            # Freshly-computed per-student galleries — returned so Node can
            # persist mean/top-K into each student's _info.json, closing the
            # quality gap between bulk enrollment and individual re-enroll
            # (previously only /update-student-embedding produced these).
            students_detail[roll_no] = {
                "mean_embedding":           mean_emb.tolist(),
                "top_k_embeddings":         computed["top_k_embeddings"],
                "adaface_mean_embedding":   adaface_mean_emb.tolist() if adaface_mean_emb is not None else None,
                "adaface_top_k_embeddings": computed["adaface_top_k_embeddings"],
            }
            # Institute-wide galleries (Institute Identification page).
            if computed["top_k_embeddings"]:
                state.topk_embeddings_db[roll_no] = computed["top_k_embeddings"]
            if adaface_mean_emb is not None:
                state.adaface_embeddings_db[roll_no] = adaface_mean_emb.tolist()
        else:
            logger.warning(f"✗ {roll_no}: no faces detected")

    pkl_bytes = pickle.dumps(db)
    state.embeddings_db.update(db)
    if students_detail:
        _persist_institute_galleries()

    result = {
        "status":            "done",
        "students_enrolled": len(db),
        "pkl_data":          base64.b64encode(pkl_bytes).decode('ascii'),
        # Only rolls whose photos were freshly processed this call — students
        # served from cached_mean_embedding are absent (no new data for them).
        "students_detail":   students_detail,
    }
    if adaface_db:
        result["adaface_pkl_data"] = base64.b64encode(pickle.dumps(adaface_db)).decode('ascii')
    return result

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
        # ERP cross-department matching is a separate, out-of-scope store
        # (see class comment above) — AdaFace/top-K are computed but not used
        # here; the blur-aware quality weighting still improves the ERP mean.
        computed = _compute_mean_embedding_from_bytes(student.photos)
        mean_emb, num_photos_used = computed["mean_emb"], computed["num_photos"]
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
    # AdaFace — entirely separate embedding space, computed from the same
    # detected face/photo, ranked by the same quality weight. No-op (stays
    # empty) when no AdaFace ONNX model is loaded. See adaface_utils.py.
    adaface_embeddings = []
    adaface_weights    = []
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
        if det_score < state.gt_config.get("det_score_floor", 0.5):
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

        if state.adaface_session is not None:
            ada_emb = adaface_utils.get_adaface_embedding_for_face(img, getattr(face, 'kps', None))
            if ada_emb is not None:
                adaface_embeddings.append(ada_emb)
                adaface_weights.append(max(quality, 0.01))

    if not new_embeddings:
        raise ValueError(f"No faces detected. Missing: {missing}")

    weights  = np.array(new_weights, dtype=np.float32)
    weights /= weights.sum()
    mean_emb = np.average(np.array(new_embeddings, dtype=np.float32), axis=0, weights=weights)
    norm     = np.linalg.norm(mean_emb)
    mean_emb = mean_emb / norm

    # Retain the top-3 individual embeddings (by the same quality weight used
    # for the mean) for the "max-of-K" matching mode — an alternative to
    # scoring against a single mean vector during Hungarian batch matching.
    TOP_K = 3
    ranked_idx = np.argsort(new_weights)[::-1][:TOP_K]
    top_k_embeddings = [new_embeddings[i].tolist() for i in ranked_idx]

    adaface_mean_embedding   = None
    adaface_top_k_embeddings = None
    if adaface_embeddings:
        ada_weights  = np.array(adaface_weights, dtype=np.float32)
        ada_weights /= ada_weights.sum()
        ada_mean     = np.average(np.array(adaface_embeddings, dtype=np.float32), axis=0, weights=ada_weights)
        ada_norm     = np.linalg.norm(ada_mean)
        if ada_norm > 0:
            adaface_mean_embedding = (ada_mean / ada_norm).tolist()
            ada_ranked_idx = np.argsort(adaface_weights)[::-1][:TOP_K]
            adaface_top_k_embeddings = [adaface_embeddings[i].tolist() for i in ada_ranked_idx]

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

    # Institute-wide galleries (Institute Identification page).
    if top_k_embeddings:
        state.topk_embeddings_db[req.roll_no] = top_k_embeddings
    if adaface_mean_embedding is not None:
        state.adaface_embeddings_db[req.roll_no] = adaface_mean_embedding
    _persist_institute_galleries()

    return {
        "status":               "ok",
        "roll_no":              req.roll_no,
        "embedding_files_used": len(new_embeddings),
        "total_selected":       len(req.photos),
        "missing_files":        missing,
        "mean_embedding":       mean_emb.tolist(),
        "top_k_embeddings":     top_k_embeddings,
        "adaface_mean_embedding":   adaface_mean_embedding,
        "adaface_top_k_embeddings": adaface_top_k_embeddings,
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
# Previews are per-job so several cameras (e.g. a room's left + right feeds)
# stream independently and never mix into one shared frame buffer. Each preview
# is keyed by a deterministic id derived from its RTSP URL, so the same camera
# reuses a single capture thread while different cameras get separate slots.

import threading
import time
import hashlib

_previews      = {}                 # job_id -> preview dict
_previews_lock = threading.Lock()

# Stop a preview whose last viewer disconnected this long ago (seconds).
PREVIEW_IDLE_TIMEOUT = 30.0


def _preview_job_id(rtsp_url: str) -> str:
    return hashlib.sha1(rtsp_url.encode("utf-8")).hexdigest()[:16]


def _preview_reader(rtsp_url: str, prev: dict, first_frame_event: threading.Event):
    """Background thread — continuously reads the latest frame from one RTSP
    stream into that preview's own frame buffer."""
    stop_event = prev["stop"]

    # Low-latency capture options for the LIVE PREVIEW only. Stays on TCP so the
    # stream remains lossless (no decode artifacts / no quality loss) — we only
    # strip FFmpeg's jitter/reorder buffering so preview frames arrive fresh
    # instead of drifting further behind real time the longer you watch.
    #
    # This env var is process-global and the attendance/acquisition path
    # (rtsp_routes._open_capture) reads it via os.environ.setdefault(), so we
    # set it ONLY around this capture's open and restore the previous value
    # immediately after — the attendance workflow's capture options are never
    # affected by the preview.
    _prev_opts = os.environ.get("OPENCV_FFMPEG_CAPTURE_OPTIONS")
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
        "rtsp_transport;tcp|max_delay;0|fflags;nobuffer|flags;low_delay|reorder_queue_size;0"
    )
    cap = None
    try:
        cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        # FFmpeg reads OPENCV_FFMPEG_CAPTURE_OPTIONS at open time, so it's safe
        # to restore the global now that the capture is constructed.
        if _prev_opts is None:
            os.environ.pop("OPENCV_FFMPEG_CAPTURE_OPTIONS", None)
        else:
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = _prev_opts
        # Keep only the newest decoded frame — drop any backlog so the preview
        # never lags behind real time.
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        prev["cap"] = cap

        if not cap.isOpened():
            prev["last_error"] = "Could not open RTSP stream (camera unreachable or credentials invalid)."
            first_frame_event.set()
            return

        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                if not first_frame_event.is_set():
                    prev["last_error"] = "RTSP stream opened but no frames were received."
                    first_frame_event.set()
                break

            # Enforce minimum 960px width for preview quality
            h, w = frame.shape[:2]
            if w < 960:
                scale = 960 / w
                frame = cv2.resize(frame, (960, int(h * scale)),
                                   interpolation=cv2.INTER_LANCZOS4)

            with prev["lock"]:
                prev["frame"] = frame.copy()

            if not first_frame_event.is_set():
                first_frame_event.set()
    except Exception as exc:
        prev["last_error"] = f"Preview reader crashed: {exc}"
        first_frame_event.set()
    finally:
        if cap is not None:
            cap.release()


def _stop_preview_job(job_id: str):
    with _previews_lock:
        prev = _previews.pop(job_id, None)
    if not prev:
        return
    prev["stop"].set()
    thread = prev.get("thread")
    if thread and thread.is_alive():
        thread.join(timeout=3)


def _sweep_idle_previews():
    """Stop previews whose last viewer disconnected more than
    PREVIEW_IDLE_TIMEOUT ago, so unmounted panels don't leak capture threads."""
    now = time.time()
    stale = []
    with _previews_lock:
        for job_id, prev in _previews.items():
            if prev["viewers"] <= 0 and (now - prev["last_access"]) > PREVIEW_IDLE_TIMEOUT:
                stale.append(job_id)
    for job_id in stale:
        _stop_preview_job(job_id)


@router.post("/start-preview")
def start_preview(body: dict = Body(...)):
    rtsp_url = body.get("rtspUrl")
    if not rtsp_url:
        raise HTTPException(status_code=400, detail="rtspUrl required")

    _sweep_idle_previews()

    job_id = _preview_job_id(rtsp_url)

    # Reuse an already-running preview for the same camera instead of restarting.
    with _previews_lock:
        existing = _previews.get(job_id)
        if existing is not None:
            existing["last_access"] = time.time()
    if existing is not None:
        with existing["lock"]:
            if existing["frame"] is not None:
                return {"status": "ok", "jobId": job_id}
        # Slot exists but hasn't produced a frame yet — fall through and restart.
        _stop_preview_job(job_id)

    prev = {
        "stop":        threading.Event(),
        "frame":       None,
        "lock":        threading.Lock(),
        "cap":         None,
        "thread":      None,
        "last_error":  None,
        "viewers":     0,
        "last_access": time.time(),
    }
    with _previews_lock:
        _previews[job_id] = prev

    first_frame_event = threading.Event()
    prev["thread"] = threading.Thread(
        target=_preview_reader,
        args=(rtsp_url, prev, first_frame_event),
        daemon=True,
    )
    prev["thread"].start()

    # Do not report success until at least one frame is available.
    if not first_frame_event.wait(timeout=8):
        _stop_preview_job(job_id)
        raise HTTPException(status_code=504, detail="Timed out waiting for first frame from RTSP stream.")

    with prev["lock"]:
        has_frame = prev["frame"] is not None
    if not has_frame:
        detail = prev["last_error"] or "RTSP stream did not produce frames."
        _stop_preview_job(job_id)
        raise HTTPException(status_code=502, detail=detail)

    return {"status": "ok", "jobId": job_id}


@router.post("/stop-preview")
def stop_preview(body: dict = Body(...)):
    job_id = body.get("jobId")
    if job_id:
        _stop_preview_job(job_id)
    return {"status": "ok"}


def _resolve_preview(job_id: str):
    """Return (job_id, prev) for the requested job, or the most recently
    started preview when no job id is given (keeps callers that don't pass one
    working, e.g. the single-camera ground-truth flow)."""
    with _previews_lock:
        if job_id and job_id in _previews:
            return job_id, _previews[job_id]
        if not job_id and _previews:
            newest = max(_previews.items(), key=lambda kv: kv[1]["last_access"])
            return newest
    return None, None


@router.get("/rtsp-preview")
def rtsp_preview(jobId: str = "", quality: int = 92, scale: float = 1.0):
    """MJPEG stream endpoint — one persistent connection per camera preview."""

    ready_deadline = time.time() + 5
    prev = None
    while True:
        _, prev = _resolve_preview(jobId)
        if prev is not None:
            with prev["lock"]:
                ready = prev["frame"] is not None
            if ready:
                break
        if time.time() > ready_deadline:
            detail = (prev["last_error"] if prev else None) or "Preview stream is not ready."
            raise HTTPException(status_code=503, detail=detail)
        time.sleep(0.05)

    with _previews_lock:
        prev["viewers"] += 1
        prev["last_access"] = time.time()

    def frame_generator():
        try:
            while not prev["stop"].is_set():
                with prev["lock"]:
                    frame = prev["frame"].copy() if prev["frame"] is not None else None

                if frame is None:
                    time.sleep(0.05)
                    continue

                # Optional downscale for bandwidth (scale param from frontend)
                if scale != 1.0 and 0.1 < scale < 1.0:
                    h, w  = frame.shape[:2]
                    frame = cv2.resize(frame,
                                       (int(w * scale), int(h * scale)),
                                       interpolation=cv2.INTER_AREA)

                # JPEG encode quality from frontend.
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, min(max(quality, 20), 95)]
                _, buf = cv2.imencode('.jpg', frame, encode_params)

                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + buf.tobytes()
                    + b"\r\n"
                )

                time.sleep(1 / 25)  # 25 fps preview (smoother live view)
        finally:
            with _previews_lock:
                prev["viewers"] = max(0, prev["viewers"] - 1)
                prev["last_access"] = time.time()

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache"},
    )