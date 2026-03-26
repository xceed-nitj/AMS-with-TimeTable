import os
import pickle
import time
import numpy as np
import cv2
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from clustering_service import process_video_with_clustering, extract_all_faces, cluster_faces
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
<<<<<<< HEAD
    videoPath: str
    frame_skip: int = 5
    cluster_threshold: float = 0.45
    min_samples: int = 2

class ClusterRequest(BaseModel):
    videoPath: str
    frame_skip: int = 10
    cluster_threshold: float = 0.45
    min_samples: int = 2
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []
=======
    videoUrl: str
    degree: str
    department: str
    year: str
    frame_skip: int = 10
>>>>>>> main

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

<<<<<<< HEAD
# ─── Extract Faces for Ground Truth Tagging ───────────────────

@app.post("/extract-faces")
def extract_faces_for_tagging(req: ExtractFacesRequest):
    """
    Extracts unique face clusters from a video and returns them as base64 images.
    Used by Ground Truth Generation page — returns faces for manual roll-number tagging.
    Does NOT compare against the embeddings DB.
    """
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Step 1+2: Extract all face embeddings + crops from video
    all_embeddings, all_face_images, all_timestamps = extract_all_faces(
        req.videoPath, face_app, req.frame_skip
    )

    if not all_embeddings:
        return {"faces": [], "total_detections": 0, "unique_faces": 0}

    # Step 3: Cluster to find unique people
    labels, unique_labels = cluster_faces(
        all_embeddings, req.cluster_threshold, req.min_samples
    )

    faces_out = []

    for cluster_id in unique_labels:
        indices = np.where(labels == cluster_id)[0]

        # Pick the largest face crop from this cluster as the representative image
        best_idx = max(indices, key=lambda i: (
            all_face_images[i].shape[0] * all_face_images[i].shape[1]
            if all_face_images[i].size > 0 else 0
        ))

        face_img = all_face_images[best_idx]
        if face_img.size == 0:
            continue

        # Encode to base64 JPEG
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

    logger.info(
        f"/extract-faces: {len(faces_out)} unique faces found "
        f"from {len(all_embeddings)} total detections"
    )

    return {
        "faces": faces_out,
        "total_detections": len(all_embeddings),
        "unique_faces": len(faces_out),
    }

# ─── Process Video with Clustering ────────────────────────────
=======
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
>>>>>>> main

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

<<<<<<< HEAD
    # if roll list provided, compare against it
=======
    # If roll list provided, compare against it
>>>>>>> main
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

# ─── Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8500, reload=False)