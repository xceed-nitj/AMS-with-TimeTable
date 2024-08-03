const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require('./commonFields');


const mastersemSchema = new mongoose.Schema({
  sem: {
    type: String,
    required: true,
  },
  type:{
    type:String,
    required:true,
  },
  dept: {
    type: String,
    required:true,
  },
  degree: {
    type: String,
    required:true,
  }, 
  year: {
    type: String
  }, 
});


// mastersemSchema.add(commonFields);

// mastersemSchema.pre('save', updateTimestamps);

const MasterSem = mongoose.model("MasterSem", mastersemSchema);

module.exports = MasterSem;
