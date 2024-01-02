const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const contactUsSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  confId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  imgLink: String,
  institute: {
    type: String,
    required: true,
  },
  profileLink: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  fax: String,
  feature: {
    type: Boolean,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

// Create the Mongoose model
const ContactUs = mongoose.model("ContactUs", contactUsSchema);

module.exports = ContactUs;
