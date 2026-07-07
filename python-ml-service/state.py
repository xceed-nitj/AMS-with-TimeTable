# state.py
# Shared mutable globals — imported by every route module.
# ml_service.py writes to these during startup and /set-det-size.
# All other modules read from here at request time (never at import time).

import threading

face_app = None
current_det_size = 640
embeddings_db = {}

# face_app is a single shared InsightFace instance. Concurrent attendance/
# ground-truth runs (different rooms/streams) execute on separate threads,
# but ONNXRuntime inference sessions — especially on a CUDA execution
# provider — are not guaranteed safe under unsynchronized concurrent
# Run() calls from multiple threads. Every call site that touches
# face_app.get(...) must acquire this lock around just that call so
# parallel jobs serialize only the brief inference step, not capture/
# clustering/IO, which remain fully concurrent.
face_lock = threading.Lock()

# Populated by ml_service.py at startup so route modules can trigger a reload
# without importing ml_service (which would be circular).
load_model_fn = None   # assigned in ml_service.py: state.load_model_fn = load_model

# ─── Liveness / anti-spoofing (printed-photo & screen-replay detection) ───────
# Optional dedicated ONNX classifier (e.g. MiniFASNet). None if no model file
# was found at startup — in that case clustering_service.py falls back to the
# always-available heuristic scorer in face_utils.compute_liveness_score().
# Same threading caveat as face_app applies, so liveness calls also take
# face_lock (see clustering_service.py).
liveness_session = None
liveness_input_name = None
liveness_input_size = 80   # MiniFASNet's native input is 80x80; heuristic path ignores this

# Live, mutable, persisted tuning knobs — previously hardcoded module
# constants in clustering_service.py. Now editable at runtime via
# GET/POST /liveness-config (see rtsp_routes.py), backed by
# ml-data/liveness_config.json so changes survive a server restart.
# clustering_service.py reads from this dict on every check, never from
# a hardcoded constant, so a change made on the ML Fine Tuning page takes
# effect on the very next face detection — no restart needed.
liveness_config = {
    "enabled":               True,
    "heuristic_threshold":   0.15,
    "onnx_threshold":        0.50,
    "save_rejected_crops":   True,   # write rejected crops to ml-data/liveness_rejected/
}
liveness_config_lock = threading.Lock()  # guards reads/writes to the dict above

# ─── GT Acquisition tuning knobs ──────────────────────────────────────────────
# Editable at runtime via GET/POST /gt-config (mlRoutes.js → rtsp_routes.py).
# Python functions read directly from this dict so a change on the ML Fine
# Tuning page takes effect on the next acquisition run — no restart needed.
gt_config = {
    # --- Per-session parameters (defaults for RTSPRequest fields) ---
    "frame_skip":              10,    # process 1 in N frames
    "target_imgs_per_person":  10,    # stop collecting once this many saved per person
    "cluster_threshold":       0.45,  # DBSCAN cosine-similarity eps
    "min_samples":             3,     # DBSCAN minimum cluster size
    "det_size":                320,   # InsightFace detection grid (320 or 640)
    # --- Clustering quality ---
    "merge_threshold":         0.75,  # post-DBSCAN cluster-merge threshold
    "nms_iou_thresh":          0.35,  # NMS IoU overlap threshold
    # --- Embedding quality ---
    "det_score_floor":         0.5,   # minimum InsightFace det_score to accept a face
    # --- Session behaviour ---
    "new_person_timeout":      60,    # auto-stop after N seconds with no new person
    # --- Image storage ---
    "top_n":                   10,    # max images kept per person folder
    "embed_n":                 5,     # of top_n, how many are used for embeddings
}
gt_config_lock = threading.Lock()

# faiss.Index instance holding every enrolled student's embedding vector(s),
# built by Generate_embeddings.py. None until that script has been run and
# ml_service.py has loaded its output.
faiss_index = None

# Maps a FAISS vector row id (int) -> roll number (str). Built from
# metadata.db (written by Generate_embeddings.py) so
# faiss_utils._recognize_face()/_topk_roll_scores() can translate a
# similarity-search hit back into a roll number.
vid_to_roll: dict = {}

# ─── FAISS recognition tuning knobs ────────────────────────────────────────────
# Editable at runtime via GET/POST /faiss-config (see rtsp_routes.py), backed
# by ml-data/faiss_config.json so changes survive a server restart — same
# pattern as liveness_config above. faiss_utils.py reads these on every
# recognition call rather than from hardcoded literals.
faiss_config = {
    "top_k":               5,     # nearest-neighbor candidates considered per detection
    "recog_threshold":     0.35,  # minimum similarity to accept a match
    "reverify_high_score": 0.80,  # score cutoffs + cache TTLs for the live
    "reverify_high_ttl":   60.0,  # tracked-attendance re-verify cache — a
    "reverify_med_score":  0.65,  # confidently-matched track doesn't need to
    "reverify_med_ttl":    30.0,  # re-run recognition every frame, so higher-
    "reverify_low_score":  0.45,  # confidence matches get longer TTLs. Below
    "reverify_low_ttl":    12.0,  # reverify_low_score, always re-verify (0s).
    # Optional shadow comparison inside the Hungarian batch-matching pipeline
    # (_attendance_pipeline in rtsp_routes.py): scores each cluster mean
    # against the FULL FAISS index (top_k/recog_threshold above) and reports
    # agreement with the primary mean-embedding assignment — diagnostic
    # only, fires on at most one run per period (the middle one). Off by
    # default; toggle from the FAISS Recognition Thresholds section (ML
    # Fine Tuning page).
    "shadow_enabled":      False,
}
faiss_config_lock = threading.Lock()

