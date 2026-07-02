import cv2
import numpy as np

out = cv2.VideoWriter('dummy_video.mp4', cv2.VideoWriter_fourcc(*'mp4v'), 30, (640, 480))
for i in range(100):
    # Create a frame
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Draw a mock face (a white rectangle)
    cv2.rectangle(frame, (200, 150), (440, 330), (255, 255, 255), -1)
    
    out.write(frame)
out.release()
print("dummy_video.mp4 created")
