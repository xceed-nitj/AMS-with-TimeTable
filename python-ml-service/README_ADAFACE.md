# AdaFace — optional second face-recognition model

AdaFace is an independent, optional face embedding model that runs alongside InsightFace
(ArcFace/buffalo_l). It never touches InsightFace's own code path — it reuses InsightFace's face
*detection* and 5-point landmarks (`kps`) to align a crop, then runs that aligned crop through a
separate AdaFace ONNX model to get a second, differently-shaped embedding vector.

## Enabling it

1. Obtain (or export) an AdaFace ONNX model. AdaFace's official repo ships PyTorch checkpoints
   (`.ckpt`); convert one to ONNX with `torch.onnx.export` — input `(1, 3, 112, 112)`, output a single
   512-d embedding tensor.
2. Place the file at `python-ml-service/models/adaface.onnx`, or point `ADAFACE_MODEL_PATH` at any
   other path.
3. Restart the ML service. Startup logs will show either:
   - `[AdaFace] Loaded ONNX embedding model from ...` — enabled.
   - `[AdaFace] No ONNX model found at ... — AdaFace features disabled` — everything AdaFace-related
     silently no-ops (no error), and every existing InsightFace-only flow is completely unaffected.
4. Turn the feature on from the ML Fine Tuning page ("AdaFace Recognition" card) — the model can be
   loaded but still gated off by `state.adaface_config["enabled"]` (default `False`), so loading a
   model file alone doesn't change any existing behavior until you flip the toggle.

## Preprocessing assumption

`adaface_utils.get_adaface_embedding()` assumes the ONNX model was exported expecting:

- 112×112 RGB input, aligned via standard 5-point ArcFace alignment (which is what
  `align_for_adaface()` produces via `insightface.utils.face_align.norm_crop`).
- Pixel normalization `(pixel/255 − 0.5) / 0.5` → range `[-1, 1]`.
- NCHW float32 tensor layout, batch size 1.

If your specific ONNX export used different preprocessing (e.g. plain `[0,1]` scaling, or BGR instead
of RGB), adjust the few lines in `get_adaface_embedding()` accordingly — the rest of the pipeline
(alignment, storage, comparison) does not need to change.

## What "enabled" affects

- Ground-truth acquisition and every "update embedding" flow (approve photos, re-pick embedding
  photos, delete photo) additionally computes and stores an AdaFace mean + top-3 embedding per
  student, alongside (never replacing) InsightFace's.
- Subject/batch embedding generation additionally writes a parallel `.pkl` under
  `server/ml-data/embeddings_adaface/...`.
- The Hungarian batch-matching pipeline (RTSP attendance runs) can additionally run an AdaFace
  "shadow comparison" — diagnostic only, never affecting the actual attendance decision — on the one
  run nearest the middle of a scheduled period, when both this toggle and the request flag are on.
