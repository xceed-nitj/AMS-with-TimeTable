const jwt = require("jsonwebtoken");
const jwtSecret = "ad8cfdfe03c3076a4acb369ec18fbfc26b28bc78577b64da02646cd7bd0fe9c7d97cab";
const addEvent = require("../models/certificateModule/addevent");

const checkRole = (requiredRoles, checkEvent = false) => {
  return async (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, jwtSecret);
      const userId = decoded.id;
      const userRoles = decoded.role; // Extract the roles from the token

      // Check if the user has the 'admin' role and skip further checks if they do
      if (userRoles.includes('admin')) {
        req.user = { id: userId, roles: userRoles };
        return next();
      }

      // Check if the user has the required role
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // If event check is required, check if the user is assigned to the specific event
      if (checkEvent) {
        const eventId = req.params.eventId; // Get eventId from req.params
        const event = await addEvent.findById(eventId);

        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        const isAssignedToEvent = event.user === userId;
        if (!isAssignedToEvent) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Attach the user details to the 'req' object
      req.user = { id: userId, roles: userRoles };
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
};

module.exports = { checkRole };
