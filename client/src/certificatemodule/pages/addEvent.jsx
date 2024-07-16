import React, { useEffect, useState } from 'react';
import getEnvironment from "../../getenvironment";
import {
  Container,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { Button } from "@chakra-ui/button";
import { useToast } from "@chakra-ui/react";
import Header from "../../components/header";

const UserEventRegistration = () => {
  const toast = useToast();
  const apiUrl = getEnvironment();
  const [events, setEvents] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    ExpiryDate: '',
    plan: 'basic', // default plan
  });

  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        const response = await fetch(`${apiUrl}/certificatemodule/addevent/getevents`, { credentials: 'include' });
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchUserEvents();
  }, [apiUrl]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`${apiUrl}/certificatemodule/addevent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      console.log(formData)
  
      const responseData = await response.json();
      console.log('Response Data:', responseData);
  
      if (response.ok) {
        toast({
          title: "Event Added",
          description: "Event created successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        console.error('Error submitting form:', responseData.error || response.statusText);
        toast({
          title: "Error",
          description: responseData.error || "Failed to add event",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to add event",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  

  return (
    <Container maxW="lg">
      <Header title="Add Event for Certificate Module"></Header>
      <form onSubmit={handleSubmit}>
        <FormControl mb="4">
          <FormLabel>Event Name</FormLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl mb="4">
          <FormLabel>Event Date</FormLabel>
          <Input
            type="date"
            name="ExpiryDate"
            value={formData.ExpiryDate}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl mb="4">
          <FormLabel>Plan</FormLabel>
          <Select
            name="plan"
            value={formData.plan}
            onChange={handleChange}
          >
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </Select>
        </FormControl>

        <Button type="submit">Submit</Button>
      </form>

      <Table variant="simple" mt="4">
        <Thead>
          <Tr>
            <Th>Event Name</Th>
            <Th>Expiry Date</Th>
            <Th>Plan</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map((event) => (
            <Tr key={event._id}>
              <Td>{event.name}</Td>
              <Td>{new Date(event.ExpiryDate).toLocaleDateString('en-GB')}</Td>
              <Td>{event.plan}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Container>
  );
};

export default UserEventRegistration;
