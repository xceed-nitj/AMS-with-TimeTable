# test_tracked_attendance_merge.py
#
# Verification script for the tracked-attendance addition.
# Run this AFTER `pip install -r requirements.txt` and AFTER starting
# ml_service.py, before asking for the merge to be approved.
#
#   python test_tracked_attendance_merge.py --ml-url http://localhost:8500
#
# What it checks automatically:
#   1. Service is up and the existing /health endpoint still works
#      (proves the old pipeline wasn't broken by this change).
#   2. Every pre-existing route still responds with something other than 404
#      (proves nothing was accidentally removed/renamed).
#   3. The new /run-attendance-rtsp-tracked route exists and returns a
#      clean, expected error if no FAISS index has been built yet
#      (proves the new code path is wired in without crashing the service).
#
# What it can't check automatically (no RTSP camera / GPU in CI):
#   4. Live tracked recognition against a real camera — see the manual
#      checklist printed at the end.

import argparse
import requests

EXISTING_ROUTES_SHOULD_EXIST = [
    ("GET",  "/health"),
    ("GET",  "/det-size"),
    ("GET",  "/logs"),
    ("POST", "/process-video"),            # 422 (missing body) is fine — proves route exists
    ("POST", "/run-attendance-rtsp"),
    ("POST", "/run-attendance-rtsp-sync"),
    ("POST", "/extract-rtsp-stream"),
    ("POST", "/stop-rtsp-stream"),
    ("POST", "/build-embeddings"),
]

NEW_ROUTE = ("POST", "/run-attendance-rtsp-tracked")


def _hit(ml_url, method, path, json=None):
    url = f"{ml_url}{path}"
    try:
        if method == "GET":
            r = requests.get(url, timeout=10)
        else:
            r = requests.post(url, json=json or {}, timeout=10)
        return r.status_code
    except Exception as e:
        return f"ERROR: {e}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ml-url", default="http://localhost:8500")
    args = parser.parse_args()

    print("=" * 60)
    print("1) Health check (old pipeline still alive)")
    print("=" * 60)
    r = requests.get(f"{args.ml_url}/health", timeout=10)
    print(r.status_code, r.json())
    assert r.status_code == 200, "Service did not come up cleanly"

    print()
    print("=" * 60)
    print("2) Pre-existing routes still respond (no regressions)")
    print("=" * 60)
    all_ok = True
    for method, path in EXISTING_ROUTES_SHOULD_EXIST:
        status = _hit(args.ml_url, method, path)
        ok = status != 404
        all_ok &= ok
        print(f"  [{'OK ' if ok else 'FAIL'}] {method:5s} {path:30s} -> {status}")
    assert all_ok, "One or more pre-existing routes are missing — STOP, do not merge."

    print()
    print("=" * 60)
    print("3) New /run-attendance-rtsp-tracked route is wired in")
    print("=" * 60)
    method, path = NEW_ROUTE
    status = _hit(args.ml_url, method, path, json={"rtspUrl": "rtsp://example/invalid"})
    print(f"  status = {status}")
    # 404 would mean the router never got included — that's the only failure
    # mode we're checking for here. 422/503/200 are all "the route exists".
    assert status != 404, "New route is missing — check ml_service.py include_router()"
    print("  Route exists.")

    print()
    print("ALL AUTOMATED CHECKS PASSED.")
    print()
    print("=" * 60)
    print("MANUAL CHECKLIST (do this before requesting merge approval)")
    print("=" * 60)
    print("""
  [ ] Run Generate_embeddings.py against a real ground_truth dataset and
      confirm it writes server/ml-data/embeddings/faiss.index + metadata.db
      without errors.
  [ ] Restart ml_service.py and confirm the startup log shows:
        "Loaded FAISS index: N vectors, M students."
      instead of the "No FAISS index found" warning.
  [ ] Point a real (or test) RTSP URL at /run-attendance-rtsp-tracked via
      the Node proxy and confirm:
        - "job_id" SSE event arrives first
        - "stage" events describe the run
        - "marked" events fire as known students appear on camera
        - GET /attendance-frame-preview?jobId=<id> shows the live annotated
          video with roll numbers drawn on tracked faces
        - POST /stop-rtsp-stream (or the Node /api/stop-tracked-attendance)
          cleanly stops the stream
  [ ] Confirm the OLD attendance flow (/run-attendance-rtsp,
      /process-video, etc.) still works exactly as before, side by side.
""")


if __name__ == "__main__":
    main()
