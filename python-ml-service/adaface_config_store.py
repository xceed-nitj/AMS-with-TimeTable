# adaface_config_store.py
# Load/save helpers for state.adaface_config — the mutable, persisted
# AdaFace shadow-comparison knobs editable from the ML Fine Tuning page.
#
# Mirrors faiss_config_store.py's / max_k_config_store.py's exact pattern.

import os
import json
import logging

import state

logger = logging.getLogger("ml_service.adaface_config")

from paths import data_path

CONFIG_PATH = data_path("adaface_config.json")

DEFAULTS = {
    "enabled":         False,
    "recog_threshold": 0.30,
    "top_k":           3,
}


def load_adaface_config():
    """
    Load persisted AdaFace config into state.adaface_config, if a file
    exists. Missing/corrupt file → keep the in-memory defaults (already set
    in state.py) and write them out so the file exists going forward.
    """
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                saved = json.load(f)
            with state.adaface_config_lock:
                merged = {**DEFAULTS, **saved}
                state.adaface_config.update(merged)
            logger.info(f"[AdafaceConfig] Loaded from {CONFIG_PATH}: {state.adaface_config}")
            return
        except Exception as e:
            logger.warning(f"[AdafaceConfig] Failed to read {CONFIG_PATH}: {e} — using defaults")

    save_adaface_config()


def save_adaface_config():
    """Write the current state.adaface_config to disk."""
    try:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with state.adaface_config_lock:
            snapshot = dict(state.adaface_config)
        with open(CONFIG_PATH, "w") as f:
            json.dump(snapshot, f, indent=2)
    except Exception as e:
        logger.warning(f"[AdafaceConfig] Failed to save {CONFIG_PATH}: {e}")


def update_adaface_config(updates: dict):
    """
    Apply a partial update to state.adaface_config (only known keys are
    accepted) and persist it. Returns the resulting full config dict.
    """
    with state.adaface_config_lock:
        for key in DEFAULTS:
            if key in updates:
                state.adaface_config[key] = updates[key]
        snapshot = dict(state.adaface_config)
    save_adaface_config()
    return snapshot
