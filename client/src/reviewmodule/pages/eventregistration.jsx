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


const PRMEventRegistration = () => {
  const toast = useToast();
  const apiUrl = getEnvironment();
  const [events, setEvents]=useState([]);

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    editor: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/getuser/all`, { credentials: 'include' });
        const data = await response.json();
        setUsers(data.user);
        // console.log(data)
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    const fetchAllEvents = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/reviewmodule/event/getAllEvents`, 
        {
        method: 'GET',
         credentials: 'include' });
        const data = await response.json();
        setEvents(data);
        console.log(data)
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchUsers();
    fetchAllEvents();

  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        // const response = await fetch(`${apiUrl}/user/getuser/all`, );
     
        // Make POST request to your backend API
      const response = await fetch(`${apiUrl}/api/v1/reviewmodule/event/addevent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(formData),
      });
console.log(formData)
      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData);
                toast({
          title: "Event Added",
          description: "Event assigned to the selected user",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
     
      } else {
        console.error('Error submitting form:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Container maxW="4xl">
        <Header title="Assign Editors to the Conference"></Header>
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
          <FormLabel>Editor</FormLabel>
          <Select
            name="editor"
            value={formData.editor}
            onChange={handleChange}
          >
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.email}
              </option>
            ))}
          </Select>
        </FormControl>

        <Button type="submit">Submit</Button>
      </form>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Event Name</Th>
            <Th>Editor</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map((event) => (
            <Tr key={event._id}>
              <Td>{event.name}</Td>
              <Td>{event.editor[0]?.email}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

    </Container>
  );
};

export default PRMEventRegistration;
