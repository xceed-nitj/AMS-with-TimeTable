const Mongoose = require("mongoose");
require('../commonFields');
const UserSchema = new Mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: [String],
    default: ["DTTI"],
    required: true,
  },
});
const User = Mongoose.model("user", UserSchema);
module.exports = User;