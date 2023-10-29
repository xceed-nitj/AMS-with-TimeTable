const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');

const addRoomSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  }, 
});

addRoomSchema.add(commonFields);

// Apply the pre-save middleware
addRoomSchema.pre('save', updateTimestamps);


const addRoom = mongoose.model("addRoom", addRoomSchema);

module.exports = addRoom;
