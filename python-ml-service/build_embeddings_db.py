DET_SIZE = 640


def build_embeddings(photos_dir: str, output_path: str):
    try:
        from insightface.app import FaceAnalysis
        import cv2
    except ImportError as e:
        print(f"ERROR: Missing dependency — {e}")
        print("Install with:  pip install insightface==0.7.3 opencv-python-headless")
        return

    print(f"Loading InsightFace buffalo_s  det_size={DET_SIZE}×{DET_SIZE} (CPU)")
    app = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(DET_SIZE, DET_SIZE))

    student_folders = [
        f for f in sorted(os.listdir(photos_dir))
        if os.path.isdir(os.path.join(photos_dir, f))
    ]
    print(f"Found {len(student_folders)} student folder(s) in: {photos_dir}\n")

    embeddings_db = {}

    for folder in student_folders:
        parts      = folder.split("_", 1)
        student_id = parts[0]
        name       = parts[1].replace("_", " ") if len(parts) > 1 else folder
        fp         = os.path.join(photos_dir, folder)

        all_photos = [
            f for f in os.listdir(fp)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            and not f.startswith("_")
        ]

        # Honour _info.json embedding_files if present
        info_path = os.path.join(fp, "_info.json")
        if os.path.exists(info_path):
            try:
                with open(info_path) as fi:
                    info = json.load(fi)
                ef = [f for f in info.get("embedding_files", [])
                      if os.path.exists(os.path.join(fp, f))]
                photos = ef if ef else all_photos
            except Exception:
                photos = all_photos
        else:
            photos = all_photos

        face_embeddings = []
        for photo in photos:
            try:
                img = cv2.imread(os.path.join(fp, photo))
                if img is None:
                    print(f"    ⚠ Cannot read: {photo}")
                    continue

                # If photo is very large, resize to reasonable size first
                h, w = img.shape[:2]
                if max(h, w) > 1280:
                    scale = 1280 / max(h, w)
                    img   = cv2.resize(img, (int(w*scale), int(h*scale)),
                                       interpolation=cv2.INTER_LANCZOS4)

                faces = app.get(img)
                if not faces:
                    # Try upscaled version for small photos
                    img_up = cv2.resize(img, None, fx=2.0, fy=2.0,
                                        interpolation=cv2.INTER_LANCZOS4)
                    faces  = app.get(img_up)

                if faces:
                    # Pick the largest face (most likely the subject)
                    face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))
                    emb  = face.embedding
                    norm = np.linalg.norm(emb)
                    if norm > 0:
                        face_embeddings.append(emb / norm)
                else:
                    print(f"    ⚠ No face detected: {photo}")

            except Exception as e:
                print(f"    ⚠ Error processing {photo}: {e}")

        if face_embeddings:
            mean_emb = np.mean(face_embeddings, axis=0)
            norm     = np.linalg.norm(mean_emb)
            mean_emb = mean_emb / norm
            embeddings_db[student_id] = {
                "name":      name,
                "embedding": mean_emb,
                "num_photos": len(face_embeddings),
            }
            print(f"✓  {student_id:12s}  {name:30s}  faces={len(face_embeddings)}/{len(photos)}")
        else:
            print(f"✗  {student_id:12s}  {name:30s}  NO FACES DETECTED")

    with open(output_path, "wb") as f:
        pickle.dump(embeddings_db, f)

    print("\n" + "═" * 55)
    print(f"  Output:           {output_path}")
    print(f"  Students enrolled: {len(embeddings_db)} / {len(student_folders)}")
    total = sum(v["num_photos"] for v in embeddings_db.values())
    print(f"  Embeddings used:  {total}")
    print("═" * 55)


def main():
    parser = argparse.ArgumentParser(description="Build InsightFace embeddings database")
    parser.add_argument("--photos-dir", required=True,
                        help="Root folder containing one sub-folder per student")
    parser.add_argument("--output", default="./embeddings_db.pkl",
                        help="Output .pkl path  (default: ./embeddings_db.pkl)")
    args = parser.parse_args()

    if not os.path.isdir(args.photos_dir):
        print(f"ERROR: photos-dir does not exist: {args.photos_dir}")
        return

    build_embeddings(args.photos_dir, args.output)


if __name__ == "__main__":
    main()