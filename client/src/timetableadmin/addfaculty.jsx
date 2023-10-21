import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function SuccessMessage({ message }) {
    return (
      <div className="success-message">
        {message}
      </div>
    );
  }

function YourComponent() {
  const [sem, setSem] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const availableDepartments = ['EE','BT'];

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    console.log("Selected Department:", selectedDepartment); // Debugging
    // Fetch faculty data based on the selected department
    if (selectedDepartment) {
      fetch(`http://localhost:8000/timetablemodule/faculty/dept/${selectedDepartment}`)
        .then(handleResponse)
        .then(data => {
          console.log("Fetched Faculty Data:", data); // Debugging
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);
  

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
    // Prepare the data to be saved in the database
    const dataToSave = {
      sem: sem,
      code:currentCode,
      faculty: selectedFaculty,
    };

    // Make a POST request to save the data in the database
    fetch('http://127.0.0.1:8000/timetablemodule/addFaculty', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    })
      .then(handleResponse)
      .then((data) => {
        // Handle the response from the server, e.g., display a success message or navigate to another page
        console.log('Data saved successfully:', data);
        setSuccessMessage('Data saved successfully!');
        // You can navigate to a success page or display a success message here
        
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
            <input
              type="text"
              value={sem}
              onChange={(e) => setSem(e.target.value)}
            />
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
    </div>
  );
  
}

export default YourComponent;
