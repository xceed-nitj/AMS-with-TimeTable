const HttpException = require("../../../models/http-exception");
const MasterClassTable = require("../../../models/masterclasstable");
const ClassTable = require("../../../models/classtimetable");
const SubjectTable = require('../../../models/subject');
const SemTable = require("../../../models/mastersem");
const TimeTable = require("../../../models/timetable");
const Faculty = require("../../../models/faculty");


class MasterclasstableController {

async createMasterTable(newData) {
        try {
            const { code } = newData;

            // Step 1: Delete all existing data related to the specified code
            // If no data exists, deleteMany won't throw an error; it just skips.
            await MasterClassTable.deleteMany({ code });

            // Step 2: Fetch data from 'class table' based on the code
            const classTableData = await ClassTable.find({ code });

            // If no data exists in the class table, handle gracefully
            if (!classTableData || classTableData.length === 0) {
                return res.status(404).json({ message: `No class table data found for code: ${code}` });
            }

            // Step 3: Process and insert new data
            for (const dataItem of classTableData) {
                const { day, slot, slotData, sem } = dataItem;

                // Fetch semDetails and codeDetails once for this iteration
                const semDetails = await SemTable.findOne({ sem });
                const codeDetails = await TimeTable.findOne({ code });

                for (const slotDataItem of slotData) {
                    const { subject, faculty } = slotDataItem;
                    const subDetails = await SubjectTable.findOne({ code, sem, subName: subject });
                    const facultyDetails = await Faculty.findOne({ name: faculty });

                    // Construct data object for insertion
                    const newMasterData = {
                        day,
                        slot,
                        sem,
                        code,
                        subject,
                        faculty,
                        room: slotDataItem.room,
                        subjectCode: subDetails?.subCode ?? '',
                        subjectFullName: subDetails?.subjectFullName ?? '',
                        subjectType: subDetails?.type ?? '',
                        subjectDept: codeDetails?.dept ?? '',
                        degree: semDetails?.degree ?? '',
                        subjectCredit: subDetails?.credits ?? '',
                        offeringDept: facultyDetails?.dept ?? '',
                        year: semDetails?.year ?? '',
                        session: codeDetails?.session ?? '',
                    };

                    // Insert the new data into the MasterClassTable
                    await MasterClassTable.create(newMasterData);
                }
            }

            // Return success response
            res.status(200).json({ message: 'Data replaced successfully!' });
        } catch (error) {
            console.error('Error in createMasterTable:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

  //async createMasterTable(newData) {
  //  try {

  //    const { code } = newData;
  //    // Fetch data from 'class table' based on the code
  //    const classTableData = await ClassTable.find({ code });
  //    // console.log(classTableData)
  //    for (const dataItem of classTableData) {
  //      const { code, day, slot, slotData, sem } = dataItem;
  //      for (const slotDataItem of slotData) {
  //        const subject = slotDataItem.subject;
  //        const faculty =slotDataItem.faculty;
  //        const subDetails = await SubjectTable.findOne({code,sem, subName:subject})
  //        const semDetails = await SemTable.findOne({sem})
  //        const codeDetails = await TimeTable.findOne({code})
  //        const facultyDetails = await Faculty.findOne({name:faculty})
        
  //        // Check if data with the specified code, day, and slot exists in 'lock classtable'
  //      const existingData = await MasterClassTable.findOne({ code, day, slot, sem, subject });
  //      if (existingData) {
  //        // If data with the code, day, and slot exists, update the existing data
  //        existingData.code=code;
  //        existingData.day=day;
  //        existingData.slot=slot;
  //        existingData.sem=sem;
  //        existingData.subject=slotDataItem.subject;
  //        existingData.faculty=slotDataItem.faculty;
  //        existingData.room=slotDataItem.room;
  //        existingData.subjectCode=subDetails?.subCode ?? '';
  //        existingData.subjectFullName=subDetails?.subjectFullName??'';
  //        existingData.subjectType=subDetails?.type??'';
  //        existingData.subjectDept=codeDetails?.dept?? '';
  //        existingData.degree=semDetails?.degree??'';
  //        existingData.subjectCredit=subDetails?.credits??'';
  //        existingData.offeringDept=facultyDetails?.dept??'';
  //        existingData.year=semDetails?.year??'';
  //        existingData.session=codeDetails?.session??'';





  //        await existingData.save();
  //      } else {
  //        // If data with the code, day, and slot doesn't exist, insert new data
  //        // console.log(dataItem)
  //                     await MasterClassTable.create({
  //                      day: dataItem.day,
  //                      slot: dataItem.slot,
  //                      slotData: dataItem.slotData,
  //                      sem: dataItem.sem,
  //                      code: dataItem.code,
  //                      subject:slotDataItem.subject,
  //                      faculty:slotDataItem.faculty,
  //                      room:slotDataItem.room,
  //                      subjectCode:subDetails?.subCode,
  //                      subjectFullName:subDetails?.subjectFullName,
  //                      subjectType:subDetails?.type,
  //                      subjectDept:codeDetails?.dept,
  //                      degree:semDetails?.degree,
  //                      subjectCredit:subDetails?.credits,
  //                      offeringDept:facultyDetails?.dept,
  //                      year:semDetails?.year??'',
  //                      session:codeDetails?.session??''          
  //                    }
                        
  //                      );
  //      }
  //    }
  //    }
  //// const timenow=Date.now();
  //// console.log(timenow)
  //// const formattedtime= getIndianTime(timenow);
  //// console.log(formattedtime)
  //// res.status(200).json({ message: 'Data Locked successfully!', updatedTime: formattedtime});

  //    // const createdSemester = await MasterClassTable.create(newCompletedData);
  //    // res.json(createdSemester);
  //    // return;
  //  } catch (error) {
  //    console.error(error);
  //    res.status(500).json({ error: "Internal server error" });
  //  }
  //}

  async getMasterTable(req, res) {
    try {
      const semesterList = await MasterClassTable.find();
      res.json(semesterList);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // async getSemesterById(id) {
  //   if (!id) {
  //     throw new HttpException(400, "Invalid Id");
  //   }
  //   try {
  //     const data = await Mastersem.findById(id);
  //     if (!data) throw new HttpException(400, "Data does not exist");
  //     return data;
  //   } catch (e) {
  //     throw new HttpException(500, e.message || "Internal Server Error");
  //   }
  // }

  async getMasterTableBySession(req,res) {
    const session = req.params.session;
    if (!session) {
      throw new HttpException(400, "Invalid Session");
    }
    try {
      const data = await MasterClassTable.find({session });
      if (!data) throw new HttpException(400, "No semester data found in this department");
      res.json(data);
      return;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }


  async getMasterTableByDepartment(session, department) {
    if (!department) {
      throw new HttpException(400, "Invalid Department");
    }
    try {
      const data = await MasterClassTable.find({ offeringDept: department, session });
      if (!data) throw new HttpException(400, "No semester data found in this department");
      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  // async updateSemester(id, updatedSemester) {
  //   if (!id) {
  //     throw new HttpException(400, "Invalid Id");
  //   }
  //   try {
  //     await Mastersem.findByIdAndUpdate(id, updatedSemester);
  //   } catch (e) {
  //     throw new HttpException(500, e.message || "Internal Server Error");
  //   }
  // }

  // async deleteSemester(id) {
  //   if (!id) {
  //     throw new HttpException(400, "Invalid Id");
  //   }
  //   try {
  //     await Mastersem.findByIdAndDelete(id);
  //   } catch (e) {
  //     throw new HttpException(500, e.message || "Internal Server Error");
  //   }
  // }

  // async getDepartments() {
  //   try {
  //     const uniqueDepartments = await Mastersem.distinct('dept');
      
  //     return uniqueDepartments;
  //   } catch (error) {
  //     throw error; 
  //   }
  // }

  // async getSemDetails(sem) {
  //   try {
  //     const semdetails = await Mastersem.find({sem});
      
  //     return semdetails;
  //   } catch (error) {
  //     throw error; 
  //   }
  // }



}

module.exports = MasterclasstableController;
