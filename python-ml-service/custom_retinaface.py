import cv2
import numpy as np
import onnxruntime as ort
from itertools import product
from math import ceil

class CustomRetinaFace:
    def __init__(self, model_file, session_options=None, providers=['CPUExecutionProvider']):
        self.model_file = model_file
        self.session = ort.InferenceSession(self.model_file, sess_options=session_options, providers=providers)
        self.variance = [0.1, 0.2]
        self.det_thresh = 0.5
        self.nms_thresh = 0.4
        
        # Determine input shape requirements
        inputs = self.session.get_inputs()[0]
        self.input_name = inputs.name

    def generate_prior_boxes(self, image_size):
        min_sizes = [[16, 32], [64, 128], [256, 512]]
        steps = [8, 16, 32]
        feature_maps = [[ceil(image_size[0]/step), ceil(image_size[1]/step)] for step in steps]
        anchors = []
        for k, f in enumerate(feature_maps):
            min_sizes_step = min_sizes[k]
            for i, j in product(range(f[0]), range(f[1])):
                for min_size in min_sizes_step:
                    s_kx = min_size / image_size[1]
                    s_ky = min_size / image_size[0]
                    dense_cx = [x * steps[k] / image_size[1] for x in [j + 0.5]]
                    dense_cy = [y * steps[k] / image_size[0] for y in [i + 0.5]]
                    for cy, cx in product(dense_cy, dense_cx):
                        anchors += [cx, cy, s_kx, s_ky]
        return np.array(anchors, dtype=np.float32).reshape(-1, 4)

    def decode(self, loc, priors, variances):
        boxes = np.concatenate((
            priors[:, :2] + loc[:, :2] * variances[0] * priors[:, 2:],
            priors[:, 2:] * np.exp(loc[:, 2:] * variances[1])), 1)
        boxes[:, :2] -= boxes[:, 2:] / 2
        boxes[:, 2:] += boxes[:, :2]
        return boxes

    def decode_landm(self, pre, priors, variances):
        landms = np.concatenate((
            priors[:, :2] + pre[:, :2] * variances[0] * priors[:, 2:],
            priors[:, :2] + pre[:, 2:4] * variances[0] * priors[:, 2:],
            priors[:, :2] + pre[:, 4:6] * variances[0] * priors[:, 2:],
            priors[:, :2] + pre[:, 6:8] * variances[0] * priors[:, 2:],
            priors[:, :2] + pre[:, 8:10] * variances[0] * priors[:, 2:],
        ), 1)
        return landms

    def nms(self, dets, thresh):
        x1 = dets[:, 0]
        y1 = dets[:, 1]
        x2 = dets[:, 2]
        y2 = dets[:, 3]
        scores = dets[:, 4]

        areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        order = scores.argsort()[::-1]

        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])

            w = np.maximum(0.0, xx2 - xx1 + 1)
            h = np.maximum(0.0, yy2 - yy1 + 1)
            inter = w * h
            ovr = inter / (areas[i] + areas[order[1:]] - inter)

            inds = np.where(ovr <= thresh)[0]
            order = order[inds + 1]

        return keep

    def detect(self, img, max_num=0, metric='default'):
        img_h, img_w, _ = img.shape
        
        # Preprocess
        img_rgb = img.copy()
        img_rgb = np.float32(img_rgb)
        img_rgb -= (104, 117, 123)
        img_rgb = img_rgb.transpose(2, 0, 1)
        img_rgb = np.expand_dims(img_rgb, 0)
        
        out = self.session.run(None, {self.input_name: img_rgb})
        
        loc, conf, landms = out[0][0], out[1][0], out[2][0]
        
        priorbox = self.generate_prior_boxes((img_h, img_w))
        
        boxes = self.decode(loc, priorbox, self.variance)
        boxes = boxes * np.array([img_w, img_h, img_w, img_h])
        
        scores = conf[:, 1]
        
        landms = self.decode_landm(landms, priorbox, self.variance)
        landms = landms * np.array([img_w, img_h, img_w, img_h, img_w, img_h, img_w, img_h, img_w, img_h])
        
        inds = np.where(scores > self.det_thresh)[0]
        boxes = boxes[inds]
        landms = landms[inds]
        scores = scores[inds]
        
        order = scores.argsort()[::-1]
        boxes = boxes[order]
        landms = landms[order]
        scores = scores[order]
        
        dets = np.hstack((boxes, scores[:, np.newaxis])).astype(np.float32, copy=False)
        keep = self.nms(dets, self.nms_thresh)
        dets = dets[keep, :]
        landms = landms[keep]
        
        if max_num > 0 and dets.shape[0] > max_num:
            dets = dets[:max_num, :]
            landms = landms[:max_num, :]
            
        # Transform landmarks to [N, 5, 2]
        kpss = landms.reshape(-1, 5, 2)
        
        return dets, kpss
        
    def prepare(self, ctx_id=0, nms=0.4):
        self.nms_thresh = nms
