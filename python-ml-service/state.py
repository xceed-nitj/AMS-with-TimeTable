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


faiss_index = None
vid_to_roll = {}
embeddings_meta = {}
face_pool = None
faiss_dirty: bool = False
faiss_index_lock: threading.Lock = threading.Lock()
_next_vector_id: int = 0
