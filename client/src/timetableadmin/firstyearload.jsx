import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";
import {
  Box,
  Center,
  Container,
  FormControl,
  FormLabel,
  Portal,
  Heading,
  Input,
  Select,
  Text,
  chakra,
  Checkbox,
} from "@chakra-ui/react";import { CustomTh, CustomLink, CustomPlusButton, CustomDeleteButton } from "../styles/customStyles";
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
import { Link } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";

// function SuccessMessage({ message }) {
//   return (
//     <div className="success-message">
//       {message}
//     </div>
//   );
// }

// ... (existing imports)

function FirstYearLoad() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState({
    state: false,
    id: "",
  });
  const [currentDepartment, setCurrentDepartment] = useState("");
  const [currentSession, setCurrentSession] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const semesters = availableSems;
  const [selectedSemester, setSelectedSemester] = useState(availableSems[0]);

  const [timetableData, setTimetableData] = useState({});
  const [firstYearCode, setFirstYearCode] = useState({});
  const [subjects, setSubjects] = useState([]);



  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];


  const location = useLocation();
  const currentPathname = location.pathname;

  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchTTData(currentCode);
  }, []);

  useEffect(() => {
    fetchFirstYearSubjects(currentCode, currentDepartment);
  }, [currentDepartment]);

  const fetchTTData = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCurrentDepartment(data[0].dept);
        setCurrentSession(data[0].session);
      }

      // console.log("tt", data);
    } catch (error) {
      console.error("Error fetching TTdata:", error);
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
    const code = firstYearCode;
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
        console.log('response from backend for lock',data);
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


  const fetchFirstYearSubjects = async (currentCode, currentDepartment) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/subject/firstyearsubject/${currentCode}/${currentDepartment}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      // console.log("subdata", data);

      setAvailableSubjects(data);

      const uniqueSubjects = [...new Set(data.map((item) => item.subName))];
      // console.log(uniqueSubjects)


      const uniqueSemesters = [...new Set(data.map((item) => item.sem))];
      // console.log(uniqueSemesters)
      setAvailableSems(uniqueSemesters);   
      setSubjects(uniqueSubjects);
      setSelectedSemester(uniqueSemesters[0]);
      setFirstYearCode(data[0].code);

    } catch (error) {
      console.error("Error fetching TTdata:", error);
    }
  };
  const handleAddFirstYearFaculty = () => {
    // Split the current pathname into segments
    const pathSegments = currentPathname.split('/');
  
    // Remove the last segment (current path)
    pathSegments.pop();
  
    // Add the new segment 'firstyearfaculty'
    pathSegments.push('firstyearfaculty');
  
    // Join the segments back into a path string
    const newPath = pathSegments.join('/');
  
    // Navigate to the new path
    navigate(newPath);
  };
  

  useEffect(() => {
    const fetchData = async (semester,firstYearCode) => {
      try {
        // console.log('sem value',semester);
        // console.log('current code', firstYearCode);
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewclasstt/${firstYearCode}/${semester}`,
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

    const fetchTimetableData = async (semester, firstYearCode) => {

      const data = await fetchData(semester,firstYearCode);
      // console.log('timetable data fetched:', data)
      setTimetableData(data);
    };

    fetchTimetableData(selectedSemester, firstYearCode);
    // fetchTime();
    fetchFacultyData(currentCode, currentDepartment, selectedSemester)
  }, [selectedSemester, apiUrl, currentCode, firstYearCode]);

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
    // setTimetableData((prevData) => ({
    //   ...prevData,
    //   [day]: {
    //     ...prevData[day],
    //     [`period${period}`]: [...prevData[day][`period${period}`]],
    //   },
    // }));

  };

  const saveSlotData = async (day, slot, slotData) => {
    // Mark the function as async
    const Url = `${apiUrl}/timetablemodule/tt/saveslot/${day}/${slot}`;
    const code = firstYearCode;
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
    const code = firstYearCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ timetableData, code });

    // console.log('Data is getting saved');
// console.log(timetableData)
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


  const fetchFacultyData = async (currentCode, currentDepartment, semester) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/addfaculty/firstyearfacultybysem/${currentDepartment}/${currentCode}/${semester}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      // console.log("facdata", data);
      const filteredFaculty = data.filter(item => item.sem === semester).map(item => item.faculty);
      setAvailableFaculties(filteredFaculty);
    } catch (error) {
      console.error("Error fetching TTdata:", error);
    }
  };

  const [showMessage, setShowMessage] = useState(true);

  return (
    <Container maxW="7xl">
      <Header title="First Year Faculty Allotment"></Header>

      <Box>
        <Box mb="1">
          <Text as="b">First Year Subjects that are being offered in the current semester</Text>
        </Box>

        <Table variant="striped" size="md" mt="1">
          <Thead>
            <Tr>
              <Th>Subject Name</Th>
              <Th>Type</Th>
              <Th>Subject Code</Th>
              <Th>Sub Name</Th>
              <Th>Semester</Th>

              {/* Add more columns as needed */}
            </Tr>
          </Thead>
          <Tbody>
            {availableSubjects.map((subject) => (
              <Tr key={subject._id}>
                <Td>{subject.subjectFullName}</Td>
                <Td>{subject.type}</Td>
                <Td>{subject.subCode}</Td>
                <Td>{subject.subName}</Td>
                <Td>{subject.sem}</Td>

                {/* Add more cells for additional properties */}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      <Button m="1 auto" colorScheme="teal" onClick={handleAddFirstYearFaculty}>
            Add First Year Faculty
          </Button>
        
          <Button m="1" ml="auto" colorScheme="orange" onClick={handleLockTT}>
            Lock First Year Time Table
          </Button>
  
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
                                isDisabled
                              >
                                <option value={cell.subject}>{cell.subject || "Select Subject"}</option>
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
                                isDisabled
                              >
                                {/* <option value="">Select Room</option>{" "} */}
                                <option value={cell.room}>{cell.room || "Select room"}</option>

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
                                disabled={!subjects.some(subject => subject === cell.subject)}
                              >
                               <option value="">Select Faculty</option>{" "}
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

                            >
                              +
                            </CustomPlusButton>
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



    </Container>
  );
}



export default FirstYearLoad;
