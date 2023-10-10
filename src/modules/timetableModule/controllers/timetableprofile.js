const TimeTable = require("../../../models/timetable");
const generateUniqueLink = require("../helper/createlink");


class TableController {
    async createTable(req,res) {
    const data = req.body;
    try {
      const newCode = await generateUniqueLink();
      const newTimeTable = new TimeTable({
        ...data,
        Code: newCode, 
      });
      const createdTT = await newTimeTable.save(); // Save the new TimeTable document
      res.json(createdTT);
    } 
    catch (error) {
        console.error(error); 
        res.status(500).json({ error: "Internal server error" });
      }
    }

      async getTable(req, res) {
        try {
           const TableField = await TimeTable.find();
           res.json(TableField)
           return;
         } catch (error) {
           console.error(error); // Log the error for debugging purposes.
           res.status(500).json({ error: "Internal server error" });
         }
       }
    }



module.exports = TableController;


