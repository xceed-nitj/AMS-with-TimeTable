import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';

function Subject() {
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [editedData, setEditedData] = useState({
    abbreviation: '',
    type: '',
    subCode: '',
    subName: '',
    sem: '',
    degree: '',
    dept:'',
    credits:'',
    code:currentCode
  });

  const [editedSData, setEditedSData] = useState({
    abbreviation: '',
    type: '',
    subCode: '',
    subName: '',
    sem: '',
    degree: '',
    dept:'',
    credits:'',
    code:currentCode
  });



const apiUrl=getEnvironment();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(`${apiUrl}/timetablemodule/subject`) // Replace with the actual endpoint
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
      formData.append('code', currentCode); 

      fetch(`${apiUrl}/upload/subject`, {
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

  const handleAddSubject = () => {
    // Reset the form fields using editedData
    setEditedSData({
        abbreviation: '',
        type: '',
        subCode: '',
        subName: '',
        sem: '',
        degree: '',
        dept:'',
    credits:'',
        code:currentCode
    });
  };

  const handleSaveNewSubject = () => {
    const dataWithCode = { ...editedSData, code: currentCode };

    // Send a POST request to add the new faculty to the database
    fetch(`${apiUrl}/timetablemodule/subject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithCode), // Use editedData for new faculty
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
        handleAddSubject(); // Reset the form fields
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
          setEditedSData({ ...editedRow });
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
      
            fetch(`${apiUrl}/timetablemodule/subject/${editRowId}`, {
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
                  abbreviation: '',
                  type: '',
                  subCode: '',
                  subName: '',
                  sem: '',
                  degree: '',
                  dept:'',
    credits:'',
                  code:currentCode
                });
              })
              .catch((error) => {
                console.error('Update Error:', error);
              });
          }
        }
      };
  
      const handleDelete = (_id) => {
        // Send a DELETE request to remove the selected row
        fetch(`${apiUrl}/timetablemodule/subject/${_id}`, {
          method: 'DELETE',
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

      {/* Display the fetched data */}
      <h2>Table of Subject Data</h2>
      <table>
        <thead>
          <tr>
            <th>Abb</th>
            <th>Type</th>
            <th>SubCode</th>
            <th>SubName</th>
            <th>Sem</th>
            <th>Degree</th>
            <th>Department</th>
            <th>Credits</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row._id}>
              <td>{editRowId === row._id ? <input type="text" value={editedData.abbreviation} onChange={(e) => setEditedData({ ...editedData, abbreviation: e.target.value })} /> : row.abbreviation}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.type} onChange={(e) => setEditedData({ ...editedData, type: e.target.value })} /> : row.type}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.subCode} onChange={(e) => setEditedData({ ...editedData, subCode: e.target.value })} /> : row.subCode}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.subName} onChange={(e) => setEditedData({ ...editedData, subName: e.target.value })} /> : row.subName}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.sem} onChange={(e) => setEditedData({ ...editedData, sem: e.target.value })} /> : row.sem}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.degree} onChange={(e) => setEditedData({ ...editedData, degree: e.target.value })} /> : row.degree}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.dept} onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })} /> : row.dept}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.credits} onChange={(e) => setEditedData({ ...editedData, credits: e.target.value })} /> : row.credits}</td>
            
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

      <h2>Add Subject</h2>
<div>
  <label>Abbreviation: </label>
  <input
    type="text"
    value={editedSData.abbreviation}
    onChange={(e) => setEditedSData({ ...editedSData, abbreviation: e.target.value })}
  />
</div>
<div>
  <label>Type: </label>
  <input
    type="text"
    value={editedSData.type}
    onChange={(e) => setEditedSData({ ...editedSData, type: e.target.value })}
  />
</div>
<div>
  <label>Subject Code: </label>
  <input
    type="text"
    value={editedSData.subCode}
    onChange={(e) => setEditedSData({ ...editedSData, subCode: e.target.value })}
  />
</div>
<div>
  <label>Subject Name: </label>
  <input
    type="text"
    value={editedSData.subName}
    onChange={(e) => setEditedSData({ ...editedSData, subName: e.target.value })}
  />
</div>
<div>
  <label>Semester: </label>
  <input
    type="text"
    value={editedSData.sem}
    onChange={(e) => setEditedSData({ ...editedSData, sem: e.target.value })}
  />
</div>
<div>
  <label>Degree: </label>
  <input
    type="text"
    value={editedSData.degree}
    onChange={(e) => setEditedSData({ ...editedSData, degree: e.target.value })}
  />
</div>
<div>
  <label>Department: </label>
  <input
    type="text"
    value={editedSData.dept}
    onChange={(e) => setEditedSData({ ...editedSData, dept: e.target.value })}
  />
</div>
<div>
  <label>Credits: </label>
  <input
    type="number" // Assuming it's a number
    value={editedSData.credits}
    onChange={(e) => setEditedSData({ ...editedSData, credits: e.target.value })}
  />
</div>

<button onClick={handleSaveNewSubject}>Save</button>


    </div>
  );
}

export default Subject;
