// Signs a JWT matching what checkRole.middleware.js expects: cookie named
// "jwt", payload { id, role } where role is an ARRAY of role strings.
// Default "iams-admin" short-circuits resolveAttendanceAccess (full access,
// no User lookup). For dept-admin flows pass ["iams-dept-admin"] and the id
// of a seeded User doc that has a dept.
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function authCookie(roles = ["iams-admin"], id = new mongoose.Types.ObjectId().toString()) {
  const token = jwt.sign({ id, role: roles }, process.env.JWT_SECRET);
  return [`jwt=${token}`];
}

module.exports = { authCookie };
