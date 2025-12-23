import React, { useState, useEffect } from 'react';
import { 
  Button, VStack, Input, Heading, Table, Thead, Tbody, Tr, Th, Td, 
  Container, Select, Box, Text, Flex, Link as ChakraLink, Tag 
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  CustomBlueButton,
  CustomDeleteButton,
  CustomTealButton,
} from "../styles/customStyles";

const AdminPage = () => {
  const [formData, setFormData] = useState({ session: '' });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionValue, setEditingSessionValue] = useState('');
  
  // These two work together: sessions is the list of strings, 
  // currentSessionName is the specific string that gets the tag.
  const [sessions, setSessions] = useState([]); 
  const [currentSessionName, setCurrentSessionName] = useState(""); 
  
  const [selectedSession, setSelectedSession] = useState("");
  const [sessionsWithTT, setSessionsWithTT] = useState([]);
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchSessions();
    fetchSessionsWithTT();
    fetchCurrentStatus();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment/session`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data); // data is ["2025-2026", "2024-2025"]
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment/current-status`, { 
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        // data.currentSession is a string like "2025-2026"
        
        setCurrentSessionName(data.currentSession); 
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const handleSetCurrentSession = async (session) => {
    if (!session) {
      alert("Please select a session first.");
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment/set-current-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session }),
        credentials: 'include',
      });
      if (response.ok) {
        alert(`Session "${session}" is now the current session.`);
        setCurrentSessionName(session); // Update the state so the tag moves immediately
      }
    } catch (error) {
      console.error('Error setting current session:', error.message);
    }
  };

  const handleDelete = async (session) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to delete session "${session}"?`);
      if (!confirmed) return;
      const response = await fetch(`${apiUrl}/timetablemodule/allotment/session/${session}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setSessions(prev => prev.filter(item => item !== session));
      }
    } catch (error) {
      console.error('Error deleting:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (response.ok) {
        await fetchSessions();
        setFormData({ session: '' });
      }
    } catch (error) {
      console.error('Error creating:', error.message);
    }
  };

  const handleEdit = (session) => {
    setEditingSessionId(session);
    setEditingSessionValue(session);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment/session/${editingSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: editingSessionValue }),
        credentials: 'include',
      });
      if (response.ok) {
        setSessions(prev => prev.map(item => item === editingSessionId ? editingSessionValue : item));
        // If we renamed the current session, update the tag state too
        if (editingSessionId === currentSessionName) {
          setCurrentSessionName(editingSessionValue);
        }
        setEditingSessionId(null);
      }
    } catch (error) {
      console.error('Error editing:', error.message);
    }
  };

  const fetchSessionsWithTT = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSessionsWithTT(data.uniqueSessions.map(s => s.session));
      }
    } catch (error) {
      console.error("Error fetching TT sessions:", error);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Container maxW="5xl">
        <Header title="Timetable Admin Page" />
        
        <Flex wrap="wrap" justify="center" gap={4} mt={4}>
          {[
            { path: "/tt/mastersem", label: "Master Sem", bg: "blue.500" },
            { path: "/tt/masterfaculty", label: "Master Faculty", bg: "green.500" },
            { path: "/tt/masterroom", label: "Master Room", bg: "orange.500" },
            { path: "/tt/masterdelete", label: "Admin Delete Page", bg: "red.500" },
            { path: "/tt/allotment", label: "Room Allotment", bg: "purple.500" },
            { path: "/tt/admin/adminview", label: "Edit Any Department Timetable", bg: "gray.500" },
            { path: "/tt/viewinstituteload", label: "View Departwise Load", bg: "pink.500" },
            { path: "/tt/messages" , label:"Messages", bg:"yellow.400" }
          ].map(({ path, label, bg }) => (
            <ChakraLink as={Link} to={path} key={path} bg={bg} color="white" px={4} py={2} minW="180px" textAlign="center" borderRadius="md" _hover={{ bg: "gray.600" }}>
              {label}
            </ChakraLink>
          ))}
        </Flex>

        <Heading textAlign="center" mt={6} mb={4}>Create New Session</Heading>
        <form onSubmit={handleSubmit}>
          <Flex gap={2}>
            <Input
              type="text"
              name="session"
              value={formData.session}
              onChange={(e) => setFormData({ session: e.target.value })}
              placeholder="Enter New Session"
            />
            <Button type="submit" colorScheme="teal">Create Session</Button>
          </Flex>
        </form>

        <Table variant="striped" mt={8}>
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
                  <Flex align="center" gap={2}>
                    {editingSessionId === session ? (
                      <Input value={editingSessionValue} onChange={(e) => setEditingSessionValue(e.target.value)} />
                    ) : (
                      <Text fontWeight={session.trim() === currentSessionName.trim() ? "bold" : "normal"}>
                        {session}
                      </Text>
                    )}
                    {/* The "Current" tag appears if the session string matches currentSessionName */}
                    {session.trim() === currentSessionName.trim() && (
                      <Tag size="sm" colorScheme="green" variant="solid" borderRadius="full">
                        current
                      </Tag>
                    )}
                  </Flex>
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

      <Container maxW="5xl">
        <Heading size="md" mt={10}>Mark a Session as Current</Heading>
        <Flex mt={4} gap={4} align="center">
          <Select
            placeholder="Select a session"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            width="300px"
          >
            {sessionsWithTT.map((session, index) => (
              <option key={index} value={session}>{session}</option>
            ))}
          </Select>
          <Button colorScheme="teal" onClick={() => handleSetCurrentSession(selectedSession)}>
            Mark as Current
          </Button>
        </Flex>
      </Container>
    </VStack>
  );
};

export default AdminPage;