import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import { Box } from '@chakra-ui/react';
import Header from '../components/header';

function MasterRoomTable() {
  const [masterRoomData, setMasterRoomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetch(`${apiUrl}/timetablemodule/masterroom`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setMasterRoomData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching master room data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <Box>
      <Header title="Master Room Information"></Header>
      {/* <Header title="Master Room Information"></Header> */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Building</th>
              <th>Floor</th>
              <th>Department</th>
              <th>Landmark</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {masterRoomData.map((room) => (
              <tr key={room._id}>
                <td>{room.room}</td>
                <td>{room.building}</td>
                <td>{room.floor}</td>
                <td>{room.dept}</td>
                <td>{room.landMark}</td>
                <td>
                  {room.imageUrl && <img src={room.imageUrl} alt={room.room} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Box>
  );
}

export default MasterRoomTable;
