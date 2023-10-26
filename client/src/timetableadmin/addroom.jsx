import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';

function SuccessMessage({ message }) {
  return (
    <div className="success-message">
      {message}
    </div>
  );
}

function AddRoomComponent() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [masterRooms, setMasterRooms] = useState([]);
  const [selectedMasterRoom, setSelectedMasterRoom] = useState('');

  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchRoomsData();
    fetchMasterRooms();
  }, []);

  const fetchRoomsData = () => {
    fetch(`${apiUrl}/timetablemodule/addroom`)
      .then(handleResponse)
      .then(data => {
        setRooms(data);
      })
      .catch(handleError);
  };

  const fetchMasterRooms = () => {
    fetch(`${apiUrl}/timetablemodule/masterroom`)
      .then(handleResponse)
      .then(data => {
        setMasterRooms(data);
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
      room: selectedMasterRoom,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/addroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    })
      .then(handleResponse)
      .then((data) => {
        console.log('Data saved successfully:', data);
        setSuccessMessage('Room added successfully!');
        fetchRoomsData();
        setSelectedMasterRoom('');
      })
      .catch(handleError);
  };

  const handleDelete = (roomId) => {
    fetch(`${apiUrl}/timetablemodule/addroom/${roomId}`, {
      method: 'DELETE',
    })
      .then(handleResponse)
      .then(() => {
        console.log('Room deleted successfully');
        fetchRoomsData();
      })
      .catch(handleError);
  };

  return (
    <div>
      <h1>Add Rooms</h1>
      {successMessage ? (
        <SuccessMessage message={successMessage} />
      ) : (
        <div>
          <label>
            Room:
            <select
              value={selectedMasterRoom}
              onChange={(e) => setSelectedMasterRoom(e.target.value)}
            >
              <option value="">Select a Room</option>
              {masterRooms.map((masterRoom) => (
                <option key={masterRoom._id} value={masterRoom.room}>
                  {masterRoom.room}
                </option>
              ))}
            </select>
          </label>
          <br />
          <button onClick={handleSubmit}>Add Room</button>
        </div>
      )}

      <div>
        <h2>Room Data</h2>
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room._id}>
                <td>{room.room}</td>
                <td>
                  <button onClick={() => handleDelete(room._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AddRoomComponent;
