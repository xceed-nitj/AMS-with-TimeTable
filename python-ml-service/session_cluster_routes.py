# session_cluster_routes.py
# HTTP replacement for face_cluster.py, which used to be spawned by Node as a
# local child process (attendanceSessionController.js) — that only works when
# Node and this service are co-located, since it assumed a shared venv/path.
# This endpoint takes the same inputs face_cluster.py took via CLI args
# (frames + an embeddings db), but as bytes over HTTP, and returns cluster
# crops/metadata as bytes in the JSON response instead of writing them to a
# path Node passed in — Node is responsible for writing the response to its
# own local disk (matching face_cluster.py's original output layout so
# backupImageUpdater.js keeps working unchanged).

import base64
import io
import logging
import pickle
import uuid

import cv2
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from scipy.optimize import linear_sum_assignment
from sklearn.cluster import DBSCAN

import state
import clustering_service
from clustering_service import _build_ui_mask, _detect_faces_tiled

logger = logging.getLogger("ml_service.session_cluster")
router = APIRouter()


class ClusterSessionRequest(BaseModel):
    frames: list[str]           # base64-encoded JPG frame images
    db_data: str                # base64 of the pickled {roll_no: {name, embedding, num_photos}} dict
    cluster_threshold: float = 0.45
    min_samples: int = 3


def _cluster(embeddings, eps=0.45, min_samples=3):
    arr = np.array(embeddings, dtype=np.float32)
    euclidean_eps = float(np.sqrt(2.0 * (1.0 - eps)))
    clustering = DBSCAN(eps=euclidean_eps, min_samples=min_samples, metric="euclidean", n_jobs=-1)
    clustering.fit(arr)
    labels = clustering.labels_
    unique = set(labels)
    unique.discard(-1)
    return labels, unique


@router.post("/cluster-session-frames")
def cluster_session_frames(req: ClusterSessionRequest):
    if state.face_app is None:
        return {"error": "Face model not loaded", "clusters": []}

    db = pickle.loads(base64.b64decode(req.db_data))
    enrolled_ids = list(db.keys())
    enroll_matrix = (
        np.array([db[uid]["embedding"] for uid in enrolled_ids], dtype=np.float32)
        if enrolled_ids else np.array([])
    )

    all_embeddings, all_crops, all_qualities = [], [], []

    with state.face_lock:
        for frame_b64 in req.frames:
            frame_bytes = base64.b64decode(frame_b64)
            frame = cv2.imdecode(np.frombuffer(frame_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
            if frame is None:
                continue
            ui_mask = _build_ui_mask(frame.shape[0], frame.shape[1])
            detections = _detect_faces_tiled(state.face_app, frame, ui_mask=ui_mask)
            for d in detections:
                emb = d["embedding"]
                norm = np.linalg.norm(emb)
                if norm > 0:
                    emb = emb / norm
                all_embeddings.append(emb)
                all_crops.append(d["crop"])
                all_qualities.append(d["quality"])

    if not all_embeddings:
        return {"clusters": []}

    labels, unique_labels = _cluster(all_embeddings, req.cluster_threshold, req.min_samples)

    cluster_means, cluster_meta = [], []
    for cluster_id in unique_labels:
        indices = np.where(labels == cluster_id)[0]
        cluster_embs = np.array([all_embeddings[i] for i in indices], dtype=np.float32)
        cluster_mean = cluster_embs.mean(axis=0)
        norm = np.linalg.norm(cluster_mean)
        if norm > 0:
            cluster_mean /= norm
        cluster_means.append(cluster_mean)
        cluster_meta.append((cluster_id, indices))

    def _encode_crops(indices):
        items = sorted(
            [(all_crops[i], all_qualities[i]) for i in indices],
            key=lambda x: x[1], reverse=True,
        )
        crops_b64 = []
        for crop, _q in items:
            ok, buf = cv2.imencode(".jpg", crop)
            if ok:
                crops_b64.append(base64.b64encode(buf).decode("utf-8"))
        return crops_b64

    clusters = []
    assigned_cluster_rows = set()

    if cluster_means and len(enroll_matrix) > 0:
        score_matrix = np.array(cluster_means, dtype=np.float32) @ enroll_matrix.T
        row_ind, col_ind = linear_sum_assignment(-score_matrix)

        for r, c in zip(row_ind, col_ind):
            score = float(score_matrix[r, c])
            roll_no = enrolled_ids[c]
            cluster_id, indices = cluster_meta[r]
            assigned_cluster_rows.add(r)

            crops_b64 = _encode_crops(indices)
            cluster_hash = str(uuid.uuid4())[:8]
            clusters.append({
                "type": "known",
                "rollNo": roll_no,
                "confidence": round(score, 4),
                "confidenceScores": [round(score, 4)] * len(crops_b64),
                "imageCount": len(crops_b64),
                "clusterId": f"cluster_{roll_no}_{cluster_hash}",
                "crops": crops_b64,
            })

    unknown_indices = []
    for r, (cluster_id, indices) in enumerate(cluster_meta):
        if r not in assigned_cluster_rows:
            unknown_indices.extend(indices)
    unknown_indices.extend(np.where(labels == -1)[0])

    if unknown_indices:
        crops_b64 = _encode_crops(unknown_indices)
        cluster_hash = str(uuid.uuid4())[:8]
        clusters.append({
            "type": "unknown",
            "rollNo": "unknown",
            "confidence": 0.0,
            "confidenceScores": [0.0] * len(crops_b64),
            "imageCount": len(crops_b64),
            "clusterId": f"cluster_unknown_{cluster_hash}",
            "crops": crops_b64,
        })

    logger.info(f"[cluster-session-frames] {len(assigned_cluster_rows)} known clusters, "
                f"{len(clusters) - len(assigned_cluster_rows)} unknown group(s)")
    return {"clusters": clusters}
