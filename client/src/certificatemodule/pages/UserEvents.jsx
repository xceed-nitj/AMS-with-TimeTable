import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import getEnvironment from "../../getenvironment";
import {
  Container,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Center,
  useToast,
  Box,
  Spinner,
} from '@chakra-ui/react';
import Header from "../../components/header";

const UserEvents = () => {
  const { userId } = useParams();
  const toast = useToast();
  const apiUrl = getEnvironment();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/certificatemodule/addevent/getevents/${userId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Full response data:', data);

        // Directly set the events state if data is an array
        if (Array.isArray(data)) {
          setEvents(data);
          if (data.length === 0) {
            toast({
              title: "No Events",
              description: "User has no events.",
              status: "info",
              duration: 3000,
              isClosable: true,
            });
          }
        } else {
          console.warn('Expected an array but got:', data);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching user events:', error);
        toast({
          title: "Error",
          description: "Failed to fetch events.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [apiUrl, userId, toast]);

  const handleLockUnlock = async (eventId, lockStatus) => {
    try {
        const endpoint = lockStatus ? 'unlock' : 'lock';
        console.log(`Sending request to ${endpoint} for event ID: ${eventId}`); // Add logging
        
      const response = await fetch(`${apiUrl}/certificatemodule/addevent/${endpoint}/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ lock: !lockStatus }),
      });

      console.log('Response Status:', response.status); // Log the response status
    const data = await response.json();
    console.log('Response Data:', data); // Log the response data

      if (response.ok) {
        toast({
          title: "Event Updated",
          description: "Event lock status updated successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        setEvents(events.map(event =>
          event._id === eventId ? { ...event, lock: !lockStatus } : event
        ));
      } else {
        console.error('Error updating event:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this event?');

      if (!confirmed) {
        // If the user cancels, do nothing
        return;
      }

      const response = await fetch(`${apiUrl}/certificatemodule/addevent/delete/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Event Deleted",
          description: "Event deleted successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        setEvents(events.filter(event => event._id !== eventId));
      } else {
        console.error('Error deleting event:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <Container maxW="7xl" p={4}>
      <Header title="User Events" />
      {loading ? (
        <Center><Spinner size="xl" /></Center>
      ) : (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}>
          <TableContainer>
            <Table variant="striped" colorScheme="teal" size="lg">
              <Thead>
                <Tr>
                  <Th textAlign="center">Event Name</Th>
                  <Th textAlign="center">Expiry Date</Th>
                  <Th textAlign="center">Plan</Th>
                  <Th textAlign="center">Lock Status</Th>
                  <Th textAlign="center">Lock/Unlock</Th>
                  <Th textAlign="center">Delete</Th>
                </Tr>
              </Thead>
              <Tbody>
                {events.map(event => (
                  <Tr key={event._id}>
                    <Td><Center>{event.name}</Center></Td>
                    <Td><Center>{new Date(event.ExpiryDate).toLocaleDateString()}</Center></Td>
                    <Td><Center>{event.plan}</Center></Td>
                    <Td><Center>{event.lock ? 'Locked' : 'Unlocked'}</Center></Td>
                    <Td>
                      <Center>
                        <Button colorScheme={event.lock ? "red" : "green"} onClick={() => handleLockUnlock(event._id, event.lock)}>
                          {event.lock ? 'Unlock' : 'Lock'}
                        </Button>
                      </Center>
                    </Td>
                    <Td>
                      <Center>
                        <Button colorScheme="red" onClick={() => handleDeleteEvent(event._id)}>
                          Delete
                        </Button>
                      </Center>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
};

export default UserEvents;
