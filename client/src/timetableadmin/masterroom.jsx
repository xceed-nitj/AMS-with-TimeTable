import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';

import { CustomTh, CustomLink, CustomBlueButton, CustomTealButton } from '../styles/customStyles';
import { Box, Container, FormControl, FormLabel, Input, Text } from '@chakra-ui/react';
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
      <Box>
        <FileDownloadButton fileUrl='/room_template.xlsx' fileName='room_template.xlsx' />
      </Box>

      <Box>
        {isAddRoomFormVisible ? (
          <FormControl>
            <Box>
              <FormLabel>Room No:</FormLabel>
              <Input
                type='text'
                value={editedRoom.room}
                onChange={(e) => setEditedRoom({ ...editedRoom, room: e.target.value })}
              />
            </Box>
            <Box>
              <FormLabel>Type:</FormLabel>
              <Input
                type='text'
                value={editedRoom.type}
                onChange={(e) => setEditedRoom({ ...editedRoom, type: e.target.value })}
              />
            </Box>

            <Box>
              <FormLabel>Building:</FormLabel>
              <Input
                type='text'
                value={editedRoom.building}
                onChange={(e) => setEditedRoom({ ...editedRoom, building: e.target.value })}
              />
            </Box>
            <Box>
              <FormLabel>Floor:</FormLabel>
              <Input
                type='text'
                value={editedRoom.floor}
                onChange={(e) => setEditedRoom({ ...editedRoom, floor: e.target.value })}
              />
            </Box>
            <Box>
              <FormLabel>Department:</FormLabel>
              <Input
                type='text'
                value={editedRoom.dept}
                onChange={(e) => setEditedRoom({ ...editedRoom, dept: e.target.value })}
              />
            </Box>
            <Box>
              <FormLabel>Landmark:</FormLabel>
              <Input
                type='text'
                value={editedRoom.landMark}
                onChange={(e) => setEditedRoom({ ...editedRoom, landMark: e.target.value })}
              />
            </Box>
            <Box>
              <FormLabel>Image URL:</FormLabel>
              <Input
                type='text'
                value={editedRoom.imageUrl}
                onChange={(e) => setEditedRoom({ ...editedRoom, imageUrl: e.target.value })}
              />
            </Box>
            <Box>
              <CustomBlueButton onClick={handleSaveNewRoom}>Save New Room</CustomBlueButton>
              <CustomBlueButton onClick={handleCancelAddRoom}>Cancel</CustomBlueButton>
            </Box>
          </FormControl>
        ) : (
          <CustomBlueButton onClick={handleAddRoom}>Add Master Room</CustomBlueButton>
        )}
      </Box>

      <h2>Master Rooms Data</h2>
      <table>
        <thead>
          <tr>
            <th>Room</th>
            <th>Type</th>
            <th>Building</th>
            <th>Floor</th>
            <th>Department</th>
            <th>Landmark</th>
            <th>Image URL</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {masterRooms.map((room) => (
            <tr key={room._id}>
              <td>
                {editRoomId === room._id ? (
                  <input
                    type='text'
                    value={editedRoom.room}
                    onChange={(e) => setEditedRoom({ ...editedRoom, room: e.target.value })}
                  />
                ) : (
                  room.room
                )}
              </td>
              <td>
                {editRoomId === room._id ? (
                  <input
                    type='text'
                    value={editedRoom.type}
                    onChange={(e) => setEditedRoom({ ...editedRoom, type: e.target.value })}
                  />
                ) : (
                  room.type
                )}
              </td>

              <td>
                {editRoomId === room._id ? (
                  <input
                    type='text'
                    value={editedRoom.building}
                    onChange={(e) => setEditedRoom({ ...editedRoom, building: e.target.value })}
                  />
                ) : (
                  room.building
                )}
              </td>
              <td>
                {editRoomId === room._id ? (
                  <input
                    type='text'
                    value={editedRoom.floor}
                    onChange={(e) => setEditedRoom({ ...editedRoom, floor: e.target.value })}
                  />
                ) : (
                  room.floor
                )}
              </td>
              <td>
                {editRoomId === room._id ? (
                  <input
                    type='text'
                    value={editedRoom.dept}
                    onChange={(e) => setEditedRoom({ ...editedRoom, dept: e.target.value })}
                  />
                ) : (
                  room.dept
                )}
              </td>
              <td>
                {editRoomId === room._id ? (
                  <input
                    type='text'
                    value={editedRoom.landMark}
                    onChange={(e) => setEditedRoom({ ...editedRoom, landMark: e.target.value })}
                  />
                ) : (
                  room.landMark
                )}
              </td>
              <td>
                {editRoomId === room._id ? (
                  <input
                    type='text'
                    value={editedRoom.imageUrl}
                    onChange={(e) => setEditedRoom({ ...editedRoom, imageUrl: e.target.value })}
                  />
                ) : (
                  room.imageUrl
                )}
              </td>
              <td>
                {editRoomId === room._id ? (
                  <CustomBlueButton onClick={handleSaveEdit}>Save</CustomBlueButton>
                ) : (
                  <>
                    <CustomBlueButton onClick={() => handleEditClick(room._id)}>Edit</CustomBlueButton>
                    <CustomBlueButton onClick={() => handleDelete(room._id)}>Delete</CustomBlueButton>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}

export default MasterRoom;
