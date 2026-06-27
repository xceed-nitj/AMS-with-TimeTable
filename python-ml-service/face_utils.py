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


# ═══════════════════════════════════════════════════════════════════════════
# Liveness / anti-spoofing — reject photos and screens held up to the camera
# ═══════════════════════════════════════════════════════════════════════════
#
# Two paths, picked automatically depending on what's available:
#
#   1. ONNX model path (preferred, higher accuracy) — used when
#      state.liveness_session is not None, i.e. a model file (e.g. MiniFASNet,
#      see python-ml-service/README_LIVENESS.md for where to get one) was
#      found at startup. ~98% accuracy on standard print/replay benchmarks.
#
#   2. Heuristic fallback (always available, zero extra dependencies or
#      downloads) — combines three signals that differ measurably between
#      real skin and a printed photo / phone screen held up to the camera:
#
#        a. High-frequency texture richness (skin pores/fine detail vs the
#           comparatively flat, evenly-printed or pixel-grid surface of a
#           photo/screen). Measured via Laplacian variance in a tight grid
#           of small patches rather than one global value — a print or
#           screen tends to be uniformly flat across the whole face, while
#           real skin has localized texture variation grid cell to grid cell.
#        b. Color richness in YCrCb — printers and especially screens both
#           compress the natural color gamut of skin tones; real skin has
#           more chrominance variance.
#        c. Specular highlight ratio — glossy paper and screen glass both
#           reflect light far more uniformly/brightly than skin, producing
#           a higher fraction of near-saturated bright pixels.
#
#      None of these signals alone is reliable (lighting, camera, paper
#      finish all vary), so they're combined into one weighted score and
#      compared against an empirically reasonable threshold. This catches
#      the common, low-effort spoof (printed photo, phone screen) that
#      issue asks for; it is not iBeta-certified-grade defense against a
#      determined attacker with a high-end display and controlled lighting.
#      Swap in the ONNX path for that level of assurance.

def _texture_richness_score(gray):
    """
    Patch-wise Laplacian variance — flat across patches for a photo/screen,
    uneven for real skin (pores, micro-shadows, slight surface irregularity).
    Returns the spread (std) of the per-patch sharpness values.
    """
    h, w = gray.shape
    if h < 16 or w < 16:
        return 0.0
    grid = 4
    ph, pw = h // grid, w // grid
    if ph < 2 or pw < 2:
        return 0.0
    patch_vars = []
    for gy in range(grid):
        for gx in range(grid):
            patch = gray[gy*ph:(gy+1)*ph, gx*pw:(gx+1)*pw]
            if patch.size == 0:
                continue
            patch_vars.append(float(cv2.Laplacian(patch, cv2.CV_64F).var()))
    if not patch_vars:
        return 0.0
    return float(np.std(patch_vars))


def _color_richness_score(crop_bgr):
    """Chrominance variance in YCrCb — flattened color range is a print/screen tell."""
    ycrcb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2YCrCb)
    cr = ycrcb[:, :, 1].astype(np.float32)
    cb = ycrcb[:, :, 2].astype(np.float32)
    return float(np.std(cr) + np.std(cb))


def _specular_highlight_ratio(crop_bgr):
    """Fraction of near-saturated bright pixels — glare from paper/screen glass."""
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
    bright_pixels = np.count_nonzero(gray > 235)
    return float(bright_pixels) / float(gray.size)


def compute_liveness_score(crop_bgr):
    """
    Heuristic liveness score for a face crop. Higher = more likely a real,
    live face. Lower = more likely a printed photo or screen replay.

    Returns a float, typically in roughly the 0–3 range in practice (not a
    normalised probability) — callers compare it against a threshold tuned
    on their own footage rather than treating it as a strict 0..1 confidence.
    """
    if crop_bgr is None or crop_bgr.size == 0:
        return 0.0

    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)

    texture = _texture_richness_score(gray)          # higher = more live-like
    color   = _color_richness_score(crop_bgr)         # higher = more live-like
    glare   = _specular_highlight_ratio(crop_bgr)      # higher = more spoof-like

    # Normalise each term to a roughly comparable scale before combining.
    # Constants below were picked from typical webcam/CCTV face-crop ranges,
    # not a formal calibration study — tune LIVENESS_HEURISTIC_THRESHOLD in
    # clustering_service.py against your own footage if you see false rejects.
    texture_term = min(texture / 15.0, 1.0)
    color_term   = min(color / 40.0, 1.0)
    glare_term   = min(glare * 10.0, 1.0)

    score = (texture_term * 0.5) + (color_term * 0.35) - (glare_term * 0.4)
    return float(score)


def run_onnx_liveness(session, input_name, crop_bgr, input_size=80):
    """
    Run a MiniFASNet-style ONNX liveness classifier on a face crop.
    Expects a 3-class softmax output: [live, print-attack, replay-attack]
    (this is the standard Silent-Face-Anti-Spoofing output layout).

    Returns the "live" class probability as a float in [0, 1], or None if
    inference fails for any reason (caller should fall back to the heuristic).
    """
    try:
        resized = cv2.resize(crop_bgr, (input_size, input_size))
        blob = resized.astype(np.float32).transpose(2, 0, 1)[np.newaxis, ...]
        outputs = session.run(None, {input_name: blob})
        probs = outputs[0][0]
        # Softmax in case the model returns raw logits rather than probabilities
        if not np.isclose(np.sum(probs), 1.0, atol=0.05):
            exp = np.exp(probs - np.max(probs))
            probs = exp / np.sum(exp)
        return float(probs[0])  # index 0 = "live" per Silent-Face-Anti-Spoofing convention
    except Exception:
        return None
