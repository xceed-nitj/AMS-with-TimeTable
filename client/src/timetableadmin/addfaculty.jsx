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
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Wrap,
  WrapItem,
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

function Component() {
  const toast = useToast();
  const [sem, setSem] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [facultyData, setFacultyData] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [expandedSem, setExpandedSem] = useState({});
  const [lastModifiedSem, setLastModifiedSem] = useState(null);

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
    fetch(`${apiUrl}/timetablemodule/addsem/sem/${currentCode}`,{credentials: 'include'})
      .then(handleResponse)
      .then((data) => {
        setAvailableSemesters(data);
      })
      .catch(handleError);
  }, [currentCode]);

  useEffect(() => {
    fetchFacultyData();
    fetchAvailableDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`,{credentials: 'include',})
        .then(handleResponse)
        .then((data) => {
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  const fetchFacultyData = () => {
    fetch(`${apiUrl}/timetablemodule/addFaculty`,{credentials: 'include',})
      .then(handleResponse)
      .then((data) => {
        const filteredFacultyData = data.filter(
          (faculty) => faculty.code === currentCode
        );
        setFacultyData(filteredFacultyData);
      })
      .catch(handleError);
  };

  const fetchAvailableDepartments = () => {
    fetch(`${apiUrl}/timetablemodule/faculty/dept`,{credentials: 'include'})
      .then(handleResponse)
      .then((data) => {
        const formattedDepartments = data.map((department) => ({
          value: department,
          label: department,
        }));
        setAvailableDepartments(formattedDepartments);
      })
      .catch(handleError);
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

  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setSelectedDepartment(selectedDepartment);
  };

  const handleSubmit = () => {
    const dataToSave = {
      sem: sem,
      code: currentCode,
      faculty: selectedFaculties,
    };

    fetch(`${apiUrl}/timetablemodule/addFaculty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
      credentials: 'include',
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
        
        fetchFacultyData();
        setSelectedFaculties([]);
        setSem("");
        setSelectedDepartment("");
      })
      .catch(handleError);
  };

  const handleDelete = (facultyId, facultyName) => {
    const facultyToDelete = facultyData.find(
      (faculty) => faculty._id === facultyId
    );
  
    if (facultyToDelete) {
      const isConfirmed = window.confirm(
        `Are you sure you want to delete ${facultyName}?`
      );
  
      if (isConfirmed) {
        setIsLoading({
          state: true,
          id: facultyId,
        });
        const updatedFaculty = facultyToDelete.faculty.filter(
          (name) => name !== facultyName
        );
        facultyToDelete.faculty = updatedFaculty;
  
        fetch(`${apiUrl}/timetablemodule/addFaculty/${facultyId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(facultyToDelete),
          credentials: 'include',
        })
          .then(handleResponse)
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
            setLastModifiedSem(facultyToDelete.sem);
            setExpandedSem(prev => ({
              ...prev,
              [facultyToDelete.sem]: true
            }));
            
            fetchFacultyData();
          })
          .catch(handleError)
          .finally(() => {
            setIsLoading({
              ...isLoading,
              state: false,
            });
          });
      }
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
      // Move last modified semester to the top
      return [lastModifiedSem, ...semesters.filter(sem => sem !== lastModifiedSem)];
    }
    return semesters;
  };

  // Count total faculty entries
  const getTotalFacultyCount = () => {
    return facultyData.reduce((total, faculty) => total + faculty.faculty.length, 0);
  };

  return (
    <Box bg="white" minH="100vh">
      <Box>
        {/* Hero Header Section */}
        <Box 
          bgGradient="linear(to-r, pink.400, yellow.500, green.500)"
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
                  Faculty Management
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  Add Faculty
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Assign faculty members to semesters and manage teaching allocations.
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
                Add Faculty to Semester
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

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold">Department</FormLabel>
                    <Select
                      value={selectedDepartment}
                      onChange={handleDepartmentChange}
                      isRequired
                      size="lg"
                      bg="gray.50"
                      border="2px"
                      borderColor="gray.200"
                    >
                      <option value="">Select a Department</option>
                      {availableDepartments.map((department) => (
                        <option key={department.value} value={department.value}>
                          {department.label}
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
                                colorScheme="pink"
                              >
                                {faculty.name}
                              </Checkbox>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                      {selectedFaculties.length > 0 && (
                        <Text fontSize="sm" color="pink.600" mt={2} fontWeight="semibold">
                          {selectedFaculties.length} faculty selected
                        </Text>
                      )}
                    </FormControl>
                  )}

                  <Button
                    type="submit"
                    colorScheme="pink"
                    size="lg"
                    isDisabled={!sem || selectedFaculties.length === 0}
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
                Faculty Allocation (Total: {getTotalFacultyCount()})
              </Text>
              <SimpleGrid columns={{ base: 1 }} spacing={4}>
                {getSortedSemesters().map((sem) => {
                  const semesterFaculties = groupedFaculty[sem];
                  const facultyCount = semesterFaculties.reduce(
                    (total, faculty) => total + faculty.faculty.length, 
                    0
                  );

                  // Sort faculty entries - newest at top (reverse order)
                  const sortedFaculties = [...semesterFaculties].reverse();

                  return (
                    <Card 
                      key={sem} 
                      bg="white" 
                      boxShadow="xl" 
                      borderRadius="lg" 
                      overflow="hidden" 
                      border="2px" 
                      borderColor={lastModifiedSem === sem ? "green.400" : "gray.200"}
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
                                {sortedFaculties.map((faculty) =>
                                  faculty.faculty.map((individualFaculty, index) => (
                                    <Tr key={`${faculty._id}-${index}`} _hover={{ bg: "pink.50" }}>
                                      <Td>
                                        <Center>
                                          <Text fontWeight="semibold">{individualFaculty}</Text>
                                        </Center>
                                      </Td>
                                      <Td>
                                        <Center>
                                          <Button
                                            isLoading={
                                              isLoading.state && isLoading.id == faculty._id
                                            }
                                            colorScheme="red"
                                            size="xs"
                                            onClick={() =>
                                              handleDelete(faculty._id, individualFaculty)
                                            }
                                            _hover={{ transform: 'scale(1.05)' }}
                                            transition="all 0.2s"
                                          >
                                            Delete
                                          </Button>
                                        </Center>
                                      </Td>
                                    </Tr>
                                  ))
                                )}
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
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

export default Component;