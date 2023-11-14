// Import React and other necessary dependencies
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
  Td,
} from '@chakra-ui/react';

// Create the ViewAllotmentPage component
const ViewAllotmentPage = () => {
  // State to store form data
  const [formData, setFormData] = useState({
    session: '',
    centralisedAllotments: [],
    openElectiveAllotments: [],
  });

  // Function to get the API URL
  const apiUrl = getEnvironment();

  // Get the current URL and extract the code from it
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  // Fetch existing data when the component mounts
  useEffect(() => {
    fetchExistingData(currentCode);
  }, []);

  // Function to fetch existing data
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

        // Assuming you have only one item in the array (as per your example)
        const [allotmentData] = data;

        setFormData({
          session: allotmentData.session,
          centralisedAllotments: allotmentData.centralisedAllotments,
          openElectiveAllotments: allotmentData.openElectiveAllotments,
        });
      } else {
        console.error('Failed to fetch existing data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Render the component
  return (
    <Container centerContent maxW="2xl">
      <Heading>Alloted Room For the Current Session</Heading>
      {/* Centralised Room Table */}
      Centralised Room Allotment
      <Table variant="simple" style={{ marginBottom: '20px' }}>
        
        <Thead>
          <Tr>
            <Th>Department</Th>
            <Th>Rooms</Th>
            <Th>Morning Slot</Th>
            <Th>Afternoon Slot</Th>
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

      Open Elective Room Allotment
      {/* Open Elective Allotment Table */}
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Department</Th>
            <Th>Rooms</Th>
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

// Export the component
export default ViewAllotmentPage;
