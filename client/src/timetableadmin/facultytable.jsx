import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import { Box } from '@chakra-ui/react';
import Header from '../components/header';

function FacultyTable() {
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl=getEnvironment();
  useEffect(() => {
    // Make a GET request with method and headers set
    fetch(`${apiUrl}/timetablemodule/faculty`, {
      method: 'GET', // Specify the HTTP method as GET
      headers: {
        'Content-Type': 'application/json', // Set the content type to JSON
      },
      credentials: 'include',
    })
      .then((response) => {
        // console.log(response)
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setFacultyData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching faculty data:', error);
        setLoading(false);
      });
  }, []);
  
  return (
    <Box>
      <h1>Faculty Timetable</h1>
      {/* <Header title='Faculty Timetable'></Header> */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Type</th>
              <th>Email</th>
              <th>Extension</th>
            </tr>
          </thead>
          <tbody>
            {facultyData.map((faculty) => (
              <tr key={faculty._id}>
                <td>{faculty.name}</td>
                <td>{faculty.designation}</td>
                <td>{faculty.dept}</td>
                <td>{faculty.type}</td>
                <td>{faculty.email}</td>
                <td>{faculty.extension}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Box>
  );
}

export default FacultyTable;
