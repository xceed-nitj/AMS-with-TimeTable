import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';

function MasterRoom() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [masterRooms, setMasterRooms] = useState([]);
  const [editedRoom, setEditedRoom] = useState({
    room: '',
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
    fetch(`${apiUrl}/timetablemodule/masterroom`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setMasterRooms(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleAddRoom = () => {
    setEditedRoom({
      room: '',
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedRoom),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Data saved successfully:', data);
        fetchMasterRooms();
        handleCancelAddRoom(); 
      })
      .catch((error) => {
        console.error('Error:', error);
      });
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
    fetch(`${apiUrl}/timetablemodule/masterroom/${_id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
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
      })
        .then((response) => {
          if (!response.ok) {
            throw  Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          fetchData(); 
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };

  return (
    <div>
      <h1>Manage Master Rooms</h1>
      <h2>CSV File Upload</h2>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        name="csvFile"
      />
      <button onClick={handleUpload}>Upload CSV</button>

      <div>
        
        {isAddRoomFormVisible ? ( 
          <div>
            <div>
              <label>Room:</label>
              <input
                type="text"
                value={editedRoom.room}
                onChange={(e) => setEditedRoom({ ...editedRoom, room: e.target.value })}
              />
            </div>
            <div>
              <label>Building:</label>
              <input
                type="text"
                value={editedRoom.building}
                onChange={(e) => setEditedRoom({ ...editedRoom, building: e.target.value })}
              />
            </div>
            <div>
              <label>Floor:</label>
              <input
                type="text"
                value={editedRoom.floor}
                onChange={(e) => setEditedRoom({ ...editedRoom, floor: e.target.value })}
              />
            </div>
            <div>
              <label>Department:</label>
              <input
                type="text"
                value={editedRoom.dept}
                onChange={(e) => setEditedRoom({ ...editedRoom, dept: e.target.value })}
              />
            </div>
            <div>
              <label>Landmark:</label>
              <input
                type="text"
                value={editedRoom.landMark}
                onChange={(e) => setEditedRoom({ ...editedRoom, landMark: e.target.value })}
              />
            </div>
            <div>
              <label>Image URL:</label>
              <input
                type="text"
                value={editedRoom.imageUrl}
                onChange={(e) => setEditedRoom({ ...editedRoom, imageUrl: e.target.value })}
              />
            </div>
            <div>
              <button onClick={handleSaveNewRoom}>Save New Room</button>
              <button onClick={handleCancelAddRoom}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={handleAddRoom}>Add Master Room</button>
        )}
      </div>

      <h2>Master Rooms Data</h2>
      <table>
        <thead>
          <tr>
            <th>Room</th>
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
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
                    value={editedRoom.imageUrl}
                    onChange={(e) => setEditedRoom({ ...editedRoom, imageUrl: e.target.value })}
                  />
                ) : (
                  room.imageUrl
                )}
              </td>
              <td>
                {editRoomId === room._id ? (
                  <button onClick={handleSaveEdit}>Save</button>
                ) : (
                  <>
                    <button onClick={() => handleEditClick(room._id)}>Edit</button>
                    <button onClick={() => handleDelete(room._id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MasterRoom;
