import cv2
import os

os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

url = 'rtsp://admin:Admin@1234#@10.10.177.250:554/cam/realmonitor?channel=1&subtype=0'
cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)

if cap.isOpened():
    print("OK - Stream connected!")
    ret, frame = cap.read()
    print(f"Frame read: {ret}, Size: {frame.shape if ret else 'N/A'}")
else:
    print("FAILED - Could not open stream")

cap.release()