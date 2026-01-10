import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import Footer from '../components/footer'
import {
  Box,
  Container,
  Input,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  chakra,
  Stack,
  VStack,
  Flex,
  Heading,
  Badge,
  Card,
  CardHeader,
  CardBody,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { FaMapMarkerAlt, FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { SearchIcon } from '@chakra-ui/icons';

import Header from '../components/header';
import { Helmet } from 'react-helmet-async';

function MasterRoomTable() {
  const [masterRoomData, setMasterRoomData] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [sortColumn, setSortColumn] = useState('room');
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/masterroom`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        // Sort the data based on 'dept' in alphabetical order
        const sortedData = data.sort((a, b) => a.dept.localeCompare(b.dept));
        setMasterRoomData(sortedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching master room data:', error);
        setLoading(false);
      });
  }, []);

  function sanitizeString(str) {
    // Remove special characters and spaces from the string
    return str.replace(/[^\w\d]/gi, '').toLowerCase();
  }

  useEffect(() => {
    // Filter rooms based on the search term
    const sanitizedSearchTerm = sanitizeString(searchTerm);

    const filteredRooms = masterRoomData.filter((room) => {
      const sanitizedRoom = sanitizeString(room.room);
      return sanitizedRoom.includes(sanitizedSearchTerm);
    });

    // Sort the filtered rooms based on the selected column and order
    const sortedRooms = filteredRooms.sort((a, b) => {
      const columnA = a[sortColumn];
      const columnB = b[sortColumn];

      if (sortOrder === 'asc') {
        return columnA.localeCompare(columnB);
      } else {
        return columnB.localeCompare(columnA);
      }
    });

    setFilteredRooms(sortedRooms);
  }, [searchTerm, masterRoomData, sortColumn, sortOrder]);

  const handleSort = (column) => {
    // Toggle between 'asc' and 'desc' when clicking on the column header
    if (sortColumn === column) {
      setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn === column) {
      return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort opacity={0.3} />;
  };

  const redirectToMap = (landmark) => {
    window.open(landmark, '_blank'); // Open the link in a new tab
  };

  return (
    <>
      <Helmet>
        <title>Classroom Location | XCEED NITJ</title>
        <meta name='description' content="NITJ's official classroom locator" />
      </Helmet>

      <Box bg="white" minH="100vh">
        {/* Hero Header Section */}
        <Box
          bgGradient="linear(to-r, pink.500, orange.500, yellow.500)"
          pt={0}
          pb={{ base: 16, md: 20, lg: 24 }}
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
          <Box
            position="relative"
            zIndex={2}
            sx={{
              '& button[aria-label="Go back"]': { display: "none" },
              '& .chakra-button:first-of-type': { display: "none" },
            }}
          >
            <Header />
          </Box>

          <Container 
            maxW="7xl" 
            position="relative" 
            mt={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6, lg: 8 }}
          >
            <VStack 
              spacing={{ base: 3, md: 4 }}
              align={{ base: "center", lg: "start" }}
              textAlign={{ base: "center", lg: "left" }}
            >
              <Badge
                colorScheme="whiteAlpha"
                fontSize={{ base: "xs", md: "sm" }}
                px={{ base: 2, md: 3 }}
                py={1}
                borderRadius="full"
              >
                Classroom Management
              </Badge>
              <Heading 
                size={{ base: "xl", md: "2xl" }}
                color="white" 
                fontWeight="bold" 
                lineHeight="1.2"
              >
                Classroom Information
              </Heading>
              <Text 
                color="whiteAlpha.900" 
                fontSize={{ base: "md", md: "lg" }}
                maxW={{ base: "full", lg: "2xl" }}
              >
                Search and locate classrooms across the campus with detailed building information
              </Text>
            </VStack>
          </Container>
        </Box>

        {/* Search Card - Centered */}
        <Container maxW="7xl" mt={-12} position="relative" zIndex={1} px={{ base: 4, md: 6, lg: 8 }}>
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
            mb={6}
          >
            <CardHeader bg="teal.600" color="white" p={4}>
              <Heading size="md">Search Classrooms</Heading>
            </CardHeader>
            <CardBody p={6}>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="teal.400" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder="Search by room number (e.g., LT1, 205, CSE Block...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderColor="teal.300"
                  _hover={{ borderColor: "teal.400" }}
                  _focus={{
                    borderColor: "teal.500",
                    boxShadow: "0 0 0 1px #319795",
                  }}
                  fontSize={{ base: "sm", md: "md" }}
                />
              </InputGroup>
            </CardBody>
          </Card>
        </Container>

        {/* Results Card - Full Width */}
        <Box w="100%" px={{ base: 4, md: 6, lg: 8 }} pb={6}>
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
            w="100%"
          >
            <CardHeader bg="teal.600" color="white" p={4}>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <VStack align="start" spacing={0}>
                  <Heading size="md">Classroom Directory</Heading>
                  <Text fontSize="xs" color="whiteAlpha.800" mt={1}>
                    Click on column headers to sort
                  </Text>
                </VStack>
                <Badge colorScheme="orange" fontSize={{ base: "sm", md: "md" }} px={3} py={1}>
                  {filteredRooms.length} / {masterRoomData.length} Rooms
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody p={0}>
              {loading ? (
                <Box p={12} textAlign="center">
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="teal.500"
                    size="xl"
                  />
                  <Text mt={4} color="gray.600">Loading classroom data...</Text>
                </Box>
              ) : filteredRooms.length === 0 ? (
                <Box p={6}>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                      No classrooms found matching "{searchTerm}". Try a different search term.
                    </AlertDescription>
                  </Alert>
                </Box>
              ) : (
                <Box
                  overflowX="auto"
                  w="100%"
                  sx={{
                    '&::-webkit-scrollbar': {
                      height: '8px',
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
                  <Table 
                    variant="simple" 
                    size={{ base: "sm", md: "md" }}
                    sx={{
                      tableLayout: "fixed",
                      width: "100%",
                    }}
                  >
                    <Thead bg="teal.50">
                      <Tr>
                        {/* Room Column - 15% */}
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          cursor="pointer"
                          onClick={() => handleSort('room')}
                          _hover={{ bg: "teal.100" }}
                          width={{ base: "20%", md: "15%" }}
                          whiteSpace="normal"
                          wordBreak="break-word"
                        >
                          <HStack spacing={1}>
                            <Text>Room</Text>
                            <Box>{getSortIcon('room')}</Box>
                          </HStack>
                        </Th>
                        
                        {/* Type Column - 10% */}
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          width={{ base: "15%", md: "10%" }}
                          whiteSpace="normal"
                          wordBreak="break-word"
                        >
                          Type
                        </Th>
                        
                        {/* Building Column - 20% */}
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          cursor="pointer"
                          onClick={() => handleSort('building')}
                          _hover={{ bg: "teal.100" }}
                          width={{ base: "20%", md: "20%" }}
                          whiteSpace="normal"
                          wordBreak="break-word"
                        >
                          <HStack spacing={1}>
                            <Text>Building</Text>
                            <Box>{getSortIcon('building')}</Box>
                          </HStack>
                        </Th>
                        
                        {/* Floor Column - 8% */}
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          width={{ base: "12%", md: "8%" }}
                          whiteSpace="normal"
                          wordBreak="break-word"
                        >
                          Floor
                        </Th>
                        
                        {/* Department Column - 30% */}
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          cursor="pointer"
                          onClick={() => handleSort('dept')}
                          _hover={{ bg: "teal.100" }}
                          width={{ base: "20%", md: "25%" }}
                          whiteSpace="normal"
                          wordBreak="break-word"
                        >
                          <HStack spacing={1}>
                            <Text>Department</Text>
                            <Box>{getSortIcon('dept')}</Box>
                          </HStack>
                        </Th>
                        
                        {/* Location Column - 10% */}
                        <Th
                          color="teal.700"
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          borderBottom="2px"
                          borderColor="teal.200"
                          textAlign="center"
                          width={{ base: "12%", md: "10%" }}
                        >
                          <Text display={{ base: "none", md: "block" }}>Location</Text>
                          <Text display={{ base: "block", md: "none" }}>Loc</Text>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredRooms.map((room) => (
                        <Tr
                          key={room._id}
                          _hover={{ bg: "teal.50" }}
                          transition="background 0.2s"
                        >
                          <Td 
                            fontWeight="semibold" 
                            fontSize={{ base: "xs", md: "sm" }}
                            whiteSpace="normal"
                            wordBreak="break-word"
                          >
                            {room.room}
                          </Td>
                          <Td 
                            fontSize={{ base: "xs", md: "sm" }}
                            whiteSpace="normal"
                            wordBreak="break-word"
                          >
                            <Badge 
                              colorScheme="purple" 
                              fontSize="xs" 
                              px={2} 
                              py={1}
                              whiteSpace="normal"
                              textAlign="center"
                            >
                              {room.type}
                            </Badge>
                          </Td>
                          <Td 
                            fontSize={{ base: "xs", md: "sm" }}
                            whiteSpace="normal"
                            wordBreak="break-word"
                          >
                            <Badge 
                              colorScheme="blue" 
                              fontSize="xs" 
                              px={2} 
                              py={1}
                              whiteSpace="normal"
                              textAlign="center"
                            >
                              {room.building}
                            </Badge>
                          </Td>
                          <Td 
                            fontSize={{ base: "xs", md: "sm" }}
                            whiteSpace="normal"
                            wordBreak="break-word"
                          >
                            {room.floor}
                          </Td>
                          <Td 
                            fontSize={{ base: "xs", md: "sm" }}
                            whiteSpace="normal"
                            wordBreak="break-word"
                          >
                            <Badge 
                              colorScheme="green" 
                              fontSize="xs" 
                              px={2} 
                              py={1}
                              whiteSpace="normal"
                              textAlign="center"
                            >
                              {room.dept}
                            </Badge>
                          </Td>
                          <Td textAlign="center">
                            <IconButton
                              icon={<FaMapMarkerAlt />}
                              colorScheme="red"
                              variant="ghost"
                              size={{ base: "sm", md: "md" }}
                              onClick={() => redirectToMap(room.landMark)}
                              aria-label="View location on map"
                              _hover={{ bg: "red.50", transform: "scale(1.1)" }}
                              transition="all 0.2s"
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </Box>

        {/* Credits Card - Centered */}
        <Container maxW="7xl" px={{ base: 4, md: 6, lg: 8 }} pb={6}>
          <Card
            bg="white"
            borderRadius="xl"
            shadow="md"
            border="1px"
            borderColor="gray.200"
            p={4}
          >
            <Text color="blue.600" fontSize={{ base: "xs", md: "sm" }} textAlign="center">
              <strong>CREDITS:</strong> Geo Location contributed by Nandhini, IPE (Batch of 2021-2025)
            </Text>
          </Card>
        </Container>

        <Footer />
      </Box>
    </>
  );
}

export default MasterRoomTable;