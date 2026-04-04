# state.py
# Shared mutable globals — imported by every route module.
# ml_service.py writes to these during startup and /set-det-size.
# All other modules read from here at request time (never at import time).

face_app = None
current_det_size = 640
embeddings_db = {}

# Populated by ml_service.py at startup so route modules can trigger a reload
# without importing ml_service (which would be circular).
load_model_fn = None   # assigned in ml_service.py: state.load_model_fn = load_model
