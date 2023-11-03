import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { Box, Center, Container, Heading, Input, Select, Text } from '@chakra-ui/react';
import { CustomTh, CustomLink, CustomBlueButton } from '../styles/customStyles';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/table';
import { Button } from '@chakra-ui/button';

function SuccessMessage({ message }) {
  return (
    <div className="success-message">{message}</div>
  );
}

function Component() {
  const [sem, setSem] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [facultyData, setFacultyData] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  const [editFacultyData] = useState({
    facultyId: null,
    facultyName: '',
  });

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/addsem/sem/${currentCode}`)
      .then(handleResponse)
      .then((data) => {
        setAvailableSemesters(data);
      })
      .catch(handleError);
  }, [currentCode]);

  useEffect(() => {
    fetchFacultyData();
    fetchAvailableDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`)
        .then(handleResponse)
        .then((data) => {
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  const fetchFacultyData = () => {
    fetch(`${apiUrl}/timetablemodule/addFaculty`)
      .then(handleResponse)
      .then((data) => {
        const filteredFacultyData = data.filter(
          (faculty) => faculty.code === currentCode
        );
        setFacultyData(filteredFacultyData);
      })
      .catch(handleError);
  };

  const fetchAvailableDepartments = () => {
    fetch(`${apiUrl}/timetablemodule/faculty/dept`)
      .then(handleResponse)
      .then((data) => {
        const formattedDepartments = data.map((department) => ({
          value: department,
          label: department,
        }));
        setAvailableDepartments(formattedDepartments);
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

  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setSelectedDepartment(selectedDepartment);
  };

  const handleSubmit = () => {
    const dataToSave = {
      sem: sem,
      code: currentCode,
      faculty: selectedFaculty,
    };

    fetch(`${apiUrl}/timetablemodule/addFaculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    })
      .then(handleResponse)
      .then((data) => {
        setSuccessMessage('Data saved successfully!');
        fetchFacultyData();
      })
      .catch(handleError);
  };

  const handleDelete = (facultyId, facultyName) => {
    const facultyToDelete = facultyData.find((faculty) => faculty._id === facultyId);

    if (facultyToDelete) {
      const updatedFaculty = facultyToDelete.faculty.filter(
        (name) => name !== facultyName
      );
      facultyToDelete.faculty = updatedFaculty;

      fetch(`${apiUrl}/timetablemodule/addFaculty/${facultyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facultyToDelete),
      })
        .then(handleResponse)
        .then(() => {
          fetchFacultyData();
        })
        .catch(handleError);
    }
  };

  return (
    <Container maxW='5xl' >
      
        <Heading as="h1" size="xl" mt='6' mb='6'>Add Faculty</Heading>
        <SuccessMessage message={successMessage} />
        <Box mt='1'>
          <Box mb='2.5'>
            <Text as='b'>
              Semester:
              <Select value={sem} onChange={(e) => setSem(e.target.value)}>
                <option value="" disabled>
                  Select Semester
                </option>
                {availableSemesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </Select>
            </Text>
          </Box>
          <Box mb='2.5'>
            <Text as='b'>
              Department:
              <Select value={selectedDepartment} onChange={handleDepartmentChange}>
                <option value="">Select a Department</option>
                {availableDepartments.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </Select>
            </Text>
          </Box>
          <Box mb='2.5'>
            <Text as='b'>
              Faculty:
              <Select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
              >
                <option value="" key="default">
                  Select a Faculty
                </option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.name}>
                    {faculty.name}
                  </option>
                ))}
              </Select>
            </Text>
          </Box>
          <Button ml='0' mb='3' bg='teal' color='white' onClick={handleSubmit}>Submit</Button>
        </Box>
        <div>
          <TableContainer>
            <Text as='b'>Faculty Data</Text>
            <Table
            variant={'striped'}
            mt='1'
            >
              <Thead>
                <Tr>
                  <Th><Center>Semester</Center></Th>
                  <Th><Center>Faculty</Center></Th>
                  <Th><Center>Actions</Center></Th>
                </Tr>
              </Thead>
              <Tbody>
                {facultyData.map((faculty) =>
                  faculty.faculty.map((individualFaculty, index) => (
                    <Tr key={`${faculty._id}-${index}`}>
                      <Td><Center>{faculty.sem}</Center></Td>
                      <Td><Center>{individualFaculty}</Center></Td>
                      <Td><Center>
                        <Button bg='teal' color='white'
                          onClick={() =>
                            handleDelete(faculty._id, individualFaculty)
                          }
                        >
                          Delete
                        </Button>
                      </Center></Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </div>
    </Container>
    
  );
}

export default Component;
