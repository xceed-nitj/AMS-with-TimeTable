import os
import cv2
import json
import base64
import time
import tempfile
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import state
from faiss_utils import _recognize_face
import threading
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_ground_truth_b64(roll: str) -> str:
    CLIENT_GROUND_TRUTH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server", "ml-data", "ground_truth")
    if not os.path.exists(CLIENT_GROUND_TRUTH): return ""
    try:
        for batch in os.listdir(CLIENT_GROUND_TRUTH):
            batch_path = os.path.join(CLIENT_GROUND_TRUTH, batch)
            if not os.path.isdir(batch_path): continue
            for folder in os.listdir(batch_path):
                if folder == roll or folder.startswith(f"{roll}_"):
                    student_path = os.path.join(batch_path, folder)
                    if not os.path.isdir(student_path): continue
                    photos = [f for f in os.listdir(student_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                    if photos:
                        with open(os.path.join(student_path, photos[0]), "rb") as f:
                            return base64.b64encode(f.read()).decode('utf-8')
    except Exception: pass
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
                    roll, score = _recognize_face(
                        face.embedding, 
                        state.faiss_index, 
                        state.vid_to_roll, 
                        top_k=5,
                        threshold=0.35
                    )
                    
                    label = roll if roll else "Unknown"
                    color = (0, 255, 0) if roll else (0, 0, 255)
                    
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
                            "ground_truth": get_ground_truth_b64(roll)
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
