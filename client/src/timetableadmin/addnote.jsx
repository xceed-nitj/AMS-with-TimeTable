import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import {
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Button,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from "@chakra-ui/icons";
import Header from "../components/header";

function Note() {
  const toast = useToast();
  const apiUrl = getEnvironment();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  const [sem, setSem] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');
  const [dept, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [semestersFromMasterSem, setSemestersFromMasterSem] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchDepartmentData();
    fetchFacultyOptions();
    fetchRoomOptions();
    fetchNotes();
  }, []);

  const fetchDepartmentData = () => {
    fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        setDepartment(data[0].dept);
      })
      .catch(handleError);
  };

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/addsem/sem/${currentCode}`, {
      credentials: "include",
    })
      .then(handleResponse)
      .then((data) => {
        setSemestersFromMasterSem(data);
      })
      .catch(handleError);
  }, [currentCode]);

  const fetchFacultyOptions = () => {
    fetch(`${apiUrl}/timetablemodule/addfaculty/all?code=${currentCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        const options = data.map((faculty) => faculty);
        setFacultyOptions(options);
      })
      .catch(handleError);
  };

  const fetchRoomOptions = () => {
    fetch(`${apiUrl}/timetablemodule/addroom/code/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        const options = data;
        setRoomOptions(options);
      })
      .catch(handleError);
  };

  const fetchNotes = () => {
    fetch(`${apiUrl}/timetablemodule/note/code/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        setNotes(data);
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
    console.error('Error:', error);
  };

  const handleSubmit = () => {
    setIsLoading(true);

    const dataToSave = {
      sem: sem,
      room: room,
      note: note,
      faculty: faculty,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        toast({
          position: 'bottom',
          title: "Note Added",
          description: "Note added successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        fetchNotes();
        setIsLoading(false);
        setSem('');
        setRoom('');
        setNote('');
        setFaculty('');
      })
      .catch((error) => {
        console.error('Error:', error);
        toast({
          position: 'bottom',
          title: "Error",
          description: "Failed to add note",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
        setIsLoading(false);
      });
  };

  const handleEdit = (id) => {
    setIsEditing(true);
    setEditId(id);

    const noteToEdit = notes.find((note) => note._id === id);

    setSem(noteToEdit.sem);
    setRoom(noteToEdit.room);
    setNote(noteToEdit.note);
    setFaculty(noteToEdit.faculty);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setSem('');
    setRoom('');
    setNote('');
    setFaculty('');
  };

  const handleUpdate = () => {
    setIsLoading(true);
  
    const dataToUpdate = {
      sem: sem,
      room: room,
      note: note,
      faculty: faculty,
    };
  
    fetch(`${apiUrl}/timetablemodule/note/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToUpdate),
      credentials: 'include',
    })
      .then(handleResponse)
      .then(() => {
        toast({
          position: 'bottom',
          title: "Note Updated",
          description: "Note updated successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        fetchNotes();
        setIsEditing(false);
        setEditId(null);
        setSem('');
        setRoom('');
        setNote('');
        setFaculty('');
      })
      .catch((error) => {
        console.error('Error:', error);
        toast({
          position: 'bottom',
          title: "Error",
          description: "Failed to update note",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleDelete = (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this note?');
  
    if (isConfirmed) {
      fetch(`${apiUrl}/timetablemodule/note/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then(handleResponse)
        .then(() => {
          toast({
            position: 'bottom',
            title: "Note Deleted",
            description: "Note deleted successfully",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
          fetchNotes();
        })
        .catch((error) => {
          toast({
            position: 'bottom',
            title: "Error",
            description: "Failed to delete note",
            status: "error",
            duration: 2000,
            isClosable: true,
          });
          handleError(error);
        });
    }
  };

  return (
    <Box bg="white" minH="100vh">
      <Box>
        {/* Hero Header Section */}
        <Box 
          bgGradient="linear(to-r, pink.500, blue.300, green.200)"
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
                  Notes Management
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  Add Note
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Add and manage notes for semesters, rooms, and faculty.
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
            {/* Add/Edit Note Form */}
            <Box 
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              p={6}
              border="1px"
              borderColor="gray.300"
            >
              <Text fontWeight="bold" fontSize="lg" mb={4}>
                {isEditing ? 'Edit Note' : 'Add New Note'}
              </Text>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  isEditing ? handleUpdate() : handleSubmit();
                }}
              >
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel fontWeight="semibold">Semester</FormLabel>
                    <Select 
                      value={sem} 
                      onChange={(e) => setSem(e.target.value)}
                      size="lg"
                      bg="gray.50"
                      border="2px"
                      borderColor="gray.200"
                    >
                      <option value="" disabled>
                        Select Semester
                      </option>
                      {semestersFromMasterSem.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold">Faculty</FormLabel>
                    <Select
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      size="lg"
                      bg="gray.50"
                      border="2px"
                      borderColor="gray.200"
                    >
                      <option value="" disabled>
                        Select Faculty
                      </option>
                      {facultyOptions.map((facultyOption) => (
                        <option key={facultyOption} value={facultyOption}>
                          {facultyOption}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold">Room</FormLabel>
                    <Select
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      size="lg"
                      bg="gray.50"
                      border="2px"
                      borderColor="gray.200"
                    >
                      <option value="" disabled>
                        Select Room
                      </option>
                      {roomOptions &&
                        roomOptions.length > 0 &&
                        roomOptions.map((roomOption) => (
                          <option key={roomOption} value={roomOption}>
                            {roomOption}
                          </option>
                        ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold">Note</FormLabel>
                    <Input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      size="lg"
                      bg="gray.50"
                      border="2px"
                      borderColor="gray.200"
                      placeholder="Enter note"
                    />
                  </FormControl>

                  <HStack spacing={3}>
                    {isEditing && (
                      <Button
                        type="button"
                        colorScheme="gray"
                        size="lg"
                        onClick={handleCancelEdit}
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      colorScheme="pink"
                      size="lg"
                      isLoading={isLoading}
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      {isEditing ? 'Update Note' : 'Add Note'}
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </Box>

            {/* Notes Table */}
            <Box 
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              overflow="hidden"
              border="1px"
              borderColor="gray.300"
            >
              <Box p={6} borderBottom="1px" borderColor="gray.300">
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="lg">
                    Notes Data
                  </Text>
                  <Badge colorScheme="pink" fontSize="md" p={2}>
                    Total: {notes.length}
                  </Badge>
                </Flex>
              </Box>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead bg="pink.600">
                    <Tr>
                      <Th color="white" fontSize="xs" textAlign="center">Semester</Th>
                      <Th color="white" fontSize="xs" textAlign="center">Room</Th>
                      <Th color="white" fontSize="xs" textAlign="center">Faculty</Th>
                      <Th color="white" fontSize="xs" textAlign="center">Note</Th>
                      <Th color="white" fontSize="xs" textAlign="center">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {notes.map((note) => (
                      <Tr key={note._id} _hover={{ bg: "pink.50" }}>
                        <Td textAlign="center">
                          <Text fontWeight="semibold">{note.sem}</Text>
                        </Td>
                        <Td textAlign="center">{note.room}</Td>
                        <Td textAlign="center">{note.faculty}</Td>
                        <Td textAlign="center">{note.note}</Td>
                        <Td>
                          <HStack spacing={2} justify="center">
                            <Button
                              colorScheme="blue"
                              size="xs"
                              onClick={() => handleEdit(note._id)}
                              _hover={{ transform: 'scale(1.05)' }}
                              transition="all 0.2s"
                            >
                              Edit
                            </Button>
                            <Button
                              colorScheme="red"
                              size="xs"
                              onClick={() => handleDelete(note._id)}
                              _hover={{ transform: 'scale(1.05)' }}
                              transition="all 0.2s"
                            >
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Empty State */}
              {notes.length === 0 && (
                <Box p={8} textAlign="center">
                  <Text color="gray.500" fontSize="md">
                    No notes added yet. Add your first note above!
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

export default Note;