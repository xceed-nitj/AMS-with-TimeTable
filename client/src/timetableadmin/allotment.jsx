import React, { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  Container,
  FormLabel,
  Heading,
  Select,
  Input,
  Button,
  Checkbox,
  Box,
  Text,
  Tab,
  TabList,
  TabPanels,
  Tabs,
  VStack,
  HStack,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
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
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon, DeleteIcon, WarningIcon } from '@chakra-ui/icons';

const AllotmentForm = () => {
  const [formData, setFormData] = useState({
    session: '',
    centralisedAllotments: [
      {
        dept: '',
        rooms: [{ room: '', morningSlot: false, afternoonSlot: false }],
      },
    ],
    openElectiveAllotments: [
      {
        dept: '',
        rooms: [{ room: '', morningSlot: false, afternoonSlot: false }],
      },
    ],
    message: '',
  });

  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const apiUrl = getEnvironment();
  const [session, setSession] = useState();
  const toast = useToast();
  const [pendingRemove, setPendingRemove] = useState(null);
  const [pendingRemoveDept, setPendingRemoveDept] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeptModalOpen, onOpen: onDeptModalOpen, onClose: onDeptModalClose } = useDisclosure();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/mastersem/dept`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          console.error('Failed to fetch departments');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchMasterRooms = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/masterroom?type=Centralised Classroom`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
        if (response.ok) {
          const data = await response.json();
          const roomNames = data.map((room) => room.room);
          setRooms(roomNames);
        } else {
          console.error('Failed to fetch rooms');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/allotment/session`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          console.error('Failed to fetch sessions');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchSessions();
    fetchDepartments();
    fetchMasterRooms();
  }, []);

  const fetchExistingData = async (session) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment?session=${session}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        const [allotmentData] = data;
        console.log(allotmentData);
        setFormData({
          session: allotmentData.session,
          centralisedAllotments: allotmentData.centralisedAllotments || [],
          openElectiveAllotments: allotmentData.openElectiveAllotments || [],
          message: allotmentData.message || 'No message',
        });
      } else {
        console.error('Failed to fetch existing data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (sessions.length > 0 && !formData.session) {
      const defaultSession = sessions[0];
      setSession(defaultSession);
      setFormData((prev) => ({ ...prev, session: defaultSession }));
      fetchExistingData(defaultSession);
    }
  }, [sessions]);

  const handleChange = (e, deptIndex, roomIndex, type) => {
    const { name, value, type: inputType, checked } = e.target;

    setFormData((prevData) => {
      const updatedAllotments = [...prevData[type]];

      if (name === 'dept') {
        updatedAllotments[deptIndex][name] = value;
      } else if (name === 'room') {
        if (roomIndex !== null) {
          updatedAllotments[deptIndex].rooms[roomIndex][name] = value;
        } else {
          updatedAllotments[deptIndex][name] = value;
        }
      } else {
        updatedAllotments[deptIndex].rooms[roomIndex] = {
          ...updatedAllotments[deptIndex].rooms[roomIndex],
          [name]: inputType === 'checkbox' ? checked : value,
        };
      }

      return {
        ...prevData,
        [type]: updatedAllotments,
      };
    });
  };

  const handleAddRoom = (deptIndex, type) => {
    const updatedAllotments = [...formData[type]];
    updatedAllotments[deptIndex].rooms.push({
      room: '',
      morningSlot: false,
      afternoonSlot: false,
    });

    setFormData((prevData) => ({
      ...prevData,
      [type]: updatedAllotments,
    }));
  };

  const handleRemoveRoom = (deptIndex, roomIndex, type) => {
    setPendingRemove({ deptIndex, roomIndex, type });
    onOpen();
  };

  const confirmRemoveRoom = () => {
    const { deptIndex, roomIndex, type } = pendingRemove;

    const updatedAllotments = [...formData[type]];
    const rooms = [...updatedAllotments[deptIndex].rooms];

    if (rooms.length === 1) {
      rooms[0] = {
        room: '',
        morningSlot: false,
        afternoonSlot: false,
      };
    } else {
      rooms.splice(roomIndex, 1);
    }

    updatedAllotments[deptIndex].rooms = rooms;

    setFormData((prevData) => ({
      ...prevData,
      [type]: updatedAllotments,
    }));

    toast({
      title: 'Room removed',
      description: 'You have successfully removed a room.',
      status: 'warning',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });

    onClose();
    setPendingRemove(null);
  };

  const handleAddAllotment = (type) => {
    setFormData((prevData) => ({
      ...prevData,
      [type]: [
        ...prevData[type],
        {
          dept: '',
          rooms: [{ room: '', morningSlot: false, afternoonSlot: false }],
        },
      ],
    }));
  };

  const handleRemoveAllotment = (deptIndex, type) => {
    setPendingRemoveDept({ deptIndex, type });
    onDeptModalOpen();
  };

  const confirmRemoveDept = () => {
    const { deptIndex, type } = pendingRemoveDept;
    const updatedAllotments = [...formData[type]];
    updatedAllotments.splice(deptIndex, 1);

    setFormData((prevData) => ({
      ...prevData,
      [type]: updatedAllotments,
    }));

    toast({
      title: 'Department removed',
      description: 'You have successfully removed a department allotment.',
      status: 'warning',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });

    onDeptModalClose();
    setPendingRemoveDept(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validateAllotments = (allotments, type) => {
      for (let deptIndex = 0; deptIndex < allotments.length; deptIndex++) {
        const allotment = allotments[deptIndex];

        if (!allotment.dept || allotment.dept.trim() === '') {
          toast({
            title: `${type} allotment error`,
            description: `Please select a department for allotment ${deptIndex + 1}.`,
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'top',
          });
          return false;
        }

        for (let roomIndex = 0; roomIndex < allotment.rooms.length; roomIndex++) {
          const room = allotment.rooms[roomIndex];

          if (!room.room || room.room.trim() === '') {
            toast({
              title: `${type} allotment error`,
              description: `Please select a room for department ${allotment.dept} (room ${roomIndex + 1}).`,
              status: 'error',
              duration: 4000,
              isClosable: true,
              position: 'top',
            });
            return false;
          }

          if (type === 'Centralised' && !room.morningSlot && !room.afternoonSlot) {
            toast({
              title: `${type} allotment error`,
              description: `At least one slot (morning/afternoon) must be selected for ${room.room} in ${allotment.dept}.`,
              status: 'error',
              duration: 4000,
              isClosable: true,
              position: 'top',
            });
            return false;
          }
        }
      }

      return true;
    };

    if (!formData.session || formData.session.trim() === '') {
      toast({
        title: 'Session missing',
        description: 'Please select a session before submitting.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    const isValidCentral = validateAllotments(formData.centralisedAllotments, 'Centralised');
    const isValidOpenElective = validateAllotments(formData.openElectiveAllotments, 'Open Elective');

    if (!isValidCentral || !isValidOpenElective) return;

    const submitData = async () => {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
    };

    try {
      await toast.promise(submitData(), {
        loading: {
          title: 'Submitting...',
          description: 'Please wait while we save your allotment.',
        },
        success: {
          title: 'Allotment Updated Successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        },
        error: {
          title: 'Submission Failed',
          description: 'An error occurred while submitting the form.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        },
      });
    } catch (error) {
      console.error('Error creating allotment:', error.message);
    }
  };

  const getAvailableRooms = (deptIndex, currentRoomIndex, allotments) => {
    const currentDeptRooms = allotments[deptIndex]?.rooms || [];
    const selectedRooms = currentDeptRooms
      .map((room, index) => (index !== currentRoomIndex ? room.room : null))
      .filter((room) => room && room !== '');

    return rooms.filter((room) => !selectedRooms.includes(room));
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
              <Badge colorScheme="whiteAlpha" fontSize="sm" px={3} py={1} borderRadius="full">
                Room Management
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Room Allotment
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Manage centralized and open elective room allotments for all departments.
              </Text>
            </VStack>

            <HStack spacing={3}>
              <Link to="/tt/allotment/import">
                <Button
                  colorScheme="whiteAlpha"
                  bg="rgba(255, 255, 255, 0.2)"
                  color="white"
                  size="lg"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
                  _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
                  borderRadius="full"
                  boxShadow="lg"
                  border="2px solid"
                  borderColor="whiteAlpha.400"
                >
                  Import Allotment
                </Button>
              </Link>

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
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16}>
        <form onSubmit={handleSubmit}>
          {/* Session Selection Card */}
          <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="gray.300" overflow="hidden" mb={6}>
            <CardHeader bg="purple.600" color="white" p={4}>
              <Heading size="md">Select Session</Heading>
            </CardHeader>
            <CardBody p={6}>
              <FormLabel fontWeight="semibold" color="gray.700">
                Session
              </FormLabel>
              <Select
                name="session"
                value={formData.session}
                onChange={(e) => {
                  const selectedSession = e.target.value;
                  setSession(selectedSession);
                  setFormData({ ...formData, session: selectedSession });
                  fetchExistingData(selectedSession);
                }}
                placeholder="Select a Session"
                borderColor="purple.300"
                _hover={{ borderColor: 'purple.400' }}
                _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                size="lg"
                isInvalid={!formData.session}
              >
                {sessions.map((session, index) => (
                  <option key={index} value={session}>
                    {session}
                  </option>
                ))}
              </Select>
              {!formData.session && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  Session is required.
                </Text>
              )}
            </CardBody>
          </Card>

          {/* Tabs Card */}
          <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="gray.300" overflow="hidden">
            <Tabs variant="enclosed" colorScheme="purple">
              <TabList borderBottom="2px" borderColor="gray.200">
                <Tab
                  fontWeight="semibold"
                  color="gray.600"
                  _selected={{
                    color: 'white',
                    bg: 'purple.600',
                    borderColor: 'purple.600',
                  }}
                  fontSize="md"
                  py={4}
                  px={6}
                >
                  Centralised Room Allotment
                </Tab>
                <Tab
                  fontWeight="semibold"
                  color="gray.600"
                  _selected={{
                    color: 'white',
                    bg: 'teal.600',
                    borderColor: 'teal.600',
                  }}
                  fontSize="md"
                  py={4}
                  px={6}
                >
                  Open Elective Allotment
                </Tab>
              </TabList>

              <TabPanels>
                {/* Centralised Tab */}
                <TabPanel p={6}>
                  <VStack spacing={6} align="stretch">
                    <Box overflowX="auto">
                      <Table variant="simple" size="md">
                        <Thead bg="purple.50">
                          <Tr>
                            <Th color="purple.700" borderBottom="2px" borderColor="purple.200" w="30%">
                              Department
                            </Th>
                            <Th color="purple.700" borderBottom="2px" borderColor="purple.200" w="50%">
                              Rooms & Slots
                            </Th>
                            <Th color="purple.700" borderBottom="2px" borderColor="purple.200">
                              Actions
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {formData.centralisedAllotments.map((allotment, deptIndex) => (
                            <Tr key={`centralisedDeptRow-${deptIndex}`} _hover={{ bg: 'purple.50' }}>
                              <Td>
                                <Select
                                  name="dept"
                                  value={allotment.dept}
                                  onChange={(e) => handleChange(e, deptIndex, null, 'centralisedAllotments')}
                                  placeholder="Select Department"
                                  borderColor="purple.300"
                                  _hover={{ borderColor: 'purple.400' }}
                                  _focus={{ borderColor: 'purple.500' }}
                                  size="sm"
                                >
                                  {departments.map((department, index) => (
                                    <option key={`centralisedDept-${index}`} value={department}>
                                      {department}
                                    </option>
                                  ))}
                                </Select>
                              </Td>
                              <Td>
                                <VStack spacing={3} align="stretch">
                                  {allotment.rooms.map((room, roomIndex) => (
                                    <Box
                                      key={`centralisedRoom-${deptIndex}-${roomIndex}`}
                                      p={3}
                                      bg="gray.50"
                                      borderRadius="md"
                                      borderWidth="1px"
                                      borderColor="gray.200"
                                    >
                                      <Select
                                        name="room"
                                        value={room.room}
                                        onChange={(e) => handleChange(e, deptIndex, roomIndex, 'centralisedAllotments')}
                                        placeholder="Select Room"
                                        borderColor="blue.300"
                                        _hover={{ borderColor: 'blue.400' }}
                                        _focus={{ borderColor: 'blue.500' }}
                                        size="sm"
                                        mb={2}
                                      >
                                        {getAvailableRooms(deptIndex, roomIndex, formData.centralisedAllotments).map(
                                          (availableRoom, index) => (
                                            <option key={`centralisedRoom-${index}`} value={availableRoom}>
                                              {availableRoom}
                                            </option>
                                          )
                                        )}
                                      </Select>
                                      <HStack spacing={4} mb={2}>
                                        <Checkbox
                                          name="morningSlot"
                                          isChecked={room.morningSlot}
                                          onChange={(e) => handleChange(e, deptIndex, roomIndex, 'centralisedAllotments')}
                                          colorScheme="purple"
                                          size="sm"
                                        >
                                          Morning Slot
                                        </Checkbox>
                                        <Checkbox
                                          name="afternoonSlot"
                                          isChecked={room.afternoonSlot}
                                          onChange={(e) => handleChange(e, deptIndex, roomIndex, 'centralisedAllotments')}
                                          colorScheme="purple"
                                          size="sm"
                                        >
                                          Afternoon Slot
                                        </Checkbox>
                                      </HStack>
                                      <Button
                                        size="xs"
                                        colorScheme="red"
                                        leftIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveRoom(deptIndex, roomIndex, 'centralisedAllotments')}
                                        w="full"
                                      >
                                        Remove Room
                                      </Button>
                                    </Box>
                                  ))}
                                  {/* Add Room button - shown once per department */}
                                  <Button
                                    size="sm"
                                    colorScheme="teal"
                                    leftIcon={<AddIcon />}
                                    onClick={() => handleAddRoom(deptIndex, 'centralisedAllotments')}
                                    variant="outline"
                                  >
                                    Add Room to {allotment.dept || 'Department'}
                                  </Button>
                                </VStack>
                              </Td>
                              <Td textAlign="center">
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  leftIcon={<DeleteIcon />}
                                  onClick={() => handleRemoveAllotment(deptIndex, 'centralisedAllotments')}
                                >
                                  Remove Dept
                                </Button>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>

                    <HStack spacing={4} justify="center">
                      <Button
                        colorScheme="purple"
                        leftIcon={<AddIcon />}
                        onClick={() => handleAddAllotment('centralisedAllotments')}
                      >
                        Add Department
                      </Button>
                      <Button type="submit" colorScheme="teal" size="lg" minW="200px">
                        Submit Allotment
                      </Button>
                    </HStack>
                  </VStack>
                </TabPanel>

                {/* Open Elective Tab */}
                <TabPanel p={6}>
                  <VStack spacing={6} align="stretch">
                    <Box overflowX="auto">
                      <Table variant="simple" size="md">
                        <Thead bg="teal.50">
                          <Tr>
                            <Th color="teal.700" borderBottom="2px" borderColor="teal.200" w="30%">
                              Department
                            </Th>
                            <Th color="teal.700" borderBottom="2px" borderColor="teal.200" w="50%">
                              Rooms
                            </Th>
                            <Th color="teal.700" borderBottom="2px" borderColor="teal.200">
                              Actions
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {formData.openElectiveAllotments.map((allotment, deptIndex) => (
                            <Tr key={`openElectiveDeptRow-${deptIndex}`} _hover={{ bg: 'teal.50' }}>
                              <Td>
                                <Select
                                  name="dept"
                                  value={allotment.dept}
                                  onChange={(e) => handleChange(e, deptIndex, null, 'openElectiveAllotments')}
                                  placeholder="Select Department"
                                  borderColor="teal.300"
                                  _hover={{ borderColor: 'teal.400' }}
                                  _focus={{ borderColor: 'teal.500' }}
                                  size="sm"
                                >
                                  {departments.map((department, index) => (
                                    <option key={`openElectiveDept-${index}`} value={department}>
                                      {department}
                                    </option>
                                  ))}
                                </Select>
                              </Td>
                              <Td>
                                <VStack spacing={3} align="stretch">
                                  {allotment.rooms.map((room, roomIndex) => (
                                    <Box
                                      key={`openElectiveRoom-${deptIndex}-${roomIndex}`}
                                      p={3}
                                      bg="gray.50"
                                      borderRadius="md"
                                      borderWidth="1px"
                                      borderColor="gray.200"
                                    >
                                      <Select
                                        name="room"
                                        value={room.room}
                                        onChange={(e) => handleChange(e, deptIndex, roomIndex, 'openElectiveAllotments')}
                                        placeholder="Select Room"
                                        borderColor="orange.300"
                                        _hover={{ borderColor: 'orange.400' }}
                                        _focus={{ borderColor: 'orange.500' }}
                                        size="sm"
                                        mb={2}
                                      >
                                        {getAvailableRooms(deptIndex, roomIndex, formData.openElectiveAllotments).map(
                                          (availableRoom, index) => (
                                            <option key={`openElectiveRoom-${index}`} value={availableRoom}>
                                              {availableRoom}
                                            </option>
                                          )
                                        )}
                                      </Select>
                                      <Button
                                        size="xs"
                                        colorScheme="red"
                                        leftIcon={<DeleteIcon />}
                                        onClick={() => handleRemoveRoom(deptIndex, roomIndex, 'openElectiveAllotments')}
                                        w="full"
                                      >
                                        Remove Room
                                      </Button>
                                    </Box>
                                  ))}
                                  {/* Add Room button - shown once per department */}
                                  <Button
                                    size="sm"
                                    colorScheme="teal"
                                    leftIcon={<AddIcon />}
                                    onClick={() => handleAddRoom(deptIndex, 'openElectiveAllotments')}
                                    variant="outline"
                                  >
                                    Add Room to {allotment.dept || 'Department'}
                                  </Button>
                                </VStack>
                              </Td>
                              <Td textAlign="center">
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  leftIcon={<DeleteIcon />}
                                  onClick={() => handleRemoveAllotment(deptIndex, 'openElectiveAllotments')}
                                >
                                  Remove Dept
                                </Button>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>

                    <HStack spacing={4} justify="center">
                      <Button
                        colorScheme="teal"
                        leftIcon={<AddIcon />}
                        onClick={() => handleAddAllotment('openElectiveAllotments')}
                      >
                        Add Department
                      </Button>
                      <Button type="submit" colorScheme="teal" size="lg" minW="200px">
                        Submit Allotment
                      </Button>
                    </HStack>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        </form>
      </Container>

      {/* Room Removal Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader bg="red.600" color="white" borderTopRadius="md">
            <HStack>
              <WarningIcon />
              <Text>Confirm Room Removal</Text>
            </HStack>
          </ModalHeader>
          <ModalBody py={6}>
            <Text>Are you sure you want to remove this room?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmRemoveRoom} leftIcon={<DeleteIcon />}>
              Remove Room
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Department Removal Confirmation Modal */}
      <Modal isOpen={isDeptModalOpen} onClose={onDeptModalClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader bg="red.600" color="white" borderTopRadius="md">
            <HStack>
              <WarningIcon />
              <Text>Confirm Department Removal</Text>
            </HStack>
          </ModalHeader>
          <ModalBody py={6}>
            <VStack spacing={3} align="start">
              <Text fontWeight="bold">Are you sure you want to remove this department allotment?</Text>
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  This will remove all rooms associated with this department. This action cannot be undone.
                </AlertDescription>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeptModalClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmRemoveDept} leftIcon={<DeleteIcon />}>
              Remove Department
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AllotmentForm;