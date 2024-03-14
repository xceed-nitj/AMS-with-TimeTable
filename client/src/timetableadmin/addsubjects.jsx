import React, { useState, useEffect } from "react";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";
// import subjectFile from '../assets/subject_template';
import {
  Container,
  Heading,
  Input,
  Box,
  FormLabel,
  FormControl,
  Select,
  UnorderedList,
  Text,
  Center,
} from "@chakra-ui/react";
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomDeleteButton,
  CustomTealButton,
} from "../styles/customStyles";

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
import Header from '../components/header';


function Subject() {
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [semesterData, setSemesterData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isStudentCountValid, setIsStudentCountValid] = useState(true);
  const [duplicateEntryMessage, setDuplicateEntryMessage] = useState("");
  const [addduplicateEntryMessage, addsetDuplicateEntryMessage] = useState("");
  const [isAddSubjectFormVisible, setIsAddSubjectFormVisible] = useState(false);

  const [editedData, setEditedData] = useState({
    subjectFullName: "",
    type: "",
    subCode: "",
    subName: "",
    studentCount: "",
    sem: "",
    degree: "",
    dept: "",
    credits: "",
    code: currentCode,
  });
  
  const [editedSData, setEditedSData] = useState({
    subjectFullName: "",
    type: "",
    subCode: "",
    subName: "",
    studentCount: "",
    sem: "",
    degree: "",
    dept: "",
    credits: "",
    code: currentCode,
  });
  

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchData();
  }, [currentCode]); 

  const fetchData = () => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/subject?code=${currentCode}`, {
        credentials: "include",
      }) 
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );

          }
          return response.json();
        })
        .then((data) => {
          const filteredData = data.filter((item) => item.code === currentCode);
          setTableData(filteredData);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } else {

      setTableData([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  useEffect(() => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, {
        credentials: "include",
      }) 

        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          const filteredSemesters = data.filter(
            (semester) => semester.code === currentCode
          );
          setSemesterData(filteredSemesters);
        })
        .catch((error) => {
          console.error("Error:", error);
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
        credentials: 'include',
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
          if (data.message) {
            if(data.message.includes('type')) setUploadMessage(data.message);
            else
            setDuplicateEntryMessage(data.message);
            
          } else {
            fetchData(); 
            setDuplicateEntryMessage(''); 
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
          }, 4000);
        });
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };
  
  useEffect(() => {
    fetchData();
    if (uploadState) {
      setUploadState(false);
    }
  }, [currentCode, uploadState]);

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

        fetch(`${apiUrl}/timetablemodule/subject/${editRowId}`, {

          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedData),
          credentials: "include",

        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Error: ${response.status} - ${response.statusText}`
              );
            }
            return response.json();
          })
          .then((data) => {

            // console.log("Update Success:", data);

            setTableData(updatedData);
            setEditRowId(null);
            setEditedData({
              _id: null, 

              subjectFullName: "",
              type: "",
              subCode: "",
              subName: "",
              studentCount: "",
              sem: "",
              degree: "",
              dept: "",
              credits: "",
              code: currentCode,
            });
          })
          .catch((error) => {
            console.error("Update Error:", error);

          });
      }
    }
  };

  const handleDelete = (_id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this entry?");
    
    if (isConfirmed) {
      fetch(`${apiUrl}/timetablemodule/subject/${_id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          // console.log("Delete Success:", data);
          const updatedData = tableData.filter((row) => row._id !== _id);
          setTableData(updatedData);
        })
        .catch((error) => {
          console.error("Delete Error:", error);
        });
    }
  };
  
  const handleCancelAddSubject = () => {
    setIsAddSubjectFormVisible(false);
  };

  const handleAddSubject = () => {
    setEditedSData({

      subjectFullName: "",
      type: "",
      subCode: "",
      subName: "",
      studentCount: "",
      sem: "",
      degree: "",
      dept: "",
      credits: "",
      code: currentCode,

    });
    setIsAddSubjectFormVisible(true);
  };

  const handleSaveNewSubject = () => {
    const isDuplicateEntry = tableData.some(
      (row) => row.subName === editedSData.subName
    );

    if (isDuplicateEntry) {
      addsetDuplicateEntryMessage(
        `Duplicate entry for "${editedSData.subName}" is detected. Kindly delete the entry.`
      );
    } else {
      fetch(`${apiUrl}/timetablemodule/subject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedSData),
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );

          }
          return response.json();
        })
        .then((data) => {

          // console.log("Data saved successfully:", data);
          fetchData();
          handleCancelAddSubject();
          addsetDuplicateEntryMessage(""); 
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  };


  const handleDeleteAll = () => {
    if (currentCode) {
      if (
        window.confirm(
          "Are you sure you want to delete all entries with the current code?"
        )
      ) {
        fetch(`${apiUrl}/timetablemodule/subject/deletebycode/${currentCode}`, {
          method: "DELETE",
          credentials: "include",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Error: ${response.status} - ${response.statusText}`
              );
            }
            return response.json();
          })
          .then((data) => {
            // console.log("Delete All Success:", data);
            fetchData(); 
          })
          .catch((error) => {
            console.error("Delete All Error:", error);
          });
      }
    }
  };
  return (
    <Container maxW='8xl'>
      {/* <Heading as="h1" size="xl" mt="6" mb="6">Add Subject</Heading> */}
      <Header title='Add Subject' />
      {/* <p fontWeight='Bold'>Batch Upload:</p> */}
      Batch Upload:
      <Box mb="2" mt="2" display="flex">

        <Input
          py='1'
          px='2'
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          name="XlsxFile"
        />


        <CustomTealButton
          mt="-0.8"
          ml='2'
          size="xl"
          py="0"
          w="200px"
          h="41"
          onClick={handleUpload}
        >
          Batch Upload
        </CustomTealButton>
      </Box>
      
      <Box>{uploadMessage && <p>{uploadMessage}</p>}</Box>
      <Box display="flex" justifyContent="space-between">
        {duplicateEntryMessage && <p>{duplicateEntryMessage}</p>}

        <Box mt='1'>
          <Heading as="h6" fontSize="xl" fontWeight="Bold">
            Available Semesters which can be added:
          </Heading>
          <UnorderedList>
            {semesterData.map((semester) => (
              <li key={semester.code}>{semester.sem}</li>
            ))}
          </UnorderedList>
        </Box>
        <Box mr="-1.5">
          <FileDownloadButton
            fileUrl="/subject_template.xlsx"
            fileName="subject_template.xlsx"
          />
        </Box>
      </Box>
      <Box>
        {isAddSubjectFormVisible ? (
          <FormControl borderRadius="md" >
            <Box mt='4'>
              <FormLabel>Subject Full Name:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                type="text"
                mb='4'
                placeholder="Subject"
                value={editedSData.subjectFullName}
                onChange={(e) =>
                  setEditedSData({
                    ...editedSData,
                    subjectFullName: e.target.value,
                  })
                }
              />
            </Box>

            <Box>
              <FormLabel>Type:</FormLabel>
              <Input
                mb="4"
                border="1px"
                borderColor="gray.300"
                type="text"
                placeholder="Core/Elective"
                value={editedSData.type}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, type: e.target.value })
                }
              />
            </Box>

            <Box>
              <FormLabel>Subject Code:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                mb="4"
                type="text"
                placeholder="Subject Code"
                value={editedSData.subCode}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, subCode: e.target.value })
                }
              />
            </Box>

            <Box>
              <FormLabel>Subject Abbreviation:</FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                type="text"
                placeholder="Subject Name"
                value={editedSData.subName}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, subName: e.target.value })
                }
              />

            </Box>

            <Box>
              <FormLabel>Student Count:</FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor={isStudentCountValid ? "gray.300" : "red.500"}
                type="text"
                pattern="[0-9]*"
                placeholder="Students Count"
                value={editedSData.studentCount}
                onChange={(e) => {
                  const input = e.target.value;
                  if (/^\d*$/.test(input)) {  // Check if input is a valid number
                    setIsStudentCountValid(true);
                    setEditedSData({ ...editedSData, studentCount: input });
                  } else {
                    setIsStudentCountValid(false);
                  }
                }}
              />
              {!isStudentCountValid && (
                <Text color="red.500">Please enter a valid student count (numbers only).</Text>
              )}
            </Box>

            <Box mb="4">
              <FormLabel>Semester:</FormLabel>
              <Select
                value={editedSData.sem}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, sem: e.target.value })
                }

              >
                <option value="">Select Semester</option>
                {semesterData.map((semester) => (
                  <option key={semester._id} value={semester.sem}>
                    {semester.sem}
                  </option>
                ))}
              </Select>

            </Box>

            <Box>
              <FormLabel>Degree:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                mb="4"

                type="text"
                placeholder="Degree"
                value={editedSData.degree}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, degree: e.target.value })
                }
              />
            </Box>

            <Box>
              <FormLabel>Department:</FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                type="text"
                placeholder="Department"
                value={editedSData.dept}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, dept: e.target.value })
                }
              />
            </Box>


            <Box>
              <FormLabel>Credits: </FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                type="number" // Assuming it's a number
                placeholder="Credits"
                value={editedSData.credits}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, credits: e.target.value })
                }
              />

            </Box>

            <Box  display='flex' justifyContent='space-between'>
              <CustomBlueButton width='36' onClick={handleCancelAddSubject}>
                Cancel
              </CustomBlueButton>
              <CustomBlueButton onClick={handleSaveNewSubject}>
                Save New Subject
              </CustomBlueButton>
            </Box>
          </FormControl>
        ) : (
          <CustomTealButton  w='150px' mb='5' mt='3' onClick={handleAddSubject}>
            Add Subject
          </CustomTealButton>

        )}
      </Box>
      {addduplicateEntryMessage && <p>{addduplicateEntryMessage}</p>}
      <CustomDeleteButton ml='0' width='150px' onClick={handleDeleteAll}>
        Delete All
      </CustomDeleteButton>

      <TableContainer mt='2'>
        <Text as='b'>Subject Data(Total Entries: {tableData.length}):</Text>
        {/* Display the fetched data */}
        {isLoading ? ( // Check if data is loading
          <Text>Loading data...</Text>
          ) : (
            <Table
            mt='5'
            variant='striped'
            >
            <Thead>
              <Tr>
              <Th>Subject Full Name</Th>
                <Th><Center>Type</Center></Th>
                <Th><Center>Subject Code</Center></Th>
                <Th><Center>Subject Abbreviation</Center></Th>
                <Th><Center>Student Count</Center></Th>
                <Th><Center>Semester</Center></Th>
                <Th><Center>Degree</Center></Th>
                <Th><Center>Department</Center></Th>
                {/* <Th><Center>Credits</Center></Th> */}
                <Th><Center>Actions</Center></Th>
              </Tr>
            </Thead>
            <Tbody>
              {tableData.map((row) => (
                <Tr key={row._id}>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                        type="text"
                        value={editedData.subjectFullName}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            subjectFullName: e.target.value,
                            })
                          }
                          />
                      ) : (
                        row.subjectFullName
                        )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                        type="text"
                        value={editedData.type}
                        onChange={(e) =>
                          setEditedData({ ...editedData, type: e.target.value })
                          }
                        />
                      ) : (
                        row.type
                        )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                        type="text"
                        value={editedData.subCode}
                        onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              subCode: e.target.value,
                            })
                          }
                          />
                          ) : (
                            row.subCode
                          )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.subName}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              subName: e.target.value,
                            })
                          }
                          />
                      ) : (
                        row.subName
                        )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="number"
                          value={editedData.studentCount}
                          onChange={(e) =>
                            setEditedData({ ...editedData, studentCount: e.target.value })
                          }
                          />
                          ) : (
                            row.studentCount
                            )}
                    </Center>
                  </Td> 
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                        type="text"
                        value={editedData.sem}
                        onChange={(e) =>
                          setEditedData({ ...editedData, sem: e.target.value })
                        }
                        />
                        ) : (
                          row.sem
                          )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.degree}
                          onChange={(e) =>
                            setEditedData({ ...editedData, degree: e.target.value })
                          }
                          />
                          ) : (
                            row.degree
                            )}
                    </Center>
                  </Td>
                   <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.dept}
                          onChange={(e) =>
                            setEditedData({ ...editedData, dept: e.target.value })
                          }
                          />
                          ) : (
                            row.dept
                            )}
                    </Center>
                  </Td> 
                 
                  {/* <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.credits}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              credits: e.target.value,
                            })
                          }
                          />
                          ) : (
                            row.credits
                      )}
                    </Center>
                  </Td> */}
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <CustomBlueButton onClick={handleSaveEdit}>
                          Save
                        </CustomBlueButton>
                      ) : (
                        <>
                          <CustomTealButton
                            onClick={() => handleEditClick(row._id)}
                          >
                            Edit
                          </CustomTealButton>
                          <CustomDeleteButton onClick={() => handleDelete(row._id)}>
                            Delete
                          </CustomDeleteButton>
                        </>
                      )}
                    </Center>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </TableContainer>

    </Container>
  );
}

export default Subject;
