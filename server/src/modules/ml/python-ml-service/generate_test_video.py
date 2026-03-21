import os
import argparse
import random
import cv2
import numpy as np

def generate_video(photos_dir, output, duration, fps, width, height, absent):
    student_folders = sorted([f for f in os.listdir(photos_dir)
                               if os.path.isdir(os.path.join(photos_dir, f))])

    random.shuffle(student_folders)
    absent_students = student_folders[:absent]
    present_students = student_folders[absent:]

    print(f"Loaded {len(student_folders)} student photos")
    print(f"Present in video: {len(present_students)}")
    print(f"Absent (not in video): {len(absent_students)}")
    print(f"Absent students: {', '.join([s.split('_')[0] for s in absent_students])}")

    cols = max(1, int(np.ceil(np.sqrt(len(present_students)))))
    rows = max(1, int(np.ceil(len(present_students) / cols)))
    face_w = width // cols
    face_h = height // rows

    student_images = {}
    for folder in present_students:
        folder_path = os.path.join(photos_dir, folder)
        photos = [f for f in os.listdir(folder_path)
                  if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        imgs = []
        for p in photos[:10]:
            img = cv2.imread(os.path.join(folder_path, p))
            if img is not None:
                img = cv2.resize(img, (face_w - 10, face_h - 10))
                imgs.append(img)
        if imgs:
            student_images[folder] = imgs

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output, fourcc, fps, (width, height))

    total_frames = duration * fps
    print(f"\nGenerating {duration}s video at {fps}fps ({total_frames} frames)...")

    late_arrivals = {}
    for folder in list(student_images.keys()):
        if random.random() < 0.3:
            late_arrivals[folder] = int(total_frames * random.uniform(0.1, 0.3))

    for frame_idx in range(total_frames):
        canvas = np.ones((height, width, 3), dtype=np.uint8) * 245

        col_idx = 0
        row_idx = 0
        for folder in present_students:
            if folder not in student_images:
                col_idx += 1
                if col_idx >= cols:
                    col_idx = 0
                    row_idx += 1
                continue

            if folder in late_arrivals and frame_idx < late_arrivals[folder]:
                col_idx += 1
                if col_idx >= cols:
                    col_idx = 0
                    row_idx += 1
                continue

            imgs = student_images[folder]
            img = imgs[frame_idx % len(imgs)].copy()

            brightness = random.randint(-15, 15)
            img = np.clip(img.astype(np.int16) + brightness, 0, 255).astype(np.uint8)

            jitter_x = random.randint(-2, 2)
            jitter_y = random.randint(-2, 2)

            x = col_idx * face_w + 5 + jitter_x
            y = row_idx * face_h + 5 + jitter_y
            x = max(0, min(x, width - img.shape[1]))
            y = max(0, min(y, height - img.shape[0]))

            canvas[y:y+img.shape[0], x:x+img.shape[1]] = img

            col_idx += 1
            if col_idx >= cols:
                col_idx = 0
                row_idx += 1

        noise = np.random.randint(-5, 5, canvas.shape, dtype=np.int16)
        canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        out.write(canvas)

        if frame_idx % fps == 0:
            print(f"\rProgress: {frame_idx//fps}s / {duration}s", end="")

    out.release()
    print(f"\nVideo generated successfully!")
    print(f"File: {output}")
    print(f"Resolution: {width}x{height}")
    print(f"Duration: {duration}s at {fps}fps")
    print(f"Students present: {len(present_students)}")
    print(f"Students absent: {absent}")

    gt_file = output.replace(".mp4", "_ground_truth.txt").replace(".avi", "_ground_truth.txt")
    with open(gt_file, "w") as f:
        f.write("# Ground Truth Attendance for Test Video\n")
        f.write(f"# Video: {output}\n")
        f.write(f"{'Student ID':<12} {'Name':<35} {'Status':<10} {'Arrives At'}\n")
        f.write("-" * 75 + "\n")
        for folder in present_students:
            sid = folder.split("_")[0]
            name = folder.split("_", 1)[1].replace("_", " ") if "_" in folder else folder
            arrive = f"{late_arrivals.get(folder, 0) / fps:.1f}s"
            f.write(f"{sid:<12} {name:<35} {'PRESENT':<10} {arrive}\n")
        for folder in absent_students:
            sid = folder.split("_")[0]
            name = folder.split("_", 1)[1].replace("_", " ") if "_" in folder else folder
            f.write(f"{sid:<12} {name:<35} {'ABSENT':<10} N/A\n")
    print(f"Ground truth: {gt_file}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--photos-dir", required=True)
    parser.add_argument("--output", default="test_classroom.mp4")
    parser.add_argument("--duration", type=int, default=30)
    parser.add_argument("--fps", type=int, default=25)
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=720)
    parser.add_argument("--absent", type=int, default=3)
    args = parser.parse_args()

    generate_video(args.photos_dir, args.output, args.duration,
                   args.fps, args.width, args.height, args.absent)

if __name__ == "__main__":
    main()