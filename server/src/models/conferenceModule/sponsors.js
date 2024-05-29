const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const sponsorsSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  type: {
    type: String,
  },
  logo: {
    type: String,
  },
  sequence: {
    type: Number,
  },
  featured: {
    type: Boolean,
  },
});

// Create the Mongoose model
const Sponsors = mongoose.model("cf-sponsor", sponsorsSchema);

module.exports = Sponsors;
