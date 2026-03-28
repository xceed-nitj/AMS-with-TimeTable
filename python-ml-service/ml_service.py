import os
import re
import pickle
import time
import numpy as np
import cv2
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from clustering_service import process_video_with_clustering, extract_all_faces, cluster_faces, process_video_cluster_only, identify_clusters
from sklearn.cluster import DBSCAN as _DBSCAN
from pydantic import BaseModel
from typing import List
import uvicorn
import logging
import subprocess
import sys
import json
from fastapi.responses import StreamingResponse

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger("ml_service")

app = FastAPI(title="Facial Recognition ML Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

face_app = None
current_det_size = 320
embeddings_db = {}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# python-ml-service is at ROOT level
# so ROOT is just one level up
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))

DB_PATH = os.path.join(BASE_DIR, "embeddings_db.pkl")

# Ground truth photos are stored by the Node server under server/ground_truth/
CLIENT_GROUND_TRUTH = os.path.join(
    ROOT_DIR, 'server', 'ground_truth'
)

logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"DB_PATH: {DB_PATH}")
logger.info(f"CLIENT_GROUND_TRUTH: {CLIENT_GROUND_TRUTH}")

# ─── Request Models ───────────────────────────────────────────

class VideoRequest(BaseModel):
    videoPath: str
    threshold: float = 0.45
    frame_skip: int = 10

class CompareRequest(BaseModel):
    videoPath: str
    threshold: float = 0.45
    frame_skip: int = 10
    roll_list: List[str] = []
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    min_detections: int = 3

class BuildEmbeddingsRequest(BaseModel):
    photos_dir: str = CLIENT_GROUND_TRUTH
    output_path: str = DB_PATH

class DownloadDatasetRequest(BaseModel):
    output_dir: str = "../test-data"
    num_students: int = 20
    min_photos: int = 4
    enrollment_ratio: float = 0.6

class TestPipelineRequest(BaseModel):
    video_path: str
    ground_truth_file: str = ""
    threshold: float = 0.45
    frame_skip: int = 10

class ExtractFacesRequest(BaseModel):
    videoPath: str
    frame_skip: int = 5
    cluster_threshold: float = 0.45
    min_samples: int = 2

# ─── Static Files (serve student photos) ─────────────────────

if os.path.exists(CLIENT_GROUND_TRUTH):
    app.mount(
        "/student-photos",
        StaticFiles(directory=CLIENT_GROUND_TRUTH),
        name="student-photos"
    )
    logger.info(f"Serving student photos from: {CLIENT_GROUND_TRUTH}")
else:
    logger.warning(f"Ground truth folder not found: {CLIENT_GROUND_TRUTH}")

# ─── Startup ──────────────────────────────────────────────────

def load_model(det_size: int = 320):
    global face_app, current_det_size
    from insightface.app import FaceAnalysis
    # det_size=320 is ~4x faster on CPU; use 640 when faces are small/far
    current_det_size = det_size
    logger.info(f"Loading InsightFace buffalo_s model (CPU, det_size={det_size})...")
    face_app = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0, det_size=(det_size, det_size))
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

# ─── Health ───────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": face_app is not None,
        "students_enrolled": len(embeddings_db)
    }

# ─── Enrolled Students List ───────────────────────────────────

@app.get("/enrolled-students")
def enrolled_students():
    students = []

    if os.path.exists(CLIENT_GROUND_TRUTH):
        for folder in sorted(os.listdir(CLIENT_GROUND_TRUTH)):
            folder_path = os.path.join(CLIENT_GROUND_TRUTH, folder)
            if not os.path.isdir(folder_path):
                continue

            parts = folder.split("_", 1)
            student_id = parts[0]
            name = parts[1].replace("_", " ") if len(parts) > 1 else folder

            photos = [
                f for f in os.listdir(folder_path)
                if f.lower().endswith((".jpg", ".jpeg", ".png"))
            ]

            in_db = student_id in embeddings_db

            students.append({
                "student_id": student_id,
                "name": name,
                "folder": folder,
                "photo_count": len(photos),
                "enrolled_in_db": in_db,
                "first_photo": f"/student-photos/{folder}/{photos[0]}"
                               if photos else None
            })
    else:
        logger.warning(f"Ground truth folder not found: {CLIENT_GROUND_TRUTH}")

    return {
        "total": len(students),
        "enrolled_in_db": sum(1 for s in students if s["enrolled_in_db"]),
        "students": students
    }

# ─── Reload Embeddings ────────────────────────────────────────

@app.post("/reload-embeddings")
def reload_embeddings():
    load_embeddings()
    return {"status": "ok", "students_enrolled": len(embeddings_db)}

# ─── Set Detection Size (front-end controlled) ────────────────

class SetDetSizeRequest(BaseModel):
    det_size: int = 320  # 320 = Fast, 640 = Accurate

@app.post("/set-det-size")
def set_det_size(req: SetDetSizeRequest):
    if req.det_size not in (320, 640):
        raise HTTPException(status_code=400, detail="det_size must be 320 or 640")
    if req.det_size != current_det_size:
        load_model(det_size=req.det_size)
    return {"status": "ok", "det_size": current_det_size}

@app.get("/det-size")
def get_det_size():
    return {"det_size": current_det_size}


from fastapi.responses import StreamingResponse
import json

