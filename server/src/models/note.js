const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');


const noteSchema = new mongoose.Schema({
  sem: {
    type: String,
    required: true,
  },
  faculty:{
    type:String,
    required:true,
  },
  room: {
    type: String,
    required:true,
  },
  code: {
    type: String,
    required:true,
  }, 
});


noteSchema.add(commonFields);

noteSchema.pre('save', updateTimestamps);

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
