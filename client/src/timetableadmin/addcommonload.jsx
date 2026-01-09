import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import Header from "../components/header";

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
  Flex,
  Badge,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertDescription,
  CheckboxGroup,
  Stack,
} from "@chakra-ui/react";
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
import { useToast } from "@chakra-ui/react";
import { ArrowBackIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";

function CommonLoadComponent() {
  const toast = useToast();
  const [faculty, setFaculty] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subFullName, setSubFullName] = useState("");
  const [subName, setSubName] = useState("");
  const [hrs, setHrs] = useState("");
  const [subType, setSubType] = useState("");
  const [subSem, setSubSem] = useState("");

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [commonLoadData, setCommonLoadData] = useState([]);
  const [isLoading, setIsLoading] = useState({
    state: false,
    id: "",
  });
  const [selectedCommonLoad, setSelectedCommonLoad] = useState(null);

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchCommonLoadData();
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, { credentials: 'include' })
      .then(handleResponse)
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSelectedDepartment(data[0].dept);
        } else if (data && data.dept) {
          // Handle case where data is a single object instead of array
          setSelectedDepartment(data.dept);
        } else {
          console.warn("No department data found");
        }
      })
      .catch(handleError);
  }, [currentCode]);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`, { credentials: 'include' })
        .then(handleResponse)
        .then((data) => {
          if (data && Array.isArray(data)) {
            setFaculties(data);
          } else {
            console.warn("No faculty data found for department:", selectedDepartment);
            setFaculties([]);
          }
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/subject/code/${currentCode}`, { credentials: 'include' })
      .then(handleResponse)
      .then((data) => {
        if (data && Array.isArray(data)) {
          setSubjectOptions(data);
        } else {
          console.warn("No subject data found");
          setSubjectOptions([]);
        }
      })
      .catch(handleError);
  }, [currentCode]);

  const handleFacultyCheckboxChange = (facultyName) => {
    setSelectedFaculties((prevSelectedFaculties) => {
      const updatedFaculties = prevSelectedFaculties.includes(facultyName)
        ? prevSelectedFaculties.filter((name) => name !== facultyName)
        : [...prevSelectedFaculties, facultyName];

      return updatedFaculties;
    });
  };

  const fetchCommonLoadData = () => {
    fetch(`${apiUrl}/timetablemodule/commonLoad/code/${currentCode}`, { credentials: 'include' })
      .then(handleResponse)
      .then((data) => {
        if (data && Array.isArray(data)) {
          setCommonLoadData(data);
        } else {
          console.warn("No common load data found");
          setCommonLoadData([]);
        }
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
    toast({
      title: "Error",
      description: error.message || "An error occurred while fetching data",
      status: "error",
      duration: 3000,
      isClosable: true,
      position: "bottom",
    });
  };

  const handleSubmit = () => {
    if (selectedFaculties.length === 0) {
      toast({
        title: "No Faculty Selected",
        description: "Please select at least one faculty member",
        status: "warning",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    const dataToSaveArray = selectedFaculties.map((facultyName) => ({
      faculty: facultyName,
      subCode: subCode,
      subFullName: subFullName,
      subName: subName,
      subType: subType,
      sem: subSem,
      hrs: hrs,
      code: currentCode,
    }));

    Promise.all(
      dataToSaveArray.map((dataToSave) =>
        fetch(`${apiUrl}/timetablemodule/commonLoad`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSave),
          credentials: "include",
        })
          .then(handleResponse)
          .catch(handleError)
      )
    )
      .then(() => {
        toast({
          title: "CommonLoad Added",
          description: "CommonLoad data added successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom",
        });
        fetchCommonLoadData();
        handleCancelEdit();
      })
      .catch(handleError);
  };

  const handleDelete = (commonLoadId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this CommonLoad?");

    if (!shouldDelete) {
      return;
    }

    setIsLoading({
      state: true,
      id: commonLoadId,
    });

    fetch(`${apiUrl}/timetablemodule/commonLoad/${commonLoadId}`, {
      method: "DELETE",
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        fetchCommonLoadData();
      })
      .then(() => {
        toast({
          title: "CommonLoad Deleted",
          description: "CommonLoad data deleted successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom",
        });
      })
      .catch(handleError)
      .finally(() => {
        setIsLoading({
          ...isLoading,
          state: false,
        });
      });
  };

  const handleChange = (e) => {
    const selectedSubCode = e.target.value;
    setSubCode(selectedSubCode);

    const selectedSubject = subjectOptions.find(option => option.subCode === selectedSubCode);

    if (selectedSubject) {
      setSubFullName(selectedSubject.subjectFullName);
      setSubName(selectedSubject.subName);
      setSubType(selectedSubject.type);
      setSubSem(selectedSubject.sem);
    }
  };

  const handleEdit = (commonLoadId) => {
    const selectedCommonLoad = commonLoadData.find(
      (commonLoad) => commonLoad._id === commonLoadId
    );

    setSelectedCommonLoad(selectedCommonLoad);
    setFaculty(selectedCommonLoad.faculty);
    setSelectedFaculties([selectedCommonLoad.faculty]); // Add faculty to the array for checkbox display
    setSubCode(selectedCommonLoad.subCode);
    setSubFullName(selectedCommonLoad.subFullName);
    setSubName(selectedCommonLoad.subName);
    setHrs(selectedCommonLoad.hrs);
    setSubType(selectedCommonLoad.subType);
    setSubSem(selectedCommonLoad.subSem);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setSelectedCommonLoad(null);
    setFaculty("");
    setSubCode("");
    setSubFullName("");
    setSubName("");
    setSubType("");
    setSubSem("");
    setHrs("");
    setSelectedFaculties([]);
  };

  const handleUpdate = () => {
    if (selectedFaculties.length === 0) {
      toast({
        title: "No Faculty Selected",
        description: "Please select a faculty member",
        status: "warning",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    const dataToUpdate = {
      faculty: selectedFaculties[0] || faculty, // Use first selected faculty or fallback to faculty state
      subCode: subCode,
      subFullName: subFullName,
      subName: subName,
      subType: subType,
      subSem: subSem,
      hrs: hrs,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/commonLoad/${selectedCommonLoad._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToUpdate),
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        toast({
          title: "CommonLoad Updated",
          description: "CommonLoad data updated successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom",
        });
        fetchCommonLoadData();
      })
      .catch(handleError);

    handleCancelEdit();
  };

  return (
    <Box bg="white" minH="100vh">
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
                Load Management
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Common Load Allocation
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Allocate major projects and common loads to faculty members. The load will appear directly in summary data.
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
        <VStack spacing={6} align="stretch">
          {/* Form Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="purple.600" color="white" p={4}>
              <Heading size="md">
                {selectedCommonLoad ? "Edit Common Load" : "Add Common Load"}
              </Heading>
            </CardHeader>
            <CardBody p={6}>
              {selectedCommonLoad && (
                <Alert status="info" mb={4} borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    You are editing an existing common load entry. Click "Cancel" to discard changes.
                  </AlertDescription>
                </Alert>
              )}

              <chakra.form
                onSubmit={(e) => {
                  e.preventDefault();
                  selectedCommonLoad ? handleUpdate() : handleSubmit();
                }}
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">Subject Code</FormLabel>
                    {subjectOptions.length === 0 ? (
                      <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription fontSize="sm">
                          No subjects available. Please add subjects first.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Select
                        value={subCode}
                        onChange={handleChange}
                        placeholder="Select Subject Code"
                        borderColor="purple.300"
                        _hover={{ borderColor: "purple.400" }}
                        _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #805AD5" }}
                      >
                        {subjectOptions.map((option) => (
                          <option key={option._id} value={option.subCode}>
                            {option.subCode}
                          </option>
                        ))}
                      </Select>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">Subject Abbreviation</FormLabel>
                    <Input
                      type="text"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder="Auto-filled on code selection"
                      isDisabled
                      bg="gray.50"
                      borderColor="gray.300"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">Subject Full Name</FormLabel>
                    <Input
                      type="text"
                      value={subFullName}
                      onChange={(e) => setSubFullName(e.target.value)}
                      placeholder="Auto-filled on code selection"
                      isDisabled
                      bg="gray.50"
                      borderColor="gray.300"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">Subject Type</FormLabel>
                    <Input
                      type="text"
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      placeholder="Auto-filled on code selection"
                      isDisabled
                      bg="gray.50"
                      borderColor="gray.300"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">Subject Semester</FormLabel>
                    <Input
                      type="text"
                      value={subSem}
                      onChange={(e) => setSubSem(e.target.value)}
                      placeholder="Auto-filled on code selection"
                      isDisabled
                      bg="gray.50"
                      borderColor="gray.300"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">Hours</FormLabel>
                    <Input
                      type="text"
                      value={hrs}
                      onChange={(e) => setHrs(e.target.value)}
                      placeholder="Enter Hours"
                      borderColor="purple.300"
                      _hover={{ borderColor: "purple.400" }}
                      _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #805AD5" }}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl mt={4}>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700" mb={0}>
                        Select Faculty Members
                      </FormLabel>
                      {selectedCommonLoad && (
                        <Text fontSize="xs" color="gray.600" fontWeight="normal" mt={1}>
                          Note: Only one faculty can be assigned per entry in edit mode
                        </Text>
                      )}
                    </Box>
                    {selectedFaculties.length > 0 && (
                      <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                        {selectedFaculties.length} Selected
                      </Badge>
                    )}
                  </Flex>
                  {faculties.length === 0 ? (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      <AlertDescription>
                        No faculty members found for this department. Please add faculty members first.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Box
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      borderColor="purple.200"
                      bg="purple.50"
                      maxH="300px"
                      overflowY="auto"
                    >
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                        {faculties.map((faculty, index) => (
                          <Checkbox
                            key={index}
                            value={faculty.name}
                            isChecked={selectedFaculties.includes(faculty.name)}
                            onChange={() => {
                              if (selectedCommonLoad) {
                                // In edit mode, only allow one selection
                                setSelectedFaculties([faculty.name]);
                              } else {
                                handleFacultyCheckboxChange(faculty.name);
                              }
                            }}
                            colorScheme="purple"
                            size="md"
                          >
                            <Text fontSize="sm" fontWeight="medium">{faculty.name}</Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </FormControl>

                <HStack spacing={3} mt={6}>
                  <Button
                    type="submit"
                    colorScheme="teal"
                    size="lg"
                    leftIcon={selectedCommonLoad ? <EditIcon /> : undefined}
                    isDisabled={subjectOptions.length === 0 || faculties.length === 0}
                  >
                    {selectedCommonLoad ? "Update" : "Submit"}
                  </Button>
                  {selectedCommonLoad && (
                    <Button
                      colorScheme="gray"
                      size="lg"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </HStack>
              </chakra.form>
            </CardBody>
          </Card>

          {/* Data Table Card */}
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
                <Heading size="md">Common Load Data</Heading>
                <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                  {commonLoadData.length} Entries
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody p={0}>
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
                      >
                        Faculty
                      </Th>
                      <Th
                        color="teal.700"
                        fontSize="sm"
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Subject Code
                      </Th>
                      <Th
                        color="teal.700"
                        fontSize="sm"
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Subject Full Name
                      </Th>
                      <Th
                        color="teal.700"
                        fontSize="sm"
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Subject Name
                      </Th>
                      <Th
                        color="teal.700"
                        fontSize="sm"
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Type
                      </Th>
                      <Th
                        color="teal.700"
                        fontSize="sm"
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Semester
                      </Th>
                      <Th
                        color="teal.700"
                        fontSize="sm"
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Hours
                      </Th>
                      <Th
                        color="teal.700"
                        fontSize="sm"
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Actions
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {commonLoadData.map((commonLoad) => (
                      <Tr
                        key={commonLoad._id}
                        _hover={{ bg: 'teal.50' }}
                        transition="background 0.2s"
                      >
                        <Td fontWeight="medium">{commonLoad.faculty}</Td>
                        <Td>
                          <Badge colorScheme="purple" fontSize="xs">
                            {commonLoad.subCode}
                          </Badge>
                        </Td>
                        <Td fontSize="sm">{commonLoad.subFullName}</Td>
                        <Td fontSize="sm" fontWeight="semibold">{commonLoad.subName}</Td>
                        <Td>
                          <Badge colorScheme="blue" fontSize="xs">
                            {commonLoad.subType}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme="green" fontSize="xs">
                            {commonLoad.subSem}
                          </Badge>
                        </Td>
                        <Td fontWeight="bold" color="teal.600">{commonLoad.hrs}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              colorScheme="teal"
                              size="sm"
                              onClick={() => handleEdit(commonLoad._id)}
                              aria-label="Edit"
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              size="sm"
                              onClick={() => handleDelete(commonLoad._id)}
                              isLoading={isLoading.state && isLoading.id === commonLoad._id}
                              aria-label="Delete"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

export default CommonLoadComponent;