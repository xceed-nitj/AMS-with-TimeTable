import React, { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';
import {
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Text,
  Td,
} from '@chakra-ui/react';
import Header from "../components/header";


const ViewAllotmentPage = () => {
  const [formData, setFormData] = useState({
    session: '',
    centralisedAllotments: [],
    openElectiveAllotments: [],
    message:'',
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
          message:allotmentData.message
        });
      } else {
        console.error('Failed to fetch existing data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Container maxW="5xl">
      {/* <Heading >Alloted Room For the Current Session</Heading> */}
      <div>
      <Header title="Alloted Rooms "></Header>
      </div>
      <Text fontWeight="bold" fontSize="lg">Message from ITTC: </Text>
      <Text color="red">
    {formData.message}
  </Text> {/* Centralised Room Table */}
      <Table variant="striped" colorScheme="gray" style={{ marginBottom: '20px' }}>
      <caption > <Text fontWeight="bold" fontSize="lg">Centralised Room Allotment  (Total Entries: {formData.centralisedAllotments.length})</Text></caption>
        <Thead>
          <Tr>
            <Th bg="teal.300"
                  color="white"
                  borderWidth="2px">Department</Th>
            <Th bg="teal.300"
                  color="white"
                  borderWidth="2px">Rooms</Th>
            <Th bg="teal.300"
                  color="white"
                  borderWidth="2px">Morning Slot</Th>
            <Th bg="teal.300"
                  color="white"
                  borderWidth="2px">Afternoon Slot</Th>
          </Tr>
        </Thead>
        <Tbody>
          {formData.centralisedAllotments.map((dept, deptIndex) => (
            <Tr key={`centralisedDeptRow-${deptIndex}`}>
              <Td>{dept.dept}</Td>
              <Td>
                {dept.rooms.map((room, roomIndex) => (
                  <React.Fragment key={`centralisedRoom-${deptIndex}-${roomIndex}`}>
                    <div>{room.room}</div>
                  </React.Fragment>
                ))}
              </Td>
              <Td>
                {dept.rooms.map((room, roomIndex) => (
                  <React.Fragment key={`centralisedRoom-${deptIndex}-${roomIndex}`}>
                    <div>{room.morningSlot ? 'Yes' : 'No'}</div>
                  </React.Fragment>
                ))}
              </Td>
              <Td>
                {dept.rooms.map((room, roomIndex) => (
                  <React.Fragment key={`centralisedRoom-${deptIndex}-${roomIndex}`}>
                    <div>{room.afternoonSlot ? 'Yes' : 'No'}</div>
                  </React.Fragment>
                ))}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Open Elective Allotment Table */}
      <Table variant="striped" colorScheme="gray" style={{ marginBottom: '20px' }}>

      <caption > <Text fontWeight="bold" fontSize="lg">Open Elective Room Allotment  (Total Entries: {formData.openElectiveAllotments.length})</Text></caption>
             <Thead>
          <Tr>
            <Th bg="teal.300"
                  color="white"
                  borderWidth="2px">Department</Th>
            <Th bg="teal.300"
                  color="white"
                  borderWidth="2px">Rooms</Th>
          </Tr>
        </Thead>
        <Tbody>
          {formData.openElectiveAllotments.map((dept, deptIndex) => (
            <Tr key={`openElectiveDeptRow-${deptIndex}`}>
              <Td>{dept.dept}</Td>
              <Td>
                {dept.rooms.map((room, roomIndex) => (
                  <React.Fragment key={`openElectiveRoom-${deptIndex}-${roomIndex}`}>
                    <div>{room.room}</div>
                  </React.Fragment>
                ))}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Container>
  );
};

export default ViewAllotmentPage;
