import os
import pickle
import time
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger("ml_service")

app = FastAPI(title="Facial Recognition ML Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

face_app = None
embeddings_db = {}
DB_PATH = "./embeddings_db.pkl"

class VideoRequest(BaseModel):
    videoPath: str
    threshold: float = 0.45
    frame_skip: int = 10

def load_model():
    global face_app
    from insightface.app import FaceAnalysis
    logger.info("Loading InsightFace buffalo_s model (CPU)...")
    face_app = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0, det_size=(640, 640))
    logger.info("Model loaded successfully.")

def load_embeddings():
    global embeddings_db
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "rb") as f:
            embeddings_db = pickle.load(f)
        logger.info(f"Loaded embeddings for {len(embeddings_db)} students from {DB_PATH}")
    else:
        logger.warning("No embeddings_db.pkl found.")

@app.on_event("startup")
async def startup():
    load_model()
    load_embeddings()

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": face_app is not None,
        "students_enrolled": len(embeddings_db)
    }

@app.post("/process-video")
def process_video(req: VideoRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if not embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    cap = cv2.VideoCapture(req.videoPath)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Cannot open video.")

    detected = {}
    frame_count = 0
    processed = 0
    start = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        if frame_count % req.frame_skip != 0:
            continue

        faces = face_app.get(frame)
        processed += 1

        for face in faces:
            emb = face.embedding
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm

            best_id = None
            best_score = -1
            for sid, data in embeddings_db.items():
                score = float(np.dot(emb, data["embedding"]))
                if score > best_score:
                    best_score = score
                    best_id = sid

            if best_id and best_score >= req.threshold:
                detected[best_id] = detected.get(best_id, 0) + 1

    cap.release()
    elapsed = time.time() - start

    attendance = {}
    for sid, data in embeddings_db.items():
        attendance[sid] = {
            "name": data["name"],
            "status": "present" if detected.get(sid, 0) >= 3 else "absent",
            "detections": detected.get(sid, 0)
        }

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    return {
        "attendance": attendance,
        "summary": {
            "total": len(embeddings_db),
            "present": present,
            "absent": len(embeddings_db) - present,
            "processing_time": round(elapsed, 2),
            "frames_processed": processed
        }
    }

@app.post("/reload-embeddings")
def reload_embeddings():
    load_embeddings()
    return {"status": "ok", "students_enrolled": len(embeddings_db)}

if __name__ == "__main__":
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8500, reload=False)