const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const announcementSchema = new mongoose.Schema({
  confId: String, // No longer required
  title: String, // No longer required
  metaDescription: String,
  description: String, // No longer required
  feature: Boolean, // No longer required
  sequence: Number, // No longer required
  new: Boolean, // No longer required
  hidden: Boolean, // No longer required
  link: String,
});

// Create the Mongoose model
const Announcement = mongoose.model("Announcement", announcementSchema);

module.exports = Announcement;
