# video_processing.py
# Frame-by-frame attendance routes:
#   POST /process-video
#   POST /process-video-with-rolllist
#
# Both routes scan every sampled frame, match detected faces against
# the FAISS index (or embeddings_db fallback) using cosine similarity,
# and return an attendance dict.

import os
import time
import logging

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException

import state
from models import VideoRequest, CompareRequest
from clustering_service import _detect_faces_tiled, _build_ui_mask
from faiss_utils import _recognize_face   # NEW — FAISS top-k voting

logger = logging.getLogger("ml_service.video_processing")
router = APIRouter()


# ─── Shared frame-scanning helper ────────────────────────────────────────────

def _process_frames(videoPath, frame_skip, match_threshold):
    """
    Open a video, scan sampled frames, and return per-student detection counts
    and per-frame confidence scores.

    Recognition now uses FAISS top-k voting (_recognize_face) when a FAISS
    index is loaded. Falls back to the old numpy-dot-product argmax if only
    the pkl embeddings_db is available (e.g. FAISS index hasn't been built yet).

    Returns
    -------
    detected          : dict[student_id -> int]
    confidence_scores : dict[student_id -> list[float]]
    frame_count       : int   total frames read
    processed         : int   frames actually analysed (after skip)
    """
    cap = cv2.VideoCapture(videoPath)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Cannot open video.")

    H       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    W       = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    ui_mask = _build_ui_mask(H, W)

    # Decide which backend to use
    use_faiss = state.faiss_index is not None

    # Legacy pkl backend — only used if FAISS hasn't been built yet
    if not use_faiss:
        enrolled_ids = list(state.embeddings_db.keys())
        enroll_mat   = (
            np.array(
                [state.embeddings_db[sid]["embedding"] for sid in enrolled_ids],
                dtype=np.float32,
            )
            if enrolled_ids
            else None
        )
    else:
        enrolled_ids = None
        enroll_mat = None

    detected          = {}
    confidence_scores = {}
    frame_count       = 0
    processed         = 0

    while True:
        # Use grab() then retrieve() instead of a combined read().
        # On macOS ARM64, calling read() from a non-main thread triggers
        # a SIGSEGV inside av_read_frame (FFmpeg internal state race).
        if not cap.grab():
            break
        frame_count += 1
        if frame_count % frame_skip != 0:
            continue
        ret, frame = cap.retrieve()
        if not ret or frame is None:
            continue

        for d in _detect_faces_tiled(state.face_app, frame, ui_mask, profile="live"):
            if use_faiss:
                # FAISS path — top-k voting, more robust than single argmax
                roll, score = _recognize_face(
                    d["embedding"],
                    state.faiss_index,
                    state.vid_to_roll,
                    5,
                    match_threshold,
                )
                if roll is not None:
                    detected[roll] = detected.get(roll, 0) + 1
                    confidence_scores.setdefault(roll, []).append(score)
            else:
                # Legacy pkl path — direct numpy dot product
                if enroll_mat is None:
                    continue
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


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/process-video")
def process_video(req: VideoRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if state.faiss_index is None and not state.embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    start = time.time()
    detected, confidence_scores, frame_count, processed = _process_frames(
        req.videoPath, req.frame_skip, req.threshold
    )
    elapsed = time.time() - start

    # Build result using FAISS metadata when available; fall back to embeddings_db.
    all_rolls = (
        set(state.vid_to_roll.values()) if state.faiss_index is not None
        else set(state.embeddings_db.keys())
    )
    attendance = {}
    for sid in all_rolls:
        name = state.embeddings_db.get(sid, {}).get("name", sid)
        avg_conf = (
            float(np.mean(confidence_scores[sid])) if sid in confidence_scores else 0.0
        )
        attendance[sid] = {
            "name":           name,
            "status":          "present" if detected.get(sid, 0) >= 3 else "absent",
            "detections":      detected.get(sid, 0),
            "avg_confidence":  round(avg_conf, 4),
        }

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    return {
        "attendance": attendance,
        "summary": {
            "total":             len(attendance),
            "present":           present,
            "absent":            len(attendance) - present,
            "processing_time":   round(elapsed, 2),
            "frames_processed":  processed,
        },
    }


@router.post("/process-video-with-rolllist")
def process_video_with_rolllist(req: CompareRequest):
    if not os.path.exists(req.videoPath):
        raise HTTPException(status_code=404, detail=f"Video not found: {req.videoPath}")
    if state.faiss_index is None and not state.embeddings_db:
        raise HTTPException(status_code=400, detail="No embeddings loaded.")

    start = time.time()
    detected, confidence_scores, frame_count, processed = _process_frames(
        req.videoPath, req.frame_skip, req.review_threshold
    )
    elapsed = time.time() - start
    all_rolls = (
        set(state.vid_to_roll.values()) if state.faiss_index is not None
        else set(state.embeddings_db.keys())
    )

    # Build per-student attendance with three-zone confidence
    attendance = {}
    for sid in all_rolls:
        name      = state.embeddings_db.get(sid, {}).get("name", sid)
        det_count = detected.get(sid, 0)
        avg_conf  = (
            float(np.mean(confidence_scores[sid])) if sid in confidence_scores else 0.0
        )
        if det_count >= req.min_detections and avg_conf >= req.auto_present_threshold:
            status = "present"
        elif det_count >= req.min_detections and avg_conf >= req.review_threshold:
            status = "review"
        else:
            status = "absent"

        attendance[sid] = {
            "name":             name,
            "status":           status,
            "detections":       det_count,
            "avg_confidence":   round(avg_conf, 4),
            "confidence_zone":  (
                "high"   if avg_conf >= req.auto_present_threshold else
                "medium" if avg_conf >= req.review_threshold       else
                "low"
            ),
        }

    # Compare against provided roll list
    roll_list      = [r.strip().upper() for r in req.roll_list]
    comparison     = []
    extra_students = []

    if roll_list:
        for roll_no in roll_list:
            if roll_no in attendance:
                a = attendance[roll_no]
                comparison.append({
                    "roll_no":          roll_no,
                    "name":             a["name"],
                    "ml_status":        a["status"],
                    "detections":       a["detections"],
                    "avg_confidence":   a["avg_confidence"],
                    "confidence_zone":  a["confidence_zone"],
                    "in_roll_list":     True,
                    "in_ml_db":         True,
                    "manually_approved": None,
                })
            else:
                comparison.append({
                    "roll_no":          roll_no,
                    "name":             "Not Enrolled",
                    "ml_status":        "not_enrolled",
                    "detections":       0,
                    "avg_confidence":   0,
                    "confidence_zone":  "low",
                    "in_roll_list":     True,
                    "in_ml_db":         False,
                    "manually_approved": None,
                })

        for sid in attendance:
            if sid.upper() not in roll_list:
                a = attendance[sid]
                extra_students.append({
                    "roll_no":          sid,
                    "name":             a["name"],
                    "ml_status":        a["status"],
                    "detections":       a["detections"],
                    "avg_confidence":   a["avg_confidence"],
                    "confidence_zone":  a["confidence_zone"],
                    "in_roll_list":     False,
                    "in_ml_db":         True,
                    "manually_approved": None,
                })
    else:
        for sid, a in attendance.items():
            comparison.append({
                "roll_no":          sid,
                "name":             a["name"],
                "ml_status":        a["status"],
                "detections":       a["detections"],
                "avg_confidence":   a["avg_confidence"],
                "confidence_zone":  a["confidence_zone"],
                "in_roll_list":     False,
                "in_ml_db":         True,
                "manually_approved": None,
            })

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    review  = sum(1 for v in attendance.values() if v["status"] == "review")
    absent  = sum(1 for v in attendance.values() if v["status"] == "absent")

    return {
        "attendance":      attendance,
        "comparison":      comparison,
        "extra_students":  extra_students,
        "thresholds": {
            "auto_present":   req.auto_present_threshold,
            "review":         req.review_threshold,
            "min_detections": req.min_detections,
        },
        "summary": {
            "total_in_roll_list": len(roll_list),
            "total_in_ml_db":     len(attendance),
            "present":            present,
            "review":             review,
            "absent":             absent,
            "not_enrolled":       sum(1 for c in comparison if not c["in_ml_db"]),
            "extra_in_db":        len(extra_students),
            "processing_time":    round(elapsed, 2),
            "frames_processed":   processed,
        },
    }