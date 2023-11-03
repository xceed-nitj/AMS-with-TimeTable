import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';

import { CustomTh, CustomLink, CustomBlueButton } from '../styles/customStyles';

function MasterSemester() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [masterSems, setMasterSems] = useState([]);
  const [editedSemester, setEditedSemester] = useState({
    sem: '',
    type: '',
    dept: '',
    degree: '',
  });
  const [editSemesterId, setEditSemesterId] = useState(null);
  const [isAddSemesterFormVisible, setIsAddSemesterFormVisible] = useState(false);

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchMasterSemesters();
  }, []);

  const fetchMasterSemesters = () => {
    fetch(`${apiUrl}/timetablemodule/mastersem`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setMasterSems(data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleAddSemester = () => {
    setEditedSemester({
      sem: '',
      type: '',
      dept: '',
      degree: '',
    });
    setIsAddSemesterFormVisible(true);
  };

  const handleCancelAddSemester = () => {
    setIsAddSemesterFormVisible(false);
  };

  const handleSaveNewSemester = () => {
    fetch(`${apiUrl}/timetablemodule/mastersem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedSemester),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Data saved successfully:', data);
        fetchMasterSemesters();
        handleCancelAddSemester();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleEditClick = (_id) => {
    setEditSemesterId(_id);
    const editedRow = masterSems.find((semester) => semester._id === _id);
    if (editedRow) {
      setEditedSemester({ ...editedRow });
    }
  };

  const handleSaveEdit = () => {
    if (editSemesterId) {
      const rowIndex = masterSems.findIndex((semester) => semester._id === editSemesterId);
      if (rowIndex !== -1) {
        const updatedData = [...masterSems];
        updatedData[rowIndex] = editedSemester;

        fetch(`${apiUrl}/timetablemodule/mastersem/${editSemesterId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editedSemester),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log('Update Success:', data);
            setMasterSems(updatedData);
            setEditSemesterId(null);
            setEditedSemester({
              sem: '',
              type: '',
              dept: '',
              degree: '',
            });
          })
          .catch((error) => {
            console.error('Update Error:', error);
          });
      }
    }
  };

  const handleDelete = (_id) => {
    fetch(`${apiUrl}/timetablemodule/mastersem/${_id}`, {
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
        const updatedData = masterSems.filter((semester) => semester._id !== _id);
        setMasterSems(updatedData);
      })
      .catch((error) => {
        console.error('Delete Error:', error);
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

      fetch(`${apiUrl}/upload/mastersem`, {
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
          fetchData(); 
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
      <h1>Manage Master Semesters</h1>
      <h2>Batch Upload</h2>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        name="XlsxFile"
      />
      <CustomBlueButton onClick={handleUpload}>Upload Xlsx</CustomBlueButton>
      <div>
    
    <FileDownloadButton
      fileUrl='/room_template.xlsx'
      fileName="room_template.xlsx"
    />
  </div>
      <div>
        {isAddSemesterFormVisible ? (
          <div>
            <div>
              <label>Semester:</label>
              <input
                type="text"
                value={editedSemester.sem}
                onChange={(e) => setEditedSemester({ ...editedSemester, sem: e.target.value })}
              />
            </div>
            <div>
              <label>Type:</label>
              <input
                type="text"
                value={editedSemester.type}
                onChange={(e) => setEditedSemester({ ...editedSemester, type: e.target.value })}
              />
            </div>
            <div>
              <label>Department:</label>
              <input
                type="text"
                value={editedSemester.dept}
                onChange={(e) => setEditedSemester({ ...editedSemester, dept: e.target.value })}
              />
            </div>
            <div>
              <label>Degree:</label>
              <input
                type="text"
                value={editedSemester.degree}
                onChange={(e) => setEditedSemester({ ...editedSemester, degree: e.target.value })}
              />
            </div>
            <div>
              <CustomBlueButton onClick={handleSaveNewSemester}>Save New Semester</CustomBlueButton>
              <CustomBlueButton onClick={handleCancelAddSemester}>Cancel</CustomBlueButton>
            </div>
          </div>
        ) : (
          <CustomBlueButton onClick={handleAddSemester}>Add Master Semester</CustomBlueButton>
        )}
      </div>

      <h2>Master Semesters Data</h2>
      <table>
        <thead>
          <tr>
            <th>Semester</th>
            <th>Type</th>
            <th>Department</th>
            <th>Degree</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {masterSems.map((semester) => (
            <tr key={semester._id}>
              <td>
                {editSemesterId === semester._id ? (
                  <input
                    type="text"
                    value={editedSemester.sem}
                    onChange={(e) => setEditedSemester({ ...editedSemester, sem: e.target.value })}
                  />
                ) : (
                  semester.sem
                )}
              </td>
              <td>
                {editSemesterId === semester._id ? (
                  <input
                    type="text"
                    value={editedSemester.type}
                    onChange={(e) => setEditedSemester({ ...editedSemester, type: e.target.value })}
                  />
                ) : (
                  semester.type
                )}
              </td>
              <td>
                {editSemesterId === semester._id ? (
                  <input
                    type="text"
                    value={editedSemester.dept}
                    onChange={(e) => setEditedSemester({ ...editedSemester, dept: e.target.value })}
                  />
                ) : (
                  semester.dept
                )}
              </td>
              <td>
                {editSemesterId === semester._id ? (
                  <input
                    type="text"
                    value={editedSemester.degree}
                    onChange={(e) => setEditedSemester({ ...editedSemester, degree: e.target.value })}
                  />
                ) : (
                  semester.degree
                )}
              </td>
              <td>
                {editSemesterId === semester._id ? (
                  <CustomBlueButton onClick={handleSaveEdit}>Save</CustomBlueButton>
                ) : (
                  <>
                    <CustomBlueButton onClick={() => handleEditClick(semester._id)}>Edit</CustomBlueButton>
                    <CustomBlueButton onClick={() => handleDelete(semester._id)}>Delete</CustomBlueButton>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MasterSemester;
