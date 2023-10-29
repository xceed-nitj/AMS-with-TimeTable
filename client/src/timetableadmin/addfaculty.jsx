import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import './addfaculty.css'

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

  const [editFacultyData, setEditFacultyData] = useState({
    facultyId: null,
    facultyName: '',
  });

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


  const handleDelete = (facultyId, facultyName) => {
    const facultyToDelete = facultyData.find((faculty) => faculty._id === facultyId);
  
    if (facultyToDelete) {
      const updatedFaculty = facultyToDelete.faculty.filter((name) => name !== facultyName);
      facultyToDelete.faculty = updatedFaculty;
  
      fetch(`${apiUrl}/timetablemodule/addFaculty/${facultyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facultyToDelete),
      })
        .then(handleResponse)
        .then(() => {
          console.log('Faculty removed from the entry successfully');
          fetchFacultyData();
        })
        .catch(handleError);
    }
  };

  return (
    <div class="addfacultybody">
    <div class="addfacultycontainer">
      <h1 class="addfacultypage-title">Add Faculty</h1>
      <div class="success-message">
        {successMessage ? (
          <SuccessMessage message={successMessage} />
          ) : (
          <div class="addfacultyform">
            <div class="labelandDD">
              <label class="form-label">Semester:</label>
              <select class="form-select" value={sem} onChange={(e) => setSem(Number(e.target.value))}>
                {[...Array(8).keys()].map((semester) => (
                  <option key={semester + 1} value={(semester + 1).toString()}>
                    {semester + 1}
                  </option>
                ))}
              </select>
              <br />
            </div>

            <div class="labelandDD">
              <label class="form-label">Department:</label>
              <select class="form-select" value={selectedDepartment} onChange={handleDepartmentChange}>
                <option value="">Select a Department</option>
                {availableDepartments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <br />
            </div>

            <div class="labelandDD">
              <label class="form-label">Faculty:</label>
              <select class="form-select" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
                <option value="" key="default">
                  Select a Faculty
                </option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.name}>
                    {faculty.name}
                  </option>
                ))}
              </select>
              <br />
            </div>
          </div>
        )}
        <button class="form-button" onClick={handleSubmit}>Submit</button>
      </div>

      <div class="faculty-data">
        <h2 class="section-title">Faculty Data</h2>
        <table class="faculty-table">
          <thead>
            <tr>
              <th>Semester</th>
              <th>Faculty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facultyData.map((faculty) =>
              faculty.faculty.map((individualFaculty, index) => (
                <tr key={`${faculty._id}-${index}`}>
                  <td class="table-cell">{index === 0 ? faculty.sem : ''}</td>
                  <td class="table-cell">{individualFaculty}</td>
                  <td class="table-cell">
                    <button class="table-button" onClick={() => handleDelete(faculty._id, individualFaculty)}>Delete</button>
                  </td>
                </tr>
              ))
              )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
  
}

export default Component;
