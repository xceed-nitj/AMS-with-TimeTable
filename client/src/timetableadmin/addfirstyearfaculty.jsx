import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import getEnvironment from "../getenvironment";
import {
  Box,
  Center,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Text,
  chakra,
  Checkbox,
  VStack,
  HStack,
  Badge,
  IconButton,
  Flex,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Wrap,
  WrapItem,
  Spinner,
} from "@chakra-ui/react";
import { CustomTh, CustomLink, CustomBlueButton } from "../styles/customStyles";
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
import { 
  ArrowBackIcon, 
  ChevronDownIcon, 
  ChevronUpIcon 
} from "@chakra-ui/icons";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";

function FirstYearFaculty() {
  const toast = useToast();
  const [sem, setSem] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [facultyData, setFacultyData] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [currentDepartment, setCurrentDepartment] = useState("");
  const [currentSession, setCurrentSession] = useState("");
  const [firstYearCode, setFirstYearCode] = useState("");
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [expandedSem, setExpandedSem] = useState({});
  const [lastModifiedSem, setLastModifiedSem] = useState(null);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState({
    state: false,
    id: "",
  });

  const [editFacultyData] = useState({
    facultyId: null,
    facultyName: "",
  });

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const apiUrl = getEnvironment();

  useEffect(() => {
    const initializeData = async () => {
      await fetchTTData(currentCode);
    };
    initializeData();
  }, []);

  useEffect(() => {
    const loadDependentData = async () => {
      if (currentDepartment && currentCode) {
        setIsTableLoading(true);
        await Promise.all([
          fetchFirstYearSubjects(currentCode, currentDepartment),
          fetchFacultyOptions(currentDepartment),
          fetchFacultyData(currentCode, currentDepartment)
        ]);
        setIsTableLoading(false);
      }
    };
    loadDependentData();
  }, [currentDepartment, currentCode]);

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
      toast({
        position: 'bottom',
        title: "Error",
        description: "Failed to fetch department data",
        status: "error",
        duration: 2000,
        isClosable: true,
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
      console.log("subdata", data);

      if (data && data.length > 0) {
        const uniqueSemesters = [...new Set(data.map((item) => item.sem))];
        console.log("uniqueSemesters", uniqueSemesters);
        setAvailableSemesters(uniqueSemesters);
        setFirstYearCode(data[0].code);
        console.log("firstcode", data[0].code);
      }
    } catch (error) {
      console.error("Error fetching subject data:", error);
    }
  };

  const fetchFacultyOptions = async (currentDepartment) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/faculty/dept/${currentDepartment}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      console.log("faculty options", data);
      setFaculties(data);
    } catch (error) {
      console.error("Error fetching faculty options:", error);
    }
  };

  const fetchFacultyData = async (currentCode, currentDepartment) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/addfaculty/firstyearfaculty/${currentDepartment}/${currentCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      console.log("faculty data received:", data);
      setFacultyData(data);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  const deleteFacultyData = async (currentCode, sem, faculty) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/addfaculty/deletefirstyearfaculty/${currentCode}/${sem}/${faculty}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      await fetchFacultyData(currentCode, currentDepartment);
    } catch (error) {
      console.error("Error deleting faculty:", error);
    }
  };

  const handleResponse = (response) => {
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  };

  const handleError = (error) => {
    console.error("Error:", error);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const dataToSave = {
      sem: sem,
      code: firstYearCode,
      faculty: selectedFaculties,
    };

    fetch(`${apiUrl}/timetablemodule/addFaculty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
      credentials: "include",
    })
      .then(handleResponse)
      .then((data) => {
        toast({
          position: 'bottom',
          title: "Faculty Added",
          description: "Selected faculty added to the semester",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        // Set the last modified semester and expand it
        setLastModifiedSem(sem);
        setExpandedSem(prev => ({
          ...prev,
          [sem]: true
        }));

        fetchFacultyData(currentCode, currentDepartment);
        setSelectedFaculties([]);
        setSem("");
      })
      .catch(handleError)
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = (facultyItem) => {
    const facultySem = facultyItem.sem;
    const facultyName = facultyItem.faculty;
    
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${facultyName}?`
    );

    if (isConfirmed) {
      const index = facultyData.findIndex(f => f.sem === facultySem && f.faculty === facultyName);
      
      setIsLoading({
        state: true,
        id: index,
      });

      deleteFacultyData(currentCode, facultySem, facultyName)
        .then(() => {
          toast({
            position: 'bottom',
            title: "Faculty Deleted",
            description: "Faculty deleted successfully",
            status: "success",
            duration: 2000,
            isClosable: true,
          });

          // Set the last modified semester and keep it expanded
          setLastModifiedSem(facultySem);
          setExpandedSem(prev => ({
            ...prev,
            [facultySem]: true
          }));
        })
        .finally(() => {
          setIsLoading({
            state: false,
            id: "",
          });
        });
    }
  };

  const handleFacultyCheckboxChange = (facultyName) => {
    setSelectedFaculties((prevSelectedFaculties) => {
      if (prevSelectedFaculties.includes(facultyName)) {
        return prevSelectedFaculties.filter((name) => name !== facultyName);
      } else {
        return [...prevSelectedFaculties, facultyName];
      }
    });
  };

  // Group faculty by semester
  const groupFacultyBySemester = () => {
    const grouped = {};
    facultyData.forEach(faculty => {
      const sem = faculty.sem || 'Unassigned';
      if (!grouped[sem]) {
        grouped[sem] = [];
      }
      grouped[sem].push(faculty);
    });
    return grouped;
  };

  const toggleSem = (sem) => {
    setExpandedSem(prev => ({
      ...prev,
      [sem]: !prev[sem]
    }));
  };

  const groupedFaculty = groupFacultyBySemester();

  // Sort semesters - last modified at top
  const getSortedSemesters = () => {
    const semesters = Object.keys(groupedFaculty).sort();
    if (lastModifiedSem && semesters.includes(lastModifiedSem)) {
      return [lastModifiedSem, ...semesters.filter(sem => sem !== lastModifiedSem)];
    }
    return semesters;
  };

  // Count total faculty entries
  const getTotalFacultyCount = () => {
    return facultyData.length;
  };

  return (
    <Box bg="white" minH="100vh">
      <Box>
        {/* Hero Header Section */}
        <Box 
          bgGradient="linear(to-r, orange.400, red.500, pink.500)"
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
                  First Year Management
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  Add First Year Faculty
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Assign faculty members to first year semesters and manage teaching allocations.
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

        <Container maxW="5xl" mt={-12} position="relative" zIndex={1} pb={16}>
          <VStack spacing={8} align="stretch">
            {/* Add Faculty Form */}
            <Box 
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              p={6}
              border="1px"
              borderColor="gray.300"
            >
              <Text fontWeight="bold" fontSize="lg" mb={4}>
                Add Faculty to First Year Semester
              </Text>
              <chakra.form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold">Semester</FormLabel>
                    <Select
                      value={sem}
                      onChange={(e) => setSem(e.target.value)}
                      isRequired
                      size="lg"
                      bg="gray.50"
                      border="2px"
                      borderColor="gray.200"
                    >
                      <option value="" disabled>
                        Select Semester
                      </option>
                      {availableSemesters.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {faculties.length > 0 && (
                    <FormControl>
                      <FormLabel fontWeight="semibold">Faculty (Select Multiple)</FormLabel>
                      <Box 
                        p={4} 
                        bg="gray.50" 
                        borderRadius="md" 
                        border="2px" 
                        borderColor="gray.200"
                      >
                        <Wrap spacing={4}>
                          {faculties.map((faculty, index) => (
                            <WrapItem key={index}>
                              <Checkbox
                                value={faculty.name}
                                isChecked={selectedFaculties.includes(faculty.name)}
                                onChange={() => handleFacultyCheckboxChange(faculty.name)}
                                size="md"
                                colorScheme="orange"
                              >
                                {faculty.name}
                              </Checkbox>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                      {selectedFaculties.length > 0 && (
                        <Text fontSize="sm" color="orange.600" mt={2} fontWeight="semibold">
                          {selectedFaculties.length} faculty selected
                        </Text>
                      )}
                    </FormControl>
                  )}

                  <Button
                    type="submit"
                    colorScheme="orange"
                    size="lg"
                    isDisabled={!sem || selectedFaculties.length === 0}
                    isLoading={isSubmitting}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Add Selected Faculty
                  </Button>
                </VStack>
              </chakra.form>
            </Box>

            {/* Faculty Data - Semester-wise */}
            <Box>
              <Text fontWeight="bold" fontSize="xl" mb={4}>
                First Year Faculty Allocation (Total: {getTotalFacultyCount()})
              </Text>
              
              {isTableLoading ? (
                <Box 
                  bg="white"
                  borderRadius="2xl"
                  shadow="xl"
                  p={16}
                  textAlign="center"
                  border="1px"
                  borderColor="gray.300"
                >
                  <VStack spacing={4}>
                    <Spinner size="xl" color="orange.500" thickness="4px" />
                    <Text fontSize="lg" color="gray.600">Loading faculty data...</Text>
                  </VStack>
                </Box>
              ) : (
                <>
                  <SimpleGrid columns={{ base: 1 }} spacing={4}>
                    {getSortedSemesters().map((sem) => {
                      const semesterFaculties = groupedFaculty[sem];
                      const facultyCount = semesterFaculties.length;

                      return (
                        <Card 
                          key={sem} 
                          bg="white" 
                          boxShadow="xl" 
                          borderRadius="lg" 
                          overflow="hidden" 
                          border="2px" 
                          borderColor={lastModifiedSem === sem ? "orange.400" : "gray.200"}
                        >
                          <CardHeader
                            bg={lastModifiedSem === sem ? "green.500" : "green.600"}
                            color="white"
                            p={4}
                            cursor="pointer"
                            onClick={() => toggleSem(sem)}
                            _hover={{ bg: lastModifiedSem === sem ? "green.600" : "green.700" }}
                          >
                            <Flex justify="space-between" align="center" flexDirection={{ base: "column", sm: "row" }} gap={2}>
                              <HStack spacing={3}>
                                <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>{sem}</Text>
                                <Badge colorScheme="green" fontSize={{ base: "xs", md: "md" }} p={2}>
                                  {facultyCount} Faculty
                                </Badge>
                                {lastModifiedSem === sem && (
                                  <Badge colorScheme="whiteAlpha" fontSize="xs">
                                    Recently Updated
                                  </Badge>
                                )}
                              </HStack>
                              <IconButton
                                icon={expandedSem[sem] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                size="sm"
                                variant="ghost"
                                color="white"
                                aria-label="Toggle"
                                _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              />
                            </Flex>
                          </CardHeader>
                          <Collapse in={expandedSem[sem] === true} animateOpacity>
                            <CardBody p={0}>
                              <Box overflowX="auto">
                                <Table size="sm" variant="simple">
                                  <Thead bg="gray.100">
                                    <Tr>
                                      <Th fontSize="xs" textAlign="center">Faculty Name</Th>
                                      <Th fontSize="xs" textAlign="center">Actions</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {semesterFaculties.map((facultyItem, index) => {
                                      const globalIndex = facultyData.findIndex(
                                        f => f.sem === facultyItem.sem && f.faculty === facultyItem.faculty
                                      );
                                      return (
                                        <Tr key={index} _hover={{ bg: "orange.50" }}>
                                          <Td>
                                            <Center>
                                              <Text fontWeight="semibold">{facultyItem.faculty}</Text>
                                            </Center>
                                          </Td>
                                          <Td>
                                            <Center>
                                              <Button
                                                colorScheme="red"
                                                size="xs"
                                                onClick={() => handleDelete(facultyItem)}
                                                isLoading={isLoading.state && isLoading.id === globalIndex}
                                                _hover={{ transform: 'scale(1.05)' }}
                                                transition="all 0.2s"
                                              >
                                                Delete
                                              </Button>
                                            </Center>
                                          </Td>
                                        </Tr>
                                      );
                                    })}
                                  </Tbody>
                                </Table>
                              </Box>
                            </CardBody>
                          </Collapse>
                        </Card>
                      );
                    })}
                  </SimpleGrid>

                  {/* Empty State */}
                  {Object.keys(groupedFaculty).length === 0 && (
                    <Box 
                      bg="white"
                      borderRadius="2xl"
                      shadow="xl"
                      p={8}
                      textAlign="center"
                      border="1px"
                      borderColor="gray.300"
                    >
                      <Text color="gray.500" fontSize="md">
                        No faculty allocated yet. Add your first faculty above!
                      </Text>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

export default FirstYearFaculty;