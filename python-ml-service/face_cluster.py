import os
import glob
import cv2
import pickle
import uuid
import json
import argparse
import numpy as np
from insightface.app import FaceAnalysis
from sklearn.cluster import DBSCAN
from scipy.optimize import linear_sum_assignment
import clustering_service

parser = argparse.ArgumentParser(description="Cluster faces from attendance session")
parser.add_argument("--session_id", required=True, help="Session ID for frames")
parser.add_argument("--output_dir", required=True, help="Output directory for faces")
parser.add_argument("--db_path", required=True, help="Path to embeddings database")
parser.add_argument("--cluster_threshold", type=float, default=0.45, help="DBSCAN cluster threshold")
parser.add_argument("--min_samples", type=int, default=3, help="DBSCAN min samples")
parser.add_argument("--auto_threshold", type=float, default=0.40, help="Auto present threshold")
parser.add_argument("--review_threshold", type=float, default=0.35, help="Review threshold")
args = parser.parse_args()

SESSION_ID = args.session_id
BASE_SESSION_DIR = f"../server/ml-data/frame_snapshots/{SESSION_ID}"
OUTPUT_BASE_DIR = args.output_dir
DB_PATH = args.db_path

# Thresholds from live pipeline
CLUSTER_THRESHOLD = 0.45
MIN_SAMPLES = 3
AUTO_THRESHOLD = 0.40
REVIEW_THRESHOLD = 0.35

def _cluster(embeddings, eps=0.45, min_samples=3):
    arr = np.array(embeddings, dtype=np.float32)
    euclidean_eps = float(np.sqrt(2.0 * (1.0 - eps)))
    clustering = DBSCAN(eps=euclidean_eps, min_samples=min_samples, metric="euclidean", n_jobs=-1)
    clustering.fit(arr)
    labels = clustering.labels_
    unique = set(labels)
    if -1 in unique:
        unique.remove(-1)
    return labels, unique

