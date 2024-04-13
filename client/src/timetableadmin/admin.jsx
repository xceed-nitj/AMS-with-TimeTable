import React, { useState, useEffect } from 'react';
import { Button, VStack, Input, Heading, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import getEnvironment from '../getenvironment';

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
    <Heading>Admin page</Heading>

      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          name="session"
          value={formData.session}
          onChange={handleChange}
          placeholder="Enter New Session"
        />
        <Button type="submit" colorScheme="teal">
          Create Allotment
        </Button>
      </form>

      <Link to="/tt/mastersem">
        <Button colorScheme="teal">Go to Master Sem</Button>
      </Link>
      <Link to="/tt/masterfaculty">
        <Button colorScheme="teal">Go to Master Faculty</Button>
      </Link>
      <Link to="/tt/masterroom">
        <Button colorScheme="teal">Go to Master Room</Button>
      </Link>
      <Link to="/tt/masterdelete">
        <Button colorScheme="teal">Go to admin delete page</Button>
      </Link>
      <Link to="/tt/allotment">
        <Button colorScheme="teal">Go Room Allotment</Button>
      </Link>
      <Link to="/tt/admin/instituteload">
        <Button colorScheme="teal">Institute Faculty load </Button>
      </Link>

      <Table variant="striped">
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
        <Button onClick={() => handleEdit(session)}>Edit</Button>
      )}
    </Td>
    <Td>
      <Button onClick={() => handleDelete(session)}>Delete</Button>
    </Td>
  </Tr>
))}

</Tbody>
</Table>
    </VStack>
  );
};

export default AdminPage;
