"""
test_camera_switch.py
---------------------
Standalone test: verifies that camera switching works between two RTSP URLs.
Does NOT require face_app / state / FastAPI — pure OpenCV only.

Usage:
    python test_camera_switch.py

Edit CAM1_URL and CAM2_URL below to match your actual RTSP streams.
"""

import threading
import time
import cv2

# ── CONFIG ─────────────────────────────────────────────────────────────────────
CAM1_URL = "rtsp://admin:Admin%401234%23@10.10.177.249:554/video/live?channel=1&subtype=0&rtsp_transport=tcp"
CAM2_URL = "rtsp://admin:Admin%401234%23@10.10.177.250:554/video/live?channel=1&subtype=0&rtsp_transport=tcp"

CAMERA_SWITCH_SEC = 10      # switch every 10s for a quick test (original is 30s)
TOTAL_DURATION_SEC = 35     # how long to run the test
FRAME_SKIP = 5              # read every Nth frame (matching your app default)
# ───────────────────────────────────────────────────────────────────────────────


def _open_capture(rtsp_url: str) -> cv2.VideoCapture:
    url = rtsp_url if "rtsp_transport" in rtsp_url else rtsp_url + "?rtsp_transport=tcp"
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap


class _RTSPReader:
    def __init__(self, cap: cv2.VideoCapture, decode_every: int = 1):
        self._cap          = cap
        self._decode_every = max(decode_every, 1)
        self._lock         = threading.Lock()
        self._frame        = None
        self._ok           = True
        self._seq          = 0
        self._n            = 0
        self._stop         = threading.Event()
        self._t            = threading.Thread(target=self._run, daemon=True)
        self._t.start()

    def _run(self):
        while not self._stop.is_set():
            try:
                ret, frame = self._cap.read()
            except Exception as exc:
                print(f"  [reader] error: {exc}")
                with self._lock:
                    self._ok = False
                break
            with self._lock:
                self._ok = ret
                if ret and self._n % self._decode_every == 0:
                    self._frame = frame
                    self._seq  += 1
            self._n += 1
            if not ret:
                break

    def latest(self):
        with self._lock:
            return self._ok, self._frame, self._seq, self._n

    def release(self):
        self._stop.set()
        self._cap.release()


def run_test():
    cameras = [CAM1_URL, CAM2_URL]

    print("=" * 60)
    print("CAMERA SWITCHING TEST")
    print("=" * 60)
    print(f"  Camera 1 : {cameras[0]}")
    print(f"  Camera 2 : {cameras[1]}")
    print(f"  Switch every {CAMERA_SWITCH_SEC}s | Total {TOTAL_DURATION_SEC}s")
    print("=" * 60)

    # ── Open first camera ───────────────────────────────────────────────────
    print(f"\n[{0:5.1f}s] Opening Camera 1...")
    cap = _open_capture(cameras[0])
    if not cap.isOpened():
        print(f"  ❌ FAILED to open Camera 1: {cameras[0]}")
        return

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    print(f"  ✅ Camera 1 opened — {W}x{H} @ {fps:.1f}fps")

    reader      = _RTSPReader(cap, decode_every=FRAME_SKIP)
    last_seq    = 0
    start_t     = time.time()
    last_switch = 0.0
    cam_idx     = 0
    frame_count = 0
    frames_per_cam = {0: 0, 1: 0}

    # ── Main loop ───────────────────────────────────────────────────────────
    while True:
        elapsed = time.time() - start_t

        if elapsed >= TOTAL_DURATION_SEC:
            print(f"\n[{elapsed:5.1f}s] ✅ Duration complete — stopping.")
            break

        # Camera switch check (mirrors _attendance_pipeline logic exactly)
        if len(cameras) > 1 and (elapsed - last_switch) >= CAMERA_SWITCH_SEC:
            old_cam = cam_idx + 1
            reader.release()
            cam_idx = (cam_idx + 1) % len(cameras)
            new_cap = _open_capture(cameras[cam_idx])

            if not new_cap.isOpened():
                print(f"[{elapsed:5.1f}s] ❌ FAILED to open Camera {cam_idx+1}")
                # Try to re-open old camera
                new_cap = _open_capture(cameras[(cam_idx + 1) % 2])
                cam_idx = (cam_idx + 1) % 2

            W2 = int(new_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            H2 = int(new_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            reader   = _RTSPReader(new_cap, decode_every=FRAME_SKIP)
            last_seq = 0
            last_switch = elapsed
            print(f"\n[{elapsed:5.1f}s] 🔄 Switched Cam {old_cam} → Cam {cam_idx+1}  ({W2}x{H2})")

        # Read frame
        ok, frame, seq, _ = reader.latest()

        if not ok or frame is None or seq == last_seq:
            time.sleep(0.01)
            continue

        last_seq = seq
        frame_count += 1
        frames_per_cam[cam_idx] = frames_per_cam.get(cam_idx, 0) + 1

        # Progress print every 2 seconds
        if frame_count % 30 == 0:
            h, w = frame.shape[:2]
            print(f"[{elapsed:5.1f}s] Cam {cam_idx+1} | frame #{frame_count:4d} "
                  f"| size {w}x{h} | cam1={frames_per_cam[0]} cam2={frames_per_cam[1]} frames")

    reader.release()

    # ── Summary ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Total frames read : {frame_count}")
    print(f"  Camera 1 frames   : {frames_per_cam.get(0, 0)}")
    print(f"  Camera 2 frames   : {frames_per_cam.get(1, 0)}")
    expected_switches = TOTAL_DURATION_SEC // CAMERA_SWITCH_SEC
    print(f"  Expected switches : ~{expected_switches}")

    if frames_per_cam.get(0, 0) > 0 and frames_per_cam.get(1, 0) > 0:
        print("\n  ✅ PASS — both cameras delivered frames. Switching is working!")
    elif frames_per_cam.get(0, 0) > 0:
        print("\n  ⚠️  Only Camera 1 delivered frames.")
        print("      → Check Camera 2 RTSP URL or network connectivity.")
    elif frames_per_cam.get(1, 0) > 0:
        print("\n  ⚠️  Only Camera 2 delivered frames.")
        print("      → Check Camera 1 RTSP URL or network connectivity.")
    else:
        print("\n  ❌ FAIL — no frames from either camera.")
    print("=" * 60)


if __name__ == "__main__":
    run_test()
