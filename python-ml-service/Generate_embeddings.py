"""
Generate_embeddings.py
======================
Offline pipeline — run once before starting the service.

Reads student face images from the ground_truth dataset, extracts face
embeddings via InsightFace, selects the best TOP_K_PER_STUDENT per student,
and writes a FAISS index + SQLite metadata DB.

Usage:
    python Generate_embeddings.py [--dataset PATH] [--workers N]
"""

import argparse
import os
import threading
import logging
import logging.handlers
from concurrent.futures import ThreadPoolExecutor, as_completed

import cv2
import numpy as np
import faiss
import sqlite3

from insightface.app import FaceAnalysis


# =============================
# LOGGING
# =============================
os.makedirs("logs", exist_ok=True)

log = logging.getLogger("embeddings")
log.setLevel(logging.DEBUG)

_fh = logging.handlers.RotatingFileHandler(
    "logs/embeddings.log", maxBytes=5 * 1024 * 1024, backupCount=3
)
_fh.setLevel(logging.DEBUG)
_sh = logging.StreamHandler()
_sh.setLevel(logging.INFO)

_fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s — %(message)s")
_fh.setFormatter(_fmt)
_sh.setFormatter(_fmt)
log.addHandler(_fh)
log.addHandler(_sh)


# =============================
# GROUND-TRUTH PATH RESOLUTION
# (formerly gt_paths.py — inlined here since this was its only caller)
#
# Layout:
#   Preferred : server/ml-data/ground_truth/{batch}/{roll}/...
#   Legacy    : server/ground_truth/{batch}/{roll}/...
# =============================
def _ground_truth_candidates(root_dir: str) -> list:
    """Return the candidate ground-truth directories, preferred path first."""
    return [
        os.path.join(root_dir, "server", "ml-data", "ground_truth"),
        os.path.join(root_dir, "server", "ground_truth"),
    ]


def _resolve_ground_truth_dir(root_dir: str) -> str:
    """
    Auto-detect whichever ground-truth layout actually exists on disk.
    Falls back to the preferred (documented) path if neither exists yet
    so callers still get a sensible default to mkdir into.
    """
    candidates = _ground_truth_candidates(root_dir)
    return next((p for p in candidates if os.path.isdir(p)), candidates[0])


# =============================
# CONFIG  (all overridable via CLI)
# =============================
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_GROUND_TRUTH_DIR = _resolve_ground_truth_dir(ROOT_DIR)

DEFAULTS = dict(
    dataset_path           = _GROUND_TRUTH_DIR,
    faiss_index_path       = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings", "faiss.index"),
    db_path                = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings", "metadata.db"),
    min_images_required    = 1,
    max_images_per_student = 20,
    top_k_per_student      = 3,
    duplicate_threshold    = 0.90,
    max_yaw                = 75,
    max_pitch              = 45,
    sharpness_clip         = 300.0,
    det_score_min          = 0.55,
    num_workers            = 2,
)

# =============================
# THREAD-SAFE MODEL CACHE
# =============================
_thread_local = threading.local()


def _get_model() -> FaceAnalysis:
    if not hasattr(_thread_local, "face_app"):
        # Must match clustering_service.py (INSIGHTFACE_DET_SIZE=640) and
        # build_embeddings_db.py (buffalo_l, det_size=640) so offline embeddings
        # and live recognition share the same vector space.
        face_app = FaceAnalysis(name="buffalo_l")
        face_app.prepare(ctx_id=-1, det_size=(640, 640))   # CPU
        _thread_local.face_app = face_app
    return _thread_local.face_app


# =============================
# HELPERS
# =============================
def _normalize(emb: np.ndarray):
    norm = np.linalg.norm(emb)
    return emb / norm if norm > 1e-6 else None


def _is_good_pose(face, max_yaw: float, max_pitch: float) -> bool:
    if not hasattr(face, "pose"):
        return True
    yaw, pitch, _ = face.pose
    return abs(yaw) <= max_yaw and abs(pitch) <= max_pitch


def _compute_quality_raw(face, img: np.ndarray):
    """Return (det_score, area, sharpness) — unnormalised."""
    x1, y1, x2, y2 = map(int, face.bbox)
    face_crop = img[y1:y2, x1:x2]
    if face_crop.size == 0:
        return 0.0, 0.0, 0.0
    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    area = (x2 - x1) * (y2 - y1)
    return float(getattr(face, "det_score", 1.0)), float(area), float(sharpness)


