# detector_utils.py
# Optional RetinaFace detector, swappable with buffalo_l's built-in SCRFD-10G
# at runtime (Face Detector card, ML Fine Tuning page).
#
# Both detectors satisfy the same contract — (bboxes, 5-point kps) — which is
# all the recognition/embedding side consumes (it aligns crops off the kps).
# So swapping the detection module inside the shared FaceAnalysis instance
# changes detection ONLY; ArcFace/AdaFace embeddings, clustering, FAISS and
# every downstream consumer are untouched.
#
# Mirrors the liveness/AdaFace graceful-absence pattern: no ONNX file → the
# service runs exactly as before on SCRFD, and the frontend shows the
# RetinaFace option as unavailable.

import os
import logging

import state

logger = logging.getLogger("ml_service.detector")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# insightface model_zoo-compatible RetinaFace export (see README_RETINAFACE.md)
RETINAFACE_MODEL_PATH = os.environ.get(
    "RETINAFACE_MODEL_PATH",
    os.path.join(BASE_DIR, "models", "retinaface.onnx"),
)


def load_retinaface_model():
    """
    Load the optional RetinaFace ONNX via insightface.model_zoo (which
    recognises RetinaFace graphs and returns a detector object with the same
    .detect() interface SCRFD has). Missing file is NOT an error — SCRFD
    remains the only detector and 'retinaface' can't be activated.
    """
    if not os.path.exists(RETINAFACE_MODEL_PATH):
        logger.info(
            f"[Detector] No RetinaFace ONNX at {RETINAFACE_MODEL_PATH} — "
            f"SCRFD-10G (buffalo_l built-in) is the only detector. "
            f"See README_RETINAFACE.md to enable the comparison option."
        )
        state.retinaface_det_model = None
        return

    try:
        from insightface import model_zoo
        model = model_zoo.get_model(RETINAFACE_MODEL_PATH)
        if model is None or not hasattr(model, "detect"):
            raise ValueError("model_zoo did not return a detector (wrong ONNX type?)")
        _prepare_detector(model)
        state.retinaface_det_model = model
        logger.info(f"[Detector] Loaded RetinaFace from {RETINAFACE_MODEL_PATH}")
    except Exception as e:
        logger.warning(
            f"[Detector] Failed to load RetinaFace from {RETINAFACE_MODEL_PATH}: {e} — "
            f"staying on SCRFD-10G."
        )
        state.retinaface_det_model = None


def _prepare_detector(model):
    """prepare() a detector for the current det_size — kwargs differ slightly
    across model_zoo detector classes, so fall back progressively."""
    use_gpu = os.environ.get("USE_GPU", "false").lower() == "true"
    ctx_id = 0 if use_gpu else -1
    det = state.current_det_size or 640
    try:
        model.prepare(ctx_id, input_size=(det, det), det_thresh=0.3)
    except TypeError:
        try:
            model.prepare(ctx_id, input_size=(det, det))
        except TypeError:
            model.prepare(ctx_id)


def apply_active_detector():
    """
    Point the shared FaceAnalysis instance at whichever detector
    state.detector_config selects. Called at startup (after load_model and
    load_retinaface_model), after every /set-det-size model reload (which
    resets face_app to SCRFD), and on every /detector-config change.

    Taken under state.face_lock so the swap is atomic w.r.t. in-flight
    face_app.get() calls (every call site already serialises on that lock).
    Falls back to SCRFD when RetinaFace is selected but not loaded.
    """
    if state.face_app is None:
        return

    with state.detector_config_lock:
        active = state.detector_config.get("active", "scrfd")

    with state.face_lock:
        # Capture buffalo_l's own SCRFD module once per loaded face_app.
        current = getattr(state.face_app, "det_model", None)
        if state.scrfd_det_model is None or (
            current is not None and current is not state.retinaface_det_model
        ):
            state.scrfd_det_model = current

        if active == "retinaface" and state.retinaface_det_model is not None:
            _prepare_detector(state.retinaface_det_model)
            target = state.retinaface_det_model
        else:
            if active == "retinaface":
                logger.warning("[Detector] 'retinaface' selected but not loaded — using SCRFD-10G")
            target = state.scrfd_det_model

        if target is not None:
            state.face_app.det_model = target
            if hasattr(state.face_app, "models") and "detection" in state.face_app.models:
                state.face_app.models["detection"] = target

    logger.info(f"[Detector] Active detector: "
                f"{'RetinaFace' if target is state.retinaface_det_model and state.retinaface_det_model is not None else 'SCRFD-10G (buffalo_l)'}")
