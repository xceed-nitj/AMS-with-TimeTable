import React, { useState } from 'react';

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);

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
        // .then((response) => response.json())
        .then((data) => {
          console.log(data); // Handle the response from the server
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
    </div>
  );
}

export default Subject;
