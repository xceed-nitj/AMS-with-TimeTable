const Faculty = require("../models/faculty");

class FacultyController {
    async createFaculty(req,res) {
        const newFaculty = req.body;
        console.log(newFaculty);
        try {
          const createdFaculty = await Faculty.create(newFaculty);
          res.json(createdFaculty)
          return;
        } catch (error) {
          console.error(error); // Log the error for debugging purposes.
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getFaculty(req, res) {
       try {
          const facultyList = await Faculty.find();
          res.json(facultyList)
          return;
        } catch (error) {
          console.error(error); // Log the error for debugging purposes.
          res.status(500).json({ error: "Internal server error" });
        }
      }

}
module.exports = FacultyController;
