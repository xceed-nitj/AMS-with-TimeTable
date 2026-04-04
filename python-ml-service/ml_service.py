import os, re, pickle, time, json, base64, logging, subprocess, sys
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import uvicorn

# ── Import clustering service (same folder) ───────────────────────────────────
from clustering_service import (
    extract_all_faces,
    cluster_faces,
    identify_clusters,
    process_video_with_clustering,
    process_video_cluster_only,
    _detect_faces_tiled,
    _build_ui_mask,
    INSIGHTFACE_DET_SIZE,
)
from sklearn.cluster import DBSCAN as _DBSCAN

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger("ml_service")

# ─── Quality + Alignment Enhancements ─────────────────────

def compute_face_quality(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)
    brightness_score = 1 - abs(brightness - 127) / 127
    h, w = img.shape[:2]
    size_score = np.sqrt(h * w)
    return sharpness * 0.6 + brightness_score * 50 + size_score * 0.1

def normalize_lighting(img):
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
    return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

def get_aligned_face(face_app, frame, face, min_face_size=50):
    x1, y1, x2, y2 = map(int, face.bbox)
    w, h = x2 - x1, y2 - y1

    if min(w, h) < min_face_size:
        return None

    if face.det_score < 0.6:
        return None

    if face.kps is not None:
        left_eye, right_eye = face.kps[0], face.kps[1]
        if np.linalg.norm(left_eye - right_eye) < 20:
            return None

    aligned = face_app.norm_crop(frame, landmark=face.kps)
    aligned = cv2.resize(aligned, (160, 160))
    aligned = normalize_lighting(aligned)

    return aligned


app = FastAPI(title="Facial Recognition ML Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

face_app         = None
current_det_size = INSIGHTFACE_DET_SIZE
embeddings_db    = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH  = os.path.join(BASE_DIR, "embeddings_db.pkl")
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ground_truth")

logger.info(f"ROOT_DIR: {ROOT_DIR}")
logger.info(f"DB_PATH:  {DB_PATH}")
logger.info(f"CLIENT_GROUND_TRUTH: {CLIENT_GROUND_TRUTH}")

# ─── Request Models ───────────────────────────────────────────────────────────

class VideoRequest(BaseModel):
    videoPath: str
    threshold: float = 0.45
    frame_skip: int = 3

class CompareRequest(BaseModel):
    videoPath: str
    threshold: float = 0.45
    frame_skip: int = 3
    roll_list: List[str] = []
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    min_detections: int = 3
    batch_name: str = ""
    auto_enroll: bool = False
    auto_enroll_threshold: float = 0.60
    max_gt_images: int = 10

class BuildEmbeddingsRequest(BaseModel):
    photos_dir: str = CLIENT_GROUND_TRUTH
    output_path: str = DB_PATH

class ExtractFacesRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_face_size: int = 15

class ExtractSaveGTRequest(BaseModel):
    videoPath: str
    batchName: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_images: int = 10
    det_size: int = INSIGHTFACE_DET_SIZE
    match_threshold: float = 0.55
    min_face_size: int = 15
    laplacian_threshold: float = 30.0
    top_n: int = 10

class SetDetSizeRequest(BaseModel):
    det_size: int = INSIGHTFACE_DET_SIZE

class ClusterStreamRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []

class ClusterRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []

class ClusterOnlyRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_images_per_cluster: int = 5
    output_dir: str = "./clustering_output"

class UpdateEmbeddingRequest(BaseModel):
    batch_name: str
    roll_no: str
    embedding_files: List[str]

class AssignRollNoRequest(BaseModel):
    output_dir: str
    cluster_folder: str
    roll_no: str
    name: str = ""

class MatchClustersRequest(BaseModel):
    batch_dir: str
    erp_photos_dir: str
    top_k: int = 3

class TestPipelineRequest(BaseModel):
    video_path: str
    ground_truth_file: str = ""
    threshold: float = 0.45
    frame_skip: int = 3

# ─── Startup / model loading ──────────────────────────────────────────────────

def load_model(det_size: int = INSIGHTFACE_DET_SIZE):
    global face_app, current_det_size
    from insightface.app import FaceAnalysis
    current_det_size = det_size
    logger.info(f"Loading InsightFace buffalo_s (CPU, det_size={det_size})…")
    face_app = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0, det_size=(640, 640))
    logger.info("Model loaded.")

def load_embeddings():
    global embeddings_db
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "rb") as f:
            embeddings_db = pickle.load(f)
        logger.info(f"Loaded embeddings for {len(embeddings_db)} students.")
    else:
        logger.warning("No embeddings_db.pkl found.")

# Use lifespan instead of deprecated on_event
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    load_model()
    load_embeddings()
    yield

app = FastAPI(title="Facial Recognition ML Service", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

# ─── Static files ─────────────────────────────────────────────────────────────

if os.path.exists(CLIENT_GROUND_TRUTH):
    app.mount("/student-photos", StaticFiles(directory=CLIENT_GROUND_TRUTH),
              name="student-photos")

# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": face_app is not None,
            "students_enrolled": len(embeddings_db),
            "det_size": current_det_size}

@app.get("/det-size")
def get_det_size():
    return {"det_size": current_det_size}

@app.post("/set-det-size")
def set_det_size(req: SetDetSizeRequest):
    if req.det_size not in (320, 640):
        raise HTTPException(status_code=400, detail="det_size must be 320 or 640")
    if req.det_size != current_det_size:
        load_model(det_size=req.det_size)
    return {"status": "ok", "det_size": current_det_size}

