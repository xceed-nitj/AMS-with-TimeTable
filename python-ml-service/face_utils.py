# face_utils.py
# Face quality scoring, lighting normalisation, and alignment helpers.
# Imported by video_processing.py, ground_truth_routes.py, and anywhere
# per-face pre-processing is needed.

import cv2
import numpy as np


def compute_face_quality(img):
    """Return a scalar quality score for a cropped face image."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)
    brightness_score = 1 - abs(brightness - 127) / 127
    h, w = img.shape[:2]
    size_score = np.sqrt(h * w)
    return sharpness * 0.6 + brightness_score * 50 + size_score * 0.1


def normalize_lighting(img):
    """Equalise the Y channel of a BGR image to reduce lighting variation."""
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
    return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)


def get_aligned_face(face_app, frame, face, min_face_size=50):
    """
    Crop, align, resize and normalise a single detected face.
    Returns None if the face fails quality checks.
    """
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
