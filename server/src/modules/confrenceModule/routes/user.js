const express = require("express");
const User = require("../crud/user");

const userController = new User();

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await userController.createUser(req, res);
  } catch (e) {
    console.error("Error creating user:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    await userController.getAllUsers(req, res);
  } catch (e) {
    console.error("Error getting all users:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    await userController.addUsersInBulk(req, res);
  } catch (e) {
    console.error("Error adding users in bulk:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/bulk", async (req, res) => {
  try {
    await userController.deleteAllUsers(req, res);
  } catch (e) {
    console.error("Error deleting all users:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/team/:teamId", async (req, res) => {
  try {
    await userController.getUserByTeamId(req, res);
  } catch (e) {
    console.error("Error getting user by team ID:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/token/:token", async (req, res) => {
  try {
    await userController.getUserByToken(req, res);
  } catch (e) {
    console.error("Error getting user by token:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/accessType/:accessType", async (req, res) => {
  try {
    await userController.getUsersByAccessType(req, res);
  } catch (e) {
    console.error("Error getting users by access type:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await userController.getUserById(req, res);
  } catch (e) {
    console.error("Error getting user by ID:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    await userController.updateUser(req, res);
  } catch (e) {
    console.error("Error updating user:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await userController.deleteUser(req, res);
  } catch (e) {
    console.error("Error deleting user:", e);
    res
      .status(e?.code || 500)
      .json({ error: e?.message || "Internal server error" });
  }
});

module.exports = router;
