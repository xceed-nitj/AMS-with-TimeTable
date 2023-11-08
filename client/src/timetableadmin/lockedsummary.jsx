import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useNavigate, useLocation, Form } from "react-router-dom";
import getEnvironment from "../getenvironment";
import ViewTimetable from "./viewtt";
import TimetableSummary from "./ttsummary";
import "./Timetable.css";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormLabel, Heading, Select } from "@chakra-ui/react";
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

// import PDFViewTimetable from '../filedownload/chakrapdf'

function LockedSummary() {
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage] = useState();
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  // // Define your options for semesters, faculty, and rooms
  // const availableRooms = ['L-201', 'L-209','room1','room2'];
  // const availableFaculties = ['Dr. Vinod Ashokan','Dr. Harleen Dahiya','Dr. Abhinav Pratap Singh','Professor Arvinder Singh',
  //   'Dr. Praveen Malik','Dr. Rohit Mehra','Dr. Arvind Kumar','Dr. Kiran Singh','Dr. H. M. Mittal','Dr. Suneel Dutt', 'f1','f2',];
  // const semesters=['B.Sc (2 sem)','B.Sc (4 sem)','M.Sc (2 sem)','M.Sc (4 sem)','d-sem1','d-sem2']

  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [lockedTime, setLockedTime] = useState();
  const [facultyLockedTime, setFacultyLockedTime] = useState();
  const [roomlockedTime, setRoomLockedTime] = useState();

  const semesters = availableSems;
  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`,
          { credentials: "include" }
        );
        const data = await response.json();
        // console.log(data);
        const initialData = generateInitialTimetableData(data, "sem");
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };

    const fetchViewData = async (semester) => {
      const data = await fetchData(semester);
      setViewData(data);
    };
    fetchViewData(selectedSemester);
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

    fetchFacultyData(selectedFaculty);
  }, [selectedFaculty]);

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
        const initialData = generateInitialTimetableData(data, "room");
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };

    const fetchRoomData = async (room) => {
      const data = await roomData(currentCode, room);
      setViewRoomData(data);
    };

    fetchRoomData(selectedRoom);
  }, [selectedRoom]);

  useEffect(() => {
    const fetchSem = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addsem?code=${currentCode}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          // console.log('filtered data',data)
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);

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

    fetchSem();
    fetchRoom();
    fetchTime();
    fetchFaculty(currentCode); // Call the function to fetch subject data
  }, [apiUrl, currentCode, selectedSemester, selectedFaculty, selectedRoom]);

  const generateInitialTimetableData = (fetchedData, type) => {
    const initialData = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
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
    // console.log(initialData);
    return initialData;
  };

  // const navigate = useNavigate();

  const handleDownloadClick = () => {
    const pathArray = window.location.pathname
      .split("/")
      .filter((part) => part !== "");
    const pathExceptLastPart = `/${pathArray.slice(0, -1).join("/")}`;
    const pdfUrl = `${pathExceptLastPart}/generatepdf`;
    window.location.href = pdfUrl;
  };

  return (
    <Container maxW="6xl">
      <Heading as="h1" size="xl" mt="6" mb="6">
        Locked TimeTable Summary
      </Heading>
      {/* <Button onClick={handleDownloadClick}>Download Timetable</Button> */}
      <Box mb='6' display='flex' justifyContent='right' onClick={handleDownloadClick}>
        <Text color='blue'>
          To Download Timetable Page
        </Text>
      </Box>
      <FormControl>
          <FormLabel fontWeight="bold">Semester timetable (locked)
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
              />
          </Box>
          
          ) : (
            <Text>Please select a Semester from the dropdown.</Text>
            )}
      </Box>
      {/* Faculty Dropdown */}
      <FormControl>
        <FormLabel fontWeight='bold'>Faculty timetable (locked)</FormLabel>
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
              />
            {/* <CustomBlueButton onClick={() => generatePDF(viewFacultyData)}>Generate PDF</CustomBlueButton> */}
            {/* <PDFViewTimetable timetableData={viewFacultyData} /> */}
            {/* <TimetableSummary timetableData={viewFacultyData} type={'faculty'}/>  */}
          </Box>
        ) : (
          <Text>Please select a faculty from the dropdown.</Text>
          )}
      </Box>
    <FormControl>
     <FormLabel fontWeight='bold' >Room timetable (locked)</FormLabel>
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

            {/* <TimetableSummary timetableData={viewRoomData} type={'room'} />  */}
          </Box>
        ) : (
          <Text>Please select a Room from the dropdown.</Text>
          )}
      </Box>
      </FormControl>
    </Container>
  );
}

export default LockedSummary;
