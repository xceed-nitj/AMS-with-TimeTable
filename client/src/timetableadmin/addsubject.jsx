import React, { useState, useEffect } from 'react';

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch("http://localhost:8000/timetablemodule/faculty") // Replace with the actual endpoint
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

      fetch("http://localhost:8000/upload/faculty", {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
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
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              <td>{row.dept}</td>
              <td>{row.type}</td>
              <td>{row.email}</td>
              <td>{row.extension}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Subject;