@app.post("/reload-embeddings")
def reload_embeddings_ep():
    load_embeddings()
    return {"status": "ok", "students_enrolled": len(embeddings_db)}

# ─── Enrolled Students ────────────────────────────────────────────────────────

@app.get("/enrolled-students")
def enrolled_students():
    students = []
    if os.path.exists(CLIENT_GROUND_TRUTH):
        for folder in sorted(os.listdir(CLIENT_GROUND_TRUTH)):
            fp = os.path.join(CLIENT_GROUND_TRUTH, folder)
            if not os.path.isdir(fp): continue
            parts      = folder.split("_", 1)
            student_id = parts[0]
            name       = parts[1].replace("_", " ") if len(parts) > 1 else folder
            photos     = [f for f in os.listdir(fp)
                          if f.lower().endswith((".jpg",".jpeg",".png"))]
            students.append({
                "student_id":     student_id,
                "name":           name,
                "folder":         folder,
                "photo_count":    len(photos),
                "enrolled_in_db": student_id in embeddings_db,
                "first_photo":    f"/student-photos/{folder}/{photos[0]}" if photos else None,
            })
    return {"total": len(students),
            "enrolled_in_db": sum(1 for s in students if s["enrolled_in_db"]),
            "students": students}

# ─── Extract Faces (streaming SSE) ───────────────────────────────────────────

@app.post("/extract-faces-stream")
def extract_faces_stream(req: ExtractFacesRequest):
    def generate():
        if face_app is None:
            yield f"data: {json.dumps({'type':'error','message':'Model not loaded'})}\n\n"; return
        if not os.path.exists(req.videoPath):
            yield f"data: {json.dumps({'type':'error','message':f'Video not found: {req.videoPath}'})}\n\n"; return

        cap          = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask      = _build_ui_mask(H, W)

        all_embeddings, all_face_images, all_timestamps, all_quality = [], [], [], []
        frame_count = 0

        while True:
            if not cap.grab(): break
            frame_count += 1
            if frame_count % req.frame_skip != 0: continue
            ret, frame = cap.retrieve()
            if not ret: continue

            ts = round(frame_count / fps, 2)
            for d in _detect_faces_tiled(face_app, frame, ui_mask):
                all_embeddings.append(d["embedding"])
                all_face_images.append(d["crop"])
                all_timestamps.append(ts)
                all_quality.append(d["quality"])

            if frame_count % 100 == 0:
                pct = round(frame_count / total_frames * 100, 1) if total_frames else 0
                yield f"data: {json.dumps({'type':'progress','frame':frame_count,'faces':len(all_embeddings),'progress':pct})}\n\n"

        cap.release()
        yield f"data: {json.dumps({'type':'status','message':f'Clustering {len(all_embeddings)} faces...'})}\n\n"

        if not all_embeddings:
            yield f"data: {json.dumps({'type':'done','faces':[],'total_detections':0,'unique_faces':0})}\n\n"; return

        labels, unique_labels = cluster_faces(all_embeddings, req.cluster_threshold, req.min_samples)

        faces_out = []
        for cid in unique_labels:
            idxs     = np.where(labels == cid)[0]
            best_idx = max(idxs, key=lambda i: all_quality[i])
            crop     = all_face_images[best_idx]
            if crop.size == 0: continue
            ok, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if not ok: continue
            b64 = base64.b64encode(buf.tobytes()).decode()
            faces_out.append({
                "id":           f"cluster_{cid}",
                "imageData":    f"data:image/jpeg;base64,{b64}",
                "frameCount":   len(idxs),
                "firstSeenSec": round(float(all_timestamps[idxs[0]]), 1),
            })

        yield f"data: {json.dumps({'type':'done','faces':faces_out,'total_detections':len(all_embeddings),'unique_faces':len(faces_out)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

# ─── Extract Faces (non-streaming) ────────────────────────────────────────────

