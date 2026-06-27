# ml_service.py
# Main entry point — app setup, lifespan, core health/config endpoints.
# All business logic lives in the route modules imported below.

import os
import pickle
import logging
import sqlite3
import subprocess
import sys
import threading
import warnings
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime
import numpy as np

# insightface uses deprecated APIs in scikit-image / numpy — suppress until upstream fixes.
warnings.filterwarnings("ignore", message=r"`estimate` is deprecated",  category=FutureWarning)
warnings.filterwarnings("ignore", message=r"`rcond` parameter will change", category=FutureWarning)

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import state
from models import SetDetSizeRequest, BuildEmbeddingsRequest
from clustering_service import INSIGHTFACE_DET_SIZE
from video_processing    import router as video_router
from clustering_routes   import router as cluster_router
from ground_truth_routes import router as gt_router
from rtsp_routes         import router as rtsp_router
from tracked_routes      import router as tracked_router   # NEW — live tracked attendance

LOG_BUFFER = deque(maxlen=int(os.environ.get("ML_LOG_BUFFER_LINES", "500")))
LOG_LOCK = threading.Lock()
LOG_FORMATTER = logging.Formatter()


def _append_log(level, name, message, created=None):
    timestamp = datetime.fromtimestamp(created or datetime.now().timestamp()).isoformat(timespec="seconds")
    with LOG_LOCK:
        LOG_BUFFER.append({
            "timestamp": timestamp,
            "level": level,
            "logger": name,
            "message": message,
        })


class _MemoryLogHandler(logging.Handler):
    def emit(self, record):
        message = record.getMessage()
        if record.exc_info:
            message = f"{message}\n{LOG_FORMATTER.formatException(record.exc_info)}"
        _append_log(record.levelname, record.name, message, record.created)


class _TeeStream:
    def __init__(self, stream, level):
        self.stream = stream
        self.level = level
        self._buffer = ""

    def write(self, text):
        written = self.stream.write(text)
        text = str(text)
        if not text:
            return written
        self._buffer += text
        while "\n" in self._buffer:
            line, self._buffer = self._buffer.split("\n", 1)
            line = line.rstrip()
            if line:
                _append_log(self.level, "console", line)
        return written

    def flush(self):
        self.stream.flush()

    def isatty(self):
        return self.stream.isatty()


logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logging.getLogger().addHandler(_MemoryLogHandler(level=logging.INFO))
sys.stdout = _TeeStream(sys.stdout, "STDOUT")
sys.stderr = _TeeStream(sys.stderr, "STDERR")
logger = logging.getLogger("ml_service")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH  = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings_db.pkl")
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ml-data", "ground_truth")
FAISS_PATH = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings", "faiss.index")
META_DB    = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings", "metadata.db")

logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"DB_PATH:  {DB_PATH}")
logger.info(f"CLIENT_GROUND_TRUTH: {CLIENT_GROUND_TRUTH}")
logger.info(f"FAISS_PATH: {FAISS_PATH}")
logger.info(f"META_DB:    {META_DB}")


# ─── Model + DB loading ───────────────────────────────────────────────────────

def load_model(det_size: int = INSIGHTFACE_DET_SIZE):
    from insightface.app import FaceAnalysis
    use_gpu = os.environ.get("USE_GPU", "false").lower() == "true"
    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if use_gpu else ["CPUExecutionProvider"]
    ctx_id    = 0 if use_gpu else -1
    state.current_det_size = det_size
    logger.info(f"Loading InsightFace buffalo_l ({'GPU' if use_gpu else 'CPU'}, det_size={det_size})…")
    state.face_app = FaceAnalysis(name="buffalo_l", providers=providers)
    state.face_app.prepare(ctx_id=ctx_id, det_size=(det_size, det_size), det_thresh=0.3)
    logger.info("Model loaded.")


def _migrate_folder(old_path, new_path, label):
    """One-time move of a data folder from its old location to server/ml-data/."""
    import shutil
    if not os.path.exists(new_path) and os.path.exists(old_path):
        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        shutil.move(old_path, new_path)
        logger.info(f"Migrated {label}: {old_path} → {new_path}")


def load_embeddings():
    # One-time migrations to server/ml-data/
    _migrate_folder(
        os.path.join(BASE_DIR, "embeddings_db.pkl"), DB_PATH, "embeddings_db.pkl"
    )
    _migrate_folder(
        os.path.join(ROOT_DIR, "server", "ground_truth"), CLIENT_GROUND_TRUTH, "ground_truth"
    )
    _migrate_folder(
        os.path.join(ROOT_DIR, "server", "erp_photos"),
        os.path.join(ROOT_DIR, "server", "ml-data", "erp_photos"),
        "erp_photos"
    )

    if os.path.exists(DB_PATH):
        with open(DB_PATH, "rb") as f:
            state.embeddings_db = pickle.load(f)
        logger.info(f"Loaded embeddings for {len(state.embeddings_db)} students.")
    else:
        logger.warning("No embeddings_db.pkl found — run /build-embeddings to enroll students.")


