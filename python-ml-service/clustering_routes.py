# clustering_routes.py
# All clustering-related endpoints:
#   POST /extract-faces-stream   (SSE)
#   POST /extract-faces
#   POST /process-video-clustering-stream  (SSE)
#   POST /process-video-clustering
#   POST /cluster-only
#   POST /match-clusters-to-erp  (SSE)
#   GET  /cluster-metadata

import os
import re
import json
import base64
import logging
import time

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

import state
from models import (
    ExtractFacesRequest,
    ClusterStreamRequest,
    ClusterRequest,
    ClusterOnlyRequest,
    MatchClustersRequest,
)
from clustering_service import (
    extract_all_faces,
    cluster_faces,
    identify_clusters,
    process_video_with_clustering,
    process_video_cluster_only,
    _detect_faces_tiled,
    _build_ui_mask,
)

logger = logging.getLogger("ml_service.clustering_routes")
router = APIRouter()

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")


# ─── Extract Faces (streaming SSE) ───────────────────────────────────────────

@router.post("/extract-faces-stream")
def extract_faces_stream(req: ExtractFacesRequest):
    def generate():
        if state.face_app is None:
            yield f"data: {json.dumps({'type':'error','message':'Model not loaded'})}\n\n"
            return
        if not os.path.exists(req.videoPath):
            yield f"data: {json.dumps({'type':'error','message':f'Video not found: {req.videoPath}'})}\n\n"
            return

        cap          = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask      = _build_ui_mask(H, W)

        all_embeddings, all_face_images, all_timestamps, all_quality = [], [], [], []
        frame_count = 0

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
            for d in _detect_faces_tiled(state.face_app, frame, ui_mask):
                all_embeddings.append(d["embedding"])
                all_face_images.append(d["crop"])
                all_timestamps.append(ts)
                all_quality.append(d["quality"])

            if frame_count % 100 == 0:
                pct = round(frame_count / total_frames * 100, 1) if total_frames else 0
                yield f"data: {json.dumps({'type':'progress','frame':frame_count,'faces':len(all_embeddings),'progress':pct})}\n\n"

        cap.release()
        yield f"data: {json.dumps({'type':'status','message':f'Clustering {len(all_embeddings)} faces...'})}\n\n"

        if not all_embeddings:
            yield f"data: {json.dumps({'type':'done','faces':[],'total_detections':0,'unique_faces':0})}\n\n"
            return

        labels, unique_labels = cluster_faces(all_embeddings, req.cluster_threshold, req.min_samples)

        faces_out = []
        for cid in unique_labels:
            idxs     = np.where(labels == cid)[0]
            best_idx = max(idxs, key=lambda i: all_quality[i])
            crop     = all_face_images[best_idx]
            if crop.size == 0:
                continue
            ok, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if not ok:
                continue
            b64 = base64.b64encode(buf.tobytes()).decode()
            faces_out.append({
                "id":           f"cluster_{cid}",
                "imageData":    f"data:image/jpeg;base64,{b64}",
                "frameCount":   len(idxs),
                "firstSeenSec": round(float(all_timestamps[idxs[0]]), 1),
            })

        yield f"data: {json.dumps({'type':'done','faces':faces_out,'total_detections':len(all_embeddings),'unique_faces':len(faces_out)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Extract Faces (non-streaming) ───────────────────────────────────────────

