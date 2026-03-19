import os
import pickle
import argparse
import numpy as np

def build_embeddings(photos_dir, output_path):
    try:
        import insightface
        from insightface.app import FaceAnalysis
    except ImportError:
        print("ERROR: insightface not installed. Run: pip install insightface==0.7.3")
        return

    print("Loading InsightFace model: buffalo_s")
    app = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(640, 640))

    student_folders = [f for f in os.listdir(photos_dir)
                       if os.path.isdir(os.path.join(photos_dir, f))]
    print(f"Found {len(student_folders)} student folders\n")

    embeddings_db = {}

    for folder in sorted(student_folders):
        parts = folder.split("_", 1)
        student_id = parts[0]
        name = parts[1].replace("_", " ") if len(parts) > 1 else folder

        folder_path = os.path.join(photos_dir, folder)
        photos = [f for f in os.listdir(folder_path)
                  if f.lower().endswith((".jpg", ".jpeg", ".png"))]

        face_embeddings = []
        for photo in photos:
            img_path = os.path.join(folder_path, photo)
            try:
                import cv2
                img = cv2.imread(img_path)
                if img is None:
                    continue
                faces = app.get(img)
                if faces:
                    face_embeddings.append(faces[0].embedding)
            except Exception as e:
                print(f"  Warning: could not process {photo}: {e}")

        if face_embeddings:
            mean_emb = np.mean(face_embeddings, axis=0)
            norm = np.linalg.norm(mean_emb)
            if norm > 0:
                mean_emb = mean_emb / norm
            embeddings_db[student_id] = {
                "name": name,
                "embedding": mean_emb,
                "num_photos": len(face_embeddings)
            }
            print(f"✓ {student_id} ({name}): {len(face_embeddings)}/{len(photos)} faces from photos")
        else:
            print(f"✗ {student_id} ({name}): 0 faces detected!")

    with open(output_path, "wb") as f:
        pickle.dump(embeddings_db, f)

    print("\n" + "=" * 50)
    print(f"Database saved to: {output_path}")
    print(f"Students enrolled: {len(embeddings_db)}")
    total = sum(v["num_photos"] for v in embeddings_db.values())
    print(f"Total face embeddings used: {total}")
    print("=" * 50)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--photos-dir", required=True)
    parser.add_argument("--output", default="./embeddings_db.pkl")
    args = parser.parse_args()
    build_embeddings(args.photos_dir, args.output)

if __name__ == "__main__":
    main()