import React, { useState, useEffect } from 'react';
import {
  Box,
  Center,
  Button,
  Container,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Select,
  VStack,
  HStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Heading,
  Badge,
  IconButton,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  FormControl,
  FormLabel,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import {
  WarningIcon,
  ArrowBackIcon,
  DeleteIcon,
  EditIcon,
  AddIcon,
  DownloadIcon,
  AttachmentIcon,
} from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import FileDownloadButton from '../filedownload/filedownload';
import { Parser } from '@json2csv/plainjs/index.js';

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [isAddFacultyFormVisible, setIsAddFacultyFormVisible] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editedData, setEditedData] = useState({
    facultyID: '',
    name: '',
    designation: '',
    dept: '',
    email: '',
    extension: '',
    type: '',
  });

  const apiUrl = getEnvironment();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchData();
    fetchDepartments();
  }, []);

  const fetchData = () => {
    setLoading(true);
    fetch(`${apiUrl}/timetablemodule/faculty`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setTableData(data.reverse());
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        toast({
          title: 'Failed to load faculty data',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'bottom',
        });
        setLoading(false);
      });
  };

  const fetchDepartments = () => {
    fetch(`${apiUrl}/timetablemodule/mastersem/dept`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        setDepartments(data);
      })
      .catch((error) => {
        console.error('Error fetching departments:', error);
      });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      fetch(`${apiUrl}/upload/faculty`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
        .then((response) => response.json())
        .then(() => {
          fetchData();
          setSelectedFile(null);
          toast({
            title: 'Upload Successful',
            description: 'Faculty data has been uploaded.',
            status: 'success',
            duration: 4000,
            isClosable: true,
            position: 'bottom',
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          toast({
            title: 'Upload Failed',
            description: 'Failed to upload faculty data.',
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'bottom',
          });
        });
    } else {
      toast({
        title: 'No file selected',
        description: 'Please select an Excel file before uploading.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

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

        fetch(`${apiUrl}/timetablemodule/faculty/${editRowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedData),
          credentials: 'include',
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            return response.json();
          })
          .then((data) => {
            setTableData(updatedData);
            setEditRowId(null);
            setEditedData({
              facultyID: '',
              name: '',
              designation: '',
              dept: '',
              email: '',
              extension: '',
              type: '',
            });
            toast({
              title: 'Update Successful',
              description: 'Faculty data has been updated.',
              status: 'success',
              duration: 4000,
              isClosable: true,
              position: 'bottom',
            });
          })
          .catch((error) => {
            console.error('Update Error:', error);
            toast({
              title: 'Update Failed',
              description: 'Failed to update faculty data.',
              status: 'error',
              duration: 4000,
              isClosable: true,
              position: 'bottom',
            });
          });
      }
    }
  };

  const handleDeleteClick = (_id) => {
    setDeleteId(_id);
    onOpen();
  };

  const confirmDelete = () => {
    fetch(`${apiUrl}/timetablemodule/faculty/${deleteId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const updatedData = tableData.filter((row) => row._id !== deleteId);
        setTableData(updatedData);
        onClose();
        toast({
          title: 'Delete Successful',
          description: 'Faculty entry has been deleted.',
          status: 'success',
          duration: 4000,
          isClosable: true,
          position: 'bottom',
        });
      })
      .catch((error) => {
        console.error('Delete Error:', error);
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete faculty entry.',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'bottom',
        });
      });
  };

  const cancelDelete = () => {
    toast({
      title: 'Delete Cancelled',
      description: 'No changes have been made.',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'bottom',
    });
    onClose();
  };

  const handleCancelAddFaculty = () => {
    setIsAddFacultyFormVisible(false);
    setEditedData({
      facultyID: '',
      name: '',
      designation: '',
      dept: '',
      email: '',
      extension: '',
      type: '',
    });
  };

  const handleAddFaculty = () => {
    setEditedData({
      facultyID: '',
      name: '',
      designation: '',
      dept: '',
      email: '',
      extension: '',
      type: '',
    });
    setIsAddFacultyFormVisible(true);
  };

  const handleSaveNewFaculty = () => {
    const isDuplicate = tableData.some((row) => row.name === editedData.name);

    if (
      !editedData.facultyID ||
      !editedData.name ||
      !editedData.dept ||
      !editedData.email ||
      !editedData.designation
    ) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    if (isDuplicate) {
      toast({
        title: 'Duplicate Entry',
        description: 'Faculty with the same name already exists.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
    } else {
      fetch(`${apiUrl}/timetablemodule/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
        credentials: 'include',
      })
        .then((response) => response.json())
        .then((data) => {
          fetchData();
          handleCancelAddFaculty();
          toast({
            title: 'Faculty Added',
            description: 'New faculty has been added successfully.',
            status: 'success',
            duration: 4000,
            isClosable: true,
            position: 'bottom',
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          toast({
            title: 'Failed to Add',
            description: 'Failed to add new faculty.',
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'bottom',
          });
        });
    }
  };

  const downloadCSV = () => {
    const visibleColumns = [
      { label: 'Faculty ID', key: 'facultyID' },
      { label: 'Name', key: 'name' },
      { label: 'Designation', key: 'designation' },
      { label: 'Department', key: 'dept' },
      { label: 'Type', key: 'type' },
      { label: 'Email', key: 'email' },
      { label: 'Extension', key: 'extension' },
    ];

    const csvData = tableData.map((item) => {
      const filteredItem = {};
      for (let x in visibleColumns)
        filteredItem[visibleColumns[x].label] = item[visibleColumns[x].key];
      return filteredItem;
    });

    const parser = new Parser({ fields: visibleColumns.map((c) => c.label) });
    const csv = parser.parse(csvData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'MasterFaculty-XCEED.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const DepartmentSelect = () => (
    <Select
      placeholder="Select department"
      value={editedData.dept}
      onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })}
      size="md"
    >
      {departments.map((item, key) => (
        <option key={key} value={item}>
          {item}
        </option>
      ))}
    </Select>
  );

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header Section with Different Gradient */}
      <Box
        bgGradient="linear(to-r, purple.400, pink.500, orange.500)"
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

        <Box
          position="relative"
          zIndex={2}
          sx={{
            '& button[aria-label="Go back"]': { display: 'none' },
            '& .chakra-button:first-of-type': { display: 'none' },
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
                Master Faculty
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Faculty Management
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Manage faculty information including departments, designations, and contact details.
              </Text>
            </VStack>

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
          {/* Batch Upload Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bgGradient="linear(to-r, blue.400, cyan.400)" color="white" p={4}>
              <Heading size="md">Batch Upload</Heading>
            </CardHeader>
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700">
                    Upload Excel File (.xlsx)
                  </FormLabel>
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    name="csvFile"
                    size="lg"
                    p={2}
                  />
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Select an Excel file containing faculty data
                  </Text>
                </FormControl>

                <HStack spacing={3} justify="space-between">
                  <Button
                    leftIcon={<AttachmentIcon />}
                    colorScheme="blue"
                    onClick={handleUpload}
                    size="md"
                  >
                    Upload Excel
                  </Button>
                  <FileDownloadButton
                    fileUrl="/faculty_template.xlsx"
                    fileName="faculty_template.xlsx"
                  />
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Add Faculty Form Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bgGradient="linear(to-r, purple.400, pink.400)" color="white" p={4}>
              <Heading size="md">
                {isAddFacultyFormVisible ? 'Add New Faculty' : 'Quick Actions'}
              </Heading>
            </CardHeader>
            <CardBody p={6}>
              {isAddFacultyFormVisible ? (
                <VStack spacing={4} align="stretch">
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Fields marked with <Text as="span" color="red.500"></Text> are required
                    </Text>
                  </Alert>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Faculty ID <Text as="span" color="red.500"></Text>
                    </FormLabel>
                    <Input
                      type="text"
                      value={editedData.facultyID}
                      onChange={(e) =>
                        setEditedData({ ...editedData, facultyID: e.target.value })
                      }
                      size="md"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Name <Text as="span" color="red.500"></Text>
                    </FormLabel>
                    <Input
                      type="text"
                      value={editedData.name}
                      onChange={(e) =>
                        setEditedData({ ...editedData, name: e.target.value })
                      }
                      size="md"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Designation <Text as="span" color="red.500"></Text>
                    </FormLabel>
                    <Input
                      type="text"
                      value={editedData.designation}
                      onChange={(e) =>
                        setEditedData({ ...editedData, designation: e.target.value })
                      }
                      size="md"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Department <Text as="span" color="red.500"></Text>
                    </FormLabel>
                    {DepartmentSelect()}
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Type
                    </FormLabel>
                    <Input
                      type="text"
                      value={editedData.type}
                      onChange={(e) =>
                        setEditedData({ ...editedData, type: e.target.value })
                      }
                      size="md"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Email <Text as="span" color="red.500"></Text>
                    </FormLabel>
                    <Input
                      type="email"
                      value={editedData.email}
                      onChange={(e) =>
                        setEditedData({ ...editedData, email: e.target.value })
                      }
                      size="md"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Extension
                    </FormLabel>
                    <Input
                      type="text"
                      value={editedData.extension}
                      onChange={(e) =>
                        setEditedData({ ...editedData, extension: e.target.value })
                      }
                      size="md"
                    />
                  </FormControl>

                  <HStack spacing={3} justify="flex-end" pt={2}>
                    <Button variant="ghost" onClick={handleCancelAddFaculty}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={handleSaveNewFaculty}
                      leftIcon={<AddIcon />}
                    >
                      Save New Faculty
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="purple"
                  onClick={handleAddFaculty}
                  size="lg"
                  w="full"
                >
                  Add New Faculty
                </Button>
              )}
            </CardBody>
          </Card>

          {/* Faculty Table Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bgGradient="linear(to-r, orange.400, red.400)" color="white" p={4}>
              <HStack justify="space-between">
                <Heading size="md">
                  Faculty Data (Total: {tableData.length} Entries)
                </Heading>
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="whiteAlpha"
                  variant="solid"
                  onClick={downloadCSV}
                  size="sm"
                >
                  Download CSV
                </Button>
              </HStack>
            </CardHeader>
            <CardBody p={0}>
              {loading ? (
                <Box p={12}>
                  <VStack spacing={4}>
                    <Spinner size="xl" thickness="4px" color="orange.500" speed="0.65s" />
                    <Text color="gray.600" fontSize="lg">
                      Loading faculty data...
                    </Text>
                  </VStack>
                </Box>
              ) : (
                <TableContainer>
                  <Table variant="striped" colorScheme="orange" size="md">
                    <Thead bgGradient="linear(to-r, orange.300, pink.300)">
                      <Tr>
                        <Th textAlign="center" color="white">Faculty ID</Th>
                        <Th textAlign="center" color="white">Name</Th>
                        <Th textAlign="center" color="white">Designation</Th>
                        <Th textAlign="center" color="white">Dept</Th>
                        <Th textAlign="center" color="white">Type</Th>
                        <Th textAlign="center" color="white">Email</Th>
                        <Th textAlign="center" color="white">Extension</Th>
                        <Th textAlign="center" color="white">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tableData.map((row) => (
                        <Tr key={row._id}>
                          <Td textAlign="center">
                            {editRowId === row._id ? (
                              <Input
                                type="text"
                                value={editedData.facultyID}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    facultyID: e.target.value,
                                  })
                                }
                                size="sm"
                              />
                            ) : (
                              row.facultyID
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRowId === row._id ? (
                              <Input
                                type="text"
                                value={editedData.name}
                                onChange={(e) =>
                                  setEditedData({ ...editedData, name: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              row.name
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRowId === row._id ? (
                              <Input
                                type="text"
                                value={editedData.designation}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    designation: e.target.value,
                                  })
                                }
                                size="sm"
                              />
                            ) : (
                              row.designation
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRowId === row._id ? DepartmentSelect() : row.dept}
                          </Td>
                          <Td textAlign="center">
                            {editRowId === row._id ? (
                              <Input
                                type="text"
                                value={editedData.type}
                                onChange={(e) =>
                                  setEditedData({ ...editedData, type: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              row.type
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRowId === row._id ? (
                              <Input
                                type="text"
                                value={editedData.email}
                                onChange={(e) =>
                                  setEditedData({ ...editedData, email: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              row.email
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRowId === row._id ? (
                              <Input
                                type="text"
                                value={editedData.extension}
                                onChange={(e) =>
                                  setEditedData({
                                    ...editedData,
                                    extension: e.target.value,
                                  })
                                }
                                size="sm"
                              />
                            ) : (
                              row.extension
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRowId === row._id ? (
                              <Button
                                colorScheme="green"
                                size="sm"
                                onClick={handleSaveEdit}
                              >
                                Save
                              </Button>
                            ) : (
                              <HStack spacing={2} justify="center">
                                <IconButton
                                  icon={<EditIcon />}
                                  colorScheme="blue"
                                  size="sm"
                                  aria-label="Edit"
                                  onClick={() => handleEditClick(row._id)}
                                />
                                <IconButton
                                  icon={<DeleteIcon />}
                                  colorScheme="red"
                                  size="sm"
                                  aria-label="Delete"
                                  onClick={() => handleDeleteClick(row._id)}
                                />
                              </HStack>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={cancelDelete} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" zIndex={1400} />
        <ModalContent zIndex={1400}>
          <ModalHeader bg="red.600" color="white" borderTopRadius="md">
            <HStack spacing={3}>
              <Icon as={WarningIcon} boxSize={6} />
              <Text>Confirm Deletion</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            <VStack spacing={4} align="stretch">
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="md">Are you sure?</AlertTitle>
                  <AlertDescription fontSize="sm">
                    This action cannot be undone. The faculty entry will be permanently deleted.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDelete}
                leftIcon={<DeleteIcon />}
              >
                Yes, Delete
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Subject;