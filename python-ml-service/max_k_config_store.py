# max_k_config_store.py
# Load/save helpers for state.max_k_config — the mutable, persisted
# max-of-K shadow-comparison knobs editable from the ML Fine Tuning page.
#
# Mirrors faiss_config_store.py's exact pattern.

import os
import json
import logging

import state

logger = logging.getLogger("ml_service.max_k_config")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
CONFIG_PATH = os.path.join(ROOT_DIR, "server", "ml-data", "max_k_config.json")

DEFAULTS = {
    "enabled": False,
    "top_k":   3,
}


def load_max_k_config():
    """
    Load persisted max-of-K config into state.max_k_config, if a file exists.
    Missing/corrupt file → keep the in-memory defaults (already set in
    state.py) and write them out so the file exists going forward.
    """
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                saved = json.load(f)
            with state.max_k_config_lock:
                merged = {**DEFAULTS, **saved}
                state.max_k_config.update(merged)
            logger.info(f"[MaxKConfig] Loaded from {CONFIG_PATH}: {state.max_k_config}")
            return
        except Exception as e:
            logger.warning(f"[MaxKConfig] Failed to read {CONFIG_PATH}: {e} — using defaults")

    save_max_k_config()


def save_max_k_config():
    """Write the current state.max_k_config to disk."""
    try:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with state.max_k_config_lock:
            snapshot = dict(state.max_k_config)
        with open(CONFIG_PATH, "w") as f:
            json.dump(snapshot, f, indent=2)
    except Exception as e:
        logger.warning(f"[MaxKConfig] Failed to save {CONFIG_PATH}: {e}")


def update_max_k_config(updates: dict):
    """
    Apply a partial update to state.max_k_config (only known keys are
    accepted) and persist it. Returns the resulting full config dict.
    """
    with state.max_k_config_lock:
        for key in DEFAULTS:
            if key in updates:
                state.max_k_config[key] = updates[key]
        snapshot = dict(state.max_k_config)
    save_max_k_config()
    return snapshot
