import os
import cv2
import numpy as np
import time
import json
from sklearn.cluster import DBSCAN

def extract_all_faces(video_path, face_app, frame_skip=10):
    """
    Step 1 and 2:
    Open video → extract frames → detect faces → get embeddings
    Returns list of all faces found with their images and timestamps
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    all_embeddings = []
    all_face_images = []
    all_timestamps  = []
    frame_count = 0

    print(f"[Clustering] Extracting faces from video...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        if frame_count % frame_skip != 0:
            continue

        faces = face_app.get(frame)
        timestamp = frame_count / fps

        for face in faces:
            emb = face.embedding
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm

            # crop face from frame
            bbox = face.bbox.astype(int)
            x1 = max(0, bbox[0])
            y1 = max(0, bbox[1])
            x2 = min(frame.shape[1], bbox[2])
            y2 = min(frame.shape[0], bbox[3])
            face_crop = frame[y1:y2, x1:x2]

            if face_crop.size > 0:
                all_embeddings.append(emb)
                all_face_images.append(face_crop)
                all_timestamps.append(round(timestamp, 2))

    cap.release()
    print(f"[Clustering] Extracted {len(all_embeddings)} faces total")
    return all_embeddings, all_face_images, all_timestamps


def cluster_faces(all_embeddings, cluster_threshold=0.45, min_samples=2):
    """
    Step 3:
    Group similar faces together using DBSCAN
    Similar faces = same person = same cluster
    """
    if len(all_embeddings) == 0:
        return [], set()

    print(f"[Clustering] Clustering {len(all_embeddings)} faces...")

    embeddings_array = np.array(all_embeddings)

    # DBSCAN groups faces that are close to each other
    # eps = distance threshold (1 - similarity)
    # min_samples = min frames needed to form a cluster
    clustering = DBSCAN(
        eps=1 - cluster_threshold,
        min_samples=min_samples,
        metric='cosine'
    ).fit(embeddings_array)

    labels = clustering.labels_
    unique_labels = set(labels)
    unique_labels.discard(-1)  # -1 = noise/unclassified faces

    print(f"[Clustering] Found {len(unique_labels)} unique people")
    return labels, unique_labels


def identify_clusters(
    labels, unique_labels,
    all_embeddings, all_face_images, all_timestamps,
    embeddings_db, output_dir,
    auto_present_threshold=0.60,
    review_threshold=0.40
):
    """
    Step 4 and 5:
    For each cluster:
    - Compute mean embedding
    - Compare with ground truth database
    - Identify who it is
    - Save face images to folder named as roll number
    - Decide present/review/absent
    """
    embeddings_array = np.array(all_embeddings)
    os.makedirs(output_dir, exist_ok=True)

    attendance = {}
    cluster_results = []

    for cluster_id in unique_labels:
        # get all face indices in this cluster
        indices = np.where(labels == cluster_id)[0]

        # compute mean embedding for this cluster
        cluster_embeddings = embeddings_array[indices]
        mean_emb = np.mean(cluster_embeddings, axis=0)
        mean_emb = mean_emb / np.linalg.norm(mean_emb)

        # compare with every student in ground truth DB
        best_id    = None
        best_score = -1
        for sid, data in embeddings_db.items():
            score = float(np.dot(mean_emb, data["embedding"]))
            if score > best_score:
                best_score = score
                best_id    = sid

        # decide status based on confidence
        if best_score >= auto_present_threshold:
            status = "present"
            confidence_zone = "high"
            # folder named as roll number
            folder_name = f"{best_id}_{embeddings_db[best_id]['name'].replace(' ', '_')}"

        elif best_score >= review_threshold:
            status = "review"
            confidence_zone = "medium"
            # folder flagged for review
            folder_name = f"REVIEW_{best_id}_conf{best_score:.2f}"

        else:
            status = "unknown"
            confidence_zone = "low"
            best_id = None
            # unknown person
            folder_name = f"UNKNOWN_cluster_{cluster_id}"

        # create folder for this cluster
        cluster_folder = os.path.join(output_dir, folder_name)
        os.makedirs(cluster_folder, exist_ok=True)

        # save best 5 face images as evidence
        saved = 0
        for idx in indices[:5]:
            face_img = all_face_images[idx]
            if face_img.size > 0:
                img_path = os.path.join(
                    cluster_folder,
                    f"t{all_timestamps[idx]}s_frame{idx}.jpg"
                )
                cv2.imwrite(img_path, face_img)
                saved += 1

        # record result
        cluster_result = {
            "cluster_id":      int(cluster_id),
            "folder_name":     folder_name,
            "detection_count": len(indices),
            "avg_confidence":  round(float(best_score), 4),
            "confidence_zone": confidence_zone,
            "status":          status,
            "identified_as":   best_id,
            "name": embeddings_db[best_id]["name"] if best_id else "Unknown",
            "first_seen_sec":  round(float(all_timestamps[indices[0]]), 1),
            "saved_images":    saved
        }
        cluster_results.append(cluster_result)

        # add to attendance if identified
        if best_id:
            # keep highest confidence if same student appears in multiple clusters
            if best_id not in attendance or \
               best_score > attendance[best_id]["avg_confidence"]:
                attendance[best_id] = {
                    "name":            embeddings_db[best_id]["name"],
                    "status":          status,
                    "detection_count": len(indices),
                    "avg_confidence":  round(float(best_score), 4),
                    "confidence_zone": confidence_zone,
                    "cluster_folder":  folder_name,
                    "first_seen_sec":  round(float(all_timestamps[indices[0]]), 1)
                }

    # students not detected at all = absent
    for sid, data in embeddings_db.items():
        if sid not in attendance:
            attendance[sid] = {
                "name":            data["name"],
                "status":          "absent",
                "detection_count": 0,
                "avg_confidence":  0,
                "confidence_zone": "low",
                "cluster_folder":  None,
                "first_seen_sec":  None
            }

    return attendance, cluster_results


def process_video_with_clustering(
    video_path, embeddings_db, face_app,
    frame_skip=10,
    cluster_threshold=0.45,
    min_samples=2,
    auto_present_threshold=0.60,
    review_threshold=0.40,
    output_base_dir="./clustering_output"
):
    """
    Main function — combines all steps:
    Video → Extract → Cluster → Identify → Save → Return result
    """
    start = time.time()

    # Step 1+2: Extract all faces
    all_embeddings, all_face_images, all_timestamps = extract_all_faces(
        video_path, face_app, frame_skip
    )

    if len(all_embeddings) == 0:
        return {"error": "No faces detected in video"}

    # Step 3: Cluster similar faces
    labels, unique_labels = cluster_faces(
        all_embeddings, cluster_threshold, min_samples
    )

    # Create output folder named after video
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    output_dir = os.path.join(output_base_dir, video_name)

    # Step 4+5: Identify clusters + save folders
    attendance, cluster_results = identify_clusters(
        labels, unique_labels,
        all_embeddings, all_face_images, all_timestamps,
        embeddings_db, output_dir,
        auto_present_threshold, review_threshold
    )

    elapsed = time.time() - start

    present = sum(1 for v in attendance.values() if v["status"] == "present")
    review  = sum(1 for v in attendance.values() if v["status"] == "review")
    absent  = sum(1 for v in attendance.values() if v["status"] == "absent")
    unknown = sum(1 for c in cluster_results   if c["status"] == "unknown")

    result = {
        "video":      video_path,
        "output_dir": output_dir,
        "attendance": attendance,
        "clusters":   cluster_results,
        "summary": {
            "total_faces_extracted": len(all_embeddings),
            "unique_clusters_found": len(unique_labels),
            "unknown_faces":         unknown,
            "total_enrolled":        len(embeddings_db),
            "present":               present,
            "review":                review,
            "absent":                absent,
            "processing_time":       round(elapsed, 2)
        }
    }

    # save result JSON
    result_path = os.path.join(output_dir, "attendance_result.json")
    with open(result_path, "w") as f:
        json.dump(
            {k: v for k, v in result.items() if k != "attendance"},
            f, indent=2
        )

    print(f"[Clustering] Done in {elapsed:.1f}s")
    print(f"[Clustering] Present:{present} Review:{review} Absent:{absent} Unknown:{unknown}")
    print(f"[Clustering] Output: {output_dir}")

    return result