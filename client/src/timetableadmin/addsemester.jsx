import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { Heading,Input } from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomBlueButton} from '../styles/customStyles'
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


function SuccessMessage({ message }) {
  return (
    <div className="success-message">
      {message}
    </div>
  );
}

function AddSemComponent() {
  const [sems, setSems] = useState([]);
  const [newSem, setNewSem] = useState(''); 
  const [successMessage, setSuccessMessage] = useState('');
 
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchSemData();
   }, []);


  const fetchSemData = () => {
    fetch(`${apiUrl}/timetablemodule/addSem`)
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
    })
      .then(handleResponse)
      .then((data) => {
        console.log('Data saved successfully:', data);
        setSuccessMessage('Semester added successfully!');
        fetchSemData();
      })
      .catch(handleError);
  };

  const handleSemInputChange = (e) => {
    setNewSem(e.target.value);
  };

  const handleDelete = (semId) => {
    fetch(`${apiUrl}/timetablemodule/addSem/${semId}`, {
      method: 'DELETE',
    })
      .then(handleResponse)
      .then(() => {
        console.log('Sem deleted successfully');
        fetchSemData();
      })
      .catch(handleError);
  };

  return (
    <div>
      <Heading>Add semesters</Heading>
    
        <SuccessMessage message={successMessage} />

<div>
          <label>
            Sem:
            <Input
              type="text"
              value={newSem}
              onChange={handleSemInputChange}
            />
          </label>
          <CustomBlueButton onClick={handleSubmit}>Add Sem</CustomBlueButton>
        </div>     

      <div>
        <h2>Sem Data</h2>
        <table>
          <thead>
            <tr>
              <th>Sem</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sems.map((sem) => (
              <tr key={sem._id}>
                <td>{sem.sem}</td>
                <td>
                  <CustomBlueButton onClick={() => handleDelete(sem._id)}>Delete</CustomBlueButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AddSemComponent;
