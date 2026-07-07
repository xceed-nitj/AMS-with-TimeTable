# RetinaFace — Optional Comparison Detector

The ML service's default face detector is **SCRFD-10G** — it is the detector built into
InsightFace's `buffalo_l` model pack (`det_10g.onnx`), loaded by `load_model()` in
`ml_service.py`. There is no RetinaFace anywhere in the default pipeline.

To compare detection quality against RetinaFace, you can drop in a RetinaFace ONNX and switch
between the two at runtime from the **Face Detector** card on the ML Fine Tuning page.

## Enabling

1. Get an **insightface `model_zoo`-compatible RetinaFace ONNX** (e.g. an export of
   `retinaface_r50_v1` / `retinaface_mnet025_v2`). The file must be loadable via
   `insightface.model_zoo.get_model(path)` and expose a `.detect()` returning bounding boxes +
   5-point landmarks — that landmark contract is what keeps the embedding side untouched.
2. Place it at `python-ml-service/models/retinaface.onnx`, or point the `RETINAFACE_MODEL_PATH`
   env var at it.
3. Restart the ML service (the **Restart ML Service** button on ML Fine Tuning works). Startup
   logs show either `[Detector] Loaded RetinaFace from ...` or that it's missing.
4. Select **RetinaFace** on the Face Detector card. The switch applies to the next detection —
   attendance runs, ground-truth acquisition, live tracking, everything that calls
   `state.face_app.get(...)`.

## Behavior notes

- **Graceful absence** (same pattern as `models/liveness.onnx` and `models/adaface.onnx`): no
  file → SCRFD-10G remains the only detector, the RetinaFace option shows as unavailable in the
  UI, and selecting it via the API returns 400.
- The choice persists across restarts (`ml-data/detector_config.json` on the ML machine).
- Changing **Detection grid size** on ML Fine Tuning reloads the model pack; the service
  automatically re-applies your detector choice afterward.
- Detection-only swap: ArcFace/AdaFace embeddings, clustering, FAISS, and all thresholds are
  unaffected. If recall differs between detectors you'll see it as more/fewer detected faces,
  not as different embeddings for the same face.
