import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

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
  const [lockedTimes, setLockedTimes] = useState({});
  const [savedTimes, setSavedTimes] = useState({});
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

  const fetchLockedTime = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,
        { credentials: "include" }
      );
      const lockedTimeData = await response.json();
      setLockedTimes(prevLockedTimes => ({
        ...prevLockedTimes,
        [currentCode]: lockedTimeData.updatedTime.lockTimeIST,
      }));
    } catch (error) {
      console.error("Error fetching locked time data:", error);
    }
  };
  const fetchSavedTime = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,
        { credentials: "include" }
      );
      const savedTimeData = await response.json();
      setSavedTimes(prevSavedTimes => ({
        ...prevSavedTimes,
        [currentCode]: savedTimeData.updatedTime.saveTimeIST,
      }));
    } catch (error) {
      console.error("Error fetching saved time data:", error);
    }
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
          const uniqueDepartments = new Set();
          const uniqueData = jsonData.map(item => {
            if (!uniqueDepartments.has(item.dept)) {
              uniqueDepartments.add(item.dept);
              return {
                ...item,
              };
            }
            return null;
          }).filter(Boolean);
          setData(uniqueData);

          // Call the function to fetch locked time for each item
          jsonData.forEach(item => {
            fetchLockedTime(item.code);
          });
          jsonData.forEach(item => {
            fetchSavedTime(item.code);
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
        {/* <Header title="Timetable Admin Master View"> */}
        <Header title="Timetable Admin Master View"></Header>

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
        <p>Total Entries: {data.length}</p>
        {selectedSession && (
          <Table variant="striped" colorScheme="teal" size="md">
            <Thead>
              <Tr>
                <Th>Department</Th>
                <Th>Code</Th>
                <Th>Last Saved Time</Th>
                <Th>Last Locked Time</Th>
                <Th>View Timetable</Th>
                <Th>Download PDF</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item) => (
                <Tr key={item._id}>
                  <Td>{item.dept}</Td>
                  <Td>{item.code}</Td>
                  <Td>{savedTimes[item.code] !== null ? savedTimes[item.code] : 'Table not saved yet'}</Td>
                  <Td>{lockedTimes[item.code] !== null ? lockedTimes[item.code] : 'Table not locked yet'}</Td>
                  <Td>
                  <Link
          href={`${window.location.origin}/tt/${item.code}`}
          target="_blank"
          rel="noopener noreferrer"
          color="teal.500"
        >
          Go to timetable
        </Link>
                  </Td>
                  <Td>
                  <Link
          href={`${window.location.origin}/tt/${item.code}/generatepdf`}
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
