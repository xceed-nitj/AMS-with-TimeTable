import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { AbsoluteCenter, Box, Center, Circle, Container, FormControl, FormLabel, Heading,Input, Select, Text } from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomBlueButton} from '../styles/customStyles'
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";


function SuccessMessage({ message }) {
  return (
    <div className="success-message">
      {message}
    </div>
  );
}

function AddSemComponent() {
  const [sems, setSems] = useState([]);
  const [newSem, setNewSem] = useState(''); 
  const [successMessage, setSuccessMessage] = useState('');
 
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchSemData();
   }, []);


  const fetchSemData = () => {
    fetch(`${apiUrl}/timetablemodule/addSem`)
      .then(handleResponse)
      .then((data) => {
        const filteredSem = data.filter((sem) => sem.code === currentCode);
        setSems(filteredSem);
      })
      .catch(handleError);
  };

  const handleResponse = (response) => {
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  };

  const handleError = (error) => {
    console.error('Error:', error);
  };

  const handleSubmit = () => {
    const dataToSave = {
      sem: newSem,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/addSem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    })
      .then(handleResponse)
      .then((data) => {
        console.log('Data saved successfully:', data);
        setSuccessMessage('Semester added successfully!');
        fetchSemData();
      })
      .catch(handleError);
  };

  const handleSemInputChange = (e) => {
    setNewSem(e.target.value);
  };

  const handleDelete = (semId) => {
    fetch(`${apiUrl}/timetablemodule/addSem/${semId}`, {
      method: 'DELETE',
    })
      .then(handleResponse)
      .then(() => {
        console.log('Sem deleted successfully');
        fetchSemData();
      })
      .catch(handleError);
  };

  return (
    <Container maxW='5xl'>
      <div>
      <Heading as="h1" size="xl" mt='6' mb='6'>
        Add Semester
      </Heading>
          <SuccessMessage message={successMessage} />
        <Box>
          <FormControl mb='5'>
            <Text as='b'>
              Sem
            </Text>
            <Box display='flex' mt='1'>
              <Select placeholder='Select Semester' w='80%'>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
                <option>7</option>
                <option>8</option>
              </Select>
              <Button mt='0' ml='16' bg='teal' color='white' onClick={handleSubmit}>Add Sem</Button>
            </Box>
          </FormControl>
        </Box>
        <TableContainer>
          <Box>
            <Text as='b'>Sem Data</Text>
            <Table
            variant='striped'
            maxWidth='80%'
            size='md'
            mt='1'
            >
              <Thead>
                <Tr>
                  <Th><Center>Sem</Center></Th>
                  <Th><Center>Actions</Center></Th>
                </Tr>
              </Thead>
              <Tbody>
                {sems.map((sem) => (
                  <Tr key={sem._id} h='20' w='20'>
                      <Td><Center>{sem.sem}</Center></Td>
                    <Td><Center>
                      <Button bg='teal' color='white' onClick={() => handleDelete(sem._id)}>Delete</Button>
                    </Center></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </TableContainer>
      </div>
    </Container>
  );
}

export default AddSemComponent;
