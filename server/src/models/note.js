const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');


const noteSchema = new mongoose.Schema({
  sem: {
    type: String,
  },
  faculty:{
    type:String,
  },
  room: {
    type: String,
  },
  note: {
    type: Array,
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
