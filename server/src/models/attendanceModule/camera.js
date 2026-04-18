const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require("../commonFields.js");

const cameraSchema = new mongoose.Schema(
  {
    cameraId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    roomId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    building: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
      required: true,
      enum: ["front-left", "front-right"],
    },

    pairedWith: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    streamUrl: {
      type: String,
      required: true,
      trim: true,
    },

    protocol: {
      type: String,
      required: true,
      enum: ["rtsp", "http_mjpeg", "onvif"],
    },

    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },

    port: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
    },

    resolution: {
      width: { type: Number, default: 1920, min: 1 },
      height: { type: Number, default: 1080, min: 1 },
    },

    fps: {
      type: Number,
      default: 25,
      min: 1,
      max: 120,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastHeartbeat: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["online", "offline", "maintenance"],
      default: "offline",
    },
  },
  {
    collection: "cameras",
  },
);

cameraSchema.add(commonFields);
cameraSchema.pre("save", updateTimestamps);

cameraSchema.index({ cameraId: 1 }, { unique: true });
cameraSchema.index({ roomId: 1 });
cameraSchema.index({ roomId: 1, position: 1 }, { unique: true });

const Camera = mongoose.model("Camera", cameraSchema);
module.exports = Camera;
