import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Container, Box, Text } from '@chakra-ui/react';
import axios from 'axios';
import getEnvironment from '../../getenvironment';
import { useToast } from '@chakra-ui/react';
import Header from '../../components/header';

function UpdateReviewerStatus() {
  const apiUrl = getEnvironment();
  const { eventId, reviewerId } = useParams();
  
  const toast = useToast();
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/${eventId}`);
        setEventName(response.data.name);
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast({
          title: 'Error fetching event details',
          description: error.response ? error.response.data : 'Unknown error occurred',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    };

    fetchEventDetails();
  }, [eventId, apiUrl, toast]);

  const updateStatus = async (status) => {
    try {
      await axios.post(`${apiUrl}/reviewmodule/event/updateReviewerStatus/${eventId}/${reviewerId}`, { status });
      toast({
        title: 'Reviewer status updated successfully',
        status: 'success',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
      window.location.href = `${window.location.origin}/prm/login`;
    } catch (error) {
      console.error('Error updating reviewer status:', error);
      toast({
        title: 'Error updating reviewer status',
        description: error.response ? error.response.data : 'Unknown error occurred',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  return (
    <Container>
      <Header title="Update Reviewer Status" />
      <Box maxW="xl" mx="auto" mt={10} textAlign="center">
        {eventName ? (
          <Box mb={6}>
            <Text fontSize="2xl" fontWeight="bold">{eventName}</Text>
          </Box>
        ) : (
          <Text>Loading event details...</Text>
        )}
        <Button
          onClick={() => updateStatus('Accepted')}
          colorScheme="green"
          size="lg"
          mr={4}
        >
          Accept
        </Button>
        <Button
          onClick={() => updateStatus('Not Accepted')}
          colorScheme="red"
          size="lg"
        >
          Reject
        </Button>
      </Box>
    </Container>
  );
}

export default UpdateReviewerStatus;