@app.post("/extract-faces")
def extract_faces_for_tagging(req: ExtractFacesRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    embeddings, face_images, timestamps, quality_scores = extract_all_faces(
        req.videoPath, face_app, req.frame_skip
    )
    if not embeddings:
        return {"faces": [], "total_detections": 0, "unique_faces": 0}

    labels, unique_labels = cluster_faces(embeddings, req.cluster_threshold, req.min_samples)

    faces_out = []
    for cid in unique_labels:
        idxs     = np.where(labels == cid)[0]
        best_idx = max(idxs, key=lambda i: quality_scores[i])
        crop     = face_images[best_idx]
        if crop.size == 0: continue
        ok, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not ok: continue
        b64 = base64.b64encode(buf.tobytes()).decode()
        faces_out.append({
            "id":           f"cluster_{cid}",
            "imageData":    f"data:image/jpeg;base64,{b64}",
            "frameCount":   len(idxs),
            "firstSeenSec": round(float(timestamps[idxs[0]]), 1),
        })

    return {"faces": faces_out, "total_detections": len(embeddings),
            "unique_faces": len(faces_out)}

# ─── Frame-by-frame matching (used by /process-video and /process-video-with-rolllist)

def _process_frames(videoPath, frame_skip, match_threshold):
    cap = cv2.VideoCapture(videoPath)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Cannot open video.")

    fps          = cap.get(cv2.CAP_PROP_FPS) or 25
    H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    ui_mask      = _build_ui_mask(H, W)

    enrolled_ids = list(embeddings_db.keys())
    enroll_mat   = (np.array([embeddings_db[sid]["embedding"] for sid in enrolled_ids],
                              dtype=np.float32)
                    if enrolled_ids else None)

    detected = {}; confidence_scores = {}
    frame_count = 0; processed = 0

    while True:
        if not cap.grab(): break
        frame_count += 1
        if frame_count % frame_skip != 0: continue
        ret, frame = cap.retrieve()
        if not ret: continue

        for d in _detect_faces_tiled(face_app, frame, ui_mask):
            if enroll_mat is None: continue
            scores  = enroll_mat @ d["embedding"]
            best_i  = int(np.argmax(scores))
            best_sc = float(scores[best_i])
            if best_sc >= match_threshold:
                sid = enrolled_ids[best_i]
                detected[sid] = detected.get(sid, 0) + 1
                confidence_scores.setdefault(sid, []).append(best_sc)
        processed += 1

    cap.release()
    return detected, confidence_scores, frame_count, processed

@app.post("/process-video")
def process_video(req: VideoRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if not embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    start = time.time()
    detected, confidence_scores, frame_count, processed = _process_frames(
        req.videoPath, req.frame_skip, req.threshold
    )
    elapsed = time.time() - start

    attendance = {}
    for sid, data in embeddings_db.items():
        avg_conf = float(np.mean(confidence_scores[sid])) if sid in confidence_scores else 0.0
        attendance[sid] = {
            "name": data["name"],
            "status": "present" if detected.get(sid, 0) >= 3 else "absent",
            "detections": detected.get(sid, 0),
            "avg_confidence": round(avg_conf, 4),
        }

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    return {
        "attendance": attendance,
        "summary": {
            "total": len(embeddings_db), "present": present,
            "absent": len(embeddings_db) - present,
            "processing_time": round(elapsed, 2),
            "frames_processed": processed,
        }
    }

@app.post("/process-video-with-rolllist")
def process_video_with_rolllist(req: CompareRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if not embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    start = time.time()
    detected, confidence_scores, frame_count, processed = _process_frames(
        req.videoPath, req.frame_skip, req.review_threshold
    )
    elapsed = time.time() - start

    attendance = {}
    for sid, data in embeddings_db.items():
        det_count = detected.get(sid, 0)
        avg_conf  = float(np.mean(confidence_scores[sid])) if sid in confidence_scores else 0.0
        if det_count >= req.min_detections and avg_conf >= req.auto_present_threshold:
            status = "present"
        elif det_count >= req.min_detections and avg_conf >= req.review_threshold:
            status = "review"
        else:
            status = "absent"
        attendance[sid] = {
            "name": data["name"], "status": status,
            "detections": det_count, "avg_confidence": round(avg_conf, 4),
            "confidence_zone": ("high"   if avg_conf >= req.auto_present_threshold else
                                "medium" if avg_conf >= req.review_threshold else "low"),
        }

    roll_list      = [r.strip().upper() for r in req.roll_list]
    comparison     = []
    extra_students = []

    if roll_list:
        for roll_no in roll_list:
            if roll_no in attendance:
                a = attendance[roll_no]
                comparison.append({"roll_no": roll_no, "name": a["name"],
                                   "ml_status": a["status"], "detections": a["detections"],
                                   "avg_confidence": a["avg_confidence"],
                                   "confidence_zone": a["confidence_zone"],
                                   "in_roll_list": True, "in_ml_db": True,
                                   "manually_approved": None})
            else:
                comparison.append({"roll_no": roll_no, "name": "Not Enrolled",
                                   "ml_status": "not_enrolled", "detections": 0,
                                   "avg_confidence": 0, "confidence_zone": "low",
                                   "in_roll_list": True, "in_ml_db": False,
                                   "manually_approved": None})
        for sid in attendance:
            if sid.upper() not in roll_list:
                a = attendance[sid]
                extra_students.append({"roll_no": sid, "name": a["name"],
                                       "ml_status": a["status"], "detections": a["detections"],
                                       "avg_confidence": a["avg_confidence"],
                                       "confidence_zone": a["confidence_zone"],
                                       "in_roll_list": False, "in_ml_db": True,
                                       "manually_approved": None})
    else:
        for sid, a in attendance.items():
            comparison.append({"roll_no": sid, "name": a["name"],
                               "ml_status": a["status"], "detections": a["detections"],
                               "avg_confidence": a["avg_confidence"],
                               "confidence_zone": a["confidence_zone"],
                               "in_roll_list": False, "in_ml_db": True,
                               "manually_approved": None})

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    review  = sum(1 for v in attendance.values() if v["status"] == "review")
    absent  = sum(1 for v in attendance.values() if v["status"] == "absent")

    return {
        "attendance": attendance, "comparison": comparison,
        "extra_students": extra_students,
        "thresholds": {"auto_present": req.auto_present_threshold,
                       "review": req.review_threshold,
                       "min_detections": req.min_detections},
        "summary": {
            "total_in_roll_list": len(roll_list),
            "total_in_ml_db": len(embeddings_db),
            "present": present, "review": review, "absent": absent,
            "not_enrolled": sum(1 for c in comparison if not c["in_ml_db"]),
            "extra_in_db": len(extra_students),
            "processing_time": round(elapsed, 2),
            "frames_processed": processed,
        }
    }

# ─── Clustering endpoints (streaming) ────────────────────────────────────────

@app.post("/process-video-clustering-stream")
def process_video_clustering_stream(req: ClusterStreamRequest):
    def generate():
        def sse(d): return f"data: {json.dumps(d)}\n\n"
        EMIT = 15

        if not os.path.exists(req.videoPath):
            yield sse({"type":"error","message":f"Video not found: {req.videoPath}"}); return
        if face_app is None:
            yield sse({"type":"error","message":"Model not loaded"}); return
        if not embeddings_db:
            yield sse({"type":"error","message":"No embeddings loaded"}); return

        start = time.time()
        yield sse({"type":"stage","stage":"start","message":"Opening video…"})

        cap          = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask      = _build_ui_mask(H, W)
        duration_sec = round(total_frames / fps, 1)

        yield sse({"type":"stage","stage":"extracting",
                   "message":f"{duration_sec}s video, {total_frames} frames, skip={req.frame_skip}",
                   "total_frames":total_frames,"duration_sec":duration_sec})

        all_embeddings, all_face_images, all_timestamps, all_quality = [], [], [], []
        frame_count = 0; last_emit = time.time()

        while True:
            if not cap.grab(): break
            frame_count += 1
            if frame_count % req.frame_skip != 0: continue
            ret, frame = cap.retrieve()
            if not ret: continue

            ts = round(frame_count / fps, 2)
            for d in _detect_faces_tiled(face_app, frame, ui_mask):
                all_embeddings.append(d["embedding"])
                all_face_images.append(d["crop"])
                all_timestamps.append(ts)
                all_quality.append(d["quality"])

            now = time.time()
            if now - last_emit >= EMIT:
                pct     = round(frame_count / total_frames * 100, 1) if total_frames else 0
                elapsed = round(now - start, 1)
                eta     = round(elapsed / max(pct, 0.1) * (100-pct), 0) if pct > 0 else None
                yield sse({"type":"progress","stage":"extracting",
                           "frame":frame_count,"total_frames":total_frames,
                           "faces_found":len(all_embeddings),"progress":pct,
                           "elapsed_sec":elapsed,"eta_sec":eta,
                           "message":f"Frame {frame_count:,}/{total_frames:,} ({pct}%) — {len(all_embeddings)} faces"})
                last_emit = now

        cap.release()
        total_faces = len(all_embeddings)
        yield sse({"type":"stage","stage":"clustering",
                   "message":f"{total_faces} detections → clustering…",
                   "faces_found":total_faces,
                   "elapsed_sec":round(time.time()-start, 1)})

        if not all_embeddings:
            yield sse({"type":"error","message":"No faces detected"}); return

        labels, unique_labels = cluster_faces(all_embeddings, req.cluster_threshold, req.min_samples)

        yield sse({"type":"stage","stage":"identifying",
                   "message":f"{len(unique_labels)} clusters → matching…",
                   "clusters_found":len(unique_labels),
                   "elapsed_sec":round(time.time()-start, 1)})

        video_name = os.path.splitext(os.path.basename(req.videoPath))[0]
        output_dir = os.path.join(req.output_dir, video_name)

        attendance, cluster_results = identify_clusters(
            labels, unique_labels,
            all_embeddings, all_face_images, all_timestamps,
            embeddings_db, output_dir,
            req.auto_present_threshold, req.review_threshold, all_quality
        )

        elapsed = round(time.time()-start, 2)
        present = sum(1 for v in attendance.values() if v["status"] == "present")
        review  = sum(1 for v in attendance.values() if v["status"] == "review")
        absent  = sum(1 for v in attendance.values() if v["status"] == "absent")
        unknown = sum(1 for c in cluster_results   if c["status"] == "unknown")

        result = {
            "video":req.videoPath,"output_dir":output_dir,
            "attendance":attendance,"clusters":cluster_results,
            "summary":{
                "total_faces_extracted":total_faces,
                "unique_clusters_found":len(unique_labels),
                "unknown_faces":unknown,"total_enrolled":len(embeddings_db),
                "present":present,"review":review,"absent":absent,
                "processing_time":elapsed,
            }
        }

        if req.roll_list:
            roll_list  = [r.strip().upper() for r in req.roll_list]
            comparison = []
            for roll_no in roll_list:
                if roll_no in attendance:
                    a = attendance[roll_no]
                    comparison.append({"roll_no":roll_no,"name":a["name"],
                                       "status":a["status"],"avg_confidence":a["avg_confidence"],
                                       "in_roll_list":True,"in_ml_db":True})
                else:
                    comparison.append({"roll_no":roll_no,"name":"Not Enrolled",
                                       "status":"not_enrolled","avg_confidence":0,
                                       "in_roll_list":True,"in_ml_db":False})
            result["comparison"] = comparison

        yield sse({"type":"done","result":result,
                   "message":f"Done in {elapsed}s — Present:{present} Review:{review} Absent:{absent} Unknown:{unknown}"})

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

# ─── Extract + Save Ground Truth (streaming) ─────────────────────────────────

@app.post("/extract-save-ground-truth")
def extract_save_ground_truth(req: ExtractSaveGTRequest):
    def generate():
        def sse(d): return f"data: {json.dumps(d)}\n\n"
        EMIT = 15

        if not os.path.exists(req.videoPath):
            yield sse({"type":"error","message":f"Video not found: {req.videoPath}"}); return
        if face_app is None:
            yield sse({"type":"error","message":"Model not loaded"}); return

        if req.det_size != current_det_size:
            yield sse({"type":"stage","stage":"loading","message":f"Reloading model det_size={req.det_size}…"})
            load_model(det_size=req.det_size)

        batch_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batchName)
        os.makedirs(batch_dir, exist_ok=True)
        start = time.time()

        cap          = cv2.VideoCapture(req.videoPath)
        fps          = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        H            = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        W            = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ui_mask      = _build_ui_mask(H, W)
        duration_sec = round(total_frames / fps, 1)

        yield sse({"type":"stage","stage":"extracting",
                   "message":f"Video: {duration_sec}s, {total_frames} frames, skip={req.frame_skip}",
                   "total_frames":total_frames,"duration_sec":duration_sec})

        all_embeddings, all_face_images, all_timestamps, all_quality = [], [], [], []
        frame_count = 0; last_emit = time.time()

        while True:
            if not cap.grab(): break
            frame_count += 1
            if frame_count % req.frame_skip != 0: continue
            ret, frame = cap.retrieve()
            if not ret: continue

            ts = round(frame_count / fps, 2)
            for d in _detect_faces_tiled(face_app, frame, ui_mask):
                if d["quality"] > 0:
                    all_embeddings.append(d["embedding"])
                    all_face_images.append(d["crop"])
                    all_timestamps.append(ts)
                    all_quality.append(d["quality"])

            now = time.time()
            if now - last_emit >= EMIT:
                pct = round(frame_count / total_frames * 100, 1) if total_frames else 0
                yield sse({"type":"progress","stage":"extracting",
                           "frame":frame_count,"total_frames":total_frames,
                           "faces_found":len(all_embeddings),"progress":pct,
                           "elapsed_sec":round(now-start,1),
                           "message":f"Frame {frame_count:,}/{total_frames:,} ({pct}%) — {len(all_embeddings)} faces"})
                last_emit = now

        cap.release()
        total_faces = len(all_embeddings)
        if total_faces == 0:
            yield sse({"type":"error","message":"No faces detected in video"}); return

        yield sse({"type":"stage","stage":"clustering",
                   "message":f"{total_faces} faces → clustering…","faces_found":total_faces})

        euclidean_eps = float(np.sqrt(2.0 * (1.0 - req.cluster_threshold)))
        clustering    = _DBSCAN(eps=euclidean_eps, min_samples=req.min_samples,
                                metric="euclidean", algorithm="ball_tree", n_jobs=-1
                                ).fit(np.array(all_embeddings))
        labels        = clustering.labels_
        unique_labels = sorted(set(labels) - {-1})

        yield sse({"type":"stage","stage":"saving",
                   "message":f"{len(unique_labels)} unique people → saving images…",
                   "clusters_found":len(unique_labels)})

        IMG_EXTS_LOCAL = (".jpg",".jpeg",".png",".webp")

        existing_mean_embs = {}
        all_existing_dirs  = sorted([
            d for d in os.listdir(batch_dir)
            if os.path.isdir(os.path.join(batch_dir, d)) and not d.startswith("_")
        ])

        if all_existing_dirs:
            yield sse({"type":"stage","stage":"dedup",
                       "message":f"Loading {len(all_existing_dirs)} existing folders…"})
            for folder_name in all_existing_dirs:
                fp   = os.path.join(batch_dir, folder_name)
                imgs = [f for f in os.listdir(fp) if f.lower().endswith(IMG_EXTS_LOCAL)]
                info_p = os.path.join(fp, "_info.json")
                if os.path.exists(info_p):
                    try:
                        with open(info_p) as fi: _info = json.load(fi)
                        ef = [f for f in _info.get("embedding_files",[]) if f in imgs]
                        if ef: imgs = ef
                    except Exception: pass
                folder_embs = []
                for img_f in imgs[:5]:
                    img = cv2.imread(os.path.join(fp, img_f))
                    if img is None: continue
                    faces = face_app.get(img)
                    if faces:
                        emb  = faces[0].embedding
                        norm = np.linalg.norm(emb)
                        if norm > 0: folder_embs.append(emb/norm)
                if folder_embs:
                    mean_emb = np.mean(folder_embs, axis=0)
                    existing_mean_embs[folder_name] = mean_emb / np.linalg.norm(mean_emb)

        existing_person_nums = [
            int(d.split("_")[1]) for d in all_existing_dirs
            if re.match(r"^person_\d+$", d, re.IGNORECASE)
        ]
        next_serial = (max(existing_person_nums) + 1) if existing_person_nums else 1
        top_n       = req.top_n
        EMBED_N     = 5

        def _merge_save(folder_path, new_dets):
            info_path = os.path.join(folder_path, "_info.json")
            info = {"embedding_files":[], "backup_files":[], "scores":{}}
            if os.path.exists(info_path):
                try:
                    with open(info_path) as fi: info = json.load(fi)
                except Exception: pass
            saved = 0
            for (crop, quality, ts_, idx) in new_dets:
                if crop.size == 0: continue
                fname = f"gt_{ts_:.1f}s_f{idx}.jpg"
                cv2.imwrite(os.path.join(folder_path, fname), crop)
                info["scores"][fname] = round(quality, 4)
                saved += 1
            all_imgs = [f for f in os.listdir(folder_path)
                        if f.lower().endswith(IMG_EXTS_LOCAL)]
            for f in all_imgs:
                if f not in info["scores"]:
                    img2 = cv2.imread(os.path.join(folder_path, f))
                    if img2 is not None:
                        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
                        lap   = float(cv2.Laplacian(gray2, cv2.CV_64F).var())
                        h2, w2 = img2.shape[:2]
                        info["scores"][f] = round((w2*h2)**0.5 * min(lap,500)/500, 4)
                    else:
                        info["scores"][f] = 0.5
            scored = sorted(
                [(f, info["scores"].get(f,0)) for f in all_imgs if f in info["scores"]],
                key=lambda x: x[1], reverse=True
            )
            if len(scored) > top_n:
                for (fn,_) in scored[top_n:]:
                    try: os.remove(os.path.join(folder_path, fn)); info["scores"].pop(fn,None)
                    except Exception: pass
                scored = scored[:top_n]
            info["embedding_files"] = [f for (f,_) in scored[:EMBED_N]]
            info["backup_files"]    = [f for (f,_) in scored[EMBED_N:]]
            with open(info_path, "w") as fi: json.dump(info, fi, indent=2)
            return saved

        saved_total = 0
        for cluster_id in unique_labels:
            indices      = np.where(labels == cluster_id)[0]
            cluster_embs = np.array([all_embeddings[i] for i in indices])
            cluster_mean = cluster_embs.mean(axis=0)
            cluster_mean /= np.linalg.norm(cluster_mean)

            best_folder = None; best_score = 0.0
            for fname, ex_emb in existing_mean_embs.items():
                score = float(np.dot(cluster_mean, ex_emb))
                if score > best_score: best_score = score; best_folder = fname

            if best_folder and best_score >= req.match_threshold:
                folder = os.path.join(batch_dir, best_folder)
                existing_mean_embs[best_folder] = cluster_mean
            else:
                fn     = f"person_{next_serial:03d}"; next_serial += 1
                folder = os.path.join(batch_dir, fn)
                os.makedirs(folder, exist_ok=True)
                existing_mean_embs[fn] = cluster_mean

            cluster_quality = sorted(
                [(all_face_images[i], all_quality[i], all_timestamps[i], i) for i in indices],
                key=lambda x: x[1], reverse=True
            )[:top_n]
            saved_total += _merge_save(folder, cluster_quality)

        elapsed = round(time.time()-start, 2)
        yield sse({"type":"done","people_detected":len(unique_labels),
                   "images_saved":saved_total,"batch_dir":batch_dir,
                   "elapsed_sec":elapsed,
                   "message":f"Done {elapsed}s — {len(unique_labels)} people, {saved_total} images"})

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

# ─── Build Embeddings ─────────────────────────────────────────────────────────

@app.post("/build-embeddings-sync")
def build_embeddings_sync(req: BuildEmbeddingsRequest):
    if not os.path.exists(req.photos_dir):
        raise HTTPException(status_code=404, detail=f"Photos dir not found: {req.photos_dir}")

    student_folders = [f for f in os.listdir(req.photos_dir)
                       if os.path.isdir(os.path.join(req.photos_dir, f))]
    db = {}

    for folder in sorted(student_folders):
        parts      = folder.split("_", 1)
        student_id = parts[0]
        name       = parts[1].replace("_"," ") if len(parts) > 1 else folder
        fp         = os.path.join(req.photos_dir, folder)
        all_photos = [f for f in os.listdir(fp)
                      if f.lower().endswith((".jpg",".jpeg",".png"))]

        info_path = os.path.join(fp, "_info.json")
        if os.path.exists(info_path):
            try:
                with open(info_path) as fi: _info = json.load(fi)
                ef = [f for f in _info.get("embedding_files",[])
                      if os.path.exists(os.path.join(fp,f))]
                photos = ef if ef else all_photos
            except Exception: photos = all_photos
        else:
            photos = all_photos

        embeddings = []
        for photo in photos:
            img = cv2.imread(os.path.join(fp, photo))
            if img is None: continue
            faces = face_app.get(img)
            if faces:
                face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
                aligned = get_aligned_face(face_app, img, face)
                if aligned is None:
                    continue
                quality = compute_face_quality(aligned)
                if quality < 80:
                    continue
                emb  = face.embedding
                norm = np.linalg.norm(emb)
                if norm > 0: embeddings.append(emb/norm)

        if embeddings:
            mean_emb = np.mean(embeddings, axis=0)
            mean_emb /= np.linalg.norm(mean_emb)
            db[student_id] = {"name":name,"embedding":mean_emb,"num_photos":len(embeddings)}
        else:
            logger.warning(f"✗ {student_id}: no faces detected")

    with open(req.output_path, "wb") as f: pickle.dump(db, f)
    global embeddings_db
    embeddings_db = db
    return {"status":"done","students_enrolled":len(db),"output_path":req.output_path}

def run_script_stream(script_path, args_list):
    def generate():
        proc = subprocess.Popen(
            [sys.executable, script_path] + args_list,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, cwd=os.path.dirname(script_path)
        )
        for line in iter(proc.stdout.readline, ""):
            yield f"data: {json.dumps({'log':line.rstrip()})}\n\n"
        proc.wait()
        code = "done" if proc.returncode == 0 else "error"
        yield f"data: {json.dumps({'status':code,'code':proc.returncode})}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@app.post("/build-embeddings")
def build_embeddings(req: BuildEmbeddingsRequest):
    script = os.path.join(BASE_DIR, "build_embeddings_db.py")
    if not os.path.exists(script):
        raise HTTPException(status_code=404, detail="build_embeddings_db.py not found")
    photos_dir = os.path.abspath(req.photos_dir)
    if not os.path.exists(photos_dir):
        raise HTTPException(status_code=404, detail=f"Photos dir not found: {photos_dir}")
    return run_script_stream(script, ["--photos-dir", photos_dir, "--output", req.output_path])

@app.get("/cluster-metadata")
def get_cluster_metadata(output_dir: str):
    meta_path = os.path.join(output_dir, "cluster_metadata.json")
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail=f"No metadata in: {output_dir}")
    with open(meta_path) as f: return json.load(f)

@app.post("/cluster-only")
def cluster_only(req: ClusterOnlyRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return process_video_cluster_only(
        req.videoPath, face_app, req.frame_skip,
        req.cluster_threshold, req.min_samples,
        req.min_images_per_cluster, req.output_dir
    )


class MatchClustersRequest(BaseModel):
    batch_dir: str
    erp_photos_dir: str
    top_k: int = 3


@app.post("/match-clusters-to-erp")
def match_clusters_to_erp(req: MatchClustersRequest):
    """
    SSE stream: for each person_XXX folder emit progress events, then a final 'done' event.
    """

    if face_app is None:
        raise HTTPException(status_code=503, detail="Face model not loaded")

    if not os.path.isdir(req.batch_dir):
        raise HTTPException(status_code=404, detail=f"batch_dir not found: {req.batch_dir}")

    if not os.path.isdir(req.erp_photos_dir):
        raise HTTPException(status_code=404, detail=f"erp_photos_dir not found: {req.erp_photos_dir}")

    IMG_EXTS = ('.jpg', '.jpeg', '.png', '.webp')

    def generate():
        def evt(obj):
            return f"data: {json.dumps(obj)}\n\n"

        # ── Step 1: Build ERP embeddings ────────────────────────
        yield evt({"type": "status", "msg": "Loading ERP photos…", "step": "erp"})

        erp_embs = {}
        erp_list = [
            f for f in sorted(os.listdir(req.erp_photos_dir))
            if f.lower().endswith(IMG_EXTS)
        ]

        for i, fname in enumerate(erp_list):
            roll_no = os.path.splitext(fname)[0]
            img = cv2.imread(os.path.join(req.erp_photos_dir, fname))

            if img is None:
                continue

            faces = face_app.get(img)
            if not faces:
                logger.warning(f"No face in ERP photo: {fname}")
                continue

            emb = faces[0].embedding
            norm = np.linalg.norm(emb)

            if norm > 0:
                erp_embs[roll_no] = {
                    "embedding": emb / norm,
                    "photo": fname
                }

            yield evt({
                "type": "erp_progress",
                "done": i + 1,
                "total": len(erp_list),
                "msg": f"ERP photos: {i+1}/{len(erp_list)}"
            })

        if not erp_embs:
            yield evt({"type": "error", "msg": "No faces detected in any ERP photo"})
            return

        yield evt({
            "type": "status",
            "msg": f"Loaded {len(erp_embs)} ERP embeddings. Matching clusters…",
            "step": "matching"
        })

        erp_rolls = list(erp_embs.keys())
        erp_matrix = np.array([erp_embs[r]["embedding"] for r in erp_rolls])

        # ── Step 2: Match each person_XXX cluster ───────────────
        cluster_dirs = sorted([
            d for d in os.listdir(req.batch_dir)
            if re.match(r"^person_\d+$", d, re.IGNORECASE)
            and os.path.isdir(os.path.join(req.batch_dir, d))
        ])

        matched_count = 0

        for idx, folder_name in enumerate(cluster_dirs):
            folder_path = os.path.join(req.batch_dir, folder_name)
            img_files = [
                f for f in os.listdir(folder_path)
                if f.lower().endswith(IMG_EXTS)
            ]

            yield evt({
                "type": "cluster_progress",
                "done": idx + 1,
                "total": len(cluster_dirs),
                "current": folder_name,
                "msg": f"Matching {folder_name} ({idx+1}/{len(cluster_dirs)})…"
            })

            cluster_embs = []

            for img_file in img_files[:10]:
                img = cv2.imread(os.path.join(folder_path, img_file))

                if img is None:
                    continue

                faces = face_app.get(img)
                if faces:
                    emb = faces[0].embedding
                    norm = np.linalg.norm(emb)

                    if norm > 0:
                        cluster_embs.append(emb / norm)

            if not cluster_embs:
                yield evt({
                    "type": "match_result",
                    "folder": folder_name,
                    "match": {"error": "no faces detected"}
                })
                continue

            mean_emb = np.mean(cluster_embs, axis=0)
            mean_emb = mean_emb / np.linalg.norm(mean_emb)

            scores = erp_matrix @ mean_emb
            top_idx = np.argsort(scores)[::-1][:req.top_k]

            candidates = [
                {
                    "rollNo": erp_rolls[i],
                    "confidence": round(float(scores[i]), 4),
                    "erpPhoto": erp_embs[erp_rolls[i]]["photo"]
                }
                for i in top_idx
            ]

            match_data = {
                "best": candidates[0],
                "candidates": candidates,
                "image_count": len(img_files),
                "preview_images": img_files[:6],
            }

            yield evt({
                "type": "match_result",
                "folder": folder_name,
                "match": match_data
            })

            matched_count += 1

        yield evt({
            "type": "done",
            "erp_students": len(erp_embs),
            "clusters": matched_count
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


# ─── Streaming Clustering Request ─────────────────────────────

class ClusterStreamRequest(BaseModel):
    videoPath: str
    frame_skip: int = 10
    cluster_threshold: float = 0.45
    min_samples: int = 2
    auto_present_threshold: float = 0.
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []


@app.post("/process-video-clustering")
def process_video_clustering(req: ClusterRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if not embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")
    result = process_video_with_clustering(
        req.videoPath, embeddings_db, face_app,
        req.frame_skip, req.cluster_threshold, req.min_samples,
        req.auto_present_threshold, req.review_threshold, req.output_dir
    )
    if req.roll_list:
        roll_list  = [r.strip().upper() for r in req.roll_list]
        comparison = []
        for roll_no in roll_list:
            if roll_no in result["attendance"]:
                a = result["attendance"][roll_no]
                comparison.append({"roll_no":roll_no,"name":a["name"],"status":a["status"],
                                   "avg_confidence":a["avg_confidence"],
                                   "in_roll_list":True,"in_ml_db":True})
            else:
                comparison.append({"roll_no":roll_no,"name":"Not Enrolled","status":"not_enrolled",
                                   "avg_confidence":0,"in_roll_list":True,"in_ml_db":False})
        result["comparison"] = comparison
    return result

@app.post("/assign-rollno")
def assign_rollno(req: AssignRollNoRequest):
    old_path = os.path.join(req.output_dir, req.cluster_folder)
    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail=f"Folder not found: {old_path}")
    new_name = f"{req.roll_no}_{req.name.replace(' ','_')}" if req.name else req.roll_no
    new_path = os.path.join(req.output_dir, new_name)
    if os.path.exists(new_path):
        raise HTTPException(status_code=409, detail=f"Folder exists: {new_name}")
    os.rename(old_path, new_path)
    meta_path = os.path.join(req.output_dir, "cluster_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f: meta = json.load(f)
        for c in meta.get("clusters",[]):
            if c["folder_name"] == req.cluster_folder:
                c["folder_name"]=new_name; c["roll_no"]=req.roll_no
                c["assigned_name"]=req.name; break
        with open(meta_path,"w") as f: json.dump(meta,f,indent=2)
    return {"status":"ok","old_folder":req.cluster_folder,"new_folder":new_name}

@app.post("/update-student-embedding")
def update_student_embedding(req: UpdateEmbeddingRequest):
    student_dir = os.path.join(CLIENT_GROUND_TRUTH, req.batch_name, req.roll_no)
    if not os.path.isdir(student_dir):
        raise HTTPException(status_code=404, detail=f"Student dir not found: {student_dir}")
    if face_app is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    new_embeddings = []; missing = []
    for filename in req.embedding_files:
        if filename.startswith("_"): continue
        fpath = os.path.join(student_dir, filename)
        if not os.path.exists(fpath): missing.append(filename); continue
        img = cv2.imread(fpath)
        if img is None: continue
        faces = face_app.get(img)
        if faces:
            emb  = faces[0].embedding
            norm = np.linalg.norm(emb)
            if norm > 0: new_embeddings.append(emb/norm)
    if not new_embeddings:
        raise HTTPException(status_code=400, detail=f"No faces detected. Missing: {missing}")
    mean_emb = np.mean(new_embeddings, axis=0)
    mean_emb /= np.linalg.norm(mean_emb)
    global embeddings_db
    if req.roll_no in embeddings_db:
        embeddings_db[req.roll_no]["embedding"]  = mean_emb
        embeddings_db[req.roll_no]["num_photos"] = len(new_embeddings)
    else:
        embeddings_db[req.roll_no] = {"name":req.roll_no,"embedding":mean_emb,
                                      "num_photos":len(new_embeddings)}
    with open(DB_PATH,"wb") as f: pickle.dump(embeddings_db,f)
    info_path = os.path.join(student_dir, "_info.json")
    info = {}
    if os.path.exists(info_path):
        try:
            with open(info_path) as fi: info = json.load(fi)
        except Exception: info = {}
    all_imgs = [f for f in os.listdir(student_dir)
                if f.lower().endswith((".jpg",".jpeg",".png",".webp"))]
    info["embedding_files"] = [f for f in req.embedding_files if f in all_imgs]
    info["backup_files"]    = [f for f in all_imgs if f not in req.embedding_files][:5]
    with open(info_path,"w") as fi: json.dump(info,fi,indent=2)
    return {"status":"ok","roll_no":req.roll_no,
            "embedding_files_used":len(new_embeddings),
            "total_selected":len(req.embedding_files),"missing_files":missing}

@app.get("/student-ground-truth/{batch_name}/{roll_no}")
def get_student_ground_truth(batch_name: str, roll_no: str):
    student_dir = os.path.join(CLIENT_GROUND_TRUTH, batch_name, roll_no)
    if not os.path.isdir(student_dir):
        raise HTTPException(status_code=404, detail="Student dir not found")
    all_imgs = sorted([f for f in os.listdir(student_dir)
                       if f.lower().endswith((".jpg",".jpeg",".png",".webp"))])
    info_path = os.path.join(student_dir, "_info.json")
    info = {}
    if os.path.exists(info_path):
        try:
            with open(info_path) as fi: info = json.load(fi)
        except Exception: info = {}
    ef        = [f for f in info.get("embedding_files",[]) if f in all_imgs]
    bf        = [f for f in info.get("backup_files",[])    if f in all_imgs]
    tracked   = set(ef) | set(bf)
    untracked = [f for f in all_imgs if f not in tracked]
    return {"batch_name":batch_name,"roll_no":roll_no,
            "embedding_files":ef,"backup_files":bf,"untracked_files":untracked,
            "scores":info.get("scores",{}),"total_images":len(all_imgs),
            "has_info":bool(ef or bf)}


if __name__ == "__main__":
    uvicorn.run("ml_service:app", host="0.0.0.0", port=8500, reload=False)