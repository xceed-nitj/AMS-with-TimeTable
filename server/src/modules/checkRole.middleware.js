const jwt = require("jsonwebtoken");
const jwtSecret = "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab";

const checkRole = (roles) => {
  return (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, jwtSecret);

      // The token is valid, and 'decoded' contains user information including roles
      const userId = decoded.id;
      const userRoles = decoded.roles; // Ensure roles are correctly decoded

      // Attach the user details to the 'req' object
      req.user = {
        id: userId,
        roles: userRoles,
      };

      // Check if the user has the required role
      if (!roles.some(role => userRoles.includes(role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Allow the request to proceed
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
};

module.exports = { checkRole };
