import React, { useState, useEffect } from 'react';
import { Button, VStack, Input, Heading, Table, Thead, Tbody, Tr, Th, Td, Container ,Select} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
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
  


  return (
    <VStack spacing={4} align="stretch">
<Container maxW="5xl">

    <Header title="Timetable Admin page"></Header>
    <div>
      <Link to="/tt/mastersem" style={{ backgroundColor: 'blue', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>Master Sem</button>
      </Link>
      <Link to="/tt/masterfaculty" style={{ backgroundColor: 'green', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>Master Faculty</button>
      </Link>
      <Link to="/tt/masterroom" style={{ backgroundColor: 'orange', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>Master Room</button>
      </Link>
      <Link to="/tt/masterdelete" style={{ backgroundColor: 'red', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>Admin Delete Page</button>
      </Link>
      <Link to="/tt/allotment" style={{ backgroundColor: 'purple', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>Room Allotment</button>
      </Link>
      <Link to="/tt/admin/adminview" style={{ backgroundColor: 'gray', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>Edit any time table</button>
      </Link>
      <Link to="/tt/admin/instituteload" style={{ backgroundColor: 'gray', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>Calculate Departwise load distribution</button>
      </Link>
      <Link to="/tt/viewinstituteload" style={{ backgroundColor: 'brown', margin: '10px', padding: '10px', display: 'inline-block' }}>
        <button>View Departwise load distribution</button>
      </Link>
    </div>
    
    <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
      <Heading>Create New Session</Heading>
    </div>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          name="session"
          value={formData.session}
          onChange={handleChange}
          placeholder="Enter New Session"
        />
        <Button type="submit" colorScheme="teal">
          Create Session
        </Button>
      </form>


      <Table variant="striped">
  <Thead>
    <Tr>
      <Th>Session</Th>
      <Th>Edit</Th>
      <Th>Delete</Th>
      <Th>Make current</Th>
    </Tr>
  </Thead>
  <Tbody>
  {sessions.map((session, index) => (  
  <Tr key={index}>
    <Td>
      {editingSessionId === session ? (
        <Input
          type='text'
          value={editingSessionValue}
          onChange={handleChange1}
        />
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
    <Td>
      {sessionsWithTT.includes(session) ? (
        (
          <CustomBlueButton onClick={() => handleSetCurrentSession(session)}>Make Current</CustomBlueButton>
        )
      ) :("N/A") }
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

</Container>


    </VStack>
);
};

export default AdminPage;
