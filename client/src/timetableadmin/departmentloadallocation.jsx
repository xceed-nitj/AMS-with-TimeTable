import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import './Timetable.css';
import TimetableSummary from './ttsummary';
import ReactToPrint from 'react-to-print';
import { Container } from "@chakra-ui/layout";
import { filter, Heading } from '@chakra-ui/react';
import { CustomTh, CustomLink, CustomBlueButton, CustomPlusButton, CustomDeleteButton } from '../styles/customStyles'
import { Box, Text, Portal, ChakraProvider, Spinner, Select } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";
import Header from '../components/header';

const Departmentloadallocation = () => {
  // Initialize as an empty array
  const [TTData, setTTData] = useState([]);
  const [deptFaculties, setDeptFaculties] = useState([]);

  const [timetableData, setTimetableData] = useState({});
  const [summaryData, setSummaryData] = useState({});
  const [type, setType] = useState('');
  const [updateTime, setUpdatedTime] = useState('');
  const [headTitle, setHeadTitle] = useState('');
  const [table, setTable] = useState([]);
  const [dupTable, setDupTable] = useState([]);

  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [lockedTime, setLockedTime] = useState();
  const [savedTime, setSavedTime] = useState();

  const [facultyUpdateTime, setFacultyUpdateTime] = useState();
  const [roomUpdateTime, setRoomUpdateTime] = useState();

  const [subjectData, setSubjectData] = useState([]);
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 3];
  const apiUrl = getEnvironment();

  const [downloadType, setDownloadType] = useState('')

  const [downloadStatus, setDownloadStatus] = useState('')
  const [initiateStatus, setInitiateStatus] = useState('')
  const [slotStatus, setSlotStatus] = useState('')
  const [summaryStatus, setSummaryStatus] = useState('')
  const [noteStatus, setNoteStatus] = useState('')
  const [headerStatus, setHeaderStatus] = useState('')
  const [prepareStatus, setPrepareStatus] = useState('')
  const [startStatus, setStartStatus] = useState('')
  const [completeStatus, setCompleteStatus] = useState('')
  const [semDrop, setSemDrop] = useState([])
  const [codeDrop, setCodeDrop] = useState([])
  const [nameDrop, setNameDrop] = useState([])
  const [typDrop, setTypDrop] = useState([])
  const [sem, setSem] = useState("All")
  const [code, setCode] = useState("All")
  const [name, setName] = useState("All")
  const [typ, setTyp] = useState("All")

  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {

    // getting all the semester values for this code.
    const fetchSem = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          // console.log('filtered data',data)
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);
          // console.log(semValues)
          setAvailableSems(semValues);
          setDownloadStatus("fetchingSemesters")
          //   setSelectedSemester(semValues[0]);
          // console.log('available semesters',availableSems)
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchRoom = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addroom?code=${currentCode}`, { credentials: 'include', });
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((room) => room.code === currentCode);
          const semValues = filteredSems.map((room) => room.room);

          setAvailableRooms(semValues);
          // console.log('available rooms',availableRooms)
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };



    const fetchFaculty = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addfaculty/all?code=${currentCode}`, { credentials: 'include', });
        if (response.ok) {
          const data = await response.json();
          // console.log('faculty response',data);
          setAvailableFaculties(data);
          // console.log('faculties', availableFaculties);
        }

      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };


    fetchSem();
    fetchRoom(currentCode);
    fetchFaculty();
    fetchDeptLoadAllocation()

  }, []);
  // fetching sem data
  const fetchData = async (semester) => {
    try {
      // console.log('sem value',semester);
      // console.log('current code', currentCode);
      const response = await fetch(`${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`, { credentials: 'include' });
      const data1 = await response.json();
      // console.log('fetched',data1);
      const data = data1.timetableData;
      const notes = data1.notes;
      const initialData = generateInitialTimetableData(data, 'sem');
      return { initialData, notes };
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };

  const fetchTime = async () => {
    try {
      // console.log('sem value',semester);
      // console.log('current code', currentCode);
      const response = await fetch(`${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`, { credentials: 'include' });
      const data = await response.json();
      // console.log('time daata', data)
      setLockedTime(data.updatedTime.lockTimeIST)
      setSavedTime(data.updatedTime.saveTimeIST)
      return data.updatedTime.lockTimeIST;
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
    }
  };


  const fetchTimetableData = async (semester) => {
    setDownloadStatus("fetchingSlotData")
    const { initialData, notes } = await fetchData(semester);
    // setTimetableData(initialData);
    setDownloadStatus("fetchingSummaryData")
    // console.log('semdata',initialData)
    return { initialData, notes };

  };


  //fetching faculty data 
  const facultyData = async (currentCode, faculty) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`, { credentials: 'include' });
      const data1 = await response.json();
      const data = data1.timetableData;
      // console.log('updated time for faculty', data1.updatedTime)
      const updateTime = data1.updatedTime;
      const notes = data1.notes;
      // console.log('faclty time', facultyUpdateTime)
      const initialData = generateInitialTimetableData(data, 'faculty');
      return { initialData, updateTime, notes };
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };
  const fetchFacultyData = async (currentCode, faculty) => {
    const { initialData, updateTime, notes } = await facultyData(currentCode, faculty);
    // setTimetableData(data);
    setSlotStatus('fetchingSlotData')
    return { initialData, updateTime, notes };

  };

  // fetching room data

  const roomData = async (currentCode, room) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`, { credentials: 'include' });
      const data1 = await response.json();
      const data = data1.timetableData;
      // setRoomUpdateTime(data1.updatedTime);
      const updateTime = data1.updatedTime;
      const notes = data1.notes;

      const initialData = generateInitialTimetableData(data, 'room');
      return { initialData, updateTime, notes };
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }

  };

  const fetchRoomData = async (currentCode, room) => {
    const { initialData, updateTime, notes } = await roomData(currentCode, room);
    // setViewRoomData(initialData);
    return { initialData, updateTime, notes };
  };


  const generateInitialTimetableData = (fetchedData, type) => {
    const initialData = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 'lunch'];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        if (period == 'lunch') {
          initialData[day]['lunch'] = [];

          if (fetchedData[day] && fetchedData[day]['lunch']) {
            const slotData = fetchedData[day]['lunch'];

            for (const slot of slotData) {
              const slotSubjects = [];
              let faculty = ""; // Declare faculty here
              let room = "";
              for (const slotItem of slot) {
                const subj = slotItem.subject || "";
                if (type == "room") {
                  room = slotItem.sem || "";
                } else {
                  room = slotItem.room || "";
                }
                if (type == "faculty") {
                  faculty = slotItem.sem || "";
                } else {
                  faculty = slotItem.faculty || "";
                }
                // Only push the values if they are not empty
                if (subj || room || faculty) {
                  slotSubjects.push({
                    subject: subj,
                    room: room,
                    faculty: faculty,
                  });
                }
              }
              initialData[day]['lunch'].push(slotSubjects);


            }
          }

        }
        else {
          initialData[day][`period${period}`] = [];

          if (fetchedData[day] && fetchedData[day][`period${period}`]) {
            const slotData = fetchedData[day][`period${period}`];

            for (const slot of slotData) {
              const slotSubjects = [];
              let faculty = ""; // Declare faculty here
              let room = "";
              for (const slotItem of slot) {
                const subj = slotItem.subject || "";
                if (type == "room") {
                  room = slotItem.sem || "";
                } else {
                  room = slotItem.room || "";
                }
                if (type == "faculty") {
                  faculty = slotItem.sem || "";
                } else {
                  faculty = slotItem.faculty || "";
                }
                // Only push the values if they are not empty
                if (subj || room || faculty) {
                  slotSubjects.push({
                    subject: subj,
                    room: room,
                    faculty: faculty,
                  });
                }
              }

              // Push an empty array if no data is available for this slot
              if (slotSubjects.length === 0) {
                slotSubjects.push({
                  subject: "",
                  room: "",
                  faculty: "",
                });
              }

              initialData[day][`period${period}`].push(slotSubjects);
            }
          } else {
            // Assign an empty array if day or period data is not available
            initialData[day][`period${period}`].push([]);
          }
        }
      }

    }

    console.log("initial datat to be received", initialData);
    return initialData;
  };


  //   fetchTimetableData(selectedSemester);
  //   fetchFacultyData(viewFaculty);
  //   fetchRoomData(viewRoom);


  const fetchSubjectData = async (currentCode) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`);
      const data = await response.json();
      setSubjectData(data);
      return data
      // console.log('subjectdata',data)
    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };

  const fetchTTData = async (currentCode) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify(userData),
        credentials: 'include'
      });

      const data = await response.json();
      // console.log('ttdata',data)
      setTTData(data);
      return data;
      //   
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
  };


  const fetchDeptFaculty = async (currentCode) => {
    try {
      const fetchedttdetails = await fetchTTData(currentCode);

      const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails[0].dept}`, { credentials: 'include', });
      if (response.ok) {
        const data = await response.json();
        // console.log('faculty response',data);
        setDeptFaculties(data);
        console.log('deptfaculties', data);
        return data;
      }

    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };

  const [commonLoad, setCommonLoad] = useState('');

  const fetchCommonLoad = async (currentCode, viewFaculty) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/commonLoad/${currentCode}/${viewFaculty}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('faculty common response', data);
        setCommonLoad(data);
        // console.log('coomomo load', data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching commonload:", error);
    }
  };



  function generateSummary(timetableData, subjectData, type, headTitle, commonLoad) {
    console.log(headTitle)
    console.log('load', commonLoad)
    const summaryData = {};

    // Iterate through the timetable data to calculate the summary
    for (const day in timetableData) {
      for (let period = 1; period <= 9; period++) {
        let slots = ''
        if (period == 9) {
          slots = timetableData[day]['lunch'];
        }
        else {
          slots = timetableData[day][`period${period}`];
        }
        // Check if the slot is not empty
        if (slots) {
          slots.forEach((slot) => {
            slot.forEach((cell) => {
              // Check if the cell contains data
              if (cell.subject) {
                const { subject, faculty, room } = cell;
                let foundSubject = ''
                if (type == 'faculty') {
                  foundSubject = subjectData.find(item => item.subName === subject && item.sem === faculty);
                }
                else if (type == 'room') {
                  foundSubject = subjectData.find(item => item.subName === subject && item.sem === room);
                }
                else if (type == 'sem') {
                  foundSubject = subjectData.find(item => item.subName === subject && item.sem === headTitle);
                }
                // Initialize or update the subject entry in the summaryData
                if (foundSubject) {
                  if (!summaryData[subject]) {
                    console.log('subcode inside', foundSubject.subCode)
                    summaryData[subject] = {
                      subCode: foundSubject.subCode,
                      count: 1,
                      faculties: [faculty],
                      subType: foundSubject.type,
                      rooms: [room],
                      subjectFullName: foundSubject.subjectFullName,
                      subSem: foundSubject.sem,
                    };
                    console.log('sum', summaryData[subject])
                  } else {
                    summaryData[subject].count++;
                    if (!summaryData[subject].faculties.includes(faculty)) {
                      summaryData[subject].faculties.push(faculty);
                    }

                    // Handle rooms
                    if (!summaryData[subject].rooms.includes(room)) {
                      summaryData[subject].rooms.push(room);
                    }

                  }
                }





              }
            });
          });
        }
      }
    }

    const mergedSummaryData = {};

    for (const key in summaryData) {
      const entry = summaryData[key];
      const subCode = entry.subCode;

      let isMerged = false;

      // Check against all existing entries in mergedSummaryData
      for (const existingKey in mergedSummaryData) {
        const existingEntry = mergedSummaryData[existingKey];

        if (
          entry.faculties.every(faculty => existingEntry.faculties.includes(faculty)) &&
          entry.subType === existingEntry.subType &&
          entry.subjectFullName === existingEntry.subjectFullName &&
          entry.rooms.every(room => existingEntry.rooms.includes(room))
        ) {
          // Merge the data
          existingEntry.count += entry.count;
          existingEntry.faculties = [...new Set([...existingEntry.faculties, ...entry.faculties])];
          existingEntry.originalKeys.push(key);
          isMerged = true;
          // Add any other merging logic as needed
          break; // Stop checking further if merged
        }
      }

      // If not merged, create a new entry
      if (!isMerged) {
        mergedSummaryData[key] = { ...entry, originalKeys: [key] };
      }
    }

    // Now, mergedSummaryData contains the merged entries with original keys
    // console.log('merged data', mergedSummaryData);

    const sortedSummary = Object.values(mergedSummaryData).sort((a, b) => {
      const subCodeComparison = a.subCode.localeCompare(b.subCode);

      if (subCodeComparison !== 0) {
        return subCodeComparison;
      }

      const subtypePriority = (subtype) => {
        switch (subtype.toLowerCase()) {
          case 'theory':
            return 0;
          case 'tutorial':
            return 1;
          case 'laboratory':
            return 2;
          default:
            return 3; // If there are other subtypes, place them at the end
        }
      };

      const aPriority = subtypePriority(a.subType);
      const bPriority = subtypePriority(b.subType);

      return aPriority - bPriority;
    });


    let sortedSummaryEntries = { ...sortedSummary }; // Assuming sortedSummary is an existing object


    if (commonLoad) {
      commonLoad.forEach((commonLoadItem) => {
        sortedSummaryEntries = {
          ...sortedSummaryEntries,
          [commonLoadItem.subCode]: {
            ...sortedSummaryEntries[commonLoadItem.subCode],
            count: commonLoadItem.hrs,
            faculties: [],
            originalKeys: [commonLoadItem.subName],
            rooms: [],
            subCode: commonLoadItem.subCode,
            subjectFullName: commonLoadItem.subFullName,
            subType: commonLoadItem.subType,
            subSem: commonLoadItem.sem,
            // code: commonLoadItem.code,
            // add other fields from commonLoadItem as needed
          },
        };
      });
    }

    console.log('summary dataaaa', sortedSummaryEntries)
    return sortedSummaryEntries;
  }

  const fetchDeptLoadAllocation = async () => {
    console.log("start")
    const subjectData = await fetchSubjectData(currentCode);

    const allFacultySummaries = [];
    const fetchedttdetails = await fetchTTData(currentCode);

    const filteredFaculties = await fetchDeptFaculty(currentCode);
    const facultyNames = [];

    for (const faculty of filteredFaculties) {
      facultyNames.push(faculty.name);
    }
    for (const faculty of facultyNames) {
      // console.log(faculty);        
      const { initialData, updateTime, notes } = await fetchFacultyData(currentCode, faculty);
      const fetchedttdata = initialData;
      const facultyNotes = notes;
      // console.log('dataaaa faculty',fetchedttdata);        
      const projectLoad = await fetchCommonLoad(currentCode, faculty)
      // const projectLoad='';            
      const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty', faculty, projectLoad);
      allFacultySummaries.push({ faculty, summaryData }); // Store the summary data in the array

      console.log(summaryData)
      const lockTime = updateTime;
      setHeaderStatus("fetchingHeadersFooters")
      const postData = {
        session: fetchedttdetails[0].session,
        name: faculty,
        type: 'faculty',
        timeTableData: fetchedttdata,
        summaryData: summaryData,
        updatedTime: lockTime,
        TTData: fetchedttdetails,
        headTitle: faculty,
      };
      // console.log(postData);
      // console.log('All Faculty Summaries:', allFacultySummaries);
      // setNoteStatus("fetchingNotes")


      // setTimetableData(fetchedttdata);
      // setSummaryData(summaryData);
      setType(type);
      // setUpdatedTime(lockTime);
      setHeadTitle(faculty);

    }
    console.log(allFacultySummaries)
    console.log("set")
    setTable(allFacultySummaries)
    setDupTable(allFacultySummaries)
    console.log("dup: ", dupTable)
    console.log("origin: ", table)
    semDropDown(allFacultySummaries)
    codeDropDown(allFacultySummaries)
    typeDropDown(allFacultySummaries)
    nameDropDown(allFacultySummaries)
    console.log(semDrop)
    // generateSummaryTablePDF(allFacultySummaries, filteredFaculties, fetchedttdetails[0].session, fetchedttdetails[0].dept)


  };
  function getDesignation(name) {
    let desig = ""
    deptFaculties.forEach(elem => { if (elem?.name == name) { desig = elem?.designation } })
    return desig;
  }
  function countRows(obj) {
    const arr = returnValue(obj);
    return arr.length;
  }

  function returnValue(loop) {
    let arr = [];
    let Tcount = 0
    for (let i in loop) {
      arr.push(loop[i])
    }
    for (let j in arr) {
      if (arr[j]?.["count"]) {
        Tcount = Tcount + arr[j]?.["count"];
      }
    }
    arr[0] = { ...arr[0], "Tcount": Tcount }
    return arr
  }
  function semDropDown(Table) {
    let drop = ["All"]
    Table.forEach((elem) => {
      for (let i in elem.summaryData) {

        let count = 0;
        drop.forEach((e) => {
          if (e == elem.summaryData[i]?.subSem) {
            count = 1
          }
        })
        if (count == 0) {
          drop.push(elem.summaryData[i].subSem)
        }
      }
    })
    setSemDrop(drop)
  }
  function codeDropDown(Table) {
    let drop = ["All"]
    Table.forEach((elem) => {
      for (let i in elem.summaryData) {

        let count = 0;
        drop.forEach((e) => {
          if (e == elem.summaryData[i]?.subCode) {
            count = 1
          }
        })
        if (count == 0) {
          drop.push(elem.summaryData[i].subCode)
        }
      }
    })
    setCodeDrop(drop)
  }
  function nameDropDown(Table) {
    let drop = ["All"]
    Table.forEach((elem) => {
      for (let i in elem.summaryData) {

        let count = 0;
        drop.forEach((e) => {
          if (e == elem.summaryData[i]?.subjectFullName) {
            count = 1
          }
        })
        if (count == 0) {
          drop.push(elem.summaryData[i].subjectFullName)
        }
      }
    })
    setNameDrop(drop)
  }
  function typeDropDown(Table) {
    let drop = ["All"]
    Table.forEach((elem) => {
      for (let i in elem.summaryData) {

        let count = 0;
        drop.forEach((e) => {
          if (e == elem.summaryData[i]?.subType) {
            count = 1
          }
        })
        if (count == 0) {
          drop.push(elem.summaryData[i].subType)
        }
      }
    })
    setTypDrop(drop)
  }


  function filterSem(e) {
    const value = e?.target?.value;
    setSem(value)
    let newTable = []
    console.log(newTable)
    dupTable.forEach((elem) => {
      let obj = {}
      let ct = 0;
      for (let i in elem.summaryData) {
        if ((elem.summaryData[i]?.subSem == value || value == "All") &&
          (elem.summaryData[i]?.subCode == code || code == "All") &&
          (elem.summaryData[i]?.subjectFullName == name || name == "All") &&
          (elem.summaryData[i]?.subType == typ || typ == "All")
        ) {
          obj[ct++] = elem.summaryData[i]
          console.log(obj)
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    console.log(newTable)
    console.log(dupTable)
    setTable(newTable)
  }


  function filterCode(e) {
    const value = e?.target?.value;
    setCode(value)
    let newTable = []
    console.log(newTable)
    dupTable.forEach((elem) => {
      let obj = {}
      let ct = 0;
      for (let i in elem.summaryData) {
        if ((elem.summaryData[i]?.subSem == sem || sem == "All") &&
          (elem.summaryData[i]?.subCode == value || value == "All") &&
          (elem.summaryData[i]?.subjectFullName == name || name == "All") &&
          (elem.summaryData[i]?.subType == typ || typ == "All")) {
          obj[ct++] = elem.summaryData[i]
          console.log(obj)
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    console.log(newTable)
    console.log(dupTable)
    setTable(newTable)
  }


  function filterSubName(e) {
    const value = e?.target?.value;
    setName(value)
    console.log(value)
    let newTable = []
    console.log(newTable)
    dupTable.forEach((elem) => {
      let obj = {}
      let ct = 0;
      for (let i in elem.summaryData) {
        if ((elem.summaryData[i]?.subSem == sem || sem == "All") &&
          (elem.summaryData[i]?.subCode == code || code == "All") &&
          (elem.summaryData[i]?.subjectFullName == value || value == "All") &&
          (elem.summaryData[i]?.subType == typ || typ == "All")) {
          obj[ct++] = elem.summaryData[i]
          console.log(obj)
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    console.log(newTable)
    console.log(dupTable)
    setTable(newTable)
  }


  function filterType(e) {
    const value = e?.target?.value;
    setTyp(value)
    let newTable = []
    console.log(newTable)
    dupTable.forEach((elem) => {
      let obj = {}
      let ct = 0;
      for (let i in elem.summaryData) {
        if ((elem.summaryData[i]?.subSem == sem || sem == "All") &&
          (elem.summaryData[i]?.subCode == code || code == "All") &&
          (elem.summaryData[i]?.subjectFullName == name || name == "All") &&
          (elem.summaryData[i]?.subType == value || value == "All")) {
          obj[ct++] = elem.summaryData[i]
          console.log(obj)
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    console.log(newTable)
    console.log(dupTable)
    setTable(newTable)
  }
  function downloadCSV(e){
    const newTab = table;
    let csv_data = [["Faculty Name","Designation","Semester","Subject Code","Subject Name","Type",'Hours']];
    newTab.forEach((elem) => {
      for (let i in elem.summaryData) {
        let csv_row = [elem.faculty,getDesignation(elem.faculty),elem.summaryData[i]?.subSem,elem.summaryData[i]?.subCode,elem.summaryData[i]?.subjectFullName,elem.summaryData[i]?.subType,elem.summaryData[i]?.count]
        csv_data.push(csv_row.join(","))
      }
    })
    csv_data=csv_data.join("\n")
    console.log(csv_data)
    let CSVFile = new Blob([csv_data], { type: "text/csv" });
    let temp_link = document.createElement('a');
    temp_link.download = "Dept Load Allocation.csv";
    let url = window.URL.createObjectURL(CSVFile);
    temp_link.href = url;
    temp_link.style.display = "none";
    document.body.appendChild(temp_link);
    temp_link.click();
    document.body.removeChild(temp_link);
  }
  return (
    <div className='tw-p-2'>
      <h1 className='tw-m-1 tw-p-2 tw-font-jakarta tw-text-2xl tw-font-extrabold tw-text-slate-800'>Department Load Allocation</h1>
      <div className='tw-w-full tw-flex tw-justify-center'><Button onClick={(e)=>{downloadCSV()}}>Download CSV</Button></div>
      <Table colorScheme='black'>
        <Tbody>
          <Tr>
            <Th>Faculty Name</Th>
            <Th>Designation</Th>
            <Th>Semester
              <Select className='tw-mt-1'
                value={sem}
                onChange={(e) => filterSem(e)}
              >
                {semDrop.map((elem) => (<option value={elem} key={elem}>{elem}</option>))}
              </Select>
            </Th>
            <Th>Subject Code
              <Select className='tw-mt-1'
                value={code}
                onChange={(e) => filterCode(e)}
              >
                {codeDrop.map((elem) => (<option value={elem} key={elem}>{elem}</option>))}
              </Select>
            </Th>
            <Th>Subject Name
              <Select className='tw-mt-1'
                value={name}
                onChange={(e) => filterSubName(e)}
              >
                {nameDrop.map((elem) => (<option value={elem} key={elem}>{elem}</option>))}
              </Select>
            </Th>
            <Th>Type
              <Select className='tw-mt-1'
                value={typ}
                onChange={(e) => filterType(e)}
              >
                {typDrop.map((elem) => (<option value={elem} key={elem}>{elem}</option>))}
              </Select>
            </Th>
            <Th>Hours</Th>
            <Th>Total Hours</Th>
          </Tr>

          {((sem != "All" || code != "All" || name != "All" || typ != "All") && !table.length && <Tr><Td className='tw-text-center' colSpan={8}>No Data</Td></Tr>) || (sem == "All" && code == "All" && name == "All" && typ == "All" && !table.length && <Tr><Td colSpan={8}>Fetching data..<Spinner /></Td></Tr>)}
          {table.map((row,i) => (
            returnValue(row.summaryData)?.map((elem, index) => (
              <Tr key={index} bgColor={i%2==0?"paleGreen":"lightCyan"}>
                {(index == 0 && <Td rowSpan={countRows(row.summaryData)}>{row.faculty}</Td>)}
                {index == 0 && <Td rowSpan={countRows(row.summaryData)}>{getDesignation(row.faculty)}</Td>}
                <Td>{elem.subSem}</Td>
                <Td>{elem.subCode}</Td>
                <Td>{elem.subjectFullName}</Td>
                <Td>{elem.subType}</Td>
                <Td>{elem.count}</Td>
                {index == 0 && <Td rowSpan={countRows(row.summaryData)}>{elem.Tcount}</Td>}
              </Tr>
            ))


          ))}
        </Tbody>
      </Table>
    </div>
  )
}

export default Departmentloadallocation
