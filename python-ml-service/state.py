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
