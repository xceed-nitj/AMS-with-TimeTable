import os
import json
import argparse
import requests

def check_service(ml_url):
    print(f"\n[STEP 2/4] Checking ML service at {ml_url}...")
    try:
        r = requests.get(f"{ml_url}/health", timeout=10)
        data = r.json()
        print(f"  Service is running!")
        print(f"  Model loaded: {data.get('model_loaded')}")
        print(f"  Students enrolled: {data.get('students_enrolled')}")
        return True
    except Exception as e:
        print(f"  ERROR: Cannot reach ML service - {e}")
        print(f"  Make sure ml_service.py is running in another terminal!")
        return False

def process_video(ml_url, video_path, threshold, frame_skip):
    print(f"\n[STEP 3/4] Processing video: {video_path}")
    print(f"  Threshold: {threshold}, Frame skip: {frame_skip}")
    try:
        abs_path = os.path.abspath(video_path)
        r = requests.post(
            f"{ml_url}/process-video",
            json={"videoPath": abs_path, "threshold": threshold, "frame_skip": frame_skip},
            timeout=300
        )
        if r.status_code != 200:
            print(f"  ERROR: {r.status_code} - {r.text}")
            return None
        return r.json()
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def evaluate(result, ground_truth_file):
    print(f"\n[STEP 4/4] Evaluating accuracy...")

    if not os.path.exists(ground_truth_file):
        print(f"  Ground truth file not found: {ground_truth_file}")
        return

    ground_truth = {}
    with open(ground_truth_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("#") or line.startswith("Student") or line.startswith("-"):
                continue
            if "PRESENT" in line:
                sid = line.split()[0]
                ground_truth[sid] = "PRESENT"
            elif "ABSENT" in line:
                sid = line.split()[0]
                ground_truth[sid] = "ABSENT"

    attendance = result.get("attendance", {})
    summary = result.get("summary", {})

    print(f"\n  Processing time: {summary.get('processing_time')}s")
    print(f"  Frames processed: {summary.get('frames_processed')}")
    print(f"  Present: {summary.get('present')} / {summary.get('total')}")

    print(f"\n  {'Student ID':<12} {'ML Says':<10} {'Truth':<10} {'Match'}")
    print("  " + "-" * 55)

    tp = tn = fp = fn = 0
    for sid, gt_status in sorted(ground_truth.items()):
        ml_status = attendance.get(sid, {}).get("status", "absent").upper()
        match = "✓ CORRECT" if ml_status == gt_status else "✗ WRONG"

        if gt_status == "PRESENT" and ml_status == "PRESENT":
            tp += 1
        elif gt_status == "ABSENT" and ml_status == "ABSENT":
            tn += 1
        elif gt_status == "ABSENT" and ml_status == "PRESENT":
            fp += 1
        elif gt_status == "PRESENT" and ml_status == "ABSENT":
            fn += 1

        print(f"  {sid:<12} {ml_status:<10} {gt_status:<10} {match}")

    total = tp + tn + fp + fn
    accuracy  = (tp + tn) / total * 100 if total else 0
    precision = tp / (tp + fp) * 100 if (tp + fp) else 0
    recall    = tp / (tp + fn) * 100 if (tp + fn) else 0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) else 0

    print(f"\n  {'='*50}")
    print(f"  ACCURACY METRICS")
    print(f"  {'='*50}")
    print(f"  Total students:    {total}")
    print(f"  True Positives:    {tp} (correctly detected present)")
    print(f"  True Negatives:    {tn} (correctly detected absent)")
    print(f"  False Positives:   {fp} (wrongly marked present)")
    print(f"  False Negatives:   {fn} (missed - present but not detected)")
    print(f"  Accuracy:          {accuracy:.1f}%")
    print(f"  Precision:         {precision:.1f}%")
    print(f"  Recall:            {recall:.1f}%")
    print(f"  F1 Score:          {f1:.1f}%")
    print(f"  {'='*50}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ground-truth", required=True)
    parser.add_argument("--video", required=True)
    parser.add_argument("--ml-url", default="http://localhost:8500")
    parser.add_argument("--skip-enrollment", action="store_true")
    parser.add_argument("--output-json", default="result.json")
    parser.add_argument("--threshold", type=float, default=0.45)
    parser.add_argument("--frame-skip", type=int, default=10)
    args = parser.parse_args()

    print("=" * 60)
    print("ATTENDANCE SYSTEM - FULL PIPELINE TEST")
    print("=" * 60)

    if args.skip_enrollment:
        print("\n[STEP 1/4] Skipping enrollment (--skip-enrollment)")
    else:
        print("\n[STEP 1/4] Please run build_embeddings_db.py manually first.")

    if not check_service(args.ml_url):
        return

    result = process_video(args.ml_url, args.video,
                           args.threshold, args.frame_skip)
    if not result:
        return

    with open(args.output_json, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\n  Full result saved to: {args.output_json}")

    gt_file = args.video.replace(".mp4", "_ground_truth.txt").replace(".avi", "_ground_truth.txt")
    evaluate(result, gt_file)

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()