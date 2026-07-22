# paths.py
# Single source of truth for where this ML service keeps its LOCAL data
# (config JSONs, embedding pkls, FAISS index, liveness-rejected crops, …).
#
# The Node server and this service may run on DIFFERENT machines (e.g. the
# H100 box) — nothing in this service may assume the Node server's
# filesystem is reachable. All file exchange with Node happens over HTTP
# payloads/SSE events; the paths below are this machine's private storage.
#
# Set ML_DATA_DIR to an ABSOLUTE path in production (e.g. in the service's
# environment/unit file). The default keeps the legacy single-machine
# layout (../server/ml-data relative to this file) so existing deployments
# keep finding their data without any migration.

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

ML_DATA_DIR = os.path.abspath(
    os.environ.get("ML_DATA_DIR", os.path.join(ROOT_DIR, "server", "ml-data"))
)


def data_path(*parts):
    """Absolute path under ML_DATA_DIR."""
    return os.path.join(ML_DATA_DIR, *parts)
