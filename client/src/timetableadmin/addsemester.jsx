import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { 
  AbsoluteCenter, 
  Box, 
  Center, 
  Circle, 
  Container, 
  FormControl, 
  FormLabel, 
  Heading,
  Input, 
  Select, 
  Text,
  VStack,
  HStack,
  Badge,
  IconButton,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomBlueButton, CustomTealButton, CustomDeleteButton} from '../styles/customStyles'
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
import { useToast } from '@chakra-ui/react';
import Header from '../components/header';

function AddSemComponent() {
  const toast = useToast()
  const [sems, setSems] = useState([]);
  const [newSem, setNewSem] = useState(''); 
  const [dept, setDepartment] = useState('');
  const [semestersFromMasterSem, setSemestersFromMasterSem] = useState([]);
 
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'gray.900');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchDepartmentData();
    fetchSemData();
  }, []);

  useEffect(() => {
    if (dept) {
      fetchSemestersFromMasterSem();
    }
  }, [dept]);

  const fetchDepartmentData = () => {
    fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        setDepartment(data.dept);
      })
      .catch(handleError);
  };

  const fetchSemestersFromMasterSem = () => {
    fetch(`${apiUrl}/timetablemodule/mastersem/dept/${dept}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        const semesters = data.map((item) => item.sem);
        setSemestersFromMasterSem(semesters);
      })
      .catch(handleError);
  };

  const fetchSemData = () => {
    fetch(`${apiUrl}/timetablemodule/addSem`,{credentials: 'include'})
      .then(handleResponse)
      .then((data) => {
        const filteredSem = data.filter((sem) => sem.code === currentCode);
        setSems(filteredSem);
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
    const dataToSave = {
      sem: newSem,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/addSem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        toast({
          position: 'bottom',
          title: 'Semester added',
          description: "Semester added successfully!",
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
        fetchSemData();
        setNewSem('');
      })
      .catch(handleError);
  };

  const handleSemInputChange = (e) => {
    setNewSem(e.target.value);
  };

  const handleDelete = (semId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this semester?');
  
    if (isConfirmed) {
      fetch(`${apiUrl}/timetablemodule/addSem/${semId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then(handleResponse)
        .then(() => {
          toast({
            position: 'bottom',
            title: 'Semester deleted',
            description: "Semester deleted successfully!",
            status: 'success',
            duration: 2000,
            isClosable: true,
          })
          fetchSemData();
        })
        .catch(handleError);
    }
  };
  
  return (
    <Box bgGradient={bgGradient} minH="100vh">
      <Box>
        {/* Hero Header Section */}
        <Box 
          bgGradient="linear(to-r, orange.400, red.500, blue.500)"
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
                  Semester Management
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  Add Semester
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Create and manage semesters for your timetable.
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

        <Container maxW="4xl" mt={-12} position="relative" zIndex={1} pb={16}>
          <VStack spacing={8} align="stretch">
            {/* Add Semester Form */}
            <Box 
              bg={cardBg}
              borderRadius="2xl"
              shadow="2xl"
              p={6}
              border="1px"
              borderColor={borderColor}
            >
              <FormControl>
                <Text fontWeight="bold" fontSize="lg" mb={3}>
                  Add New Semester
                </Text>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <FormLabel fontWeight="semibold">Select Semester</FormLabel>
                    <Select
                      onChange={handleSemInputChange}
                      value={newSem}
                      placeholder="Select Semester"
                      size="lg"
                      bg="gray.50"
                      border="2px"
                      borderColor="gray.200"
                    >
                      {semestersFromMasterSem.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  <Button 
                    colorScheme="teal" 
                    size="lg"
                    onClick={handleSubmit}
                    isDisabled={!newSem}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Add Semester
                  </Button>
                </VStack>
              </FormControl>
            </Box>

            {/* Semester Table */}
            <Box 
              bg={cardBg}
              borderRadius="2xl"
              shadow="2xl"
              overflow="hidden"
              border="1px"
              borderColor={borderColor}
            >
              <Box p={6} borderBottom="1px" borderColor={borderColor}>
                <Text fontWeight="bold" fontSize="lg">
                  Semester Data (Total Entries: {sems.length})
                </Text>
              </Box>
              <TableContainer>
                <Table variant='simple' size='md'>
                  <Thead bg="teal.600">
                    <Tr>
                      <Th color="white" fontSize="md" textAlign="center">Semester</Th>
                      <Th color="white" fontSize="md" textAlign="center">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sems.map((sem) => (
                      <Tr 
                        key={sem._id} 
                        _hover={{ bg: 'teal.50' }}
                        transition="background 0.2s"
                      >
                        <Td>
                          <Center>
                            <Text fontSize='lg' fontWeight='semibold'>
                              {sem.sem}
                            </Text>
                          </Center>
                        </Td>
                        <Td>
                          <Center>
                            <Button
                              colorScheme="red"
                              size="sm"
                              onClick={() => handleDelete(sem._id)}
                              _hover={{ transform: 'scale(1.05)' }}
                              transition="all 0.2s"
                            >
                              Delete
                            </Button>
                          </Center>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              
              {/* Empty State */}
              {sems.length === 0 && (
                <Box p={8} textAlign="center">
                  <Text color="gray.500" fontSize="md">
                    No semesters added yet. Add your first semester above!
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

export default AddSemComponent;