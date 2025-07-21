import React, { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomTealButton,
  CustomDeleteButton,
} from '../styles/customStyles';
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
  ChakraProvider,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  extendTheme,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#E6F3F5',
      100: '#CCE7EB',
      200: '#99CFD7',
      300: '#6BA3BE',
      400: '#274D60',
      500: '#0A7075',
      600: '#0C969C',
      700: '#08494a',
      800: '#031716',
      900: '#000000',
    },
  },
  styles: {
    global: {
      body: {
        bg: '#f8f9fa',
      },
    },
  },
});

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
    messaage: '',
  });

  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const apiUrl = getEnvironment();
  const [session, setSession] = useState();
  const toast = useToast();

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
          console.error('Failed to fetch departments');
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
      const defaultSession = sessions[0]; // pick the first session
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
const [pendingRemove, setPendingRemove] = useState(null);
const { isOpen, onOpen, onClose } = useDisclosure();

  const handleRemoveRoom = (deptIndex, roomIndex, type) => {
    setPendingRemove({ deptIndex, roomIndex, type }); // store the info
  onOpen(); // open the modal
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
    position: 'bottom ',
  });

  onClose(); // close the modal
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

  const handleAddRoomOpenElective = (deptIndex) => {
    const updatedAllotments = [...formData.openElectiveAllotments];
    updatedAllotments[deptIndex].rooms.push({
      room: '',
      morningSlot: false,
      afternoonSlot: false,
    });

    setFormData((prevData) => ({
      ...prevData,
      openElectiveAllotments: updatedAllotments,
    }));
  };

  const handleRemoveAllotment = (deptIndex, type) => {
    const updatedAllotments = [...formData[type]];
    updatedAllotments.splice(deptIndex, 1);

    setFormData((prevData) => ({
      ...prevData,
      [type]: updatedAllotments,
    }));
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
          position: 'bottom ',
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
            position: 'bottom ',
          });
          return false; 
        }

        if (!room.morningSlot && !room.afternoonSlot) {
          toast({
            title: `${type} allotment error`,
            description: `At least one slot (morning/afternoon) must be selected for ${room.room} in ${allotment.dept}.`,
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'bottom',
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
      position: 'bottom',
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

  toast
    .promise(submitData(), {
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
    })
    .catch((error) => {
      console.error('Error creating allotment:', error.message);
    });
};

  const getAvailableRooms = (deptIndex, currentRoomIndex, allotments) => {
    const currentDeptRooms = allotments[deptIndex]?.rooms || [];
    const selectedRooms = currentDeptRooms
      .map((room, index) => (index !== currentRoomIndex ? room.room : null))
      .filter((room) => room && room !== '');

    return rooms.filter((room) => !selectedRooms.includes(room));
  };

  const getAvailableRoomsoe = (deptIndex, currentRoomIndex) => {
    const currentDept = formData.openElectiveAllotments[deptIndex];
    const selectedRooms = currentDept.rooms
      .map((room, index) => (index !== currentRoomIndex ? room.room : null))
      .filter((room) => room !== null && room !== '');

    return rooms.filter((room) => !selectedRooms.includes(room));
  };

  return (
    <Container maxW={'6xl'}>
      <Box>
        <form onSubmit={handleSubmit}>
          <Header title="Allotment"></Header>
          <Link to="/tt/allotment/import">
            <Button
              bg="rgb(47, 104, 196)"
              color="white"
              _hover={{ bg: '#2563EB' }}
            >
              Import allotment from previous session
            </Button>
          </Link>

          <FormLabel>Session:</FormLabel>
          <Select
            borderColor="brand.300"
            _hover={{ borderColor: 'brand.500' }}
            _focus={{ borderColor: 'brand.500' }}
            name="session"
            value={formData.session}
            isInvalid={!formData.session}
            errorBorderColor="red.300"
            onChange={(e) => {
              const selectedSession = e.target.value;
              setSession(selectedSession);
              setFormData({ ...formData, session: selectedSession });
              fetchExistingData(selectedSession);
            }}
          >
            <option colorScheme="brand" value="">
              Select a Session
            </option>
            {sessions.length > 0 &&
              sessions.map((session, index) => (
                <option key={index} value={session}>
                  {session}
                </option>
              ))}
          </Select>
          {!formData.session && (
            <Text color="red.500" fontSize="sm">
              {/* Display an error message */}
              Session is required.
            </Text>
          )}

          <ChakraProvider theme={theme}>
            <Container maxW="100%" py={4} overflow={'auto'}>
              <Tabs variant="enclosed" colourScheme="brand">
                <TabList
                  flexDirection={{ base: 'column', md: 'row' }}
                  alignItems="stretch"
                  gap={{ base: 1, md: 4 }}
                >
                  <Tab
                    m={''}
                    borderBottom="0px"
                    fontWeight="bold"
                    borderRadius={'0px'}
                    color="brand.400"
                    transition={'box-shadow 0.1s ease'}
                    _selected={{
                      bgGradient: 'linear(to-r,brand.700, #031c30)',
                      color: 'white',
                      borderRadius: '10px 10px 0px 0px',

                      border: '0px',
                      fontWeight: 'bold',
                      zIndex: '2px',
                      boxShadow:
                        'inset 2px 2px 4px rgba(0, 0, 0, 0.46),inset -2px -2px 4px rgba(255, 255, 255, 0.32)',
                    }}
                    fontSize="md"
                    py={5}
                    px={6}
                  >
                    Centralised Room Allotment
                  </Tab>
                  <Tab
                    m={0}
                    borderBottom="0px"
                    fontWeight="bold"
                    borderRadius={'0px'}
                    color="brand.400"
                    transition={'box-shadow 0.1s ease'}
                    _selected={{
                      bgGradient: 'linear(to-r,brand.700, #031c30)',
                      color: 'white',
                      borderRadius: '10px 10px 0px 0px',
                      borderBottomColor: 'white',
                      border: '0px',
                      fontWeight: 'bold',
                      zIndex: '2px',
                      boxShadow:
                        'inset 2px 2px 4px rgba(0, 0, 0, 0.46),inset -2px -2px 4px rgba(255, 255, 255, 0.32)',
                    }}
                    fontSize="md"
                    py={5}
                    px={6}
                  >
                    Open Elective Allotment
                  </Tab>
                  <Tab
                    m={0}
                    borderBottom="0px"
                    fontWeight="bold"
                    minW={'150px'}
                    borderRadius={'0px'}
                    color="brand.400"
                    transition={'box-shadow 0.1s ease'}
                    _selected={{
                      bgGradient: 'linear(to-r,brand.700, #031c30)',
                      color: 'white',
                      borderRadius: '10px 10px 0px 0px',
                      borderBottomColor: 'white',
                      border: '0px',
                      fontWeight: 'bold',
                      zIndex: '2px',
                      boxShadow:
                        'inset 2px 2px 4px rgba(0, 0, 0, 0.46),inset -2px -2px 4px rgba(255, 255, 255, 0.32)',
                    }}
                    fontSize="md"
                    py={5}
                    px={6}
                  >
                    Message
                  </Tab>
                </TabList>

                <TabPanels
                  border="2px"
                  borderRadius={' 6px'}
                  borderColor="rgba(8, 73, 74, 0.82)"
                  overflowX="auto"
                  whiteSpace="nowrap"
                  minW={'max-content'}
                  px={0}
                >
                  <TabPanel p={5} pt={10} overflow={'auto'}>
                    {' '}
                    <Box minW="max-content" w={'full'}>
                      <VStack spacing={8}>
                        <Heading
                          size="md"
                          fontWeight="semibold"
                          color="brand.800"
                        >
                          Centralised Room Allotment
                        </Heading>
                        <Table
                          w="full"
                          border="2px solid"
                          borderColor="brand.600"
                          borderRadius="md"
                        >
                          <Thead bg="brand.50">
                            <Tr>
                              <Th
                                border="2px solid"
                                color="brand.800"
                                borderColor="brand.600"
                                textAlign="center"
                                py={4}
                                w={'30%'}
                              >
                                Department
                              </Th>
                              <Th
                                border="2px solid"
                                color="brand.800"
                                borderColor="brand.600"
                                textAlign="center"
                                py={4}
                                w={'40%'}
                              >
                                Room
                              </Th>
                              <Th
                                border="2px solid"
                                color="brand.800"
                                borderColor="brand.600"
                                textAlign="center"
                                py={4}
                              >
                                Actions
                              </Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {formData.centralisedAllotments.map(
                              (allotment, deptIndex) => (
                                <Tr key={`centralisedDeptRow-${deptIndex}`}>
                                  <Td
                                    fontWeight="medium"
                                    borderColor="brand.600"
                                    fontSize="sm"
                                  >
                                    <Select
                                      name="dept"
                                      borderColor="brand.300"
                                      _hover={{ borderColor: 'brand.500' }}
                                      _focus={{ borderColor: 'brand.500' }}
                                      fontSize="sm"
                                      bg="white"
                                      value={allotment.dept}
                                      onChange={(e) =>
                                        handleChange(
                                          e,
                                          deptIndex,
                                          null,
                                          'centralisedAllotments'
                                        )
                                      }
                                    >
                                      <option
                                        key={`centralisedDefaultDept-${deptIndex}`}
                                        value=""
                                      >
                                        Select Department
                                      </option>
                                      {departments.map((department, index) => (
                                        <option
                                          key={`centralisedDept-${index}`}
                                          value={department}
                                        >
                                          {department}
                                        </option>
                                      ))}
                                    </Select>
                                  </Td>
                                  <Td
                                    fontWeight="medium"
                                    borderColor="brand.600"
                                    p={4}
                                  >
                                    {allotment.rooms.map((room, roomIndex) => (
                                      <div
                                        key={`centralisedRoom-${deptIndex}-${roomIndex}`}
                                      >
                                        <Select
                                          name="room"
                                          value={room.room}
                                          onChange={(e) =>
                                            handleChange(
                                              e,
                                              deptIndex,
                                              roomIndex,
                                              'centralisedAllotments'
                                            )
                                          }
                                          borderColor="brand.300"
                                          _hover={{ borderColor: 'brand.500' }}
                                          _focus={{ borderColor: 'brand.500' }}
                                          fontSize="sm"
                                          bg="white"
                                        >
                                          <option
                                            key={`centralisedDefaultRoom-${deptIndex}-${roomIndex}`}
                                            value=""
                                          >
                                            Select Room
                                          </option>
                                          {getAvailableRooms(
                                            deptIndex,
                                            roomIndex,
                                            formData.centralisedAllotments
                                          ).map((availableRoom, index) => (
                                            <option
                                              key={`centralisedRoom-${index}`}
                                              value={availableRoom}
                                            >
                                              {availableRoom}
                                            </option>
                                          ))}
                                        </Select>
                                        <Checkbox
                                          p={3}
                                          name="morningSlot"
                                          isChecked={room.morningSlot}
                                          onChange={(e) =>
                                            handleChange(
                                              e,
                                              deptIndex,
                                              roomIndex,
                                              'centralisedAllotments'
                                            )
                                          }
                                          colorScheme="brand"
                                          size="sm"
                                        >
                                          Morning Slot
                                        </Checkbox>
                                        <Checkbox
                                          p={3}
                                          name="afternoonSlot"
                                          isChecked={room.afternoonSlot}
                                          onChange={(e) =>
                                            handleChange(
                                              e,
                                              deptIndex,
                                              roomIndex,
                                              'centralisedAllotments'
                                            )
                                          }
                                          colorScheme="brand"
                                          size="sm"
                                        >
                                          Afternoon Slot
                                        </Checkbox>
                                        <div>
                                          <HStack
                                            spacing={2}
                                            justifyContent="center"
                                          >
                                            <Button
                                              size="sm"
                                              colorScheme="teal"
                                              onClick={() =>
                                                handleAddRoom(
                                                  deptIndex,
                                                  'centralisedAllotments'
                                                )
                                              }
                                              fontSize="xs"
                                            >
                                              Add Room
                                            </Button>
                                            <Button
                                              size="sm"
                                              colorScheme="red"
                                              onClick={() =>
                                                handleRemoveRoom(
                                                  deptIndex,
                                                  roomIndex,
                                                  'centralisedAllotments'
                                                )
                                              }
                                              fontSize="xs"
                                            >
                                              Remove Room
                                            </Button>
                                            <Modal
                                              isOpen={isOpen}
                                              onClose={onClose}
                                              isCentered
                                            >
                                              <ModalOverlay />
                                              <ModalContent>
                                                <ModalHeader>
                                                  Remove Room
                                                </ModalHeader>
                                                <ModalBody>
                                                  ⚠️ Are you sure you want to
                                                  remove this room?
                                                </ModalBody>
                                                <ModalFooter>
                                                  <Button
                                                    variant="ghost"
                                                    mr={3}
                                                    onClick={onClose}
                                                  >
                                                    Cancel
                                                  </Button>
                                                  <Button
                                                    colorScheme="red"
                                                    onClick={confirmRemoveRoom}
                                                  >
                                                    Remove
                                                  </Button>
                                                </ModalFooter>
                                              </ModalContent>
                                            </Modal>
                                          </HStack>
                                        </div>
                                      </div>
                                    ))}
                                  </Td>
                                  <Td
                                    fontWeight="medium"
                                    borderColor="brand.600"
                                    p={4}
                                    textAlign="center"
                                  >
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      fontSize="sm"
                                      textColor={'wh'}
                                      p={4}
                                      onClick={() =>
                                        handleRemoveAllotment(
                                          deptIndex,
                                          'centralisedAllotments'
                                        )
                                      }
                                    >
                                      Remove Allotment
                                    </Button>{' '}
                                  </Td>
                                </Tr>
                              )
                            )}
                          </Tbody>
                        </Table>
                        <HStack spacing={5}>
                          <Button
                            minW={'150px'}
                            colorScheme="brand"
                            fontSize="sm"
                            alignSelf="center"
                            onClick={() =>
                              handleAddAllotment('centralisedAllotments')
                            }
                          >
                            Add Allotment
                          </Button>
                          <Button
                            type="submit"
                            colorScheme="brand"
                            //bgGradient="linear(to-r,brand.200,brand.600,brand.600,brand.600,brand.200)"
                            minW={'150px'}
                            color="brand.50"
                            fontSize="md"
                            alignSelf="center"
                            _hover={{
                              bg: 'brand.600',
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            Submit
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  </TabPanel>

                  <TabPanel p={5} pt={10} overflow={'auto'}>
                    <Box minW="max-content" w={'full'}>
                      <VStack spacing={8}>
                        <Heading
                          size="md"
                          fontWeight="semibold"
                          color="brand.800"
                        >
                          Open Elective Room Allotment
                        </Heading>
                        <Table
                          w="full"
                          border="2px solid"
                          borderColor="brand.600"
                          borderRadius="md"
                        >
                          <Thead bg="brand.50">
                            <Tr>
                              <Th
                                w={1 / 3}
                                border="2px solid"
                                color="brand.800"
                                borderColor="brand.600"
                                textAlign="center"
                                py={4}
                              >
                                Department
                              </Th>
                              <Th
                                border="2px solid"
                                color="brand.800"
                                borderColor="brand.600"
                                textAlign="center"
                                py={4}
                                w={1 / 3}
                              >
                                Room
                              </Th>
                              <Th
                                border="2px solid"
                                color="brand.800"
                                borderColor="brand.600"
                                textAlign="center"
                                py={4}
                              >
                                Actions
                              </Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {formData.openElectiveAllotments.map(
                              (allotment, deptIndex) => (
                                <Tr key={`openElectiveDeptRow-${deptIndex}`}>
                                  <Td
                                    fontWeight="medium"
                                    borderColor="brand.600"
                                    fontSize="sm"
                                  >
                                    <Select
                                      name="dept"
                                      borderColor="brand.300"
                                      _hover={{ borderColor: 'brand.500' }}
                                      _focus={{ borderColor: 'brand.500' }}
                                      fontSize="sm"
                                      bg="white"
                                      value={allotment.dept}
                                      onChange={(e) =>
                                        handleChange(
                                          e,
                                          deptIndex,
                                          null,
                                          'openElectiveAllotments'
                                        )
                                      }
                                    >
                                      <option
                                        key={`openElectiveDefaultDept-${deptIndex}`}
                                        value=""
                                      >
                                        Select Department
                                      </option>

                                      {departments.map((department, index) => (
                                        <option
                                          key={`openElectiveDept-${index}`}
                                          value={department}
                                        >
                                          {department}
                                        </option>
                                      ))}
                                    </Select>
                                  </Td>
                                  <Td
                                    fontWeight="medium"
                                    borderColor="brand.600"
                                    p={4}
                                  >
                                    {allotment.rooms.map((room, roomIndex) => (
                                      <div
                                        key={`openElectiveRoom-${deptIndex}-${roomIndex}`}
                                      >
                                        <Select
                                          name="room"
                                          value={room.room}
                                          onChange={(e) =>
                                            handleChange(
                                              e,
                                              deptIndex,
                                              roomIndex,
                                              'openElectiveAllotments'
                                            )
                                          }
                                          borderColor="brand.300"
                                          _hover={{ borderColor: 'brand.500' }}
                                          _focus={{ borderColor: 'brand.500' }}
                                          fontSize="sm"
                                          bg="white"
                                        >
                                          <option
                                            key={`openElectiveDefaultRoom-${deptIndex}-${roomIndex}`}
                                            value=""
                                          >
                                            Select Room
                                          </option>
                                          {getAvailableRoomsoe(
                                            deptIndex,
                                            roomIndex
                                          ).map((roomOption, index) => (
                                            <option
                                              key={`openElectiveRoom-${index}`}
                                              value={roomOption}
                                            >
                                              {roomOption}
                                            </option>
                                          ))}
                                        </Select>
                                        <HStack
                                          pt={3}
                                          spacing={2}
                                          justifyContent="center"
                                        >
                                          <Button
                                            size="sm"
                                            colorScheme="teal"
                                            onClick={() =>
                                              handleAddRoomOpenElective(
                                                deptIndex
                                              )
                                            }
                                            fontSize="xs"
                                          >
                                            Add Room
                                          </Button>
                                          <Button
                                            size="sm"
                                            colorScheme="red"
                                            onClick={() =>
                                              handleRemoveRoom(
                                                deptIndex,
                                                roomIndex,
                                                'openElectiveAllotments'
                                              )
                                            }
                                            fontSize="xs"
                                          >
                                            Remove Room
                                          </Button>
                                        </HStack>
                                      </div>
                                    ))}
                                  </Td>
                                  <Td
                                    fontWeight="medium"
                                    borderColor="brand.600"
                                    p={4}
                                    textAlign="center"
                                  >
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      fontSize="sm"
                                      alignSelf="center"
                                      onClick={() =>
                                        handleRemoveAllotment(
                                          deptIndex,
                                          'openElectiveAllotments'
                                        )
                                      }
                                    >
                                      Remove Allotment
                                    </Button>{' '}
                                  </Td>
                                </Tr>
                              )
                            )}
                          </Tbody>
                        </Table>
                        <HStack spacing={4}>
                          <Button
                            colorScheme="brand"
                            fontSize="sm"
                            minW={'150px'}
                            alignSelf="center"
                            onClick={() =>
                              handleAddAllotment('openElectiveAllotments')
                            }
                          >
                            Add Allotment
                          </Button>
                          <Button
                            type="submit"
                            colorScheme="brand"
                            minW={'150px'}
                            color="brand.50"
                            fontSize="md"
                            alignSelf="center"
                          >
                            Submit
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  </TabPanel>

                  <TabPanel p={10} overflow={'auto'}>
                    <VStack spacing={8} maxW="2xl" mx="auto">
                      <VStack spacing={2} textAlign="center">
                        <Heading
                          size="md"
                          fontWeight="semibold"
                          color="brand.800"
                        >
                          Message to Timetable Coordinators
                        </Heading>
                        <Text color="brand.400" fontSize="sm">
                          Send a note to coordinators. This will be displayed in
                          centrally alloted room page.
                        </Text>
                      </VStack>
                      <Textarea
                        borderColor="brand.600"
                        _focus={{ borderColor: 'brand.500' }}
                        fontSize="md"
                        minH="120px"
                        resize="vertical"
                        placeholder="Enter your message..."
                        textAlign="start"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                      />
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Container>
          </ChakraProvider>
        </form>
      </Box>
    </Container>
  );
};

export default AllotmentForm;