@router.post("/extract-faces")
def extract_faces_for_tagging(req: ExtractFacesRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    embeddings, face_images, timestamps, quality_scores = extract_all_faces(
        req.videoPath, state.face_app, req.frame_skip
    )
    if not embeddings:
        return {"faces": [], "total_detections": 0, "unique_faces": 0}

    labels, unique_labels = cluster_faces(embeddings, req.cluster_threshold, req.min_samples)

    faces_out = []
    for cid in unique_labels:
        idxs     = np.where(labels == cid)[0]
        best_idx = max(idxs, key=lambda i: quality_scores[i])
        crop     = face_images[best_idx]
        if crop.size == 0:
            continue
        ok, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not ok:
            continue
        b64 = base64.b64encode(buf.tobytes()).decode()
        faces_out.append({
            "id":           f"cluster_{cid}",
            "imageData":    f"data:image/jpeg;base64,{b64}",
            "frameCount":   len(idxs),
            "firstSeenSec": round(float(timestamps[idxs[0]]), 1),
        })

    return {
        "faces":            faces_out,
        "total_detections": len(embeddings),
        "unique_faces":     len(faces_out),
    }


# ─── Process Video — Clustering Stream (SSE) ─────────────────────────────────

@router.post("/process-video-clustering-stream")
def process_video_clustering_stream(req: ClusterStreamRequest):
    def generate():
        def sse(d):
            return f"data: {json.dumps(d)}\n\n"

        EMIT = 15

        if not os.path.exists(req.videoPath):
            yield sse({"type": "error", "message": f"Video not found: {req.videoPath}"}); return
        if state.face_app is None:
            yield sse({"type": "error", "message": "Model not loaded"}); return
        if not state.embeddings_db:
            yield sse({"type": "error", "message": "No embeddings loaded"}); return

        start = time.time()
        yield sse({"type": "stage", "stage": "start", "message": "Opening video…"})

        cap          = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask      = _build_ui_mask(H, W)
        duration_sec = round(total_frames / fps, 1)

        yield sse({
            "type": "stage", "stage": "extracting",
            "message": f"{duration_sec}s video, {total_frames} frames, skip={req.frame_skip}",
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
            for d in _detect_faces_tiled(state.face_app, frame, ui_mask):
                all_embeddings.append(d["embedding"])
                all_face_images.append(d["crop"])
                all_timestamps.append(ts)
                all_quality.append(d["quality"])

            now = time.time()
            if now - last_emit >= EMIT:
                pct     = round(frame_count / total_frames * 100, 1) if total_frames else 0
                elapsed = round(now - start, 1)
                eta     = round(elapsed / max(pct, 0.1) * (100 - pct), 0) if pct > 0 else None
                yield sse({
                    "type": "progress", "stage": "extracting",
                    "frame": frame_count, "total_frames": total_frames,
                    "faces_found": len(all_embeddings), "progress": pct,
                    "elapsed_sec": elapsed, "eta_sec": eta,
                    "message": f"Frame {frame_count:,}/{total_frames:,} ({pct}%) — {len(all_embeddings)} faces",
                })
                last_emit = now

        cap.release()
        total_faces = len(all_embeddings)
        yield sse({
            "type": "stage", "stage": "clustering",
            "message": f"{total_faces} detections → clustering…",
            "faces_found": total_faces,
            "elapsed_sec": round(time.time() - start, 1),
        })

        if not all_embeddings:
            yield sse({"type": "error", "message": "No faces detected"}); return

        labels, unique_labels = cluster_faces(all_embeddings, req.cluster_threshold, req.min_samples)

        yield sse({
            "type": "stage", "stage": "identifying",
            "message": f"{len(unique_labels)} clusters → matching…",
            "clusters_found": len(unique_labels),
            "elapsed_sec": round(time.time() - start, 1),
        })

        video_name = os.path.splitext(os.path.basename(req.videoPath))[0]
        output_dir = os.path.join(req.output_dir, video_name)

        attendance, cluster_results = identify_clusters(
            labels, unique_labels,
            all_embeddings, all_face_images, all_timestamps,
            state.embeddings_db, output_dir,
            req.auto_present_threshold, req.review_threshold, all_quality,
        )

        elapsed = round(time.time() - start, 2)
        present = sum(1 for v in attendance.values() if v["status"] == "present")
        review  = sum(1 for v in attendance.values() if v["status"] == "review")
        absent  = sum(1 for v in attendance.values() if v["status"] == "absent")
        unknown = sum(1 for c in cluster_results   if c["status"] == "unknown")

        result = {
            "video":      req.videoPath,
            "output_dir": output_dir,
            "attendance": attendance,
            "clusters":   cluster_results,
            "summary": {
                "total_faces_extracted":  total_faces,
                "unique_clusters_found":  len(unique_labels),
                "unknown_faces":          unknown,
                "total_enrolled":         len(state.embeddings_db),
                "present":                present,
                "review":                 review,
                "absent":                 absent,
                "processing_time":        elapsed,
            },
        }

        if req.roll_list:
            roll_list  = [r.strip().upper() for r in req.roll_list]
            comparison = []
            for roll_no in roll_list:
                if roll_no in attendance:
                    a = attendance[roll_no]
                    comparison.append({
                        "roll_no": roll_no, "name": a["name"],
                        "status": a["status"], "avg_confidence": a["avg_confidence"],
                        "in_roll_list": True, "in_ml_db": True,
                    })
                else:
                    comparison.append({
                        "roll_no": roll_no, "name": "Not Enrolled",
                        "status": "not_enrolled", "avg_confidence": 0,
                        "in_roll_list": True, "in_ml_db": False,
                    })
            result["comparison"] = comparison

        yield sse({
            "type":    "done",
            "result":  result,
            "message": f"Done in {elapsed}s — Present:{present} Review:{review} Absent:{absent} Unknown:{unknown}",
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Process Video — Clustering (non-streaming) ──────────────────────────────

@router.post("/process-video-clustering")
def process_video_clustering(req: ClusterRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if not state.embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    result = process_video_with_clustering(
        req.videoPath, state.embeddings_db, state.face_app,
        req.frame_skip, req.cluster_threshold, req.min_samples,
        req.auto_present_threshold, req.review_threshold, req.output_dir,
    )

    if req.roll_list:
        roll_list  = [r.strip().upper() for r in req.roll_list]
        comparison = []
        for roll_no in roll_list:
            if roll_no in result["attendance"]:
                a = result["attendance"][roll_no]
                comparison.append({
                    "roll_no": roll_no, "name": a["name"],
                    "status": a["status"], "avg_confidence": a["avg_confidence"],
                    "in_roll_list": True, "in_ml_db": True,
                })
            else:
                comparison.append({
                    "roll_no": roll_no, "name": "Not Enrolled",
                    "status": "not_enrolled", "avg_confidence": 0,
                    "in_roll_list": True, "in_ml_db": False,
                })
        result["comparison"] = comparison

    return result


# ─── Cluster Only ─────────────────────────────────────────────────────────────

@router.post("/cluster-only")
def cluster_only(req: ClusterOnlyRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    return process_video_cluster_only(
        req.videoPath, state.face_app, req.frame_skip,
        req.cluster_threshold, req.min_samples,
        req.min_images_per_cluster, req.output_dir,
    )


# ─── Match Clusters to ERP (SSE) ─────────────────────────────────────────────

@router.post("/match-clusters-to-erp")
def match_clusters_to_erp(req: MatchClustersRequest):
    if state.face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")
    if not os.path.isdir(req.batch_dir):
        raise HTTPException(status_code=404, detail=f"batch_dir not found: {req.batch_dir}")
    if not os.path.isdir(req.erp_photos_dir):
        raise HTTPException(status_code=404, detail=f"erp_photos_dir not found: {req.erp_photos_dir}")

    def generate():
        def evt(obj):
            return f"data: {json.dumps(obj)}\n\n"

        # Step 1: build ERP embeddings
        yield evt({"type": "status", "msg": "Loading ERP photos…", "step": "erp"})

        erp_embs = {}
        erp_list = [
            f for f in sorted(os.listdir(req.erp_photos_dir))
            if f.lower().endswith(IMG_EXTS)
        ]

        for i, fname in enumerate(erp_list):
            roll_no = os.path.splitext(fname)[0]
            img     = cv2.imread(os.path.join(req.erp_photos_dir, fname))
            if img is None:
                continue
            faces = state.face_app.get(img)
            if not faces:
                logger.warning(f"No face in ERP photo: {fname}")
                continue
            emb  = faces[0].embedding
            norm = np.linalg.norm(emb)
            if norm > 0:
                erp_embs[roll_no] = {"embedding": emb / norm, "photo": fname}
            yield evt({"type": "erp_progress", "done": i + 1, "total": len(erp_list),
                       "msg": f"ERP photos: {i+1}/{len(erp_list)}"})

        if not erp_embs:
            yield evt({"type": "error", "msg": "No faces detected in any ERP photo"})
            return

        yield evt({"type": "status",
                   "msg": f"Loaded {len(erp_embs)} ERP embeddings. Matching clusters…",
                   "step": "matching"})

        erp_rolls  = list(erp_embs.keys())
        erp_matrix = np.array([erp_embs[r]["embedding"] for r in erp_rolls])

        # Step 2: match each person_XXX cluster
        cluster_dirs = sorted([
            d for d in os.listdir(req.batch_dir)
            if re.match(r"^person_\d+$", d, re.IGNORECASE)
            and os.path.isdir(os.path.join(req.batch_dir, d))
        ])

        matched_count = 0
        for idx, folder_name in enumerate(cluster_dirs):
            folder_path = os.path.join(req.batch_dir, folder_name)
            img_files   = [f for f in os.listdir(folder_path) if f.lower().endswith(IMG_EXTS)]

            yield evt({"type": "cluster_progress", "done": idx + 1, "total": len(cluster_dirs),
                       "current": folder_name,
                       "msg": f"Matching {folder_name} ({idx+1}/{len(cluster_dirs)})…"})

            cluster_embs = []
            for img_file in img_files[:10]:
                img = cv2.imread(os.path.join(folder_path, img_file))
                if img is None:
                    continue
                faces = state.face_app.get(img)
                if faces:
                    emb  = faces[0].embedding
                    norm = np.linalg.norm(emb)
                    if norm > 0:
                        cluster_embs.append(emb / norm)

            if not cluster_embs:
                yield evt({"type": "match_result", "folder": folder_name,
                           "match": {"error": "no faces detected"}})
                continue

            mean_emb  = np.mean(cluster_embs, axis=0)
            mean_emb  = mean_emb / np.linalg.norm(mean_emb)
            scores    = erp_matrix @ mean_emb
            top_idx   = np.argsort(scores)[::-1][: req.top_k]
            candidates = [
                {
                    "rollNo":     erp_rolls[i],
                    "confidence": round(float(scores[i]), 4),
                    "erpPhoto":   erp_embs[erp_rolls[i]]["photo"],
                }
                for i in top_idx
            ]

            yield evt({
                "type":   "match_result",
                "folder": folder_name,
                "match":  {
                    "best":           candidates[0],
                    "candidates":     candidates,
                    "image_count":    len(img_files),
                    "preview_images": img_files[:6],
                },
            })
            matched_count += 1

        yield evt({"type": "done", "erp_students": len(erp_embs), "clusters": matched_count})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── Cluster Metadata ─────────────────────────────────────────────────────────

@router.get("/cluster-metadata")
def get_cluster_metadata(output_dir: str):
    import json as _json
    meta_path = os.path.join(output_dir, "cluster_metadata.json")
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail=f"No metadata in: {output_dir}")
    with open(meta_path) as f:
        return _json.load(f)
