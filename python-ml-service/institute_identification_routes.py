import os
import cv2
import json
import base64
import time
import tempfile
import requests
import numpy as np
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import state
import adaface_utils
from faiss_utils import _recognize_face
import threading
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Multi-model gallery matrices ─────────────────────────────────────────────
# The Institute Identification page scores every detected face with ALL
# available models, not just the FAISS index:
#   faiss   — full FAISS index, top-k voting (the original behavior)
#   mean    — brute-force cosine vs state.embeddings_db (institute-wide means)
#   max_k   — max-cosine vs state.topk_embeddings_db (top-K gallery per student)
#   adaface — cosine vs state.adaface_embeddings_db, in AdaFace's own space
# Matrices are built once per stream run — galleries only change on enrollment.

def _norm_vec(v):
    arr = np.asarray(v, dtype=np.float32).reshape(-1)
    n = np.linalg.norm(arr)
    return arr / n if n > 0 else None


def _build_gallery_matrices():
    g = {"mean": None, "max_k": None, "adaface": None}

    if state.embeddings_db:
        ids, rows = [], []
        for roll, rec in state.embeddings_db.items():
            v = _norm_vec(rec.get("embedding") if isinstance(rec, dict) else rec)
            if v is not None:
                ids.append(roll); rows.append(v)
        if rows:
            g["mean"] = (ids, np.stack(rows))

    if state.topk_embeddings_db:
        owners, rows = [], []
        for roll, vecs in state.topk_embeddings_db.items():
            for vec in (vecs or []):
                v = _norm_vec(vec)
                if v is not None:
                    owners.append(roll); rows.append(v)
        if rows:
            g["max_k"] = (owners, np.stack(rows))

    if state.adaface_embeddings_db and state.adaface_session is not None:
        ids, rows = [], []
        for roll, vec in state.adaface_embeddings_db.items():
            v = _norm_vec(vec)
            if v is not None:
                ids.append(roll); rows.append(v)
        if rows:
            g["adaface"] = (ids, np.stack(rows))

    return g


def _best_match(matrix_entry, emb, threshold):
    """argmax cosine over a (ids, matrix) gallery; None below threshold.
    For max_k galleries ids repeat per student — argmax naturally implements
    max-over-K."""
    if matrix_entry is None or emb is None:
        return None, 0.0
    ids, matrix = matrix_entry
    sims = matrix @ emb
    best = int(np.argmax(sims))
    score = float(sims[best])
    if score >= threshold:
        return ids[best], score
    return None, score

# Node owns server/ml-data/ground_truth — this service may run on a separate
# machine with no access to that disk, so the reference photo is fetched over
# HTTP from Node instead of scanned off a local path.
NODE_SERVER_URL = os.environ.get("NODE_SERVER_URL", "http://localhost:8010")

def get_ground_truth_b64(roll: str) -> str:
    try:
        resp = requests.get(
            f"{NODE_SERVER_URL}/api/v1/attendancemodule/ground-truth-photo-by-roll/{roll}",
            timeout=5,
        )
        if resp.ok:
            return resp.json().get("photo", "") or ""
    except Exception as e:
        logger.warning(f"get_ground_truth_b64: Node lookup failed for {roll}: {e}")
    return ""

class LiveStreamReader:
    def __init__(self, url):
        self.url = url
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
        self.cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.ret, self.frame = self.cap.read()
        self.running = True
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()

    def _update(self):
        while self.running:
            if not getattr(self, 'cap', None) or not self.cap.isOpened():
                time.sleep(1)
                self.cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)
                if self.cap.isOpened():
                    self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                continue
                
            ret, frame = self.cap.read()
            if ret:
                self.ret, self.frame = ret, frame
            else:
                self.ret = False
                self.cap.release()

    def isOpened(self):
        return True

    def read(self):
        while self.running and not self.ret:
            time.sleep(0.5)
        return self.ret, self.frame

    def release(self):
        self.running = False
        if hasattr(self, 'cap') and self.cap.isOpened():
            self.cap.release()

