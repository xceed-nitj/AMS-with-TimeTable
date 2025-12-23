import React, { useState, useEffect } from 'react';
import { Button, VStack, Input, Heading, Table, Thead, Tbody,Textarea ,Tr, Th, Td, Container ,Select, Box,Text} from '@chakra-ui/react';
import { Flex, Link as ChakraLink } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionValue, setEditingSessionValue] = useState('');
  const [sessions, setSessions] = useState([]);
  const apiUrl = getEnvironment();
  const [selectedSession, setSelectedSession] = useState("");
  const [sessionsWithTT, setSessionsWithTT] = useState([]);

  useEffect(() => {
    fetchSessions();
    fetchSessionsWithTT();
  }, []);

    


  //this function fetch all the sessions in the database no matter if it has a timetable or not.
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


  //this function fetch all the sessions having at least one timetable to it
  const fetchSessionsWithTT = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // console.log(data)
      const { uniqueSessions, uniqueDept } = data;

      setSessionsWithTT(uniqueSessions.map(s => s.session));
      


    } catch (error) {
      console.error("Error fetching existing timetable data:", error);
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
     setSessions(prev => prev.filter(item => item.session !== session));
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: editingSessionValue }),
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Network response was not ok');

    // Step C: Map through objects and update the 'session' string for the specific ID
    setSessions(prevSessions => prevSessions.map(item => 
      item.session === editingSessionId ? { ...item, session: editingSessionValue } : item
    ));

    setEditingSessionId(null);
    setEditingSessionValue('');
  } catch (error) {
    console.error('Error editing allotment:', error.message);
  }
};

  //handels the setting of current session and make a request to /timetable/set-current-session and gives an alert message
  const handleSetCurrentSession = async (session) => {
    if (!session) {
      alert("Please select a session first.");
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/set-current-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session }),
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to update current session');
      }
  
      alert(`Session "${session}" is now the current session.`);
    } catch (error) {
      console.error('Error setting current session:', error.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
  
    if (!messageTitle.trim() || !messageContent.trim()) {
      alert("Title and content cannot be empty.");
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/message/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: messageTitle,
          content: messageContent,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
  
      alert("Message sent successfully.");
      setMessageTitle('');
      setMessageContent('');
    } catch (error) {
      console.error("Error sending message:", error.message);
      alert("Something went wrong.");
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
            { path: "/tt/viewinstituteload", label: "View Departwise Load", bg: "pink.500" },
            { path: "/tt/messages" , label:"Messages", bg:"yellow.400" }
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


      <Table variant="striped">
  <Thead>
  <Tr>
    <Th>Session</Th>
    <Th>Edit</Th>
    <Th>Delete</Th>
    {/* REMOVED: <Th>Make current</Th> */}
  </Tr>
</Thead>
<Tbody>
  {sessions.map((sessionObj, index) => (
    <Tr key={index}>
      {/* 1. Session Name Column with 'current' tag */}
      <Td>
        <Flex align="center">
          <Text fontWeight="medium">
            {editingSessionId === sessionObj.session ? (
              <Input 
                size="sm"
                value={editingSessionValue} 
                onChange={handleChange1} 
              />
            ) : (
              sessionObj.session
            )}
          </Text>

          {/* Tag Logic */}
          {sessionObj.isCurrent && (
            <Box 
              ml={3} 
              px={2} 
              py={0.5} 
              bg="green.500" 
              color="white" 
              borderRadius="full" 
              fontSize="xs" 
              fontWeight="bold"
            >
              current
            </Box>
          )}
        </Flex>
      </Td>

      {/* 2. Restored Edit Column */}
      <Td>
        {editingSessionId === sessionObj.session ? (
          <Button size="sm" colorScheme="blue" onClick={handleSave}>Save</Button>
        ) : (
          <CustomTealButton onClick={() => handleEdit(sessionObj.session)}>Edit</CustomTealButton>
        )}
      </Td>

      {/* 3. Restored Delete Column */}
      <Td>
        <CustomDeleteButton onClick={() => handleDelete(sessionObj.session)}>Delete</CustomDeleteButton>
      </Td>
    </Tr>
  ))}
</Tbody>
</Table>
</Container>


<Container maxW="5xl">
<Heading  size="md">Mark a Session as Current</Heading>

<Select
  placeholder="Select a session"
  value={selectedSession}
  onChange={(e) => setSelectedSession(e.target.value)}
  width="300px"
>
  {sessionsWithTT.map((session, index) => (
    <option key={index} value={session}>
      {session}
    </option>
  ))}
</Select>

<Button type='submit' colorScheme="teal" onClick={() => handleSetCurrentSession(selectedSession)}>
  {console.log(selectedSession)}
  Mark as Current
</Button>

{/* <Heading textAlign="center" mt={10} mb={4}>Send Message to Dept. TT Coordinators</Heading>
<form onSubmit={handleSendMessage}>
  <VStack spacing={3} align="start">
    <Input
      type="text"
      placeholder="Enter message title"
      value={messageTitle}
      onChange={(e) => setMessageTitle(e.target.value)}
    />

    <Box width="100%" border="1px solid #CBD5E0" borderRadius="md" p={2}>
      <ReactQuill
        theme="snow"
        value={messageContent}
        onChange={setMessageContent}
        modules={{
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean'],
            [{ align: [] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }, { size: [] }],
          ]
        }}
        formats={['bold', 'italic', 'underline', 'list', 'bullet', 'align', 'color', 'background', 'font', 'size']}
      />
      <Text fontSize="sm" color="red.500" mt={2}>*Editing the message is not possible once sent</Text>
    </Box>

    <Button type="submit" colorScheme="blue">Send Message</Button>
  </VStack>
</form> */}


</Container>


    </VStack>
);
};

export default AdminPage;
