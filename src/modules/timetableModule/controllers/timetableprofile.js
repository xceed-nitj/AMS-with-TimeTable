const TimeTable = require("../../../models/timetable");


class TableController {
    async createTable(req,res) {
      const newTT = req.body;
      try {
        const createdTT = await TimeTable.create(newTT);
        res.json(createdTT);
        return;
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


