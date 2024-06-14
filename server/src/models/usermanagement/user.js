const Mongoose = require("mongoose");
require('../commonFields');
const UserSchema = new Mongoose.Schema({
  name: {
    type: String,
  },
  role: {
    type: [String],
    required: true,
  },
  password: {
    type: String,
    required: true,
  }, 
  profession: {type: String},
  email: [{
    type: String,
    required: true,
  }],
  area:[{type: String}],
});
const User = Mongoose.model("user", UserSchema);
module.exports = User;