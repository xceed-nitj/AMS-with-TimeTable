import React, { useState, useEffect } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  useToast,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  Select,
  HStack,
  VStack,
  Container,
} from "@chakra-ui/react";
import getEnvironment from "../getenvironment";
import Header from "../components/header";

const LunchLoad = () => {
  const toast = useToast();

  const apiUrl = getEnvironment();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [lunchData, setLunchData] = useState([]);

  useEffect(() => {
    const fetchSem = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addsem?code=${currentCode}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);

          setAvailableSems(semValues);
          // setSelectedSemester(semValues[0]);
        }
      } catch (error) {
        console.error("Error fetching sem data:", error);
      }
    };
    fetchSem();
    fetchLunchLoad();
  }, [selectedSemester]);

  const fetchLunchLoad = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/tt/getlunchslot/${currentCode}`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
  
        // Filter lunch records for the selected semester
        const filteredLunchData = data.lunchrecords.filter(
          (record) => record.sem === selectedSemester
        );
  
        setLunchData(filteredLunchData);
        // console.log("subject fetched data", filteredLunchData);
  
        if (filteredLunchData.length > 0) {
          const firstRecord = filteredLunchData[0];
          setSelectedSemester(firstRecord.sem);
        }
      }
    } catch (error) {
      console.error("Error fetching lunch data:", error);
    }
  };
  
  useEffect(() => {
    const fetchSubjects = async (currentCode, selectedSemester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/subject/filteredsubject/${currentCode}/${selectedSemester}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableSubjects(data);
          // console.log("subject data", data);
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    };

    const fetchRoom = async (currentCode) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addroom?code=${currentCode}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          const filteredRooms = data.filter(
            (room) => room.code === currentCode
          );
          const roomValues = filteredRooms.map((room) => room.room);

          setAvailableRooms(roomValues);
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
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
          setAvailableFaculties(data[0].faculty);
        }
      } catch (error) {
        console.error("Error fetching faculty data:", error);
      }
    };

    fetchSubjects(currentCode, selectedSemester);
    fetchRoom(currentCode);
    fetchFaculty(currentCode, selectedSemester);
  }, [selectedSemester]);

const handleAddSlotRow = () => {
  setLunchData((prevLunchData) => [
    {
      sem: selectedSemester,
      day: "",
      slot:"lunch",
      slotData: [
        {
          subject: "",
          faculty: "",
          room: "",
        },
      ],
    },
    ...prevLunchData,
  ]);
};

  const handleSemesterChange = (value) => {
    setSelectedSemester(value);
  };

  const handleDayChange = (rowIndex, value) => {
    const updatedLunchData = [...lunchData];
    updatedLunchData[rowIndex].day = value;
    setLunchData(updatedLunchData);
  };

  const handleSlotDataChange = (rowIndex, slotIndex, field, value) => {
    const updatedSlotData = [...lunchData[rowIndex].slotData];
    updatedSlotData[slotIndex][field] = value;

    const updatedLunchData = [...lunchData];
    updatedLunchData[rowIndex].slotData = updatedSlotData;

    setLunchData(updatedLunchData);
  };

  const handleDeleteSlot = (rowIndex, slotIndex) => {
    const updatedSlotData = [...lunchData[rowIndex].slotData];
    updatedSlotData.splice(slotIndex, 1);

    if (updatedSlotData.length === 0) {
      // If empty, replace it with the initial value
      updatedSlotData.push({
        subject: "",
        faculty: "",
        room: "",
      });
    }
  
    const updatedLunchData = [...lunchData];
    updatedLunchData[rowIndex].slotData = updatedSlotData;
  
    setLunchData(updatedLunchData);
   handlePostRequest();  
  };
  
  const handleDeleteRow = (rowIndex) => {
    const updatedLunchData = [...lunchData];
    updatedLunchData.splice(rowIndex, 1);
    setLunchData(updatedLunchData);
   handlePostRequest();  

  };

  const handlePostRequest = async () => {
    try {
      const code = currentCode;
  
      // Filter lunchData for the selected semester
      const selectedSemesterData = lunchData
        .filter((record) => record.sem === selectedSemester)
        .map(({ sem, day, slot, slotData }) => ({
          sem,
          day,
          slot,
          slotData,
        }));
  
      // console.log('data to be sent', selectedSemesterData);
      // console.log('apiurl', apiUrl);
  
      const response = await fetch(
        `${apiUrl}/timetablemodule/tt/savelunchslot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            lunchData: selectedSemesterData,
            selectedSemester, // You might want to include this if it's needed on the server side
            code,
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const responseData = await response.json();
      if (responseData.lunchrecords) {
        toast({
          position: "top",
          title: "Lunch Slot Updated",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
      setLunchData(responseData.lunchrecords);
      // console.log("subject fetched data", responseData.lunchrecords);
    } catch (error) {
      console.error(`Error making POST request: ${error.message}`);
    }
  };
      

  const handleAdditionalSlot = (rowIndex) => {
    const updatedLunchData = [...lunchData];
    updatedLunchData[rowIndex].slotData.push({
      subject: "",
      faculty: "",
      room: "",
    });
    setLunchData(updatedLunchData);
  };
  
  return (
    <Container maxW="6xl" centerContent>
      <Header title="Add Lunch Hour load"></Header>
      <Select
        placeholder="Select semester"
        value={selectedSemester}
        onChange={(e) => handleSemesterChange(e.target.value)}
      >
        {availableSems.map((semester, index) => (
          <option key={`semester-option-${index}`} value={semester}>
            {semester}
          </option>
        ))}
      </Select>
      <Button colorScheme="teal" onClick={handleAddSlotRow}>
        Add Lunch Slot
      </Button>
  
      {selectedSemester && lunchData.length === 0 ? (
        <p>No data available for the selected semester</p>
      ) : (
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>Day</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lunchData
              .filter((record) => record.sem === selectedSemester)
              .map((record, rowIndex) => (
                <Tr key={rowIndex}>
                  <Td>
                    <Select
                      placeholder="Select Day"
                      value={record.day}
                      onChange={(e) => handleDayChange(rowIndex, e.target.value)}
                    isRequired
                    >
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                        (day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        )
                      )}
                    </Select>
                  </Td>
                  <Td>
                    <VStack spacing={2}>
                      {record.slotData.map((slot, slotIndex) => (
                        <React.Fragment key={slotIndex}>
                          <FormControl>
                            <FormLabel>Subject</FormLabel>
                            <Select
                              placeholder="Select subject"
                              value={slot.subject}
                              onChange={(e) =>
                                handleSlotDataChange(
                                  rowIndex,
                                  slotIndex,
                                  "subject",
                                  e.target.value
                                )
                              }
                            >
                              {availableSubjects.map((subjectOption, index) => (
                                <option
                                  key={subjectOption._id || index}
                                  value={subjectOption.subName}
                                >
                                  {subjectOption.subName}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Room</FormLabel>
                            <Select
                              placeholder="Select room"
                              value={slot.room}
                              onChange={(e) =>
                                handleSlotDataChange(
                                  rowIndex,
                                  slotIndex,
                                  "room",
                                  e.target.value
                                )
                              }
                            >
                              {availableRooms.map((roomOption) => (
                                <option key={roomOption._id} value={roomOption}>
                                  {roomOption}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Faculty</FormLabel>
                            <Select
                              placeholder="Select faculty"
                              value={slot.faculty}
                              onChange={(e) =>
                                handleSlotDataChange(
                                  rowIndex,
                                  slotIndex,
                                  "faculty",
                                  e.target.value
                                )
                              }
                            >
                              {availableFaculties.map((facultyOption) => (
                                <option
                                  key={facultyOption._id}
                                  value={facultyOption}
                                >
                                  {facultyOption}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
  
                          <Button
                            colorScheme="red"
                            onClick={() => handleDeleteSlot(rowIndex, slotIndex)}
                          >
                            Delete
                          </Button>
                        </React.Fragment>
                      ))}
                      <HStack>
                        <Button
                          colorScheme="teal"
                          onClick={() => handleAdditionalSlot(rowIndex)}
                        >
                          Add more Slot
                        </Button>
                        <Button
                          colorScheme="red"
                          onClick={() => handleDeleteRow(rowIndex)}
                        >
                          Delete complete slots
                        </Button>
                      </HStack>
                    </VStack>
                  </Td>
                </Tr>
              ))
                              }
          </Tbody>
        </Table>
      )}
  
      <Button colorScheme="teal" onClick={handlePostRequest}>
        Submit
      </Button>
    </Container>
  );
                            } 

export default LunchLoad;
