// Builds a minimal express app mounting the attendance router at the same
// prefixes production uses (src/routes.js + src/index.js). Deliberately not
// requiring src/index.js: it couples app construction to mongoose.connect,
// app.listen and scheduler startup.
//
// Call buildTestApp() inside beforeAll so the router (and everything it
// requires) loads AFTER the suite's jest.mock calls are registered.
const express = require("express");
const cookieParser = require("cookie-parser");

function buildTestApp() {
  const app = express();
  // `verify` mirrors src/index.js — needed so req.rawBody is available for
  // the inbound ERP HMAC check (erpInboundSecurity.js's verifyErpSignature).
  app.use(express.json({
    limit: "50mb",
    verify: (req, res, buf) => { req.rawBody = buf; },
  }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  const attendanceRouter = require("../../src/modules/attendanceModule/routes/index");
  app.use("/attendancemodule", attendanceRouter);
  app.use("/api/v1/attendancemodule", attendanceRouter);
  return app;
}

module.exports = { buildTestApp };
