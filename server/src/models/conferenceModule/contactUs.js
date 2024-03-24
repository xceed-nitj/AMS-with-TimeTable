const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const contactUsSchema = new mongoose.Schema({
  
  confId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  name: {
    type: String,
  },
  designation: {
    type: String,
  },
  imgLink: String,
  institute: {
    type: String,
  },
  profileLink: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  fax: String,
  feature: {
    type: Boolean,
  },
  sequence: {
    type: Number,
  }}, { timestamps: true }
  
);

// Create the Mongoose model
const ContactUs = mongoose.model("cf-contactUs", contactUsSchema);

module.exports = ContactUs;
