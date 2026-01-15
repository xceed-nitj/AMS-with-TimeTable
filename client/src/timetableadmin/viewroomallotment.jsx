import React, { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Text,
  Td,
  VStack,
  Flex,
  Badge,
  IconButton,
  Card,
  CardHeader,
  CardBody,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import Header from "../components/header";


const ViewAllotmentPage = () => {
  const [formData, setFormData] = useState({
    session: '',
    centralisedAllotments: [],
    openElectiveAllotments: [],
    message: '',
  });

  const apiUrl = getEnvironment();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchExistingData(currentCode);
  }, []);

  const fetchExistingData = async (currentCode) => {
    try {
      console.log(currentCode);
      const response = await fetch(`${apiUrl}/timetablemodule/allotment?code=${currentCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Data from backend:', data);

        const [allotmentData] = data;

        setFormData({
          session: allotmentData.session,
          centralisedAllotments: allotmentData.centralisedAllotments,
          openElectiveAllotments: allotmentData.openElectiveAllotments,
          message: allotmentData.message
        });
      } else {
        console.error('Failed to fetch existing data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderSlot = (value) => (
    <Badge colorScheme={value ? "green" : "red"} fontSize="xs" px={2} py={1} borderRadius="md">
      {value ? "✓ Yes" : "✗ No"}
    </Badge>
  );

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
                Room Allotment
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Allotted Rooms for Session {formData.session}
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                View centralized and open elective room allotments across all departments.
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
          {/* Centralised Room Allotment Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="purple.600" color="white" p={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Centralised Room Allotment</Heading>
                <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                  {formData.centralisedAllotments.length} Departments
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
                    background: 'purple.400',
                    borderRadius: 'full',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: 'purple.500',
                  },
                }}
              >
                <Table variant="simple" size="md">
                  <Thead bg="purple.50">
                    <Tr>
                      <Th 
                        color="purple.700" 
                        fontSize="sm" 
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="purple.200"
                        position="sticky"
                        left={0}
                        bg="purple.50"
                        zIndex={2}
                      >
                        Department
                      </Th>
                      <Th 
                        color="purple.700" 
                        fontSize="sm" 
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="purple.200"
                      >
                        Rooms
                      </Th>
                      <Th 
                        color="purple.700" 
                        fontSize="sm" 
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="purple.200"
                      >
                        Morning Slot
                      </Th>
                      <Th 
                        color="purple.700" 
                        fontSize="sm" 
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="purple.200"
                      >
                        Afternoon Slot
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {formData.centralisedAllotments.map((dept, deptIndex) => (
                      <Tr 
                        key={`centralisedDeptRow-${deptIndex}`}
                        _hover={{ bg: 'purple.50' }}
                        transition="background 0.2s"
                      >
                        <Td 
                          fontWeight="bold" 
                          color="purple.700"
                          position="sticky"
                          left={0}
                          bg="white"
                          _hover={{ bg: 'purple.50' }}
                          borderRight="1px"
                          borderColor="gray.200"
                        >
                          {dept.dept}
                        </Td>
                        <Td>
                          <VStack align="start" spacing={2}>
                            {dept.rooms.map((room, roomIndex) => (
                              <Box 
                                key={`centralisedRoom-${deptIndex}-${roomIndex}`}
                                p={2}
                                bg="blue.50"
                                borderRadius="md"
                                borderLeft="3px solid"
                                borderColor="blue.400"
                                w="full"
                              >
                                <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                                  {room.room}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={2}>
                            {dept.rooms.map((room, roomIndex) => (
                              <Box key={`centralisedMorning-${deptIndex}-${roomIndex}`}>
                                {renderSlot(room.morningSlot)}
                              </Box>
                            ))}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={2}>
                            {dept.rooms.map((room, roomIndex) => (
                              <Box key={`centralisedAfternoon-${deptIndex}-${roomIndex}`}>
                                {renderSlot(room.afternoonSlot)}
                              </Box>
                            ))}
                          </VStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>

          {/* Open Elective Allotment Card */}
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
                <Heading size="md">Open Elective Room Allotment</Heading>
                <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                  {formData.openElectiveAllotments.length} Departments
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
                        position="sticky"
                        left={0}
                        bg="teal.50"
                        zIndex={2}
                      >
                        Department
                      </Th>
                      <Th 
                        color="teal.700" 
                        fontSize="sm" 
                        fontWeight="bold"
                        borderBottom="2px"
                        borderColor="teal.200"
                      >
                        Rooms
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {formData.openElectiveAllotments.map((dept, deptIndex) => (
                      <Tr 
                        key={`openElectiveDeptRow-${deptIndex}`}
                        _hover={{ bg: 'teal.50' }}
                        transition="background 0.2s"
                      >
                        <Td 
                          fontWeight="bold" 
                          color="teal.700"
                          position="sticky"
                          left={0}
                          bg="white"
                          _hover={{ bg: 'teal.50' }}
                          borderRight="1px"
                          borderColor="gray.200"
                        >
                          {dept.dept}
                        </Td>
                        <Td>
                          <VStack align="start" spacing={2}>
                            {dept.rooms.map((room, roomIndex) => (
                              <Box 
                                key={`openElectiveRoom-${deptIndex}-${roomIndex}`}
                                p={2}
                                bg="orange.50"
                                borderRadius="md"
                                borderLeft="3px solid"
                                borderColor="orange.400"
                                w="full"
                              >
                                <Text fontSize="sm" fontWeight="semibold" color="orange.700">
                                  {room.room}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
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
};

export default ViewAllotmentPage;