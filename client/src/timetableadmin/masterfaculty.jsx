import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [editedData, setEditedData] = useState({
    name: '',
    designation: '',
    dept: '',
    type: '',
    email: '',
    extension: '',
  });
const apiUrl=getEnvironment();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(`${apiUrl}/timetablemodule/faculty`) // Replace with the actual endpoint
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setTableData(data);
      })
      .catch((error) => {
        console.error('Error:', error);
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

      fetch(`${apiUrl}/upload/faculty`, {
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
          console.log(data); // Handle the response from the server
          fetchData(); // Fetch data after a successful upload
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };

  const handleAddFaculty = () => {
    // Reset the form fields using editedData
    setEditedData({
      name: '',
      designation: '',
      dept: '',
      type: '',
      email: '',
      extension: '',
    });
  };

  const handleSaveNewFaculty = () => {
    // Send a POST request to add the new faculty to the database
    fetch(`${apiUrl}/timetablemodule/faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedData), // Use editedData for new faculty
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data); // Handle the response from the server
        fetchData(); // Fetch data after a successful addition
        handleAddFaculty(); // Reset the form fields
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    };

  const handleEditClick = (index) => {
    setEditRowIndex(index);
    // Set the initial values for editing based on the selected row's data
    const rowData = tableData[index];
    setEditedData({ ...rowData });
  };

  const handleSaveEdit = () => {
    // Make a PUT request to update the data for the selected row
    if (editRowIndex !== null) {
      const updatedData = tableData.slice(); // Create a copy of the data array
      updatedData[editRowIndex] = editedData;

      // Send the updated data to the server
      fetch(`${apiUrl}/faculty/${editRowIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log(data); // Handle the response from the server
          setTableData(updatedData); // Update the local table data
          setEditRowIndex(null); // Clear the edit mode
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  };

  return (
    <div>
      <h1>CSV File Upload</h1>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        name="csvFile"
      />
      <button onClick={handleUpload}>Upload CSV</button>

      <h2>Table of Faculty Data</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Dept</th>
            <th>Type</th>
            <th>Email</th>
            <th>Extension</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td>{editRowIndex === index ? <input type="text" value={editedData.name} onChange={(e) => setEditedData({ ...editedData, name: e.target.value })} /> : row.name}</td>
              <td>{editRowIndex === index ? <input type="text" value={editedData.designation} onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })} /> : row.designation}</td>
              <td>{editRowIndex === index ? <input type="text" value={editedData.dept} onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })} /> : row.dept}</td>
              <td>{editRowIndex === index ? <input type="text" value={editedData.type} onChange={(e) => setEditedData({ ...editedData, type: e.target.value })} /> : row.type}</td>
              <td>{editRowIndex === index ? <input type="text" value={editedData.email} onChange={(e) => setEditedData({ ...editedData, email: e.target.value })} /> : row.email}</td>
              <td>{editRowIndex === index ? <input type="text" value={editedData.extension} onChange={(e) => setEditedData({ ...editedData, extension: e.target.value })} /> : row.extension}</td>
              <td>
                {editRowIndex === index ? (
                  <button onClick={handleSaveEdit}>Save</button>
                ) : (
                  <button onClick={() => handleEditClick(index)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Add Faculty</h2>
      <div>
        <label>Name: </label>
        <input
          type="text"
          value={editedData.name}
          onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
        />
      </div>
      <div>
        <label>Designation: </label>
        <input
          type="text"
          value={editedData.designation}
          onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })}
        />
      </div>
      <div>
        <label>Dept: </label>
        <input
          type="text"
          value={editedData.dept}
          onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })}
        />
      </div>
      <div>
        <label>Type: </label>
        <input
          type="text"
          value={editedData.type}
          onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
        />
      </div>
      <div>
        <label>Email: </label>
        <input
          type="text"
          value={editedData.email}
          onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
        />
      </div>
      <div>
        <label>Extension: </label>
        <input
          type="text"
          value={editedData.extension}
          onChange={(e) => setEditedData({ ...editedData, extension: e.target.value })}
        />
      </div>
      <button onClick={handleSaveNewFaculty}>Save</button>
    </div>
  );
}

export default Subject;
