# adaface_utils.py
# Optional second face-recognition model (AdaFace), entirely separate from
# InsightFace/ArcFace. Mirrors the liveness ONNX model's load pattern
# (ml_service.py's load_liveness_model()) — if no .onnx file is present,
# every function here degrades to a no-op (returns None), never raising.
#
# AdaFace needs the same 5-point-landmark alignment ArcFace-family models
# use. We reuse InsightFace's own standalone alignment utility
# (insightface.utils.face_align.norm_crop) rather than reimplementing a
# similarity-transform/warpAffine — this is a read-only call into the
# insightface package itself, not a modification of it.
#
# See README_ADAFACE.md for where to obtain/convert an ONNX export and the
# documented preprocessing assumption below.

import os
import logging

import cv2
import numpy as np
from insightface.utils import face_align

import state

logger = logging.getLogger("ml_service.adaface")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_adaface_model():
    """
    Optional: load an AdaFace ONNX embedding model if a model file is
    present. Looks for ADAFACE_MODEL_PATH env var, falling back to
    python-ml-service/models/adaface.onnx. Missing file is NOT an error —
    every AdaFace-dependent feature (ground-truth embedding computation,
    subject embedding generation, the mid-period shadow comparison) simply
    no-ops until a model is supplied, exactly like the liveness classifier.
    """
    model_path = os.environ.get(
        "ADAFACE_MODEL_PATH",
        os.path.join(BASE_DIR, "models", "adaface.onnx"),
    )
    if not os.path.exists(model_path):
        logger.info(
            f"[AdaFace] No ONNX model found at {model_path} — AdaFace features "
            f"disabled (see README_ADAFACE.md to enable them)."
        )
        state.adaface_session = None
        state.adaface_input_name = None
        return

    try:
        import onnxruntime as ort
        state.adaface_session = ort.InferenceSession(
            model_path, providers=["CPUExecutionProvider"]
        )
        state.adaface_input_name = state.adaface_session.get_inputs()[0].name
        logger.info(f"[AdaFace] Loaded ONNX embedding model from {model_path}")
    except Exception as e:
        logger.warning(f"[AdaFace] Failed to load {model_path}: {e} — AdaFace features disabled.")
        state.adaface_session = None
        state.adaface_input_name = None


def align_for_adaface(frame, kps):
    """
    Align a detected face to the standard 112x112 ArcFace-style crop AdaFace
    expects, using InsightFace's own alignment utility (not InsightFace's
    embedding model — just its landmark-alignment math). Returns None if
    landmarks are missing.
    """
    if kps is None:
        return None
    try:
        return face_align.norm_crop(frame, landmark=kps, image_size=112, mode="arcface")
    except Exception:
        logger.exception("[AdaFace] Alignment failed")
        return None


def get_adaface_embedding(aligned_bgr_112):
    """
    Run the AdaFace ONNX model on an already-aligned 112x112 BGR face crop.
    Returns an L2-normalized float32 embedding, or None if the model isn't
    loaded or inference fails.

    Preprocessing assumption (documented in README_ADAFACE.md, may need a
    one-line tweak for the exact ONNX export you supply): BGR->RGB,
    (pixel/255 - 0.5) / 0.5 normalize to [-1, 1], NCHW float32.
    """
    if state.adaface_session is None or aligned_bgr_112 is None:
        return None
    try:
        rgb = cv2.cvtColor(aligned_bgr_112, cv2.COLOR_BGR2RGB).astype(np.float32)
        rgb = (rgb / 255.0 - 0.5) / 0.5
        blob = rgb.transpose(2, 0, 1)[np.newaxis, ...]  # NCHW
        outputs = state.adaface_session.run(None, {state.adaface_input_name: blob})
        emb = np.asarray(outputs[0]).reshape(-1).astype(np.float32)
        norm = np.linalg.norm(emb)
        if norm == 0:
            return None
        return emb / norm
    except Exception:
        logger.exception("[AdaFace] Embedding inference failed")
        return None


def get_adaface_embedding_for_face(frame, kps):
    """Convenience: align + embed in one call. Returns None on any failure."""
    aligned = align_for_adaface(frame, kps)
    if aligned is None:
        return None
    return get_adaface_embedding(aligned)
