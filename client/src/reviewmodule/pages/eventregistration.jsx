import React, { useEffect, useState, useRef } from 'react';
import getEnvironment from "../../getenvironment";
import axios from 'axios';
import {
  Container,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  List,
  ListItem,
} from '@chakra-ui/react';
import { Button } from "@chakra-ui/button";
import { useToast } from "@chakra-ui/react";
import Header from "../../components/header";

const PRMEventRegistration = () => {
  const toast = useToast();
  const apiUrl = getEnvironment();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    editor: '',
  });
  const [filter, setFilter] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/v1/reviewmodule/event/getAllEvents`, { withCredentials: true });
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Error",
          description: `Failed to fetch events: ${error.message}`,
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    };

    fetchAllEvents();
  }, [apiUrl, toast]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (filter.trim() !== "") {
        try {
          const response = await axios.get(`${apiUrl}/api/v1/reviewmodule/user/getusermail?filter=${filter}`, { withCredentials: true });
          console.log('Fetched users response:', response.data);  // Check the structure here
          const fetchedUsers = response.data || [];
          setUsers(fetchedUsers); // Ensure we always set an array
          setShowDropdown(true);
          if (fetchedUsers.length === 0) {
            toast({
              title: "No Users Found",
              description: `No users found for "${filter}"`,
              status: "info",
              duration: 2000,
              isClosable: true,
            });
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          setUsers([]); // Set to empty array on error
          setShowDropdown(false);
          toast({
            title: "Error",
            description: "Failed to fetch users.",
            status: "error",
            duration: 2000,
            isClosable: true,
          });
        }
      } else {
        setUsers([]);
        setShowDropdown(false);
      }
    };

    fetchUsers();
  }, [filter, apiUrl, toast]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleChange = (e) => {
    if (e.target.name === 'editor') {
      console.log("Setting filter to:", e.target.value);
      setFilter(e.target.value);
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectUser = (email) => {
    setFormData({
      ...formData,
      editor: email,  // Set the editor directly to the email string
    });
    setFilter(email);  // Set the filter to the selected email to update the input field
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.editor) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/api/v1/reviewmodule/event/addevent`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      if (response.status === 200) {
        const responseData = response.data;
        toast({
          title: "Event Added",
          description: "Event assigned to the selected user",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setFormData({ name: '', editor: '' });
        setFilter('');
        setEvents([...events, responseData]);
      } else {
        throw new Error(`Failed to add event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: `Failed to add event: ${error.message}`,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="4xl">
      <Header title="Assign Editors to the Conference" />
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
          <Box position="relative" ref={dropdownRef}>
            <Input
              name="editor"
              value={filter}  // Ensure the input value is set to the filter state
              onChange={handleChange}
              placeholder="Type to search for an editor"
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
              <List
                position="absolute"
                zIndex="1"
                bg="white"
                width="100%"
                border="1px solid"
                borderColor="gray.200"
                maxHeight="200px"
                overflowY="auto"
                boxShadow="md"
              >
                {users.length > 0 ? (
                  users.map((email, index) => (
                    <ListItem
                      key={index}  // Use index as key since email strings might not be unique
                      p={2}
                      cursor="pointer"
                      _hover={{ bg: "gray.100" }}
                      onClick={() => handleSelectUser(email)}  // Pass email directly
                    >
                      {email}
                    </ListItem>
                  ))
                ) : (
                  <ListItem p={2}>No matching users found</ListItem>
                )}
              </List>
            )}
          </Box>
        </FormControl>

        <Box display="flex" justifyContent="center">
          <Button type="submit" isLoading={isSubmitting}>Submit</Button>
        </Box>
        <br />
      </form>
      <Box display="flex" justifyContent="space-between" mt="4">
    <Button onClick={() => window.location.href = `${window.location.origin}/prm/DefaultQuestionHome`}>
      Go to Default Question Home
    </Button>
    <Button onClick={() => window.location.href = `${window.location.origin}/prm/editdefaulttemplate`}>
      Go to Edit Default Template
    </Button>
  </Box>

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