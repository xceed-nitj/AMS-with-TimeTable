# from curses import raw
import os
import time
import logging
import pickle
import json

import cv2
import numpy as np
from sklearn.cluster import DBSCAN

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Tuning knobs — edit here only
# ─────────────────────────────────────────────────────────────────────────────

# FIX-A: skip opening seconds (screen-recorder dialog)
START_SKIP_SEC = 1

# FIX-C: tile detection grid
TILE_ROWS    = 4
TILE_COLS    = 5
TILE_OVERLAP = 0.25      # 25 % overlap between adjacent tiles
TILE_UPSCALE = 3.0       # upscale factor before InsightFace

# FIX-B: student seating zone (fraction of frame height)
ROI_TOP_FRAC    = 0.05   # skip ceiling / timestamp
ROI_BOTTOM_FRAC = 0.95   # skip empty chairs / floor below

# NMS
NMS_IOU_THRESH = 0.35

# Quality filter
MIN_SHARPNESS = 10.0     # Laplacian variance
MIN_FACE_PX   = 20      # minimum face side in original-frame pixels

# FIX-F: tight crop to avoid bleeding into neighbour's face
FACE_CROP_PAD_FRAC = 0.8   # was 0.25

# InsightFace
INSIGHTFACE_DET_SIZE = 640   # always 640; must match build_embeddings_db.py

# FIX-G: post-cluster merge threshold (cosine similarity)
MERGE_THRESHOLD = 0.75   # clusters more similar than this → same person

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# ─────────────────────────────────────────────────────────────────────────────
# FIX-E — UI mask regions (CP IP Cam + RecForth, calibrated to 1080 p)
# Format: (y1, y2, x1, x2)  in 1080 p reference pixels
# ─────────────────────────────────────────────────────────────────────────────
UI_MASK_REGIONS_1080P = [
    (   0,  65,  870, 1920),   # timestamp banner  (top-right)
    ( 610, 730,    0,  290),   # RecForth logo     (bottom-left)
    (1000, 1080,   0, 1920),   # taskbar / progress bar (bottom strip)
]


def _build_ui_mask(H: int, W: int) -> np.ndarray:
    """Return uint8 mask: 0 = UI overlay, 255 = valid region."""
    mask = np.ones((H, W), dtype=np.uint8) * 255
    sy, sx = H / 1080.0, W / 1920.0
    for (y1r, y2r, x1r, x2r) in UI_MASK_REGIONS_1080P:
        y1 = int(y1r * sy); y2 = int(y2r * sy)
        x1 = int(x1r * sx); x2 = int(x2r * sx)
        mask[y1:y2, x1:x2] = 0
    return mask


# ─────────────────────────────────────────────────────────────────────────────
# FIX-D — CLAHE for per-tile contrast enhancement
# ─────────────────────────────────────────────────────────────────────────────
_clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

def _apply_clahe(bgr: np.ndarray) -> np.ndarray:
    bgr = cv2.bilateralFilter(bgr, 5, 50, 50)   # suppress RTSP artifacts
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    return cv2.cvtColor(cv2.merge((_clahe.apply(l), a, b)), cv2.COLOR_LAB2BGR)

# ─────────────────────────────────────────────────────────────────────────────
# FIX-G — Post-DBSCAN cluster merge
# ─────────────────────────────────────────────────────────────────────────────

