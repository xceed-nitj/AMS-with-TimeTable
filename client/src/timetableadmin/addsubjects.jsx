import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import FileDownloadButton from '../filedownload/filedownload';
// import subjectFile from '../assets/subject_template';
import { Heading, Input } from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomBlueButton} from '../styles/customStyles'
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";


function Subject() {
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [semesterData, setSemesterData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [duplicateEntryMessage, setDuplicateEntryMessage] = useState('');
  const [duplicateEntries, setDuplicateEntries] = useState([]);
  const [isAddSubjectFormVisible, setIsAddSubjectFormVisible] = useState(false); 

  
  const [editedData, setEditedData] = useState({
    subjectFullName: '',
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
    subjectFullName: '',
    type: '',
    subCode: '',
    subName: '',
    sem: '',
    degree: '',
    dept:'',
    credits:'',
    code:currentCode
  });



  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchData();
  }, [currentCode]); // Trigger a fetch when the code changes

  const fetchData = () => {
    if (currentCode) {
    fetch(`${apiUrl}/timetablemodule/subject?code=${currentCode}`) // Replace with the actual endpoint
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const filteredData = data.filter((item) => item.code === currentCode);
        setTableData(filteredData);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    }
    else{
      setTableData([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

   // Fetch available semesters when the component mounts
   useEffect(() => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`) // Replace with the actual endpoint
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          // Assuming that the data is an array of semesters
          const filteredSemesters = data.filter((semester) => semester.code === currentCode);
          setSemesterData(filteredSemesters);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  }, [currentCode]);

  useEffect(() => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          const filteredSemesters = data.filter((semester) => semester.code === currentCode);
          setSemesters(filteredSemesters); // Store the semesters in the state
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  }, [currentCode]);

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('code', currentCode);
      setIsLoading(true);
  
      fetch(`${apiUrl}/upload/subject`, {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          setUploadState(true);
          setUploadMessage('File uploaded successfully');
          return response.json();
        })
        .then((data) => {
          if (data.duplicateSubjects && data.duplicateSubjects.length > 0) {
            const duplicateSubnames = data.duplicateSubjects;
            setDuplicateEntryMessage(`Duplicate entries found for: ${duplicateSubnames.join(', ')}`);
          } else {
            fetchData(); // Fetch data after a successful upload
            setDuplicateEntryMessage(''); // Reset duplicate entry message
          }
  
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error:', error);
          setIsLoading(false);
        })
        .finally(() => {
          setIsLoading(false);
          setTimeout(() => {
            setUploadMessage('');
          }, 3000);
        });
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };
  
  

  useEffect(() => {
    fetchData();
    if (uploadState) {
      // Only fetch data again when uploadState is true
      setUploadState(false); // Reset uploadState
    }
  }, [currentCode, uploadState]);


  

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
                  subjectFullName: '',
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

      const handleCancelAddSubject = () => {
        setIsAddSubjectFormVisible(false); 
      };

      const handleAddSubject = () => {
        setEditedSData({
          subjectFullName: '',
          type: '',
          subCode: '',
          subName: '',
          sem: '',
          degree: '',
          dept:'',
          credits:'',
          code:currentCode
        });
        setIsAddSubjectFormVisible(true); 
      };
    
      const handleSaveNewSubject = () => {
        // Check for duplicate entry by subjectName
        const isDuplicateEntry = tableData.some((row) => row.subName === editedSData.subName);
    
        if (isDuplicateEntry) {
          setDuplicateEntryMessage(`Duplicate entry for "${editedSData.subName}" is detected. Kindly delete the entry.`);
        } else {
          fetch(`${apiUrl}/timetablemodule/subject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(editedSData),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
              }
              return response.json();
            })
            .then((data) => {
              console.log('Data saved successfully:', data);
              fetchData();
              handleCancelAddSubject();
              setDuplicateEntryMessage(''); // Reset duplicate entry message
            })
            .catch((error) => {
              console.error('Error:', error);
            });
        }
      };

      const handleDeleteAll = () => {
        if (currentCode) {
          if (window.confirm("Are you sure you want to delete all entries with the current code?")) {
            fetch(`${apiUrl}/timetablemodule/subject/deletebycode/${currentCode}`, {
              method: 'DELETE',
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(`Error: ${response.status} - ${response.statusText}`);
                }
                return response.json();
              })
              .then((data) => {
                console.log('Delete All Success:', data);
                fetchData(); // Fetch data after a successful delete
              })
              .catch((error) => {
                console.error('Delete All Error:', error);
              });
          }
        }
      };

  return (
    <div>
      <Heading>Add Subject</Heading>
      Batch Upload:
    
      <Input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        name="XlsxFile"
      />
      <Button onClick={handleUpload}>Batch Upload</Button>
     
      <div>

        {uploadMessage && (
          <p>{uploadMessage}</p>
        )}
      </div>
   

      <FileDownloadButton
        fileUrl='/subject_template.xlsx'
        fileName="subject_template.xlsx"
      />

{duplicateEntryMessage && (
        <p style={{ color: 'red' }}>{duplicateEntryMessage}</p>
      )}
       {/* Display available semesters */}
       <div>
        <h3>Available Semesters which can to be added:</h3>
        <ul>
          {semesterData.map((semester) => (
            <li key={semester.code}>{semester.sem}</li>
          ))}
        </ul>
      </div>


<div>
        
        {isAddSubjectFormVisible ? ( 
          <div>
            <div>
              <label>Subject Abrreviation:</label>
              <input
                type="text"
                value={editedSData.subjectFullName}
                onChange={(e) => setEditedSData({ ...editedSData, subjectFullName: e.target.value })}
              />
            </div>
            <div>
              <label>Type:</label>
              <input
                type="text"
                value={editedSData.type}
                onChange={(e) => setEditedSData({ ...editedSData, type: e.target.value })}
              />
            </div>
            <div>
              <label>Subject Code:</label>
              <input
                type="text"
                value={editedSData.subCode}
                onChange={(e) => setEditedSData({ ...editedSData, subCode: e.target.value })}
              />
            </div>
            <div>
              <label>Subject Name:</label>
              <input
                type="text"
                value={editedSData.subName}
                onChange={(e) => setEditedSData({ ...editedSData, subName: e.target.value })}
              />
            </div>
            <div>
  <label>Semester:</label>
  <select
    value={editedSData.sem}
    onChange={(e) => setEditedSData({ ...editedSData, sem: e.target.value })}
  >
    <option value="">Select Semester</option>
    {semesters.map((semester) => (
      <option key={semester._id} value={semester.sem}>
        {semester.sem}
      </option>
    ))}
  </select>
</div>

            <div>
              <label>Degree:</label>
              <input
                type="text"
                value={editedSData.degree}
                onChange={(e) => setEditedSData({ ...editedSData, degree: e.target.value })}
              />
            </div>
            <div>
              <label>Department:</label>
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
            <div>
              <CustomBlueButton onClick={handleSaveNewSubject}>Save New Subject</CustomBlueButton>
              <CustomBlueButton onClick={handleCancelAddSubject}>Cancel</CustomBlueButton>
            </div>
          </div>
        ) : (
          <CustomBlueButton onClick={handleAddSubject}>Add Subject</CustomBlueButton>
        )}
      </div>


      <Button onClick={handleDeleteAll}>Delete All</Button>
 

      {/* Display the fetched data */}
      <h2>Table of Subject Data</h2>
      {isLoading ? ( // Check if data is loading
        <p>Loading data...</p>
      ) : (
      <table>
        <thead>
          <tr>
            <th>Subject Abrreviation</th>
            <th>Type</th>
            <th>Subject Code</th>
            <th>Subject Name</th>
            <th>Semester</th>
            <th>Degree</th>
            <th>Department</th>
            <th>Credits</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row._id}>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.subjectFullName} onChange={(e) => setEditedData({ ...editedData, subjectFullName: e.target.value })} /> : row.subjectFullName}</td>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.type} onChange={(e) => setEditedData({ ...editedData, type: e.target.value })} /> : row.type}</td>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.subCode} onChange={(e) => setEditedData({ ...editedData, subCode: e.target.value })} /> : row.subCode}</td>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.subName} onChange={(e) => setEditedData({ ...editedData, subName: e.target.value })} /> : row.subName}</td>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.sem} onChange={(e) => setEditedData({ ...editedData, sem: e.target.value })} /> : row.sem}</td>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.degree} onChange={(e) => setEditedData({ ...editedData, degree: e.target.value })} /> : row.degree}</td>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.dept} onChange={(e) => setEditedData({ ...editedData, dept: e.target.value })} /> : row.dept}</td>
              <td>{editRowId === row._id ? <Input type="text" value={editedData.credits} onChange={(e) => setEditedData({ ...editedData, credits: e.target.value })} /> : row.credits}</td>
            
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
       )}
     
  
    </div>
  );
}

export default Subject;
