import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import {
  Container,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Button,
  Center,
  useToast,
} from '@chakra-ui/react';
import Header from "../../components/header";
import { useDisclosure } from "@chakra-ui/hooks";
import { CustomTh, CustomLink, CustomTealButton } from '../../styles/customStyles';

function CMDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEventLocked, setEventLocked] = useState(false);
  const [areAllEventsLocked, setAllEventsLocked] = useState(false); // New state to track if all events are locked

  const { isOpen, onOpen, onClose } = useDisclosure();
  const apiUrl = getEnvironment();

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/certificatemodule/addevent/getevents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
      );

      if (response.ok) {
        const data = await response.json();
        setTable(data);
        try {
          for (let i = 0; i < data.length; i++) {
            const response = await fetch(`${apiUrl}/certificatemodule/addevent/getCertificateCount/${data[i]._id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            })
            const {issuedCount,totalCount} = await response.json();
            data[i].totalCertificates = totalCount;
            data[i].certificatesIssued = issuedCount;
            setTable(data)
          }
        } catch (error) { /* empty */ }

        if (data.length > 0) {
          const lastEventLocked = data[data.length - 1].lock;
          setEventLocked(lastEventLocked);

          // Check if all events are locked
          const allLocked = data.every((event) => event.lock);
          setAllEventsLocked(allLocked);
        } else {
          // If no events, allow adding a new one
          setAllEventsLocked(true);
        }
      } else {
        console.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const lockEvent = async (id) => {
    try {
      const confirmed = window.confirm('Sure? You wont be able to edit any content once locked!');

      if (!confirmed) {
        // If the user cancels, do nothing
        return;
      }

      const response = await fetch(`${apiUrl}/certificatemodule/addevent/lock/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ lock: true }),
      }
      );

      if (response.ok) {
        // Find the index of the event to lock
        const eventIndex = table.findIndex(event => event._id === id);
        if (eventIndex !== -1) {
          const updatedTable = [...table];
          updatedTable[eventIndex].lock = true;
          setTable(updatedTable);

          // Update the state for whether all events are locked
          const allLocked = updatedTable.every(event => event.lock);
          setAllEventsLocked(allLocked);

          toast({
            title: 'Event Locked',
            description: 'The event has been locked successfully.',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'middle',
          });
        }
      } else {
        console.error('Failed to lock the event');
      }
    } catch (error) {
      console.error('Error locking the event:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [apiUrl]);

  const handleAddEvent = () => {
    if (areAllEventsLocked) {
      navigate('/cm/useraddevent');
    } else {
      toast({
        title: 'Action Required',
        description: 'Please lock all previous events before adding a new one.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const currentUrl = window.location.href;
  const urlParts = currentUrl.split('/');
  const domainName = urlParts[2];

  return (
    <Container maxW="7xl">
      <Button
        colorScheme="teal"
        onClick={handleAddEvent}
        mb={4}
        isDisabled={!(table.length === 0 || areAllEventsLocked)} // Button is enabled when there are no events or all events are locked
        float="right"
      >
        Add New Event
      </Button>

      <Header title="List of Events"></Header>

      <TableContainer>
        <Table variant="striped" size="md" mt="1">
          <Thead>
            <Tr>
              <CustomTh>Event Name</CustomTh>
              <CustomTh>Event Date</CustomTh>
              <CustomTh>Edit certificate details</CustomTh>
              <CustomTh>Edit participant details</CustomTh>
              <CustomTh>Total Certificates</CustomTh>
              <CustomTh>Certificates Issued</CustomTh>
              <CustomTh>Lock Status</CustomTh>
            </Tr>
          </Thead>
          <Tbody>
            {table.map((event) => (
              <Tr key={event._id}>
                <Td>
                  <Center>{event.name}</Center>
                </Td>
                <Td>
                  <Center>
                    {new Date(event.ExpiryDate).toLocaleDateString('en-GB')}
                  </Center>
                </Td>
                {!event.lock ? (
                  <Td>
                    <Center>
                      <CustomLink href={`http://${domainName}/cm/${event._id}`}>
                        {event.name} Certificates
                      </CustomLink>
                    </Center>
                  </Td>
                ) : (
                  <Td>
                    <Center>Certificates Locked</Center>
                  </Td>
                )}
                <Td>
                  {!event.lock ? (
                    <Center>
                      <CustomLink
                        href={`http://${domainName}/cm/${event._id}/addparticipant`}
                      >
                        {event.name} participants
                      </CustomLink>
                    </Center>
                  ) : (
                    <Center>Participants Locked</Center>
                  )}
                </Td>
                <Td>
                  <Center>{event.totalCertificates}</Center>
                </Td>
                <Td>
                  <Center>{event.certificatesIssued}</Center>
                </Td>
                <Td>
                  <Center>
                    {!event.lock ? (
                      <CustomTealButton
                        onClick={() => lockEvent(event._id)}
                        disabled={isEventLocked}
                      >
                        Lock The Event
                      </CustomTealButton>
                    ) : (
                      <span>
                        Locked on{' '}
                        {new Date(event.updated_at).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </Center>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {loading && <p>Loading...</p>}
    </Container>
  );
}

export default CMDashboard;
