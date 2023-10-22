const mongoose = require("mongoose");

// Define your Mongoose schema based on the interface
const masterroomSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
  },
  building: {
    type: String,
    required: true,
  },
  floor: {
    type: String,
  },
  dept: {
    type: String,
  },
  landMark: {
    type: String,
  }, 
  imageUrl: {
    type: String,
  }, 
});

// Create the Mongoose model
const MasterRoom = mongoose.model("MasterRoom", masterroomSchema);

module.exports = MasterRoom;
