import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import { useNavigate, useLocation, Form, Link } from "react-router-dom";
import getEnvironment from "../getenvironment";
import ViewTimetable from "./viewtt";
import TimetableSummary from "./ttsummary";
import "./Timetable.css";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormLabel, Heading, Select, UnorderedList, ListItem ,Input, Spinner, List,Flex} from "@chakra-ui/react";
import { keyframes } from '@emotion/react';
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomPlusButton,
  CustomDeleteButton,
} from "../styles/customStyles";
import { Box, Text, HStack, Center, Portal, ChakraProvider, Spacer } from "@chakra-ui/react";

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
import Header from "../components/header";
import { Helmet } from "react-helmet-async";
import debounce from 'lodash.debounce';


// import PDFViewTimetable from '../filedownload/chakrapdf'

function MasterView() {
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [semNotes, setSemNotes] = useState([]);
  const [facultyNotes, setFacultyNotes] = useState([]);
  const [roomNotes, setRoomNotes] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [commonLoad, setCommonLoad] = useState();

  const apiUrl = getEnvironment();
  // const navigate = useNavigate();
  // const currentURL = window.location.pathname;
  // const parts = currentURL.split("/");
  // const currentCode = parts[parts.length - 2];


  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [lockedTime, setLockedTime] = useState();
  const [facultyLockedTime, setFacultyLockedTime] = useState();
  const [roomlockedTime, setRoomLockedTime] = useState();

  const [allsessions, setAllSessions] = useState([]);
  const [availableDepts, setAvailableDepts] = useState([]);
  const [currentCode, setCurrentCode] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const facultySectionRef = useRef(null);

  const semesters = availableSems;

//   const glowingBorder = keyframes`
//   0% { border-color: #ff4b2b; box-shadow: 0 0 5px #ff4b2b; }
//   25% { border-color: #ff416c; box-shadow: 0 0 8px #ff416c; }
//   50% { border-color: #6a82fb; box-shadow: 0 0 10px #6a82fb; }
//   75% { border-color: #21d4fd; box-shadow: 0 0 8px #21d4fd; }
//   100% { border-color: #ff4b2b; box-shadow: 0 0 5px #ff4b2b; }
// `;
const softGlow = keyframes`
  0% {
    border-color: #a78bfa;  /* Soft Purple */
    box-shadow: 0 0 10px #d6bffb;
  }
  25% {
    border-color: #38bdf8;  /* Sky Blue */
    box-shadow: 0 0 10px #a1e3fc;
  }
  50% {
  border-color: #ffe0ac;  /* Light Apricot */
    box-shadow: 0 0 10px #fff1cc;
    
  }
  75% {
    border-color: #34d399;  /* Mint Green */
    box-shadow: 0 0 10px #bafce4;
  }
  100% {
    border-color: #a78bfa;  /* Back to Soft Purple */
    box-shadow: 0 0 10px #d6bffb;
  }
`;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        // console.log(data)
        const { uniqueSessions, uniqueDept } = data;

        setAllSessions(uniqueSessions.map(s => s.session));
        setAvailableDepts(uniqueDept);

        // console.log('Received session data:', uniqueSessions);
        // console.log('Received department data:', uniqueDept);
        const currentSessionObj = uniqueSessions.find(s => s.currentSession);
        if (currentSessionObj) {
          setSelectedSession(currentSessionObj.session);
        } else if (uniqueSessions.length > 0) {
          setSelectedSession(uniqueSessions[0].session); // Set the first available session if none is marked as current
        }


      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
      }
    };

    fetchSessions();
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    const fetchCode = async (session, dept) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/getcode/${session}/${dept}`,
          { credentials: "include" }
        );
        const data1 = await response.json();
        console.log("received code:",data1);

        setCurrentCode(data1)
        // setAvailableDepts(dept)
        // console.log('received code:',data1)

        // console.log('received dept data:',dept)

      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    }
    fetchCode(selectedSession, selectedDept);
  }, [selectedSession, selectedDept])


  useEffect(() => {
    const fetchData = async (semester, currentCode) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`,
          { credentials: "include" }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setSemNotes(data1.notes)
        // console.log('data received from...',data);
        const initialData = generateInitialTimetableData(data, "sem");
        setViewData(initialData);
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };

    const fetchViewData = async (semester, currentCode) => {
      // console.log('selected sem',semester)
      // console.log('selected code',currentCode)

      const data = await fetchData(semester, currentCode);
      // console.log('returned data after fetch', data)
    };
    fetchViewData(selectedSemester, currentCode);
  }, [selectedSemester]);

  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/lockfacultytt/${currentCode}/${faculty}`,
          { credentials: "include" }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setFacultyLockedTime(data1.updatedTime);
        setFacultyNotes(data1.notes);
        const initialData = generateInitialTimetableData(data, "faculty");
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };

    const fetchFacultyData = async (faculty) => {
      const data = await facultyData(currentCode, faculty);
      setViewFacultyData(data);
    };

    const fetchCommonLoad = async (currentCode, viewFaculty) => {
      try {
        const response = await fetch(

          `${apiUrl}/timetablemodule/commonLoad/${currentCode}/${viewFaculty}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          // console.log('faculty response',data[0]);
          setCommonLoad(data);
          // console.log('coomomo load', data);
        }
      } catch (error) {
        console.error("Error fetching commonload:", error);
      }
    };
    fetchCommonLoad(currentCode, selectedFaculty); // Call the function to fetch subject data
    fetchFacultyData(selectedFaculty);
  }, [currentCode, selectedFaculty]);

  useEffect(() => {
    const roomData = async (currentCode, room) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/lockroomtt/${currentCode}/${room}`,
          { credentials: "include" }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setRoomLockedTime(data1.updatedTime);
        setRoomNotes(data1.notes);
        const initialData = generateInitialTimetableData(data, "room");
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };

    const fetchRoomData = async (currentCode, room) => {
      const data = await roomData(currentCode, room);
      setViewRoomData(data);
    };

    fetchRoomData(currentCode, selectedRoom);
  }, [selectedRoom]);

  useEffect(() => {
    const fetchSem = async (currentCode) => {
      try {
        // console.log('currentcode used for',currentCode)
        const response = await fetch(
          `${apiUrl}/timetablemodule/addsem?code=${currentCode}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          // console.log(data)
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);
          // console.log('filtered semester data', filteredSems)

          setAvailableSems(semValues);
          // console.log('available semesters',availableSems)
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    };

    const fetchRoom = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addroom?code=${currentCode}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((room) => room.code === currentCode);
          const semValues = filteredSems.map((room) => room.room);

          setAvailableRooms(semValues);
          // console.log('available rooms',availableRooms)
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    };

    const fetchFaculty = async (currentCode) => {
      try {
        // console.log('Fetching faculty');
        const fetchedttdetails = await fetchTTData(currentCode);
        // console.log("fetchedttdetails", fetchedttdetails)
        const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails.dept}`, { credentials: 'include', });
        // console.log("response in fetchfaculty",response)
        if (response.ok) {
          const data = await response.json();
          
          const facultydata = data.map(faculty => faculty.name);
          // console.log('faculty data',data);

          // console.log('faculty response',data);
          setAvailableFaculties(facultydata);
          // console.log('deptfaculties', facultydata);
          return data;
        }

      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchTime = async () => {
      try {
        // console.log('sem value',semester);
        // console.log('current code', currentCode);
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,
          { credentials: "include" }
        );
        const data = await response.json();
        setLockedTime(data.updatedTime.lockTimeIST);
        // setSavedTime( data.updatedTime.saveTimeIST)
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
      }
    };

    fetchSem(currentCode);
    fetchRoom();
    fetchTime();
    fetchFaculty(currentCode); // Call the function to fetch subject data
  }, [apiUrl, currentCode, selectedSemester, selectedFaculty, selectedRoom]);

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
      console.log('ttdata---recent',data)
      setTTData(data);
      return data;
      //   
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
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

                if (slotSubjects.length > 0) {
                  initialData[day]['lunch'].push(slotSubjects);
                }
              }
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

    // console.log("initial datat to be received",initialData);
    return initialData;
  };


  // const navigate view= useNavigate();

  const handleDownloadClick = () => {
    const pathArray = window.location.pathname
      .split("/")
      .filter((part) => part !== "");
    const pathExceptLastPart = `/${pathArray.slice(0, -1).join("/")}`;
    const pdfUrl = `${pathExceptLastPart}/generatepdf`;
    window.location.href = pdfUrl;
  };

  const handleFacultyClick = async (faculty) => {
  const { name, dept } = faculty;

  
  setSelectedDept(dept);

  
  setTimeout(() => {
    setSelectedFaculty(name);
     setTimeout(() => {
      if (facultySectionRef.current) {
        const y = facultySectionRef.current.getBoundingClientRect().top + window.pageYOffset;

        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
      }
    }, 100);
   
  }, 300); // enough delay to allow currentCode to update
  // setQuery(""); // Clear the search query after selection
  setSuggestions([]); // Clear suggestions after selection

};



  const [subjectData, setSubjectData] = useState([]); // Initialize as an empty array
  const [TTData, setTTData] = useState([]); // Initialize as an empty array

  useEffect(() => {
    const fetchSubjectData = async (currentCode) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`,
          { credentials: "include" }
        );
        const data = await response.json();
        // console.log('subject data is  ',data)
        setSubjectData(data);
        // console.log('subjectdata',data)
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };



    fetchSubjectData(currentCode);
    fetchTTData(currentCode);


  }, [currentCode]);

  // const handleRoomClick = () => {
  //   const pathArray = window.location.pathname
  //     .split("/")
  //     .filter((part) => part !== "");
  //   const pathExceptLastPart = `/${pathArray.slice(0, -1).join("/")}`;
  //   const pdfUrl = `${pathExceptLastPart}/viewmrooms`;
  //   window.location.href = pdfUrl;
  // };

  const fetchSuggestions = useRef(
    debounce(async (q) => {
      if (!q) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/timetablemodule/faculty/search?q=${encodeURIComponent(q)}`, {
          credentials: "include",
        });
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Error fetching faculty:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  



  return (
    <>
      <Helmet>
        <title>Time Table | XCEED NITJ</title>
        <meta name='description' content="NITJ's official time table search engine for all semesters and courses" />
      </Helmet>
      <Container maxW="7xl">
        <Header title="View TimeTable "></Header>
        {/* <div className="tw-flex tw-flex-col md:tw-flex-row items-center gap-2"> */}
        <Flex direction={{ base: 'column', md: 'row' }} align={{base:"flex-start",md:"center"}} justify="flex-start"   gap={2} wrap="wrap">
          {/* Empty spacer to push the button to the right */}
          {/* <Box flex="" /> */}
          <Link
            to='/tt/masterdata'
          >
            <Button colorScheme="purple" style={{ marginRight: 'auto', background:'darkred' }}>
              Slot wise master search
            </Button>
          </Link>
          <Link
            to='/tt/commonslot'
          >
            <Button colorScheme="blue" style={{ marginRight: 'auto',background:'darkblue' }}>
              Search Meet-Slot
            </Button>
          </Link>
          {/* <Spacer /> */}
          <Box flex="1" style={{ width: "100%", marginRight: "", position: 'relative', zIndex: '5' }}>

           <Input
            style={{ backgroundColor: 'white', borderRadius: '5px', padding: '10px', border: '1px solid #ccc' ,height:'45px'}}
            placeholder="Type faculty name "
            value={query}
            onChange={(e) => {
                const value = e.target.value;
                setQuery(value)
                fetchSuggestions(value);
            }}
             sx={{
                 backgroundColor: 'white',
                 borderRadius: '5px',
                 padding: '10px',
                 height: '45px',
                 border: '2px solid',
                //  animation: `${glowingBorder} 3s infinite`,
                animation: `${softGlow} 20s infinite ease-in-out`,
                transition: 'box-shadow 5s ease-in-out',
                 
                }}
           />
      {loading && <Spinner mt={2} style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)' , zIndex: '11' }} />}
      <List spacing={2} mt={4} style={{ maxHeight: '200px', overflowY: 'auto',width:'100%' ,position:'absolute',zIndex:'10',backgroundColor:'white' }} >
        {suggestions.map((faculty) => (
          <ListItem onClick={() => handleFacultyClick(faculty)} _hover={{ backgroundColor: 'gray.100' ,cursor:'pointer'}} key={faculty._id} p={2} borderWidth="1px" borderRadius="md">
            <Text fontWeight="bold">{faculty.name}</Text>
            <Text fontSize="sm" color="gray.600">{faculty.dept}</Text>
            {/* <Button color="blue.500" onClick={() => handleFacultyClick(faculty)} >
              View Timetable
            </Button> */}
          </ListItem>
        ))}
      </List></Box>


          <Link
            to='/classrooms'
          >
            <Button colorScheme="green" style={{ marginRight: 'auto',background:"darkgreen" }}>
              Geo Locate Classrooms
            </Button>
          </Link>
        {/* </div> */}
        </Flex>
        <FormLabel fontWeight="bold">Select Session:
        </FormLabel>

        <Select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          isRequired
        >
          {/* <option value="">Select Session</option> */}
          {allsessions.map((session, index) => (
            <option key={index} value={session}>
              {session}
            </option>
          ))}
        </Select>

        <FormLabel fontWeight="bold">Select Department:
        </FormLabel>

        <Select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          isRequired
        >
          <option value="">Select Department</option>
          {availableDepts.map((dept, index) => (
            <option key={index} value={dept}>
              {dept}
            </option>
          ))}
        </Select>


        {selectedSession === '' || selectedDept === '' ? (
          <Text color="red">Please select Session and Department to proceed further.</Text>
        ) : (
          <>
            <Container maxW="6xl">
              <Center my={4}>
                <Text color="blue">Select semester (or) faculty (or) room to view the time table</Text>
              </Center>
              <FormControl>
                <FormLabel fontWeight="bold">View Semester timetable:
                </FormLabel>

                <Select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester, index) => (
                    <option key={index} value={semester}>
                      {semester}
                    </option>
                  ))}
                </Select>
                <Box mb='5'>
                  {selectedSemester ? (
                    <Box>
                      <Text color="green" style={{ fontWeight: '700' }} id="saveTime" mb="2.5" mt="2.5">
                        Last saved on: {lockedTime ? lockedTime : "Not saved yet"}
                      </Text>
                      <ViewTimetable timetableData={viewData} />
                       {(Array.isArray(subjectData)&&subjectData.length>0) ?(<TimetableSummary
                        timetableData={viewData}
                        type={"sem"}
                        code={currentCode}
                        time={lockedTime}
                        headTitle={selectedSemester}
                        subjectData={subjectData}
                        TTData={TTData}
                        notes={semNotes}
                      />):<Text style={{ fontWeight: '700' , color: 'red' }}>Loading TimeTable Summary...</Text>}
                       {/* <TimetableSummary
                        timetableData={viewData}
                        type={"sem"}
                        code={currentCode}
                        time={lockedTime}
                        headTitle={selectedSemester}
                        subjectData={subjectData}
                        TTData={TTData}
                        notes={semNotes}
                      /> */}
                      <Box>
                        {semNotes.length > 0 ? (
                          <div>
                            <Text fontSize="xl" fontWeight="bold">
                              Notes:
                            </Text>
                            {semNotes.map((noteArray, index) => (
                              <UnorderedList key={index}>
                                {noteArray.map((note, noteIndex) => (
                                  <ListItem key={noteIndex}>{note}</ListItem>
                                ))}
                              </UnorderedList>
                            ))}
                          </div>
                        ) : (
                          <Text>No notes added for this selection.</Text>
                        )}
                      </Box>



                    </Box>
                    // {semNotes? <p>semNotes</p>:null}          
                  ) : (
                    <Text>Please select a Semester from the dropdown.</Text>
                  )}
                </Box>
                <Center my={4}>
                  <Text style={{ fontWeight: '800', color: "#394870", fontSize: 'large' }}>or</Text>
                </Center>
                {/* Faculty Dropdown */}
                <FormControl ref={facultySectionRef}>
                  <FormLabel fontWeight='bold'>View Faculty timetable</FormLabel>
                  <Select
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                  >
                    <option value="">Select Faculty</option>
                    {availableFaculties.map((faculty, index) => (
                      <option key={index} value={faculty}>
                        {faculty}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Box mb='5'>
                  {selectedFaculty ? (
                    <Box>
                      <Text color="green" style={{ fontWeight: '700' }} id="saveTime" mb='2.5' mt='2.5'>
                        Last saved on:{" "}
                        {facultyLockedTime ? facultyLockedTime : "Not saved yet"}
                      </Text>

                      <ViewTimetable timetableData={viewFacultyData} />
                      {/* <TimetableSummary
                        timetableData={viewFacultyData}
                        type={"faculty"}
                        code={currentCode}
                        time={facultyLockedTime}
                        headTitle={selectedFaculty}
                        subjectData={subjectData}
                        TTData={TTData}
                        notes={facultyNotes}
                        commonLoad={commonLoad}
                      /> */}
                      {(Array.isArray(subjectData) && subjectData.length > 0) ? (
                          <TimetableSummary
                            timetableData={viewFacultyData}
                            type={"faculty"}
                            code={currentCode}
                            time={facultyLockedTime}
                            headTitle={selectedFaculty}
                            subjectData={subjectData}
                            TTData={TTData}
                            notes={facultyNotes}
                            commonLoad={commonLoad}
                          />
                       ):<Text style={{ fontWeight: '700' , color: 'red' }}>Loading TimeTable Summary...</Text>}
                      {/* <CustomBlueButton onClick={() => generatePDF(viewFacultyData)}>Generate PDF</CustomBlueButton> */}
                      {/* <PDFViewTimetable timetableData={viewFacultyData} /> */}
                      {/* <TimetableSummary timetableData={viewFacultyData} type={'faculty'}/>  */}
                      <Box>
                        {facultyNotes.length > 0 ? (
                          <div>
                            <Text fontSize="xl" fontWeight="bold">
                              Notes:
                            </Text>
                            {facultyNotes.map((noteArray, index) => (
                              <UnorderedList key={index}>
                                {noteArray.map((note, noteIndex) => (
                                  <ListItem key={noteIndex}>{note}</ListItem>
                                ))}
                              </UnorderedList>
                            ))}
                          </div>
                        ) : (
                          <Text>No notes added for this selection.</Text>
                        )}
                      </Box>


                    </Box>
                  ) : (
                    <Text>Please select a faculty from the dropdown.</Text>
                  )}
                </Box>
                <Center my={4}>
                  <Text style={{ fontWeight: '800', color: "#394870", fontSize: 'large' }}>or</Text>
                </Center>

                <FormControl>
                  <FormLabel fontWeight='bold' >View Room timetable</FormLabel>
                  {/* Room Dropdown */}
                  <Select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                  >
                    <option value="">Select Room</option>
                    {availableRooms.map((room, index) => (
                      <option key={index} value={room}>
                        {room}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Box mb='5'>
                  {selectedRoom ? (
                    <Box>
                      <Text color="black" id="saveTime" mb='2.5' mt='2.5'>
                        Last saved on: {roomlockedTime ? roomlockedTime : "Not saved yet"}
                      </Text>

                      <ViewTimetable timetableData={viewRoomData} />
                      {/* <TimetableSummary timetableData={viewFacultyData} type={'faculty'} code={currentCode}/>  */}

                     {(Array.isArray(subjectData) && subjectData.length > 0) ? (
                       <TimetableSummary
                        timetableData={viewRoomData}
                        type={'room'}
                        code={currentCode}
                        time={roomlockedTime}
                        headTitle={selectedRoom}
                        subjectData={subjectData}
                        TTData={TTData}
                        notes={roomNotes}

                      />
                     ):<Text style={{ fontWeight: '700' , color: 'red' }}>Loading TimeTable Summary...</Text>}
                      {/* <TimetableSummary
                        timetableData={viewRoomData}
                        type={'room'}
                        code={currentCode}
                        time={roomlockedTime}
                        headTitle={selectedRoom}
                        subjectData={subjectData}
                        TTData={TTData}
                        notes={roomNotes}

                      /> */}
                      <Box>
                        {roomNotes.length > 0 ? (
                          <div>
                            <Text fontSize="xl" fontWeight="bold">
                              Notes:
                            </Text>
                            {roomNotes.map((noteArray, index) => (
                              <UnorderedList key={index}>
                                {noteArray.map((note, noteIndex) => (
                                  <ListItem key={noteIndex}>{note}</ListItem>
                                ))}
                              </UnorderedList>
                            ))}
                          </div>
                        ) : (
                          <Text>No notes added for this selection.</Text>
                        )}
                      </Box>



                    </Box>
                  ) : (
                    <Text>Please select a Room from the dropdown.</Text>
                  )}
                </Box>
                <Box height="200px" />
                {/* spacer to have scorllable space */}
              </FormControl>
            </Container>

          </>
        )}

      </Container>
    </>

  );
}

export default MasterView;

