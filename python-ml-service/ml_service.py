# ml_service.py
# Main entry point — app setup, lifespan, core health/config endpoints.
# All business logic lives in the route modules imported below.

import os
import pickle
import logging
import warnings
from contextlib import asynccontextmanager

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

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger("ml_service")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH  = os.path.join(BASE_DIR, "embeddings_db.pkl")
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ground_truth")

logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"DB_PATH:  {DB_PATH}")
logger.info(f"CLIENT_GROUND_TRUTH: {CLIENT_GROUND_TRUTH}")


# ─── Model + DB loading ───────────────────────────────────────────────────────

def load_model(det_size: int = INSIGHTFACE_DET_SIZE):
    from insightface.app import FaceAnalysis
    state.current_det_size = det_size
    logger.info(f"Loading InsightFace buffalo_l (CPU, det_size={det_size})…")
    state.face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    state.face_app.prepare(ctx_id=0, det_size=(640, 640),det_thresh=0.3)
    logger.info("Model loaded.")


def load_embeddings():
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "rb") as f:
            state.embeddings_db = pickle.load(f)
        logger.info(f"Loaded embeddings for {len(state.embeddings_db)} students.")
    else:
        logger.warning("No embeddings_db.pkl found.")


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    state.load_model_fn = load_model   # expose to route modules without circular import
    load_model()
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
    faces = state.face_app.get(frame)
    return {
        "faces_found": len(faces),
        "faces": [
            {"det_score": round(float(f.det_score), 3), "bbox": [round(float(x)) for x in f.bbox]}
            for f in faces
        ]
    }

@app.post("/reload-embeddings")
def reload_embeddings_ep():
    load_embeddings()
    return {"status": "ok", "students_enrolled": len(state.embeddings_db)}


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8500, reload=False, timeout_keep_alive=120,   # keep SSE connection alive 2 minutes
    ws_ping_interval=30,
    ws_ping_timeout=120)
