# ground_truth_routes.py
# Ground-truth and student management endpoints:
#   GET  /enrolled-students
#   POST /extract-save-ground-truth   (SSE)
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

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sklearn.cluster import DBSCAN as _DBSCAN

import state
from models import (
    ExtractSaveGTRequest,
    BuildEmbeddingsRequest,
    AssignRollNoRequest,
    UpdateEmbeddingRequest,
)
from face_utils import compute_face_quality, get_aligned_face
from clustering_service import _detect_faces_tiled, _build_ui_mask

logger = logging.getLogger("ml_service.ground_truth_routes")
router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH  = os.path.join(BASE_DIR, "embeddings_db.pkl")
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ground_truth")

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")


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


# ─── Extract + Save Ground Truth (SSE) ───────────────────────────────────────

@router.post("/extract-save-ground-truth")
def extract_save_ground_truth(req: ExtractSaveGTRequest):
    def generate():
        def sse(d):
            return f"data: {json.dumps(d)}\n\n"

        EMIT = 15

        if not os.path.exists(req.videoPath):
            yield sse({"type": "error", "message": f"Video not found: {req.videoPath}"}); return
        if state.face_app is None:
            yield sse({"type": "error", "message": "Model not loaded"}); return

        if req.det_size != state.current_det_size:
            yield sse({"type": "stage", "stage": "loading",
                       "message": f"Reloading model det_size={req.det_size}…"})
            if state.load_model_fn:
                state.load_model_fn(det_size=req.det_size)

        batch_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batchName)
        os.makedirs(batch_dir, exist_ok=True)

        import time
        start = time.time()

        cap          = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask      = _build_ui_mask(H, W)
        duration_sec = round(total_frames / fps, 1)

        yield sse({
            "type": "stage", "stage": "extracting",
            "message": f"Video: {duration_sec}s, {total_frames} frames, skip={req.frame_skip}",
            "total_frames": total_frames, "duration_sec": duration_sec,
        })

        all_embeddings, all_face_images, all_timestamps, all_quality = [], [], [], []
        frame_count = 0
        last_emit   = time.time()

        while True:
            if not cap.grab():
                break
            frame_count += 1
            if frame_count % req.frame_skip != 0:
                continue
            ret, frame = cap.retrieve()
            if not ret:
                continue

            ts = round(frame_count / fps, 2)
            for d in _detect_faces_tiled(state.face_app, frame, ui_mask,
                                         min_face_px=max(20, req.min_face_size),
                                         lap_threshold=max(0.0, req.laplacian_threshold)):
                if d["quality"] > 0:
                    all_embeddings.append(d["embedding"])
                    all_face_images.append(d["crop"])
                    all_timestamps.append(ts)
                    all_quality.append(d["quality"])

            now = time.time()
            if now - last_emit >= EMIT:
                pct = round(frame_count / total_frames * 100, 1) if total_frames else 0
                yield sse({
                    "type": "progress", "stage": "extracting",
                    "frame": frame_count, "total_frames": total_frames,
                    "faces_found": len(all_embeddings), "progress": pct,
                    "elapsed_sec": round(now - start, 1),
                    "message": f"Frame {frame_count:,}/{total_frames:,} ({pct}%) — {len(all_embeddings)} faces",
                })
                last_emit = now

        cap.release()
        total_faces = len(all_embeddings)
        if total_faces == 0:
            yield sse({"type": "error", "message": "No faces detected in video"}); return

        yield sse({"type": "stage", "stage": "clustering",
                   "message": f"{total_faces} faces → clustering…", "faces_found": total_faces})

        euclidean_eps = float(np.sqrt(2.0 * (1.0 - req.cluster_threshold)))
        clustering    = _DBSCAN(
            eps=euclidean_eps, min_samples=req.min_samples,
            metric="euclidean", algorithm="ball_tree", n_jobs=-1,
        ).fit(np.array(all_embeddings))
        labels        = clustering.labels_
        unique_labels = sorted(set(labels) - {-1})

        yield sse({
            "type": "stage", "stage": "saving",
            "message": f"{len(unique_labels)} unique people → saving images…",
            "clusters_found": len(unique_labels),
        })

        # Load existing folder embeddings for dedup
        existing_mean_embs = {}
        all_existing_dirs  = sorted([
            d for d in os.listdir(batch_dir)
            if os.path.isdir(os.path.join(batch_dir, d)) and not d.startswith("_")
        ])

        if all_existing_dirs:
            yield sse({"type": "stage", "stage": "dedup",
                       "message": f"Loading {len(all_existing_dirs)} existing folders…"})
            for folder_name in all_existing_dirs:
                fp   = os.path.join(batch_dir, folder_name)
                imgs = [f for f in os.listdir(fp) if f.lower().endswith(IMG_EXTS)]
                info_p = os.path.join(fp, "_info.json")
                if os.path.exists(info_p):
                    try:
                        with open(info_p) as fi:
                            _info = json.load(fi)
                        ef = [f for f in _info.get("embedding_files", []) if f in imgs]
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
                    existing_mean_embs[folder_name] = mean_emb / np.linalg.norm(mean_emb)

        existing_person_nums = [
            int(d.split("_")[1])
            for d in all_existing_dirs
            if re.match(r"^person_\d+$", d, re.IGNORECASE)
        ]
        next_serial = (max(existing_person_nums) + 1) if existing_person_nums else 1
        top_n       = req.top_n
        EMBED_N     = 5

        def _merge_save(folder_path, new_dets):
            info_path = os.path.join(folder_path, "_info.json")
            info = {"embedding_files": [], "backup_files": [], "scores": {}}
            if os.path.exists(info_path):
                try:
                    with open(info_path) as fi:
                        info = json.load(fi)
                except Exception:
                    pass
            saved = 0
            for (crop, quality, ts_, idx) in new_dets:
                if crop.size == 0:
                    continue
                fname = f"gt_{ts_:.1f}s_f{idx}.jpg"
                cv2.imwrite(os.path.join(folder_path, fname), crop)
                info["scores"][fname] = round(quality, 4)
                saved += 1
            all_imgs = [f for f in os.listdir(folder_path) if f.lower().endswith(IMG_EXTS)]
            for f in all_imgs:
                if f not in info["scores"]:
                    img2 = cv2.imread(os.path.join(folder_path, f))
                    if img2 is not None:
                        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
                        lap   = float(cv2.Laplacian(gray2, cv2.CV_64F).var())
                        h2, w2 = img2.shape[:2]
                        info["scores"][f] = round((w2 * h2) ** 0.5 * min(lap, 500) / 500, 4)
                    else:
                        info["scores"][f] = 0.5
            scored = sorted(
                [(f, info["scores"].get(f, 0)) for f in all_imgs if f in info["scores"]],
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
            info["embedding_files"] = [f for (f, _) in scored[:EMBED_N]]
            info["backup_files"]    = [f for (f, _) in scored[EMBED_N:]]
            with open(info_path, "w") as fi:
                json.dump(info, fi, indent=2)
            return saved

        import time as _time
        saved_total = 0
        for cluster_id in unique_labels:
            indices      = np.where(labels == cluster_id)[0]
            cluster_embs = np.array([all_embeddings[i] for i in indices])
            cluster_mean = cluster_embs.mean(axis=0)
            cluster_mean /= np.linalg.norm(cluster_mean)

            best_folder = None
            best_score  = 0.0
            for fname, ex_emb in existing_mean_embs.items():
                score = float(np.dot(cluster_mean, ex_emb))
                if score > best_score:
                    best_score  = score
                    best_folder = fname

            if best_folder and best_score >= req.match_threshold:
                folder = os.path.join(batch_dir, best_folder)
                existing_mean_embs[best_folder] = cluster_mean
            else:
                fn     = f"person_{next_serial:03d}"
                next_serial += 1
                folder = os.path.join(batch_dir, fn)
                os.makedirs(folder, exist_ok=True)
                existing_mean_embs[fn] = cluster_mean

            cluster_quality = sorted(
                [(all_face_images[i], all_quality[i], all_timestamps[i], i) for i in indices],
                key=lambda x: x[1], reverse=True,
            )[:top_n]
            saved_total += _merge_save(folder, cluster_quality)

        elapsed = round(_time.time() - start, 2)
        yield sse({
            "type":           "done",
            "people_detected": len(unique_labels),
            "images_saved":   saved_total,
            "batch_dir":      batch_dir,
            "elapsed_sec":    elapsed,
            "message":        f"Done {elapsed}s — {len(unique_labels)} people, {saved_total} images",
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Build Embeddings (sync) ──────────────────────────────────────────────────

@router.post("/build-embeddings-sync")
def build_embeddings_sync(req: BuildEmbeddingsRequest):
    if not os.path.exists(req.photos_dir):
        raise HTTPException(status_code=404, detail=f"Photos dir not found: {req.photos_dir}")

    student_folders = [
        f for f in os.listdir(req.photos_dir)
        if os.path.isdir(os.path.join(req.photos_dir, f))
    ]
    db = {}

    for folder in sorted(student_folders):
        parts      = folder.split("_", 1)
        student_id = parts[0]
        name       = parts[1].replace("_", " ") if len(parts) > 1 else folder
        fp         = os.path.join(req.photos_dir, folder)
        all_photos = [f for f in os.listdir(fp)
                      if f.lower().endswith((".jpg", ".jpeg", ".png"))]

        info_path = os.path.join(fp, "_info.json")
        if os.path.exists(info_path):
            try:
                with open(info_path) as fi:
                    _info = json.load(fi)
                ef = [f for f in _info.get("embedding_files", [])
                      if os.path.exists(os.path.join(fp, f))]
                photos = ef if ef else all_photos
            except Exception:
                photos = all_photos
        else:
            photos = all_photos

        embeddings = []
        for photo in photos:
            img = cv2.imread(os.path.join(fp, photo))
            if img is None:
                continue
            faces = state.face_app.get(img)
            if faces:
                face    = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
                aligned = get_aligned_face(state.face_app, img, face)
                if aligned is None:
                    continue
                quality = compute_face_quality(aligned)
                if quality < 80:
                    continue
                emb  = face.embedding
                norm = np.linalg.norm(emb)
                if norm > 0:
                    embeddings.append(emb / norm)

        if embeddings:
            mean_emb = np.mean(embeddings, axis=0)
            mean_emb /= np.linalg.norm(mean_emb)
            db[student_id] = {"name": name, "embedding": mean_emb, "num_photos": len(embeddings)}
        else:
            logger.warning(f"✗ {student_id}: no faces detected")

    with open(req.output_path, "wb") as f:
        pickle.dump(db, f)

    state.embeddings_db = db
    return {"status": "done", "students_enrolled": len(db), "output_path": req.output_path}


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
def update_student_embedding(req: UpdateEmbeddingRequest):
    student_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batch_name, req.roll_no)
    if not os.path.isdir(student_dir):
        raise HTTPException(status_code=404, detail=f"Student dir not found: {student_dir}")
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    new_embeddings = []
    missing        = []
    for filename in req.embedding_files:
        if filename.startswith("_"):
            continue
        fpath = os.path.join(student_dir, filename)
        if not os.path.exists(fpath):
            missing.append(filename)
            continue
        img = cv2.imread(fpath)
        if img is None:
            continue
        faces = state.face_app.get(img)
        if faces:
            emb  = faces[0].embedding
            norm = np.linalg.norm(emb)
            if norm > 0:
                new_embeddings.append(emb / norm)

    if not new_embeddings:
        raise HTTPException(status_code=400, detail=f"No faces detected. Missing: {missing}")

    mean_emb = np.mean(new_embeddings, axis=0)
    mean_emb /= np.linalg.norm(mean_emb)

    if req.roll_no in state.embeddings_db:
        state.embeddings_db[req.roll_no]["embedding"]  = mean_emb
        state.embeddings_db[req.roll_no]["num_photos"] = len(new_embeddings)
    else:
        state.embeddings_db[req.roll_no] = {
            "name":       req.roll_no,
            "embedding":  mean_emb,
            "num_photos": len(new_embeddings),
        }

    with open(DB_PATH, "wb") as f:
        pickle.dump(state.embeddings_db, f)

    info_path = os.path.join(student_dir, "_info.json")
    info      = {}
    if os.path.exists(info_path):
        try:
            with open(info_path) as fi:
                info = json.load(fi)
        except Exception:
            info = {}

    all_imgs = [f for f in os.listdir(student_dir) if f.lower().endswith(IMG_EXTS)]
    info["embedding_files"] = [f for f in req.embedding_files if f in all_imgs]
    info["backup_files"]    = [f for f in all_imgs if f not in req.embedding_files][:5]
    with open(info_path, "w") as fi:
        json.dump(info, fi, indent=2)

    return {
        "status":               "ok",
        "roll_no":              req.roll_no,
        "embedding_files_used": len(new_embeddings),
        "total_selected":       len(req.embedding_files),
        "missing_files":        missing,
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
