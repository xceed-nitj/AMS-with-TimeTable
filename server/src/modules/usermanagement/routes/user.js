const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/usercontroller");
const UserController = new userController();

const jwt = require("jsonwebtoken");
const jwtSecret = "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab";

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
        const token = req.cookies.jwt; 
        // console.log(token)
      
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized' });
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
          return res.status(401).json({ message: 'Unauthorized' });
        }
      }
      

userRouter.get("/",verifyToken, async (req, res) => {
    try {
      await UserController.getUserDetails(req, res);
    } catch (e) {
      res
        .status(e?.status || 500)
        .json({ error: e?.message || "Internal Server Error" });
    }
  });


  userRouter.post("/logout",verifyToken, async (req, res) => {
    try {
    //   await UserController.logout(req.user); // Pass the user object from the request
      res.clearCookie("jwt");
      // res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Error during logout:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


  module.exports = userRouter;
