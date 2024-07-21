const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/user");
const UserController = new userController();

const jwt = require("jsonwebtoken");
const jwtSecret =
  "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab";
const { checkRole } = require("../../checkRole.middleware");

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  // console.log(token)

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);

    // The token is valid, and 'decoded' contains user information
    const userId = decoded.id;

    // Attach the user details to the 'req' object
    req.user = {
      id: userId,
      // other user details...
    };

    // Allow the request to proceed
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

userRouter.get("/", verifyToken, async (req, res) => {
  try {
    await UserController.getUserDetails(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

userRouter.post("/assignrole", checkRole(['admin']), async (req, res) => {
  try {
    await UserController.assignRole(req, res);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

userRouter.post("/deleterole", checkRole(['admin']), async (req, res) => {
  try {
    await UserController.deleteRole(req, res);
  } catch (e) {
    res.status(e?.status || 500).json({ error: e?.message || "Internal Server Error" });
  }
});

userRouter.post("/logout", verifyToken, async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

userRouter.get("/all", checkRole(['admin']), async (req, res) => {
  try {
    await UserController.getAllUserDetails(req, res);
  } catch (e) {
    res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

module.exports = userRouter;
