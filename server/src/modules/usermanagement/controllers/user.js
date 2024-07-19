const HttpException = require("../../../models/http-exception");
const User = require("../../../models/usermanagement/user");

class UserController {
  async getUserDetails(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        throw { status: 404, message: "User not found" };
      }
      res.json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAllUserDetails(req, res) {
    try {
      // const userId = req.user.id;
      const user = await User.find({}, { password: 0 });
      if (!user) {
        throw { status: 404, message: "User not found" };
      }
      res.json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async assignRole(req, res) {
    try {
      const { userId, role } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        throw { status: 404, message: "User not found" };
      }
      if (!user.role.includes(role)) {
        user.role.push(role);
        await user.save();
      }
      res.status(200).json({ message: "Role assigned successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteRole(req, res) {
    try {
      const { userId, role } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        throw { status: 404, message: "User not found" };
      }
      user.role = user.role.filter(r => r !== role); // Remove the role from the user's roles
      await user.save();
      res.status(200).json({ message: "Role deleted successfully", user }); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

}

module.exports = UserController;
