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
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import { CustomTh, CustomLink, CustomBlueButton, CustomDeleteButton } from "../styles/customStyles";
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
import { ArrowBackIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";

function AddRoomComponent() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [isLoading, setIsLoading] = useState({
    state: false,
    id: ""
  });
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [masterRooms, setMasterRooms] = useState([]);
  const [selectedMasterRoom, setSelectedMasterRoom] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availableDepartment, setAvailableDepartment] = useState([]);

  const location = useLocation();
  const currentPathname = location.pathname;

  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    const loadInitialData = async () => {
      setIsTableLoading(true);
      await Promise.all([
        fetchRoomsData(),
        fetchAvailableDepartments()
      ]);
      setIsTableLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/masterroom/dept/${selectedDepartment}`, { credentials: 'include' })
        .then(handleResponse)
        .then((data) => {
          setMasterRooms(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  const handleViewRoom = () => {
    const lastSlashIndex = currentPathname.lastIndexOf("/");
    const parentPath = currentPathname.substring(0, lastSlashIndex);
    const newPath = `${parentPath}/roomallotment`;
    navigate(newPath);
  };

  const fetchRoomsData = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/addroom`, { credentials: 'include' });
      const data = await handleResponse(response);
      const filteredRooms = data.filter((room) => room.code === currentCode);
      setRooms(filteredRooms);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchAvailableDepartments = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept`, { credentials: 'include' });
      const data = await handleResponse(response);
      const formattedDepartments = data.map((department) => ({
        value: department,
        label: department,
      }));
      setAvailableDepartment(formattedDepartments);
    } catch (error) {
      handleError(error);
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
    if (rooms.some((room) => room.room === selectedMasterRoom)) {
      toast({
        position: 'bottom',
        title: "Room Already Added",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const selectedRoomObject = masterRooms.find(
      (masterRoom) => masterRoom.room === selectedMasterRoom
    );

    const dataToSave = {
      room: selectedMasterRoom,
      type: selectedRoomObject.type,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/addroom`, {
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
          title: "Room Added",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        fetchRoomsData();
        setSelectedMasterRoom("");
        setSelectedDepartment("");
      })
      .catch(handleError);
  };

  const handleDelete = (roomId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this room?");

    if (isConfirmed) {
      setIsLoading({
        state: true,
        id: roomId,
      });

      fetch(`${apiUrl}/timetablemodule/addroom/${roomId}`, {
        method: "DELETE",
        credentials: 'include',
      })
        .then(handleResponse)
        .then(() => {
          toast({
            position: 'bottom',
            title: "Room Deleted",
            description: "Room deleted successfully",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
          fetchRoomsData();
        })
        .catch(handleError)
        .finally(() => {
          setIsLoading({
            ...isLoading,
            state: false,
          });
        });
    }
  };

  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setSelectedDepartment(selectedDepartment);
  };

  // Check if room type is centralized
  const isCentralizedRoom = (roomType) => {
    if (!roomType) return false;
    const normalizedType = roomType.toLowerCase().trim();
    return normalizedType.includes('centralised') || normalizedType.includes('centralized');
  };

  return (
    <Box bg="white" minH="100vh">
      <Box>
        {/* Hero Header Section - Same as AddSem */}
        <Box 
          bgGradient="linear(to-r, pink.400, purple.500, blue.500)"
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
                  Room Management
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  Add Rooms
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Add and manage rooms for your timetable.
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
            {/* Add Room Form */}
            <Box 
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              p={6}
              border="1px"
              borderColor="gray.300"
            >
              <Text fontWeight="bold" fontSize="lg" mb={4}>
                Add New Room
              </Text>
              <VStack spacing={4} align="stretch">
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
                    {availableDepartment.map((department) => (
                      <option key={department.value} value={department.value}>
                        {department.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">Room</FormLabel>
                  <Select
                    value={selectedMasterRoom}
                    onChange={(e) => setSelectedMasterRoom(e.target.value)}
                    size="lg"
                    bg="gray.50"
                    border="2px"
                    borderColor="gray.200"
                  >
                    <option value="">Select a Room</option>
                    {masterRooms.map((masterRoom) => (
                      <option key={masterRoom._id} value={masterRoom.room}>
                        {masterRoom.room}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <VStack spacing={3} align="stretch">
                  <Button
                    colorScheme="purple"
                    size="lg"
                    onClick={handleSubmit}
                    isDisabled={!selectedMasterRoom}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Add Room
                  </Button>
                  <HStack spacing={3} flexWrap="wrap">
                    <Link to="/tt/viewmrooms">
                      <Button
                        colorScheme="gray"
                        size="md"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s"
                      >
                        View Master Rooms
                      </Button>
                    </Link>
                    <Button
                      colorScheme="blue"
                      size="md"
                      onClick={handleViewRoom}
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      View Centrally Allotted Rooms
                    </Button>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Rooms Table */}
            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="bold" fontSize="xl">
                  Room Data
                </Text>
                <Badge colorScheme="purple" fontSize="md" p={2}>
                  Total: {rooms.length}
                </Badge>
              </Flex>

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
                    <Spinner size="xl" color="purple.500" thickness="4px" />
                    <Text fontSize="lg" color="gray.600">Loading room data...</Text>
                  </VStack>
                </Box>
              ) : (
                <Box 
                  bg="white"
                  borderRadius="2xl"
                  shadow="2xl"
                  overflow="hidden"
                  border="1px"
                  borderColor="gray.300"
                >
                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead bg="purple.600">
                        <Tr>
                          <Th color="white" fontSize="xs" textAlign="center">Room</Th>
                          <Th color="white" fontSize="xs" textAlign="center">Room Type</Th>
                          <Th color="white" fontSize="xs" textAlign="center">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {rooms.map((room) => {
                          const isCentralized = isCentralizedRoom(room.type);
                          return (
                            <Tr key={room._id} _hover={{ bg: "purple.50" }}>
                              <Td textAlign="center">
                                <Text fontWeight="semibold">{room.room}</Text>
                              </Td>
                              <Td textAlign="center">
                                <Badge 
                                  colorScheme={isCentralized ? "green" : "gray"}
                                  fontSize="sm"
                                  p={1}
                                >
                                  {room.type}
                                </Badge>
                              </Td>
                              <Td>
                                <Center>
                                  {isCentralized ? (
                                    <Tooltip 
                                      label="Cannot delete centralized classroom" 
                                      placement="top"
                                      hasArrow
                                    >
                                      <Button
                                        colorScheme="red"
                                        size="xs"
                                        isDisabled={true}
                                        opacity={0.5}
                                        cursor="not-allowed"
                                      >
                                        Delete
                                      </Button>
                                    </Tooltip>
                                  ) : (
                                    <Button
                                      colorScheme="red"
                                      size="xs"
                                      onClick={() => handleDelete(room._id)}
                                      isLoading={isLoading.state && isLoading.id === room._id}
                                      _hover={{ transform: 'scale(1.05)' }}
                                      transition="all 0.2s"
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </Center>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>

                  {/* Empty State */}
                  {rooms.length === 0 && (
                    <Box p={8} textAlign="center">
                      <Text color="gray.500" fontSize="md">
                        No rooms added yet. Add your first room above!
                      </Text>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

export default AddRoomComponent;