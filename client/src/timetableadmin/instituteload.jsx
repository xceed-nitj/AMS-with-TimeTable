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
  const [loadFaculty, setLoadFaculty] = useState({});
  const [selectedRoom, setSelectedRoom] = useState("");
  const [commonLoad, setCommonLoad]=useState();
  const [currentDept, setCurrentDept]=useState();

  const apiUrl = getEnvironment();
  // const navigate = useNavigate();
  // const currentURL = window.location.pathname;
  // const parts = currentURL.split("/");
  // const currentCode = parts[parts.length - 2];
  const [excludeTheory, setExcludeTheory] = useState(false);

  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const [facultyHoursCount, setFacultyHoursCount] = useState({});


  // const [lockedTime, setLockedTime] = useState();
  // const [facultyLockedTime, setFacultyLockedTime] = useState();
  // const [roomlockedTime, setRoomLockedTime] = useState();

  const [allsessions, setAllSessions]=useState([]);
  const [availableDepts, setAvailableDepts] = useState([]);
  const [availableLoad, setAvailableLoad] = useState({});
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

  useEffect(() => {
    const fetchDepartmentFacultyData = async (selectedSession,selectedDept) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/instituteLoad/${selectedSession}/${selectedDept}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
  
        console.log('load data', data);
        const calculatedLoad = calculateFacultyWiseLoad(data);
        console.log('calculated load',calculatedLoad)
        setAvailableLoad(calculatedLoad);

      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
      }
    };
  
    fetchDepartmentFacultyData(selectedSession,selectedDept);

  }, [selectedDept]); // Empty dependency array means this effect runs once on mount


  function calculateFacultyWiseLoad(data) {
    const facultyWiseLoad = {};
  
    data.forEach((faculty) => {
      const { name, sem, type, load } = faculty;
  
      facultyWiseLoad[name] = facultyWiseLoad[name] || {};
  
      sem.forEach((s, index) => {
        const t = type[index];
        const l = load[index];
  
        facultyWiseLoad[name][s] = facultyWiseLoad[name][s] || {};
        facultyWiseLoad[name][s][t] = (facultyWiseLoad[name][s][t] || 0) + l;
      });
    });
  
    console.log(facultyWiseLoad);
    return facultyWiseLoad;
  }  

  const Usemesters = [...new Set(Object.keys(availableLoad).flatMap(faculty => Object.keys(availableLoad[faculty])))];
  const types = ['Theory', 'Laboratory', 'Tutorial', 'Project'];
  
  // Generate a set of unique columns based on available data
  const uniqueColumns = new Set();
  Object.keys(availableLoad).forEach((faculty) => {
    Usemesters.forEach((semester) => {
      types.forEach((type) => {
        uniqueColumns.add(`${faculty}-${semester}-${type}`);
      });
    });
  });
   const totalLoads = {}; 

   return (
    <Container maxW="6xl">
      <Header title="View TimeTable "></Header>
      <FormLabel fontWeight="bold">Select Session:</FormLabel>
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
      <FormLabel fontWeight="bold">Select Department for Faculty Load:</FormLabel>
      <FormLabel fontWeight="bold">Select Session:</FormLabel>
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
      <>
        {/* Checkbox for excluding theory loads */}
        <label>
          <input
            type="checkbox"
            checked={excludeTheory}
            onChange={() => setExcludeTheory(!excludeTheory)}
          />
          Exclude Theory Loads
        </label>
<TableContainer>  
        <table>
        <thead>
  <tr>
  <th >Faculty</th>
    {Usemesters
      .sort((a, b) => {
        const getTypeOrder = (type) => {
          const typeOrder = {
            'b.tech': 0,
            'm.tech': 1,
            'b.sc':2,
            'm.sc':3,
            'b.sc-b.ed':4,
            'ph.d':5,
            'mba':6
            // Add conditions for other program types if needed
          };
          return typeOrder[type.toLowerCase()];
        };

        const typeOrderA = getTypeOrder(a.split('-')[0]);
        const typeOrderB = getTypeOrder(b.split('-')[0]);

        // First, arrange by program type
        if (typeOrderA !== typeOrderB) {
          return typeOrderA - typeOrderB;
        }

        // If the program types are the same, arrange by semester number
        const numberA = parseInt(a.split('-')[1]);
        const numberB = parseInt(b.split('-')[1]);

        return numberA - numberB;
      })
      .map((semester) => (
        <React.Fragment key={`header-${semester}`}>
          <th colSpan={types.length}>{semester}</th>
        </React.Fragment>
      ))}
    <th rowSpan="2">Tutorial+Lab Load</th>
    <th rowSpan="2">Project Load</th>
    <th rowSpan="2">Total Faculty Load</th>
  </tr>
  <tr>
    <th></th>
    {Usemesters.map((semester) =>
      types.map((type) => {
        // Only render headers for 'Theory' if excludeTheory is false
        if (!excludeTheory || (excludeTheory && type.toLowerCase() === 'theory')) {
          return (
            <th key={`header-${semester}-${type}`}>{type}</th>
          );
        }
        return null;
      })
    )}
    <th></th>
  </tr>
</thead>


<tbody>
  {Object.keys(availableLoad).map((faculty) => (
    <tr key={faculty}>
      <td>{faculty}</td>
      {[...Usemesters].map((semester) =>
        types.map((type) => {
          if (!excludeTheory || (excludeTheory && type.toLowerCase() === 'theory')) {
            const loadValue = availableLoad[faculty]?.[semester]?.[type] || 0;
            const adjustedLoadValue = excludeTheory && type.toLowerCase() === 'theory' ? 0 : loadValue;

            totalLoads[faculty] = totalLoads[faculty] || 0;
            totalLoads[faculty] += adjustedLoadValue;

            return (
              <td key={`${faculty}-${semester}-${type}`}>
                {adjustedLoadValue}
              </td>
            );
          }
          return null;
        })
      )}
      {/* Sum of 'Tutorial', 'Laboratory', and 'Project' for each faculty */}
      <td key={`${faculty}-tutorial-laboratory-project-sum`}>
        {Object.keys(availableLoad[faculty] || {}).map((semester) => {
          const tutorialLoad = availableLoad[faculty][semester]['Tutorial'] || 0;
          const laboratoryLoad = availableLoad[faculty][semester]['Laboratory'] || 0;
          // const projectLoad = availableLoad[faculty][semester]['Project'] || 0;

          return tutorialLoad + laboratoryLoad ;
        }).reduce((sum, value) => sum + value, 0)}
      </td>
      {/* Separate column for 'Project' load */}
      <td key={`${faculty}-project-sum`}>
        {Object.keys(availableLoad[faculty] || {}).map((semester) => {
          const projectLoad = availableLoad[faculty][semester]['Project'] || 0;
          return projectLoad;
        }).reduce((sum, value) => sum + value, 0)}
      </td>
 
      {/* Total load for each faculty */}
      <td>{totalLoads[faculty]}</td>
    </tr>
  ))}
</tbody>

        </table>
        </TableContainer>
      </>
    </Container>
  );
  
  
}

export default InstituteLoad;

