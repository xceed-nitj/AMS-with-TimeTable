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
      });
      
      // console.log("Response status:", response.status);
       
      if (response.ok) {
        const data = await response.json();
      // console.log(data)
        setTable(data);

        if (data.length > 0) {
          const lastEventLocked = data[data.length - 1].lock;
          console.log("Is last event locked:", lastEventLocked);
          setEventLocked(lastEventLocked);
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
        credentials:'include',
        body: JSON.stringify({ lock: true }),
      });

   // Check if the request was successful (you may need to handle other status codes)
   if (response.ok) {
    // Update the state to reflect that the event is locked
        setEventLocked(true);
        toast({
          title: 'Event Locked',
          description: 'The event has been locked successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position:'middle',
        });
        console.log('Event locked successfully!');
      } else {
        console.error('Failed to lock the event');
      }
    } catch (error) {
      console.error('Error locking the event:', error);
    }
  };

  useEffect(() => {
    console.log("Fetching events with apiUrl:", apiUrl);
    fetchEvents();
  }, [apiUrl, isEventLocked]);

  const handleAddEvent = () => {
    navigate("/cm/useraddevent");
  };

  const currentUrl = window.location.href;
  const urlParts = currentUrl.split("/");
  const domainName = urlParts[2];

  return (
    <Container maxW='7xl'>
      <Header title="List of Events"></Header>
      {isEventLocked && (
        <Button colorScheme="teal" onClick={handleAddEvent} mb={4}>
          Add New Event
        </Button>
      )}
      <TableContainer>
        <Table 
        variant='striped'
         size="md"
          mt="1"
          >
          <Thead>
            <Tr>
              <CustomTh>Event Name</CustomTh>
              <CustomTh>Event Date</CustomTh>
              {/* <CustomTh>Department/Club</CustomTh> */}
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
                <Td><Center>{event.name}</Center></Td>
                <Td><Center>{new Date(event.ExpiryDate).toLocaleDateString('en-GB')}</Center></Td>
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
                      // target="_blank" // Optional: If you want to open the link in a new tab
                      >
                        {event.name} participants
                      </CustomLink>
                    </Center>
                  ) : (
                    <Center>Participants Locked</Center>
                  )}
                </Td>
                <Td><Center>{event.totalCertificates}</Center></Td>
                <Td><Center>{event.certificatesIssued}</Center></Td>
                <Td>
                  <center>
                    {!event.lock ? (
                      <CustomTealButton onClick={() => lockEvent(event._id)} disabled={isEventLocked}>
                        Lock The Event
                      </CustomTealButton>
                    ) : (
                      <span>Locked on {new Date(event.updated_at).toLocaleDateString('en-GB')}</span>
                    )}
                  </center>
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
