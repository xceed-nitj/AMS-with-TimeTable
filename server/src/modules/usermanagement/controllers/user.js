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
      const user = await User.find();
      if (!user) {
        throw { status: 404, message: "User not found" };
      }
      res.json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

}

module.exports = UserController;
