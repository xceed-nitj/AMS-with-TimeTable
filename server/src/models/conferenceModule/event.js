const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const eventsSchema = new mongoose.Schema({
  
  confId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  
  description: {
    type: String,
  },
  
  feature: {
    type: Boolean,
  },
  sequence: {
    type: Number,
  }
}
  
);

// Create the Mongoose model
const Events = mongoose.model("cf-events", eventsSchema);

module.exports = Events;
