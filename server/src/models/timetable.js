const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define your Mongoose schema based on the interface
const tableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dept: {
    type: String,
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  code: {
    type: String,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

const TimeTable = mongoose.model("TimeTable", tableSchema);

module.exports = TimeTable;

