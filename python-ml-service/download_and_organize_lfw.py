import os
import sys
import argparse
import random
import shutil
import tarfile
import urllib.request

def download_lfw(output_dir):
    url = "http://vis-www.cs.umass.edu/lfw/lfw-deepfunneled.tgz"
    os.makedirs(output_dir, exist_ok=True)
    tgz_path = os.path.join(output_dir, "lfw-deepfunneled.tgz")
    
    print("=" * 60)
    print("STEP 1: Downloading LFW Dataset (~173 MB)")
    print("=" * 60)
    print(f"Downloading from: {url}")

    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = min(100.0, downloaded * 100 / total_size)
        mb_done = downloaded / (1024*1024)
        mb_total = total_size / (1024*1024)
        print(f"\rProgress: {percent:.1f}% ({mb_done:.1f} / {mb_total:.1f} MB)", end="")

    urllib.request.urlretrieve(url, tgz_path, reporthook=progress)
    print("\nDownload complete!")
    return tgz_path

def extract_lfw(tgz_path, output_dir):
    print("\nSTEP 2: Extracting archive...")
    with tarfile.open(tgz_path, "r:gz") as tar:
        tar.extractall(output_dir)
    print("Extraction complete!")
    return os.path.join(output_dir, "lfw-deepfunneled")

def organize(lfw_dir, output_dir, num_students, min_photos, enrollment_ratio, seed):
    random.seed(seed)
    print("=" * 60)
    print("STEP 3: Organizing into attendance system format")
    print("=" * 60)

    people = []
    for person in os.listdir(lfw_dir):
        person_dir = os.path.join(lfw_dir, person)
        if os.path.isdir(person_dir):
            photos = [f for f in os.listdir(person_dir) if f.endswith(".jpg")]
            if len(photos) >= min_photos:
                people.append((person, photos))

    people.sort(key=lambda x: -len(x[1]))
    selected = people[:num_students]
    print(f"Found {len(people)} people with {min_photos}+ photos in LFW")
    print(f"Organizing {num_students} students...\n")

    gt_dir = os.path.join(output_dir, "ground-truth")
    test_dir = os.path.join(output_dir, "test-photos")
    os.makedirs(gt_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)

    print(f"{'ID':<10} {'Name':<35} {'Enroll':>8} {'Test':>6} {'Total':>7}")
    print("-" * 70)

    info_lines = []
    for i, (person, photos) in enumerate(selected):
        student_id = f"STU{i+1:03d}"
        folder_name = f"{student_id}_{person}"
        random.shuffle(photos)
        split = max(1, int(len(photos) * enrollment_ratio))
        enroll_photos = photos[:split]
        test_photos = photos[split:]

        enroll_out = os.path.join(gt_dir, folder_name)
        test_out = os.path.join(test_dir, folder_name)
        os.makedirs(enroll_out, exist_ok=True)
        os.makedirs(test_out, exist_ok=True)

        src = os.path.join(lfw_dir, person)
        for j, p in enumerate(enroll_photos):
            shutil.copy(os.path.join(src, p), os.path.join(enroll_out, f"photo{j+1}.jpg"))
        for j, p in enumerate(test_photos):
            shutil.copy(os.path.join(src, p), os.path.join(test_out, f"test{j+1}.jpg"))

        print(f"{student_id:<10} {person:<35} {len(enroll_photos):>8} {len(test_photos):>6} {len(photos):>7}")
        info_lines.append(f"{student_id},{person},{len(enroll_photos)},{len(test_photos)}")

    with open(os.path.join(output_dir, "dataset_info.txt"), "w") as f:
        f.write("student_id,name,enroll_photos,test_photos\n")
        f.write("\n".join(info_lines))

    print("\n" + "=" * 70)
    print("Dataset organized successfully!")
    print(f"Ground-truth (enrollment): {gt_dir}")
    print(f"Test photos (for video):   {test_dir}")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="./test-data")
    parser.add_argument("--num-students", type=int, default=20)
    parser.add_argument("--min-photos", type=int, default=4)
    parser.add_argument("--enrollment-ratio", type=float, default=0.6)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--lfw-dir", default=None)
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    if args.lfw_dir:
        lfw_dir = args.lfw_dir
    elif args.skip_download:
        lfw_dir = os.path.join(args.output_dir, "lfw-deepfunneled")
    else:
        tgz = download_lfw(args.output_dir)
        lfw_dir = extract_lfw(tgz, args.output_dir)

    organize(lfw_dir, args.output_dir, args.num_students,
             args.min_photos, args.enrollment_ratio, args.seed)

if __name__ == "__main__":
    main()