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
  
  const handleCalculateLoad = () => {
    // Make a request to your backend with the entered session value
    fetch(`${apiUrl}/timetablemodule/instituteLoad/${selectedSession}`)
      .then(response => response.json())
      .then(data => {
        // Handle the data in your frontend (e.g., update UI)
        console.log(data);
      })
      .catch(error => {
        console.error('Error fetching institute load details:', error);
      });
  };

  

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
          <Button colorScheme="blue" onClick={handleCalculateLoad}>
          Calculate Load
        </Button>
</Container>
  );
}

export default InstituteLoad;

