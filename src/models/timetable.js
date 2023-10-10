const mongoose = require("mongoose");

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
});

const TimeTable = mongoose.model("TimeTable", tableSchema);

module.exports = TimeTable;

