import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';

import { CustomTh, CustomLink, CustomBlueButton } from '../styles/customStyles';
import { Box } from '@chakra-ui/react';
import Header from '../components/header';

function Subject() {
  const [tableData, setTableData] = useState([]);
  const [timetableData, setTimeTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [isAddFacultyFormVisible, setIsAddFacultyFormVisible] = useState(false);
  const [department, setDepartment] = useState('');
  const [editedData, setEditedData] = useState({
    facultyID: '',
    name: '',
    designation: '',
    dept: '',
    email: '',
    extension: '',
    type: '',
    order: '',
  });
  const apiUrl = getEnvironment();

  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  const fetchData = async () => {
    try {
      const timetableResponse = await fetch(`${apiUrl}/timetablemodule/timetable`, { credentials: 'include' });
      if (!timetableResponse.ok) {
        throw new Error(`Error: ${timetableResponse.status} - ${timetableResponse.statusText}`);
      }
      const timetableData = await timetableResponse.json();

      const filteredData = timetableData.filter((row) => row.code === currentCode);
      setTimeTableData(filteredData);

      if (filteredData.length > 0) {
        setDepartment(filteredData[0].dept);
      }

      const facultyResponse = await fetch(`${apiUrl}/timetablemodule/faculty`, { credentials: 'include' });
      if (!facultyResponse.ok) {
        throw new Error(`Error: ${facultyResponse.status} - ${facultyResponse.statusText}`);
      }
      const facultyData = await facultyResponse.json();

      const facultyWithSameDept = facultyData.filter((faculty) => faculty.dept === department);
      setTableData(facultyWithSameDept.reverse());
    } catch (error) {
      console.error('Error:', error);
    }
  };


  useEffect(() => {
    fetchData();
  }, [currentCode, department]);
  

  const handleEditClick = (_id) => {
    setEditRowId(_id);

    const editedRow = tableData.find((row) => row._id === _id);
    if (editedRow) {
      setEditedData({ ...editedRow });
    }
  };

  const handleSaveEdit = () => {
    if (editRowId) {
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
              _id: null,
              facultyID: '',
              name: '',
              designation: '',
              dept: '',
              email: '',
              extension: '',
              type: '',
              order: '',
            });
          })
          .catch((error) => {
            console.error('Update Error:', error);
          });
      }
    }
  };

  const handleDelete = (_id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this entry?');

    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/faculty/${_id}`, {
        method: 'DELETE',
        credentials: 'include',
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

  const handleCancelAddFaculty = () => {
    setIsAddFacultyFormVisible(false);
  };

  const handleAddFaculty = () => {
    setEditedData({
      facultyID: '',
      name: '',
      designation: '',
      dept: department, 
      email: '',
      extension: '',
      type: '',
      order: '',
    });
    setIsAddFacultyFormVisible(true);
  };
  

  const handleSaveNewFaculty = () => {
    const isDuplicate = tableData.some((row) => row.name === editedData.name);

    if (!editedData.facultyID || !editedData.name || !editedData.dept || !editedData.email || !editedData.designation) {
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
     <Header title='Master Faculty'></Header>

<div style={{ margin: '20px', padding: '20px', borderRadius: '8px' }}>
  {isAddFacultyFormVisible ? (
   <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
   <div style={{ display: 'flex', alignItems: 'center' }}>
     <span style={{ color: 'red', marginRight: '5px' }}>*</span>
     <label htmlFor="facultyID" style={{ color: '#333', fontWeight: 'bold' }}>Faculty ID : </label>
     <input
       type="text"
       id="facultyID"
       value={editedData.facultyID}
       onChange={(e) => setEditedData({ ...editedData, facultyID: e.target.value })}
     />
   </div>
   <div style={{ display: 'flex', alignItems: 'center' }}>
     <span style={{ color: 'red', marginRight: '5px' }}>*</span>
     <label htmlFor="name" style={{ color: '#333', fontWeight: 'bold' }}>Name : </label>
     <input
       type="text"
       id="name"
       value={editedData.name}
       onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
     />
   </div>
   <div style={{ display: 'flex', alignItems: 'center' }}>
    <span style={{ color: 'red', marginRight: '5px' }}>*</span>
    <label htmlFor="designation" style={{ color: '#333', fontWeight: 'bold' }}>Designation : </label>
    <input
      type="text"
      id="designation"
      value={editedData.designation}
      onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })}
    />
  </div>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <span style={{ color: 'red', marginRight: '5px' }}>*</span>
    <label htmlFor="dept" style={{ color: '#333', fontWeight: 'bold' }}>Dept : </label>
    <input
      type="text"
      id="dept"
      value={editedData.dept}
      onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })}
      disabled
    />
  </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '10px', height: '10px', marginRight: '5px', backgroundColor: '#fff' }}></div>
        <label htmlFor="type" style={{ color: '#333', fontWeight: 'bold' }}>Type : </label>
        <input
          type="text"
          id="type"
          value={editedData.type}
          onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '10px', height: '10px', marginRight: '5px', backgroundColor: '#fff' }}></div>
        <label htmlFor="email" style={{ color: '#333', fontWeight: 'bold' }}>Email : </label>
        <input
          type="text"
          id="email"
          value={editedData.email}
          onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '10px', height: '10px', marginRight: '5px', backgroundColor: '#fff' }}></div>
        <label htmlFor="extension" style={{ color: '#333', fontWeight: 'bold' }}>Extension : </label>
        <input
          type="text"
          id="extension"
          value={editedData.extension}
          onChange={(e) => setEditedData({ ...editedData, extension: e.target.value })}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '10px', height: '10px', marginRight: '5px', backgroundColor: '#fff' }}></div>
        <label htmlFor="extension" style={{ color: '#333', fontWeight: 'bold' }}>Order : </label>
        <input
          type="text"
          id="extension"
          value={editedData.order}
          placeholder="Enter number"
          onChange={(e) => setEditedData({ ...editedData, order: e.target.value })}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
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
            <th>Order</th>
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
              <td>{editRowId === row._id ? <input type="text" value={editedData.order} onChange={(e) => setEditedData({ ...editedData, order: e.target.value })} /> : row.order}</td>
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