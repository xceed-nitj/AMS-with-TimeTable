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
  Link,
} from '@chakra-ui/react';
import axios from 'axios';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from '@chakra-ui/react';

function Invitations() {
  const apiUrl = getEnvironment();
  const [events, setEvents] = useState([]);
  const [reviewers,setReviewer] = useState([]);
  const toast = useToast();

  const fetchEvents = async () => {
    try {

      const User = await fetch(`${apiUrl}/user/getuser`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const userdetails = await User.json();
      const id = userdetails.user._id;

      const response = await fetch(`${apiUrl}/reviewmodule/event/geteventsbyreviewer/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        for(let i=0; i<data.length; i++) {
          let n = data[i].reviewer.length;
          for(let j=0;j<n;j++){
            if(data[i].reviewer[j].user === id){
              data[i].reviewer = data[i].reviewer[j];
              break;
            }
          }
        }
        console.log(data);
        setEvents(data);
      } else {
        console.error("Failed to fetch Invitations");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  useEffect(() => {
    console.log("Fetching events with apiUrl:", apiUrl);
    fetchEvents();
  }, [apiUrl]);

  const handleAccept = async (eventId,userId)=>{
    try{
      const res = await axios.post(`${apiUrl}/reviewmodule/event/updateReviewerStatus/${eventId}/${userId}`,{status : 'Accepted'});
      if(res){
        console.log("Action performed successfully");
        toast({
          title: 'Accepted successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
        window.location.reload();
      } else {
        toast({
          title: 'Error accepting Invitation as api path is wrong',
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
  }

  const handleReject = async (eventId,userId)=>{
    try{
      const res = await axios.post(`${apiUrl}/reviewmodule/event/updateReviewerStatus/${eventId}/${userId}`,{status : 'Not Accepted'});
      if(res){
        console.log("Action performed successfully");
        toast({
          title: 'Accepted successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
        window.location.reload();
      } else {
        toast({
          title: 'Error accepting Invitation as api path is wrong',
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
  }

  return (
    <Container>
      <Header title="Invitations List" />

      <Box maxW="xl" mx="auto" mt={10}>
        <h1>Invitations</h1>
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
              <Tr>
                <Td>{event.name}</Td>
                <Td>{event.reviewer.status}</Td>
                {(event.reviewer.status !== 'Accepted' && event.reviewer.status!=='Not Accepted') && (
                  <>
                    <Td><Button  onClick={()=>handleAccept(event._id,event.reviewer.user)}>Accept</Button></Td>
                    <Td><Button  onClick={()=>handleReject(event._id,event.reviewer.user)}>Reject</Button></Td>
                  </>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}

export default Invitations;
