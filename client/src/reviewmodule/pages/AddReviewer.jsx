import React, { useState , useEffect} from 'react';
import { Container, Box, Input, Button , Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import axios from 'axios';
import getEnvironment from '../../getenvironment';
import { useToast } from '@chakra-ui/react';
import Header from '../../components/header';
import { useParams } from 'react-router-dom';

function AddReviewer() {
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewers, setReviewers] = useState([]);
  const toast = useToast();

  useEffect(() => {
    // Fetch the list of reviewers in the event
    const fetchReviewers = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getReviewerInEvent/${eventId}`);
        setReviewers(response.data);
      } catch (error) {
        console.error('Error fetching reviewers:', error);
      }
    };

    fetchReviewers();
  }, [apiUrl, eventId]);

  const handleReviewerEmailChange = (e) => {
    setReviewerEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Adding reviewer to the event
      console.log(eventId);
      const addReviewerResponse = await axios.post(`${apiUrl}/reviewmodule/event/addReviewer/${eventId}`, { email: reviewerEmail });

      if (addReviewerResponse.status === 200) {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getReviewerInEvent/${eventId}`);
      setReviewers(response.data);
        toast({
          title: 'Reviewer added successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
        // setReviewers(prevReviewers => [...prevReviewers, { email: reviewerEmail }]); // Assuming you're only adding the email here
      } else {
        toast({
          title: 'Error adding Reviewer as api path is wrong',
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
        title: 'Error adding Reviewer ',
        description: 'Please try again later',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  
  return (
    <Container>
      <Header title="Add Reviewer to the event" />

      <Box maxW="md" mx="auto" mt={10}>
        <form onSubmit={handleSubmit}>
          <Input
            mb={4}
            type="email"
            placeholder="Enter reviewer email to add to event "
            value={reviewerEmail}
            onChange={handleReviewerEmailChange}
          />
          <Button type="submit" colorScheme="teal">
            Save
          </Button>
        </form>
        
        <h1> Existing Reviewers</h1>
        <Table variant="simple" mt={8}>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
            </Tr>
          </Thead>
          <Tbody>
            {reviewers.map((reviewer, index) => (
              <Tr key={index}>
                <Td>{reviewer.name}</Td>
                <Td>{reviewer.email}</Td>
                
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}

export default AddReviewer;
