# faiss_config_store.py
# Load/save helpers for state.faiss_config — the mutable, persisted FAISS
# recognition tuning knobs editable from the ML Fine Tuning page.
#
# Mirrors liveness_config_store.py's exact pattern.

import os
import json
import logging

import state

logger = logging.getLogger("ml_service.faiss_config")

from paths import data_path

CONFIG_PATH = data_path("faiss_config.json")

DEFAULTS = {
    "top_k":               5,
    "recog_threshold":     0.35,
    "reverify_high_score": 0.80,
    "reverify_high_ttl":   60.0,
    "reverify_med_score":  0.65,
    "reverify_med_ttl":    30.0,
    "reverify_low_score":  0.45,
    "reverify_low_ttl":    12.0,
    "shadow_enabled":      False,
}


def load_faiss_config():
    """
    Load persisted FAISS config into state.faiss_config, if a file exists.
    Missing/corrupt file → keep the in-memory defaults (already set in
    state.py) and write them out so the file exists going forward.
    """
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                saved = json.load(f)
            with state.faiss_config_lock:
                merged = {**DEFAULTS, **saved}
                state.faiss_config.update(merged)
            logger.info(f"[FaissConfig] Loaded from {CONFIG_PATH}: {state.faiss_config}")
            return
        except Exception as e:
            logger.warning(f"[FaissConfig] Failed to read {CONFIG_PATH}: {e} — using defaults")

    save_faiss_config()


def save_faiss_config():
    """Write the current state.faiss_config to disk."""
    try:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with state.faiss_config_lock:
            snapshot = dict(state.faiss_config)
        with open(CONFIG_PATH, "w") as f:
            json.dump(snapshot, f, indent=2)
    except Exception as e:
        logger.warning(f"[FaissConfig] Failed to save {CONFIG_PATH}: {e}")


def update_faiss_config(updates: dict):
    """
    Apply a partial update to state.faiss_config (only known keys are
    accepted) and persist it. Returns the resulting full config dict.
    """
    with state.faiss_config_lock:
        for key in DEFAULTS:
            if key in updates:
                state.faiss_config[key] = updates[key]
        snapshot = dict(state.faiss_config)
    save_faiss_config()
    return snapshot
