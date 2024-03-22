import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';

import { CustomTh, CustomLink, CustomBlueButton, CustomDeleteButton } from '../styles/customStyles';
import { Box, Center, Container, FormControl, FormLabel, Input, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import Header from '../components/header';

function Subject() {
  const [tableData, setTableData] = useState([]);
  const [timetableData, setTimeTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [isAddFacultyFormVisible, setIsAddFacultyFormVisible] = useState(false);
  const [department, setDepartment] = useState('');
  const [editedData, setEditedData] = useState({
    facultyID: '',
    name: '',
    designation: '',
    dept: '',
    email: '',
    extension: '',
    type: '',
    order: '',
  });
  const apiUrl = getEnvironment();

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const fetchData = async () => {
    try {
      const timetableResponse = await fetch(`${apiUrl}/timetablemodule/timetable`, { credentials: 'include' });
      if (!timetableResponse.ok) {
        throw new Error(`Error: ${timetableResponse.status} - ${timetableResponse.statusText}`);
      }
      const timetableData = await timetableResponse.json();

      const filteredData = timetableData.filter((row) => row.code === currentCode);
      setTimeTableData(filteredData);

      if (filteredData.length > 0) {
        setDepartment(filteredData[0].dept);
      }

      const facultyResponse = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { credentials: 'include' });
      if (!facultyResponse.ok) {
        throw new Error(`Error: ${facultyResponse.status} - ${facultyResponse.statusText}`);
      }
      const facultyData = await facultyResponse.json();
      
      setTableData(facultyData.reverse());
    } catch (error) {
      console.error('Error:', error);
    }
  };
  fetchData();

  useEffect(() => {
  }, [currentCode, department]);


  const handleEditClick = (_id) => {
    setEditRowId(_id);

    const editedRow = tableData.find((row) => row._id === _id);
    if (editedRow) {
      setEditedData({ ...editedRow });
    }
  };

  const handleSaveEdit = () => {
    if (editRowId) {
      const rowIndex = tableData.findIndex((row) => row._id === editRowId);
      if (rowIndex !== -1) {
        const updatedData = [...tableData];
        updatedData[rowIndex] = editedData;

        fetch(`${apiUrl}/timetablemodule/faculty/${editRowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editedData),
          credentials: 'include',
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log('Update Success:', data);
            setTableData(updatedData);
            setEditRowId(null);
            setEditedData({
              _id: null,
              facultyID: '',
              name: '',
              designation: '',
              dept: '',
              email: '',
              extension: '',
              type: '',
              order: '',
            });
          })
          .catch((error) => {
            console.error('Update Error:', error);
          });
      }
    }
  };

  const handleDelete = (_id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this entry?');

    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/faculty/${_id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('Delete Success:', data);
          const updatedData = tableData.filter((row) => row._id !== _id);
          setTableData(updatedData);
        })
        .catch((error) => {
          console.error('Delete Error:', error);
        });
    }
  };

  const handleCancelAddFaculty = () => {
    setIsAddFacultyFormVisible(false);
  };

  const handleAddFaculty = () => {
    setEditedData({
      facultyID: '',
      name: '',
      designation: '',
      dept: department,
      email: '',
      extension: '',
      type: '',
      order: '',
    });
    setIsAddFacultyFormVisible(true);
  };


  const handleSaveNewFaculty = () => {
    const isDuplicate = tableData.some((row) => row.name === editedData.name);

    if (!editedData.facultyID || !editedData.name || !editedData.dept || !editedData.email || !editedData.designation) {
      alert('Please fill in all required fields.');
      return;
    }

    if (isDuplicate) {
      alert('Faculty with the same name already exists. Please enter a unique name.');
    } else {
      fetch(`${apiUrl}/timetablemodule/faculty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
        credentials: 'include',
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Data saved successfully:', data);
          fetchData();
          handleCancelAddFaculty();
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  };

  return (
    <Container maxW='6xl' mb='10'>
      <Header title='Edit Department Faculty Details'></Header>

      <Box>
        {isAddFacultyFormVisible ? (
          <Box>
              <FormControl isRequired >
                  <FormLabel mb='0' htmlFor="facultyID">Faculty ID : </FormLabel>
                  <Input
                    mb='2'
                    type="text"
                    id="facultyID"
                    value={editedData.facultyID}
                    onChange={(e) => setEditedData({ ...editedData, facultyID: e.target.value })}
                  />
              </FormControl>
            <FormControl isRequired>
              <FormLabel mb='0' htmlFor="name" >Name : </FormLabel>
              <Input
                mb='2'
                type="text"
                id="name"
                value={editedData.name}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel mb='0' htmlFor="designation" >Designation : </FormLabel>
              <Input
                mb='2'
                type="text"
                id="designation"
                value={editedData.designation}
                onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel mb='0' htmlFor="dept" >Dept : </FormLabel>
              <Input
                mb='2'
                type="text"
                id="dept"
                value={editedData.dept}
                onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })}
                disabled
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="type">Type : </FormLabel>
              <Input
                mb='2'
                type="text"
                id="type"
                value={editedData.type}
                onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="email">Email : </FormLabel>
              <Input
                mb='2'
                type="text"
                id="email"
                value={editedData.email}
                onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="extension">Extension : </FormLabel>
              <Input
                mb='2'
                type="text"
                id="extension"
                value={editedData.extension}
                onChange={(e) => setEditedData({ ...editedData, extension: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel mb='0' htmlFor="extension" >Order : </FormLabel>
              <Input
                type="text"
                id="extension"
                value={editedData.order}
                placeholder="Enter number"
                onChange={(e) => setEditedData({ ...editedData, order: e.target.value })}
              />
            </FormControl>
            <Box mt='-1' display='flex' justifyContent='space-between'>
              <CustomBlueButton ml='1' onClick={handleSaveNewFaculty}>Save New Faculty</CustomBlueButton>
              <CustomBlueButton mr='1' onClick={handleCancelAddFaculty}>Cancel</CustomBlueButton>
            </Box>

          </Box>
        ) : (
          <CustomBlueButton ml='0' onClick={handleAddFaculty}>Add Faculty</CustomBlueButton>
        )}
      </Box>



      <TableContainer>
        <Box>
          <Text as='b'>Table of Faculty Data (Total Entries: {tableData.length}) :</Text>
          <Table
            variant='striped'
            maxWidth='100%'
            size='md'
            mt='1'
          >
            <Thead>
              <Tr>
                <Th><Center>FacultyID</Center></Th>
                <Th><Center>Name</Center></Th>
                <Th><Center>Designation</Center></Th>
                <Th><Center>Dept</Center></Th>
                <Th><Center>Type</Center></Th>
                <Th><Center>Email</Center></Th>
                <Th><Center>Extension</Center></Th>
                <Th><Center>Order</Center></Th>
                <Th><Center>Action</Center></Th>
              </Tr>
            </Thead>
            <Tbody>
              {tableData.map((row) => (
                <Tr key={row._id}>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.facultyID} onChange={(e) => setEditedData({ ...editedData, facultyID: e.target.value })} /> : row.facultyID}</Center></Td>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.name} onChange={(e) => setEditedData({ ...editedData, name: e.target.value })} /> : row.name}</Center></Td>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.designation} onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })} /> : row.designation}</Center></Td>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.dept} onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })} /> : row.dept}</Center></Td>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.type} onChange={(e) => setEditedData({ ...editedData, type: e.target.value })} /> : row.type}</Center></Td>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.email} onChange={(e) => setEditedData({ ...editedData, email: e.target.value })} /> : row.email}</Center></Td>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.extension} onChange={(e) => setEditedData({ ...editedData, extension: e.target.value })} /> : row.extension}</Center></Td>
                  <Td><Center>{editRowId === row._id ? <input type="text" value={editedData.order} onChange={(e) => setEditedData({ ...editedData, order: e.target.value })} /> : row.order}</Center></Td>
                  <Td><Center>
                    
                      {editRowId === row._id ? (
                        <CustomBlueButton onClick={handleSaveEdit}>Save</CustomBlueButton>
                      ) : (
                        <>
                          <CustomBlueButton onClick={() => handleEditClick(row._id)}>Edit</CustomBlueButton>
                          <CustomDeleteButton onClick={() => handleDelete(row._id)}>Delete</CustomDeleteButton>
                        </>
                      )}
                  </Center>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </TableContainer>
    </Container>
  );
}

export default Subject;