import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';

import {CustomTh, CustomLink,CustomBlueButton} from '../styles/customStyles'
import { Box, Container } from '@chakra-ui/react';
import Header from '../components/header';

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [isAddFacultyFormVisible, setIsAddFacultyFormVisible] = useState(false); 
  const [editedData, setEditedData] = useState({
    facultyID:'',
    name: '',
    designation: '',
    dept: '',
    email: '',
    extension: '',
    type: '',
  });
const apiUrl=getEnvironment();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(`${apiUrl}/timetablemodule/faculty`,{credentials: 'include'}) // Replace with the actual endpoint
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setTableData(data.reverse());
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
        credentials: 'include'
      })
        .then((response) => response.json())
        .then(() => {
          fetchData();
          setSelectedFile(null);
        })
        .catch((error) => console.error('Error:', error));
    } else {
      alert('Please select a CSV file before uploading.');
    }
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
            credentials: 'include',
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
                facultyID:'',
                name: '',
                designation: '',
                dept: '',
                email: '',
                extension: '',
                type: '',
              });
            })
            .catch((error) => {
              console.error('Update Error:', error);
            });
        }
      }
    };

    // ...

const handleDelete = (_id) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
  
  if (confirmDelete) {
    fetch(`${apiUrl}/timetablemodule/faculty/${_id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Delete Success:', data);
        const updatedData = tableData.filter((row) => row._id !== _id);
        setTableData(updatedData);
      })
      .catch((error) => {
        console.error('Delete Error:', error);
      });
  }
};

// ...

    const handleCancelAddFaculty = () => {
      setIsAddFacultyFormVisible(false); 
    };

    const handleAddFaculty = () => {
      setEditedData({
        facultyID:'',
        name: '',
        designation: '',
        dept: '',
        email: '',
        extension: '',
        type: '',
      });
      setIsAddFacultyFormVisible(true); 
    };
  
    const handleSaveNewFaculty = () => {
      const isDuplicate = tableData.some((row) => row.name === editedData.name);

      if (!editedData.facultyID || !editedData.name || !editedData.dept || !editedData.email||!editedData.designation) {
        alert('Please fill in all required fields.');
        return;
      }
      
  
      if (isDuplicate) {
        alert('Faculty with the same name already exists. Please enter a unique name.');
      } else {
        fetch(`${apiUrl}/timetablemodule/faculty`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editedData),
          credentials: 'include',
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Data saved successfully:', data);
            fetchData();
            handleCancelAddFaculty();
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }
    };
    
  


  return (
    <Box>
      {/* <h1>Master Faculty </h1> */}
      <Header title='Master Faculty'></Header>
      <h2>Batch Upload</h2>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        name="csvFile"
      />
      <CustomBlueButton onClick={handleUpload}>Upload Xlsx</CustomBlueButton>
      <FileDownloadButton
      fileUrl='/faculty_template.xlsx'
      fileName="faculty_template.xlsx"
    />
<div>
{isAddFacultyFormVisible ?(
  <div>
      <div>
        <label>Faculty ID: </label>
        <input
          type="text"
          value={editedData.facultyID}
          onChange={(e) => setEditedData({ ...editedData, facultyID: e.target.value })}
        />
      </div>
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
          <div>
          <CustomBlueButton onClick={handleSaveNewFaculty}>Save New Faculty</CustomBlueButton>
          <CustomBlueButton onClick={handleCancelAddFaculty}>Cancel</CustomBlueButton>
        </div>
      </div>
    ) : (
      <CustomBlueButton onClick={handleAddFaculty}>Add Faculty</CustomBlueButton>
    )}
    </div>

       <h2>Table of Faculty Data</h2>
      <table>
        <thead>
          <tr>
            <th>FacultyID</th>
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
              <td>{editRowId === row._id ? <input type="text" value={editedData.facultyID} onChange={(e) => setEditedData({ ...editedData, facultyID: e.target.value })} /> : row.facultyID}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.name} onChange={(e) => setEditedData({ ...editedData, name: e.target.value })} /> : row.name}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.designation} onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })} /> : row.designation}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.dept} onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })} /> : row.dept}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.type} onChange={(e) => setEditedData({ ...editedData, type: e.target.value })} /> : row.type}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.email} onChange={(e) => setEditedData({ ...editedData, email: e.target.value })} /> : row.email}</td>
              <td>{editRowId === row._id ? <input type="text" value={editedData.extension} onChange={(e) => setEditedData({ ...editedData, extension: e.target.value })} /> : row.extension}</td>
              <td>
                {editRowId === row._id ? (
                  <CustomBlueButton onClick={handleSaveEdit}>Save</CustomBlueButton>
                ) : (
                  <>
                    <CustomBlueButton onClick={() => handleEditClick(row._id)}>Edit</CustomBlueButton>
                    <CustomBlueButton onClick={() => handleDelete(row._id)}>Delete</CustomBlueButton>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

     
    </Box>
  );
}

export default Subject;