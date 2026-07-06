# models.py
# All Pydantic request/response models used across the ML service.

import os
from pydantic import BaseModel
from typing import List, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH  = os.path.join(ROOT_DIR, "server", "ml-data", "embeddings_db.pkl")
CLIENT_GROUND_TRUTH = os.path.join(ROOT_DIR, "server", "ml-data", "ground_truth")


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


# A single ground-truth photo shipped as bytes (base64) rather than a path —
# the ML service may run on a machine with no access to server/ml-data/.
class PhotoBytes(BaseModel):
    filename: str
    data: str  # base64-encoded JPEG/PNG bytes


# One student's input for a batch/subject embedding build. If
# cached_mean_embedding is supplied (Node already has it cached in this
# student's _info.json), Python skips face detection entirely for them —
# photos only need to be sent when there's no cache yet.
class StudentEmbeddingInput(BaseModel):
    roll_no: str
    name: str = ""
    cached_mean_embedding: Optional[List[float]] = None
    num_photos_cached: int = 0
    photos: List[PhotoBytes] = []
    # Same idea, for AdaFace's independent embedding (see adaface_utils.py) —
    # Node's cached info.adaface_mean_embedding, if any. None when no AdaFace
    # model has ever been run for this student (or no ONNX model is loaded).
    cached_adaface_mean_embedding: Optional[List[float]] = None


class BuildEmbeddingsRequest(BaseModel):
    students: List[StudentEmbeddingInput] = []


class ExtractFacesRequest(BaseModel):
    videoPath: str
    frame_skip: int = 3
    cluster_threshold: float = 0.45
    min_samples: int = 3
    min_face_size: int = 15



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
    roll_no: str
    photos: List[PhotoBytes]


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

class RTSPTrackedAttendanceRequest(BaseModel):
    rtspUrl:          str
    frameSkip:        int   = 5
    durationSec:      int   = 0      # 0 = no auto-stop; caller hits /stop-rtsp-stream
    # None = fall back to the global state.faiss_config["recog_threshold"]
    # (ML Fine Tuning page); an explicit value here overrides it per-request.
    recogThreshold:   Optional[float] = None
    iouMin:           float = 0.30
    driftThresholdPx: float = 40.0
    trackExpirySec:   float = 30.0
    # Roster for this specific session — used only to flag in_roster:true/false
    # on "marked" events. Recognition itself always searches the FULL FAISS
    # index (all departments), matching tracked_routes.py's existing docstring.
    enrolledRollNos:  List[str] = []