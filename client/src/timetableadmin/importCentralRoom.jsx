import React, { useState, useEffect } from 'react';
import { FormControl, FormLabel, Select, Input, Button, VStack,Container, Text } from '@chakra-ui/react';
import getEnvironment from "../getenvironment";
import { useToast } from "@chakra-ui/react";
import Header from '../components/header';



function ImportForm() {
  const [fromSession, setFromSession] = useState('');
  const [toSession, setToSession] = useState('');
  const [sessions, setSessions] = useState([]);
  const [apiUrl] = useState(getEnvironment());
  const toast = useToast();


  useEffect(() => {
    // Fetch sessions on component mount
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment/session`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error("Failed to fetch sessions");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/import/centralallotment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromSession, toSession }),
        credentials: "include",
      });
    //   if (!response.ok) {
    //     throw new Error('Failed to submit session');
    //   }
      if (response.ok) {
        // HTTP status code 200-299 indicates success
        // Refresh sessions after successful submission
        toast({
          position: 'bottom',
          title: "Allotment Imported Successfully! Go back to the allotment page",
          status: "success",
          duration: 50000,
          isClosable: true,
        });
        console.log(response)
}    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container maxW='5xl'>
<Header title="Import central room allotment"></Header>
<form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl id="fromSession" isRequired>
        <FormLabel>Session:</FormLabel>
          <Select
            name="session"
            value={fromSession}
            onChange={(e) => setFromSession(e.target.value)}
          >
            <option value="">Select a Session</option>
            {sessions.map((session, index) => (
              <option key={index} value={session}>
                {session}
              </option>
            ))}
          </Select>
       
        </FormControl>
        <FormControl id="toSession" isRequired>
        <FormLabel>To Session:</FormLabel>
          <Select
            name="session"
            value={toSession}
            onChange={(e) => setToSession(e.target.value)}
          >
            <option value="">Select a Session</option>
            {sessions.map((session, index) => (
              <option key={index} value={session}>
                {session}
              </option>
            ))}
          </Select>
       
        </FormControl>
        <Button type="submit" colorScheme="blue">Submit</Button>
      </VStack>
    </form>
    </Container>
  );
}

export default ImportForm;
