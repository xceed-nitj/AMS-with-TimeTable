import os
import zipfile

def extract_models_if_missing():
    # Define the models and their zip files
    models_to_extract = {
        "models/retinaface.zip": "models/retinaface.onnx",
        "models/adaface.zip": "models/adaface.onnx"
    }

    # Auto-extract logic
    for zip_path, onnx_path in models_to_extract.items():
        # If the ONNX model is missing but the ZIP exists, extract it
        if not os.path.exists(onnx_path) and os.path.exists(zip_path):
            print(f"[{zip_path}] Found zipped model. Extracting...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall("models/")
            print(f"[{zip_path}] Extracted successfully!")

if __name__ == "__main__":
    extract_models_if_missing()