def _merge_split_clusters(labels: np.ndarray,
                           embeddings: list,
                           merge_threshold: float = MERGE_THRESHOLD):
    """
    After DBSCAN, compute mean embedding per cluster and merge any two
    clusters whose cosine similarity > merge_threshold.

    This fixes the "same person split into multiple folders" bug caused by
    pose/illumination variation dropping a few frames below DBSCAN's eps.

    Returns a new labels array (noise stays -1; merged clusters get the
    lower of the two original cluster IDs).
    """
    unique = sorted(set(labels) - {-1})
    if len(unique) < 2:
        return labels

    arr = np.array(embeddings, dtype=np.float32)

    # Compute mean embedding per cluster
    means = {}
    for cid in unique:
        idx = np.where(labels == cid)[0]
        m   = arr[idx].mean(axis=0)
        n   = np.linalg.norm(m)
        means[cid] = m / n if n > 0 else m

    # Build merge map using union-find
    parent = {cid: cid for cid in unique}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            # Always keep smaller ID as root
            if ra < rb:
                parent[rb] = ra
            else:
                parent[ra] = rb

    # Compare every pair of cluster means
    cids = list(unique)
    mean_matrix = np.stack([means[c] for c in cids])   # (N, 512)
    sim_matrix  = mean_matrix @ mean_matrix.T            # cosine similarities

    merged_count = 0
    for i in range(len(cids)):
        for j in range(i + 1, len(cids)):
            if sim_matrix[i, j] > merge_threshold:
                union(cids[i], cids[j])
                merged_count += 1

    if merged_count == 0:
        return labels   # nothing to do

    # Re-label: map every cluster ID to its root
    new_labels = labels.copy()
    for cid in unique:
        root = find(cid)
        if root != cid:
            new_labels[labels == cid] = root

    new_unique = sorted(set(new_labels) - {-1})
    logger.info(f"[merge_clusters] {len(unique)} → {len(new_unique)} clusters "
                f"after merging {merged_count} pair(s) "
                f"(threshold={merge_threshold})")
    return new_labels

ZOOM_PASSES = [
    {"zoom": 1.0, "cx": 0.50, "cy": 0.50, "min_sharpness": 18.0, "min_face_px": 40},

    {"zoom": 2.0, "cx": 0.28, "cy": 0.38, "min_sharpness": 12.0, "min_face_px": 28},
    {"zoom": 2.0, "cx": 0.72, "cy": 0.38, "min_sharpness": 12.0, "min_face_px": 28},

    {"zoom": 3.0, "cx": 0.22, "cy": 0.28, "min_sharpness": 6.0,  "min_face_px": 18},
    {"zoom": 3.0, "cx": 0.50, "cy": 0.28, "min_sharpness": 6.0,  "min_face_px": 18},
    {"zoom": 3.0, "cx": 0.78, "cy": 0.28, "min_sharpness": 6.0,  "min_face_px": 18},

    {"zoom": 4.0, "cx": 0.22, "cy": 0.22, "min_sharpness": 4.0,  "min_face_px": 12},
    {"zoom": 4.0, "cx": 0.50, "cy": 0.22, "min_sharpness": 4.0,  "min_face_px": 12},
    {"zoom": 4.0, "cx": 0.78, "cy": 0.22, "min_sharpness": 4.0,  "min_face_px": 12},

    {"zoom": 5.0, "cx": 0.25, "cy": 0.18, "min_sharpness": 3.0,  "min_face_px": 8},
    {"zoom": 5.0, "cx": 0.50, "cy": 0.18, "min_sharpness": 3.0,  "min_face_px": 8},
    {"zoom": 5.0, "cx": 0.75, "cy": 0.18, "min_sharpness": 3.0,  "min_face_px": 8},
]

