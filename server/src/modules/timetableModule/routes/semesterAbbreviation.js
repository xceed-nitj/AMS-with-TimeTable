const express = require("express");
const semesterRouter = express.Router();
const SemesterAbbreviationController = require("../controllers/semesterAbbreviation");
const semesterController = new SemesterAbbreviationController();

semesterRouter.get("/current", async (req, res) => {
  await semesterController.getCurrentSessionSemesters(req, res);
});

semesterRouter.get("/abbreviations/:sem", async (req, res) => {
  await semesterController.getAbbreviationsBySem(req, res);
});

semesterRouter.get("/bysession", async (req, res) => {
  await semesterController.getSemestersBySession(req, res);
});
module.exports = semesterRouter;
