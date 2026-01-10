import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import './Timetable.css';
import TimetableSummary from './ttsummary';
import ReactToPrint from 'react-to-print';
import { Container } from "@chakra-ui/layout";
import { 
  Heading, 
  VStack,
  Flex,
  Badge,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  AlertDescription,
  HStack,
} from '@chakra-ui/react';
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
import { DownloadIcon, SearchIcon, RepeatIcon } from '@chakra-ui/icons';
import { FaFilter } from 'react-icons/fa';
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

  // Reset filters function
  const resetFilters = () => {
    setSem("All");
    setCode("All");
    setName("All");
    setTyp("All");
    setTable(dupTable);
  };

  useEffect(() => {

    // getting all the semester values for this code.
    const fetchSem = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);
          setAvailableSems(semValues);
          setDownloadStatus("fetchingSemesters")
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
          setAvailableFaculties(data);
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

  // [All the fetch functions remain the same - keeping them as is for brevity]
  const fetchData = async (semester) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`, { credentials: 'include' });
      const data1 = await response.json();
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
      const response = await fetch(`${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`, { credentials: 'include' });
      const data = await response.json();
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
    setDownloadStatus("fetchingSummaryData")
    return { initialData, notes };
  };

  const facultyData = async (currentCode, faculty) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`, { credentials: 'include' });
      const data1 = await response.json();
      const data = data1.timetableData;
      const updateTime = data1.updatedTime;
      const notes = data1.notes;
      const initialData = generateInitialTimetableData(data, 'faculty');
      return { initialData, updateTime, notes };
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };

  const fetchFacultyData = async (currentCode, faculty) => {
    const { initialData, updateTime, notes } = await facultyData(currentCode, faculty);
    setSlotStatus('fetchingSlotData')
    return { initialData, updateTime, notes };
  };

  const roomData = async (currentCode, room) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`, { credentials: 'include' });
      const data1 = await response.json();
      const data = data1.timetableData;
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
              let faculty = "";
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
              let faculty = "";
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
                if (subj || room || faculty) {
                  slotSubjects.push({
                    subject: subj,
                    room: room,
                    faculty: faculty,
                  });
                }
              }

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
            initialData[day][`period${period}`].push([]);
          }
        }
      }

    }

    console.log("initial datat to be received", initialData);
    return initialData;
  };

  const fetchSubjectData = async (currentCode) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`);
      const data = await response.json();
      setSubjectData(data);
      return data
    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };

  const fetchTTData = async (currentCode) => {
    console.log('current code', currentCode)
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();
      setTTData(data);
      return data;
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
  };

  const fetchDeptFaculty = async (currentCode) => {
    try {
      const fetchedttdetails = await fetchTTData(currentCode);
      console.log('fetchedttdetails', fetchedttdetails)

      const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails?.dept}`, { credentials: 'include', });
      if (response.ok) {
        const data = await response.json();
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

    for (const day in timetableData) {
      for (let period = 1; period <= 9; period++) {
        let slots = ''
        if (period == 9) {
          slots = timetableData[day]['lunch'];
        }
        else {
          slots = timetableData[day][`period${period}`];
        }
        if (slots) {
          slots.forEach((slot) => {
            slot.forEach((cell) => {
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

      for (const existingKey in mergedSummaryData) {
        const existingEntry = mergedSummaryData[existingKey];

        if (
          entry.faculties.every(faculty => existingEntry.faculties.includes(faculty)) &&
          entry.subType === existingEntry.subType &&
          entry.subjectFullName === existingEntry.subjectFullName &&
          entry.rooms.every(room => existingEntry.rooms.includes(room))
        ) {
          existingEntry.count += entry.count;
          existingEntry.faculties = [...new Set([...existingEntry.faculties, ...entry.faculties])];
          existingEntry.originalKeys.push(key);
          isMerged = true;
          break;
        }
      }

      if (!isMerged) {
        mergedSummaryData[key] = { ...entry, originalKeys: [key] };
      }
    }

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
            return 3;
        }
      };

      const aPriority = subtypePriority(a.subType);
      const bPriority = subtypePriority(b.subType);

      return aPriority - bPriority;
    });

    let sortedSummaryEntries = { ...sortedSummary };

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
          },
        };
      });
    }

    console.log('summary dataaaa', sortedSummaryEntries)
    return sortedSummaryEntries;
  }

  const fetchDeptLoadAllocation = async () => {
    try {
      console.log("Fetching process started...");
      const subjectData = await fetchSubjectData(currentCode);
      const fetchedttdetails = await fetchTTData(currentCode);
      const filteredFaculties = await fetchDeptFaculty(currentCode);

      const facultyDataPromises = filteredFaculties.map(async (faculty) => {
        try {
          const facultyName = faculty.name;
          const [ttResult, projectLoad] = await Promise.all([
            fetchFacultyData(currentCode, facultyName),
            fetchCommonLoad(currentCode, facultyName)
          ]);

          const summaryData = generateSummary(
            ttResult.initialData,
            subjectData,
            'faculty',
            facultyName,
            projectLoad
          );

          return { faculty: facultyName, summaryData };
        } catch (err) {
          console.error(`Error processing faculty ${faculty.name}:`, err);
          return null;
        }
      });

      const results = await Promise.all(facultyDataPromises);
      const allFacultySummaries = results.filter(res => res !== null);

      setTable(allFacultySummaries);
      setDupTable(allFacultySummaries);

      semDropDown(allFacultySummaries);
      codeDropDown(allFacultySummaries);
      typeDropDown(allFacultySummaries);
      nameDropDown(allFacultySummaries);

      console.log("Fetching complete.");
    } catch (error) {
      console.error("Critical error in fetchDeptLoadAllocation:", error);
    }
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
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    setTable(newTable)
  }

  function filterCode(e) {
    const value = e?.target?.value;
    setCode(value)
    let newTable = []
    dupTable.forEach((elem) => {
      let obj = {}
      let ct = 0;
      for (let i in elem.summaryData) {
        if ((elem.summaryData[i]?.subSem == sem || sem == "All") &&
          (elem.summaryData[i]?.subCode == value || value == "All") &&
          (elem.summaryData[i]?.subjectFullName == name || name == "All") &&
          (elem.summaryData[i]?.subType == typ || typ == "All")) {
          obj[ct++] = elem.summaryData[i]
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    setTable(newTable)
  }

  function filterSubName(e) {
    const value = e?.target?.value;
    setName(value)
    let newTable = []
    dupTable.forEach((elem) => {
      let obj = {}
      let ct = 0;
      for (let i in elem.summaryData) {
        if ((elem.summaryData[i]?.subSem == sem || sem == "All") &&
          (elem.summaryData[i]?.subCode == code || code == "All") &&
          (elem.summaryData[i]?.subjectFullName == value || value == "All") &&
          (elem.summaryData[i]?.subType == typ || typ == "All")) {
          obj[ct++] = elem.summaryData[i]
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    setTable(newTable)
  }

  function filterType(e) {
    const value = e?.target?.value;
    setTyp(value)
    let newTable = []
    dupTable.forEach((elem) => {
      let obj = {}
      let ct = 0;
      for (let i in elem.summaryData) {
        if ((elem.summaryData[i]?.subSem == sem || sem == "All") &&
          (elem.summaryData[i]?.subCode == code || code == "All") &&
          (elem.summaryData[i]?.subjectFullName == name || name == "All") &&
          (elem.summaryData[i]?.subType == value || value == "All")) {
          obj[ct++] = elem.summaryData[i]
        }
      }
      if (ct > 0) {
        newTable.push({
          faculty: elem.faculty,
          summaryData: obj
        })
      }
    })
    setTable(newTable)
  }

  function downloadCSV(e) {
    const newTab = table;
    let csv_data = [["Faculty Name", "Designation", "Semester", "Subject Code", "Subject Name", "Type", "Hours", "Total Hours"]];

    newTab.forEach((elem) => {
      const summaryArray = returnValue(elem.summaryData);

      summaryArray.forEach((summaryRow, index) => {

        const facultyName = index === 0 ? elem.faculty : "";
        const designation = index === 0 ? getDesignation(elem.faculty) : "";
        const totalHours = index === 0 ? summaryRow.Tcount : "";

        const csv_row = [
          `"${facultyName}"`,
          `"${designation}"`,
          `"${summaryRow?.subSem || ""}"`,
          `"${summaryRow?.subCode || ""}"`,
          `"${summaryRow?.subjectFullName || ""}"`,
          `"${summaryRow?.subType || ""}"`,
          `"${summaryRow?.count || 0}"`,
          `"${totalHours}"`
        ];

        csv_data.push(csv_row.join(","));
      });
    });

    const csv_string = csv_data.join("\n");
    let CSVFile = new Blob([csv_string], { type: "text/csv;charset=utf-8;" });
    let temp_link = document.createElement('a');
    temp_link.download = "Dept_Load_Allocation.csv";
    let url = window.URL.createObjectURL(CSVFile);
    temp_link.href = url;
    temp_link.style.display = "none";
    document.body.appendChild(temp_link);
    temp_link.click();
    document.body.removeChild(temp_link);
  }

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header Section */}
      <Box
        bgGradient="linear(to-r, cyan.400, teal.500, green.500)"
        pt={0}
        pb={{ base: 16, md: 20, lg: 24 }}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.1"
          bgImage="radial-gradient(circle, white 1px, transparent 1px)"
          bgSize="30px 30px"
        />

        {/* Header/Navbar integrated into hero */}
        <Box
          position="relative"
          zIndex={2}
          sx={{
            '& button[aria-label="Go back"]': { display: "none" },
            '& .chakra-button:first-of-type': { display: "none" },
          }}
        >
          <Header />
        </Box>

        <Container
          maxW="7xl"
          position="relative"
          mt={{ base: 4, md: 6, lg: 8 }}
          px={{ base: 4, md: 6, lg: 8 }}
        >
          <Flex
            direction={{ base: "column", lg: "row" }}
            justify="space-between"
            align={{ base: "stretch", lg: "center" }}
            w="full"
            gap={{ base: 6, md: 6, lg: 4 }}
          >
            <VStack
              spacing={{ base: 3, md: 4 }}
              align={{ base: "center", lg: "start" }}
              flex="1"
              textAlign={{ base: "center", lg: "left" }}
            >
              <Badge
                colorScheme="whiteAlpha"
                fontSize={{ base: "xs", md: "sm" }}
                px={{ base: 2, md: 3 }}
                py={1}
                borderRadius="full"
              >
                Load Management
              </Badge>
              <Heading
                size={{ base: "xl", md: "2xl" }}
                color="white"
                fontWeight="bold"
                lineHeight="1.2"
              >
                Department Load Allocation
              </Heading>
              <Text
                color="whiteAlpha.900"
                fontSize={{ base: "md", md: "lg" }}
                maxW={{ base: "full", lg: "2xl" }}
              >
                View and manage faculty workload distribution across subjects and semesters
              </Text>
            </VStack>

            {/* Download Button */}
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="whiteAlpha"
              bg="rgba(255, 255, 255, 0.2)"
              color="white"
              size={{ base: "md", md: "lg" }}
              onClick={downloadCSV}
              _hover={{ bg: "rgba(255, 255, 255, 0.3)" }}
              _active={{ bg: "rgba(255, 255, 255, 0.4)" }}
              borderRadius="full"
              boxShadow="lg"
              border="2px solid"
              borderColor="whiteAlpha.400"
              alignSelf={{ base: "stretch", lg: "center" }}
            >
              Download CSV
            </Button>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16} px={{ base: 4, md: 6, lg: 8 }}>
        <VStack spacing={6} align="stretch">
          {/* Filters Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="purple.600" color="white" p={4}>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <HStack spacing={2}>
                  <FaFilter />
                  <Heading size="md">Filters</Heading>
                </HStack>
                <Button
                  leftIcon={<RepeatIcon />}
                  size="sm"
                  colorScheme="whiteAlpha"
                  bg="rgba(255, 255, 255, 0.2)"
                  color="white"
                  onClick={resetFilters}
                  _hover={{ bg: "rgba(255, 255, 255, 0.3)" }}
                  _active={{ bg: "rgba(255, 255, 255, 0.4)" }}
                  borderRadius="md"
                >
                  Reset Filters
                </Button>
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700" fontSize="sm">
                    Semester
                  </FormLabel>
                  <Select
                    value={sem}
                    onChange={filterSem}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 1px #805AD5",
                    }}
                    size="md"
                  >
                    {semDrop.map((elem) => (
                      <option value={elem} key={elem}>{elem}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700" fontSize="sm">
                    Subject Code
                  </FormLabel>
                  <Select
                    value={code}
                    onChange={filterCode}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 1px #805AD5",
                    }}
                    size="md"
                  >
                    {codeDrop.map((elem) => (
                      <option value={elem} key={elem}>{elem}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700" fontSize="sm">
                    Subject Name
                  </FormLabel>
                  <Select
                    value={name}
                    onChange={filterSubName}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 1px #805AD5",
                    }}
                    size="md"
                  >
                    {nameDrop.map((elem) => (
                      <option value={elem} key={elem}>{elem}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700" fontSize="sm">
                    Type
                  </FormLabel>
                  <Select
                    value={typ}
                    onChange={filterType}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 1px #805AD5",
                    }}
                    size="md"
                  >
                    {typDrop.map((elem) => (
                      <option value={elem} key={elem}>{elem}</option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Data Table Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="teal.600" color="white" p={4}>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <Heading size="md">Faculty Load Distribution</Heading>
                <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                  {table.length} Faculty
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody p={0}>
              {((sem != "All" || code != "All" || name != "All" || typ != "All") && !table.length) ? (
                <Box p={6}>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                      No data found matching the selected filters. Try adjusting your filter criteria.
                    </AlertDescription>
                  </Alert>
                </Box>
              ) : (sem == "All" && code == "All" && name == "All" && typ == "All" && !table.length) ? (
                <Box p={12} textAlign="center">
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="teal.500"
                    size="xl"
                  />
                  <Text mt={4} color="gray.600">Fetching department load data...</Text>
                </Box>
              ) : (
                <Box
                  overflowX="auto"
                  w="100%"
                  sx={{
                    '&::-webkit-scrollbar': {
                      height: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'gray.100',
                      borderRadius: 'full',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'teal.400',
                      borderRadius: 'full',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: 'teal.500',
                    },
                  }}
                >
                  <Table 
                    variant="simple" 
                    size={{ base: "sm", md: "md" }}
                    colorScheme="gray"
                    sx={{
                      tableLayout: "fixed",
                      width: "100%",
                    }}
                  >
                    <Thead bg="teal.50">
                      <Tr>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "15%", md: "12%" }}
                        >
                          Faculty Name
                        </Th>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "10%", md: "8%" }}
                        >
                          Designation
                        </Th>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "12%", md: "10%" }}
                        >
                          Sem
                        </Th>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "12%", md: "10%" }}
                        >
                          Subject Code
                        </Th>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "15%", md: "15%" }}
                        >
                          Subject Name
                        </Th>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "12%", md: "10%" }}
                        >
                          Type
                        </Th>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "10%", md: "8%" }}
                        >
                          Hours
                        </Th>
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          width={{ base: "10%", md: "8%" }}
                        >
                          Total Hours
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {table.map((row, i) => (
                        returnValue(row.summaryData)?.map((elem, index) => (
                          <Tr
                            key={`${i}-${index}`}
                            bg={i % 2 == 0 ? "green.50" : "cyan.50"}
                            _hover={{ bg: "teal.100" }}
                            transition="background 0.2s"
                          >
                            {index == 0 && (
                              <Td 
                                rowSpan={countRows(row.summaryData)} 
                                fontWeight="bold"
                                fontSize={{ base: "xs", md: "sm" }}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                p={{ base: 2, md: 3 }}
                              >
                                {row.faculty}
                              </Td>
                            )}
                            {index == 0 && (
                              <Td 
                                rowSpan={countRows(row.summaryData)}
                                fontSize={{ base: "xs", md: "sm" }}
                                p={{ base: 2, md: 3 }}
                              >
                                <Badge 
                                  colorScheme="blue" 
                                  fontSize="xs" 
                                  px={2} 
                                  py={1}
                                  whiteSpace="normal"
                                  wordBreak="break-word"
                                  textAlign="center"
                                  display="block"
                                >
                                  {getDesignation(row.faculty)}
                                </Badge>
                              </Td>
                            )}
                            <Td 
                              fontSize={{ base: "xs", md: "sm" }}
                              p={{ base: 2, md: 3 }}
                            >
                              <Badge 
                                colorScheme="purple" 
                                fontSize="xs" 
                                px={2} 
                                py={1}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                textAlign="center"
                                display="block"
                              >
                                {elem.subSem}
                              </Badge>
                            </Td>
                            <Td 
                              fontSize={{ base: "xs", md: "sm" }}
                              whiteSpace="normal"
                              wordBreak="break-word"
                              p={{ base: 2, md: 3 }}
                            >
                              {elem.subCode}
                            </Td>
                            <Td 
                              fontSize={{ base: "xs", md: "sm" }}
                              whiteSpace="normal"
                              wordBreak="break-word"
                              p={{ base: 2, md: 3 }}
                            >
                              {elem.subjectFullName}
                            </Td>
                            <Td 
                              fontSize={{ base: "xs", md: "sm" }}
                              p={{ base: 2, md: 3 }}
                            >
                              <Badge 
                                colorScheme={
                                  elem.subType?.toLowerCase() === 'theory' ? 'green' : 
                                  elem.subType?.toLowerCase() === 'tutorial' ? 'orange' : 
                                  'red'
                                } 
                                fontSize="xs" 
                                px={2} 
                                py={1}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                textAlign="center"
                                display="block"
                              >
                                {elem.subType}
                              </Badge>
                            </Td>
                            <Td 
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="semibold"
                              textAlign="center"
                              p={{ base: 2, md: 3 }}
                            >
                              {elem.count}
                            </Td>
                            {index == 0 && (
                              <Td 
                                rowSpan={countRows(row.summaryData)} 
                                fontWeight="bold"
                                fontSize={{ base: "xs", md: "sm" }}
                                bg="yellow.100"
                                textAlign="center"
                                p={{ base: 2, md: 3 }}
                              >
                                {elem.Tcount}
                              </Td>
                            )}
                          </Tr>
                        ))
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

export default Departmentloadallocation;