# ─────────────────────────────────────────────────────────────────────────────
# Digital zoom helper
# ─────────────────────────────────────────────────────────────────────────────
def _digital_zoom(frame: np.ndarray, zoom_factor: float,
                  cx_frac: float = 0.5, cy_frac: float = 0.4):
    """
    Crop a region and stretch it back to full frame size.
    Returns:
        zoomed      : stretched frame (same W×H as input)
        off_x       : x offset of crop in original frame
        off_y       : y offset of crop in original frame
        scale_back  : multiply zoomed coords by this to get original coords
        bbox        : (x1, y1, x2, y2) of zoom region in original frame
    """
    H, W = frame.shape[:2]

    crop_w = int(W / zoom_factor)
    crop_h = int(H / zoom_factor)

    cx = int(W * cx_frac)
    cy = int(H * cy_frac)

    x1 = max(0, cx - crop_w // 2)
    y1 = max(0, cy - crop_h // 2)
    x2 = min(W, x1 + crop_w)
    y2 = min(H, y1 + crop_h)

    # Adjust if hitting edges
    if x2 == W: x1 = max(0, W - crop_w)
    if y2 == H: y1 = max(0, H - crop_h)
    x2 = min(W, x1 + crop_w)
    y2 = min(H, y1 + crop_h)

    zoomed_crop = frame[y1:y2, x1:x2]
    zoomed      = cv2.resize(zoomed_crop, (W, H),
                             interpolation=cv2.INTER_LINEAR)

    # scale_back: zoomed pixel → original frame pixel
    # zoomed is W wide but represents crop_w original pixels
    scale_back = crop_w / W   # = 1 / zoom_factor

    return zoomed, x1, y1, scale_back, (x1, y1, x2, y2)


# ─────────────────────────────────────────────────────────────────────────────
# Main detection function
# ─────────────────────────────────────────────────────────────────────────────
def _detect_faces_tiled(face_app, frame: np.ndarray,
                        ui_mask: np.ndarray = None,
                        preview_cb=None,
                        min_face_px: int = None,
                        lap_threshold: float = None) -> list:

    _min_face_px   = min_face_px   if min_face_px   is not None else MIN_FACE_PX
    _lap_threshold = lap_threshold if lap_threshold is not None else MIN_SHARPNESS
    H, W = frame.shape[:2]

    if ui_mask is not None:
        frame = frame.copy()
        frame[ui_mask == 0] = 0

    raw        = []
    zoom_boxes = []

    for pass_idx, pass_cfg in enumerate(ZOOM_PASSES):

        # ── Per-pass thresholds (fall back to function args / globals) ────────
        pass_lap_threshold = pass_cfg.get("min_sharpness", _lap_threshold)  # ← add
        pass_min_face_px   = pass_cfg.get("min_face_px",   _min_face_px)    # ← add

        zoomed, off_x, off_y, scale_back, bbox = _digital_zoom(
            frame,
            zoom_factor=pass_cfg["zoom"],
            cx_frac=pass_cfg["cx"],
            cy_frac=pass_cfg["cy"],
        )
        zoom_boxes.append(bbox)

        if preview_cb:
            preview_cb(frame, zoom_boxes, pass_idx)

        enhanced = _apply_clahe(zoomed)

        try:
            faces = face_app.get(enhanced)
        except Exception as e:
            logger.warning(
                f"InsightFace error pass={pass_idx} "
                f"zoom={pass_cfg['zoom']}: {e}")
            continue

        for face in faces:
            b = face.bbox

            orig_x1 = int(off_x + b[0] * scale_back)
            orig_y1 = int(off_y + b[1] * scale_back)
            orig_x2 = int(off_x + b[2] * scale_back)
            orig_y2 = int(off_y + b[3] * scale_back)
            orig_x1 = max(0, orig_x1); orig_y1 = max(0, orig_y1)
            orig_x2 = min(W, orig_x2); orig_y2 = min(H, orig_y2)

            zx1 = max(0, int(b[0]))
            zy1 = max(0, int(b[1]))
            zx2 = min(W, int(b[2]))
            zy2 = min(H, int(b[3]))

            raw.append((
                orig_x1, orig_y1, orig_x2, orig_y2,
                face.embedding,
                float(getattr(face, "det_score", 1.0)),
                zoomed,
                zx1, zy1, zx2, zy2,
                pass_lap_threshold,   # ← add (was missing entirely)
                pass_min_face_px,     # ← add (was missing entirely)
            ))

    if not raw:
        return []

    raw.sort(key=lambda r: r[5], reverse=True)

    keep_idx   = []
    keep_boxes = []

    for i, (x1, y1, x2, y2, *_rest) in enumerate(raw):
        w = x2 - x1
        h = y2 - y1
        dup = False
        for (kx, ky, kw, kh) in keep_boxes:
            ix    = max(0, min(x1+w, kx+kw) - max(x1, kx))
            iy    = max(0, min(y1+h, ky+kh) - max(y1, ky))
            inter = ix * iy
            union = w*h + kw*kh - inter
            if union > 0 and inter / union > NMS_IOU_THRESH:
                dup = True
                break
        if not dup:
            keep_idx.append(i)
            keep_boxes.append((x1, y1, w, h))

    results = []

    for i in keep_idx:
        (orig_x1, orig_y1, orig_x2, orig_y2,
         emb, det_score,
         zoomed_frame,
         zx1, zy1, zx2, zy2,
         pass_lap_threshold,    # ← unpack (was missing)
         pass_min_face_px,      # ← unpack (was missing)
        ) = raw[i]

        fw = orig_x2 - orig_x1
        fh = orig_y2 - orig_y1
        if min(fw, fh) < pass_min_face_px:      # ← was _min_face_px
            continue

        zfw = zx2 - zx1
        zfh = zy2 - zy1
        pad = int(max(zfw, zfh) * FACE_CROP_PAD_FRAC)
        cx1 = max(0, zx1 - pad); cy1 = max(0, zy1 - pad)
        cx2 = min(W, zx2 + pad); cy2 = min(H, zy2 + pad)
        crop = zoomed_frame[cy1:cy2, cx1:cx2]
        if crop.size == 0:
            continue

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        lap  = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if lap < pass_lap_threshold:             # ← was _lap_threshold
            continue

        quality = float(
            det_score * ((fw * fh) ** 0.5) * min(lap, 500) / 500)

        norm = np.linalg.norm(emb)
        if norm == 0:
            continue

        ch, cw = crop.shape[:2]
        target = 200
        if cw < target or ch < target:
            scale_up = max(target / cw, target / ch)
            new_w    = int(cw * scale_up)
            new_h    = int(ch * scale_up)
            crop     = cv2.resize(crop, (new_w, new_h),
                                  interpolation=cv2.INTER_LINEAR)

        blur = cv2.GaussianBlur(crop, (0, 0), 3)
        crop = cv2.addWeighted(crop, 1.8, blur, -0.8, 0)
        crop = np.clip(crop, 0, 255).astype(np.uint8)

        results.append({
            "bbox":      [orig_x1, orig_y1, orig_x2, orig_y2],
            "embedding": emb / norm,
            "det_score": det_score,
            "quality":   quality,
            "crop":      crop,
        })

    return results

def extract_all_faces(video_path: str,
                      face_app,
                      frame_skip: int = 5,
                      progress_cb=None):
    """
    Extract faces from every frame_skip-th frame, skipping the first
    START_SKIP_SEC seconds (FIX-A).

    Returns: embeddings, face_images, timestamps, quality_scores
    """
    # cap = cv2.VideoCapture(video_path)
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
    "rtsp_transport;tcp|buffer_size;1048576|max_delay;500000")
    cap = cv2.VideoCapture(video_path, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps          = cap.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))

    # FIX-A: skip opening dialog
    start_frame = int(fps * START_SKIP_SEC)
    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        logger.info(f"[extract_all_faces] Skipping first {START_SKIP_SEC}s "
                    f"({start_frame} frames)")

    ui_mask     = _build_ui_mask(H, W)
    embeddings, face_images, timestamps, quality_scores = [], [], [], []
    frame_count = start_frame

    logger.info(f"[extract_all_faces] {video_path}  {total_frames} frames  "
                f"skip={frame_skip}  {W}×{H}  "
                f"ROI={ROI_TOP_FRAC*100:.0f}%-{ROI_BOTTOM_FRAC*100:.0f}%  "
                f"tiles={TILE_ROWS}×{TILE_COLS}  upscale={TILE_UPSCALE}×  "
                f"pad={FACE_CROP_PAD_FRAC}")

    while True:
        if not cap.grab():
            break
        frame_count += 1
        if frame_count % frame_skip != 0:
            continue
        cap.grab()
        cap.grab()

        ret, frame = cap.retrieve()
        if not ret:
            continue

        for d in _detect_faces_tiled(face_app, frame, ui_mask):
            embeddings.append(d["embedding"])
            face_images.append(d["crop"])
            timestamps.append(round(frame_count / fps, 2))
            quality_scores.append(d["quality"])

        if progress_cb and frame_count % 50 == 0:
            pct = round(frame_count / total_frames * 100, 1) if total_frames else 0
            progress_cb(frame_count, total_frames, len(embeddings), pct)

    cap.release()
    logger.info(f"[extract_all_faces] done — {len(embeddings)} faces from "
                f"{(frame_count - start_frame) // frame_skip} processed frames")
    return embeddings, face_images, timestamps, quality_scores


