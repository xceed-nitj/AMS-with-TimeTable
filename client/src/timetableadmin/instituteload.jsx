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
  const [currentDept, setCurrentDept]=useState();

  const apiUrl = getEnvironment();
  // const navigate = useNavigate();
  // const currentURL = window.location.pathname;
  // const parts = currentURL.split("/");
  // const currentCode = parts[parts.length - 2];


  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const [facultyHoursCount, setFacultyHoursCount] = useState({});


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
      return data1;
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
        // setFacultyLockedTime(data1.updatedTime);
        // setFacultyNotes(data1.notes);
        const initialData = generateInitialTimetableData(data, "faculty");
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };

    // const fetchFacultyData = async (faculty) => {
    //   const data = await facultyData(currentCode, faculty);
    //   setViewFacultyData(data);
    // };

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
    // fetchCommonLoad(currentCode, selectedFaculty); // Call the function to fetch subject data
    // fetchFacultyData(selectedFaculty);

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
      const fetchedttdetails=await fetchTTData(currentCode);
        console.log("fetchedttdetails", fetchedttdetails)
      const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails[0].dept}`,{credentials: 'include',});
      if (response.ok) {
        const data = await response.json();
        const facultydata = data.map(faculty => faculty.name);

        console.log('faculty response',facultydata);
        setAvailableFaculties(facultydata);
        // console.log('deptfaculties', facultydata);
        return facultydata;
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
  
    // console.log("initial datat to be received",initialData);
    return initialData;
  };


  // const navigate view= useNavigate();


  const [subjectData, setSubjectData] = useState([]); // Initialize as an empty array
  const [TTData, setTTData] = useState([]); // Initialize as an empty array

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
        // console.log('ttdata', data)
        setTTData(data);
        return data;
      } catch (error) {
        console.error('Error fetching TTdata:', error);
      }
    };

    const countHoursByDegreeAndSemester = (timetableData) => {
      const degreeSemesterCount = {};
    
      // Iterate through each day
      for (const day in timetableData) {
        const dayData = timetableData[day];
    
        // Iterate through each period in the day
        for (const period in dayData) {
          const periodData = dayData[period];
    
          // Iterate through each entry in the period
          for (const entry of periodData) {
            // Check if there is an entry and it has a faculty property
            if (entry.length > 0 && entry[0].hasOwnProperty("faculty")) {
              const faculty = entry[0].faculty;
    
              // Extract degree and semester from the faculty value
              const [degree, deptCode, semester] = faculty.split('-');
    
              // Update the count for the degree and semester
              const key = `${degree}-${semester}`;
              if (!degreeSemesterCount[key]) {
                degreeSemesterCount[key] = 1;
              } else {
                degreeSemesterCount[key]++;
              }
            }
          }
        }
      }
    
      return degreeSemesterCount;
    };

useEffect(()=>{

    const fetchLoad = async (session) => {
      setFacultyHoursCount({});
      console.log('dept available:',availableDepts)
      for (const dept of availableDepts) {
        // Fetch the code for the current session and department
        setCurrentDept(dept);
        const newCode = await fetchCode(session, dept);
      console.log('dept code available:',newCode)

        const facultylist= await fetchFaculty(newCode);
        // Fetch faculty data for each available faculty
        console.log('faculty available:',facultylist)

        for (const faculty of facultylist) {
          const newFacultyData = await facultyData(newCode, faculty);
          console.log('faculty data available:',newFacultyData)

          const result = countHoursByDegreeAndSemester(newFacultyData);
  
          // Accumulate faculty hours count
          setFacultyHoursCount((prevCount) => ({
            ...prevCount,
            [faculty]: result,
          }));
        }
      }
    };

    fetchLoad(selectedSession);
  },[selectedSession]);


  console.log('faculuy hrs', facultyHoursCount)
  

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

    <table>
      <thead>
        <tr>
          <th>Faculty Name</th>
          {/* <th>Department</th> */}
          <th>B.Tech Sem 1</th>
          <th>B.Tech Sem 2</th>
          <th>B.Tech Sem 3</th>
          <th>B.Tech Sem 4</th>
          <th>B.Tech Sem 5</th>
          <th>B.Tech Sem 6</th>
          <th>B.Tech Sem 7</th>
          <th>B.Tech Sem 8</th>
          <th>M.Tech Sem 1</th>
          <th>M.Tech Sem 2</th>
          {/* Add similar columns for other degrees and semesters */}
        </tr>
      </thead>
      <tbody>
      {Object.keys(facultyHoursCount).map((faculty) => (
  <tr key={faculty}>
    <td>{faculty}</td>
    {/* <td>{currentDept}</td> */}

    {[section, 2, 3, 4,5,6,7,8].map((semester) => (
      <td key={`${faculty}-${semester}`}>
        {facultyHoursCount[faculty][`B.Tech-${semester}`] || 0}
      </td>
    ))}
    
    {[1, 2].map((semester) => (
                <td key={`${faculty}-${semester}`}>
                  {facultyHoursCount[faculty][`M.Tech-${semester}`] || 0}
                </td>
              ))}
  </tr>
))}
</tbody>
    </table>


</Container>
  );
}

export default InstituteLoad;

