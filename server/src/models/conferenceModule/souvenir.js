const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const souvenirSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  price: {
    type: Number,
  },
  description:{
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
const Souvenir = mongoose.model("cf-souvenir", souvenirSchema);

module.exports = Souvenir;
