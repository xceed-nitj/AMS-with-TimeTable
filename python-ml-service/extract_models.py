import os
import zipfile
import subprocess
import sys

def extract_models_if_missing():
    # Define the models and their zip files
    models_to_extract = {
        "models/retinaface.zip": "models/retinaface.onnx",
        "models/adaface.zip": "models/adaface.onnx"
    }

    # Auto-extract logic for local zip files (if they exist)
    for zip_path, onnx_path in models_to_extract.items():
        # If the ONNX model is missing but the ZIP exists, extract it
        if not os.path.exists(onnx_path) and os.path.exists(zip_path):
            print(f"[{zip_path}] Found zipped model. Extracting...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall("models/")
            print(f"[{zip_path}] Extracted successfully!")

    # Check if any required ONNX models are missing
    expected_onnx_files = [
        "models/retinaface.onnx",
        "models/adaface.onnx",
        "models/adaface.onnx.data",
        "models/liveness.onnx",
        "models/liveness.onnx.data"
    ]
    
    missing_models = [onnx_path for onnx_path in expected_onnx_files if not os.path.exists(onnx_path)]
    
    if missing_models:
        print(f"Missing models: {missing_models}. Attempting to download from Google Drive...")
        
        # Ensure gdown is installed
        try:
            import gdown
        except ImportError:
            print("gdown not found. Installing gdown...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
            import gdown

        # Google Drive folder link provided by Hari Sir
        gdrive_folder_url = 'https://drive.google.com/drive/folders/16el2JAaYgTtM2_LeJxMM52LiwjLtbzqs'
        
        # Ensure models directory exists
        os.makedirs("models/", exist_ok=True)
        
        # Download the folder contents to the models directory
        print("Downloading ONNX models from Google Drive...")
        gdown.download_folder(url=gdrive_folder_url, output='models/', quiet=False, use_cookies=False)
        print("Download complete!")

if __name__ == "__main__":
    extract_models_if_missing()
