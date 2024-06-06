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

function NirfRanking() {
  const [masterRoomData, setMasterRoomData] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [sortColumn, setSortColumn] = useState('rank');
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetch(`${apiUrl}/nirf/ranking/getranking`, {
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
        console.log(response.data)
        return response.json();
      })
      .then((data) => {
        // Sort the data based on 'dept' in alphabetical order
        // const sortedData = data.sort((a, b) => a.dept.localeCompare(b.dept));
        setMasterRoomData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching master room data:', error);
        setLoading(false);
      });
  }, []);

  function sanitizeString(str) {
    if (typeof str !== 'string' || !str) {
      return ''; // Return an empty string if the input is not a string or is undefined/null
    }
    // Remove special characters and spaces from the string
    return str.replace(/[^\w\d]/gi, '').toLowerCase();
  }
  
  useEffect(() => {
    // Filter rooms based on the search term
    const sanitizedSearchTerm = sanitizeString(searchTerm);

    const filteredRooms = masterRoomData.filter((room) => {
      const sanitizedRoom = sanitizeString(room.Institute);
      return sanitizedRoom.includes(sanitizedSearchTerm);
    });

    const sortedRooms = filteredRooms.sort((a, b) => {
        const rankA = a.Rank;
        const rankB = b.Rank;
      
        // If both ranks are defined, sort based on descending order of rank
        if (rankA !== undefined && rankB !== undefined) {
          return sortOrder === 'asc' ? rankA - rankB : rankB - rankA;
        }
      
        // Handle cases where one or both ranks are undefined
        // Push undefined ranks to the end or beginning, depending on sortOrder
        return rankA !== undefined ? -1 : 1; // Push undefined ranks to the end
      });
        
    setFilteredRooms(sortedRooms);
  }, [searchTerm, masterRoomData, sortColumn, sortOrder]);

//   const handleSort = (column) => {
//     // Toggle between 'asc' and 'desc' when clicking on the column header
//     setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
//     setSortColumn(column);
//   };

//   const getSortIcon = (column) => {
//     if (sortColumn === column) {
//       return sortOrder === 'asc' ? '↑' : '↓';
//     }
//     return '';
//   };

//   const redirectToMap = (landmark) => {
//     window.open(landmark, '_blank'); // Open the link in a new tab
//   };

  return (
    <>

    <Helmet>
      <title>NIRF | XCEED NITJ</title>
      <meta name='description' content="NITJ's official classroom locater" />
    </Helmet>
    <Container maxW="5xl">

      <Box>
        <Header title="NIRF Ranking Search"></Header>
        Enter the institute detail below
        <Box mb={4}>
          <Input
            type="text"
            placeholder="Search by Institute Name"
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
                //   onClick={() => handleSort('rank')}
                >
                  Institute
                </Th>
                           
               
                                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                //   onClick={() => handleSort('dept')}
                >
                  Location
                </Th>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  // onClick={() => handleSort('landMark')}
                >
State                </Th>

<Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                //   onClick={() => handleSort('building')}
                >
                  Type
                </Th>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                //   onClick={() => handleSort('building')}
                >
                  Year
                </Th>
                <Th
                  bg="teal.300"
                  color="white"
                  borderWidth="2px"
                  // onClick={() => handleSort('floor')}
                >
                  Rank
                </Th>


              </Tr>
            </Thead>
            <Tbody>
              {filteredRooms.map((room) => (
                <Tr key={room._id}>
                  <Td borderWidth="2px">{room.Institute}</Td>
                  <Td borderWidth="2px">{room.Location}</Td>
                  <Td borderWidth="2px">{room.State}</Td>
                  <Td borderWidth="2px">{room.Category}</Td>

                  <Td borderWidth="2px">{room.Year}</Td>
                  
                  <Td borderWidth="2px">{room.Rank}</Td>

                </Tr>
              ))}
            </Tbody>

          </Table>
          </Box>
          </Stack>
        )}
      </Box>

      <Footer/>
    </Container>
   </>
  );
}

export default NirfRanking;
