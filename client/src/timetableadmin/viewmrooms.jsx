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
} from "@chakra-ui/react";
import { FaMapMarkerAlt } from 'react-icons/fa';

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
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
    setSortColumn(column);
  };

  const getSortIcon = (column) => {
    if (sortColumn === column) {
      return sortOrder === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  const redirectToMap = (landmark) => {
    window.open(landmark, '_blank'); // Open the link in a new tab
  };

  return (
    <>

    <Helmet>
      <title>Classroom location | XCEED NITJ</title>
      <meta name='description' content="NITJ's official classroom locater" />
    </Helmet>
    <Container maxW="5xl">

      <Box>
        <Header title="Class Room Information"></Header>
        Enter the room detail below
        <Box mb={4}>
          <Input
            type="text"
            placeholder="Search by room"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Stack direction={['column', 'row']} spacing="4">
            
            <Box overflowX="auto">
            <p>Total Entries: {masterRoomData.length}</p>
<Table Table variant="striped" colorScheme="gray" borderWidth="2px">
            <Thead>
              <Tr>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  onClick={() => handleSort('room')}
                >
                  Room {getSortIcon('room')}
                </Th>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  // onClick={() => handleSort('building')}
                >
                  Type
                </Th>

                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  onClick={() => handleSort('building')}
                >
                  Building {getSortIcon('building')}
                </Th>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  // onClick={() => handleSort('floor')}
                >
                  Floor {getSortIcon('floor')}
                </Th>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  onClick={() => handleSort('dept')}
                >
                  Department {getSortIcon('dept')}
                </Th>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  // onClick={() => handleSort('landMark')}
                >
                  Location {getSortIcon('landMark')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredRooms.map((room) => (
                <Tr key={room._id}>
                  <Td borderWidth="2px">{room.room}</Td>
                  <Td borderWidth="2px">{room.type}</Td>
                  <Td borderWidth="2px">{room.building}</Td>
                  <Td borderWidth="2px">{room.floor}</Td>
                  <Td borderWidth="2px">{room.dept}</Td>
                  {/* <Td borderWidth="2px">{room.landMark}</Td> */}
                  <Td borderWidth="2px">
                {(
                  <chakra.span
                    cursor="pointer"
                    onClick={() => redirectToMap(room.landMark)}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FaMapMarkerAlt color="red" size={30} />
                  </chakra.span>
                )}
              </Td>
                </Tr>
              ))}
            </Tbody>

          </Table>
          </Box>
          </Stack>
        )}
      </Box>
      <Text color="blue">CREDITS: Geo Location contributed by Nandhini, IPE (Batch of 2021-2025)</Text>

      <Footer/>
    </Container>
   </>
  );
}

export default MasterRoomTable;
