const express = require("express");
const noteRouter = express.Router();
const NoteController = require("../controllers/noteprofile");
const noteController = new NoteController();

noteRouter.post("/", async (req, res) => {
  try {
    await noteController.createNote(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

noteRouter.get("/", async (req, res) => {
  try {
    await noteController.getNotes(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

noteRouter.get("/id/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await noteController.getNoteById(id);
    res.status(200).json(resp);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

noteRouter.put('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const updatedNote = req.body;
    await noteController.updateNote(noteId, updatedNote);
    res.status(200).json({ response: "Note updated successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

noteRouter.delete("/:id", async (req, res) => {
  try {
    const noteId = req.params.id;
    await noteController.deleteNote(noteId);
    res.status(200).json({ response: "Note deleted successfully" });
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = noteRouter;
