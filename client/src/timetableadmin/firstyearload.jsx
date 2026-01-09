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
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  VStack,
  HStack,
  Badge,
  IconButton,
  Flex,
} from "@chakra-ui/react";
import { CustomTh, CustomLink, CustomPlusButton, CustomDeleteButton } from "../styles/customStyles";
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
import { ChevronDownIcon, ChevronUpIcon, AddIcon, DeleteIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";

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
  const [expandedDept, setExpandedDept] = useState({});

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
      console.log("tt data", data);
      if (Array.isArray(data) && data.length > 0) {
        setCurrentDepartment(data[0].dept);
        setCurrentSession(data[0].session);
      } else {
        setCurrentDepartment(data.dept);
        setCurrentSession(data.session);
      }
    } catch (error) {
      console.error("Error fetching TTdata:", error);
    }
  };

  const handleLockTT = async () => {
    const isConfirmed = window.confirm('Are you sure you want to lock the timetable?');

    if (isConfirmed) {
      setMessage("Data is being saved....");
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
          console.log('response from backend for lock', data);
          setMessage("");
          toast({
            title: 'Timetable Locked',
            status: 'success',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
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

      setAvailableSubjects(data);

      const uniqueSubjects = [...new Set(data.map((item) => item.subName))];

      const uniqueSemesters = [...new Set(data.map((item) => item.sem))];
      setAvailableSems(uniqueSemesters);
      setSubjects(uniqueSubjects);
      setSelectedSemester(uniqueSemesters[0]);
      setFirstYearCode(data[0].code);

    } catch (error) {
      console.error("Error fetching TTdata:", error);
    }
  };

  const handleAddFirstYearFaculty = () => {
    const pathSegments = currentPathname.split('/');
    pathSegments.pop();
    pathSegments.push('firstyearfaculty');
    const newPath = pathSegments.join('/');
    navigate(newPath);
  };

  useEffect(() => {
    const fetchData = async (semester, firstYearCode) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewclasstt/${firstYearCode}/${semester}`,
          { credentials: "include" }
        );
        const data = await response.json();
        const initialData = generateInitialTimetableData(data, "sem");
        return initialData;
      } catch (error) {
        console.error("Error fetching existing timetable data:", error);
        return {};
      }
    };

    const fetchTimetableData = async (semester, firstYearCode) => {
      const data = await fetchData(semester, firstYearCode);
      setTimetableData(data);
    };

    fetchTimetableData(selectedSemester, firstYearCode);
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
    return initialData;
  };

  const handleCellChange = (day, period, slotIndex, cellIndex, type, event) => {
    const newValue = event.target.value;

    const updatedData = { ...timetableData };

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

    setTimetableData(updatedData);
  };

  const saveSlotData = async (day, slot, slotData) => {
    const Url = `${apiUrl}/timetablemodule/tt/saveslot/${day}/${slot}`;
    const code = firstYearCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ slotData, code, sem });

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
        setMessage(data.message);
      }
    } catch (error) {
      // console.error('Error sending slot data to the backend:', error);
    }
  };

  const handleSubmit = async () => {
    const Url = `${apiUrl}/timetablemodule/tt/savett`;
    const code = firstYearCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ timetableData, code });

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
      const filteredFaculty = data.filter(item => item.sem === semester).map(item => item.faculty);
      setAvailableFaculties(filteredFaculty);
    } catch (error) {
      console.error("Error fetching TTdata:", error);
    }
  };

  // Group subjects by department (using sem as department indicator)
  const groupSubjectsByDept = () => {
    const grouped = {};
    availableSubjects.forEach(subject => {
      const dept = subject.sem || 'General';
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(subject);
    });
    return grouped;
  };

  const toggleDept = (dept) => {
    setExpandedDept(prev => ({
      ...prev,
      [dept]: !prev[dept]
    }));
  };

  // Generate consistent color based on subject name
  const getSubjectColor = (subject) => {
    if (!subject) return 'gray.50';
    const colors = [
      'red.100', 'red.200', 'red.300',
                          'orange.100', 'orange.200', 'orange.300',
                          'yellow.100', 'yellow.200', 'yellow.300',
                          'green.100', 'green.200', 'green.300',
                          'teal.100', 'teal.200', 'teal.300',
                          'blue.100', 'blue.200', 'blue.300',
                          'cyan.100', 'cyan.200', 'cyan.300',
                          'purple.100', 'purple.200', 'purple.300',
                          'pink.100', 'pink.200', 'pink.300',
                          'linkedin.100', 'linkedin.200', 'linkedin.300',
                          'facebook.100', 'facebook.200', 'facebook.300',
                          'messenger.100', 'messenger.200', 'messenger.300',
                          'whatsapp.100', 'whatsapp.200', 'whatsapp.300',
                          'twitter.100', 'twitter.200', 'twitter.300',
                          'telegram.100', 'telegram.200', 'telegram.300'
                        ];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const [showMessage, setShowMessage] = useState(true);
  const groupedSubjects = groupSubjectsByDept();

  return (
    <Box bg="white" minH="100vh">
      <Box>
        {/* Hero Header Section */}
        <Box 
          bgGradient="linear(to-r, cyan.400, teal.500, green.500)"
          pt={0}
          pb={24}
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
          <Box position="relative" zIndex={2} sx={{
            '& button[aria-label="Go back"]': { display: 'none' },
            '& .chakra-button:first-of-type': { display: 'none' }
          }}>
            <Header />
          </Box>

          <Container maxW="7xl" position="relative" mt={8}>
            <Flex justify="space-between" align="center" w="full" gap={4}>
              <VStack spacing={4} align="start" flex="1">
                <Badge colorScheme="whiteAlpha" fontSize="sm" px={3} py={1} borderRadius="full">
                  First Year Timetable
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  First Year Faculty Allotment
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Manage and allocate faculty for first year timetable across all departments.
                </Text>
              </VStack>
              
              {/* Back Button */}
              <IconButton
                icon={<ArrowBackIcon />}
                aria-label="Go back"
                onClick={() => window.history.back()}
                size="lg"
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                fontSize="2xl"
                _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
                _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
                borderRadius="full"
                boxShadow="lg"
                border="2px solid"
                borderColor="whiteAlpha.400"
                flexShrink={0}
              />
            </Flex>
          </Container>
        </Box>

        <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16}>
          <Box 
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            p={6}
            border="1px"
            borderColor="gray.300"
            mb={6}
          >
            {/* Department-wise Subject Cards */}
            <Box mb={6}>
              <Text as="b" fontSize="lg" mb={3}>First Year Subjects by Department</Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={3}>
                {Object.keys(groupedSubjects).map((dept) => (
                  <Card key={dept} boxShadow="md" borderRadius="lg" overflow="hidden">
                    <CardHeader
                      bg="purple.600"
                      color="white"
                      p={3}
                      cursor="pointer"
                      onClick={() => toggleDept(dept)}
                      _hover={{ bg: "purple.700" }}
                    >
                      <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="md">{dept}</Text>
                          <Badge colorScheme="green" fontSize="sm">
                            {groupedSubjects[dept].length} Subjects
                          </Badge>
                        </VStack>
                        <IconButton
                          icon={expandedDept[dept] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          size="sm"
                          variant="ghost"
                          color="white"
                          aria-label="Toggle"
                          _hover={{ bg: "purple.500" }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      </Flex>
                    </CardHeader>
                    <Collapse in={expandedDept[dept] === true} animateOpacity>
                      <CardBody p={0}>
                        <Table size="sm" variant="simple">
                          <Thead bg="gray.100">
                            <Tr>
                              <Th fontSize="xs">Subject</Th>
                              <Th fontSize="xs">Code</Th>
                              <Th fontSize="xs">Type</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {groupedSubjects[dept].map((subject) => (
                              <Tr key={subject._id} _hover={{ bg: "gray.50" }}>
                                <Td fontSize="xs" fontWeight="bold">{subject.subName}</Td>
                                <Td fontSize="xs">{subject.subCode}</Td>
                                <Td fontSize="xs">
                                  <Badge colorScheme="blue" fontSize="xs">{subject.type}</Badge>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </CardBody>
                    </Collapse>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>

            <HStack spacing={3} mb={4}>
              <Button colorScheme="teal" onClick={handleAddFirstYearFaculty}>
                Add First Year Faculty
              </Button>

              <Button colorScheme="orange" onClick={handleLockTT}>
                Lock First Year Time Table
              </Button>
            </HStack>

            <Portal>
              <Box
                bg={showMessage && message ? "rgba(255, 100, 0, 0.9)" : 0}
                color="white"
                textAlign="center"
                fontWeight="bold"
                fontSize="1.5rem"
                position="fixed"
                top="30%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex="999"
                borderRadius="20px"
                p="10px"
                opacity={showMessage ? 1 : 0}
              >
                <Text>{message}</Text>
              </Box>
            </Portal>

            <Box display="flex" mb={4} alignItems="center">
              <Text fontWeight="bold" mr={3}>
                Select Semester:
              </Text>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                maxW="200px"
              >
                {semesters.map((semester, index) => (
                  <option key={index} value={semester}>
                    {semester}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Timetable with New Design */}
            {Object.keys(timetableData).length === 0 ? (
              <Flex justify="center" align="center" minH="300px" bg="gray.50" borderRadius="2xl">
                <VStack spacing={4}>
                  <Text fontSize="lg" color="gray.600" fontWeight="semibold">Loading Timetable...</Text>
                </VStack>
              </Flex>
            ) : (
              <Box overflowX="auto" borderRadius="2xl" border="2px" borderColor="gray.200" boxShadow="inner" w="100%" maxW="100%">
                <Table size="sm" variant="simple" w="100%" tableLayout="fixed" bg="white">
                  <Thead bg="purple.600">
                    <Tr>
                      <Th color="white" fontSize="sm" p={2} textAlign="center" fontWeight="bold" w="100px">DAY</Th>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                        <Th key={p} color="white" fontSize="sm" p={2} textAlign="center" fontWeight="bold" w="160px">
                          {p}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {days.map((day, di) => (
                      <Tr
                        key={day}
                        bg="white"
                        _hover={{ bg: 'purple.50' }}
                        transition="background 0.2s"
                        borderBottom="1px"
                        borderColor="gray.200"
                      >
                        <Td fontWeight="bold" fontSize="sm" color="purple.700" p={2}>
                          {day}
                        </Td>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                          <Td key={period} p={2} verticalAlign="top" bg="white">
                            {timetableData[day][`period${period}`].map((slot, si) => (
                              <Box key={si}>
                                {slot.map((cell, ci) => {
                                  const isEnabled = subjects.some(subject => subject === cell.subject);
                                  return (
                                    <Box
                                      key={ci}
                                      mb={2}
                                      p={2}
                                      bg={isEnabled ? getSubjectColor(cell.subject) : 'gray.100'}
                                      borderRadius="md"
                                      borderWidth="2px"
                                      borderColor={isEnabled ? "gray.400" : "gray.300"}
                                      boxShadow="sm"
                                      _hover={{ boxShadow: 'md', borderColor: isEnabled ? 'purple.500' : 'gray.400' }}
                                      transition="all 0.2s"
                                      opacity={isEnabled ? 1 : 0.6}
                                    >
                                      {/* Subject Select (Disabled) */}
                                      <Select
                                        value={cell.subject}
                                        onChange={(event) =>
                                          handleCellChange(
                                            day,
                                            period,
                                            si,
                                            ci,
                                            "subject",
                                            event
                                          )
                                        }
                                        size="sm"
                                        borderColor="blue.400"
                                        fontSize="xs"
                                        fontWeight="bold"
                                        borderRadius="md"
                                        mb={1}
                                        bg="white"
                                        title={cell.subject || 'Select Subject'}
                                        _focus={{ borderColor: 'blue.600' }}
                                        isDisabled
                                      >
                                        <option value={cell.subject}>{cell.subject || "📚 Subject"}</option>
                                        {availableSubjects.map((subject) => (
                                          <option
                                            key={subject._id}
                                            value={subject.subName}
                                          >
                                            {subject.subName}
                                          </option>
                                        ))}
                                      </Select>

                                      {/* Room Select (Disabled) */}
                                      <Select
                                        value={cell.room}
                                        onChange={(event) =>
                                          handleCellChange(
                                            day,
                                            period,
                                            si,
                                            ci,
                                            "room",
                                            event
                                          )
                                        }
                                        size="sm"
                                        borderColor="green.400"
                                        fontSize="xs"
                                        fontWeight="bold"
                                        borderRadius="md"
                                        mb={1}
                                        bg="white"
                                        title={cell.room || 'Select Room'}
                                        _focus={{ borderColor: 'green.600' }}
                                        isDisabled
                                      >
                                        <option value={cell.room}>{cell.room || "🏢 Room"}</option>
                                        {availableRooms.map((roomOption) => (
                                          <option key={roomOption} value={roomOption}>
                                            {roomOption}
                                          </option>
                                        ))}
                                      </Select>

                                      {/* Faculty Select (Enabled based on subject) */}
                                      <Select
                                        value={cell.faculty}
                                        onChange={(event) =>
                                          handleCellChange(
                                            day,
                                            period,
                                            si,
                                            ci,
                                            "faculty",
                                            event
                                          )
                                        }
                                        size="sm"
                                        borderColor={isEnabled ? "purple.400" : "gray.300"}
                                        fontSize="xs"
                                        fontWeight="bold"
                                        borderRadius="md"
                                        mb={1}
                                        bg="white"
                                        title={cell.faculty || 'Select Faculty'}
                                        _focus={{ borderColor: 'purple.600' }}
                                        disabled={!isEnabled}
                                      >
                                        <option value="">👨‍🏫 Faculty</option>
                                        {availableFaculties.map((faculty, index) => (
                                          <option key={index} value={faculty}>
                                            {faculty}
                                          </option>
                                        ))}
                                      </Select>
                                    </Box>
                                  );
                                })}
                              </Box>
                            ))}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}

            <Button colorScheme="teal" mb={3} mt={5} ml={0} onClick={handleSubmit}>
              Save Timetable
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default FirstYearLoad;