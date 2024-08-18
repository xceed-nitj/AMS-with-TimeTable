const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { commonFields, updateTimestamps } = require('./commonFields');

// Define your Mongoose schema based on the interface
const MasterclassTableSchema = new Schema({
  day: {
    type: String,
    required: true,
  },
  slot: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
  },
  subjectCode: {
    type: String,
  },
  subjectFullName: {
        type: String,
      },
  subjectType: {
        type: String,
      },
      subjectCredit: {
        type: String,
      },
  faculty: {
        type: String,
      },
subjectDept:
{
    type: String,
  },
  offeringDept:
{
    type: String,
  },
  year:
  {
      type: String,
    },
    degree:
    {
        type: String,
      },
      room: {
        type: String,
      },
      building: {
        type: String,
      },
  sem: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  session: {
    type: String,
    // required: true,
  },
  mergedClass: {
    type: Boolean,
    default:false,
  },
});

MasterclassTableSchema.add(commonFields);

// Apply the pre-save middleware
MasterclassTableSchema.pre('save', updateTimestamps);
// Create the Mongoose model
const ClassTable = mongoose.model("MasterClassTable", MasterclassTableSchema);

module.exports = ClassTable;