# ─────────────────────────────────────────────────────────────────────────────
# Public API — cluster_faces
# ─────────────────────────────────────────────────────────────────────────────

def cluster_faces(embeddings: list,
                  cluster_threshold: float = 0.5,
                  min_samples: int = 5):
    """
    DBSCAN clustering followed by a post-merge pass (FIX-G).

    cluster_threshold : cosine similarity to be in the same cluster
                        default lowered from 0.50 → 0.45 so that the same
                        person's pose-variant frames stay together
    min_samples       : raised from 2 → 3 to suppress noise micro-clusters

    Returns: labels (np.ndarray), unique_labels (list[int])
    """
    if not embeddings:
        return np.array([]), []

    arr           = np.array(embeddings, dtype=np.float32)
    euclidean_eps = float(np.sqrt(2.0 * (1.0 - cluster_threshold)))

    clustering = DBSCAN(
        eps=euclidean_eps,
        min_samples=min_samples,
        metric="euclidean",
        algorithm="ball_tree",
        n_jobs=-1,
    ).fit(arr)

    labels = clustering.labels_

    # FIX-G: merge clusters that are the same person
    labels = _merge_split_clusters(labels, embeddings)

    unique_labels = sorted(set(labels) - {-1})
    logger.info(f"[cluster_faces] {len(unique_labels)} final clusters from "
                f"{len(embeddings)} detections  eps={euclidean_eps:.4f}")
    return labels, unique_labels