@app.post("/extract-faces-stream")
def extract_faces_stream(req: ExtractFacesRequest):
    def generate():
        # Step 1: yield progress during frame extraction
        cap = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        vid_width    = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        MAX_WIDTH    = 640
        scale        = min(1.0, MAX_WIDTH / vid_width) if vid_width > MAX_WIDTH else 1.0

        all_embeddings, all_face_images, all_timestamps = [], [], []
        all_face_areas = []   # (h*w) for largest-face selection later
        frame_count = 0

        while True:
            # grab() advances codec without decoding — fast skip for non-processed frames
            if not cap.grab():
                break
            frame_count += 1
            if frame_count % req.frame_skip != 0:
                continue

            ret, frame = cap.retrieve()
            if not ret:
                continue

            # Downscale before detection — InsightFace resizes internally anyway
            if scale < 1.0:
                frame = cv2.resize(frame, None, fx=scale, fy=scale,
                                   interpolation=cv2.INTER_LINEAR)

            faces = face_app.get(frame)
            for face in faces:
                emb = face.embedding
                norm = np.linalg.norm(emb)
                if norm == 0:
                    continue
                emb = emb / norm
                bbox = face.bbox.astype(int)
                x1 = max(0, bbox[0]); y1 = max(0, bbox[1])
                x2 = min(frame.shape[1], bbox[2]); y2 = min(frame.shape[0], bbox[3])
                crop = frame[y1:y2, x1:x2]
                if crop.size > 0:
                    all_embeddings.append(emb)
                    all_face_images.append(crop)
                    all_face_areas.append(crop.shape[0] * crop.shape[1])
                    all_timestamps.append(round(frame_count / fps, 2))

            # Stream progress every 100 frames
            if frame_count % 100 == 0:
                progress = round((frame_count / total_frames) * 100, 1)
                yield f"data: {json.dumps({'type':'progress','frame':frame_count,'faces':len(all_embeddings),'progress':progress})}\n\n"

        cap.release()

        # Step 2: yield clustering progress
        yield f"data: {json.dumps({'type':'status','message':f'Clustering {len(all_embeddings)} faces...'})}\n\n"

        if not all_embeddings:
            yield f"data: {json.dumps({'type':'done','faces':[],'total_detections':0,'unique_faces':0})}\n\n"
            return

        labels, unique_labels = cluster_faces(all_embeddings, req.cluster_threshold, req.min_samples)

        # Step 3: yield final result with face images
        faces_out = []
        for cluster_id in unique_labels:
            indices  = np.where(labels == cluster_id)[0]
            best_idx = max(indices, key=lambda i: all_face_areas[i])
            face_img = all_face_images[best_idx]
            if face_img.size == 0:
                continue
            success, buffer = cv2.imencode('.jpg', face_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if not success:
                continue
            b64 = base64.b64encode(buffer.tobytes()).decode('utf-8')
            faces_out.append({
                "id": f"cluster_{cluster_id}",
                "imageData": f"data:image/jpeg;base64,{b64}",
                "frameCount": len(indices),
                "firstSeenSec": round(float(all_timestamps[indices[0]]), 1),
            })

        yield f"data: {json.dumps({'type':'done','faces':faces_out,'total_detections':len(all_embeddings),'unique_faces':len(faces_out)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"}
    )

# ─── Extract Faces (non-streaming, called directly by browser) ────

