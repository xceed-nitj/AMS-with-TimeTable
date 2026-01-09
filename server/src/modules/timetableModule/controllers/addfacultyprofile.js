const HttpException = require("../../../models/http-exception");
const addFaculty = require("../../../models/addfaculty");
const Faculty=require("../../../models/faculty");

const TimeTabledto = require("../dto/timetable");
const TimeTableDto = new TimeTabledto();


const TableController = require("../controllers/timetableprofile");
const tableController = new TableController();


class addFacultyController {
  async  AddFaculty(req, res) {
    const { code, faculty, sem } = req.body;
  
    try {
      if (!code || !faculty || !sem) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      const existingFaculty = await addFaculty.findOne({ code, sem });
  
      if (!existingFaculty) {
        const newFaculty = new addFaculty({ code, sem, faculty: Array.isArray(faculty) ? faculty : [faculty] });
        await newFaculty.save();
        res.json({ message: 'Faculty added successfully' });
      } else {
        // Use $addToSet to add faculty to the array without duplicates
        await addFaculty.updateOne(
          { code, sem },
          { $addToSet: { faculty: { $each: faculty } } }
        );
  
        res.json({ message: 'Faculty added to the existing semester successfully' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
      
      async getAddedFaculty(req, res) {
       try {
          const code=req.query.code;
          const facultyList = await addFaculty.find({code});
          const allFaculty = [];
          facultyList.forEach((item) => {
            item.faculty.forEach((facultyMember) => {
              if (!allFaculty.includes(facultyMember)) {
                allFaculty.push(facultyMember);
              }
            });
          });
          return allFaculty;
        } catch (error) {
          console.error(error); 
          res.status(500).json({ error: "Internal server error" });
        }
      }

      async getAddedFacultyById(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          const data = await addFaculty.findById(id);
          if (!data) throw new HttpException(400, "data does not exists");
          return data;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async updateID(id, announcement) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        // if (!isValidAnnouncement(announcement)) {
        //   return res.status(400).json({ error: "Invalid Announcement data" });
        // }
        try {
          await addFaculty.findByIdAndUpdate(id, announcement);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async deleteId(id) {
        if (!id) {
          throw new HttpException(400, "Invalid Id");
        }
        try {
          await addFaculty.findByIdAndDelete(id);
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
      async getFilteredFaculty(code, sem){
        try {
          const faculty = await addFaculty.find({ code, sem });
          console.log(faculty)
           return faculty;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

      async getFaculty(){
        try {
          const faculty = await addFaculty.find();
      
      return faculty;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      };

      async deleteFacultyByCode(code) {
        try {
    
          await addFaculty.deleteMany({ code });
    
        } catch (error) {
          throw new Error("Failed to delete faculty by code");
        }
      }

      async deleteFirstYearDeptFaculty(code, sem, facultyname) {
        try {
          const session = await TimeTableDto.getSessionByCode(code);
          const firstYear = await tableController.getCodeOfDept('Basic Sciences', session);
          const firstYearCode = firstYear.code;
      
          // Fetch faculty data based on code and sem
          const faculty = await addFaculty.findOne({ code: firstYearCode, sem });
      
          if (faculty) {
            // Filter out the specified facultyname from the faculty array
            faculty.faculty = faculty.faculty.filter(name => name !== facultyname);
            await faculty.save();

          
            

          return faculty;
          } else {
            throw new Error("Faculty not found");
          }
      
        } catch (error) {
          throw new Error("Failed to delete faculty by code");
        }
      }
      
      async getFirstYearDeptFaculty(code, dept) {
        try {
          const session = await TimeTableDto.getSessionByCode(code);
          const firstYear = await tableController.getCodeOfDept('Basic Sciences', session);
          const firstYearCode = firstYear.code;
          const faculty = await addFaculty.find({ code: firstYearCode });
          const facultyArray = [];
      
          for (const item of faculty) {
            const facultyValues = item.faculty;
      
            for (const facultyName of facultyValues) {
              const deptFaculty = await Faculty.findOne({ name: facultyName, dept });
      
              if (deptFaculty) {
                facultyArray.push({sem:item.sem, faculty:facultyName});
              }
            }
          }
      
          return facultyArray;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }
      

      async getFirstYearDeptFacultyBySem(code,dept, sem) {
        try {
          const session = await TimeTableDto.getSessionByCode(code);
          const firstYear = await tableController.getCodeOfDept('Basic Sciences', session);
          const firstYearCode = firstYear.code;
          const faculty = await addFaculty.find({ code: firstYearCode, sem });
          const facultyArray = [];
      
          for (const item of faculty) {
            const facultyValues = item.faculty;
      
            for (const facultyName of facultyValues) {
              const deptFaculty = await Faculty.findOne({ name: facultyName, dept });
      
              if (deptFaculty) {
                facultyArray.push({sem:item.sem, faculty:facultyName});
              }
            }
          }
      
          return facultyArray;
        } catch (e) {
          throw new HttpException(500, e.message || "Internal Server Error");
        }
      }

    }
module.exports = addFacultyController;


