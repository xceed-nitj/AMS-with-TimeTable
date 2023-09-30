const Navbar = require("../models/navbar");
const HttpException = require("../models/http-exception");

class NavbarController {
  async addNavbar(navbar) {
    // if(!isValidNavbar(navbar)) {
    //     return res.status(400).json({ error: 'Invalid navbar data' });
    //   }
    try {
      // Create a new Navbar document using the Mongoose model
      return await Navbar.create(navbar);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getNavbarById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Find a Navbar document by _id using the Mongoose model

      const navbar = await Navbar.findById(id);
      if (!navbar) throw new HttpException(400, "data does not exists");
      return navbar;
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getNavbarByConfId(id) {
    if (!id) {
      throw aHttpException(400, "Invalid Id");
    }

    try {
      // Find a Navbar document that matches the confId using the Mongoose model
      return await Navbar.findOne({ confId: id });
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getNavbar() {
    try {
      // Find all Navbar documents using the Mongoose model
      return await Navbar.find();
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async updateNavbar(navbar, id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    if (!isValidNavbar(navbar)) {
      return res.status(400).json({ error: "Invalid navbar data" });
    }

    try {
      // Update a Navbar document by _id using the Mongoose model
      return await Navbar.findByIdAndUpdate(id, navbar);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async deleteNavbar(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }

    try {
      // Delete a Navbar document by _id using the Mongoose model
      return await Navbar.findByIdAndRemove(id);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }
}

module.exports = NavbarController;

function isValidNavbar(navbar) {
  return (
    navbar &&
    typeof navbar === "object" &&
    typeof navbar.id === "string" &&
    typeof navbar.confId === "string" &&
    typeof navbar.heading === "string" &&
    typeof navbar.subHeading === "string" &&
    typeof navbar.url === "string" &&
    typeof navbar.name === "string" &&
    navbar.createdAt instanceof Date &&
    navbar.updatedAt instanceof Date
  );
}
