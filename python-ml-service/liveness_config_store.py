# liveness_config_store.py
# Load/save helpers for state.liveness_config — the mutable, persisted
# liveness/anti-spoofing tuning knobs editable from the ML Fine Tuning page.
#
# Mirrors the existing embeddings_db.pkl load pattern in ml_service.py, but
# uses plain JSON since this is just a handful of scalar values an admin
# might want to inspect/edit by hand if needed.

import os
import json
import logging

import state

logger = logging.getLogger("ml_service.liveness_config")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
CONFIG_PATH = os.path.join(ROOT_DIR, "server", "ml-data", "liveness_config.json")

DEFAULTS = {
    "enabled":             True,
    "heuristic_threshold": 0.15,
    "onnx_threshold":      0.50,
    "save_rejected_crops": True,
}


def load_liveness_config():
    """
    Load persisted liveness config into state.liveness_config, if a file
    exists. Missing/corrupt file → keep the in-memory defaults (already
    set in state.py) and write them out so the file exists going forward.
    """
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                saved = json.load(f)
            with state.liveness_config_lock:
                # Merge onto defaults rather than replacing outright, so an
                # older config file missing a newer key (e.g. after an
                # update adds a setting) doesn't crash or silently drop it.
                merged = {**DEFAULTS, **saved}
                state.liveness_config.update(merged)
            logger.info(f"[LivenessConfig] Loaded from {CONFIG_PATH}: {state.liveness_config}")
            return
        except Exception as e:
            logger.warning(f"[LivenessConfig] Failed to read {CONFIG_PATH}: {e} — using defaults")

    # No file yet, or it failed to load — persist current (default) state
    # so the file exists for next time and reflects what's actually active.
    save_liveness_config()


def save_liveness_config():
    """Write the current state.liveness_config to disk."""
    try:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with state.liveness_config_lock:
            snapshot = dict(state.liveness_config)
        with open(CONFIG_PATH, "w") as f:
            json.dump(snapshot, f, indent=2)
    except Exception as e:
        logger.warning(f"[LivenessConfig] Failed to save {CONFIG_PATH}: {e}")


def update_liveness_config(updates: dict):
    """
    Apply a partial update to state.liveness_config (only known keys are
    accepted — unknown keys are silently ignored rather than polluting the
    config with typos from a malformed request) and persist it.
    Returns the resulting full config dict.
    """
    with state.liveness_config_lock:
        for key in DEFAULTS:
            if key in updates:
                state.liveness_config[key] = updates[key]
        snapshot = dict(state.liveness_config)
    save_liveness_config()
    return snapshot
