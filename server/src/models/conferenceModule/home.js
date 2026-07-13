const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  confId: {
    type: String,
    required: true,
  },
  confName: {
    type: String,
    required: true,
  },
  confStartDate: {
    type: Date,
  },
  confEndDate: {
    type: Date,
  },
  about: [
    {
      title: {
        type: String,
      },
      description: {
        type: String,
      },
    },
  ],
});

// Create the Mongoose model
const Home = mongoose.model("cf-home", homeSchema);

module.exports = Home;
