const mongoose = require('mongoose');

// Define the Contributor schema
const contributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  linkedin: { type: String, required: true },
  image: { type: String }, // Path to the image
});

// Define the Module schema
const moduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  yearLaunched: { type: Number, required: true },
  contributors: [contributorSchema], // Embedded contributor details
});

const Module = mongoose.model('Module', moduleSchema);
module.exports = Module;
