# models.py
# All Pydantic request/response models used across the ML service.

import os
from pydantic import BaseModel
from typing import List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH  = os.path.join(BASE_DIR, "embeddings_db.pkl")
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ground_truth")


class VideoRequest(BaseModel):
    videoPath: str
    threshold: float = 0.45
    frame_skip: int = 3


class CompareRequest(BaseModel):
    videoPath: str
    threshold: float = 0.45
    frame_skip: int = 3
    roll_list: List[str] = []
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    min_detections: int = 3
    batch_name: str = ""
    auto_enroll: bool = False
    auto_enroll_threshold: float = 0.60
    max_gt_images: int = 10


class BuildEmbeddingsRequest(BaseModel):
    photos_dir: str = CLIENT_GROUND_TRUTH
    output_path: str = DB_PATH
    roll_nos: List[str] = [] 

    use_cached_embeddings: bool = True  # NEW: skip re-processing if embedding already exists


class ExtractFacesRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_face_size: int = 15


class ExtractSaveGTRequest(BaseModel):
    videoPath: str
    batchName: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_images: int = 10
    det_size: int = 640
    match_threshold: float = 0.55
    min_face_size: int = 15
    laplacian_threshold: float = 30.0
    top_n: int = 10


class SetDetSizeRequest(BaseModel):
    det_size: int = 640


class ClusterStreamRequest(BaseModel):
    videoPath: str
    frame_skip: int = 10
    cluster_threshold: float = 0.45
    min_samples: int = 2
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []


class ClusterRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    auto_present_threshold: float = 0.60
    review_threshold: float = 0.40
    output_dir: str = "./clustering_output"
    roll_list: List[str] = []


class ClusterOnlyRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_images_per_cluster: int = 5
    output_dir: str = "./clustering_output"


class UpdateEmbeddingRequest(BaseModel):
    batch_name: str
    roll_no: str
    embedding_files: List[str]


class AssignRollNoRequest(BaseModel):
    output_dir: str
    cluster_folder: str
    roll_no: str
    name: str = ""


class MatchClustersRequest(BaseModel):
    batch_dir: str
    erp_photos_dir: str
    top_k: int = 3


class TestPipelineRequest(BaseModel):
    video_path: str
    ground_truth_file: str = ""
    threshold: float = 0.45
    frame_skip: int = 3