# ─────────────────────────────────────────────────────────────────────────────
# Public API — identify_clusters
# ─────────────────────────────────────────────────────────────────────────────

def identify_clusters(labels, unique_labels,
                      all_embeddings, all_face_images, all_timestamps,
                      embeddings_db: dict,
                      output_dir: str,
                      auto_present_threshold: float = 0.60,
                      review_threshold: float = 0.40,
                      quality_scores: list = None):
    """
    Match each cluster to the closest enrolled student.
    Returns: attendance dict, cluster_results list
    """
    os.makedirs(output_dir, exist_ok=True)

    if quality_scores is None:
        quality_scores = [1.0] * len(all_embeddings)

    enrolled_ids = list(embeddings_db.keys())
    if enrolled_ids:
        enroll_matrix = np.array(
            [embeddings_db[sid]["embedding"] for sid in enrolled_ids],
            dtype=np.float32
        )
    else:
        enroll_matrix = None

    attendance = {
        sid: {
            "name":            embeddings_db[sid]["name"],
            "status":          "absent",
            "detections":      0,
            "avg_confidence":  0.0,
            "confidence_zone": "low",
            "cluster_folder":  None,
            "first_seen_sec":  None,
        }
        for sid in enrolled_ids
    }
    cluster_results = []

    for cluster_id in unique_labels:
        indices = np.where(labels == cluster_id)[0]
        n       = len(indices)

        cluster_embs = np.array([all_embeddings[i] for i in indices], dtype=np.float32)
        cluster_mean = cluster_embs.mean(axis=0)
        cluster_mean /= np.linalg.norm(cluster_mean)

        # Save best-quality crop
        qs   = [quality_scores[i] for i in indices]
        best = indices[int(np.argmax(qs))]
        folder_name = f"cluster_{cluster_id:03d}"
        folder_path = os.path.join(output_dir, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        best_crop = all_face_images[best]
        if best_crop.size > 0:
            cv2.imwrite(os.path.join(folder_path, "best.png"), best_crop)

        first_seen = float(all_timestamps[indices[0]])

        match_sid   = None
        match_score = 0.0
        if enroll_matrix is not None:
            scores      = enroll_matrix @ cluster_mean
            best_idx    = int(np.argmax(scores))
            match_score = float(scores[best_idx])
            if match_score >= review_threshold:
                match_sid = enrolled_ids[best_idx]

        if match_score >= auto_present_threshold:
            status = "present"; zone = "high"
        elif match_score >= review_threshold:
            status = "review";  zone = "medium"
        else:
            status = "unknown"; zone = "low"

        cluster_results.append({
            "cluster_id":     cluster_id,
            "folder_name":    folder_name,
            "detections":     n,
            "first_seen_sec": round(first_seen, 1),
            "avg_quality":    round(float(np.mean(qs)), 3),
            "matched_id":     match_sid,
            "match_score":    round(match_score, 4),
            "status":         status if match_sid else "unknown",
        })

        if match_sid:
            rec = attendance[match_sid]
            rec["detections"]    += n
            rec["cluster_folder"] = folder_name
            rec["first_seen_sec"] = round(first_seen, 1)
            prev_avg = rec["avg_confidence"]
            prev_n   = rec["detections"] - n
            rec["avg_confidence"]  = round(
                (prev_avg * prev_n + match_score * n) / rec["detections"], 4
            )
            rec["status"]          = status
            rec["confidence_zone"] = zone

    with open(os.path.join(output_dir, "cluster_metadata.json"), "w") as f:
        json.dump({"clusters": cluster_results}, f, indent=2)

    return attendance, cluster_results


# ─────────────────────────────────────────────────────────────────────────────
# Public API — process_video_with_clustering
# ─────────────────────────────────────────────────────────────────────────────

def process_video_with_clustering(video_path: str,
                                  embeddings_db: dict,
                                  face_app,
                                  frame_skip: int = 5,
                                  cluster_threshold: float = 0.45,
                                  min_samples: int = 3,
                                  auto_present_threshold: float = 0.60,
                                  review_threshold: float = 0.40,
                                  output_base_dir: str = "./clustering_output"):
    start = time.time()

    embeddings, face_images, timestamps, quality_scores = extract_all_faces(
        video_path, face_app, frame_skip
    )

    if not embeddings:
        return {
            "video": video_path, "attendance": {}, "clusters": [],
            "summary": {"total_faces_extracted": 0, "unique_clusters_found": 0,
                        "processing_time": round(time.time()-start, 2)}
        }

    labels, unique_labels = cluster_faces(embeddings, cluster_threshold, min_samples)

    video_name = os.path.splitext(os.path.basename(video_path))[0]
    output_dir = os.path.join(output_base_dir, video_name)

    attendance, cluster_results = identify_clusters(
        labels, unique_labels,
        embeddings, face_images, timestamps,
        embeddings_db, output_dir,
        auto_present_threshold, review_threshold,
        quality_scores
    )

    elapsed = round(time.time() - start, 2)
    present = sum(1 for v in attendance.values() if v["status"] == "present")
    review  = sum(1 for v in attendance.values() if v["status"] == "review")
    absent  = sum(1 for v in attendance.values() if v["status"] == "absent")
    unknown = sum(1 for c in cluster_results   if c["status"] == "unknown")

    return {
        "video": video_path, "output_dir": output_dir,
        "attendance": attendance, "clusters": cluster_results,
        "summary": {
            "total_faces_extracted": len(embeddings),
            "unique_clusters_found": len(unique_labels),
            "unknown_faces":         unknown,
            "total_enrolled":        len(embeddings_db),
            "present":               present,
            "review":                review,
            "absent":                absent,
            "processing_time":       elapsed,
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Public API — process_video_cluster_only
# ─────────────────────────────────────────────────────────────────────────────
from sklearn.cluster import KMeans

def process_video_cluster_only(video_path: str,
                               face_app,
                               frame_skip: int = 5,
                               cluster_threshold: float = 0.5,
                               min_samples: int = 5,
                               min_images_per_cluster: int = 5,
                               output_base_dir: str = "./clustering_output"):
    """
    Cluster without matching enrolled students.

    ✅ Uses:
        - DBSCAN → identity clustering
        - KMeans → diversity selection within each cluster
        - Quality → best image per sub-cluster

    ✅ Guarantees:
        - No duplicate images
        - High diversity (pose, angle, illumination)
        - Clean ground truth dataset
    """

    start = time.time()

    embeddings, face_images, timestamps, quality_scores = extract_all_faces(
        video_path, face_app, frame_skip
    )

    if not embeddings:
        return {"clusters": [], "total_detections": 0, "unique_faces": 0}

    labels, unique_labels = cluster_faces(embeddings, cluster_threshold, min_samples)

    video_name = os.path.splitext(os.path.basename(video_path))[0]
    output_dir = os.path.join(output_base_dir, video_name)
    os.makedirs(output_dir, exist_ok=True)

    clusters_out = []

    for cluster_id in unique_labels:
        indices = np.where(labels == cluster_id)[0]
        n = len(indices)

        if n == 0:
            continue

        # ───────── STEP 1: Prepare embeddings ─────────
        cluster_embs = np.array([embeddings[i] for i in indices])

        # ───────── STEP 2: Decide number of representatives ─────────
        K = min(min_images_per_cluster, len(indices))

        # ───────── STEP 3: Sub-clustering (KMeans) ─────────
        try:
            kmeans = KMeans(n_clusters=K, random_state=42, n_init=10)
            labels_k = kmeans.fit_predict(cluster_embs)
        except Exception:
            # fallback if clustering fails
            labels_k = np.zeros(len(indices), dtype=int)

        # ───────── STEP 4: Select best per sub-cluster ─────────
        selected = []

        for k in range(K):
            sub_idx = np.where(labels_k == k)[0]

            if len(sub_idx) == 0:
                continue

            # pick highest quality image in this sub-cluster
            best_local = max(sub_idx, key=lambda x: quality_scores[indices[x]])
            selected.append(indices[best_local])

        # fallback (rare case)
        if len(selected) == 0:
            selected = indices[:min_images_per_cluster]

        # ───────── STEP 5: Save images ─────────
        folder_name = f"cluster_{cluster_id + 1:03d}"
        folder_path = os.path.join(output_dir, folder_name)
        os.makedirs(folder_path, exist_ok=True)

        saved = 0
        scores_map = {}

        for rank, i in enumerate(selected):
            crop = face_images[i]
            if crop.size == 0:
                continue

            fname = f"face_{rank:02d}_q{quality_scores[i]:.1f}.png"
            cv2.imwrite(os.path.join(folder_path, fname), crop)

            scores_map[fname] = round(quality_scores[i], 3)
            saved += 1

        # ───────── Metadata ─────────
        info = {
            "cluster_id":       cluster_id,
            "total_detections": n,
            "images_saved":     saved,
            "scores":           scores_map,
            "first_seen_sec":   round(float(timestamps[indices[0]]), 1),
        }

        with open(os.path.join(folder_path, "_info.json"), "w") as f:
            json.dump(info, f, indent=2)

        clusters_out.append({
            "folder_name":    folder_name,
            "detections":     n,
            "images_saved":   saved,
            "first_seen_sec": info["first_seen_sec"],
            "roll_no":        None,
            "assigned_name":  None,
        })

    meta = {
        "video": video_path,
        "output_dir": output_dir,
        "total_detections": len(embeddings),
        "unique_faces":     len(unique_labels),
        "clusters":         clusters_out,
        "processing_time":  round(time.time() - start, 2),
    }

    with open(os.path.join(output_dir, "cluster_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    logger.info(f"[cluster_only] {len(unique_labels)} clusters in {meta['processing_time']}s")
    return meta