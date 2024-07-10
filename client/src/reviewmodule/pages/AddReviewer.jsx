import React, { useState , useEffect} from 'react';
import { Container, Box, Input, Button , Table, Thead, Tbody, Tr, Th, Td,Text } from '@chakra-ui/react';
import { IconButton, Heading, chakra } from '@chakra-ui/react';
import axios from 'axios';
import getEnvironment from '../../getenvironment';
import { useToast, Spinner } from '@chakra-ui/react';
import Header from '../../components/header';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// import { addReviewer } from '../../../../server/src/modules/reviewModule/controller/event';

function AddReviewer() {
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewerPassword, setReviewerPassword] = useState('');
  const [reviewers, setReviewers] = useState();
  const toast = useToast();

  useEffect(() => {
    // Fetch the list of reviewers in the event
    const fetchReviewers = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getReviewerInEvent/${eventId}`);
        setReviewers(response.data);
        console.log(response.data)

       } catch (error) {
        console.error('Error fetching reviewers:', error);
      }
    };

    fetchReviewers();
  }, [apiUrl, eventId]);

  const handleReviewerEmailChange = (e) => {
    setReviewerEmail(e.target.value);
  };
  const handleReviewerPasswordChange = (e) => {
    setReviewerPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const baseUrl = window.location.origin;

    try {
      const addReviewerResponse = await axios.post(`${apiUrl}/reviewmodule/event/addReviewer/${eventId}`, { 
        email: reviewerEmail,
        baseUrl
      });

      if (addReviewerResponse) {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getReviewerInEvent/${eventId}`);
        setReviewers(response.data);
        console.log(response.data)
        toast({
          title: 'Reviewer Invited successfully',
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
        title: error.response.data,
        description: 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  const handleResendInvitation = async (email) => {
    const baseUrl = window.location.origin;
    try {
        await axios.post(`${apiUrl}/reviewmodule/event/resendInvitation/${eventId}`, {
            email: email,
        baseUrl
      });
      toast({
        title: 'Invitation resent successfully',
        status: 'success',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error resending invitation',
        description: 'Please try again later',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  const HeaderAddReviewer = ({ title }) => {
    const navigate = useNavigate();
    
    return (
      <Heading mr='1' ml='1'  display='flex' >
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
        <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2' >
          {title}
        </chakra.div>
      </Heading>
    );
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


  return (
    <Container maxWidth='100%'>
      <br />
      <Box display="flex" justifyContent="center" mt={4} >
      <Box  bg="black" p={0.2} width='80%'>
        <HeaderAddReviewer  color="white" textAlign="center" title="Add Reviewers"/>
      </Box>
      </Box>
      <br />
      <br />
        <form onSubmit={handleSubmit}>
        <Box display="flex" justifyContent="center" mb={4}>
          <Input
            mb={4}
            type="email"
            placeholder="Enter reviewer email to add to event"
            value={reviewerEmail}
            onChange={handleReviewerEmailChange}
            maxWidth={{ base: "60%", md: "20%" }}
          />
      </Box>
      <Box display="flex" justifyContent="center">
        <Button type="submit" colorScheme="teal" height={'40px'} >
          Save
        </Button>
      </Box>
      <br />
      </form>


      <p style={{textAlign:'center',margin:'10px',fontWeight:'bold',fontSize:'24px'}}>Existing Reviewers</p>

      { reviewers && (reviewers.length>0 ? (
        <>
        <Box display="flex" justifyContent="center" mt={8}>
        <Box width="80%" overflowX="auto" >
        <Table variant="striped" maxWidth="100%">
          <Thead>
            <Tr>
              <Th fontSize="sm" textAlign="center">Name</Th>
              <Th fontSize="sm" textAlign="center">Email</Th>
              <Th fontSize="sm" textAlign="center">Status</Th>
              <Th fontSize="sm" textAlign="center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {reviewers.map((reviewer, index) => (
              <Tr key={index}>
                <Td textAlign="center">{reviewer.name}</Td>
                <Td textAlign="center">{reviewer.email}</Td>
                <Td textAlign="center">
                    <Box bg={getStatusColor(reviewer.status)} p={2} borderRadius="md">
                      <Text color="white">{getStatusText(reviewer.status)}</Text>
                    </Box>
                  </Td>
                <Td textAlign="center">
                  <Button
                    onClick={() => handleResendInvitation(reviewer.email)}
                    colorScheme="blue"
                    size="sm"
                  >
                    Resend Invitation
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
        </>
      ):(
        <Box mt={8} textAlign="center" fontSize="lg" fontWeight="bold">
          No reviewers found...
        </Box>
      ))}

      
      {
        !reviewers && (
          <>
            <Box mt={8} textAlign="center" fontSize="lg" fontWeight="bold">
              <Spinner/>
            </Box>
          </>
        )
      }
        <br />
        <br />
    </Container>
  );
}

export default AddReviewer;