# ─── Max-of-K shadow comparison (Hungarian batch-matching pipeline) ───────────
# Editable at runtime via GET/POST /max-k-config (see rtsp_routes.py), backed
# by ml-data/max_k_config.json — same persisted-runtime-knob pattern as
# faiss_config above. When enabled, _attendance_pipeline additionally scores
# each detected face cluster against every enrolled student's top-K
# individually stored embeddings (max-similarity across the K vectors,
# rather than similarity to one pre-averaged mean vector) and reports how
# often that alternative scoring agrees with the primary mean-embedding
# assignment. This is a side-by-side comparison only — it never changes the
# primary (mean-embedding) assignment or the resulting attendance decision.
max_k_config = {
    "enabled": False,
    "top_k":   3,    # how many of each student's stored embeddings to score against (<= what's cached)
}
max_k_config_lock = threading.Lock()

# ─── AdaFace — second, independent face-recognition model ─────────────────────
# Entirely separate from InsightFace/ArcFace: its own optional ONNX session
# (None until load_adaface_model() finds a model file — see adaface_utils.py,
# mirrors liveness_session's graceful-absence pattern), its own embedding
# space, its own ground-truth/subject-embedding files and DB fields, and its
# own optional mid-period shadow comparison in _attendance_pipeline —
# gated on adaface_config["enabled"] below, same as faiss_config/max_k_config.
adaface_session    = None
adaface_input_name = None

adaface_config = {
    "enabled":         False,
    "recog_threshold": 0.30,  # AdaFace has its own similarity scale — don't reuse InsightFace/FAISS thresholds
    "top_k":           3,     # how many of each student's stored AdaFace embeddings to score against
}
adaface_config_lock = threading.Lock()

# ─── Model Pipeline — which model decides attendance, which run as shadows ────
# Single source of truth for model ROLES in _attendance_pipeline, editable at
# runtime via GET/POST /pipeline-config (Model Pipeline card, ML Fine Tuning
# page), persisted to ml-data/pipeline_config.json via pipeline_config_store.py.
#
#   primary     — the model whose Hungarian assignment actually decides
#                 attendance (mean | max_k | faiss | adaface). If its
#                 prerequisites are missing at run time (no AdaFace ONNX, no
#                 FAISS index, no cached top-K/AdaFace enrolled data), the run
#                 auto-falls back to "mean" with a logged warning and the
#                 report records the fallback.
#   shadow_*    — which models additionally run as diagnostic middle-of-period
#                 shadow comparisons against the primary. The primary model's
#                 own shadow flag is ignored (comparing it to itself is
#                 meaningless).
#
# These flags supersede the legacy per-model gates (max_k_config["enabled"],
# faiss_config["shadow_enabled"], adaface_config["enabled"]'s shadow role) —
# pipeline_config_store.py seeds from them once, on first creation. The
# per-model config dicts above remain the home of each model's
# hyperparameters (top_k, recog_threshold, ...); adaface_config["enabled"]
# still gates enrollment-time AdaFace embedding generation.
pipeline_config = {
    "primary":        "mean",   # mean | max_k | faiss | adaface
    "shadow_mean":    False,
    "shadow_max_k":   False,
    "shadow_faiss":   False,
    "shadow_adaface": False,
}
pipeline_config_lock = threading.Lock()

# ─── Face detector selection (SCRFD-10G vs RetinaFace) ────────────────────────
# buffalo_l's built-in detector IS SCRFD-10G (det_10g.onnx) — the default.
# An optional RetinaFace ONNX (models/retinaface.onnx or RETINAFACE_MODEL_PATH,
# insightface model_zoo-compatible export) can be loaded for comparison and
# selected at runtime from the Face Detector card (ML Fine Tuning page).
# Swapping happens by replacing face_app's detection module only — the
# recognition/embedding side is untouched, since both detectors hand over the
# same (bboxes + 5-point landmarks) contract that alignment consumes.
# See detector_utils.py.
scrfd_det_model      = None   # captured from face_app after load_model()
retinaface_det_model = None   # None until a RetinaFace ONNX is found+loaded

detector_config = {
    "active": "scrfd",   # scrfd | retinaface
}
detector_config_lock = threading.Lock()