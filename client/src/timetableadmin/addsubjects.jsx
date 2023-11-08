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
} from "@chakra-ui/react";
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomDeleteButton,
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
  const [duplicateEntryMessage, setDuplicateEntryMessage] = useState("");
  const [isAddSubjectFormVisible, setIsAddSubjectFormVisible] = useState(false);

  const [editedData, setEditedData] = useState({
    subjectFullName: "",
    type: "",
    subCode: "",
    subName: "",
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
    sem: "",
    degree: "",
    dept: "",
    credits: "",
    code: currentCode,
  });

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchData();
  }, [currentCode]); // Trigger a fetch when the code changes

  const fetchData = () => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/subject?code=${currentCode}`, {
        credentials: "include",
      }) // Replace with the actual endpoint
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

  // Fetch available semesters when the component mounts
  useEffect(() => {
    if (currentCode) {
      fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, {
        credentials: "include",
      }) // Replace with the actual endpoint
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          // Assuming that the data is an array of semesters
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
          setSemesters(filteredSemesters); // Store the semesters in the state
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [currentCode]);
  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("csvFile", selectedFile);
      formData.append("code", currentCode);
      setIsLoading(true);

      fetch(`${apiUrl}/upload/subject`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
          }
          setUploadState(true);
          setUploadMessage("File uploaded successfully");
          return response.json();
        })
        .then((data) => {
          console.log(data); // Handle the response from the server

          // Check for duplicate entries after the batch upload
          const duplicateEntries = data.filter((entry) => {
            return tableData.some(
              (row) => row.subjectFullName === entry.subjectFullName
            );
          });

          if (duplicateEntries.length > 0) {
            const duplicateEntryMessage = `Duplicate entries detected for the following subjects: ${duplicateEntries
              .map((entry) => entry.subjectFullName)
              .join(", ")}. Kindly delete these entries.`;
            setDuplicateEntryMessage(duplicateEntryMessage);
          } else {
            fetchData(); // Fetch data after a successful upload
            setDuplicateEntryMessage(""); // Reset duplicate entry message
          }

          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          setIsLoading(false);
        })
        .finally(() => {
          setIsLoading(false);
          setTimeout(() => {
            setUploadMessage("");
          }, 3000);
        });
    } else {
      alert("Please select a CSV file before uploading.");
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
            console.log("Update Success:", data);
            setTableData(updatedData);
            setEditRowId(null);
            setEditedData({
              _id: null, // Clear the edited data
              subjectFullName: "",
              type: "",
              subCode: "",
              subName: "",
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
    // Send a DELETE request to remove the selected row
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
        console.log("Delete Success:", data);
        // Remove the deleted row from the tableData
        const updatedData = tableData.filter((row) => row._id !== _id);
        setTableData(updatedData);
      })
      .catch((error) => {
        console.error("Delete Error:", error);
      });
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
      sem: "",
      degree: "",
      dept: "",
      credits: "",
      code: currentCode,
    });
    setIsAddSubjectFormVisible(true);
  };

  const handleSaveNewSubject = () => {
    // Check for duplicate entry by subjectName
    const isDuplicateEntry = tableData.some(
      (row) => row.subjectFullName === editedSData.subjectFullName
    );

    if (isDuplicateEntry) {
      setDuplicateEntryMessage(
        `Duplicate entry for "${editedSData.subjectFullName}" is detected. Kindly delete the entry.`
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
          console.log("Data saved successfully:", data);
          fetchData();
          handleCancelAddSubject();
          setDuplicateEntryMessage(""); // Reset duplicate entry message
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
            console.log("Delete All Success:", data);
            fetchData(); // Fetch data after a successful delete
          })
          .catch((error) => {
            console.error("Delete All Error:", error);
          });
      }
    }
  };
  return (
    <Container maxW="7xl">
      <Heading as="h1" size="xl" mt="6" mb="6">
        Add Subject
      </Heading>
      {/* <p fontWeight='Bold'>Batch Upload:</p> */}
      Batch Upload:
      <Box mb="2" mt="2" display="flex">
        <Input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          name="XlsxFile"
        />

        <CustomBlueButton
          mt="-1"
          size="xl"
          py="0"
          w="200px"
          h="50"
          onClick={handleUpload}
        >
          Batch Upload
        </CustomBlueButton>
      </Box>
      <Box>{uploadMessage && <p>{uploadMessage}</p>}</Box>
      <Box display="flex" justifyContent="space-between">
        {duplicateEntryMessage && <p>{duplicateEntryMessage}</p>}

        <Box mt="5">
          <Heading as="h6" fontSize="xl" fontWeight="Bold">
            Available Semesters which can to be added:
          </Heading>
          <ul>
            {semesterData.map((semester) => (
              <li key={semester.code}>{semester.sem}</li>
            ))}
          </ul>
        </Box>
        <Box mr="3.5">
          <FileDownloadButton
            fileUrl="/subject_template.xlsx"
            fileName="subject_template.xlsx"
          />
        </Box>
      </Box>
      <Box>
        {isAddSubjectFormVisible ? (
          <FormControl borderRadius="md">
            <Box display="flex" content="left">
              <FormLabel>Subject Name:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                type="text"
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

            <Box display="flex" content="left">
              <FormLabel>Type:</FormLabel>
              <Input
                mb="4"
                ml="3"
                border="1px"
                borderColor="gray.300"
                type="text"
                placeholder="Type"
                value={editedSData.type}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, type: e.target.value })
                }
              />
            </Box>

            <Box display="flex" content="left">
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

            <Box display="flex" content="left">
              <FormLabel>Subject Abrreviation:</FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                type="text"
                placeholder="Subject Abrreviation"
                value={editedSData.subName}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, subName: e.target.value })
                }
              />
            </Box>

            <Box display="flex" content="left">
              <FormLabel>Semester:</FormLabel>
              <select
                mb="4"
                value={editedSData.sem}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, sem: e.target.value })
                }
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester.sem}>
                    {semester.sem}
                  </option>
                ))}
              </select>
            </Box>

            <Box display="flex" content="left">
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

            <Box display="flex" content="left">
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

            <Box display="flex" content="left">
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

            <Box>
              <CustomBlueButton onClick={handleSaveNewSubject}>
                Save New Subject
              </CustomBlueButton>
              <CustomBlueButton onClick={handleCancelAddSubject}>
                Cancel
              </CustomBlueButton>
            </Box>
          </FormControl>
        ) : (
          <CustomBlueButton ml="0" onClick={handleAddSubject}>
            Add Subject
          </CustomBlueButton>
        )}
      </Box>
      {duplicateEntryMessage && <p>{duplicateEntryMessage}</p>}
      <CustomDeleteButton ml="0" onClick={handleDeleteAll}>
        Delete All
      </CustomDeleteButton>
      {/* Display the fetched data */}
      <h2>Table of Subject Data</h2>
      {isLoading ? ( // Check if data is loading
        <p>Loading data...</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Subject Name</th>
              <th>Type</th>
              <th>Subject Code</th>
              <th>Subject Abrreviation</th>
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
                <td>
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
                </td>
                <td>
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
                </td>
                <td>
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
                </td>
                <td>
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
                </td>
                <td>
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
                </td>
                <td>
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
                </td>
                <td>
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
                </td>
                <td>
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
                </td>

                <td>
                  {editRowId === row._id ? (
                    <CustomBlueButton onClick={handleSaveEdit}>
                      Save
                    </CustomBlueButton>
                  ) : (
                    <>
                      <CustomBlueButton
                        onClick={() => handleEditClick(row._id)}
                      >
                        Edit
                      </CustomBlueButton>
                      <CustomBlueButton onClick={() => handleDelete(row._id)}>
                        Delete
                      </CustomBlueButton>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default Subject;
