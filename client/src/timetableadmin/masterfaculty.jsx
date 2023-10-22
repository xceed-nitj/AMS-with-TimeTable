import React, { useState, useEffect } from 'react';

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [editedData, setEditedData] = useState({
    name: '',
    designation: '',
    dept: '',
    type: '',
    email: '',
    extension: '',
  });

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
    fetch('http://localhost:8000/timetablemodule/faculty', {
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

    const handleEditClick = (_id) => {
      setEditRowId(_id);
    
      // Find the row with the specified _id and set its data to the "editedData" state
      const editedRow = tableData.find((row) => row._id === _id);
      if (editedRow) {
        setEditedData({ ...editedRow });
      }
    };

    const handleSaveEdit = () => {
      // Make a PUT request to update the data for the selected row
      if (editRowId) {
        // Find the index of the row with the specified _id in the tableData array
        const rowIndex = tableData.findIndex((row) => row._id === editRowId);
        if (rowIndex !== -1) {
          const updatedData = [...tableData];
          updatedData[rowIndex] = editedData;
    
          fetch(`${apiUrl}/timetablemodule/faculty/${editRowId}`, {
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
              console.log('Update Success:', data);
              setTableData(updatedData);
              setEditRowId(null);
              setEditedData({
                _id: null, // Clear the edited data
                name: '',
                designation: '',
                dept: '',
                type: '',
                email: '',
                extension: '',
              });
            })
            .catch((error) => {
              console.error('Update Error:', error);
            });
        }
      }
    };

<<<<<<< Updated upstream
      // Send the updated data to the server
      fetch(`http://localhost:8000/faculty/${editRowIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
=======
    const handleDelete = (_id) => {
      // Send a DELETE request to remove the selected row
      fetch(`${apiUrl}/timetablemodule/faculty/${_id}`, {
        method: 'DELETE',
>>>>>>> Stashed changes
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('Delete Success:', data);
          // Remove the deleted row from the tableData
          const updatedData = tableData.filter((row) => row._id !== _id);
          setTableData(updatedData);
        })
        .catch((error) => {
          console.error('Delete Error:', error);
        });
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
          {tableData.map((row) => (
            <tr key={row._id}>
              <td>{editRowId === row._id ? <input type="text" value={editedData.name} onChange={(e) => setEditedData({ ...editedData, name: e.target.value })} /> : row.name}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.designation} onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })} /> : row.designation}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.dept} onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })} /> : row.dept}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.type} onChange={(e) => setEditedData({ ...editedData, type: e.target.value })} /> : row.type}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.email} onChange={(e) => setEditedData({ ...editedData, email: e.target.value })} /> : row.email}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.extension} onChange={(e) => setEditedData({ ...editedData, extension: e.target.value })} /> : row.extension}</td>
              <td>
                {editRowId === row._id ? (
                  <button onClick={handleSaveEdit}>Save</button>
                ) : (
                  <>
                    <button onClick={() => handleEditClick(row._id)}>Edit</button>
                    <button onClick={() => handleDelete(row._id)}>Delete</button>
                  </>
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