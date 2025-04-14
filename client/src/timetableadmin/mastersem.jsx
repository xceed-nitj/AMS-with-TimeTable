import React, { useState, useEffect } from "react";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";

import { CustomTh, CustomLink, CustomBlueButton, CustomDeleteButton } from "../styles/customStyles";
import Header from "../components/header";
import {
  Box,
  Center,
  Container,
  FormControl,
  FormLabel,
  Input,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

function MasterSemester() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [masterSems, setMasterSems] = useState([]);
  const [editedSemester, setEditedSemester] = useState({
    sem: "",
    type: "",
    dept: "",
    degree: "",
    year:"",
  });
  const [editSemesterId, setEditSemesterId] = useState(null);
  const [isAddSemesterFormVisible, setIsAddSemesterFormVisible] =
    useState(false);

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchMasterSemesters();
  }, []);

  const fetchMasterSemesters = () => {
    fetch(`${apiUrl}/timetablemodule/mastersem`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        setMasterSems(data.reverse());
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleAddSemester = () => {
    setEditedSemester({
      sem: "",
      type: "",
      dept: "",
      degree: "",
      year:"",
    });
    setIsAddSemesterFormVisible(true);
  };

  const handleCancelAddSemester = () => {
    setIsAddSemesterFormVisible(false);
  };

  const handleSaveNewSemester = () => {
    fetch(`${apiUrl}/timetablemodule/mastersem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editedSemester),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data saved successfully:", data);
        fetchMasterSemesters();
        handleCancelAddSemester();
      })
      .catch((error) => {
        console.error("Error:", error);
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
      const rowIndex = masterSems.findIndex(
        (semester) => semester._id === editSemesterId
      );
      if (rowIndex !== -1) {
        const updatedData = [...masterSems];
        updatedData[rowIndex] = editedSemester;

        fetch(`${apiUrl}/timetablemodule/mastersem/${editSemesterId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedSemester),
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
            setMasterSems(updatedData);
            setEditSemesterId(null);
            setEditedSemester({
              sem: "",
              type: "",
              dept: "",
              degree: "",
              year:"",
            });
          })
          .catch((error) => {
            console.error("Update Error:", error);
          });
      }
    }
  };

  const handleDelete = (_id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entry?"
    );

    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/mastersem/${_id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Delete Success:", data);
          const updatedData = masterSems.filter(
            (semester) => semester._id !== _id
          );
          setMasterSems(updatedData);
        })
        .catch((error) => {
          console.error("Delete Error:", error);
        });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("csvFile", selectedFile);

      fetch(`${apiUrl}/upload/mastersem`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then((response) => response.json())
        .then(() => {
          fetchMasterSemesters();
          setSelectedFile(null);
        })
        .catch((error) => console.error("Error:", error));
    } else {
      alert("Please select a CSV file before uploading.");
    }
  };

  return (
    <Container maxW="6xl">
      {/* <h1>Manage Master Semesters</h1> */}
      <Header title="Manage Master Semesters"></Header>
      <Text as="b">Batch Upload</Text>
      <Input
        px="1.5"
        py="1"
        mt="1.5"
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        name="XlsxFile"
      />
      <Box display="flex" justifyContent="space-between">
        <Box>
          <CustomBlueButton ml="0" mt="4" onClick={handleUpload}>
            Upload Xlsx
          </CustomBlueButton>
        </Box>
        <Box mt="3" mr="-1">
          <FileDownloadButton
            fileUrl="/room_template.xlsx"
            fileName="room_template.xlsx"
          />
        </Box>
      </Box>
      <Box>
        {isAddSemesterFormVisible ? (
          <FormControl>
            <Box>
              <FormLabel>Semester: <span>*</span></FormLabel>
              <Input
                type="text"
                value={editedSemester.sem}
                onChange={(e) =>
                  setEditedSemester({ ...editedSemester, sem: e.target.value })
                }
              />
            </Box>
            <Box mt="3">
              <FormLabel>Type: <span>*</span></FormLabel>
              <Input
                type="text"
                value={editedSemester.type}
                placeholder={"B.Tech-1 (1 indicates sem number)"}
                onChange={(e) =>
                  setEditedSemester({ ...editedSemester, type: e.target.value })
                }
              />
            </Box>
            <Box mt="3">
              <FormLabel>Department: <span>*</span></FormLabel>
              <Input
                type="text"
                value={editedSemester.dept}
                onChange={(e) =>
                  setEditedSemester({ ...editedSemester, dept: e.target.value })
                }
              />
            </Box>
            <Box mt="3">
              <FormLabel>Degree: <span>*</span></FormLabel>
              <Input
                type="text"
                value={editedSemester.degree}
                onChange={(e) =>
                  setEditedSemester({
                    ...editedSemester,
                    degree: e.target.value,
                  })
                }
              />
            </Box>
            <Box mt="3">
              <FormLabel>Year:</FormLabel>
              <Input
                type="text"
                value={editedSemester.year}
                onChange={(e) =>
                  setEditedSemester({
                    ...editedSemester,
                    year: e.target.value,
                  })
                }
              />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <CustomBlueButton ml="0" onClick={handleSaveNewSemester}>
                Save New Semester
              </CustomBlueButton>
              <CustomBlueButton mr="0" onClick={handleCancelAddSemester}>
                Cancel
              </CustomBlueButton>
            </Box>
          </FormControl>
        ) : (
          <CustomBlueButton ml='0' onClick={handleAddSemester}>
            Add Master Semester
          </CustomBlueButton>
        )}
      </Box>

<TableContainer>
        <Text as='b' >Master Semesters Data (Total Entries: {masterSems.length}):</Text>
        <Table 
        mt='2'
        variant='striped'
        >
          <Thead>
            <Tr>
              <Th><Center>Semester</Center></Th>
              <Th><Center>Type</Center></Th>
              <Th><Center>Department</Center></Th>
              <Th><Center>Degree</Center></Th>
              <Th><Center>Year</Center></Th>

              <Th><Center>Action</Center></Th>
            </Tr>
          </Thead>
          <Tbody>
            {masterSems.map((semester) => (
              <Tr key={semester._id}>
                <Td><Center>
                  {editSemesterId === semester._id ? (
                    <input
                      type="text"
                      value={editedSemester.sem}
                      onChange={(e) =>
                        setEditedSemester({
                          ...editedSemester,
                          sem: e.target.value,
                        })
                      }
                    />
                  ) : (
                    semester.sem
                  )}</Center>
                </Td>
                <Td><Center>
                    {editSemesterId === semester._id ? (
                      <input
                        type="text"
                        value={editedSemester.type}
                        onChange={(e) =>
                          setEditedSemester({
                            ...editedSemester,
                            type: e.target.value,
                          })
                        }
                      />
                    ) : (
                      semester.type
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editSemesterId === semester._id ? (
                      <input
                        type="text"
                        value={editedSemester.dept}
                        onChange={(e) =>
                          setEditedSemester({
                            ...editedSemester,
                            dept: e.target.value,
                          })
                        }
                      />
                    ) : (
                      semester.dept
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editSemesterId === semester._id ? (
                      <input
                        type="text"
                        value={editedSemester.degree}
                        onChange={(e) =>
                          setEditedSemester({
                            ...editedSemester,
                            degree: e.target.value,
                          })
                        }
                      />
                    ) : (
                      semester.degree
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editSemesterId === semester._id ? (
                      <input
                        type="text"
                        value={editedSemester.year}
                        onChange={(e) =>
                          setEditedSemester({
                            ...editedSemester,
                            year: e.target.value,
                          })
                        }
                      />
                    ) : (
                      semester.year
                    )}
                </Center>
                </Td>
                <Td><Center>
                  
                    {editSemesterId === semester._id ? (
                      <CustomBlueButton onClick={handleSaveEdit}>
                        Save
                      </CustomBlueButton>
                    ) : (
                      <>
                        <CustomBlueButton
                          onClick={() => handleEditClick(semester._id)}
                        >
                          Edit
                        </CustomBlueButton>
                        <CustomDeleteButton
                          onClick={() => handleDelete(semester._id)}
                        >
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
</TableContainer>
    </Container>
  );
}

export default MasterSemester;
