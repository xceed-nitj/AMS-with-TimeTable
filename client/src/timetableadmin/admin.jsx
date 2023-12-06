import React, { useState } from 'react';
import { Button, VStack, Input, Heading } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import getEnvironment from '../getenvironment';

const AdminPage = () => {
  const [formData, setFormData] = useState({
    session: '',
  });

  const apiUrl = getEnvironment();

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

      console.log('Allotment created successfully');
      setFormData({
        session: '',
      });
    } catch (error) {
      console.error('Error creating allotment:', error.message);
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
      <Link to="/tt/allotment">
        <Button colorScheme="teal">Institute Faculty load </Button>
      </Link>

    </VStack>
  );
};

export default AdminPage;
