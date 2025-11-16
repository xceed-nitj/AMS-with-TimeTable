const express = require("express");
const TableRouter = express.Router();
const TableController = require("../controllers/timetableprofile");
const tableController = new TableController();
const protectRoute = require("../../usermanagement/privateroute");

TableRouter.get("/", protectRoute, async (req, res) => {
  try {
    await tableController.getUserTable(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.get("/:id", protectRoute, async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await tableController.getTableById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.post("/", protectRoute, async (req, res) => {
  try {
    await tableController.createTable(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.put("/:id", protectRoute, async (req, res) => {
  try {
    const tableId = req.params.id;
    const updatedId = req.body;
    await tableController.updateID(tableId, updatedId);
    res.status(200).json({ response: "ID updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.delete("/:id", protectRoute, async (req, res) => {
  try {
    const tableId = req.params.id;
    await tableController.deleteId(tableId);
    res.status(200).json({ response: "ID deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// TableRouter.get("/alldetails/:code", async (req, res) => {
//   try {
//     const code = req.params.code;
//     const TTdetails = await tableController.getTableByCode(code);
//     res.status(200).json(TTdetails);
//   } catch (e) {
//     res
//       .status(e?.status || 500)
//       .json({ error: e?.message || "Internal Server Error" });
//   }
// });

//newcode
TableRouter.get("/alldetails/:code", async (req, res) => {
  try {
    console.log("Fetching timetable details for code:", req.params.code);

    const code = req.params.code;
    console.log("Code from request params:", code);
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const TTdetails = await tableController.getTableByCode(code);

    return res.status(200).json(TTdetails);
  } catch (e) {
    console.error("Error in GET /alldetails/:code:", e);
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.get("/sess/allsessanddept", async (req, res) => {
  try {
    const session = await tableController.getAllSessAndDept();
    res.status(200).json(session);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.get("/getcode/:session/:dept", async (req, res) => {
  try {
    const dept = req.params.dept;
    const session = req.params.session;
    const code = await tableController.getCodeOfDept(dept, session);
    res.status(200).json(code.code);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.get("/getallcodes/:session", async (req, res) => {
  try {
    const session = req.params.session;
    const code = await tableController.getAllCodes(session);
    res.status(200).json(code);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.delete("/deletebycode/:code", protectRoute, async (req, res) => {
  try {
    const code = req.params.code;
    await tableController.deleteTableByCode(code);
    res
      .status(200)
      .json({ response: `Time Table with code ${code} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

TableRouter.post("/set-current-session", async (req, res) => {
  try {
    await tableController.setCurrentSession(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

TableRouter.post("/get-current-session", async (req, res) => {
  try {
    await tableController.getCurrentSession(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = TableRouter;