@app.post("/extract-faces")
def extract_faces_for_tagging(req: ExtractFacesRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    all_embeddings, all_face_images, all_timestamps = extract_all_faces(
        req.videoPath, face_app, req.frame_skip
    )

    if not all_embeddings:
        return {"faces": [], "total_detections": 0, "unique_faces": 0}

    labels, unique_labels = cluster_faces(
        all_embeddings, req.cluster_threshold, req.min_samples
    )

    faces_out = []
    for cluster_id in unique_labels:
        indices  = np.where(labels == cluster_id)[0]
        best_idx = max(indices, key=lambda i: (
            all_face_images[i].shape[0] * all_face_images[i].shape[1]
        ))
        face_img = all_face_images[best_idx]
        if face_img.size == 0:
            continue
        success, buffer = cv2.imencode('.jpg', face_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not success:
            continue
        b64 = base64.b64encode(buffer.tobytes()).decode('utf-8')
        faces_out.append({
            "id": f"cluster_{cluster_id}",
            "imageData": f"data:image/jpeg;base64,{b64}",
            "frameCount": len(indices),
            "firstSeenSec": round(float(all_timestamps[indices[0]]), 1),
        })

    logger.info(f"/extract-faces: {len(faces_out)} unique faces from {len(all_embeddings)} detections")
    return {
        "faces": faces_out,
        "total_detections": len(all_embeddings),
        "unique_faces": len(faces_out),
    }

# ─── Extract Faces from Video (Ground Truth Generation) ───────

@app.post("/extract-faces-from-video")
def extract_faces_from_video(req: ExtractFacesRequest):
    import urllib.request

    if face_app is None:
        raise HTTPException(status_code=500, detail="Face model not loaded.")

    # Build output folder: ground-truth/DEGREE_DEPARTMENT_YEAR/
    folder_name = f"{req.degree}_{req.department}_{req.year}"
    output_dir = os.path.join(CLIENT_GROUND_TRUTH, folder_name)
    os.makedirs(output_dir, exist_ok=True)
    logger.info(f"Extracting faces into: {output_dir}")

    # Download video to a temp file
    temp_video = os.path.join(BASE_DIR, "temp_extract.mp4")
    try:
        logger.info(f"Downloading video from: {req.videoUrl}")
        urllib.request.urlretrieve(req.videoUrl, temp_video)
        logger.info("Video downloaded successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download video: {e}")

    # Open video and extract faces
    cap = cv2.VideoCapture(temp_video)
    if not cap.isOpened():
        if os.path.exists(temp_video):
            os.remove(temp_video)
        raise HTTPException(status_code=400, detail="Cannot open downloaded video.")

    saved_faces = []
    frame_count = 0
    face_index = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1

            # Skip frames based on frame_skip
            if frame_count % req.frame_skip != 0:
                continue

            faces = face_app.get(frame)
            for face in faces:
                box = face.bbox.astype(int)
                x1, y1, x2, y2 = box

                # Clamp to frame bounds
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(frame.shape[1], x2)
                y2 = min(frame.shape[0], y2)

                crop = frame[y1:y2, x1:x2]
                if crop.size == 0:
                    continue

                filename = f"face_{face_index:04d}.jpg"
                filepath = os.path.join(output_dir, filename)
                cv2.imwrite(filepath, crop)
                saved_faces.append(filename)
                face_index += 1

    finally:
        cap.release()
        # Clean up temp video
        if os.path.exists(temp_video):
            os.remove(temp_video)

    logger.info(f"Extracted {len(saved_faces)} faces into {output_dir}")

    return {
        "status": "success",
        "folder": f"ground_truth/{folder_name}/",
        "output_dir": output_dir,
        "faces_extracted": len(saved_faces),
        "frames_processed": frame_count // req.frame_skip,
        "files": saved_faces
    }

# ─── Helper: Process Video Frames ─────────────────────────────

def process_frames(videoPath, frame_skip, match_threshold):
    cap = cv2.VideoCapture(videoPath)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Cannot open video.")

    detected = {}
    confidence_scores = {}
    frame_count = 0
    processed = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        if frame_count % frame_skip != 0:
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

            if best_id and best_score >= match_threshold:
                detected[best_id] = detected.get(best_id, 0) + 1
                if best_id not in confidence_scores:
                    confidence_scores[best_id] = []
                confidence_scores[best_id].append(best_score)

    cap.release()
    return detected, confidence_scores, frame_count, processed

# ─── Simple Process Video ──────────────────────────────────────

@app.post("/process-video")
def process_video(req: VideoRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if not embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    start = time.time()
    detected, confidence_scores, frame_count, processed = process_frames(
        req.videoPath, req.frame_skip, req.threshold
    )
    elapsed = time.time() - start

    attendance = {}
    for sid, data in embeddings_db.items():
        avg_conf = float(np.mean(confidence_scores[sid])) \
                   if sid in confidence_scores else 0.0
        attendance[sid] = {
            "name": data["name"],
            "status": "present" if detected.get(sid, 0) >= 3 else "absent",
            "detections": detected.get(sid, 0),
            "avg_confidence": round(avg_conf, 4)
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

# ─── Process Video with Roll List + Confidence Zones ──────────

@app.post("/process-video-with-rolllist")
def process_video_with_rolllist(req: CompareRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if not embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    start = time.time()
    detected, confidence_scores, frame_count, processed = process_frames(
        req.videoPath, req.frame_skip, req.review_threshold
    )
    elapsed = time.time() - start

    attendance = {}
    for sid, data in embeddings_db.items():
        det_count = detected.get(sid, 0)
        avg_conf = float(np.mean(confidence_scores[sid])) \
                   if sid in confidence_scores else 0.0

        if det_count >= req.min_detections and avg_conf >= req.auto_present_threshold:
            status = "present"
        elif det_count >= req.min_detections and avg_conf >= req.review_threshold:
            status = "review"
        else:
            status = "absent"

        attendance[sid] = {
            "name": data["name"],
            "status": status,
            "detections": det_count,
            "avg_confidence": round(avg_conf, 4),
            "confidence_zone": (
                "high"   if avg_conf >= req.auto_present_threshold else
                "medium" if avg_conf >= req.review_threshold else
                "low"
            )
        }

    roll_list = [r.strip().upper() for r in req.roll_list]
    comparison = []
    extra_students = []

    if roll_list:
        for roll_no in roll_list:
            if roll_no in attendance:
                comparison.append({
                    "roll_no": roll_no,
                    "name": attendance[roll_no]["name"],
                    "ml_status": attendance[roll_no]["status"],
                    "detections": attendance[roll_no]["detections"],
                    "avg_confidence": attendance[roll_no]["avg_confidence"],
                    "confidence_zone": attendance[roll_no]["confidence_zone"],
                    "in_roll_list": True,
                    "in_ml_db": True,
                    "manually_approved": None
                })
            else:
                comparison.append({
                    "roll_no": roll_no,
                    "name": "Not Enrolled",
                    "ml_status": "not_enrolled",
                    "detections": 0,
                    "avg_confidence": 0,
                    "confidence_zone": "low",
                    "in_roll_list": True,
                    "in_ml_db": False,
                    "manually_approved": None
                })

        for sid in attendance:
            if sid.upper() not in roll_list:
                extra_students.append({
                    "roll_no": sid,
                    "name": attendance[sid]["name"],
                    "ml_status": attendance[sid]["status"],
                    "detections": attendance[sid]["detections"],
                    "avg_confidence": attendance[sid]["avg_confidence"],
                    "confidence_zone": attendance[sid]["confidence_zone"],
                    "in_roll_list": False,
                    "in_ml_db": True,
                    "manually_approved": None
                })
    else:
        for sid, data in attendance.items():
            comparison.append({
                "roll_no": sid,
                "name": data["name"],
                "ml_status": data["status"],
                "detections": data["detections"],
                "avg_confidence": data["avg_confidence"],
                "confidence_zone": data["confidence_zone"],
                "in_roll_list": False,
                "in_ml_db": True,
                "manually_approved": None
            })

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    review  = sum(1 for v in attendance.values() if v["status"] == "review")
    absent  = sum(1 for v in attendance.values() if v["status"] == "absent")

    return {
        "attendance": attendance,
        "comparison": comparison,
        "extra_students": extra_students,
        "thresholds": {
            "auto_present": req.auto_present_threshold,
            "review": req.review_threshold,
            "min_detections": req.min_detections
        },
        "summary": {
            "total_in_roll_list": len(roll_list),
            "total_in_ml_db": len(embeddings_db),
            "present": present,
            "review": review,
            "absent": absent,
            "not_enrolled": sum(1 for c in comparison if not c["in_ml_db"]),
            "extra_in_db": len(extra_students),
            "processing_time": round(elapsed, 2),
            "frames_processed": processed
        }
    }

# ─── Script Runner Helper ──────────────────────────────────────

def run_script_stream(script_path, args_list):
    def generate():
        process = subprocess.Popen(
            [sys.executable, script_path] + args_list,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=os.path.dirname(script_path)
        )
        for line in iter(process.stdout.readline, ''):
            yield f"data: {json.dumps({'log': line.rstrip()})}\n\n"
        process.wait()
        if process.returncode == 0:
            yield f"data: {json.dumps({'status': 'done', 'code': 0})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'error', 'code': process.returncode})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

# ─── Build Embeddings DB ───────────────────────────────────────

@app.post("/build-embeddings")
def build_embeddings(req: BuildEmbeddingsRequest):
    script_path = os.path.join(BASE_DIR, "build_embeddings_db.py")
    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail="build_embeddings_db.py not found")

    photos_dir = os.path.abspath(req.photos_dir) \
        if not os.path.isabs(req.photos_dir) \
        else req.photos_dir

    if not os.path.exists(photos_dir):
        raise HTTPException(
            status_code=404,
            detail=f"Photos dir not found: {photos_dir}"
        )

    return run_script_stream(script_path, [
        "--photos-dir", photos_dir,
        "--output", req.output_path
    ])

# ─── Download LFW Dataset ──────────────────────────────────────

@app.post("/download-dataset")
def download_dataset(req: DownloadDatasetRequest):
    script_path = os.path.join(BASE_DIR, "download_and_org.py")
    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail="download_and_org.py not found")

    return run_script_stream(script_path, [
        "--output-dir", req.output_dir,
        "--num-students", str(req.num_students),
        "--min-photos", str(req.min_photos),
        "--enrollment-ratio", str(req.enrollment_ratio)
    ])

# ─── Test Full Pipeline ────────────────────────────────────────

@app.post("/test-pipeline")
def test_pipeline(req: TestPipelineRequest):
    script_path = os.path.join(BASE_DIR, "test_full_pipeline.py")
    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail="test_full_pipeline.py not found")

    if not os.path.exists(req.video_path):
        raise HTTPException(
            status_code=404,
            detail=f"Video not found: {req.video_path}"
        )

    args = [
        "--video", req.video_path,
        "--threshold", str(req.threshold),
        "--frame-skip", str(req.frame_skip),
        "--skip-enrollment",
        "--ground-truth", req.ground_truth_file or req.video_path
    ]

    return run_script_stream(script_path, args)

# ─── Build Embeddings Sync ────────────────────────────────────

@app.post("/build-embeddings-sync")
def build_embeddings_sync(req: BuildEmbeddingsRequest):
    """
    Synchronous version of build embeddings.
    Used by videoWatcher for auto rebuild.
    Returns result directly instead of streaming.
    """
    import cv2 as cv

    photos_dir = req.photos_dir
    output_path = req.output_path

    if not os.path.exists(photos_dir):
        raise HTTPException(
            status_code=404,
            detail=f"Photos dir not found: {photos_dir}"
        )

    student_folders = [
        f for f in os.listdir(photos_dir)
        if os.path.isdir(os.path.join(photos_dir, f))
    ]

    db = {}
    for folder in sorted(student_folders):
        parts = folder.split("_", 1)
        student_id = parts[0]
        name = parts[1].replace("_", " ") if len(parts) > 1 else folder
        folder_path = os.path.join(photos_dir, folder)

        photos = [
            f for f in os.listdir(folder_path)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        embeddings = []
        for photo in photos:
            img = cv.imread(os.path.join(folder_path, photo))
            if img is None:
                continue
            faces = face_app.get(img)
            if faces:
                emb = faces[0].embedding
                norm = np.linalg.norm(emb)
                if norm > 0:
                    emb = emb / norm
                embeddings.append(emb)

        if embeddings:
            mean_emb = np.mean(embeddings, axis=0)
            mean_emb = mean_emb / np.linalg.norm(mean_emb)
            db[student_id] = {
                "name": name,
                "embedding": mean_emb,
                "num_photos": len(embeddings)
            }
            logger.info(f"✓ {student_id} ({name}): {len(embeddings)} photos")
        else:
            logger.warning(f"✗ {student_id}: no faces detected")

    with open(output_path, "wb") as f:
        pickle.dump(db, f)

    # Auto reload into memory
    global embeddings_db
    embeddings_db = db
    logger.info(f"Auto rebuilt DB: {len(db)} students enrolled")

    return {
        "status": "done",
        "students_enrolled": len(db),
        "output_path": output_path
    }

# ─── Extract + Save Ground Truth (serial folders, no roll-no needed) ──

class ExtractSaveGTRequest(BaseModel):
    videoPath: str
    batchName: str               # e.g. "BTECH_ECE_2023"
    frame_skip: int = 5
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_images: int = 10         # images to save per person
    det_size: int = 320          # 320 = Fast, 640 = Accurate
    match_threshold: float = 0.55  # cosine similarity to match existing folder (dedup)

@app.post("/extract-save-ground-truth")
def extract_save_ground_truth(req: ExtractSaveGTRequest):
    """
    Extract faces from video, cluster them, and save ≥min_images per
    unique person to  ground_truth/{batchName}/person_001/ … person_NNN/
    WITHOUT needing roll numbers — assign roll numbers later.
    Streams SSE progress every 15 seconds.
    """
    def generate():
        import time as _t
        def sse(d): return f"data: {json.dumps(d)}\n\n"
        EMIT = 15

        if not os.path.exists(req.videoPath):
            yield sse({"type": "error", "message": f"Video not found: {req.videoPath}"})
            return
        if face_app is None:
            yield sse({"type": "error", "message": "Face model not loaded"})
            return

        # Reload model if det_size changed
        if req.det_size != current_det_size:
            yield sse({"type": "stage", "stage": "loading",
                       "message": f"Reloading model with det_size={req.det_size}…"})
            load_model(det_size=req.det_size)

        batch_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batchName)
        os.makedirs(batch_dir, exist_ok=True)

        start     = _t.time()
        yield sse({"type": "stage", "stage": "extracting",
                   "message": f"Opening video → extracting faces (batch: {req.batchName}, det_size={req.det_size})…"})

        # ── Extract (same optimised approach: grab/retrieve + resize) ──
        cap          = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        vid_width    = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        scale        = min(1.0, 640 / vid_width) if vid_width > 640 else 1.0
        duration_sec = round(total_frames / fps, 1)

        yield sse({"type": "stage", "stage": "extracting",
                   "message": f"Video: {duration_sec}s, {total_frames} frames, "
                              f"processing every {req.frame_skip} frames",
                   "total_frames": total_frames, "duration_sec": duration_sec})

        all_embeddings, all_face_images, all_timestamps = [], [], []
        frame_count = 0
        last_emit   = _t.time()

        while True:
            if not cap.grab():
                break
            frame_count += 1
            if frame_count % req.frame_skip != 0:
                continue
            ret, frame = cap.retrieve()
            if not ret:
                continue
            if scale < 1.0:
                frame = cv2.resize(frame, None, fx=scale, fy=scale,
                                   interpolation=cv2.INTER_LINEAR)
            for face in face_app.get(frame):
                emb  = face.embedding
                norm = np.linalg.norm(emb)
                if norm == 0:
                    continue
                emb = emb / norm
                bbox = face.bbox.astype(int)
                x1 = max(0, bbox[0]); y1 = max(0, bbox[1])
                x2 = min(frame.shape[1], bbox[2]); y2 = min(frame.shape[0], bbox[3])
                crop = frame[y1:y2, x1:x2]
                if crop.size > 0:
                    all_embeddings.append(emb)
                    all_face_images.append(crop)
                    all_timestamps.append(round(frame_count / fps, 2))

            now = _t.time()
            if now - last_emit >= EMIT:
                pct = round((frame_count / total_frames) * 100, 1) if total_frames else 0
                yield sse({"type": "progress", "stage": "extracting",
                           "frame": frame_count, "total_frames": total_frames,
                           "faces_found": len(all_embeddings), "progress": pct,
                           "elapsed_sec": round(now - start, 1),
                           "message": f"Frame {frame_count:,}/{total_frames:,} ({pct}%) "
                                      f"— {len(all_embeddings)} faces"})
                last_emit = now

        cap.release()
        total_faces = len(all_embeddings)

        if total_faces == 0:
            yield sse({"type": "error", "message": "No faces detected in video"})
            return

        yield sse({"type": "stage", "stage": "clustering",
                   "message": f"Extracted {total_faces} faces. Clustering…",
                   "faces_found": total_faces,
                   "elapsed_sec": round(_t.time() - start, 1)})

        # ── Cluster ──
        euclidean_eps = float(np.sqrt(2.0 * (1.0 - req.cluster_threshold)))
        clustering    = _DBSCAN(
            eps=euclidean_eps, min_samples=req.min_samples,
            metric='euclidean', algorithm='ball_tree', n_jobs=-1
        ).fit(np.array(all_embeddings))
        labels        = clustering.labels_
        unique_labels = sorted(set(labels) - {-1})

        yield sse({"type": "stage", "stage": "saving",
                   "message": f"Found {len(unique_labels)} unique people. Saving images…",
                   "clusters_found": len(unique_labels),
                   "elapsed_sec": round(_t.time() - start, 1)})

        # ── Load mean embeddings for existing person folders (deduplication) ──
        existing_person_dirs = sorted([
            d for d in os.listdir(batch_dir)
            if os.path.isdir(os.path.join(batch_dir, d)) and d.startswith("person_")
        ])
        existing_mean_embs = {}  # folder_name -> mean L2-normalised embedding

        if existing_person_dirs:
            yield sse({"type": "stage", "stage": "dedup",
                       "message": f"Loading {len(existing_person_dirs)} existing folders for deduplication…"})
            for folder_name in existing_person_dirs:
                folder_path = os.path.join(batch_dir, folder_name)
                img_files   = [f for f in os.listdir(folder_path)
                               if f.lower().endswith((".jpg", ".jpeg", ".png"))]
                folder_embs = []
                for img_file in img_files[:5]:   # up to 5 images is enough for a mean
                    img = cv2.imread(os.path.join(folder_path, img_file))
                    if img is None:
                        continue
                    faces = face_app.get(img)
                    if faces:
                        emb  = faces[0].embedding
                        norm = np.linalg.norm(emb)
                        if norm > 0:
                            folder_embs.append(emb / norm)
                if folder_embs:
                    mean_emb = np.mean(folder_embs, axis=0)
                    existing_mean_embs[folder_name] = mean_emb / np.linalg.norm(mean_emb)

        # Next serial starts after ALL existing dirs (not just person_XXX)
        all_existing = [d for d in os.listdir(batch_dir)
                        if os.path.isdir(os.path.join(batch_dir, d))]
        next_serial = len(all_existing) + 1

        # ── Save ≥min_images per person; deduplicate against existing folders ──
        saved_total = 0
        for cluster_id in unique_labels:
            indices = np.where(labels == cluster_id)[0]
            n       = len(indices)

            # Compute mean embedding for this cluster
            cluster_embs = np.array([all_embeddings[i] for i in indices])
            cluster_mean = np.mean(cluster_embs, axis=0)
            cluster_mean = cluster_mean / np.linalg.norm(cluster_mean)

            # Check if this cluster matches an existing person folder
            best_folder = None
            best_score  = 0.0
            for fname, existing_emb in existing_mean_embs.items():
                score = float(np.dot(cluster_mean, existing_emb))
                if score > best_score:
                    best_score = score
                    best_folder = fname

            if best_folder and best_score >= req.match_threshold:
                # Append to existing folder (same person seen in different video)
                folder = os.path.join(batch_dir, best_folder)
                folder_label = f"{best_folder} (matched, score={best_score:.2f})"
                # Update mean so later clusters in this run can also match
                existing_mean_embs[best_folder] = cluster_mean
            else:
                # New person — create next serial folder
                folder_name = f"person_{next_serial:03d}"
                next_serial += 1
                folder = os.path.join(batch_dir, folder_name)
                os.makedirs(folder, exist_ok=True)
                existing_mean_embs[folder_name] = cluster_mean
                folder_label = f"new {folder_name}"

            if n <= req.min_images:
                chosen = list(indices)
            else:
                step   = n / req.min_images
                chosen = [indices[int(i * step)] for i in range(req.min_images)]

            for idx in chosen:
                img = all_face_images[idx]
                if img.size > 0:
                    cv2.imwrite(
                        os.path.join(folder, f"t{all_timestamps[idx]}s_f{idx}.jpg"),
                        img
                    )
                    saved_total += 1

            logger.info(f"[GT] cluster {cluster_id}: {n} detections → {folder_label}, "
                        f"{len(chosen)} images")

        elapsed = round(_t.time() - start, 2)
        yield sse({"type": "done",
                   "people_detected": len(unique_labels),
                   "images_saved":    saved_total,
                   "batch_dir":       batch_dir,
                   "elapsed_sec":     elapsed,
                   "message": f"Done in {elapsed}s — {len(unique_labels)} people detected, "
                              f"{saved_total} images saved to {req.batchName}/"})

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ─── Match Clusters to ERP Photos ────────────────────────────

class MatchClustersRequest(BaseModel):
    batch_dir: str        # absolute path to e.g. ground_truth/BTECH_CSE_2023/
    erp_photos_dir: str   # absolute path to erp_photos/
    top_k: int = 3        # return top-k candidates per cluster

@app.post("/match-clusters-to-erp")
def match_clusters_to_erp(req: MatchClustersRequest):
    """
    For each person_XXX folder in batch_dir:
      - Compute mean embedding from stored face crops
      - Compare against every ERP photo embedding
      - Return top_k candidates with confidence scores
    ERP photos must be named {rollNo}.jpg / .png / .jpeg
    """
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")
    if not os.path.isdir(req.batch_dir):
        raise HTTPException(status_code=404, detail=f"batch_dir not found: {req.batch_dir}")
    if not os.path.isdir(req.erp_photos_dir):
        raise HTTPException(status_code=404, detail=f"erp_photos_dir not found: {req.erp_photos_dir}")

    IMG_EXTS = ('.jpg', '.jpeg', '.png', '.webp')

    # ── Step 1: Build ERP embeddings ────────────────────────────
    erp_embs = {}   # roll_no → {embedding, photo_filename}
    for fname in sorted(os.listdir(req.erp_photos_dir)):
        if not fname.lower().endswith(IMG_EXTS):
            continue
        roll_no = os.path.splitext(fname)[0]
        img = cv2.imread(os.path.join(req.erp_photos_dir, fname))
        if img is None:
            continue
        faces = face_app.get(img)
        if not faces:
            logger.warning(f"No face detected in ERP photo: {fname}")
            continue
        emb  = faces[0].embedding
        norm = np.linalg.norm(emb)
        if norm > 0:
            erp_embs[roll_no] = {"embedding": emb / norm, "photo": fname}

    logger.info(f"[ERP Match] Built embeddings for {len(erp_embs)} ERP students")

    if not erp_embs:
        raise HTTPException(status_code=400, detail="No faces detected in any ERP photo")

    # Stack all ERP embeddings for fast matrix multiply
    erp_rolls  = list(erp_embs.keys())
    erp_matrix = np.array([erp_embs[r]["embedding"] for r in erp_rolls])  # (N, 512)

    # ── Step 2: Match each person_XXX cluster ───────────────────
    matches = {}
    for folder_name in sorted(os.listdir(req.batch_dir)):
        if not re.match(r"^person_\d+$", folder_name, re.IGNORECASE):
            continue
        folder_path = os.path.join(req.batch_dir, folder_name)
        img_files   = [f for f in os.listdir(folder_path) if f.lower().endswith(IMG_EXTS)]

        cluster_embs = []
        for img_file in img_files[:10]:   # use up to 10 images for the mean
            img = cv2.imread(os.path.join(folder_path, img_file))
            if img is None:
                continue
            faces = face_app.get(img)
            if faces:
                emb  = faces[0].embedding
                norm = np.linalg.norm(emb)
                if norm > 0:
                    cluster_embs.append(emb / norm)

        if not cluster_embs:
            matches[folder_name] = {"error": "no faces detected in cluster images"}
            continue

        mean_emb = np.mean(cluster_embs, axis=0)
        mean_emb = mean_emb / np.linalg.norm(mean_emb)

        # Cosine similarity with all ERP photos at once
        scores  = erp_matrix @ mean_emb          # (N,)
        top_idx = np.argsort(scores)[::-1][:req.top_k]

        candidates = [
            {
                "rollNo":     erp_rolls[i],
                "confidence": round(float(scores[i]), 4),
                "erpPhoto":   erp_embs[erp_rolls[i]]["photo"],
            }
            for i in top_idx
        ]

        matches[folder_name] = {
            "best":          candidates[0],
            "candidates":    candidates,
            "image_count":   len(img_files),
            "preview_images": img_files[:6],
        }
        logger.info(f"[ERP Match] {folder_name} → {candidates[0]['rollNo']} "
                    f"({candidates[0]['confidence']:.3f})")

    return {
        "matches":      matches,
        "erp_students": len(erp_embs),
        "clusters":     len(matches),
    }


# ─── Streaming Clustering (live SSE progress) ─────────────────

class ClusterStreamRequest(BaseModel):
    videoPath: str
    frame_skip: int = 10
    cluster_threshold: float = 0.45
    min_samples: int = 2
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []

@app.post("/process-video-clustering-stream")
def process_video_clustering_stream(req: ClusterStreamRequest):
    """
    Full clustering pipeline with live SSE progress updates.
    Emits a progress event every EMIT_INTERVAL seconds during face extraction,
    plus instant stage-change events for clustering, identifying, and done.
    """
    def generate():
        import time as _time

        def sse(data: dict) -> str:
            return f"data: {json.dumps(data)}\n\n"

        EMIT_INTERVAL = 15  # seconds between progress updates

        if not os.path.exists(req.videoPath):
            yield sse({"type": "error", "message": f"Video not found: {req.videoPath}"})
            return
        if face_app is None:
            yield sse({"type": "error", "message": "Face model not loaded"})
            return
        if not embeddings_db:
            yield sse({"type": "error", "message": "No embeddings loaded. Build embeddings first."})
            return

        start = _time.time()
        yield sse({"type": "stage", "stage": "start",
                   "message": "Starting — opening video file..."})

        # ── Step 1: Extract faces with periodic progress ──
        cap = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        vid_width    = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        MAX_WIDTH    = 640
        scale        = min(1.0, MAX_WIDTH / vid_width) if vid_width > MAX_WIDTH else 1.0

        duration_sec = round(total_frames / fps, 1) if fps else 0
        yield sse({"type": "stage", "stage": "extracting",
                   "message": f"Extracting faces — video is {duration_sec}s "
                              f"({total_frames} frames, processing every {req.frame_skip} frames)",
                   "total_frames": total_frames, "duration_sec": duration_sec})

        all_embeddings, all_face_images, all_timestamps = [], [], []
        frame_count = 0
        last_emit   = _time.time()

        while True:
            if not cap.grab():
                break
            frame_count += 1
            if frame_count % req.frame_skip != 0:
                continue

            ret, frame = cap.retrieve()
            if not ret:
                continue

            if scale < 1.0:
                frame = cv2.resize(frame, None, fx=scale, fy=scale,
                                   interpolation=cv2.INTER_LINEAR)

            faces = face_app.get(frame)
            timestamp = round(frame_count / fps, 2)

            for face in faces:
                emb  = face.embedding
                norm = np.linalg.norm(emb)
                if norm == 0:
                    continue
                emb = emb / norm
                bbox = face.bbox.astype(int)
                x1 = max(0, bbox[0]); y1 = max(0, bbox[1])
                x2 = min(frame.shape[1], bbox[2]); y2 = min(frame.shape[0], bbox[3])
                crop = frame[y1:y2, x1:x2]
                if crop.size > 0:
                    all_embeddings.append(emb)
                    all_face_images.append(crop)
                    all_timestamps.append(timestamp)

            now = _time.time()
            if now - last_emit >= EMIT_INTERVAL:
                progress = round((frame_count / total_frames) * 100, 1) if total_frames else 0
                elapsed  = round(now - start, 1)
                eta      = round((elapsed / max(progress, 0.1)) * (100 - progress), 0) if progress > 0 else None
                yield sse({
                    "type":         "progress",
                    "stage":        "extracting",
                    "frame":        frame_count,
                    "total_frames": total_frames,
                    "faces_found":  len(all_embeddings),
                    "progress":     progress,
                    "elapsed_sec":  elapsed,
                    "eta_sec":      eta,
                    "message":      f"Frame {frame_count:,}/{total_frames:,} ({progress}%) "
                                    f"— {len(all_embeddings)} faces found — {elapsed}s elapsed"
                })
                last_emit = now

        cap.release()
        total_faces = len(all_embeddings)
        yield sse({
            "type":        "stage",
            "stage":       "clustering",
            "message":     f"Extraction done — {total_faces} face detections. "
                           f"Clustering into unique people...",
            "faces_found": total_faces,
            "elapsed_sec": round(_time.time() - start, 1)
        })

        if not all_embeddings:
            yield sse({"type": "error", "message": "No faces detected in video"})
            return

        # ── Step 2: DBSCAN cluster ──
        cosine_eps     = 1.0 - req.cluster_threshold
        euclidean_eps  = float(np.sqrt(2.0 * cosine_eps))
        embeddings_arr = np.array(all_embeddings)
        clustering = _DBSCAN(
            eps=euclidean_eps, min_samples=req.min_samples,
            metric='euclidean', algorithm='ball_tree', n_jobs=-1
        ).fit(embeddings_arr)
        labels        = clustering.labels_
        unique_labels = set(labels)
        unique_labels.discard(-1)

        yield sse({
            "type":           "stage",
            "stage":          "identifying",
            "message":        f"Found {len(unique_labels)} unique face clusters. "
                              f"Matching against {len(embeddings_db)} enrolled students...",
            "clusters_found": len(unique_labels),
            "elapsed_sec":    round(_time.time() - start, 1)
        })

        # ── Step 3+4: Identify + save images ──
        video_name = os.path.splitext(os.path.basename(req.videoPath))[0]
        output_dir = os.path.join(req.output_dir, video_name)

        attendance, cluster_results = identify_clusters(
            labels, unique_labels,
            all_embeddings, all_face_images, all_timestamps,
            embeddings_db, output_dir,
            req.auto_present_threshold, req.review_threshold
        )

        elapsed = round(_time.time() - start, 2)
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
                "total_faces_extracted": total_faces,
                "unique_clusters_found": len(unique_labels),
                "unknown_faces":         unknown,
                "total_enrolled":        len(embeddings_db),
                "present":               present,
                "review":                review,
                "absent":                absent,
                "processing_time":       elapsed,
            }
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
                        "confidence_zone": a["confidence_zone"],
                        "cluster_folder": a["cluster_folder"],
                        "first_seen_sec": a["first_seen_sec"],
                        "in_roll_list": True, "in_ml_db": True
                    })
                else:
                    comparison.append({
                        "roll_no": roll_no, "name": "Not Enrolled",
                        "status": "not_enrolled", "avg_confidence": 0,
                        "confidence_zone": "low", "cluster_folder": None,
                        "first_seen_sec": None,
                        "in_roll_list": True, "in_ml_db": False
                    })
            result["comparison"] = comparison

        yield sse({
            "type":    "done",
            "result":  result,
            "message": f"Completed in {elapsed}s — "
                       f"Present: {present}  Review: {review}  Absent: {absent}  Unknown: {unknown}"
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


# ─── Clustering ───────────────────────────────────────────────

class ClusterRequest(BaseModel):
    videoPath: str
    frame_skip: int = 10
    cluster_threshold: float = 0.45
    min_samples: int = 2
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []

@app.post("/process-video-clustering")
def process_video_clustering(req: ClusterRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(
            status_code=404,
            detail=f"Video not found: {req.videoPath}"
        )
    if not embeddings_db:
        raise HTTPException(
            status_code=400,
            detail="No embeddings loaded."
        )

    result = process_video_with_clustering(
        video_path=req.videoPath,
        embeddings_db=embeddings_db,
        face_app=face_app,
        frame_skip=req.frame_skip,
        cluster_threshold=req.cluster_threshold,
        min_samples=req.min_samples,
        auto_present_threshold=req.auto_present_threshold,
        review_threshold=req.review_threshold,
        output_base_dir=req.output_dir
    )

    # If roll list provided, compare against it
    if req.roll_list:
        roll_list = [r.strip().upper() for r in req.roll_list]
        comparison = []

        for roll_no in roll_list:
            if roll_no in result["attendance"]:
                a = result["attendance"][roll_no]
                comparison.append({
                    "roll_no":         roll_no,
                    "name":            a["name"],
                    "status":          a["status"],
                    "avg_confidence":  a["avg_confidence"],
                    "confidence_zone": a["confidence_zone"],
                    "cluster_folder":  a["cluster_folder"],
                    "first_seen_sec":  a["first_seen_sec"],
                    "in_roll_list":    True,
                    "in_ml_db":        True
                })
            else:
                comparison.append({
                    "roll_no":         roll_no,
                    "name":            "Not Enrolled",
                    "status":          "not_enrolled",
                    "avg_confidence":  0,
                    "confidence_zone": "low",
                    "cluster_folder":  None,
                    "first_seen_sec":  None,
                    "in_roll_list":    True,
                    "in_ml_db":        False
                })

        result["comparison"] = comparison

    return result

# ─── Cluster-Only (no roll-number assignment needed) ──────────

class ClusterOnlyRequest(BaseModel):
    videoPath: str
    frame_skip: int = 10
    cluster_threshold: float = 0.45
    min_samples: int = 2
    min_images_per_cluster: int = 5
    output_dir: str = "./clustering_output"

@app.post("/cluster-only")
def cluster_only(req: ClusterOnlyRequest):
    """
    Extract faces, cluster them, and save each cluster to a serial-numbered
    folder (cluster_001, cluster_002, …) WITHOUT requiring roll numbers.
    Roll numbers can be assigned later via /assign-rollno.
    """
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    result = process_video_cluster_only(
        video_path=req.videoPath,
        face_app=face_app,
        frame_skip=req.frame_skip,
        cluster_threshold=req.cluster_threshold,
        min_samples=req.min_samples,
        min_images_per_cluster=req.min_images_per_cluster,
        output_base_dir=req.output_dir,
    )
    return result


class AssignRollNoRequest(BaseModel):
    output_dir: str        # The video's cluster output directory
    cluster_folder: str    # e.g., "cluster_001"
    roll_no: str
    name: str = ""

@app.post("/assign-rollno")
def assign_rollno(req: AssignRollNoRequest):
    """
    Assign a roll number to a serial cluster folder by renaming it.
    Updates cluster_metadata.json in the same output_dir.
    """
    old_path = os.path.join(req.output_dir, req.cluster_folder)
    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail=f"Cluster folder not found: {old_path}")

    new_name = (
        f"{req.roll_no}_{req.name.replace(' ', '_')}"
        if req.name else req.roll_no
    )
    new_path = os.path.join(req.output_dir, new_name)

    if os.path.exists(new_path):
        raise HTTPException(status_code=409, detail=f"Folder already exists: {new_name}")

    os.rename(old_path, new_path)

    # Update metadata JSON
    metadata_path = os.path.join(req.output_dir, "cluster_metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        for cluster in metadata.get("clusters", []):
            if cluster["folder_name"] == req.cluster_folder:
                cluster["folder_name"]   = new_name
                cluster["roll_no"]       = req.roll_no
                cluster["assigned_name"] = req.name
                break
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

    logger.info(f"Assigned {req.roll_no} ({req.name}) → {req.cluster_folder} → {new_name}")
    return {"status": "ok", "old_folder": req.cluster_folder, "new_folder": new_name}


@app.get("/cluster-metadata")
def get_cluster_metadata(output_dir: str):
    """Return the cluster_metadata.json for a given output directory."""
    metadata_path = os.path.join(output_dir, "cluster_metadata.json")
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail=f"No metadata found in: {output_dir}")
    with open(metadata_path, "r") as f:
        return json.load(f)


# ─── Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8500, reload=False)