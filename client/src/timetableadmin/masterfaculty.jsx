import React, { useState, useEffect } from "react";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";

import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomTealButton,
} from "../styles/customStyles";
import {
  Box,
  Container,
  FormControl,
  FormLabel,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import Header from "../components/header";

function Subject() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [isAddFacultyFormVisible, setIsAddFacultyFormVisible] = useState(false);
  const [editedData, setEditedData] = useState({
    facultyID: "",
    name: "",
    designation: "",
    dept: "",
    email: "",
    extension: "",
    type: "",
  });
  const apiUrl = getEnvironment();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(`${apiUrl}/timetablemodule/faculty`, { credentials: "include" }) // Replace with the actual endpoint
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
        console.error("Error:", error);
      });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("csvFile", selectedFile);

      fetch(`${apiUrl}/upload/faculty`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then((response) => response.json())
        .then(() => {
          fetchData();
          setSelectedFile(null);
        })
        .catch((error) => console.error("Error:", error));
    } else {
      alert("Please select a CSV file before uploading.");
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
              facultyID: "",
              name: "",
              designation: "",
              dept: "",
              email: "",
              extension: "",
              type: "",
            });
          })
          .catch((error) => {
            console.error("Update Error:", error);
          });
      }
    }
  };

  // ...

  const handleDelete = (_id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entry?"
    );

    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/faculty/${_id}`, {
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
          console.log("Delete Success:", data);
          const updatedData = tableData.filter((row) => row._id !== _id);
          setTableData(updatedData);
        })
        .catch((error) => {
          console.error("Delete Error:", error);
        });
    }
  };

  // ...

  const handleCancelAddFaculty = () => {
    setIsAddFacultyFormVisible(false);
  };

  const handleAddFaculty = () => {
    setEditedData({
      facultyID: "",
      name: "",
      designation: "",
      dept: "",
      email: "",
      extension: "",
      type: "",
    });
    setIsAddFacultyFormVisible(true);
  };

  const handleSaveNewFaculty = () => {
    fetch(`${apiUrl}/timetablemodule/faculty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editedData),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data saved successfully:", data);
        fetchData();
        handleCancelAddFaculty();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <Container maxW="8xl">
      {/* <h1>Master Faculty </h1> */}
      <Header title="Master Faculty"></Header>
      <Text as="b">Batch Upload</Text>
      <FormControl display="flex">
        <Input
          type="file"
          px="1"
          py="1"
          accept=".xlsx"
          onChange={handleFileChange}
          name="csvFile"
        />
        <CustomTealButton width='200px' ml='5' onClick={handleUpload}>Upload Xlsx</CustomTealButton>
      </FormControl>
      <FileDownloadButton
        fileUrl="/faculty_template.xlsx"
        fileName="faculty_template.xlsx"
      />
      <FormControl>
        {isAddFacultyFormVisible ? (
          <Box mt="4">
            <Box>
              <FormLabel>Faculty ID: </FormLabel>
              <Input
                type="text"
                mb="4"
                value={editedData.facultyID}
                onChange={(e) =>
                  setEditedData({ ...editedData, facultyID: e.target.value })
                }
              />
            </Box>
            <Box>
              <FormLabel>Name: </FormLabel>
              <Input
                type="text"
                mb="4"
                value={editedData.name}
                onChange={(e) =>
                  setEditedData({ ...editedData, name: e.target.value })
                }
              />
            </Box>
            <Box>
              <FormLabel>Designation: </FormLabel>
              <Input
                type="text"
                mb="4"
                value={editedData.designation}
                onChange={(e) =>
                  setEditedData({ ...editedData, designation: e.target.value })
                }
              />
            </Box>
            <Box>
              <FormLabel>Dept: </FormLabel>
              <Input
                type="text"
                mb="4"
                value={editedData.dept}
                onChange={(e) =>
                  setEditedData({ ...editedData, dept: e.target.value })
                }
              />
            </Box>
            <Box>
              <FormLabel>Type: </FormLabel>
              <Input
                type="text"
                mb="4"
                value={editedData.type}
                onChange={(e) =>
                  setEditedData({ ...editedData, type: e.target.value })
                }
              />
            </Box>
            <Box>
              <FormLabel>Email: </FormLabel>
              <Input
                type="text"
                mb="4"
                value={editedData.email}
                onChange={(e) =>
                  setEditedData({ ...editedData, email: e.target.value })
                }
              />
            </Box>
            <Box>
              <FormLabel>Extension: </FormLabel>
              <Input
                type="text"
                mb="4"
                value={editedData.extension}
                onChange={(e) =>
                  setEditedData({ ...editedData, extension: e.target.value })
                }
              />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <CustomBlueButton onClick={handleCancelAddFaculty}>
                Cancel
              </CustomBlueButton>
              <CustomBlueButton onClick={handleSaveNewFaculty}>
                Save New Faculty
              </CustomBlueButton>
            </Box>
          </Box>
        ) : (
          <CustomBlueButton onClick={handleAddFaculty}>
            Add Faculty
          </CustomBlueButton>
        )}
      </FormControl>

      <Text>Table of Faculty Data</Text>
      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>FacultyID</Th>
              <Th>Name</Th>
              <Th>Designation</Th>
              <Th>Dept</Th>
              <Th>Type</Th>
              <Th>Email</Th>
              <Th>Extension</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tableData.map((row) => (
              <Tr key={row._id}>
                <Td>
                  {editRowId === row._id ? (
                    <Input
                      type="text"
                      value={editedData.facultyID}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          facultyID: e.target.value,
                        })
                      }
                    />
                  ) : (
                    row.facultyID
                  )}
                </Td>
                <Td>
                  {editRowId === row._id ? (
                    <Input
                      type="text"
                      value={editedData.name}
                      onChange={(e) =>
                        setEditedData({ ...editedData, name: e.target.value })
                      }
                    />
                  ) : (
                    row.name
                  )}
                </Td>
                <Td>
                  {editRowId === row._id ? (
                    <Input
                      type="text"
                      value={editedData.designation}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          designation: e.target.value,
                        })
                      }
                    />
                  ) : (
                    row.designation
                  )}
                </Td>
                <Td>
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
                </Td>
                <Td>
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
                </Td>
                <Td>
                  {editRowId === row._id ? (
                    <Input
                      type="text"
                      value={editedData.email}
                      onChange={(e) =>
                        setEditedData({ ...editedData, email: e.target.value })
                      }
                    />
                  ) : (
                    row.email
                  )}
                </Td>
                <Td>
                  {editRowId === row._id ? (
                    <Input
                      type="text"
                      value={editedData.extension}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          extension: e.target.value,
                        })
                      }
                    />
                  ) : (
                    row.extension
                  )}
                </Td>
                <Td>
                  {editRowId === row._id ? (
                    <CustomBlueButton onClick={handleSaveEdit}>
                      Save
                    </CustomBlueButton>
                  ) : (
                    <Box>
                      <CustomBlueButton
                        onClick={() => handleEditClick(row._id)}
                      >
                        Edit
                      </CustomBlueButton>
                      <CustomBlueButton onClick={() => handleDelete(row._id)}>
                        Delete
                      </CustomBlueButton>
                    </Box>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Subject;
1;
