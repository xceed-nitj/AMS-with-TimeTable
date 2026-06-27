"""
test_ml_service.py
==================
Run this AFTER starting ml_service.py to verify the full pipeline
works end-to-end, including the video at the path you provided.

Usage:
    python test_ml_service.py [--video /path/to/video.mp4] [--host http://localhost:8500]

If you skip --video the health / model checks still run.
"""

import argparse
import json
import sys
import time

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run:  pip install requests")
    sys.exit(1)

# ─── Config ───────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser()
parser.add_argument("--host",  default="http://localhost:8500")
parser.add_argument("--video", default="/Users/udaykaransingh/Desktop/output.mp4")
args = parser.parse_args()

BASE = args.host.rstrip("/")
VIDEO = args.video

PASS = "✅"
FAIL = "❌"
WARN = "⚠️ "
SEP  = "─" * 60


def ok(label, detail=""):
    print(f"  {PASS}  {label}" + (f"  →  {detail}" if detail else ""))

def fail(label, detail=""):
    print(f"  {FAIL}  {label}" + (f"  →  {detail}" if detail else ""))

def warn(label, detail=""):
    print(f"  {WARN}  {label}" + (f"  →  {detail}" if detail else ""))


# ─── Test 1: Health check ─────────────────────────────────────────────────────

print(f"\n{SEP}")
print("TEST 1 — /health")
print(SEP)

try:
    r = requests.get(f"{BASE}/health", timeout=10)
    h = r.json()
    print(f"  Response: {json.dumps(h, indent=4)}")

    if h.get("model_loaded"):
        ok("InsightFace model loaded")
    else:
        fail("InsightFace model NOT loaded — startup may have crashed")

    if h.get("faiss_loaded"):
        ok(f"FAISS index loaded  ({h['faiss_vectors']} vectors, {h['students_enrolled']} students)")
    else:
        warn("FAISS index not loaded — run Generate_embeddings.py first",
             "Video attendance will fall back to pkl (if available)")

    if h.get("students_enrolled", 0) > 0:
        ok(f"{h['students_enrolled']} students enrolled")
    else:
        warn("0 students enrolled — attendance results will be empty",
             "Run Generate_embeddings.py or /build-embeddings first")

except requests.ConnectionError:
    fail("Cannot connect to service", f"Is ml_service.py running on {BASE}?")
    print("\n  To start the service:")
    print("      cd <your-project>/python")
    print("      python ml_service.py")
    sys.exit(1)
except Exception as e:
    fail("Unexpected error", str(e))
    sys.exit(1)


# ─── Test 2: /process-video ───────────────────────────────────────────────────

print(f"\n{SEP}")
print("TEST 2 — POST /process-video")
print(SEP)

payload = {
    "videoPath":  VIDEO,
    "threshold":  0.45,
    "frame_skip": 5,
}
print(f"  Payload: {json.dumps(payload, indent=4)}")

try:
    t0 = time.time()
    r  = requests.post(f"{BASE}/process-video", json=payload, timeout=600)
    elapsed = round(time.time() - t0, 1)

    if r.status_code == 200:
        data = r.json()
        summary = data.get("summary", {})
        ok(f"Response 200 in {elapsed}s")
        print(f"\n  Summary:")
        print(f"    • Frames processed : {summary.get('frames_processed', '?')}")
        print(f"    • Total students   : {summary.get('total', '?')}")
        print(f"    • Present          : {summary.get('present', '?')}")
        print(f"    • Absent           : {summary.get('absent', '?')}")
        print(f"    • Processing time  : {summary.get('processing_time', '?')}s")

        attendance = data.get("attendance", {})
        present_list = [sid for sid, v in attendance.items() if v["status"] == "present"]
        if present_list:
            ok(f"Faces recognised: {present_list}")
        else:
            warn("No students marked present",
                 "Either no faces in video OR no embeddings enrolled yet")

    elif r.status_code == 400:
        d = r.json()
        if "No embeddings" in d.get("detail", ""):
            warn("No embeddings loaded (expected if skipping enrolment)",
                 "Run Generate_embeddings.py to enrol students, then retry")
        elif "Cannot open video" in d.get("detail", ""):
            fail("Video not found / unreadable", VIDEO)
        else:
            fail(f"HTTP 400", d.get("detail"))

    elif r.status_code == 404:
        fail("Video file not found at path", VIDEO)
        print("  Make sure the ml_service.py process can read this path.")

    else:
        fail(f"HTTP {r.status_code}", r.text[:200])

except requests.Timeout:
    warn("Request timed out (>600s)", "Video may be very long or machine is slow")
except Exception as e:
    fail("Unexpected error", str(e))


# ─── Test 3: /extract-faces (cluster without roll list) ───────────────────────

print(f"\n{SEP}")
print("TEST 3 — POST /extract-faces  (face detection + clustering only)")
print(SEP)

payload3 = {
    "videoPath":         VIDEO,
    "frame_skip":        10,
    "cluster_threshold": 0.45,
    "min_samples":       3,
}

try:
    t0 = time.time()
    r  = requests.post(f"{BASE}/extract-faces", json=payload3, timeout=600)
    elapsed = round(time.time() - t0, 1)

    if r.status_code == 200:
        data = r.json()
        ok(f"Response 200 in {elapsed}s")
        print(f"    • Total detections : {data.get('total_detections', '?')}")
        print(f"    • Unique faces     : {data.get('unique_faces', '?')}")
        if data.get("unique_faces", 0) > 0:
            ok("Face detection and clustering working correctly")
        else:
            warn("0 unique faces found",
                 "Check video has visible faces, and InsightFace det_size is correct (640)")
    else:
        fail(f"HTTP {r.status_code}", r.text[:200])

except requests.Timeout:
    warn("Timed out", "Try increasing frame_skip to 30")
except Exception as e:
    fail("Unexpected error", str(e))


# ─── Test 4: /logs ────────────────────────────────────────────────────────────

print(f"\n{SEP}")
print("TEST 4 — GET /logs  (check for any ERROR lines)")
print(SEP)

try:
    r    = requests.get(f"{BASE}/logs?limit=100", timeout=5)
    logs = r.json().get("logs", [])
    errors = [l for l in logs if l["level"] in ("ERROR", "CRITICAL")]
    if errors:
        warn(f"{len(errors)} ERROR(s) in service log:")
        for e in errors[-5:]:
            print(f"    [{e['timestamp']}] {e['message'][:120]}")
    else:
        ok("No errors in recent service logs")
except Exception as e:
    warn("Could not fetch logs", str(e))


# ─── Summary ──────────────────────────────────────────────────────────────────

print(f"\n{SEP}")
print("DONE")
print(SEP)
print("""
Next steps:
  1. If FAISS not loaded  →  python Generate_embeddings.py --dataset <ground_truth_dir>
  2. If 0 faces detected  →  try GET /set-det-size with det_size=320 for distant cameras
  3. If 0 present         →  lower threshold in payload (try 0.35) after embeddings are built
  4. Full streaming run   →  POST /process-video-clustering-stream  (SSE, best for long videos)
""")
