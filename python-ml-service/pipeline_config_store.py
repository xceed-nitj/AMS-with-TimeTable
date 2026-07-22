# pipeline_config_store.py
# Load/save helpers for state.pipeline_config — which model is the PRIMARY
# attendance decision-maker and which run as middle-of-period shadow
# comparisons. Editable from the Model Pipeline card (ML Fine Tuning page).
#
# Mirrors max_k_config_store.py's pattern, with one addition: on very first
# creation (no pipeline_config.json yet) the shadow flags are seeded from the
# legacy per-model gates so deploying this feature doesn't silently change
# which comparisons run.

import os
import json
import logging

import state

logger = logging.getLogger("ml_service.pipeline_config")

from paths import data_path

CONFIG_PATH = data_path("pipeline_config.json")

PRIMARY_CHOICES = ("mean", "max_k", "faiss", "adaface")

DEFAULTS = {
    "primary":        "mean",
    "shadow_mean":    False,
    "shadow_max_k":   False,
    "shadow_faiss":   False,
    "shadow_adaface": False,
}


def load_pipeline_config():
    """
    Load persisted pipeline config into state.pipeline_config, if a file
    exists. No file yet → seed the shadow flags from the legacy per-model
    gates (max_k_config.enabled, faiss_config.shadow_enabled,
    adaface_config.enabled) and write the result out. Must be called AFTER
    the legacy config stores have loaded (see ml_service.py lifespan order).
    """
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                saved = json.load(f)
            merged = {**DEFAULTS, **saved}
            if merged["primary"] not in PRIMARY_CHOICES:
                logger.warning(
                    f"[PipelineConfig] Invalid primary {merged['primary']!r} in "
                    f"{CONFIG_PATH} — resetting to 'mean'")
                merged["primary"] = "mean"
            with state.pipeline_config_lock:
                state.pipeline_config.update(merged)
            logger.info(f"[PipelineConfig] Loaded from {CONFIG_PATH}: {state.pipeline_config}")
            return
        except Exception as e:
            logger.warning(f"[PipelineConfig] Failed to read {CONFIG_PATH}: {e} — using defaults")
            save_pipeline_config()
            return

    # First run — seed shadow roles from the legacy gates they supersede.
    with state.max_k_config_lock:
        legacy_max_k = bool(state.max_k_config.get("enabled", False))
    with state.faiss_config_lock:
        legacy_faiss = bool(state.faiss_config.get("shadow_enabled", False))
    with state.adaface_config_lock:
        legacy_adaface = bool(state.adaface_config.get("enabled", False))
    with state.pipeline_config_lock:
        state.pipeline_config.update({
            "primary":        "mean",
            "shadow_mean":    False,
            "shadow_max_k":   legacy_max_k,
            "shadow_faiss":   legacy_faiss,
            "shadow_adaface": legacy_adaface,
        })
    logger.info(
        f"[PipelineConfig] First run — seeded shadows from legacy gates: "
        f"max_k={legacy_max_k} faiss={legacy_faiss} adaface={legacy_adaface}")
    save_pipeline_config()


def save_pipeline_config():
    """Write the current state.pipeline_config to disk."""
    try:
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with state.pipeline_config_lock:
            snapshot = dict(state.pipeline_config)
        with open(CONFIG_PATH, "w") as f:
            json.dump(snapshot, f, indent=2)
    except Exception as e:
        logger.warning(f"[PipelineConfig] Failed to save {CONFIG_PATH}: {e}")


def update_pipeline_config(updates: dict):
    """
    Apply a partial update (only known keys accepted; primary validated by
    the route before calling) and persist. Returns the full config dict.
    """
    with state.pipeline_config_lock:
        for key in DEFAULTS:
            if key in updates:
                state.pipeline_config[key] = updates[key]
        snapshot = dict(state.pipeline_config)
    save_pipeline_config()
    return snapshot
