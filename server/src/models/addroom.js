const mongoose = require("mongoose");

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

const addRoom = mongoose.model("addRoom", addRoomSchema);

module.exports = addRoom;
