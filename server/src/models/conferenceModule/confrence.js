const mongoose = require("mongoose");

const conferenceSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: { type: String, unique: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Conference = mongoose.model("Conference", conferenceSchema);

module.exports = Conference;
