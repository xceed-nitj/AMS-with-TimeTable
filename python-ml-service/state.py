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
}
faiss_config_lock = threading.Lock()