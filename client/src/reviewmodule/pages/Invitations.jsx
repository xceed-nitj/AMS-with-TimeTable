import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Heading,
  IconButton,
  chakra,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../../getenvironment';

function Invitations() {
  const apiUrl = getEnvironment();
  const [events, setEvents] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const userResponse = await fetch(`${apiUrl}/user/getuser`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const userDetails = await userResponse.json();
      const userId = userDetails.user._id;

      const response = await fetch(`${apiUrl}/reviewmodule/event/geteventsbyreviewer/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map(event => {
          const reviewer = event.reviewer.find(r => r.user === userId);
          return { ...event, reviewer };
        });
        setEvents(processedData);
      } else {
        console.error("Failed to fetch Invitations");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAccept = async (eventId, userId) => {
    try {
      const res = await axios.post(`${apiUrl}/reviewmodule/event/updateReviewerStatus/${eventId}/${userId}`, { status: 'Accepted' });
      if (res.status === 200) {
        toast({
          title: 'Accepted successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
        fetchEvents();
      } else {
        toast({
          title: 'Error accepting Invitation',
          description: 'Please try again later',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data || 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  const handleReject = async (eventId, userId) => {
    try {
      const res = await axios.post(`${apiUrl}/reviewmodule/event/updateReviewerStatus/${eventId}/${userId}`, { status: 'Not Accepted' });
      if (res.status === 200) {
        toast({
          title: 'Rejected successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
        fetchEvents();
      } else {
        toast({
          title: 'Error rejecting Invitation',
          description: 'Please try again later',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data || 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted':
        return 'green.400';
      case 'Invited':
        return 'yellow.400';
      case 'Not Accepted':
        return 'red.400';
      default:
        return 'gray.200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Accepted':
        return 'Accepted';
      case 'Invited':
        return 'Invited';
      case 'Not Accepted':
        return 'Not Accepted';
      default:
        return 'Unknown';
    }
  };

  const HeaderInvitations = ({ title }) => (
    <Heading mr='1' ml='1' display='flex'>
      <IconButton
        mb='1'
        variant='ghost'
        onClick={() => navigate(-1)}
        _hover={{ bgColor: 'transparent' }}
      >
        <chakra.svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='white'
          className='w-6 h-6'
          _hover={{ stroke: '#00BFFF' }}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </chakra.svg>
      </IconButton>
      <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2'>
        {title}
      </chakra.div>
    </Heading>
  );

  return (
    <Container maxWidth="100%">
      <br />
      <Box display="flex" justifyContent="center" mt={4}>
        <Box bg="black" p={0.2} width='80%'>
          <HeaderInvitations title="Invitations" />
        </Box>
      </Box>
      <br />

      <Box maxW="80%" mx="auto" mt={10}>
        <Table variant="simple" mt={8}>
          <Thead>
            <Tr>
              <Th>Event Name</Th>
              <Th>Status</Th>
              <Th colSpan={2}>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.map((event) => (
              <Tr key={event._id}>
                <Td>{event.name}</Td>
                <Td textAlign="center">
                    <Box bg={getStatusColor(event.reviewer.status)} p={2} borderRadius="md">
                      <Text color="white">{getStatusText(event.reviewer.status)}</Text>
                    </Box>
                  </Td>
                <Td colSpan={2}>
                  {event.reviewer.status === 'Invited' ? (
                    <>
                      <Button
                        onClick={() => handleAccept(event._id, event.reviewer.user)}
                        colorScheme="green"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleReject(event._id, event.reviewer.user)}
                        colorScheme="red"
                        ml={2}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Text>No action required</Text>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}

export default Invitations;