def process_video_stream(video_path: str, is_live_url: bool = False):
    def generate():
        try:
            msg = 'Connecting to stream...' if is_live_url else 'Starting simulated live identification...'
            yield f"data: {json.dumps({'type': 'stage', 'message': msg})}\n\n"
            
            if is_live_url:
                cap = LiveStreamReader(video_path)
            else:
                cap = cv2.VideoCapture(video_path)
                
            if not cap.isOpened():
                yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to open video source.'})}\n\n"
                return
                
            if is_live_url:
                total_runs = 0
                yield f"data: {json.dumps({'type': 'stage', 'message': 'Stream connected. Starting live identification...'})}\n\n"
            else:
                fps = cap.get(cv2.CAP_PROP_FPS)
                total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                if fps <= 0: fps = 30
                
                duration_sec = total_frames / fps
                total_runs = int(duration_sec / 5) + (1 if duration_sec % 5 >= 1 else 0)
            
            marked_students = {}
            start_time = time.time()

            # Multi-model galleries — built once per stream run.
            galleries = _build_gallery_matrices()
            available = ['faiss'] + [k for k in ('mean', 'max_k', 'adaface') if galleries[k] is not None]
            yield f"data: {json.dumps({'type': 'stage', 'message': 'Models available: ' + ', '.join(available)})}\n\n"

            pending_result_event = None
            run_idx = 0
            run_count = 0
            
            while is_live_url or run_idx < total_runs:
                if not is_live_url:
                    t_sec = 1 + 5 * run_idx
                    target_real_time = start_time + t_sec
                    delay = target_real_time - time.time()
                    logger.info(f"Run {run_idx+1}, target_sec: {t_sec}, delay: {delay:.2f}")
                    if delay > 0:
                        time.sleep(delay)
                        
                if pending_result_event is not None:
                    yield pending_result_event
                    pending_result_event = None
                    
                if not is_live_url:
                    cap.set(cv2.CAP_PROP_POS_MSEC, t_sec * 1000)
                    
                ret, frame = cap.read()
                if not ret:
                    if is_live_url:
                        yield f"data: {json.dumps({'type': 'error', 'message': 'Stream disconnected.'})}\n\n"
                    break
                    
                if getattr(state, 'face_app', None) is None or getattr(state, 'faiss_index', None) is None:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Model or FAISS index not loaded.'})}\n\n"
                    break
                    
                faces = state.face_app.get(frame)
                
                vis_frame = frame.copy()
                run_idx += 1
                run_count = run_idx
                
                if is_live_url:
                    # If live stream, wait 5 seconds before fetching the next frame
                    if pending_result_event is not None:
                        yield pending_result_event
                        pending_result_event = None
                    time.sleep(5)
                
                for face in faces:
                    # top_k/threshold are runtime-tunable via GET/POST
                    # /faiss-config (ML Fine Tuning page) — see state.faiss_config.
                    with state.faiss_config_lock:
                        recog_top_k = state.faiss_config["top_k"]
                        recog_threshold = state.faiss_config["recog_threshold"]
                    with state.adaface_config_lock:
                        adaface_threshold = state.adaface_config["recog_threshold"]

                    # ── Score this face with every available model ──────────
                    faiss_roll, faiss_score = _recognize_face(
                        face.embedding,
                        state.faiss_index,
                        state.vid_to_roll,
                        top_k=recog_top_k,
                        threshold=recog_threshold,
                    )
                    emb_norm = _norm_vec(face.embedding)
                    mean_roll,  mean_score  = _best_match(galleries["mean"],  emb_norm, recog_threshold)
                    max_k_roll, max_k_score = _best_match(galleries["max_k"], emb_norm, recog_threshold)
                    adaface_roll, adaface_score = None, 0.0
                    if galleries["adaface"] is not None:
                        ada_emb = adaface_utils.get_adaface_embedding_for_face(
                            frame, getattr(face, 'kps', None))
                        if ada_emb is not None:
                            adaface_roll, adaface_score = _best_match(
                                galleries["adaface"], _norm_vec(ada_emb), adaface_threshold)

                    models = {
                        "faiss":   {"roll": faiss_roll,   "score": round(faiss_score, 3)},
                        "mean":    {"roll": mean_roll,    "score": round(mean_score, 3)},
                        "max_k":   {"roll": max_k_roll,   "score": round(max_k_score, 3)},
                        "adaface": {"roll": adaface_roll, "score": round(adaface_score, 3)},
                    }

                    # Anchor identity: first model that recognised someone,
                    # FAISS first (preserves the page's original behavior).
                    roll, score, anchor_model = None, 0.0, None
                    for mkey in ("faiss", "mean", "max_k", "adaface"):
                        if models[mkey]["roll"]:
                            roll, score, anchor_model = models[mkey]["roll"], models[mkey]["score"], mkey
                            break

                    # Flag when the models that DID match disagree on who it is.
                    matched_rolls = {m["roll"] for m in models.values() if m["roll"]}
                    disagreement = len(matched_rolls) > 1

                    label = roll if roll else "Unknown"
                    if roll and disagreement:
                        label += " *"
                    color = (0, 255, 0) if roll else (0, 0, 255)
                    if roll and disagreement:
                        color = (0, 165, 255)

                    x1, y1, x2, y2 = [int(v) for v in face.bbox]
                    cv2.rectangle(vis_frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(vis_frame, label, (x1, max(y1 - 10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                    if roll and roll not in marked_students:
                        # Pad the bounding box by 40% to show more of the head and shoulders
                        pad_x = int((x2 - x1) * 0.40)
                        pad_y = int((y2 - y1) * 0.40)
                        
                        c_y1 = max(0, y1 - pad_y)
                        c_y2 = min(frame.shape[0], y2 + pad_y)
                        c_x1 = max(0, x1 - pad_x)
                        c_x2 = min(frame.shape[1], x2 + pad_x)
                        
                        crop = frame[c_y1:c_y2, c_x1:c_x2]
                        
                        evidence_b64 = ""
                        if crop.size > 0:
                            _, crop_buf = cv2.imencode('.jpg', crop)
                            evidence_b64 = base64.b64encode(crop_buf).decode('utf-8')
                        
                        record = {
                            "score": round(score, 3),
                            "time": time.strftime("%H:%M:%S"),
                            "evidence": evidence_b64,
                            "ground_truth": get_ground_truth_b64(roll),
                            # Every model's verdict on this same cropped face —
                            # rendered per-card by the Institute page's
                            # "model comparison" view.
                            "models": models,
                            "anchor_model": anchor_model,
                            "disagreement": disagreement,
                        }
                        marked_students[roll] = record
                
                _, buffer = cv2.imencode('.jpg', vis_frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                b64_frame = base64.b64encode(buffer).decode('utf-8')
                
                pending_result_event = f"data: {json.dumps({'type': 'snapshot', 'run': run_count, 'total_runs': total_runs, 'image': b64_frame, 'marked': marked_students})}\n\n"
                
            if pending_result_event is not None:
                yield pending_result_event
                
            cap.release()
            if not is_live_url:
                try:
                    os.remove(video_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temp video: {e}")
                
            real_duration = round(time.time() - start_time, 2)
            summary = {
                "total_runs": total_runs,
                "duration_sec": real_duration
            }
            
            yield f"data: {json.dumps({'type': 'done', 'result': {'summary': summary, 'marked': marked_students}})}\n\n"

        except Exception as e:
            logger.error(f"Error in video stream processing: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': f'Server error: {str(e)}'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/identify-institute-video")
async def identify_institute_video(file: UploadFile = File(...)):
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, f"inst_vid_{time.time()}_{file.filename}")
    
    with open(temp_file_path, "wb") as f:
        f.write(await file.read())
        
    return process_video_stream(temp_file_path, is_live_url=False)

class URLPayload(BaseModel):
    url: str

@router.post("/identify-institute-url")
def identify_institute_url(payload: URLPayload):
    return process_video_stream(payload.url, is_live_url=True)
