# ml_service.py
# Main entry point — app setup, lifespan, core health/config endpoints.
# All business logic lives in the route modules imported below.

import os

# Load .env from this directory before any module-level env reads (e.g. RECORDINGS_DIR).
# Simple parser — no extra dependency needed.
_env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_file):
    with open(_env_file) as _ef:
        for _line in _ef:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _, _v = _line.partition('=')
                os.environ.setdefault(_k.strip(), _v.strip())

import pickle
import logging
import subprocess
import sys
import threading
import warnings
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime

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

# ADDED — new router for /run-attendance-rtsp-tracked (live DeepSort-tracked
# attendance against the FAISS index). Does not replace rtsp_router above.
from tracked_routes      import router as tracked_router

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

logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"DB_PATH:  {DB_PATH}")
logger.info(f"CLIENT_GROUND_TRUTH: {CLIENT_GROUND_TRUTH}")


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


def load_liveness_model():
    """
    Optional: load a dedicated ONNX liveness/anti-spoofing classifier
    (e.g. MiniFASNet) if a model file is present.

    Looks for the path in LIVENESS_MODEL_PATH env var, falling back to
    python-ml-service/models/liveness.onnx. If nothing is found, this is
    NOT an error — clustering_service.py falls back to the always-available
    heuristic scorer in face_utils.compute_liveness_score(), so liveness
    checking still works, just with lower accuracy than a trained model.

    See python-ml-service/README_LIVENESS.md for where to download a
    compatible model (MiniFASNet ONNX export, 3-class softmax: live /
    print-attack / replay-attack) and drop it in.
    """
    model_path = os.environ.get(
        "LIVENESS_MODEL_PATH",
        os.path.join(BASE_DIR, "models", "liveness.onnx"),
    )
    if not os.path.exists(model_path):
        logger.info(
            f"[Liveness] No ONNX model found at {model_path} — "
            f"using heuristic anti-spoofing fallback (see README_LIVENESS.md "
            f"to enable the higher-accuracy model)."
        )
        state.liveness_session = None
        state.liveness_input_name = None
        return

    try:
        import onnxruntime as ort
        state.liveness_session = ort.InferenceSession(
            model_path, providers=["CPUExecutionProvider"]
        )
        state.liveness_input_name = state.liveness_session.get_inputs()[0].name
        logger.info(f"[Liveness] Loaded ONNX anti-spoofing model from {model_path}")
    except Exception as e:
        logger.warning(
            f"[Liveness] Failed to load {model_path}: {e} — "
            f"falling back to heuristic anti-spoofing."
        )
        state.liveness_session = None
        state.liveness_input_name = None


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

# ADDED — FAISS index loader for tracked_routes.py.
FAISS_INDEX_PATH = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings", "faiss.index")
FAISS_DB_PATH    = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings", "metadata.db")


def load_faiss_index():
    if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(FAISS_DB_PATH):
        logger.warning(
            "No FAISS index found at %s — run Generate_embeddings.py first if "
            "you want to use /run-attendance-rtsp-tracked.", FAISS_INDEX_PATH
        )
        return

    import faiss
    import sqlite3

    state.faiss_index = faiss.read_index(FAISS_INDEX_PATH)

    with sqlite3.connect(FAISS_DB_PATH) as conn:
        rows = conn.execute("SELECT vector_id, roll FROM embeddings").fetchall()
    state.vid_to_roll = {vid: roll for vid, roll in rows}

    logger.info(
        f"Loaded FAISS index: {state.faiss_index.ntotal} vectors, "
        f"{len(set(state.vid_to_roll.values()))} students."
    )

# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    state.load_model_fn = load_model   # expose to route modules without circular import
    load_model()
    load_liveness_model()
    from liveness_config_store import load_liveness_config
    load_liveness_config()
    from faiss_config_store import load_faiss_config
    load_faiss_config()
    from max_k_config_store import load_max_k_config
    load_max_k_config()
    from adaface_utils import load_adaface_model
    load_adaface_model()
    from adaface_config_store import load_adaface_config
    load_adaface_config()
    load_embeddings()
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
# app.include_router(rtsp_router)
app.include_router(rtsp_router)

# ADDED — register the new tracked-attendance router and load the FAISS
app.include_router(tracked_router)
load_faiss_index()

from institute_identification_routes import router as institute_router
app.include_router(institute_router)

from session_cluster_routes import router as session_cluster_router
app.include_router(session_cluster_router)

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
    return {
        "status":            "ok",
        "model_loaded":      state.face_app is not None,
        "students_enrolled": len(state.embeddings_db),
        "det_size":          state.current_det_size,
    }


@app.post("/restart-service")
def restart_service():
    """
    Restart this ML service process in place — used from the ML Fine Tuning
    page when the service runs on a remote GPU machine (e.g. the H100) where
    nobody can conveniently SSH in to bounce it. Responds first, then a
    background thread re-execs the same interpreter/argv (`python
    ml_service.py`), so the new process reloads models/configs from scratch
    on the same host/port. In-flight requests on other threads are dropped —
    callers should treat this like a brief outage (~model-load time).
    """
    import time

    def _reexec():
        time.sleep(0.75)  # let the HTTP response flush first
        logger.warning("[Restart] Re-executing ML service via /restart-service request")
        os.execv(sys.executable, [sys.executable] + sys.argv)

    threading.Thread(target=_reexec, daemon=True).start()
    return {"status": "restarting", "detail": "Service will re-exec in <1s; poll /health until it responds again."}


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
        load_embeddings()  # loads default embeddings_db.pkl
    return {"status": "ok", "students_enrolled": len(state.embeddings_db), "source": req.pkl_path or DB_PATH}


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8500, reload=False, timeout_keep_alive=300,   # keep SSE connection alive 2 minutes
    ws_ping_interval=30,
    ws_ping_timeout=120)