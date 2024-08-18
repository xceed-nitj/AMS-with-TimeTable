const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const committeeSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
  },
  description: {
    type: String,
  },
  sequence: {
    type: Number,
  },
  feature: {
    type: Boolean,
  },
});

// Create the Mongoose model
const Committee = mongoose.model("cf-committee", committeeSchema);

module.exports = Committee;
