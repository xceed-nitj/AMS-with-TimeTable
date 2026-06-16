const HttpException = require("../../../models/http-exception");
const User = require("../../../models/usermanagement/user");
const {
  getFacultyDepartmentByEmail,
  getTimetableDepartment,
  findDepartmentCoordinator,
} = require("./facultyDepartment");
const getApiURL = require("../../certificateModule/helper/getApiURL")


const fs = require('fs')
const path = require("path")



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

  async uploadFile(req, res) {
    try {
      const file = req.file;
      const user = await User.findById(req.user.id);
      if (!file) {
        const error = new Error("Please upload a file");
        error.httpStatusCode = 400;
        res.send(error);
      }
      const url = req?.body?.url || "";
      const currentUrl = getApiURL(url);
      const link = `${currentUrl}/uploads/userUploads/${file.newfilename}`;
      if(!user.uploads){
        user.uploads = []; // Initialize uploads if it doesn't exist
      }
      user.uploads.push(link);
      await user.save();
      res.json({
        link: link,
      });
    } catch (err) {
      console.log(err);
      res.json({ message: err.message });
    }
  };

  async deleteFile(req, res) {
    try {
      const {link} = req.body;
      const user = await User.findById(req.user.id);
      if (!link) {
        const error = new Error("Please provide the link to the file");
        error.httpStatusCode = 400;
        res.send(error);
      }
      user.uploads = user.uploads.filter(upload => upload !== link); 
      const filePath = path.join(__dirname, `../../../../uploads/userUploads/${link.split('/').pop()}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file from the server
      }
      await user.save();
      res.json({
        link: link,
      });
    } catch (err) {
      console.log(err);
      res.json({ message: err.message });
    }
  };

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

      if (role === "iams-dept-admin") {
        const department = user.dept?.trim()
          || await getFacultyDepartmentByEmail(user.email);
        if (!department) {
          return res.status(400).json({
            error: "Assign a department to this user before adding the IAMS Department Admin role",
          });
        }

        const existingCoordinator = await findDepartmentCoordinator(
          department,
          user._id,
        );
        if (existingCoordinator) {
          return res.status(409).json({
            error: `${department} already has an IAMS Department Admin`,
          });
        }
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

  async updateDepartment(req, res) {
    try {
      const { userId, dept } = req.body;
      if (!userId || typeof dept !== "string") {
        return res.status(400).json({
          error: "User ID and department are required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let department = dept.trim();
      if (!department && user.role.includes("iams-dept-admin")) {
        return res.status(400).json({
          error: "Department is required for an IAMS Department Admin",
        });
      }

      if (department) {
        const timetableDepartment = await getTimetableDepartment(department);
        if (!timetableDepartment) {
          return res.status(400).json({
            error: "Select a valid department from the timetable",
          });
        }
        department = timetableDepartment;
      }

      if (department && user.role.includes("iams-dept-admin")) {
        const existingCoordinator = await findDepartmentCoordinator(
          department,
          user._id,
        );
        if (existingCoordinator) {
          return res.status(409).json({
            error: `${department} already has an IAMS Department Admin`,
          });
        }
      }

      user.dept = department;
      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password;
      res.status(200).json({
        message: "Department updated successfully",
        user: userResponse,
      });
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
