import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useNavigate, useLocation, Form } from "react-router-dom";
import getEnvironment from "../getenvironment";
import ViewTimetable from "./viewtt";
import TimetableSummary from "./ttsummary";
import "./Timetable.css";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormLabel, Heading, Select , UnorderedList, ListItem } from "@chakra-ui/react";
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomPlusButton,
  CustomDeleteButton,
} from "../styles/customStyles";
import { Box, Text, Portal, ChakraProvider } from "@chakra-ui/react";

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

// import PDFViewTimetable from '../filedownload/chakrapdf'

function InstituteLoad() {
  // const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  // const [viewRoomData, setViewRoomData] = useState({});
  // const [semNotes, setSemNotes] = useState([]);
  // const [facultyNotes, setFacultyNotes] = useState([]);
  // const [roomNotes, setRoomNotes] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [commonLoad, setCommonLoad]=useState();

  const apiUrl = getEnvironment();
  // const navigate = useNavigate();
  // const currentURL = window.location.pathname;
  // const parts = currentURL.split("/");
  // const currentCode = parts[parts.length - 2];


  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  // const [lockedTime, setLockedTime] = useState();
  // const [facultyLockedTime, setFacultyLockedTime] = useState();
  // const [roomlockedTime, setRoomLockedTime] = useState();

  const [allsessions, setAllSessions]=useState([]);
  const [availableDepts, setAvailableDepts] = useState([]);
  const [currentCode, setCurrentCode] = useState('');
  const [selectedSession, setSelectedSession]=useState('');
  const [selectedDept, setSelectedDept]=useState('');

  const semesters = availableSems;

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
        // console.log('session data',data)
        const { uniqueSessions, uniqueDept } = data;
  
        setAllSessions(uniqueSessions);
        setAvailableDepts(uniqueDept);
  
        console.log('Received session data:', uniqueSessions);
        console.log('Received department data:', uniqueDept);
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
      }
    };
  
    fetchSessions();
  }, []); // Empty dependency array means this effect runs once on mount
  
  const fetchCode= async (session, dept) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/getcode/${session}/${dept}`,
        { credentials: "include" }
      );
      const data1 = await response.json();

      setCurrentCode(data1)
      // setAvailableDepts(dept)
      console.log('received code:',data1)
      // console.log('received dept data:',dept)

    } catch (error) {
      console.error("Error fetching existing timetable data:", error);
      return {};
    }
  }
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
            console.log('coomomo load', data);
          }
        } catch (error) {
          console.error("Error fetching commonload:", error);
        }
      };
    fetchCommonLoad(currentCode, selectedFaculty); // Call the function to fetch subject data
    fetchFacultyData(selectedFaculty);

  // useEffect(() => {
  //   const roomData = async (currentCode, room) => {
  //     try {
  //       const response = await fetch(
  //         `${apiUrl}/timetablemodule/lock/lockroomtt/${currentCode}/${room}`,
  //         { credentials: "include" }
  //       );
  //       const data1 = await response.json();
  //       const data = data1.timetableData;
  //       setRoomLockedTime(data1.updatedTime);
  //       setRoomNotes(data1.notes);
  //       const initialData = generateInitialTimetableData(data, "room");
  //       return initialData;
  //     } catch (error) {
  //       console.error("Error fetching existing timetable data:", error);
  //       return {};
  //     }
  //   };

  //   const fetchRoomData = async (currentCode,room) => {
  //     const data = await roomData(currentCode, room);
  //     setViewRoomData(data);
  //   };

  //   fetchRoomData(currentCode, selectedRoom);
  // }, [selectedRoom]);

  useEffect(() => {
    const fetchSem = async (currentCode) => {
      try {
        console.log('currentcode used for',currentCode)
        const response = await fetch(
          `${apiUrl}/timetablemodule/addsem?code=${currentCode}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          console.log(data)
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
        const response = await fetch(
          `${apiUrl}/timetablemodule/addfaculty/all?code=${currentCode}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          // console.log('faculty response',data);
          setAvailableFaculties(data);
          // console.log('faculties', availableFaculties);
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
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

  const generateInitialTimetableData = (fetchedData, type) => {
    const initialData = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 'lunch'];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        if(period =='lunch')
        {
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
                initialData[day]['lunch'].push(slotSubjects);  

              }
            }
          }

        }
        else
        {
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
  
    console.log("initial datat to be received",initialData);
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


  const [subjectData, setSubjectData] = useState([]); // Initialize as an empty array
  const [TTData, setTTData] = useState([]); // Initialize as an empty array

  useEffect(() => {
    const fetchSubjectData = async (currentCode) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`,
        { credentials: "include" }
        );
        const data = await response.json();
        setSubjectData(data);
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
        setTTData(data);
      } catch (error) {
        console.error('Error fetching TTdata:', error);
      }
    };



    fetchSubjectData(currentCode);
    fetchTTData(currentCode);


  }, [currentCode]);


  return (
    <Container maxW="6xl">
      <Header title="View TimeTable "></Header>
      <FormLabel fontWeight="bold">Select Session:
          </FormLabel>

          <Select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            <option value="">Select Session</option>
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
          >
            <option value="">Select Department</option>
            {availableDepts.map((dept, index) => (
              <option key={index} value={dept}>
                {dept}
              </option>
            ))}
          </Select>




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
            <Text color="black" id="saveTime" mb="2.5" mt="2.5">
              Last saved on: {lockedTime ? lockedTime : "Not saved yet"}
            </Text>
            <ViewTimetable timetableData={viewData} />
            <TimetableSummary
              timetableData={viewData}
              type={"sem"}
              code={currentCode}
              time={lockedTime}
              headTitle={selectedSemester}
              subjectData={subjectData}
              TTData={TTData}
              notes={semNotes}
              />
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
      {/* Faculty Dropdown */}
      <FormControl>
        <FormLabel fontWeight='bold'>Faculty timetable</FormLabel>
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
            <Text color="black" id="saveTime" mb='2.5' mt='2.5'>
              Last saved on:{" "}
              {facultyLockedTime ? facultyLockedTime : "Not saved yet"}
            </Text>

            <ViewTimetable timetableData={viewFacultyData} />
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
            {/* <CustomBlueButton onClick={() => generatePDF(viewFacultyData)}>Generate PDF</CustomBlueButton> */}
            {/* <PDFViewTimetable timetableData={viewFacultyData} /> */}
            {/* <TimetableSummary timetableData={viewFacultyData} type={'faculty'}/>  */}

            <Box>
  {facultyNotes.length>0 ? (
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
    <FormControl>
     <FormLabel fontWeight='bold' >Room timetable</FormLabel>
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
<Box>
  {roomNotes.length>0 ? (
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
      </FormControl>
    </Container>
  );
}

export default InstituteLoad;

