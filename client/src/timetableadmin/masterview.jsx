import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import {
  Box,
  Container,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  chakra,
  Select,
} from "@chakra-ui/react";

function TimetableMasterView() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [data, setData] = useState([]);
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    fetch(`${apiUrl}/timetablemodule/allotment/session`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setSessions(data);
      })
      .catch((error) => {
        console.error('Error fetching sessions:', error);
      });
  };

  const fetchData = () => {
    // Check if a session is selected
    if (selectedSession) {
      fetch(`${apiUrl}/timetablemodule/timetable/getallcodes/${selectedSession}`, { credentials: 'include' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(jsonData => {
          console.log(jsonData)
          const uniqueDepartments = new Set();
          const uniqueData = jsonData.filter(item => {
            const uniqueDepartments = new Set();
            const uniqueData = jsonData.map(item => {
              if (!uniqueDepartments.has(item.dept)) {
                uniqueDepartments.add(item.dept);
                return {
                  ...item,
                  lastUpdated: new Date(item.updated_at).toLocaleString(),
                  lastSaved: new Date(item.created_at).toLocaleString(),
                };
              }
              return null;
            }).filter(Boolean);
            setData(uniqueData);
          });
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    }
  };


  useEffect(() => {
    fetchData();
  }, [selectedSession]);

  const handleSessionChange = (event) => {
    const newSession = event.target.value;
    setSelectedSession(newSession);
  };

  return (
    <Container maxW="container.lg" py={10}>
      <Box>
        <Text fontSize="3xl" fontWeight="bold" mb={4}>Timetable Master View</Text>

        <Text fontSize="xl" mb={2}>Select Session</Text>
        <Select onChange={handleSessionChange} value={selectedSession} mb={4}>
          <option value="" disabled>
            Select Session
          </option>
          {sessions.map((session) => (
            <option key={session} value={session}>
              {session}
            </option>
          ))}
        </Select>

        {selectedSession && (
          <Table variant="striped" colorScheme="teal" size="md">
            <Thead>
              <Tr>
                <Th>Department</Th>
                <Th>Code</Th>
                <Th>Last Updated</Th>
                <Th>Last Saved</Th>
                <Th>Download PDF</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item) => (
                <Tr key={item._id}>
                  <Td>{item.dept}</Td>
                  <Td>{item.code}</Td>
                  <Td>{item.lastUpdated}</Td>
                  <Td>{item.lastSaved}</Td>
                  <Td>
                    <Link
                      href={`${apiUrl}/tt/${item.code}/generatepdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="teal.500"
                    >
                      Download PDF
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Container>
  );
}

export default TimetableMasterView;