from deep_sort_realtime.deepsort_tracker import DeepSort
import numpy as np

tracker = DeepSort(max_age=30, nn_budget=100, embedder=None)

# create dummy detection
ds_input = [([10, 10, 50, 50], 0.9, "person")]
# Create a dummy embedding of 512 floats (like insightface)
embeds = [np.random.rand(512).tolist()]

try:
    tracks = tracker.update_tracks(ds_input, embeds=embeds, frame=None)
    print("Success, tracks:", tracks)
except Exception as e:
    import traceback
    traceback.print_exc()

