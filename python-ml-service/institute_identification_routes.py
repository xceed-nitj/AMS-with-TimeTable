import os
import cv2
import json
import base64
import time
import tempfile
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
import state
from faiss_utils import _recognize_face
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def process_video_stream(video_path: str):
    def generate():
        yield f"data: {json.dumps({'type': 'stage', 'message': 'Starting simulated live identification...'})}\n\n"
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to open video file.'})}\n\n"
            return
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        if fps <= 0: fps = 30
        
        duration_sec = total_frames / fps
        total_runs = int(duration_sec / 5) + (1 if duration_sec % 5 >= 1 else 0)
        
        marked_students = {}
        start_time = time.time()
        
        pending_result_event = None
        run_idx = 0
        
        while run_idx < total_runs:
            t_sec = 1 + 5 * run_idx
            
            target_real_time = start_time + t_sec
            delay = target_real_time - time.time()
            logger.info(f"Run {run_idx+1}, target_sec: {t_sec}, delay: {delay:.2f}")
            if delay > 0:
                time.sleep(delay)
                
            if pending_result_event is not None:
                yield pending_result_event
                pending_result_event = None
                
            cap.set(cv2.CAP_PROP_POS_MSEC, t_sec * 1000)
            ret, frame = cap.read()
            if not ret:
                break
                
            if getattr(state, 'face_app', None) is None or getattr(state, 'faiss_index', None) is None:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Model or FAISS index not loaded.'})}\n\n"
                break
                
            faces = state.face_app.get(frame)
            
            vis_frame = frame.copy()
            run_count = run_idx + 1
            run_idx += 1
            
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
                    c_y1, c_y2 = max(0, y1), min(frame.shape[0], y2)
                    c_x1, c_x2 = max(0, x1), min(frame.shape[1], x2)
                    crop = frame[c_y1:c_y2, c_x1:c_x2]
                    
                    evidence_b64 = ""
                    if crop.size > 0:
                        _, crop_buf = cv2.imencode('.jpg', crop)
                        evidence_b64 = base64.b64encode(crop_buf).decode('utf-8')
                    
                    record = {
                        "score": round(score, 3), 
                        "time": time.strftime("%H:%M:%S"), 
                        "evidence": evidence_b64
                    }
                    marked_students[roll] = record
            
            _, buffer = cv2.imencode('.jpg', vis_frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            b64_frame = base64.b64encode(buffer).decode('utf-8')
            
            pending_result_event = f"data: {json.dumps({'type': 'snapshot', 'run': run_count, 'total_runs': total_runs, 'image': b64_frame, 'marked': marked_students})}\n\n"
            
        if pending_result_event is not None:
            if total_runs > 0:
                final_target = start_time + (1 + 5 * (run_idx - 1)) + 5
                delay = final_target - time.time()
                if delay > 0:
                    time.sleep(delay)
            yield pending_result_event
            
        cap.release()
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

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/identify-institute-video")
async def identify_institute_video(file: UploadFile = File(...)):
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, f"inst_vid_{time.time()}_{file.filename}")
    
    with open(temp_file_path, "wb") as f:
        f.write(await file.read())
        
    return process_video_stream(temp_file_path)
