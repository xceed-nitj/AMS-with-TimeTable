import React, { useState, useEffect } from 'react';
import { Button, VStack, Input, Heading, Table, Thead, Tbody, Tr, Th, Td, Container } from '@chakra-ui/react';
// import { Link } from 'react-router-dom';
import { Flex, Link as ChakraLink } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomDeleteButton,
  CustomTealButton,
} from "../styles/customStyles";



const AdminPage = () => {
  const [formData, setFormData] = useState({
    session: '',
  });

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionValue, setEditingSessionValue] = useState('');
  const [sessions, setSessions] = useState([]);
  const apiUrl = getEnvironment();

  useEffect(() => {
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
          credentials: 'include'
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Sessions fetched successfully:", data); 
        setSessions(data);
      } else {
        console.error("Failed to fetch sessions");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleDelete = async (session) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to delete session "${session}"?`);
      if (!confirmed) {
        return; 
      }
  
      const response = await fetch(`${apiUrl}/timetablemodule/allotment/session/${session}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setSessions(prevSessions => prevSessions.filter(item => item !== session));
    } catch (error) {
      console.error('Error deleting allotment:', error.message);
    }
  };
  
    
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // console.log('Allotment created successfully');
      await fetchSessions();
      setFormData({
        session: '',
      });
    } catch (error) {
      console.error('Error creating allotment:', error.message);
    }
  };

  const handleEdit = (session) => {
    setEditingSessionId(session);
    setEditingSessionValue(session);
  };
  
  const handleChange1 = (e) => {
    setEditingSessionValue(e.target.value);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment/session/${editingSessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session: editingSessionValue }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setSessions(prevSessions => prevSessions.map(item => item === editingSessionId ? editingSessionValue : item));
      setEditingSessionId(null);
      setEditingSessionValue('');
    } catch (error) {
      console.error('Error editing allotment:', error.message);
    }
  };
  return (
    <VStack spacing={4} align="stretch">
      <Container maxW="5xl">
        <Header title="Timetable Admin Page" />
        
        {/* Navigation Buttons */}
        <Flex wrap="wrap" justify="center" gap={4} mt={4}>
          {[
            { path: "/tt/mastersem", label: "Master Sem", bg: "blue.500" },
            { path: "/tt/masterfaculty", label: "Master Faculty", bg: "green.500" },
            { path: "/tt/masterroom", label: "Master Room", bg: "orange.500" },
            { path: "/tt/masterdelete", label: "Admin Delete Page", bg: "red.500" },
            { path: "/tt/allotment", label: "Room Allotment", bg: "purple.500" },
            { path: "/tt/admin/adminview", label: "Edit Any Department Timetable", bg: "gray.500" },
            // { path: "/tt/admin/instituteload", label: "Calculate Departwise Load", bg: "gray.700" },
            { path: "/tt/viewinstituteload", label: "View Departwise Load", bg: "pink.500" }
          ].map(({ path, label, bg }) => (
            <ChakraLink
              as={Link}
              to={path}
              key={path}
              bg={bg}
              color="white"
              px={4}
              py={2}
              minW="180px"
              textAlign="center"
              borderRadius="md"
              _hover={{ bg: "gray.600" }}
            >
              {label}
            </ChakraLink>
          ))}
        </Flex>

        {/* Create New Session */}
        <Heading textAlign="center" mt={6} mb={4}>Create New Session</Heading>
        <form onSubmit={handleSubmit}>
          <Flex gap={2}>
            <Input
              type="text"
              name="session"
              value={formData.session}
              onChange={handleChange}
              placeholder="Enter New Session"
            />
            <Button type="submit" colorScheme="teal">Create Session</Button>
          </Flex>
        </form>

        {/* Session Table */}
        <Table variant="striped" mt={6}>
          <Thead>
            <Tr>
              <Th>Session</Th>
              <Th>Edit</Th>
              <Th>Delete</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sessions.map((session, index) => (
              <Tr key={index}>
                <Td>
                  {editingSessionId === session ? (
                    <Input type="text" value={editingSessionValue} onChange={handleChange1} />
                  ) : (
                    session
                  )}
                </Td>
                <Td>
                  {editingSessionId === session ? (
                    <Button onClick={handleSave}>Save</Button>
                  ) : (
                    <CustomTealButton onClick={() => handleEdit(session)}>Edit</CustomTealButton>
                  )}
                </Td>
                <Td>
                  <CustomDeleteButton onClick={() => handleDelete(session)}>Delete</CustomDeleteButton>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Container>
    </VStack>
  );
};

export default AdminPage;
