const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const sponsorsRatesSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  price: {
    type: Numbers,
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
const SponsorshipRates = mongoose.model("cf-sponsorshipRates", sponsorsRatesSchema);

module.exports = SponsorshipRates;
