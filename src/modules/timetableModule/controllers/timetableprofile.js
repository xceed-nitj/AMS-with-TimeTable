const Table = require("../../../models/timetable");
const LinkGen = require("../../../helper/createlink");

class TableController {
    async createTable(req,res) {

        try {
            const {
                Name,
                Dept,
                Session
                 } = req.body;
          const Code=LinkGen('https://example.com');

          const newTable = new Table({
            Name,
            Dept,
            Session,
            Code
          });

          await newTable.create();

        //   res.status(201).json({ message: 'Timetable entry created successfully' })
          res.json(newTable)
          return;
        } catch (error) {
          console.error(error); // Log the error for debugging purposes.
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getTable(req, res) {
        try {
           const TableField = await Table.find();
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


