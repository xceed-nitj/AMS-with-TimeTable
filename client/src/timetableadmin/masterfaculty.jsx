import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';

import { CustomTh, CustomLink, CustomBlueButton, CustomDeleteButton } from '../styles/customStyles';
import { Box, Center, Button, Container, Input, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import Header from '../components/header';
import { Parser } from '@json2csv/plainjs/index.js';

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [isAddFacultyFormVisible, setIsAddFacultyFormVisible] = useState(false);
  const [editedData, setEditedData] = useState({
    facultyID: '',
    name: '',
    designation: '',
    dept: '',
    email: '',
    extension: '',
    type: '',
  });
  const apiUrl = getEnvironment();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(`${apiUrl}/timetablemodule/faculty`, { credentials: 'include' }) // Replace with the actual endpoint
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setTableData(data.reverse());
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      fetch(`${apiUrl}/upload/faculty`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
        .then((response) => response.json())
        .then(() => {
          fetchData();
          setSelectedFile(null);
        })
        .catch((error) => console.error('Error:', error));
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };

  const handleEditClick = (_id) => {
    setEditRowId(_id);

    // Find the row with the specified _id and set its data to the "editedData" state
    const editedRow = tableData.find((row) => row._id === _id);
    if (editedRow) {
      setEditedData({ ...editedRow });
    }
  };

  const handleSaveEdit = () => {
    // Make a PUT request to update the data for the selected row
    if (editRowId) {
      // Find the index of the row with the specified _id in the tableData array
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
              throw new Error(
                `Error: ${response.status} - ${response.statusText}`
              );
            }
            return response.json();
          })
          .then((data) => {
            console.log('Update Success:', data);
            setTableData(updatedData);
            setEditRowId(null);
            setEditedData({
              _id: null, // Clear the edited data
              facultyID: '',
              name: '',
              designation: '',
              dept: '',
              email: '',
              extension: '',
              type: '',
            });
          })
          .catch((error) => {
            console.error('Update Error:', error);
          });
      }
    }
  };

  // ...

  const handleDelete = (_id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this entry?'
    );

    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/faculty/${_id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
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

  // ...

  const handleCancelAddFaculty = () => {
    setIsAddFacultyFormVisible(false);
  };

  const handleAddFaculty = () => {
    setEditedData({
      facultyID: '',
      name: '',
      designation: '',
      dept: '',
      email: '',
      extension: '',
      type: '',
    });
    setIsAddFacultyFormVisible(true);
  };

  const handleSaveNewFaculty = () => {
    const isDuplicate = tableData.some((row) => row.name === editedData.name);

    if (
      !editedData.facultyID ||
      !editedData.name ||
      !editedData.dept ||
      !editedData.email ||
      !editedData.designation
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    if (isDuplicate) {
      alert(
        'Faculty with the same name already exists. Please enter a unique name.'
      );
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

  const downloadCSV = () => {
    const visibleColumns = [
      { label: 'Faculty ID', key: 'facultyID' },
      { label: 'Name', key: 'name' },
      { label: 'Designation', key: 'designation' },
      { label: 'Department', key: 'dept' },
      { label: 'Type', key: 'type' },
      { label: 'Email', key: 'email' },
      { label: 'Extension', key: 'extension' }
    ];
    
    const csvData = tableData.map(item => {
      const filteredItem = {};
      for(let x in visibleColumns) filteredItem[visibleColumns[x].label] = item[visibleColumns[x].key]
      return filteredItem;
    });

    const parser = new Parser({ fields: visibleColumns.map(c => (c.label)) });
    const csv = parser.parse(csvData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'MasterFaculty-XCEED.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Container maxW="7xl">
      {/* <h1>Master Faculty </h1> */}
      <Header title="Master Faculty"></Header>
      <Text as="b">Batch Upload :</Text>
      <Input
        mt="1"
        py="1"
        px="2"
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        name="csvFile"
      />
      <Box display="flex" justifyContent="space-between" px="0">
        <CustomBlueButton mt="1" ml="1" onClick={handleUpload}>
          Upload Xlsx
        </CustomBlueButton>
        <FileDownloadButton
          fileUrl="/faculty_template.xlsx"
          fileName="faculty_template.xlsx"
        />
      </Box>
      <Box>
        {isAddFacultyFormVisible ? (
          <Box>
            <Box>
              <Text mb='1' >Faculty ID: <span>*</span> </Text>
              <Input
                mb='2'
                type="text"
                value={editedData.facultyID}
                onChange={(e) =>
                  setEditedData({ ...editedData, facultyID: e.target.value })
                }
              />
            </Box>
            <Box>
              <Text mb='1' >Name: <span>*</span></Text>
              <Input
                mb='2'
                type="text"
                value={editedData.name}
                onChange={(e) =>
                  setEditedData({ ...editedData, name: e.target.value })
                }
              />
            </Box>
            <Box>
              <Text mb='1'>Designation: <span>*</span></Text>
              <Input
                mb='2'
                type="text"
                value={editedData.designation}
                onChange={(e) =>
                  setEditedData({ ...editedData, designation: e.target.value })
                }
              />
            </Box>
            <Box>
              <Text mb='1'>Dept: <span>*</span></Text>
              <Input
               mb='2'
                type="text"
                value={editedData.dept}
                onChange={(e) =>
                  setEditedData({ ...editedData, dept: e.target.value })
                }
              />
            </Box>
            <Box>
              <Text mb='1'>Type: </Text>
              <Input
                mb='2'
                type="text"
                value={editedData.type}
                onChange={(e) =>
                  setEditedData({ ...editedData, type: e.target.value })
                }
              />
            </Box>
            <Box>
              <Text mb='1'>Email: </Text>
              <Input 
                mb='2'
                type="text"
                value={editedData.email}
                onChange={(e) =>
                  setEditedData({ ...editedData, email: e.target.value })
                }
              />
            </Box>
            <Box>
              <Text mb='1'>Extension: </Text>
              <Input
                
                type="text"
                value={editedData.extension}
                onChange={(e) =>
                  setEditedData({ ...editedData, extension: e.target.value })
                }
              />
            </Box>
            <Box mt='-2' display='flex' justifyContent='space-between'>
              <CustomBlueButton ml='1' onClick={handleSaveNewFaculty}>
                Save New Faculty
              </CustomBlueButton>
              <CustomBlueButton mr='0' onClick={handleCancelAddFaculty}>
                Cancel
              </CustomBlueButton>
            </Box>
          </Box>
        ) : (
          <CustomBlueButton ml='1' mt='-1' onClick={handleAddFaculty}>
            Add Faculty
          </CustomBlueButton>
        )}
      </Box>

      <Text mb='1' ml='1' as='b'>Table of Faculty Data (Total Entries: {tableData.length}):</Text>
      <Center><Button colorScheme='blue' onClick={downloadCSV}>Download in CSV</Button></Center>
      <TableContainer>
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
              <Th><Center>Action</Center></Th>
            </Tr>
          </Thead>
          <Tbody>
            {tableData.map((row) => (
              <Tr key={row._id}>
                <Td>
                  <Center>
                {editRowId === row._id ? (
                    <Input
                      type="text"
                      value={editedData.facultyID}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          facultyID: e.target.value,
                        })
                      }
                    />
                  ) : (
                    row.facultyID
                  )}
                </Center>
                </Td>
                <Td><Center>
                {editRowId === row._id ? (
                    <input
                      type="text"
                      value={editedData.name}
                      onChange={(e) =>
                        setEditedData({ ...editedData, name: e.target.value })
                      }
                    />
                  ) : (
                    row.name
                  )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRowId === row._id ? (
                      <Input
                        type="text"
                        value={editedData.designation}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            designation: e.target.value,
                          })
                        }
                      />
                    ) : (
                      row.designation
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRowId === row._id ? (
                      <Input
                        type="text"
                        value={editedData.dept}
                        onChange={(e) =>
                          setEditedData({ ...editedData, dept: e.target.value })
                        }
                      />
                    ) : (
                      row.dept
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRowId === row._id ? (
                      <Input
                        type="text"
                        value={editedData.type}
                        onChange={(e) =>
                          setEditedData({ ...editedData, type: e.target.value })
                        }
                      />
                    ) : (
                      row.type
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRowId === row._id ? (
                      <Input
                        type="text"
                        value={editedData.email}
                        onChange={(e) =>
                          setEditedData({ ...editedData, email: e.target.value })
                        }
                      />
                    ) : (
                      row.email
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRowId === row._id ? (
                      <Input
                        type="text"
                        value={editedData.extension}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            extension: e.target.value,
                          })
                        }
                      />
                    ) : (
                      row.extension
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRowId === row._id ? (
                      <CustomBlueButton onClick={handleSaveEdit}>
                        Save
                      </CustomBlueButton>
                    ) : (
                      <>
                        <CustomBlueButton onClick={() => handleEditClick(row._id)}>
                          Edit
                        </CustomBlueButton>
                        <CustomDeleteButton onClick={() => handleDelete(row._id)}>
                          Delete
                        </CustomDeleteButton>
                      </>
                    )}
                </Center>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Subject;
