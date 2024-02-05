import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { AbsoluteCenter, Box, Center, Circle, Container, FormControl, FormLabel, Heading,Input, Select, Text } from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomBlueButton, CustomTealButton, CustomDeleteButton} from '../styles/customStyles'
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
import Header from '../components/header';


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
  const [dept, setDepartment] = useState('');
  const [semestersFromMasterSem, setSemestersFromMasterSem] = useState([]);
  // const [successMessage, setSuccessMessage] = useState('');
 
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchDepartmentData();
    fetchSemData(); // Fetch semesters from the database when the component mounts
  }, []);

  useEffect(() => {
    if (dept) {
      fetchSemestersFromMasterSem();
    }
  }, [dept]);

  const fetchDepartmentData = () => {
    fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        setDepartment(data[0].dept);
      })
      .catch(handleError);
  };

  const fetchSemestersFromMasterSem = () => {
    fetch(`${apiUrl}/timetablemodule/mastersem/dept/${dept}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        const semesters = data.map((item) => item.sem);
        setSemestersFromMasterSem(semesters);
      })
      .catch(handleError);
  };


  const fetchSemData = () => {
    fetch(`${apiUrl}/timetablemodule/addSem`,{credentials: 'include'})
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
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {

        // setSuccessMessage('Semester added successfully!');
        toast({
          position: 'top',
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
    const isConfirmed = window.confirm('Are you sure you want to delete this semester?');
  
    if (isConfirmed) {
      fetch(`${apiUrl}/timetablemodule/addSem/${semId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then(handleResponse)
        .then(() => {
          fetchSemData();
        })
        .catch(handleError);
    }
  };
  

  // useEffect(()=>{

  //   setTimeout(()=>{
  //     setSuccessMessage('')
  //   }, 1500)

  // }, [successMessage])
  
  return (
    <Container maxW='4xl'>
      {/* <Heading as="h1" size="xl" mt='6' mb='6'>
        Add Semester
      </Heading> */}
      <Header title='Add Semester' />
        <Box>
          <FormControl mb='5'>
            <Text as='b'>
              Sem
            </Text>
            <Box display='flex' justifyContent='space-between'>
            
            <Select
              onChange={handleSemInputChange}
              value={newSem}
              placeholder="Select Semester"
              w="80%"
            >
              {semestersFromMasterSem.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </Select>
              <CustomTealButton mt='0' ml='16' onClick={handleSubmit}>Add Sem</CustomTealButton>
            </Box>
          </FormControl>
        </Box>
        <TableContainer>
          <Box>
            <Text as='b'>Sem Data(Total Entries: {sems.length}):</Text>
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
                      <CustomDeleteButton onClick={() => handleDelete(sem._id)}>Delete</CustomDeleteButton>
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