# ─── FAISS loading (NEW) ──────────────────────────────────────────────────────

def _rebuild_embeddings_db_from_faiss():
    """
    Reconstruct state.embeddings_db from the already-loaded FAISS index +
    vid_to_roll mapping so that clustering routes (which read embeddings_db)
    see every student that Generate_embeddings.py indexed.
    """
    if state.faiss_index is None or not state.vid_to_roll:
        logger.warning("Cannot rebuild embeddings_db — FAISS index or vid_to_roll not loaded.")
        state.embeddings_db = {}
        return

    n = state.faiss_index.ntotal
    roll_to_vids: dict = {}
    for vid, roll in state.vid_to_roll.items():
        roll_to_vids.setdefault(roll, []).append(vid)

    db = {}
    for roll, vids in roll_to_vids.items():
        embs = []
        for vid in vids:
            try:
                vec = state.faiss_index.reconstruct(int(vid))
                embs.append(vec)
            except Exception:
                pass   # IndexIVFFlat without direct_map — skip gracefully
        if not embs:
            continue
        mean_emb = np.mean(embs, axis=0).astype("float32")
        norm = np.linalg.norm(mean_emb)
        if norm > 1e-6:
            mean_emb /= norm
        db[roll] = {"name": roll, "embedding": mean_emb}

    state.embeddings_db = db
    logger.info("Rebuilt embeddings_db from FAISS: %d students (%d vectors total).", len(db), n)


def load_faiss():
    """
    Load the FAISS index + SQLite metadata, populate state.faiss_index /
    state.vid_to_roll, then rebuild state.embeddings_db from FAISS truth
    (with the legacy pkl applied as a thin override layer on top).

    Called once at startup after load_model(). Safe to skip if the index
    hasn't been generated yet (logs a warning and returns).
    """
    import faiss

    logger.info("Loading FAISS index…")

    if not os.path.exists(FAISS_PATH):
        logger.warning(f"FAISS index not found at {FAISS_PATH} — run Generate_embeddings.py first.")
        return

    state.faiss_index = faiss.read_index(FAISS_PATH)

    # Build direct map so reconstruct() works on IndexIVFFlat (≥ 1000 students).
    try:
        state.faiss_index.make_direct_map()
        logger.info("Direct map built — reconstruct() enabled.")
    except Exception as exc:
        logger.warning("make_direct_map() failed (non-fatal): %s", exc)

    if not os.path.exists(META_DB):
        logger.warning(f"Metadata DB not found at {META_DB}.")
        return

    conn = sqlite3.connect(META_DB)
    rows = conn.execute("SELECT vector_id, roll FROM embeddings").fetchall()
    conn.close()

    state.vid_to_roll = {int(v): r for v, r in rows}
    state._next_vector_id = (max(state.vid_to_roll.keys()) + 1) if state.vid_to_roll else 0

    logger.info(f"{state.faiss_index.ntotal} embeddings loaded from FAISS.")

    # Rebuild embeddings_db from FAISS (source of truth), then apply pkl overrides
    _rebuild_embeddings_db_from_faiss()

    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "rb") as f:
                overrides = pickle.load(f)
            valid_rolls = set(state.vid_to_roll.values())
            applied = {k: v for k, v in overrides.items() if k in valid_rolls}
            state.embeddings_db.update(applied)
            logger.info("Applied %d pkl override(s).", len(applied))
        except Exception as exc:
            logger.warning("Could not load pkl overrides: %s", exc)

    # Re-persist merged result
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        with open(DB_PATH, "wb") as f:
            pickle.dump(state.embeddings_db, f)
        logger.info("Merged embeddings_db persisted (%d students).", len(state.embeddings_db))
    except Exception as exc:
        logger.warning("Could not re-persist merged embeddings_db: %s", exc)

    state.faiss_dirty = False


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    state.load_model_fn = load_model   # expose to route modules without circular import
    load_model()
    load_embeddings()
    load_faiss()          # NEW — loads FAISS index on top of the pkl
    yield


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Facial Recognition ML Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(video_router)
app.include_router(cluster_router)
app.include_router(gt_router)
app.include_router(tracked_router)   # NEW — /run-attendance-rtsp-tracked
app.include_router(rtsp_router)

# Serve ground-truth photos as static files
if os.path.exists(CLIENT_GROUND_TRUTH):
    app.mount(
        "/student-photos",
        StaticFiles(directory=CLIENT_GROUND_TRUTH),
        name="student-photos",
    )


# ─── Health / config endpoints ────────────────────────────────────────────────

