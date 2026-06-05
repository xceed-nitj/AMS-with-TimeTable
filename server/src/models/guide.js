const mongoose = require("mongoose");

const tabSchema = new mongoose.Schema({
  id:      { type: String, required: true },
  title:   { type: String, required: true },
  content: { type: String, required: true },
  order:   { type: Number, default: 0 },
}, { _id: false });

const guideSchema = new mongoose.Schema({
  tabs:         { type: [tabSchema], required: true },
  updatedAt:    { type: Date, default: Date.now },
  schemaVersion: { type: Number, default: 2 },
});

const Guide = mongoose.model("Guide", guideSchema);

module.exports = Guide;
