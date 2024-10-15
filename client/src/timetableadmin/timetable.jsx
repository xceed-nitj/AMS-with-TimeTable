import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ViewTimetable from "./viewtt";
import getEnvironment from "../getenvironment";
import "./Timetable.css";
import TimetableSummary from "./ttsummary";
import ReactToPrint from "react-to-print";
import { Container } from "@chakra-ui/layout";
import { Heading, Select } from "@chakra-ui/react";
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomPlusButton,
  CustomDeleteButton,
} from "../styles/customStyles";
import { Box, Text, Portal, ChakraProvider, UnorderedList, ListItem } from "@chakra-ui/react";
import { Center, Square, Circle } from "@chakra-ui/react";
import { Button, useToast } from '@chakra-ui/react';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
// import { Button } from "@chakra-ui/button";
import { Stack, HStack, VStack } from "@chakra-ui/react";
import Header from "../components/header";

const Timetable = () => {
  const [timetableData, setTimetableData] = useState({});
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage] = useState();
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [lockedTime, setLockedTime] = useState();
  const [savedTime, setSavedTime] = useState();

  const [facultyUpdateTime, setFacultyUpdateTime] = useState();
  const [roomUpdateTime, setRoomUpdateTime] = useState();
  const [commonLoad, setCommonLoad] = useState();
  // const availableRooms = ['L-201', 'L-209','room1','room2'];
  // const availableFaculties = ['Dr. Vinod Ashokan','Dr. Harleen Dahiya','Dr. Abhinav Pratap Singh','Professor Arvinder Singh',
  // 'Dr. Praveen Malik','Dr. Rohit Mehra','Dr. Arvind Kumar','Dr. Kiran Singh','Dr. H. M. Mittal','Dr. Suneel Dutt', 'f1','f2',];
  const semesters = availableSems;
  const [viewselectedSemester, setViewSelectedSemester] = useState(
    availableSems[0]
  );
  const [viewFaculty, setViewFaculty] = useState(availableFaculties[0]);
  const [viewRoom, setViewRoom] = useState(availableRooms[0]);

  const [selectedSemester, setSelectedSemester] = useState(availableSems[0] || "");
  const [clash, setClash] = useState([]);
  const [clashFlag, setClashFlag] = useState(false);
  console.log("clash length::  ", clash.length, "     clash flag::", clashFlag)
  const selectedCell = null;
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 1];
  // console.log('Code:', code);
  const apiUrl = getEnvironment();
  const toast = useToast();

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
          setSelectedSemester(semValues[0]);
          // console.log('available semesters',availableSems)
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    };
    fetchSem();
  }, [apiUrl, currentCode]);

  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        // console.log('sem value',semester);
        // console.log('current code', currentCode);
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`,
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
        setSavedTime(data.updatedTime.saveTimeIST);
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
      }
    };

    const fetchTimetableData = async (semester) => {
      const data = await fetchData(semester);
      setTimetableData(data);
    };

    fetchTimetableData(selectedSemester);
    fetchTime();
  }, [selectedSemester, apiUrl, currentCode]);

  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`,
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

    fetchViewData(viewselectedSemester);
  }, [selectedSemester, viewselectedSemester, timetableData, savedTime]);

  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`,
          { credentials: "include" }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setFacultyUpdateTime(data1.updatedTime);
        const initialData = generateInitialTimetableData(data, "faculty");
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };
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
          console.log('coomomo load', data);
        }
      } catch (error) {
        console.error("Error fetching commonload:", error);
      }
    };

    const fetchFacultyData = async (faculty) => {
      const data = await facultyData(currentCode, faculty);
      setViewFacultyData(data);
    };
    fetchFacultyData(viewFaculty);
    fetchCommonLoad(currentCode, viewFaculty); // Call the function to fetch subject data

  }, [viewFaculty, viewData]);

  useEffect(() => {
    const roomData = async (currentCode, room) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`,
          { credentials: "include" }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setRoomUpdateTime(data1.updatedTime);
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

    fetchRoomData(viewRoom);
  }, [viewRoom, viewData]);

  useEffect(() => {
    // Fetch subject data from the database and populate availableSubjects
    const fetchSubjects = async (currentCode, selectedSemester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/subject/filteredsubject/${currentCode}/${selectedSemester}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableSubjects(data);
          // console.log('subjects', availableSubjects);
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    };

    const fetchRoom = async (currentCode) => {
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

    const fetchFaculty = async (currentCode, selectedSemester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addfaculty/filteredfaculty/${currentCode}/${selectedSemester}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          // console.log('faculty response',data[0]);
          setAvailableFaculties(data[0].faculty);
          // console.log('faculties', availableFaculties);
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    };


    fetchSubjects(currentCode, selectedSemester);
    fetchRoom(currentCode);
    fetchFaculty(currentCode, selectedSemester);
  }, [selectedSemester, viewData, currentCode, apiUrl]);

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

              if (slotSubjects.length > 0) {
                initialData[day]['lunch'].push(slotSubjects);
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

    console.log("initial datat to be received", initialData);
    return initialData;
  };


  const [subjectData, setSubjectData] = useState([]); // Initialize as an empty array
  const [TTData, setTTData] = useState([]); // Initialize as an empty array

  useEffect(() => {
    const fetchSubjectData = async (currentCode) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`, { credentials: "include" });
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


  }, []);








  useEffect(() => {
    // console.log('Updated timetableData:', timetableData);
  }, [timetableData]);

  const handleCellChange = (day, period, slotIndex, cellIndex, type, event) => {
    const newValue = event.target.value;

    // Create a copy of the current state to update
    const updatedData = { ...timetableData };

    // Ensure that the slot and cell exist before updating
    if (
      updatedData[day] &&
      updatedData[day][`period${period}`] &&
      updatedData[day][`period${period}`][slotIndex]
    ) {
      updatedData[day][`period${period}`][slotIndex][cellIndex][type] =
        newValue;

      saveSlotData(
        day,
        `period${period}`,
        updatedData[day][`period${period}`][slotIndex]
      );
    }

    // Update the state with the modified data
    setTimetableData(updatedData);
  };

  const handleSplitCell = (day, period, slotIndex) => {
    const newCell = {
      subject: "",
      room: "",
      faculty: "",
    };

    // Add the new cell to the specific slot within the day and period
    timetableData[day][`period${period}`][slotIndex].push(newCell);

    // Update the state
    setTimetableData({ ...timetableData });
  };

  const handleDeleteCell = (day, period, slotIndex, cellIndex) => {
    // Ensure that the slot and cell exist before updating
    if (timetableData[day] && timetableData[day][`period${period}`]) {
      const slot = timetableData[day][`period${period}`][slotIndex];

      // Check if there is more than one item in the slot
      if (slot.length > 0) {
        // Remove the last item from the slot
        slot.pop();
        // Update the state
        setTimetableData({ ...timetableData });
      }
    }
  };

  const location = useLocation();
  const currentPathname = location.pathname;
  const handleAddSubject = () => {
    // Navigate to the "Add Subject" page
    // const currentPathname = location.pathname;

    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addsubjects`);
  };

  const handleAddFaculty = () => {
    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addfaculty`);
  };

  const handleAddSem = () => {
    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addsem`);
  };
  const handleFirstYear = () => {
    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/firstyearload`);
  };

  const handleAddRoom = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/addroom`);
  };
  const handleAddNote = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/addnote`);
  };
  const handleAddCommonLoad = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/addcommonload`);
  };
  const handleAddLunchSlot = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/addlunchload`);
  };
  const handleViewRoom = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/roomallotment`);
  };
  const handleMasterView = () => {
    // Navigate to the "Add Room" page
    navigate('/timetable');
  };
  const handleViewSummary = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/lockedsummary`);
  };
  const handleEditFaculty = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/editmasterfaculty`);
  };
  const saveSlotData = async (day, slot, slotData) => {
    // Mark the function as async
    const Url = `${apiUrl}/timetablemodule/tt/saveslot/${day}/${slot}`;
    const code = currentCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ slotData, code, sem });

    // console.log('Slot JSON Data to Send:', dataToSend);

    try {
      const response = await fetch(Url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slotData, code, sem }),
        credentials: "include",
      });

      if (response) {
        const data = await response.json();
        // console.log('Slot Data sent to the backend:', data.message);
        setMessage(data.message);
      } else {
        // console.log('no response');
      }
    } catch (error) {
      // console.error('Error sending slot data to the backend:', error);
    }
  };

  const handleSubmit = async () => {
    // Mark the function as async
    const Url = `${apiUrl}/timetablemodule/tt/savett`;
    const code = currentCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ timetableData, code });

    // console.log('Data is getting saved');

    setMessage("Data is being saved....");
    try {
      const response = await fetch(Url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timetableData, code, sem }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('Data sent to the backend:', data);
      } else {
        console.error(
          "Failed to send data to the backend. HTTP status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error sending data to the backend:", error);
    } finally {
      setMessage("Data saved successfully");
    }
  };

  const handleLockTT = async () => {

    const isConfirmed = window.confirm('Are you sure you want to lock the timetable?');

    if (isConfirmed) {
      // Mark the function as async
      setMessage("Data is being saved....");
      // await handleSubmit();
      // console.log('Data is getting Locked');
      setMessage("Data saved. Commencing lock");
      setMessage("Data is being locked");
      const Url = `${apiUrl}/timetablemodule/lock/locktt`;
      const code = currentCode;
      const sem = selectedSemester;
      try {
        const response = await fetch(Url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log('response from backend for lock', data);
          // console.log(data.updatedTime);
          setMessage("");
          toast({
            title: 'Timetable Locked',
            status: 'success',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
          // setLockedTime(data.updatedTime);
        } else {
          console.error(
            "Failed to send data to the backend. HTTP status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Error sending data to the backend:", error);
      }
    } else {
      toast({
        title: 'Timetable Lock Failed',
        description: 'An error occurred while attempting to lock the timetable.',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });


    }


  };

  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScroll = () => {
    const scrollPosition = window.scrollY;
    const scrollThreshold = 2100; // Adjust this value to control when the message disappears

    if (scrollPosition > scrollThreshold) {
      setShowMessage(false);
    } else {
      setShowMessage(true);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    if (availableFaculties.length != 0 && availableRooms.length != 0) {

      let obj = [];
      const roomData = async (currentCode, room) => {
        try {
          const response = await fetch(
            `${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`,
            { credentials: "include" }
          );
          const data1 = await response.json();
          const data = data1.timetableData;
          setRoomUpdateTime(data1.updatedTime);
          const initialData = generateInitialTimetableData(data, "room");
          return initialData;
        } catch (error) {
          console.error("Error fetching existing timetable data:", error);
          return {};
        }
      };

      const fetchRoomData = async (room) => {
        const data = await roomData(currentCode, room);
        // console.log("data::: ",room,":::",data);
        for (let i in data) {
          for (let j in data[i]) {

            if (data[i][j].length >= 2 && data[i][j][0][0]["faculty"] !== data[i][j][1][0]["faculty"]) {
              let temp = { "name": room, "day": i, "period": j }
              obj.push(temp);

              console.log("dataaaA:: ", room, "::", data[i][j][0][0]["faculty"])
            }
          }
        }
      };



      const facultyData = async (currentCode, faculty) => {
        try {
          const response = await fetch(
            `${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`,
            { credentials: "include" }
          );
          const data1 = await response.json();
          const data = data1.timetableData;
          setFacultyUpdateTime(data1.updatedTime);
          const initialData = generateInitialTimetableData(data, "faculty");
          return initialData;
        } catch (error) {
          console.error("Error fetching existing timetable data:", error);
          return {};
        }
      };
      const fetchFacultyData = async (faculty) => {
        const data = await facultyData(currentCode, faculty);
        // console.log("dataaaA:: ",faculty,"::",data)
        for (let i in data) {
          for (let j in data[i]) {
            if (data[i][j].length >= 2 && data[i][j][0]["room"] !== data[i][j][1]["room"]) {
              let temp = { "name": faculty, "day": i, "period": j }
              obj.push(temp);

              console.log("dataaaA:: ", faculty, "::", data[i][j])
            }
          }
        }
      };
      (async () => {
        console.log(availableFaculties, availableRooms);
        for (let i = 0; i < availableFaculties.length; i++) {
          console.log(availableFaculties[i]);
          await fetchFacultyData(availableFaculties[i]);
        }
        for (let i = 0; i < availableRooms.length; i++) {
          console.log(availableRooms[i]);
          await fetchRoomData(availableRooms[i]);
        }
        console.log(obj);
        setClash(obj, setClashFlag(true));

        console.log("value set");

      })()
    }
  }, [availableFaculties, availableRooms]);

  return (
    <Container maxW="8xl">
      <Heading as="h1" size="xl" mt="6" mb="6">
        TIME TABLE ALLOTMENT
      </Heading>
      <Box display="left">
        {/* <Box ml='-1.5'> */}
        <Button mx="auto" colorScheme="red" onClick={handleFirstYear}>
          First Year Faculty Allotment
        </Button>
        <Button m="1 auto" colorScheme="blue" onClick={handleViewRoom}>
          View Centrally Alloted Rooms
        </Button>
        <Button m="1 auto" colorScheme="blue" onClick={handleMasterView}>
          Master View of Time Table (any sem/dept)
        </Button>
        <Button m="1 auto" colorScheme="blue" onClick={handleEditFaculty}>
          Edit Faculty Details
        </Button>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Box ml='-1.5'>
          <Button m="1 auto" colorScheme="teal" onClick={handleAddSem}>
            Add Semester
          </Button>
          <Button m="1 auto" colorScheme="teal" onClick={handleAddSubject}>
            Add Subject
          </Button>
          <Button m="1 auto" colorScheme="teal" onClick={handleAddRoom}>
            Add Room
          </Button>
          <Button m="1 auto" colorScheme="teal" onClick={handleAddFaculty}>
            Add Faculty
          </Button>
          <Button m="1 auto" colorScheme="teal" onClick={handleAddNote}>
            Add Note
          </Button>
          <Button m="1 auto" colorScheme="teal" onClick={handleAddCommonLoad}>
            Add Common Load
          </Button>
          <Button m="1 auto" colorScheme="teal" onClick={handleAddLunchSlot}>
            Add Lunch slots
          </Button>

        </Box>
        <Box mr='-1.5'>
          <Button m="1 auto" colorScheme="orange" onClick={handleLockTT}>
            Lock TT
          </Button>
          <Button m="1 auto" colorScheme="orange" onClick={handleViewSummary}>
            View Locked TT
          </Button>
        </Box>
      </Box>
      <Box
        padding="6px"
        borderRadius="6px"
      >
        <ul
          className="tw-flex tw-flex-wrap tw-w-fit"
        >

          {clashFlag == true ? clash.length == 0 ? "No Clashes" : clash.map((elem, index) => (
            <li key={index} className="tw-h-10 tw-p-2 tw-mx-3 tw-w-1/3 tw-content-center tw-text-red-700 tw-font-normal tw-rounded-md">Check {elem["name"]}'s slot on {elem["day"]} at {elem["period"]}</li>
          )) : "searching for clashes..."}
        </ul>
      </Box>

      <Box display="flex" justifyContent="space-between" mb="4">
        <Text fontSize="xl" color="red" id="saveTime">
          Last saved on: {savedTime ? savedTime : "Not saved yet"}
        </Text>
        <Text fontSize="xl" color="red" id="lockTime">
          Last locked on: {lockedTime ? lockedTime : "Not Locked yet"}
        </Text>
      </Box>

      {/* <div style={{
  backgroundColor: 'brown',
  color: 'white',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '1.5rem', // Adjust the font size as needed
}}>
  {message}
</div> */}
      {/* Floating Message */}
      <Portal>
        <Box
          bg={showMessage && message ? "rgba(255, 100, 0, 0.9)" : 0} // Brighter yellow with some transparency
          color="white"
          textAlign="center"
          fontWeight="bold"
          fontSize="1.5rem"
          position="fixed"
          top="30%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex="999"
          borderRadius="20px" // Adding curved borders
          p="10px" // Padding to make it a bit larger
          opacity={showMessage ? 1 : 0}
        >
          <Text>{message}</Text>
        </Box>
      </Portal>

      <Box display="flex" mb="2.5">
        <Text fontWeight="bold" mb="1.5">
          Select Semester:
        </Text>
        <Select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          {/* <option value="">Select Semester</option> */}

          {semesters.map((semester, index) => (
            <option key={index} value={semester}>
              {semester}
            </option>
          ))}
        </Select>
      </Box>

      {Object.keys(timetableData).length === 0 ? (
        <Box>Loading...</Box>
      ) : (
        <TableContainer>
          <Table variant="striped">
            <Tr fontWeight="bold">
              <Td>
                <Text>Day/Period</Text>
              </Td>

              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <Td key={period}>
                  <Text>
                    <Center>{period}</Center>
                  </Text>
                </Td>
              ))}
            </Tr>
            {days.map((day) => (
              <Tr key={day} fontWeight="bold">
                <Td>
                  <Text>
                    <Center>{day}</Center>
                  </Text>
                </Td>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <Td key={period}>
                    {timetableData[day][`period${period}`].map(
                      (slot, slotIndex) => (
                        <Box key={slotIndex}>
                          {slot.map((cell, cellIndex) => (
                            <Box key={cellIndex}>
                              <Select
                                value={cell.subject}
                                onChange={(event) =>
                                  handleCellChange(
                                    day,
                                    period,
                                    slotIndex,
                                    cellIndex,
                                    "subject",
                                    event
                                  )
                                }
                              >
                                <option value="">Select Subject</option>
                                {availableSubjects.map((subject) => (
                                  <option
                                    key={subject._id}
                                    value={subject.subName}
                                  >
                                    {subject.subName}
                                  </option>
                                ))}
                              </Select>
                              <Select
                                value={cell.room}
                                onChange={(event) =>
                                  handleCellChange(
                                    day,
                                    period,
                                    slotIndex,
                                    cellIndex,
                                    "room",
                                    event
                                  )
                                }
                              >
                                <option value="">Select Room</option>{" "}
                                {/* Add an empty option */}
                                {availableRooms.map((roomOption) => (
                                  <option key={roomOption} value={roomOption}>
                                    {roomOption}
                                  </option>
                                ))}
                              </Select>
                              <Select
                                value={cell.faculty}
                                onChange={(event) =>
                                  handleCellChange(
                                    day,
                                    period,
                                    slotIndex,
                                    cellIndex,
                                    "faculty",
                                    event
                                  )
                                }
                              >
                                <option value="">Select Faculty</option>{" "}
                                {/* Add an empty option */}
                                {availableFaculties.map((faculty, index) => (
                                  <option key={index} value={faculty}>
                                    {faculty}
                                  </option>
                                ))}
                              </Select>
                            </Box>
                          ))}
                          {slotIndex === 0 && (
                            <CustomPlusButton
                              className="cell-split-button"
                              onClick={() =>
                                handleSplitCell(day, period, slotIndex)
                              }
                            >
                              +
                            </CustomPlusButton>
                          )}
                          {slotIndex === 0 && slot.length > 1 && (
                            <CustomDeleteButton
                              className="cell-delete-button"
                              onClick={() =>
                                handleDeleteCell(day, period, slotIndex)
                              }
                            >
                              Delete
                            </CustomDeleteButton>
                          )}
                        </Box>
                      )
                    )}
                  </Td>
                ))}
              </Tr>
            ))}
          </Table>
        </TableContainer>
      )}

      <Button colorScheme="teal" mb="3" mt="5" ml="0" onClick={handleSubmit}>
        Save Timetable
      </Button>

      <Box>
        <Heading as="h1" size="xl" mt="6" mb="6">
          View Semester Timetable
        </Heading>

        <Box display="flex" mb="2.5">
          <Text fontWeight="bold">Select Semester:</Text>
          <Select
            value={viewselectedSemester}
            onChange={(e) => setViewSelectedSemester(e.target.value)}
          >
            {" "}
            <option value="">Select </option>
            {semesters.map((semester, index) => (
              <option key={index} value={semester}>
                {semester}
              </option>
            ))}
          </Select>
        </Box>

        <Box>
          {viewselectedSemester ? (
            <Box>
              <Text color="red" id="saveTime" mb="2.5" mt="2.5">
                Last saved on: {savedTime ? savedTime : "Not saved yet"}
              </Text>
              <ViewTimetable timetableData={viewData} />
              <TimetableSummary
                timetableData={viewData}
                type={"sem"}
                code={currentCode}
                subjectData={subjectData}
                TTData={TTData}
                headTitle={viewselectedSemester}
                commonLoad={commonLoad}
              />

              {/* <Box>
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
</Box> */}

            </Box>

          ) : (
            <Text>Please select a Semester from the dropdown.</Text>
          )}
        </Box>
      </Box>
      <Box>
        <Box>
          <Heading as="h1" size="xl" mt="6" mb="6">
            View Faculty Timetable
          </Heading>
          <Box display="flex" mb="2.5">
            <Text fontWeight="bold">Select Faculty:</Text>
            <Select
              value={viewFaculty}
              onChange={(e) => setViewFaculty(e.target.value)}
            >
              <option value="">Select </option>
              {availableFaculties.map((faculty, index) => (
                <option key={index} value={faculty}>
                  {faculty}
                </option>
              ))}
            </Select>
          </Box>
        </Box>

        <Box>
          {viewFaculty ? (
            <Box>
              <Text color="red" id="saveTime" mb="2.5" mt="2.5">
                Last saved on:{" "}
                {facultyUpdateTime ? facultyUpdateTime : "Not saved yet"}
              </Text>
              <ViewTimetable timetableData={viewFacultyData} />
              <TimetableSummary
                timetableData={viewFacultyData}
                type={"faculty"}
                code={currentCode}
                subjectData={subjectData}
                TTData={TTData}
                commonLoad={commonLoad}
              />
            </Box>
          ) : (
            <Text>Please select a faculty from the dropdown.</Text>
          )}
        </Box>
      </Box>

      <Box>
        <Heading as="h1" size="xl" mt="6" mb="6">
          View Room Timetable
        </Heading>
        <Box display="flex" mb="2.5">
          <Text fontWeight="bold">Select Room:</Text>
          <Select
            value={viewRoom}
            onChange={(e) => setViewRoom(e.target.value)}
          >
            <option value="">Select </option>
            {availableRooms.map((room, index) => (
              <option key={index} value={room}>
                {room}
              </option>
            ))}
          </Select>
        </Box>
      </Box>

      <Box mb="8">
        {viewRoom ? (
          <Box>
            <Text color="red" id="saveTime" mb="2.5" mt="2.5">
              Last saved on: {roomUpdateTime ? roomUpdateTime : "Not saved yet"}
            </Text>

            <ViewTimetable timetableData={viewRoomData} />
            {/* <TimetableSummary timetableData={viewRoomData} type={'room'} code={currentCode}/>  */}
          </Box>
        ) : (
          <Text>Please select a Room from the dropdown.</Text>
        )}
      </Box>
    </Container>
  );
};

export default Timetable;