def main():
    print("Loading InsightFace buffalo_s det_size=640x640 (CPU)...")
    app = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(640, 640))

    if not os.path.exists(DB_PATH):
        print(f"ERROR: Embeddings database {DB_PATH} not found!")
        return

    print("Loading embeddings database...")
    with open(DB_PATH, "rb") as f:
        db = pickle.load(f)

    enrolled_ids = list(db.keys())
    enroll_matrix = np.array([db[uid]["embedding"] for uid in enrolled_ids], dtype=np.float32)

    frame_paths = sorted(glob.glob(os.path.join(BASE_SESSION_DIR, "*.jpg")))
    # Filter out crops in accepted/ if any are there by accident, only take frame_*
    frame_paths = [p for p in frame_paths if "frame_" in os.path.basename(p)]
    
    if not frame_paths:
        print(f"No original frames found in {BASE_SESSION_DIR}")
        return
        
    print(f"Processing {len(frame_paths)} original full frames...")
    
    all_embeddings = []
    all_crops = []
    all_qualities = []
    
    for frame_path in frame_paths:
        frame = cv2.imread(frame_path)
        if frame is None: continue
            
        ui_mask = clustering_service._build_ui_mask(frame.shape[0], frame.shape[1])
        detections = clustering_service._detect_faces_tiled(app, frame, ui_mask=ui_mask)
        
        for d in detections:
            emb = d["embedding"]
            norm = np.linalg.norm(emb)
            if norm > 0: emb = emb / norm
            all_embeddings.append(emb)
            all_crops.append(d["crop"])
            all_qualities.append(d["quality"])

    if not all_embeddings:
        print("No faces detected in any frames.")
        return

    print(f"Extracted {len(all_embeddings)} total face detections. Clustering...")
    labels, unique_labels = _cluster(all_embeddings, CLUSTER_THRESHOLD, MIN_SAMPLES)
    
    cluster_means = []
    cluster_meta = []
    
    for cluster_id in unique_labels:
        indices = np.where(labels == cluster_id)[0]
        cluster_embs = np.array([all_embeddings[i] for i in indices], dtype=np.float32)
        cluster_mean = cluster_embs.mean(axis=0)
        norm = np.linalg.norm(cluster_mean)
        if norm > 0: cluster_mean /= norm
        cluster_means.append(cluster_mean)
        cluster_meta.append((cluster_id, indices))

    print(f"Formed {len(unique_labels)} valid clusters. Matching to database...")
    
    import shutil
    if os.path.exists(OUTPUT_BASE_DIR):
        shutil.rmtree(OUTPUT_BASE_DIR)
    os.makedirs(OUTPUT_BASE_DIR, exist_ok=True)

    assigned_cluster_rows = set()
    
    if cluster_means and len(enroll_matrix) > 0:
        score_matrix = np.array(cluster_means, dtype=np.float32) @ enroll_matrix.T
        row_ind, col_ind = linear_sum_assignment(-score_matrix)
        
        for r, c in zip(row_ind, col_ind):
            score = float(score_matrix[r, c])
            roll_no = enrolled_ids[c]
            cluster_id, indices = cluster_meta[r]
            
            print(f"Cluster {cluster_id} matched to {roll_no} with score {score:.4f}")
            
                
            assigned_cluster_rows.add(r)
            
            # Save this cluster
            cluster_hash = str(uuid.uuid4())[:8]
            cluster_dir = os.path.join(OUTPUT_BASE_DIR, f"cluster_{roll_no}_{cluster_hash}")
            os.makedirs(cluster_dir, exist_ok=True)
            
            # Sort by quality
            cluster_items = sorted(
                [(all_crops[i], all_qualities[i]) for i in indices],
                key=lambda x: x[1], reverse=True
            )
            
            for i, (crop, q) in enumerate(cluster_items):
                out_path = os.path.join(cluster_dir, f"image_{i+1:03d}.jpg")
                cv2.imwrite(out_path, crop)
                
            meta = {
                "rollNo": roll_no,
                "confidence": round(score, 4),
                "confidenceScores": [round(score, 4)] * len(cluster_items),
                "imageCount": len(cluster_items),
                "sourceSession": SESSION_ID,
                "type": "known",
                "clusterId": f"cluster_{roll_no}_{cluster_hash}"
            }
            with open(os.path.join(cluster_dir, "metadata.json"), "w") as f:
                json.dump(meta, f, indent=2)

    # Unknowns
    unknown_indices = []
    # Add unassigned clusters
    for r, (cluster_id, indices) in enumerate(cluster_meta):
        if r not in assigned_cluster_rows:
            unknown_indices.extend(indices)
    # Add noise points (-1)
    noise_indices = np.where(labels == -1)[0]
    unknown_indices.extend(noise_indices)
    
    if unknown_indices:
        cluster_hash = str(uuid.uuid4())[:8]
        cluster_dir = os.path.join(OUTPUT_BASE_DIR, f"cluster_unknown_{cluster_hash}")
        os.makedirs(cluster_dir, exist_ok=True)
        
        items = sorted(
            [(all_crops[i], all_qualities[i]) for i in unknown_indices],
            key=lambda x: x[1], reverse=True
        )
        for i, (crop, q) in enumerate(items):
            out_path = os.path.join(cluster_dir, f"image_{i+1:03d}.jpg")
            cv2.imwrite(out_path, crop)
            
        meta = {
            "rollNo": "unknown",
            "confidence": 0.0,
            "confidenceScores": [0.0] * len(items),
            "imageCount": len(items),
            "sourceSession": SESSION_ID,
            "type": "unknown",
            "clusterId": f"cluster_unknown_{cluster_hash}"
        }
        with open(os.path.join(cluster_dir, "metadata.json"), "w") as f:
            json.dump(meta, f, indent=2)

    print(f"Done! Restored {len(assigned_cluster_rows)} known student clusters.")

if __name__ == "__main__":
    main()
