const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const sponsorsSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  featured: {
    type: Boolean,
    required: true,
  },
});

// Create the Mongoose model
const Sponsors = mongoose.model("cf-sponsor", sponsorsSchema);

module.exports = Sponsors;
