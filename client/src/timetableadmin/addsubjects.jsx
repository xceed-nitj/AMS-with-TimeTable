import React, { useState, useEffect } from "react";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";
import {
  Container,
  Heading,
  Input,
  Box,
  FormLabel,
  FormControl,
  Select,
  UnorderedList,
  Text,
  Center,
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
  useToast,
  Wrap,
  WrapItem,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomDeleteButton,
  CustomTealButton,
} from "../styles/customStyles";

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
  ChevronDownIcon, 
  ChevronUpIcon, 
  AddIcon, 
  DeleteIcon, 
  EditIcon, 
  CheckIcon, 
  CloseIcon, 
  InfoIcon,
  TriangleUpIcon,
  TriangleDownIcon,
  ArrowBackIcon
} from "@chakra-ui/icons";
import Header from '../components/header';

function Subject() {
  const toast = useToast();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [semesterData, setSemesterData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [isStudentCountValid, setIsStudentCountValid] = useState(true);
  const [duplicateEntryMessage, setDuplicateEntryMessage] = useState("");
  const [addduplicateEntryMessage, addsetDuplicateEntryMessage] = useState("");
  const [isAddSubjectFormVisible, setIsAddSubjectFormVisible] = useState(false);
  const [expandedSem, setExpandedSem] = useState({});
  const [showDepartments, setShowDepartments] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'gray.900');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  const [editedData, setEditedData] = useState({
    subjectFullName: "",
    type: "",
    subCode: "",
    subName: "",
    studentCount: "",
    sem: "",
    degree: "",
    dept: "",
    credits: "",
    code: currentCode,
  });
  
  const [editedSData, setEditedSData] = useState({
    subjectFullName: "",
    type: "",
    subCode: "",
    subName: "",
    studentCount: "",
    sem: "",
    degree: "",
    dept: "",
    credits: "",
    code: currentCode,
  });

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchData();
  }, [currentCode]); 

  const fetchData = () => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/subject?code=${currentCode}`, {
        credentials: "include",
      }) 
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          const filteredData = data.filter((item) => item.code === currentCode);
          setTableData(filteredData);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } else {
      setTableData([]);
    }
  };

  const downloadCSV = () => {
    if (tableData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = [
      "subjectFullName",
      "type",
      "subCode",
      "subName",
      "studentCount",
      "sem",
      "degree",
      "dept",
      "credits"
    ];

    const csvRows = tableData.map(row => [
      `"${row.subjectFullName || ""}"`,
      `"${row.type || ""}"`,
      `"${row.subCode || ""}"`,
      `"${row.subName || ""}"`,
      `"${row.studentCount || ""}"`,
      `"${row.sem || ""}"`,
      `"${row.degree || ""}"`,
      `"${row.dept || ""}"`,
      `"${row.credits || ""}"`
    ].join(","));

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Subject_Data_Template_${currentCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  useEffect(() => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, {
        credentials: "include",
      }) 
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          const filteredSemesters = data.filter(
            (semester) => semester.code === currentCode
          );
          setSemesterData(filteredSemesters);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [currentCode]);
 
  useEffect(() => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          const filteredSemesters = data.filter((semester) => semester.code === currentCode);
          setSemesters(filteredSemesters);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  }, [currentCode]);

  // Fetch department data from mastersem route
  useEffect(() => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/mastersem`, {
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          setDepartmentData(data);
          console.log('Fetched Departments:', data);
        })
        .catch((error) => {
          console.error('Error fetching departments:', error);
        });
    }
  }, [currentCode]);

  // Get unique departments
  const getUniqueDepartments = () => {
    const uniqueDepts = [...new Set(departmentData.map(dept => dept.dept))];
    return uniqueDepts.filter(dept => dept);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('code', currentCode); 
      setIsLoading(true);
  
      fetch(`${apiUrl}/upload/subject`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          setUploadState(true);
          setUploadMessage('File uploaded successfully');
          return response.json();
        })
        .then((data) => {
          if (data.message) {
            if(data.message.includes('type')) setUploadMessage(data.message);
            else
            setDuplicateEntryMessage(data.message);
          } else {
            fetchData(); 
            setDuplicateEntryMessage(''); 
          }
          setIsLoading(false);
          toast({
            title: 'Upload Successful',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top',
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          setIsLoading(false);
          toast({
            title: 'Upload Failed',
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top',
          });
        })
        .finally(() => {
          setIsLoading(false);
          setTimeout(() => {
            setUploadMessage('');
          }, 4000);
        });
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };
  
  useEffect(() => {
    fetchData();
    if (uploadState) {
      setUploadState(false);
    }
  }, [currentCode, uploadState]);

  const handleEditClick = (_id) => {
    setEditRowId(_id);
    const editedRow = tableData.find((row) => row._id === _id);
    if (editedRow) {
      setEditedData({ ...editedRow });
    }
  };

  const handleSaveEdit = () => {
    if (editRowId) {
      const rowIndex = tableData.findIndex((row) => row._id === editRowId);
      if (rowIndex !== -1) {
        const updatedData = [...tableData];
        updatedData[rowIndex] = editedData;

        fetch(`${apiUrl}/timetablemodule/subject/${editRowId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedData),
          credentials: "include",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Error: ${response.status} - ${response.statusText}`
              );
            }
            return response.json();
          })
          .then((data) => {
            setTableData(updatedData);
            setEditRowId(null);
            setEditedData({
              _id: null, 
              subjectFullName: "",
              type: "",
              subCode: "",
              subName: "",
              studentCount: "",
              sem: "",
              degree: "",
              dept: "",
              credits: "",
              code: currentCode,
            });
            toast({
              title: 'Subject Updated',
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top',
            });
          })
          .catch((error) => {
            console.error("Update Error:", error);
            toast({
              title: 'Update Failed',
              status: 'error',
              duration: 3000,
              isClosable: true,
              position: 'top',
            });
          });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedData({
      _id: null,
      subjectFullName: "",
      type: "",
      subCode: "",
      subName: "",
      studentCount: "",
      sem: "",
      degree: "",
      dept: "",
      credits: "",
      code: currentCode,
    });
  };

  const handleDelete = (_id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this entry?");
    
    if (isConfirmed) {
      fetch(`${apiUrl}/timetablemodule/subject/${_id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          const updatedData = tableData.filter((row) => row._id !== _id);
          setTableData(updatedData);
          toast({
            title: 'Subject Deleted',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top',
          });
        })
        .catch((error) => {
          console.error("Delete Error:", error);
          toast({
            title: 'Delete Failed',
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top',
          });
        });
    }
  };
  
  const handleCancelAddSubject = () => {
    setIsAddSubjectFormVisible(false);
  };

  const handleAddSubject = () => {
    setEditedSData({
      subjectFullName: "",
      type: "",
      subCode: "",
      subName: "",
      studentCount: "",
      sem: "",
      degree: "",
      dept: "",
      credits: "",
      code: currentCode,
    });
    setIsAddSubjectFormVisible(true);
  };

  const handleSaveNewSubject = () => {
    const isDuplicateEntry = tableData.some(
      (row) => row.subName === editedSData.subName
    );

    if (isDuplicateEntry) {
      addsetDuplicateEntryMessage(
        `Duplicate entry for "${editedSData.subName}" is detected. Kindly delete the entry.`
      );
    } else {
      fetch(`${apiUrl}/timetablemodule/subject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedSData),
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          fetchData();
          handleCancelAddSubject();
          addsetDuplicateEntryMessage("");
          toast({
            title: 'Subject Added',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top',
          });
        })
        .catch((error) => {
          console.error("Error:", error);
          toast({
            title: 'Add Failed',
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top',
          });
        });
    }
  };

  const handleDeleteAll = () => {
    if (currentCode) {
      if (
        window.confirm(
          "Are you sure you want to delete all entries with the current code?"
        )
      ) {
        fetch(`${apiUrl}/timetablemodule/subject/deletebycode/${currentCode}`, {
          method: "DELETE",
          credentials: "include",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Error: ${response.status} - ${response.statusText}`
              );
            }
            return response.json();
          })
          .then((data) => {
            fetchData();
            toast({
              title: 'All Subjects Deleted',
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top',
            });
          })
          .catch((error) => {
            console.error("Delete All Error:", error);
            toast({
              title: 'Delete Failed',
              status: 'error',
              duration: 3000,
              isClosable: true,
              position: 'top',
            });
          });
      }
    }
  };

  // Sorting function
  const handleSort = (key, semesterKey) => {
    let direction = 'asc';
    if (sortConfig.key === `${semesterKey}-${key}` && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: `${semesterKey}-${key}`, direction, semester: semesterKey });
  };

  const getSortedData = (data, key) => {
    if (!sortConfig.key || !sortConfig.key.includes(key)) {
      return data;
    }

    const sortedData = [...data].sort((a, b) => {
      const aValue = a[key] || '';
      const bValue = b[key] || '';

      if (key === 'studentCount') {
        return sortConfig.direction === 'asc' 
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortedData;
  };

  const getSortIcon = (key, semesterKey) => {
    if (sortConfig.key !== `${semesterKey}-${key}`) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />;
  };

  // Group subjects by semester
  const groupSubjectsBySemester = () => {
    const grouped = {};
    tableData.forEach(subject => {
      const sem = subject.sem || 'Unassigned';
      if (!grouped[sem]) {
        grouped[sem] = [];
      }
      grouped[sem].push(subject);
    });
    return grouped;
  };

  const toggleSem = (sem) => {
    setExpandedSem(prev => ({
      ...prev,
      [sem]: !prev[sem]
    }));
  };

  const groupedSubjects = groupSubjectsBySemester();
  const uniqueDepartments = getUniqueDepartments();

  return (
    <Box bgGradient={bgGradient} minH="100vh">
      <Box pb={16}>
        {/* Hero Header Section */}
        <Box 
          bgGradient="linear(to-r, purple.500, purple.600, pink.600)"
          pt={4}
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

          <Container maxW="7xl" position="relative" mt={-7}>
            <Flex justify="space-between" align="center" w="full" gap={1}>
              <VStack spacing={4} align="start" flex="1">
                <Badge colorScheme="whiteAlpha" fontSize="sm" px={3} py={1} borderRadius="full">
                  Subject Management
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  Add & Manage Subjects
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Create, edit, and organize subjects across all semesters.
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

        <Container maxW="7xl" mt={-12} position="relative" zIndex={1}>
          <VStack spacing={8} align="stretch">
            {/* Total Subjects Count */}

            {/* Batch Upload Section */}
            <Box 
              bg={cardBg}
              borderRadius="2xl"
              shadow="2xl"
              p={6}
              border="1px"
              borderColor={borderColor}
            >
              <Text fontWeight="bold" fontSize="lg" mb={3}>Batch Upload</Text>
              <VStack spacing={3} align="stretch">
                <HStack spacing={2} flexDirection={{ base: "column", md: "row" }}>
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    name="XlsxFile"
                  />
                  <Button
                    colorScheme="teal"
                    onClick={handleUpload}
                    isLoading={isLoading}
                    minW="150px"
                  >
                    Upload
                  </Button>
                  <FileDownloadButton
                    fileUrl="/subject_template.xlsx"
                    fileName="subject_template.xlsx"
  
                  />
                </HStack>
              </VStack>
              {uploadMessage && (
                <Text mt={2} color="green.600" fontWeight="bold">{uploadMessage}</Text>
              )}
              {duplicateEntryMessage && (
                <Text mt={2} color="red.600">{duplicateEntryMessage}</Text>
              )}
            </Box>

            {/* Available Semesters */}
            <Box 
              bg={cardBg}
              borderRadius="2xl"
              shadow="xl"
              p={6}
              border="1px"
              borderColor={borderColor}
            >
              <Text fontWeight="bold" fontSize="md" mb={3}>
                Available Semesters:
              </Text>
              <Wrap spacing={2}>
                {semesterData.map((semester) => (
                  <WrapItem key={semester.code}>
                    <Badge colorScheme="purple" fontSize="sm" p={2}>
                      {semester.sem}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>

            {/* Add Subject Form */}
            {isAddSubjectFormVisible ? (
              <Box 
                bg={cardBg}
                borderRadius="2xl"
                shadow="2xl"
                p={6}
                border="2px"
                borderColor="purple.200"
              >
                <Text fontWeight="bold" fontSize="xl" mb={4} color="purple.700">
                  Add New Subject
                </Text>
                <FormControl isRequired>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <FormLabel fontWeight="bold">Subject Full Name*</FormLabel>
                      <Input
                        placeholder="Subject Full Name"
                        required
                        value={editedSData.subjectFullName}
                        onChange={(e) =>
                          setEditedSData({
                            ...editedSData,
                            subjectFullName: e.target.value,
                          })
                        }
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">Type</FormLabel>
                      <Input
                        placeholder="Core/Elective"
                        value={editedSData.type}
                        onChange={(e) =>
                          setEditedSData({ ...editedSData, type: e.target.value })
                        }
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">Subject Code</FormLabel>
                      <Input
                        placeholder="Subject Code"
                        value={editedSData.subCode}
                        onChange={(e) =>
                          setEditedSData({ ...editedSData, subCode: e.target.value })
                        }
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">Subject Abbreviation</FormLabel>
                      <Input
                        placeholder="Subject Name"
                        value={editedSData.subName}
                        onChange={(e) =>
                          setEditedSData({ ...editedSData, subName: e.target.value })
                        }
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">Student Count</FormLabel>
                      <Input
                        borderColor={isStudentCountValid ? "gray.300" : "red.500"}
                        placeholder="Students Count"
                        value={editedSData.studentCount}
                        onChange={(e) => {
                          const input = e.target.value;
                          if (/^\d*$/.test(input)) {
                            setIsStudentCountValid(true);
                            setEditedSData({ ...editedSData, studentCount: input });
                          } else {
                            setIsStudentCountValid(false);
                          }
                        }}
                      />
                      {!isStudentCountValid && (
                        <Text color="red.500" fontSize="sm">Numbers only</Text>
                      )}
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">Semester</FormLabel>
                      <Select
                        value={editedSData.sem}
                        onChange={(e) =>
                          setEditedSData({ ...editedSData, sem: e.target.value })
                        }
                      >
                        <option value="">Select Semester</option>
                        {semesterData.map((semester) => (
                          <option key={semester._id} value={semester.sem}>
                            {semester.sem}
                          </option>
                        ))}
                      </Select>
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">Degree</FormLabel>
                      <Input
                        placeholder="Degree"
                        value={editedSData.degree}
                        onChange={(e) =>
                          setEditedSData({ ...editedSData, degree: e.target.value })
                        }
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">
                        Department
                        <InfoIcon ml={2} color="blue.500" />
                      </FormLabel>
                      
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => setShowDepartments(!showDepartments)}
                        mb={3}
                        width="100%"
                        rightIcon={showDepartments ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      >
                        {showDepartments ? 'Hide' : 'Show'} Available Departments ({uniqueDepartments.length})
                      </Button>

                      <Collapse in={showDepartments} animateOpacity>
                        <Box mb={3} p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                          <Text fontSize="xs" fontWeight="bold" color="blue.700" mb={2}>
                            ⚠️ Available Departments (Name must match exactly):
                          </Text>
                          <Wrap spacing={2}>
                            {uniqueDepartments.map((dept, index) => (
                              <WrapItem key={index}>
                                <Badge 
                                  colorScheme="blue" 
                                  fontSize="xs" 
                                  p={2}
                                  cursor="pointer"
                                  onClick={() => setEditedSData({ ...editedSData, dept: dept })}
                                  _hover={{ bg: "blue.200" }}
                                >
                                  {dept}
                                </Badge>
                              </WrapItem>
                            ))}
                          </Wrap>
                          {uniqueDepartments.length === 0 && (
                            <Text fontSize="xs" color="gray.500">No departments available</Text>
                          )}
                        </Box>
                      </Collapse>

                      <Input
                        placeholder="Department (click 'Show Available Departments' to view options)"
                        value={editedSData.dept}
                        onChange={(e) =>
                          setEditedSData({ ...editedSData, dept: e.target.value })
                        }
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        Type exactly as shown in the badges above or click a badge to auto-fill
                      </Text>
                    </Box>

                    <Box>
                      <FormLabel fontWeight="bold">Credits</FormLabel>
                      <Input
                        type="number"
                        placeholder="Credits"
                        value={editedSData.credits}
                        onChange={(e) =>
                          setEditedSData({ ...editedSData, credits: e.target.value })
                        }
                      />
                    </Box>
                  </SimpleGrid>

                  <HStack spacing={3} mt={6} flexDirection={{ base: "column", sm: "row" }}>
                    <Button colorScheme="gray" onClick={handleCancelAddSubject} width={{ base: "100%", sm: "auto" }}>
                      Cancel
                    </Button>
                    <Button colorScheme="purple" onClick={handleSaveNewSubject} width={{ base: "100%", sm: "auto" }}>
                      Save New Subject
                    </Button>
                  </HStack>
                  {addduplicateEntryMessage && (
                    <Text mt={3} color="red.600">{addduplicateEntryMessage}</Text>
                  )}
                </FormControl>
              </Box>
            ) : (
              <Wrap spacing={3}>
                <WrapItem>
                  <Button colorScheme="purple" leftIcon={<AddIcon />} onClick={handleAddSubject} size={{ base: "sm", md: "md" }}>
                    Add Subject
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button colorScheme="teal" onClick={downloadCSV} size={{ base: "sm", md: "md" }}>
                    Download Subject Table in CSV
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button colorScheme="red" onClick={handleDeleteAll} size={{ base: "sm", md: "md" }}>
                    Delete All
                  </Button>
                </WrapItem>
              </Wrap>
            )}

            {/* Semester-wise Subject Cards */}
            <Box>
              <Text fontWeight="bold" fontSize="xl" mb={4}>
                Subjects by Semester
              </Text>
              <SimpleGrid columns={{ base: 1 }} spacing={4}>
                {Object.keys(groupedSubjects).sort().map((sem) => (
                  <Card key={sem} bg={cardBg} boxShadow="xl" borderRadius="lg" overflow="hidden" border="2px" borderColor="gray.200">
                    <CardHeader
                      bg="purple.600"
                      color="white"
                      p={4}
                      cursor="pointer"
                      onClick={() => toggleSem(sem)}
                      _hover={{ bg: "purple.700" }}
                    >
                      <Flex justify="space-between" align="center" flexDirection={{ base: "column", sm: "row" }} gap={2}>
                        <HStack spacing={3}>
                          <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>{sem}</Text>
                          <Badge colorScheme="green" fontSize={{ base: "xs", md: "md" }} p={2}>
                            {groupedSubjects[sem].length} Subjects
                          </Badge>
                        </HStack>
                        <IconButton
                          icon={expandedSem[sem] ? <ChevronUpIcon /> : <ChevronDownIcon />}
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
                    <Collapse in={expandedSem[sem] === true} animateOpacity>
                      <CardBody p={0}>
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead bg="gray.100">
                              <Tr>
                                <Th 
                                  fontSize="xs" 
                                  cursor="pointer" 
                                  onClick={() => handleSort('subjectFullName', sem)}
                                  _hover={{ bg: "gray.200" }}
                                >
                                  <Flex align="center">
                                    Subject Name
                                    {getSortIcon('subjectFullName', sem)}
                                  </Flex>
                                </Th>
                                <Th 
                                  fontSize="xs" 
                                  cursor="pointer" 
                                  onClick={() => handleSort('type', sem)}
                                  _hover={{ bg: "gray.200" }}
                                >
                                  <Flex align="center">
                                    Type
                                    {getSortIcon('type', sem)}
                                  </Flex>
                                </Th>
                                <Th 
                                  fontSize="xs" 
                                  cursor="pointer" 
                                  onClick={() => handleSort('subCode', sem)}
                                  _hover={{ bg: "gray.200" }}
                                >
                                  <Flex align="center">
                                    Code
                                    {getSortIcon('subCode', sem)}
                                  </Flex>
                                </Th>
                                <Th 
                                  fontSize="xs" 
                                  cursor="pointer" 
                                  onClick={() => handleSort('subName', sem)}
                                  _hover={{ bg: "gray.200" }}
                                >
                                  <Flex align="center">
                                    Abbr.
                                    {getSortIcon('subName', sem)}
                                  </Flex>
                                </Th>
                                <Th 
                                  fontSize="xs" 
                                  cursor="pointer" 
                                  onClick={() => handleSort('studentCount', sem)}
                                  _hover={{ bg: "gray.200" }}
                                >
                                  <Flex align="center">
                                    Count
                                    {getSortIcon('studentCount', sem)}
                                  </Flex>
                                </Th>
                                <Th 
                                  fontSize="xs" 
                                  cursor="pointer" 
                                  onClick={() => handleSort('degree', sem)}
                                  _hover={{ bg: "gray.200" }}
                                >
                                  <Flex align="center">
                                    Degree
                                    {getSortIcon('degree', sem)}
                                  </Flex>
                                </Th>
                                <Th 
                                  fontSize="xs" 
                                  cursor="pointer" 
                                  onClick={() => handleSort('dept', sem)}
                                  _hover={{ bg: "gray.200" }}
                                >
                                  <Flex align="center">
                                    Department
                                    {getSortIcon('dept', sem)}
                                  </Flex>
                                </Th>
                                <Th fontSize="xs" textAlign="center">Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {getSortedData(groupedSubjects[sem], sortConfig.key ? sortConfig.key.split('-')[1] : null).map((row) => (
                                <Tr key={row._id} _hover={{ bg: "purple.50" }}>
                                  <Td fontSize="xs">
                                    {editRowId === row._id ? (
                                      <Input
                                        size="xs"
                                        value={editedData.subjectFullName}
                                        onChange={(e) =>
                                          setEditedData({
                                            ...editedData,
                                            subjectFullName: e.target.value,
                                          })
                                        }
                                      />
                                    ) : (
                                      <Text fontWeight="bold">{row.subjectFullName}</Text>
                                    )}
                                  </Td>
                                  <Td fontSize="xs">
                                    {editRowId === row._id ? (
                                      <Input
                                        size="xs"
                                        value={editedData.type}
                                        onChange={(e) =>
                                          setEditedData({ ...editedData, type: e.target.value })
                                        }
                                      />
                                    ) : (
                                      <Badge colorScheme="blue">{row.type}</Badge>
                                    )}
                                  </Td>
                                  <Td fontSize="xs">
                                    {editRowId === row._id ? (
                                      <Input
                                        size="xs"
                                        value={editedData.subCode}
                                        onChange={(e) =>
                                          setEditedData({
                                            ...editedData,
                                            subCode: e.target.value,
                                          })
                                        }
                                      />
                                    ) : (
                                      row.subCode
                                    )}
                                  </Td>
                                  <Td fontSize="xs">
                                    {editRowId === row._id ? (
                                      <Input
                                        size="xs"
                                        value={editedData.subName}
                                        onChange={(e) =>
                                          setEditedData({
                                            ...editedData,
                                            subName: e.target.value,
                                          })
                                        }
                                      />
                                    ) : (
                                      <Text fontWeight="bold">{row.subName}</Text>
                                    )}
                                  </Td>
                                  <Td fontSize="xs">
                                    {editRowId === row._id ? (
                                      <Input
                                        size="xs"
                                        type="number"
                                        value={editedData.studentCount}
                                        onChange={(e) =>
                                          setEditedData({ ...editedData, studentCount: e.target.value })
                                        }
                                      />
                                    ) : (
                                      row.studentCount
                                    )}
                                  </Td>
                                  <Td fontSize="xs">
                                    {editRowId === row._id ? (
                                      <Input
                                        size="xs"
                                        value={editedData.degree}
                                        onChange={(e) =>
                                          setEditedData({ ...editedData, degree: e.target.value })
                                        }
                                      />
                                    ) : (
                                      row.degree
                                    )}
                                  </Td>
                                  <Td fontSize="xs">
                                    {editRowId === row._id ? (
                                      <Input
                                        size="xs"
                                        value={editedData.dept}
                                        onChange={(e) =>
                                          setEditedData({ ...editedData, dept: e.target.value })
                                        }
                                      />
                                    ) : (
                                      <Text fontWeight="semibold">
                                        {row.dept}
                                      </Text>
                                    )}
                                  </Td>
                                  <Td>
                                    <HStack spacing={1} justify="center" flexWrap="wrap">
                                      {editRowId === row._id ? (
                                        <>
                                          <IconButton
                                            icon={<CheckIcon />}
                                            size="xs"
                                            colorScheme="green"
                                            onClick={handleSaveEdit}
                                            aria-label="Save"
                                          />
                                          <IconButton
                                            icon={<CloseIcon />}
                                            size="xs"
                                            colorScheme="gray"
                                            onClick={handleCancelEdit}
                                            aria-label="Cancel"
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <IconButton
                                            icon={<EditIcon />}
                                            size="xs"
                                            colorScheme="blue"
                                            onClick={() => handleEditClick(row._id)}
                                            aria-label="Edit"
                                          />
                                          <IconButton
                                            icon={<DeleteIcon />}
                                            size="xs"
                                            colorScheme="red"
                                            onClick={() => handleDelete(row._id)}
                                            aria-label="Delete"
                                          />
                                        </>
                                      )}
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </CardBody>
                    </Collapse>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

export default Subject;