import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';

function SuccessMessage({ message }) {
  return (
    <div className="success-message">
      {message}
    </div>
  );
}

function Component() {
  const [sem, setSem] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [facultyData, setFacultyData] = useState([]);

  const availableDepartments = ['EE', 'BT'];

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchFacultyData();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`)
        .then(handleResponse)
        .then(data => {
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);

  const fetchFacultyData = () => {
    fetch(`${apiUrl}/timetablemodule/addFaculty`)
      .then(handleResponse)
      .then(data => {
        setFacultyData(data);
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
        console.log('Data saved successfully:', data);
        setSuccessMessage('Data saved successfully!');
        fetchFacultyData();
      })
      .catch(handleError);
  };

  return (
    <div>
      <h1>Add Faculty</h1>
      {successMessage ? (
        <SuccessMessage message={successMessage} />
      ) : (
        <div>
          <label>
            Semester:
            <select value={sem} onChange={(e) => setSem(Number(e.target.value))}>
              {[...Array(8).keys()].map((semester) => (
                <option key={semester + 1} value={(semester + 1).toString()}>
                  {semester + 1}
                </option>
              ))}
            </select>
          </label>
          <br />

          <label>
            Department:
            <select value={selectedDepartment} onChange={handleDepartmentChange}>
              <option value="">Select a Department</option>
              {availableDepartments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
          <br />

          <label>
            Faculty:
            <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
              <option value="" key="default">Select a Faculty</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </label>

          <br />
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}

      <div>
        <h2>Faculty Data</h2>
        <table>
          <thead>
            <tr>
              <th>Semester</th>
              <th>Code</th>
              <th>Faculty</th>
            </tr>
          </thead>
          <tbody>
            {facultyData.map((faculty) => (
              <tr key={faculty._id}>
                <td>{faculty.sem}</td>
                <td>{faculty.code}</td>
                <td>{faculty.faculty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Component;
