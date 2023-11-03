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
import { useToast } from '@chakra-ui/react';


// function SuccessMessage({ message }) {
//   return (
//     <div className="success-message">
//       {message}
//     </div>
//   );
// }

function AddSemComponent() {
  const toast = useToast()
  const [sems, setSems] = useState([]);
  const [newSem, setNewSem] = useState(''); 
  // const [successMessage, setSuccessMessage] = useState('');
 
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

        // setSuccessMessage('Semester added successfully!');
        toast({
          title: 'Semester added',
          description: "Semester added successfully!",
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
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

  // useEffect(()=>{

  //   setTimeout(()=>{
  //     setSuccessMessage('')
  //   }, 1500)

  // }, [successMessage])

  return (
    <Container maxW='4xl'>
      <Heading as="h1" size="xl" mt='6' mb='6'>
        Add Semester
      </Heading>
        <Box>
          <FormControl mb='5'>
            <Text as='b'>
              Sem
            </Text>
            <Box display='flex' justifyContent='space-between'>
              <Select
               onChange={(e)=>{
                setNewSem(e.target.value)
               }}
              placeholder='Select Semester' w='80%'>
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
            maxWidth='100%'
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
                      <Td><Center><Text
                        fontSize='lg'
                        fontWeight='medium'
                      >{sem.sem}</Text></Center></Td>
                    <Td><Center>
                      <Button bg='teal' color='white' onClick={() => handleDelete(sem._id)}>Delete</Button>
                    </Center></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </TableContainer>
    </Container>
  );
}

export default AddSemComponent;