@app.get("/health")
def health():
    faiss_count = state.faiss_index.ntotal if state.faiss_index is not None else 0
    unique_students = (
        len(set(state.vid_to_roll.values())) if state.vid_to_roll
        else len(state.embeddings_db)
    )
    return {
        "status":            "ok",
        "model_loaded":      state.face_app is not None,
        "students_enrolled": unique_students,
        "det_size":          state.current_det_size,
        "faiss_loaded":      state.faiss_index is not None,
        "faiss_vectors":     faiss_count,
        "faiss_dirty":       getattr(state, "faiss_dirty", False),
    }


@app.get("/logs")
def logs(limit: int = 200):
    limit = max(1, min(limit, 1000))
    with LOG_LOCK:
        entries = list(LOG_BUFFER)[-limit:]
        total = len(LOG_BUFFER)
    return {
        "logs": entries,
        "total": total,
    }


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


@app.get("/metrics/gpu")
def gpu_metrics():
    fields = [
        "utilization.gpu",
        "memory.used",
        "memory.total",
        "temperature.gpu",
        "power.draw",
    ]
    empty_metrics = {
        "utilPercent": None,
        "memUsedMiB": None,
        "memTotalMiB": None,
        "memPercent": None,
        "tempC": None,
        "powerW": None,
    }

    try:
        completed = subprocess.run(
            [
                "nvidia-smi",
                f"--query-gpu={','.join(fields)}",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=3,
            check=True,
        )
    except FileNotFoundError:
        return {**empty_metrics, "available": False, "error": "nvidia-smi not found"}
    except subprocess.TimeoutExpired:
        return {**empty_metrics, "available": False, "error": "nvidia-smi timed out"}
    except subprocess.CalledProcessError as exc:
        message = (exc.stderr or exc.stdout or "nvidia-smi failed").strip()
        return {**empty_metrics, "available": False, "error": message}

    first_gpu = next((line for line in completed.stdout.splitlines() if line.strip()), "")
    values = [part.strip() for part in first_gpu.split(",")]
    if len(values) < len(fields):
        return {**empty_metrics, "available": False, "error": "Unexpected nvidia-smi output"}

    util_percent = _to_float(values[0])
    mem_used_mib = _to_float(values[1])
    mem_total_mib = _to_float(values[2])
    temp_c = _to_float(values[3])
    power_w = _to_float(values[4])
    mem_percent = (
        round((mem_used_mib / mem_total_mib) * 100, 2)
        if mem_used_mib is not None and mem_total_mib
        else None
    )

    return {
        "utilPercent": util_percent,
        "memUsedMiB": mem_used_mib,
        "memTotalMiB": mem_total_mib,
        "memPercent": mem_percent,
        "tempC": temp_c,
        "powerW": power_w,
        "available": True,
    }


@app.get("/det-size")
def get_det_size():
    return {"det_size": state.current_det_size}


@app.post("/set-det-size")
def set_det_size(req: SetDetSizeRequest):
    if req.det_size not in (320, 640):
        raise HTTPException(status_code=400, detail="det_size must be 320 or 640")
    if req.det_size != state.current_det_size:
        load_model(det_size=req.det_size)
    return {"status": "ok", "det_size": state.current_det_size}


@app.get("/test-detection")
def test_detection():
    import cv2
    frame = cv2.imread("test_frame.jpg")
    if frame is None:
        return {"error": "Cannot read test_frame.jpg"}
    with state.face_lock:
        faces = state.face_app.get(frame)
    return {
        "faces_found": len(faces),
        "faces": [
            {"det_score": round(float(f.det_score), 3), "bbox": [round(float(x)) for x in f.bbox]}
            for f in faces
        ]
    }


from pydantic import BaseModel
from typing import Optional

class ReloadEmbeddingsRequest(BaseModel):
    pkl_path: Optional[str] = None   # local/solo-machine dev convenience only
    pkl_data: Optional[str] = None   # base64-encoded pickle bytes — works cross-machine, preferred

@app.post("/reload-embeddings")
def reload_embeddings_ep(req: ReloadEmbeddingsRequest = ReloadEmbeddingsRequest()):
    if req.pkl_data:
        import pickle, base64
        state.embeddings_db = pickle.loads(base64.b64decode(req.pkl_data))
        logger.info(f"Loaded subject embeddings from pkl_data (base64): {len(state.embeddings_db)} students.")
        return {"status": "ok", "students_enrolled": len(state.embeddings_db), "source": "pkl_data"}
    elif req.pkl_path and os.path.exists(req.pkl_path):
        import pickle
        with open(req.pkl_path, "rb") as f:
            state.embeddings_db = pickle.load(f)
        logger.info(f"Loaded subject embeddings from {req.pkl_path}: {len(state.embeddings_db)} students.")
    else:
        load_faiss()   # reload both FAISS and embeddings_db
    return {"status": "ok", "students_enrolled": len(state.embeddings_db), "source": req.pkl_path or FAISS_PATH}


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8500, reload=False, timeout_keep_alive=300,   # keep SSE connection alive 2 minutes
    ws_ping_interval=30,
    ws_ping_timeout=120)
