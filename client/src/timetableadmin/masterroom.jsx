import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';

import { CustomTh, CustomLink, CustomBlueButton, CustomTealButton, CustomDeleteButton } from '../styles/customStyles';
import { Box, Center, Container, FormControl, FormLabel, Input, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import Header from '../components/header';

function MasterRoom() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [masterRooms, setMasterRooms] = useState([]);
  const [editedRoom, setEditedRoom] = useState({
    room: '',
    type: '',
    building: '',
    floor: '',
    dept: '',
    landMark: '',
    imageUrl: '',
  });
  const [editRoomId, setEditRoomId] = useState(null);
  const [isAddRoomFormVisible, setIsAddRoomFormVisible] = useState(false);

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchMasterRooms();
  }, []);


  const fetchMasterRooms = () => {
    fetch(`${apiUrl}/timetablemodule/masterroom`, {credentials: 'include'})
      .then((response) => response.json())
      .then((data) => setMasterRooms(data.reverse()))
      .catch((error) => console.error('Error:', error));
  };
  
  const handleAddRoom = () => {
    setEditedRoom({
      room: '',
      type: '',
      building: '',
      floor: '',
      dept: '',
      landMark: '',
      imageUrl: '',
    });
    setIsAddRoomFormVisible(true);
  };

  const handleCancelAddRoom = () => {
    setIsAddRoomFormVisible(false);
  };

  const handleSaveNewRoom = () => {
    // Check if required fields are filled
    const requiredFields = ['room', 'type', 'building'];
    const missingFields = requiredFields.filter((field) => !editedRoom[field]);
  
    if (missingFields.length > 0) {
      const missingFieldsMessage = `Please fill in the following required fields: ${missingFields.join(', ')}.`;
      alert(missingFieldsMessage);
      return;
    }
  
    const isDuplicate = masterRooms.some((room) => room.room === editedRoom.room);
  
    if (isDuplicate) {
      alert('Room with the same number already exists. Please enter a unique room number.');
    } else {
      fetch(`${apiUrl}/timetablemodule/masterroom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRoom),
        credentials: 'include',
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Data saved successfully:', data);
          fetchMasterRooms();
          handleCancelAddRoom();
        })
        .catch((error) => console.error('Error:', error));
    }
  };
  
  

  const handleEditClick = (_id) => {
    setEditRoomId(_id);
    const editedRow = masterRooms.find((room) => room._id === _id);
    if (editedRow) {
      setEditedRoom({ ...editedRow });
    }
  };

  const handleSaveEdit = () => {
    if (editRoomId) {
      const rowIndex = masterRooms.findIndex((room) => room._id === editRoomId);
      if (rowIndex !== -1) {
        const updatedData = [...masterRooms];
        updatedData[rowIndex] = editedRoom;

        fetch(`${apiUrl}/timetablemodule/masterroom/${editRoomId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editedRoom),
          credentials: 'include'
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log('Update Success:', data);
            setMasterRooms(updatedData);
            setEditRoomId(null);
            setEditedRoom({
              room: '',
              type: '',
              building: '',
              floor: '',
              dept: '',
              landMark: '',
              imageUrl: '',
            });
          })
          .catch((error) => {
            console.error('Update Error:', error);
          });
      }
    }
  };

  const handleDelete = (_id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
  
    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/masterroom/${_id}`, {
        method: 'DELETE', credentials: 'include'
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('Delete Success:', data);
          const updatedData = masterRooms.filter((room) => room._id !== _id);
          setMasterRooms(updatedData);
        })
        .catch((error) => {
          console.error('Delete Error:', error);
        });
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
  
      fetch(`${apiUrl}/upload/masterroom`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
        .then((response) => response.json())
        .then(() => {
          fetchMasterRooms();
          setSelectedFile(null);
        })
        .catch((error) => console.error('Error:', error));
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };
  

  return (
    <Container maxW='7xl'>
      <Header title='Manage Master Rooms'></Header>
      <FormControl>
        <FormLabel>Batch Upload</FormLabel>
        <Box mb="2" mt="2" display='flex'>
          <Input py='1' px='2' type='file' accept='.xlsx' onChange={handleFileChange} name='XlsxFile' />
          <CustomTealButton
          ml='5'
          w="200px"
          h="41"
          width='xs' onClick={handleUpload}>
            Upload Xlsx
          </CustomTealButton>
        </Box>
      </FormControl>
      <Box ml='-1'>
        <FileDownloadButton  fileUrl='/room_template.xlsx' fileName='room_template.xlsx' />
      </Box>

      <Box>
        {isAddRoomFormVisible ? (
          <FormControl>
            <Box mt='1'>
              <FormLabel>Room No: <span>*</span></FormLabel>
              <Input
                type='text'
                value={editedRoom.room}
                onChange={(e) => setEditedRoom({ ...editedRoom, room: e.target.value })}
              />
            </Box>
            <Box mt='3'>
              <FormLabel>Type: <span>*</span></FormLabel>
              <Input
                type='text'
                value={editedRoom.type}
                onChange={(e) => setEditedRoom({ ...editedRoom, type: e.target.value })}
              />
            </Box>

            <Box  mt='3'>
              <FormLabel>Building: <span>*</span></FormLabel>
              <Input
                type='text'
                value={editedRoom.building}
                onChange={(e) => setEditedRoom({ ...editedRoom, building: e.target.value })}
              />
            </Box>
            <Box  mt='3'>
              <FormLabel>Floor:</FormLabel>
              <Input
                type='text'
                value={editedRoom.floor}
                onChange={(e) => setEditedRoom({ ...editedRoom, floor: e.target.value })}
              />
            </Box>
            <Box mt='3'>
              <FormLabel>Department:</FormLabel>
              <Input
                type='text'
                value={editedRoom.dept}
                onChange={(e) => setEditedRoom({ ...editedRoom, dept: e.target.value })}
              />
            </Box>
            <Box mt='3'>
              <FormLabel>Landmark:</FormLabel>
              <Input
                type='text'
                value={editedRoom.landMark}
                onChange={(e) => setEditedRoom({ ...editedRoom, landMark: e.target.value })}
              />
            </Box>
            <Box mt='3'>
              <FormLabel>Image URL:</FormLabel>
              <Input
                type='text'
                value={editedRoom.imageUrl}
                onChange={(e) => setEditedRoom({ ...editedRoom, imageUrl: e.target.value })}
              />
            </Box>
            <Box display='flex' justifyContent='space-between'>
              <CustomBlueButton ml='0' onClick={handleSaveNewRoom}>Save New Room</CustomBlueButton>
              <CustomBlueButton mr='0' width='150px'  onClick={handleCancelAddRoom}>Cancel</CustomBlueButton>
            </Box>
          </FormControl>
        ) : (
          <CustomBlueButton ml='0' mt='3' onClick={handleAddRoom}>Add Master Room</CustomBlueButton>
        )}
      </Box>

      <TableContainer>
        <Text as='b'>Master Rooms Data(Total Entries: {masterRooms.length}):</Text>
        <Table
        mt='2'
        variant='striped'
        >
          <Thead>
            <Tr>
              <Th ><Center>Room</Center></Th>
              <Th><Center>Type</Center></Th>
              <Th><Center>Building</Center></Th>
              <Th><Center>Floor</Center></Th>
              <Th><Center>Department</Center></Th>
              <Th><Center>Landmark</Center></Th>
              <Th><Center>Image URL</Center></Th>
              <Th><Center>Action</Center></Th>
            </Tr>
          </Thead>
          <Tbody>
            {masterRooms.map((room) => (
              <Tr key={room._id}>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <Input
                        type='text'
                        value={editedRoom.room}
                        onChange={(e) => setEditedRoom({ ...editedRoom, room: e.target.value })}
                      />
                    ) : (
                      room.room
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <Input
                        type='text'
                        value={editedRoom.type}
                        onChange={(e) => setEditedRoom({ ...editedRoom, type: e.target.value })}
                      />
                    ) : (
                      room.type
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <Input
                        type='text'
                        value={editedRoom.building}
                        onChange={(e) => setEditedRoom({ ...editedRoom, building: e.target.value })}
                      />
                    ) : (
                      room.building
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <Input
                        type='text'
                        value={editedRoom.floor}
                        onChange={(e) => setEditedRoom({ ...editedRoom, floor: e.target.value })}
                      />
                    ) : (
                      room.floor
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <Input
                        type='text'
                        value={editedRoom.dept}
                        onChange={(e) => setEditedRoom({ ...editedRoom, dept: e.target.value })}
                      />
                    ) : (
                      room.dept
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <Input
                        type='text'
                        value={editedRoom.landMark}
                        onChange={(e) => setEditedRoom({ ...editedRoom, landMark: e.target.value })}
                      />
                    ) : (
                      room.landMark
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <Input
                        type='text'
                        value={editedRoom.imageUrl}
                        onChange={(e) => setEditedRoom({ ...editedRoom, imageUrl: e.target.value })}
                      />
                    ) : (
                      room.imageUrl
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editRoomId === room._id ? (
                      <CustomBlueButton onClick={handleSaveEdit}>Save</CustomBlueButton>
                    ) : (
                      <>
                        <CustomBlueButton onClick={() => handleEditClick(room._id)}>Edit</CustomBlueButton>
                        <CustomDeleteButton onClick={() => handleDelete(room._id)}>Delete</CustomDeleteButton>
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

export default MasterRoom;
