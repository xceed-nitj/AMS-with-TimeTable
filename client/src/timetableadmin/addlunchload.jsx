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
  Box,
  Heading,
  Text,
  Flex,
  Badge,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
} from "@chakra-ui/react";
import { ArrowBackIcon, AddIcon, DeleteIcon } from "@chakra-ui/icons";
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

        const filteredLunchData = data.lunchrecords.filter(
          (record) => record.sem === selectedSemester
        );

        setLunchData(filteredLunchData);

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
        slot: "lunch",
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

      const selectedSemesterData = lunchData
        .filter((record) => record.sem === selectedSemester)
        .map(({ sem, day, slot, slotData }) => ({
          sem,
          day,
          slot,
          slotData,
        }));

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
            selectedSemester,
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
          position: "bottom",
          title: "Lunch Slot Updated",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
      setLunchData(responseData.lunchrecords);
    } catch (error) {
      console.error(`Error making POST request: ${error.message}`);
      toast({
        position: "bottom",
        title: "Error",
        description: "Failed to update lunch slot",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
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
    <Box bg="white" minH="100vh">
      {/* Hero Header Section */}
      <Box
        bgGradient="linear(to-r, blue.700, blue.500, green.200)"
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
        <Box
          position="relative"
          zIndex={2}
          sx={{
            '& button[aria-label="Go back"]': { display: "none" },
            '& .chakra-button:first-of-type': { display: "none" },
          }}
        >
          <Header />
        </Box>

        <Container maxW="7xl" position="relative" mt={8}>
          <Flex justify="space-between" align="center" w="full" gap={4}>
            <VStack spacing={4} align="start" flex="1">
              <Badge
                colorScheme="whiteAlpha"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                Lunch Hour Management
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Add Lunch Hour Load
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Manage lunch hour allocations for faculty members across different days and semesters.
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
              _hover={{ bg: "rgba(255, 255, 255, 0.3)" }}
              _active={{ bg: "rgba(255, 255, 255, 0.4)" }}
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
        <VStack spacing={6} align="stretch">
          {/* Semester Selection Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="purple.600" color="white" p={4}>
              <Heading size="md">Select Semester</Heading>
            </CardHeader>
            <CardBody p={6}>
              <HStack spacing={4}>
                <FormControl flex="1">
                  <FormLabel fontWeight="semibold" color="gray.700">
                    Semester
                  </FormLabel>
                  <Select
                    placeholder="Select semester"
                    value={selectedSemester}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 1px #805AD5",
                    }}
                    size="lg"
                  >
                    {availableSems.map((semester, index) => (
                      <option key={`semester-option-${index}`} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  colorScheme="teal"
                  size="lg"
                  leftIcon={<AddIcon />}
                  onClick={handleAddSlotRow}
                  mt={8}
                  isDisabled={!selectedSemester}
                >
                  Add Lunch Slot
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Lunch Slots Table Card */}
          {selectedSemester && (
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="teal.600" color="white" p={4}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Lunch Hour Slots</Heading>
                  <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                    {lunchData.filter((record) => record.sem === selectedSemester).length} Slots
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody p={6}>
                {lunchData.filter((record) => record.sem === selectedSemester).length === 0 ? (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                      No lunch slots available for the selected semester. Click "Add Lunch Slot" to create one.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Box
                    overflowX="auto"
                    sx={{
                      '&::-webkit-scrollbar': {
                        height: '10px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'gray.100',
                        borderRadius: 'full',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'teal.400',
                        borderRadius: 'full',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: 'teal.500',
                      },
                    }}
                  >
                    <Table variant="simple" size="md">
                      <Thead bg="teal.50">
                        <Tr>
                          <Th
                            color="teal.700"
                            fontSize="sm"
                            fontWeight="bold"
                            borderBottom="2px"
                            borderColor="teal.200"
                            w="200px"
                          >
                            Day
                          </Th>
                          <Th
                            color="teal.700"
                            fontSize="sm"
                            fontWeight="bold"
                            borderBottom="2px"
                            borderColor="teal.200"
                          >
                            Slot Details
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {lunchData
                          .filter((record) => record.sem === selectedSemester)
                          .map((record, rowIndex) => (
                            <Tr
                              key={rowIndex}
                              _hover={{ bg: "teal.50" }}
                              transition="background 0.2s"
                            >
                              <Td verticalAlign="top">
                                <Select
                                  placeholder="Select Day"
                                  value={record.day}
                                  onChange={(e) => handleDayChange(rowIndex, e.target.value)}
                                  borderColor="blue.300"
                                  _hover={{ borderColor: "blue.400" }}
                                  _focus={{
                                    borderColor: "blue.500",
                                    boxShadow: "0 0 0 1px #3182CE",
                                  }}
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
                                <VStack spacing={4} align="stretch">
                                  {record.slotData.map((slot, slotIndex) => (
                                    <Box
                                      key={slotIndex}
                                      p={4}
                                      bg="gray.50"
                                      borderRadius="lg"
                                      borderWidth="1px"
                                      borderColor="gray.200"
                                    >
                                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
                                        <FormControl>
                                          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                                            Subject
                                          </FormLabel>
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
                                            borderColor="purple.300"
                                            _hover={{ borderColor: "purple.400" }}
                                            _focus={{
                                              borderColor: "purple.500",
                                              boxShadow: "0 0 0 1px #805AD5",
                                            }}
                                            size="sm"
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
                                          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                                            Room
                                          </FormLabel>
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
                                            borderColor="green.300"
                                            _hover={{ borderColor: "green.400" }}
                                            _focus={{
                                              borderColor: "green.500",
                                              boxShadow: "0 0 0 1px #38A169",
                                            }}
                                            size="sm"
                                          >
                                            {availableRooms.map((roomOption) => (
                                              <option key={roomOption._id} value={roomOption}>
                                                {roomOption}
                                              </option>
                                            ))}
                                          </Select>
                                        </FormControl>

                                        <FormControl>
                                          <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                                            Faculty
                                          </FormLabel>
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
                                            borderColor="orange.300"
                                            _hover={{ borderColor: "orange.400" }}
                                            _focus={{
                                              borderColor: "orange.500",
                                              boxShadow: "0 0 0 1px #DD6B20",
                                            }}
                                            size="sm"
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
                                      </SimpleGrid>

                                      <Flex justify="flex-end">
                                        <IconButton
                                          icon={<DeleteIcon />}
                                          colorScheme="red"
                                          size="sm"
                                          onClick={() => handleDeleteSlot(rowIndex, slotIndex)}
                                          aria-label="Delete slot"
                                        />
                                      </Flex>
                                    </Box>
                                  ))}

                                  <HStack spacing={3}>
                                    <Button
                                      colorScheme="teal"
                                      size="sm"
                                      leftIcon={<AddIcon />}
                                      onClick={() => handleAdditionalSlot(rowIndex)}
                                    >
                                      Add More Slot
                                    </Button>
                                    <Button
                                      colorScheme="red"
                                      size="sm"
                                      leftIcon={<DeleteIcon />}
                                      onClick={() => handleDeleteRow(rowIndex)}
                                    >
                                      Delete All Slots
                                    </Button>
                                  </HStack>
                                </VStack>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          )}

          {/* Submit Button */}
          {selectedSemester && lunchData.filter((record) => record.sem === selectedSemester).length > 0 && (
            <Flex justify="center">
              <Button colorScheme="teal" size="lg" onClick={handlePostRequest} minW="200px">
                Submit Changes
              </Button>
            </Flex>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default LunchLoad;