def _combine_quality(raw_list: list, sharpness_clip: float) -> list:
    """Normalise each component to [0,1] across the batch, then combine."""
    if len(raw_list) == 1:
        return [1.0]
    arr = np.array(raw_list, dtype="float32")
    arr[:, 2] = np.clip(arr[:, 2], 0.0, sharpness_clip)
    for col in range(arr.shape[1]):
        lo, hi = arr[:, col].min(), arr[:, col].max()
        arr[:, col] = (arr[:, col] - lo) / (hi - lo) if hi - lo > 1e-6 else 1.0
    combined = 0.4 * arr[:, 0] + 0.3 * arr[:, 1] + 0.3 * arr[:, 2]
    return combined.tolist()


def _is_duplicate(emb: np.ndarray, emb_list: list, threshold: float) -> bool:
    return any(float(np.dot(emb, e)) > threshold for e in emb_list)


# =============================
# PROCESS ONE STUDENT
# =============================
def _process_student(roll: str, cfg: dict, folder: str = None) -> list:
    face_app = _get_model()
    if folder is None:
        folder = os.path.join(cfg["dataset_path"], roll)

    if not os.path.isdir(folder):
        return []

    image_files = [
        f for f in os.listdir(folder)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp"))
    ][:cfg["max_images_per_student"]]

    if len(image_files) < cfg["min_images_required"]:
        log.warning("roll=%s  only %d image(s) — skipping (min=%d)",
                    roll, len(image_files), cfg["min_images_required"])
        return []

    embeddings, raw_quality = [], []

    for img_name in image_files:
        path = os.path.join(folder, img_name)
        img  = cv2.imread(path)
        if img is None:
            log.warning("Could not read image: %s", path)
            continue

        faces = face_app.get(img)
        if not faces:
            continue

        face = max(faces,
                   key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

        if not _is_good_pose(face, cfg["max_yaw"], cfg["max_pitch"]):
            continue
        if face.det_score < cfg["det_score_min"]:
            continue

        emb = _normalize(face.embedding)
        if emb is None:
            continue
        if _is_duplicate(emb, embeddings, cfg["duplicate_threshold"]):
            continue

        embeddings.append(emb)
        raw_quality.append(_compute_quality_raw(face, img))

    if not embeddings:
        log.info("No valid embeddings for roll: %s", roll)
        return []

    qualities = _combine_quality(raw_quality, cfg["sharpness_clip"])
    n = len(embeddings)

    if n <= cfg["top_k_per_student"]:
        result = [(embeddings[i], roll, qualities[i]) for i in range(n)]
    else:
        idx = np.argsort(qualities)[::-1][:cfg["top_k_per_student"]]
        result = [(embeddings[i], roll, qualities[i]) for i in idx]

    log.info("roll=%-12s  scanned=%2d  kept=%d", roll, len(image_files), len(result))
    return result


# =============================
# VALIDATE CONFIG
# =============================
def _validate_cfg(cfg: dict):
    assert cfg["top_k_per_student"] >= 1,          "top_k_per_student must be ≥ 1"
    assert 0.0 < cfg["duplicate_threshold"] < 1.0, "duplicate_threshold must be in (0,1)"
    assert cfg["num_workers"] >= 1,                "num_workers must be ≥ 1"
    assert os.path.isdir(cfg["dataset_path"]),     f"dataset not found: {cfg['dataset_path']}"


# =============================
# MAIN
# =============================
def main(cfg: dict):
    _validate_cfg(cfg)
    os.makedirs(os.path.dirname(cfg["faiss_index_path"]), exist_ok=True)

    IMG_EXTS_LOCAL = (".jpg", ".jpeg", ".png", ".bmp")

    def _has_images(folder: str) -> bool:
        return any(
            f.lower().endswith(IMG_EXTS_LOCAL)
            for f in os.listdir(folder)
            if os.path.isfile(os.path.join(folder, f))
        )

    def _student_id(folder_name: str) -> str:
        """
        First underscore-delimited segment of the folder name is the roll
        number — same convention as build_embeddings_db.py and
        ground_truth_routes.py (folder.split("_", 1)[0]). Using the raw
        folder name here instead (e.g. "2026102_John_Doe") would write a
        different id into the FAISS/SQLite store than what the pkl-based
        path and /enrolled-students endpoint look up, causing recognized
        faces to never match an enrolled roll number downstream.
        """
        return folder_name.split("_", 1)[0]

    roll_to_path: dict = {}

    for entry in os.listdir(cfg["dataset_path"]):
        entry_path = os.path.join(cfg["dataset_path"], entry)
        if not os.path.isdir(entry_path):
            continue

        children = [
            c for c in os.listdir(entry_path)
            if os.path.isdir(os.path.join(entry_path, c))
        ]

        if children and not _has_images(entry_path):
            log.info("Batch folder detected: %s  (%d students)", entry, len(children))
            for child in children:
                child_path = os.path.join(entry_path, child)
                roll = _student_id(child)
                if roll in roll_to_path:
                    log.warning("Duplicate roll '%s' (folder '%s' in batch '%s') — skipping.",
                                roll, child, entry)
                else:
                    roll_to_path[roll] = child_path
        else:
            roll = _student_id(entry)
            if roll in roll_to_path:
                log.warning("Duplicate roll '%s' (folder '%s') — skipping.", roll, entry)
            else:
                roll_to_path[roll] = entry_path

    student_folders = list(roll_to_path.keys())
    log.info("Dataset: %s  |  %d student folder(s)", cfg["dataset_path"], len(student_folders))

    all_data: list = []
    errors:   int  = 0

    with ThreadPoolExecutor(max_workers=cfg["num_workers"]) as pool:
        futures = {
            pool.submit(_process_student, roll, cfg, roll_to_path[roll]): roll
            for roll in student_folders
        }
        for fut in as_completed(futures):
            roll = futures[fut]
            try:
                all_data.extend(fut.result())
            except Exception as exc:
                log.error("roll=%s  worker raised: %s", roll, exc, exc_info=True)
                errors += 1

    if errors:
        log.warning("%d student(s) failed during processing", errors)

    if not all_data:
        raise RuntimeError("No embeddings generated. Check dataset path and image quality.")

    log.info("Total embeddings collected: %d", len(all_data))

    embeddings_arr = np.array([x[0] for x in all_data], dtype="float32")
    labels    = [x[1] for x in all_data]
    qualities = [x[2] for x in all_data]
    n, dim    = embeddings_arr.shape

    faiss.normalize_L2(embeddings_arr)

    if n < 1000:
        log.info("IndexFlatIP  (n=%d < 1000)", n)
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings_arr)
    else:
        nlist  = min(100, n // 10)
        nprobe = max(10, nlist // 5)
        log.info("IndexIVFFlat  nlist=%d  nprobe=%d  n=%d", nlist, nprobe, n)
        quantizer = faiss.IndexFlatIP(dim)
        index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_INNER_PRODUCT)
        index.train(embeddings_arr)
        index.add(embeddings_arr)
        index.set_direct_map(faiss.DirectMap.Array)   # enables reconstruct() — required by ml_service
        index.nprobe = nprobe

    # Atomic write
    tmp_path = cfg["faiss_index_path"] + ".tmp"
    faiss.write_index(index, tmp_path)
    os.replace(tmp_path, cfg["faiss_index_path"])
    log.info("FAISS index written: %s", cfg["faiss_index_path"])

    with sqlite3.connect(cfg["db_path"]) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                vector_id INTEGER PRIMARY KEY,
                roll      TEXT,
                quality   REAL
            )
        """)
        try:
            conn.execute("BEGIN")
            conn.execute("DELETE FROM embeddings")
            conn.executemany(
                "INSERT INTO embeddings VALUES (?, ?, ?)",
                [(i, labels[i], float(qualities[i])) for i in range(n)]
            )
            conn.commit()
            log.info("SQLite DB updated: %d rows", n)
        except Exception:
            conn.rollback()
            log.exception("DB write failed — rolled back")
            raise

    log.info("DONE — %d students  |  %d total embeddings  |  %d error(s)",
             len(student_folders), n, errors)


# =============================
# ENTRY POINT
# =============================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate face embeddings for attendance system")
    parser.add_argument("--dataset",   default=DEFAULTS["dataset_path"])
    parser.add_argument("--workers",   type=int, default=DEFAULTS["num_workers"])
    parser.add_argument("--top-k",     type=int, default=DEFAULTS["top_k_per_student"])
    parser.add_argument("--faiss-out", default=DEFAULTS["faiss_index_path"])
    parser.add_argument("--db-out",    default=DEFAULTS["db_path"])
    args = parser.parse_args()

    cfg = {**DEFAULTS}
    cfg["dataset_path"]      = args.dataset
    cfg["num_workers"]       = args.workers
    cfg["top_k_per_student"] = args.top_k
    cfg["faiss_index_path"]  = args.faiss_out
    cfg["db_path"]           = args.db_out

    main(cfg)