# detector_config_store.py
# Load/save helpers for state.detector_config — which face DETECTOR the
# shared FaceAnalysis instance uses (SCRFD-10G built into buffalo_l, or an
# optional RetinaFace ONNX). Editable from the Face Detector card (ML Fine
# Tuning page). Mirrors max_k_config_store.py's pattern.

import os
import json
import logging

import state

logger = logging.getLogger("ml_service.detector_config")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
CONFIG_PATH = os.path.join(ROOT_DIR, "server", "ml-data", "detector_config.json")

DETECTOR_CHOICES = ("scrfd", "retinaface")

DEFAULTS = {
    "active": "scrfd",
}


def load_detector_config():
    """
    Load persisted detector config into state.detector_config, if a file
    exists. Missing/corrupt file → keep defaults and write them out.
    Note: applying the choice to face_app happens separately via
    detector_utils.apply_active_detector().
    """
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                saved = json.load(f)
            merged = {**DEFAULTS, **saved}
            if merged["active"] not in DETECTOR_CHOICES:
                logger.warning(f"[DetectorConfig] Invalid active {merged['active']!r} — resetting to 'scrfd'")
                merged["active"] = "scrfd"
            with state.detector_config_lock:
                state.detector_config.update(merged)
            logger.info(f"[DetectorConfig] Loaded from {CONFIG_PATH}: {state.detector_config}")
            return
        except Exception as e:
            logger.warning(f"[DetectorConfig] Failed to read {CONFIG_PATH}: {e} — using defaults")

    save_detector_config()


def save_detector_config():
    """Write the current state.detector_config to disk."""
    try:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with state.detector_config_lock:
            snapshot = dict(state.detector_config)
        with open(CONFIG_PATH, "w") as f:
            json.dump(snapshot, f, indent=2)
    except Exception as e:
        logger.warning(f"[DetectorConfig] Failed to save {CONFIG_PATH}: {e}")


def update_detector_config(updates: dict):
    """Apply a partial update (known keys only) and persist. Returns the full config."""
    with state.detector_config_lock:
        for key in DEFAULTS:
            if key in updates:
                state.detector_config[key] = updates[key]
        snapshot = dict(state.detector_config)
    save_detector_config()
    return snapshot
