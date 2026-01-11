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
  SimpleGrid,
} from '@chakra-ui/react';
import {
  WarningIcon,
  ArrowBackIcon,
  DeleteIcon,
  EditIcon,
  AddIcon,
  AttachmentIcon,
} from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import FileDownloadButton from '../filedownload/filedownload';

function MasterRoom() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [masterRooms, setMasterRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editedRoom, setEditedRoom] = useState({
    room: '',
    type: '',
    building: '',
    floor: '',
    dept: '',
    landMark: '',
  });
  const [editRoomId, setEditRoomId] = useState(null);
  const [isAddRoomFormVisible, setIsAddRoomFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const apiUrl = getEnvironment();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchMasterRooms();
    fetchDepartments();
  }, []);

  const fetchMasterRooms = () => {
    setLoading(true);
    fetch(`${apiUrl}/timetablemodule/masterroom`, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        setMasterRooms(data.reverse());
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        toast({
          title: 'Failed to load rooms',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'bottom',
        });
        setLoading(false);
      });
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/mastersem/dept`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      fetch(`${apiUrl}/upload/masterroom`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
        .then((response) => response.json())
        .then(() => {
          fetchMasterRooms();
          setSelectedFile(null);
          toast({
            title: 'Upload Successful',
            description: 'Room data has been uploaded.',
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
            description: 'Failed to upload room data.',
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

  const handleAddRoom = () => {
    setEditedRoom({
      room: '',
      type: '',
      building: '',
      floor: '',
      dept: '',
      landMark: '',
    });
    setIsAddRoomFormVisible(true);
  };

  const handleCancelAddRoom = () => {
    setIsAddRoomFormVisible(false);
    setEditedRoom({
      room: '',
      type: '',
      building: '',
      floor: '',
      dept: '',
      landMark: '',
    });
  };

  const handleSaveNewRoom = () => {
    const requiredFields = ['room', 'type', 'building', 'floor', 'dept', 'landMark'];
    const missingFields = requiredFields.filter((field) => !editedRoom[field]);

    if (missingFields.length > 0) {
      toast({
        title: 'Missing Fields',
        description: `Please fill in: ${missingFields.join(', ')}.`,
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    const isDuplicate = masterRooms.some((room) => room.room === editedRoom.room);

    if (isDuplicate) {
      toast({
        title: 'Duplicate Room',
        description: 'Room with this number already exists. Please use a unique room number.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    fetch(`${apiUrl}/timetablemodule/masterroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedRoom),
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        fetchMasterRooms();
        handleCancelAddRoom();
        toast({
          title: 'Room Added',
          description: 'New room has been added successfully.',
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
          description: 'Failed to add new room.',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'bottom',
        });
      });
  };

  const handleEditClick = (_id) => {
    setEditRoomId(_id);
    const editedRow = masterRooms.find((room) => room._id === _id);
    if (editedRow) {
      setEditedRoom({ ...editedRow });
    }
  };

  const handleSaveEdit = () => {
    if (editRoomId) {
      const rowIndex = masterRooms.findIndex((room) => room._id === editRoomId);
      if (rowIndex !== -1) {
        const updatedData = [...masterRooms];
        updatedData[rowIndex] = editedRoom;

        fetch(`${apiUrl}/timetablemodule/masterroom/${editRoomId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedRoom),
          credentials: 'include',
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            return response.json();
          })
          .then((data) => {
            setMasterRooms(updatedData);
            setEditRoomId(null);
            setEditedRoom({
              room: '',
              type: '',
              building: '',
              floor: '',
              dept: '',
              landMark: '',
            });
            toast({
              title: 'Update Successful',
              description: 'Room data has been updated.',
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
              description: 'Failed to update room data.',
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
    fetch(`${apiUrl}/timetablemodule/masterroom/${deleteId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const updatedData = masterRooms.filter((room) => room._id !== deleteId);
        setMasterRooms(updatedData);
        onClose();
        toast({
          title: 'Delete Successful',
          description: 'Room entry has been deleted.',
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
          description: 'Failed to delete room entry.',
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

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header Section with Teal Gradient */}
      <Box
        bgGradient="linear(to-r, teal.400, green.400, yellow.500)"
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
                Master Rooms
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Room Management
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Manage room information including type, building, floor, department, and location details.
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
            <CardHeader bgGradient="linear(to-r, teal.400, cyan.400)" color="white" p={4}>
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
                    name="XlsxFile"
                    size="lg"
                    p={2}
                  />
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Select an Excel file containing room data
                  </Text>
                </FormControl>

                <HStack spacing={3} justify="space-between" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                  <Button
                    leftIcon={<AttachmentIcon />}
                    colorScheme="teal"
                    onClick={handleUpload}
                    size="md"
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Upload Excel
                  </Button>
                  <FileDownloadButton
                    fileUrl="/room_template.xlsx"
                    fileName="room_template.xlsx"
                  />
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Add Room Form Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bgGradient="linear(to-r, green.400, teal.400)" color="white" p={4}>
              <Heading size="md">
                {isAddRoomFormVisible ? 'Add New Room' : 'Quick Actions'}
              </Heading>
            </CardHeader>
            <CardBody p={6}>
              {isAddRoomFormVisible ? (
                <VStack spacing={4} align="stretch">
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      All fields marked with <Text as="span" color="red.500"></Text> are required
                    </Text>
                  </Alert>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Room No <Text as="span" color="red.500"></Text>
                      </FormLabel>
                      <Input
                        type="text"
                        value={editedRoom.room}
                        onChange={(e) => setEditedRoom({ ...editedRoom, room: e.target.value })}
                        size="md"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Type <Text as="span" color="red.500"></Text>
                      </FormLabel>
                      <Input
                        type="text"
                        value={editedRoom.type}
                        onChange={(e) => setEditedRoom({ ...editedRoom, type: e.target.value })}
                        size="md"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Building <Text as="span" color="red.500"></Text>
                      </FormLabel>
                      <Input
                        type="text"
                        value={editedRoom.building}
                        onChange={(e) => setEditedRoom({ ...editedRoom, building: e.target.value })}
                        size="md"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Floor <Text as="span" color="red.500"></Text>
                      </FormLabel>
                      <Input
                        type="text"
                        value={editedRoom.floor}
                        onChange={(e) => setEditedRoom({ ...editedRoom, floor: e.target.value })}
                        size="md"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Department <Text as="span" color="red.500"></Text>
                      </FormLabel>
                      <Select
                        placeholder="Select department"
                        value={editedRoom.dept}
                        onChange={(e) => setEditedRoom({ ...editedRoom, dept: e.target.value })}
                        size="md"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Google Map Location <Text as="span" color="red.500"></Text>
                      </FormLabel>
                      <Input
                        type="text"
                        placeholder="Enter Google Maps URL"
                        value={editedRoom.landMark}
                        onChange={(e) => setEditedRoom({ ...editedRoom, landMark: e.target.value })}
                        size="md"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <HStack spacing={3} justify="flex-end" pt={2} flexWrap="wrap">
                    <Button variant="ghost" onClick={handleCancelAddRoom} w={{ base: 'full', sm: 'auto' }}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={handleSaveNewRoom}
                      // leftIcon={<AddIcon />}
                      w={{ base: 'full', sm: 'auto' }}
                    >
                      Save New Room
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="green"
                  onClick={handleAddRoom}
                  size="lg"
                  w="full"
                >
                  Add New Room
                </Button>
              )}
            </CardBody>
          </Card>

          {/* Rooms Table Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bgGradient="linear(to-r, emerald.400, green.400)" color="white" p={4}>
              <Heading size="md">
                Master Rooms Data (Total: {masterRooms.length} Entries)
              </Heading>
            </CardHeader>
            <CardBody p={0}>
              {loading ? (
                <Box p={12}>
                  <VStack spacing={4}>
                    <Spinner size="xl" thickness="4px" color="green.500" speed="0.65s" />
                    <Text color="gray.600" fontSize="lg">
                      Loading rooms data...
                    </Text>
                  </VStack>
                </Box>
              ) : (
                <TableContainer>
                  <Table variant="striped" colorScheme="green" size={{ base: 'sm', md: 'md' }}>
                    <Thead bgGradient="linear(to-r, green.300, teal.300)">
                      <Tr>
                        <Th textAlign="center" color="white">Room</Th>
                        <Th textAlign="center" color="white">Type</Th>
                        <Th textAlign="center" color="white" display={{ base: 'none', lg: 'table-cell' }}>Building</Th>
                        <Th textAlign="center" color="white" display={{ base: 'none', lg: 'table-cell' }}>Floor</Th>
                        <Th textAlign="center" color="white" display={{ base: 'none', md: 'table-cell' }}>Department</Th>
                        <Th textAlign="center" color="white" display={{ base: 'none', xl: 'table-cell' }}>Google Map</Th>
                        <Th textAlign="center" color="white">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {masterRooms.map((room) => (
                        <Tr key={room._id}>
                          <Td textAlign="center">
                            {editRoomId === room._id ? (
                              <Input
                                type="text"
                                value={editedRoom.room}
                                onChange={(e) =>
                                  setEditedRoom({ ...editedRoom, room: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              room.room
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRoomId === room._id ? (
                              <Input
                                type="text"
                                value={editedRoom.type}
                                onChange={(e) =>
                                  setEditedRoom({ ...editedRoom, type: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              room.type
                            )}
                          </Td>
                          <Td textAlign="center" display={{ base: 'none', lg: 'table-cell' }}>
                            {editRoomId === room._id ? (
                              <Input
                                type="text"
                                value={editedRoom.building}
                                onChange={(e) =>
                                  setEditedRoom({ ...editedRoom, building: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              room.building
                            )}
                          </Td>
                          <Td textAlign="center" display={{ base: 'none', lg: 'table-cell' }}>
                            {editRoomId === room._id ? (
                              <Input
                                type="text"
                                value={editedRoom.floor}
                                onChange={(e) =>
                                  setEditedRoom({ ...editedRoom, floor: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              room.floor
                            )}
                          </Td>
                          <Td textAlign="center" display={{ base: 'none', md: 'table-cell' }}>
                            {editRoomId === room._id ? (
                              <Select
                                placeholder="Select department"
                                value={editedRoom.dept}
                                onChange={(e) =>
                                  setEditedRoom({ ...editedRoom, dept: e.target.value })
                                }
                                size="sm"
                              >
                                {departments.map((dept) => (
                                  <option key={dept} value={dept}>
                                    {dept}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              room.dept
                            )}
                          </Td>
                          <Td textAlign="center" display={{ base: 'none', xl: 'table-cell' }} maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                            {editRoomId === room._id ? (
                              <Input
                                type="text"
                                placeholder="Google Maps URL"
                                value={editedRoom.landMark}
                                onChange={(e) =>
                                  setEditedRoom({ ...editedRoom, landMark: e.target.value })
                                }
                                size="sm"
                              />
                            ) : (
                              room.landMark
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editRoomId === room._id ? (
                              <Button colorScheme="green" size="sm" onClick={handleSaveEdit}>
                                Save
                              </Button>
                            ) : (
                              <HStack spacing={2} justify="center" flexWrap="wrap">
                                <IconButton
                                  icon={<EditIcon />}
                                  colorScheme="blue"
                                  size="sm"
                                  aria-label="Edit"
                                  onClick={() => handleEditClick(room._id)}
                                />
                                <IconButton
                                  icon={<DeleteIcon />}
                                  colorScheme="red"
                                  size="sm"
                                  aria-label="Delete"
                                  onClick={() => handleDeleteClick(room._id)}
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
                    This action cannot be undone. The room entry will be permanently deleted.
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

export default MasterRoom;