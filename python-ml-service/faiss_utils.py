# faiss_utils.py
# FAISS recognition helpers — used by video_processing.py, tracked_routes.py,
# and rtsp_routes.py. No dependency on any other local module.

import math
import numpy as np

import state


# =============================
# ADAPTIVE RE-VERIFY INTERVALS
# =============================
def _get_reverify_interval(score: float) -> float:
    """
    Maps recognition confidence to cache TTL (seconds). Score cutoffs and
    TTLs are runtime-tunable via GET/POST /faiss-config (ML Fine Tuning
    page) — see state.faiss_config / faiss_config_store.py.
    """
    with state.faiss_config_lock:
        cfg = state.faiss_config
        high_score, high_ttl = cfg["reverify_high_score"], cfg["reverify_high_ttl"]
        med_score,  med_ttl  = cfg["reverify_med_score"],  cfg["reverify_med_ttl"]
        low_score,  low_ttl  = cfg["reverify_low_score"],  cfg["reverify_low_ttl"]

    if score >= high_score:
        return high_ttl
    if score >= med_score:
        return med_ttl
    if score >= low_score:
        return low_ttl
    return 0.0


# =============================
# SAFE NORMALIZATION
# =============================
def _safe_normalize(emb: np.ndarray):
    """L2-normalize embedding. Returns None if norm is too small."""
    n = np.linalg.norm(emb)
    return emb / n if n > 1e-6 else None


# =============================
# CENTROID
# =============================
def _centroid(l, t, r, b):
    return (l + r) // 2, (t + b) // 2


# =============================
# CENTROID DRIFT
# =============================
def _centroid_drift(c1, c2) -> float:
    return math.hypot(c1[0] - c2[0], c1[1] - c2[1])


# =============================
# IOU
# =============================
def _iou(boxA, boxB) -> float:
    """IoU of two boxes [x1, y1, x2, y2]."""
    ax1, ay1, ax2, ay2 = boxA
    bx1, by1, bx2, by2 = boxB

    if ax2 <= ax1 or ay2 <= ay1 or bx2 <= bx1 or by2 <= by1:
        return 0.0

    xA = max(ax1, bx1)
    yA = max(ay1, by1)
    xB = min(ax2, bx2)
    yB = min(ay2, by2)

    inter = max(0, xB - xA) * max(0, yB - yA)
    areaA = (ax2 - ax1) * (ay2 - ay1)
    areaB = (bx2 - bx1) * (by2 - by1)
    union = areaA + areaB - inter

    return inter / union if union > 0 else 0.0


# =============================
# NMS
# =============================
def _nms_detections(detections: list, iou_thresh: float = 0.40):
    """
    Remove duplicate detections by IoU suppression.
    detections: list of ([x, y, w, h], conf, embedding)
    """
    if len(detections) <= 1:
        return detections

    boxes = []
    for xywh, conf, emb in detections:
        x, y, w, h = xywh
        boxes.append([x, y, x + w, y + h])

    keep = []
    suppressed = set()

    for i in range(len(detections)):
        if i in suppressed:
            continue
        keep.append(i)
        for j in range(i + 1, len(detections)):
            if j in suppressed:
                continue
            if _iou(boxes[i], boxes[j]) > iou_thresh:
                suppressed.add(j)

    return [detections[k] for k in keep]


# =============================
# FAISS RECOGNITION
# =============================
def _recognize_face(embedding, index, vid_to_roll, top_k=5, threshold=0.35):
    """
    Top-k voting using FAISS.

    Returns (roll, score) or (None, score).
    """
    emb = _safe_normalize(embedding)
    if emb is None:
        return None, 0.0

    D, inds = index.search(emb.reshape(1, -1).astype("float32"), top_k)

    votes  = {}
    scores = {}
    for i, idx in enumerate(inds[0]):
        roll = vid_to_roll.get(int(idx))
        if roll:
            votes[roll]  = votes.get(roll, 0) + 1
            scores[roll] = max(scores.get(roll, 0.0), float(D[0][i]))

    if not votes:
        return None, 0.0

    best_roll  = max(votes, key=votes.get)
    best_score = scores[best_roll]

    if best_score > threshold:
        return best_roll, best_score

    return None, best_score


# =============================
# FAISS TOP-K SCORES FOR ALL ROLLS
# =============================
def _topk_roll_scores(embedding, index, vid_to_roll, top_k=20):
    """
    One FAISS search returning every roll found among the top_k nearest
    vectors with its best similarity score.

    Used by rtsp_routes.py's Hungarian-match attendance pipeline: one search
    gives per-student scores for the whole roster without sending all
    embeddings from Node.

    Returns: dict {roll: best_score} — empty dict if index empty or embedding
    fails to normalize.
    """
    emb = _safe_normalize(embedding)
    if emb is None:
        return {}

    D, inds = index.search(emb.reshape(1, -1).astype("float32"), top_k)

    scores = {}
    for i, idx in enumerate(inds[0]):
        roll = vid_to_roll.get(int(idx))
        if roll:
            scores[roll] = max(scores.get(roll, 0.0), float(D[0][i]))

    return scores
