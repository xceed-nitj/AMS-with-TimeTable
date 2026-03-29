import os
import cv2
import numpy as np
import time
import json
from sklearn.cluster import DBSCAN


def get_video_clips(video_path, clip_duration_sec=300):
    """
    Returns a list of (start_frame, end_frame) pairs for a video,
    each covering at most clip_duration_sec seconds.
    For short videos returns a single pair covering the whole video.
    """
    cap = cv2.VideoCapture(video_path)
    fps         = cap.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()

    frames_per_clip = int(fps * clip_duration_sec)
    clips = []
    start = 0
    while start < total_frames:
        end = min(start + frames_per_clip, total_frames)
        clips.append((start, end))
        start = end
    return clips, fps, total_frames

def extract_all_faces(video_path, face_app, frame_skip=10, max_width=640,
                      start_frame=0, end_frame=None,
                      min_face_size=0, laplacian_threshold=0.0):
    """
    Step 1 and 2:
    Open video → extract frames → detect faces → get embeddings.
    Returns (embeddings, face_images, timestamps, quality_scores).

    Filtering params:
      min_face_size        – skip faces where min(w, h) < this (0 = disabled)
      laplacian_threshold  – skip blurry faces below this variance (0 = disabled)
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception(f"Cannot open video: {video_path}")

    fps        = cap.get(cv2.CAP_PROP_FPS) or 25
    vid_width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    scale      = min(1.0, max_width / vid_width) if vid_width > max_width else 1.0

    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    all_embeddings   = []
    all_face_images  = []
    all_timestamps   = []
    all_quality_scores = []
    frame_count      = start_frame

    print(f"[Clustering] Extracting faces (scale={scale:.2f}, skip={frame_skip}, "
          f"min_face={min_face_size}px, lap_thresh={laplacian_threshold}, "
          f"frames {start_frame}–{end_frame or 'end'})...")

    while True:
        if end_frame is not None and frame_count >= end_frame:
            break

        if not cap.grab():
            break

        frame_count += 1
        if frame_count % frame_skip != 0:
            continue

        ret, frame = cap.retrieve()
        if not ret:
            continue

        if frame_count % 200 == 0:
            print(f"[Clustering] Frame {frame_count}, faces so far: {len(all_embeddings)}")

        if scale < 1.0:
            frame = cv2.resize(frame, None, fx=scale, fy=scale,
                               interpolation=cv2.INTER_LINEAR)

        faces     = face_app.get(frame)
        timestamp = round(frame_count / fps, 2)

        for face in faces:
            emb  = face.embedding
            norm = np.linalg.norm(emb)
            if norm == 0:
                continue
            emb = emb / norm

            bbox = face.bbox.astype(int)
            x1   = max(0, bbox[0])
            y1   = max(0, bbox[1])
            x2   = min(frame.shape[1], bbox[2])
            y2   = min(frame.shape[0], bbox[3])
            w, h = x2 - x1, y2 - y1

            # Filter: minimum face size
            if min_face_size > 0 and min(w, h) < min_face_size:
                continue

            crop = frame[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            # Blur filter + quality score
            gray    = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            if laplacian_threshold > 0 and lap_var < laplacian_threshold:
                continue

            det_score = float(getattr(face, 'det_score', 1.0))
            quality   = det_score * ((w * h) ** 0.5) * min(lap_var, 500.0) / 500.0

            all_embeddings.append(emb)
            all_face_images.append(crop)
            all_timestamps.append(timestamp)
            all_quality_scores.append(quality)

    cap.release()
    print(f"[Clustering] Extracted {len(all_embeddings)} faces "
          f"(frames {start_frame}–{frame_count}, skip={frame_skip})")
    return all_embeddings, all_face_images, all_timestamps, all_quality_scores


def cluster_faces(all_embeddings, cluster_threshold=0.45, min_samples=2):
    """
    Step 3:
    Group similar faces together using DBSCAN
    Similar faces = same person = same cluster

    Optimisation: embeddings are already L2-normalised, so cosine distance
    and Euclidean distance are mathematically equivalent:
        euclidean_dist² = 2 * cosine_dist   (for unit vectors)
    Switching to metric='euclidean' lets DBSCAN use algorithm='ball_tree'
    which is O(n log n) instead of the brute-force O(n²) required for cosine.
    n_jobs=-1 uses all CPU cores for the distance queries.
    """
    if len(all_embeddings) == 0:
        return [], set()

    print(f"[Clustering] Clustering {len(all_embeddings)} faces...")

    embeddings_array = np.array(all_embeddings)  # already L2-normalised

    # Convert cosine eps → euclidean eps for unit vectors:
    #   euclidean_eps = sqrt(2 * cosine_eps) = sqrt(2 * (1 - threshold))
    cosine_eps     = 1.0 - cluster_threshold
    euclidean_eps  = float(np.sqrt(2.0 * cosine_eps))

    clustering = DBSCAN(
        eps=euclidean_eps,
        min_samples=min_samples,
        metric='euclidean',
        algorithm='ball_tree',   # O(n log n) spatial tree instead of O(n²) brute
        n_jobs=-1,               # parallelise across all CPU cores
    ).fit(embeddings_array)

    labels = clustering.labels_
    unique_labels = set(labels)
    unique_labels.discard(-1)  # -1 = noise/unclassified

    print(f"[Clustering] Found {len(unique_labels)} unique people")
    return labels, unique_labels


def save_clusters_serial(
    labels, unique_labels,
    all_face_images, all_timestamps,
    output_dir,
    min_images=5
):
    """
    Save each cluster to a serial-numbered folder (cluster_001, cluster_002, ...)
    WITHOUT requiring roll number assignment.
    Saves at least min_images images per cluster, evenly spaced for variety.
    """
    os.makedirs(output_dir, exist_ok=True)
    cluster_results = []

    for serial, cluster_id in enumerate(sorted(unique_labels), start=1):
        folder_name = f"cluster_{serial:03d}"
        cluster_folder = os.path.join(output_dir, folder_name)
        os.makedirs(cluster_folder, exist_ok=True)

        indices = np.where(labels == cluster_id)[0]

        # Pick evenly spaced indices to get variety across the full cluster
        total = len(indices)
        if total <= min_images:
            chosen = list(indices)
        else:
            # Space them evenly, always include first and last
            step = total / min_images
            chosen = [indices[int(i * step)] for i in range(min_images)]

        saved = 0
        for idx in chosen:
            face_img = all_face_images[idx]
            if face_img.size > 0:
                img_path = os.path.join(
                    cluster_folder,
                    f"t{all_timestamps[idx]}s_frame{idx}.jpg"
                )
                cv2.imwrite(img_path, face_img)
                saved += 1

        cluster_results.append({
            "cluster_id":      int(cluster_id),
            "serial":          serial,
            "folder_name":     folder_name,
            "detection_count": total,
            "saved_images":    saved,
            "first_seen_sec":  round(float(all_timestamps[indices[0]]), 1),
            "roll_no":         None,
            "assigned_name":   None,
        })
        print(f"[Clustering] cluster_{serial:03d}: {total} detections, {saved} images saved")

    return cluster_results


def process_video_cluster_only(
    video_path, face_app,
    frame_skip=10,
    cluster_threshold=0.45,
    min_samples=2,
    min_images_per_cluster=5,
    output_base_dir="./clustering_output"
):
    """
    Cluster faces in a video and save to serial-numbered folders.
    Does NOT require an embeddings DB — roll numbers assigned later.
    """
    start = time.time()

    all_embeddings, all_face_images, all_timestamps, all_quality_scores = extract_all_faces(
        video_path, face_app, frame_skip
    )

    if not all_embeddings:
        return {"error": "No faces detected in video"}

    labels, unique_labels = cluster_faces(all_embeddings, cluster_threshold, min_samples)

    video_name = os.path.splitext(os.path.basename(video_path))[0]
    output_dir = os.path.join(output_base_dir, video_name)

    cluster_results = save_clusters_serial(
        labels, unique_labels,
        all_face_images, all_timestamps,
        output_dir,
        min_images=min_images_per_cluster
    )

    elapsed = time.time() - start

    metadata = {
        "video":      video_path,
        "output_dir": output_dir,
        "clusters":   cluster_results,
        "summary": {
            "total_faces_extracted": len(all_embeddings),
            "unique_clusters_found": len(unique_labels),
            "processing_time":       round(elapsed, 2)
        }
    }

    metadata_path = os.path.join(output_dir, "cluster_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[Clustering] Done in {elapsed:.1f}s — {len(unique_labels)} clusters → {output_dir}")
    return metadata


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

        # save at least 5 face images, evenly spaced for variety
        MIN_IMAGES = 5
        total_in_cluster = len(indices)
        if total_in_cluster <= MIN_IMAGES:
            chosen = list(indices)
        else:
            step = total_in_cluster / MIN_IMAGES
            chosen = [indices[int(i * step)] for i in range(MIN_IMAGES)]

        saved = 0
        for idx in chosen:
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
    all_embeddings, all_face_images, all_timestamps, _ = extract_all_faces(
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