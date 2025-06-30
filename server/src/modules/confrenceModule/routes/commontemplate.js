const express = require("express");
const CommonTemplatesController = require("../crud/commontemplate"); // Change to the appropriate commontemplates controller

const commontemplatesRouter = express.Router();
const commontemplatesController = new CommonTemplatesController();
const { checkRole } = require("../../checkRole.middleware");




// GET /commontemplates/conference/:id
commontemplatesRouter.get("/conference/:id", async (req, res) => {
  try {
    console.log("inside commontemplatesRouter.get('/conference/:id')");
    await commontemplatesController.getCommonTemplateByConferenceId(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /commontemplates/:confid/:templateid
commontemplatesRouter.get("/:confid/:templateid", async (req, res) => {
  try {
    console.log("inside commontemplatesRouter.get('/:confid/:templateid')");
    await commontemplatesController.getTemplateByConfAndId(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// GET /commontemplates
commontemplatesRouter.get("/", async (req, res) => {
  try {
    await commontemplatesController.getAllCommonTemplate(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /commontemplates/:id
commontemplatesRouter.get("/:id", async (req, res) => {
  try {
    await commontemplatesController.getCommonTemplateById(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /commontemplates
commontemplatesRouter.post("/",checkRole(['EO']), async (req, res) => {
  try {
    await commontemplatesController.createCommonTemplate(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /commontemplates/:id
commontemplatesRouter.put("/:id", async (req, res) => {
  try {
    await commontemplatesController.updateCommonTemplate(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /commontemplates/:id
commontemplatesRouter.delete("/:id",checkRole(['EO']), async (req, res) => {
  try {
    await commontemplatesController.deleteCommonTemplate(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = commontemplatesRouter;
