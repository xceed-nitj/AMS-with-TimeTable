const express = require("express");
const addFacultyRouter = express.Router();
const AddFacultyController = require("../controllers/addfacultyprofile");
const addFacultyController = new AddFacultyController();
const protectRoute = require("../../usermanagement/controllers/privateroute");

addFacultyRouter.post("/", protectRoute, async (req, res) => {
  try {
    await addFacultyController.AddFaculty(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.get("/", async (req, res) => {
  try {
    const allfaculty = await addFacultyController.getFaculty();
    res.status(200).json(allfaculty);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.get("/all", async (req, res) => {
  try {
    const allfaculty = await addFacultyController.getAddedFaculty(req, res);
    res.status(200).json(allfaculty);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await addFacultyController.getAddedFacultyById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.put("/:id", protectRoute, async (req, res) => {
  try {
    const facultyId = req.params.id;
    const updatedId = req.body;
    await addFacultyController.updateID(facultyId, updatedId);
    res.status(200).json({ response: "ID updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.delete("/:id", protectRoute, async (req, res) => {
  try {
    const facultyId = req.params.id;
    await addFacultyController.deleteId(facultyId);
    res.status(200).json({ response: "ID deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.get("/filteredfaculty/:code/:sem", async (req, res) => {
  try {
    const code = req.params.code;
    const sem = req.params.sem;
    const faculty = await addFacultyController.getFilteredFaculty(code, sem);
    res.status(200).json(faculty);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.delete(
  "/deletebycode/:code",
  protectRoute,
  async (req, res) => {
    try {
      const code = req.params.code;
      await addFacultyController.deleteFacultyByCode(code);
      res
        .status(200)
        .json({ response: `Faculty with code ${code} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

addFacultyRouter.get("/firstyearfaculty/:dept/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const dept = req.params.dept;
    const faculty = await addFacultyController.getFirstYearDeptFaculty(
      code,
      dept
    );
    res.status(200).json(faculty);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

addFacultyRouter.put(
  "/deletefirstyearfaculty/:code/:sem/:faculty",
  async (req, res) => {
    try {
      const code = req.params.code;
      const sem = req.params.sem;
      const faculty = req.params.faculty;
      const filteredfaculty =
        await addFacultyController.deleteFirstYearDeptFaculty(
          code,
          sem,
          faculty
        );
      res.status(200).json(filteredfaculty);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  }
);

module.exports = addFacultyRouter;
