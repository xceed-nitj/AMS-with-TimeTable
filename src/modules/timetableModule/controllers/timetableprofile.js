const TimeTable = require("../../../models/timetable");
const generateUniqueLink = require("../helper/createlink");


class TableController {
    async createTable(req,res) {
      const data = req.body;

  try {
    const newCode = await generateUniqueLink();
    console.log(newCode) // Generate the unique code
    const newTimeTable = new TimeTable({
      Name: data.Name,
      Dept: data.Dept,
      Session: data.Session,
      Code: newCode, // Set the Code field with the generated code
    });

    const createdTT = await newTimeTable.save(); // Save the new TimeTable document
    res.json(createdTT);

    
        // return;
      } catch (error) {
        console.error(error); // Log the error for debugging purposes.
        res.status(500).json({ error: "Internal server error" });
      }
      }

      async getTable(req, res) {
        try {
           const TableField = await TimeTable.find();
           console.log(TableField);
           res.json(TableField)
           return;
         } catch (error) {
           console.error(error); // Log the error for debugging purposes.
           res.status(500).json({ error: "Internal server error" });
         }
       }
    }



module.exports = TableController;


