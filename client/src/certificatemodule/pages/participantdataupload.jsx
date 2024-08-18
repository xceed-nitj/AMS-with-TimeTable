import React, { useState, useEffect } from "react";
import getEnvironment from "../../getenvironment";
import FileDownloadButton from "../../filedownload/filedownload";
import { Link as ChakraLink } from '@chakra-ui/react';
import { useToast } from "@chakra-ui/react";
import saveAs from 'file-saver';

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
  HStack,
} from "@chakra-ui/react";
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomDeleteButton,
  CustomTealButton,
} from "../../styles/customStyles";

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
import Header from '../../components/header';


function Participant() {
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const eventId = parts[parts.length - 2];
  const frontendHost = parts[parts.length - 4]
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [semesterData, setSemesterData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [duplicateEntryMessage, setDuplicateEntryMessage] = useState("");
  const [addduplicateEntryMessage, addsetDuplicateEntryMessage] = useState("");
  const [isAddSubjectFormVisible, setIsAddSubjectFormVisible] = useState(false);
  const [downloadClicked, setDownloadClicked] = useState(false)

  const [editedData, setEditedData] = useState({
    name: "",
    department: "",
    college: "",
    types: "",
    teamName:"",
    position: "",
    title1: "",
    title2: "",
    certiType: "",
    mailId: "",
    eventId: eventId,
    isCertificateSent: false,
  });

  const [editedSData, setEditedSData] = useState({
    name: "",
    department: "",
    college: "",
    types: "",
    teamName:"",
    position: "",
    title1: "",
    title2: "",
    certiType: "",
    mailId: "",
    eventId: eventId,
    isCertificateSent: false,
  });

  const [downloadType, setDownloadType] = useState(false)

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchParticipantData();
  }, [eventId]);

  const fetchParticipantData = () => {
    if (eventId) {
      fetch(`${apiUrl}/certificatemodule/participant/getparticipant/${eventId}`, {
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
          //   const filteredData = data.filter((item) => item.code === currentCode);
          setTableData(data);
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

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('eventId', eventId);

      fetch(`${apiUrl}/upload/participant`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
        .then((response) => response.json())
        .then(() => {
          fetchParticipantDataparticipantData()
          setSelectedFile(null);
        })
        .catch((error) => console.error('Error:', error));
    } else {
      alert('Please select a CSV file before uploading.');
    }
  };



  // const handleUpload = () => {
  //   if (selectedFile) {
  //     const formData = new FormData();
  //     formData.append('csvFile', selectedFile);
  //     formData.append('eventcode', eventId); 
  //     setIsLoading(true);

  //     fetch(`${apiUrl}/certificatemodule/participant/batchupload/${eventId}`, {
  //       method: 'POST',
  //       body: formData,
  //       credentials: 'include',
  //     })
  //       .then((response) => {
  //         if (!response.ok) {
  //           throw new Error(`Error: ${response.status} - ${response.statusText}`);
  //         }
  //         setUploadState(true);
  //         setUploadMessage('File uploaded successfully');
  //         return response.json();
  //       })
  //       .then((data) => {
  //         if (data.message) {
  //           setDuplicateEntryMessage(data.message);

  //         } else {
  //           fetchParticipantData(); 
  //           setDuplicateEntryMessage(''); 
  //         }
  //         setIsLoading(false);
  //       })
  //       .catch((error) => {
  //         console.error('Error:', error);
  //         setIsLoading(false);
  //       })
  //       .finally(() => {
  //         setIsLoading(false);
  //         setTimeout(() => {
  //           setUploadMessage('');
  //         }, 3000);
  //       });
  //   } else {
  //     alert('Please select a CSV file before uploading.');
  //   }
  // };

  useEffect(() => {
    fetchParticipantData();
    if (uploadState) {
      setUploadState(false);
    }
  }, [eventId, uploadState]);

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
        if (!editedData.name.trim()) {
          alert("Name is required")
          return;
        }
        if (!editedData.certiType.trim()) {
          alert("Certificate type is required")
          return;
        }
        if (!editedData.mailId.trim()) {
          alert("E-mail is required")
          return;
        }

        fetch(`${apiUrl}/certificatemodule/participant/addparticipant/${editRowId}`, {

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

              name: "",
              department: "",
              college: "",
              types: "",
              position: "",
              teamName:"",
              title1: "",
              title2: "",
              certiType: "",
              mailId: "",
              eventId: eventId,
              isCertificateSent: false,
            });
          })
          .catch((error) => {
            console.error("Update Error:", error);

          });
      }
    }
  };

  const handleMailstatus = (RowId) => {
    let data = {};
    if (RowId) {
      console.log(RowId)
      const rowIndex = tableData.findIndex((row) => row._id === RowId);
      console.log(rowIndex)

      if (rowIndex !== -1) {

        data.isCertificateSent = true;
        console.log('data to be sent', editedData)
        fetch(`${apiUrl}/certificatemodule/participant/addparticipant/${RowId}`, {

          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(data),
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
            fetchParticipantData();

            // setTableData(updatedData);
            // setEditRowId(null);
            // setEditedData({
            //   _id: null,

            //   name: "",
            //   department: "",
            //   college: "",
            //   types: "",
            //   position: "",
            //   title1: "",
            //   title2: "",
            //   certiType: "",
            //   mailId: "",
            //   eventId: eventId,
            //   isCertificateSent:false,
            // });
          })
          .catch((error) => {
            console.error("Update Error:", error);

          });
      }
    }
  };

  const handleBatchMail = () => {
    // Make the fetch request
    fetch(`${apiUrl}/certificatemodule/emails/send-emails/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Frontend-Host': window.location.origin,
      },
      // body: JSON.stringify(requestData),
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        // Handle the response from the backend, if needed
        console.log('Mail sent successfully:', data);
      })
      .catch((error) => {
        console.error('Error sending mail:', error);
      });
  };
  const toast = useToast();



  const handleMailClick = (Id) => {
    // Make the fetch request
    fetch(`${apiUrl}/certificatemodule/emails/send-email/${Id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Frontend-Host': window.location.origin,
      },
      // body: JSON.stringify(requestData),
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        // Handle the response from the backend, if needed
        console.log('Mail sent successfully:', data);
        toast({
          title: 'Mail sent',
          description: 'Email has been sent successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          // position:'middle',
        });
        handleMailstatus(Id);
      })
      .catch((error) => {
        console.error('Error sending mail:', error);
      });
  };

  const handleDelete = (_id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this entry?");

    if (isConfirmed) {
      fetch(`${apiUrl}/certificatemodule/participant/deleteparticipant/${_id}`, {
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

      name: "",
      department: "",
      college: "",
      types: "",
      position: "",
      teamName:"",
      title1: "",
      title2: "",
      certiType: "",
      mailId: "",
      eventId: eventId,
      isCertificateSent: false,


    });
    setIsAddSubjectFormVisible(true);
  };

  const handleSaveNewSubject = () => {
    // const isDuplicateEntry = tableData.some(
    //   (row) => row.name === editedSData.name
    // );

    // if (isDuplicateEntry) {
    //   addsetDuplicateEntryMessage(
    //     `Duplicate entry for "${editedSData.name}" is detected. Kindly delete the entry.`
    //   );
    // } else {
    if (!editedSData.name.trim()) {
      alert("Name is required")
      return;
    }
    if (!editedSData.certiType.trim()) {
      alert("Certificate type is required")
      return;
    }
    if (!editedSData.mailId.trim()) {
      alert("E-mail is required")
      return;
    }
    fetch(`${apiUrl}/certificatemodule/participant/addparticipant/${eventId}`, {
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
        toast({
          title: 'Data Saved ',
          description: 'Updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          // position:'middle',
        });
        fetchParticipantData();
        handleCancelAddSubject();
        addsetDuplicateEntryMessage("");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    // }
  };


  const handleDeleteAll = () => {
    if (eventId) {
      if (
        window.confirm(
          "Are you sure you want to delete all entries with the current code?"
        )
      ) {
        fetch(`${apiUrl}/certificatemodule/participant/deleteall/${eventId}`, {
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
            fetchParticipantData();
          })
          .catch((error) => {
            console.error("Delete All Error:", error);
          });
      }
    }
  };

  const handleChangeType = async (e) => setDownloadType(e.target.value);
  const handleDownloadAll = async (e) => {
    if (!downloadType) { alert("choose a download type first"); return; }
    if (downloadClicked) {
      const clicked = confirm("Do you want to download again");
      if (!clicked) { return; }
    }
    try {
      const response = await fetch(
        `${apiUrl}/certificatemodule/certificate/downloadall`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },

          credentials: 'include',
          body: JSON.stringify({ eventID: eventId, type: downloadType }),
        }
      );
      const zipBlob = await response.blob();
      console.log(zipBlob)
      saveAs(zipBlob, "certificates.zip", "application/zip")
    } catch (error) {
      console.error('Error converting SVGs:', error);
    }
  }
  return (
    <Container maxW='8xl'>
      {/* <Heading as="h1" size="xl" mt="6" mb="6">Add Subject</Heading> */}
      <Header title='Add Participant' />
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

        <Box mr="-1.5">
          <FileDownloadButton
            fileUrl="/participant_template.xlsx"
            fileName="participant_template.xlsx"
          />
        </Box>
      </Box>
      <Box>
        {isAddSubjectFormVisible ? (
          <FormControl borderRadius="md" >
            <Box mt='4'>
              <FormLabel>Name:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                type="text"
                mb='4'
                placeholder="Name of the participant"
                value={editedSData.name}
                onChange={(e) =>
                  setEditedSData({
                    ...editedSData,
                    name: e.target.value,
                  })
                }
              />
            </Box>

            <Box>
              <FormLabel>Department:</FormLabel>
              <Input
                mb="4"
                border="1px"
                borderColor="gray.300"
                type="text"
                placeholder="Name of the department"
                value={editedSData.department}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, department: e.target.value })
                }
              />
            </Box>

            <Box>
              <FormLabel>College:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                mb="4"
                type="text"
                placeholder="Name of the college"
                value={editedSData.college}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, college: e.target.value })
                }
              />
            </Box>

            <Box>
              <FormLabel>Type:</FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                type="text"
                placeholder="Type of the event"
                value={editedSData.types}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, types: e.target.value })
                }
              />

            </Box>


            <Box>
              <FormLabel>Team Name:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                mb="4"

                type="text"
                placeholder="Team Name"
                value={editedSData.teamName}
                onChange={(e) =>{ 
                  setEditedSData({ ...editedSData, teamName: e.target.value })
                }}
              />
            </Box>


            <Box>
              <FormLabel>Position:</FormLabel>
              <Input
                border="1px"
                borderColor="gray.300"
                mb="4"

                type="text"
                placeholder="Position"
                value={editedSData.position}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, position: e.target.value })
                }
              />
            </Box>

            <Box>
              <FormLabel>Title-1:</FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                type="text"
                placeholder="title1"
                value={editedSData.title1}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, title1: e.target.value })
                }
              />
            </Box>

            <Box>
              <FormLabel>Title2: </FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                type="text"
                placeholder="title2"
                value={editedSData.title2}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, title2: e.target.value })
                }
              />

            </Box>

            <Box>
              <FormLabel>Email: </FormLabel>
              <Input
                border="1px"
                mb="4"
                borderColor="gray.300"
                // type="number" // Assuming it's a number
                placeholder="Mail"
                value={editedSData.mailId}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, mailId: e.target.value })
                }
              />

            </Box>

            <Box>
              <FormLabel>certificate Type: </FormLabel>

              <Select
                name="certiType"
                value={editedSData.certiType}
                onChange={(e) =>
                  setEditedSData({ ...editedSData, certiType: e.target.value })
                }
                placeholder="Select Certificate Type"
              >
                <option value="winner">Winner</option>
                <option value="participant">Participant</option>
                <option value="speaker">Speaker</option>
                <option value="organizer">Organizer</option>
              </Select>

            </Box>



            <Box display='flex' justifyContent='space-between'>
              <CustomBlueButton width='36' onClick={handleCancelAddSubject}>
                Cancel
              </CustomBlueButton>
              <CustomBlueButton onClick={handleSaveNewSubject}>
                Save New Participant Data
              </CustomBlueButton>
            </Box>
          </FormControl>
        ) : (
          <CustomTealButton w='200px' mb='5' mt='3' onClick={handleAddSubject}>
            Add New Participant
          </CustomTealButton>

        )}
      </Box>
      {addduplicateEntryMessage && <p>{addduplicateEntryMessage}</p>}
      <HStack className="tw-flex tw-justify-between">
        {/* <div className="tw-flex tw-items-center tw-gap-3"><Text>Download all Certificates:</Text>
          <Select width='350px' placeholder="Select Type" name="downloadType" onChange={e => { setDownloadClicked(false); handleChangeType(e) }}>
            <option value="image">Image</option>
            <option value="pdf">PDF</option>
          </Select>
          {downloadType && <CustomBlueButton ml='0' width='350px' onClick={(e) => { setDownloadClicked(true); handleDownloadAll(); }}>
            Download All Certificates
          </CustomBlueButton>}
        </div> */}
        <CustomBlueButton ml='0' width='350px' onClick={handleBatchMail}>
          send Email to all Participants
        </CustomBlueButton>
      </HStack>

      <TableContainer mt='2'>
        <Text as='b'>Table of Paticipant Data</Text>
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
                <Th>Name</Th>
                <Th><Center>Department</Center></Th>
                <Th><Center>College</Center></Th>
                <Th><Center>Type</Center></Th>
                <Th><Center>Team Name</Center></Th>
                <Th><Center>Position</Center></Th>
                <Th><Center>Title-1</Center></Th>
                <Th><Center>Title-2</Center></Th>
                <Th><Center>Email</Center></Th>
                <Th><Center>Certificate type</Center></Th>
                <Th><Center>Creficate Link</Center></Th>
                <Th><Center>Mail status</Center></Th>
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
                          value={editedData.name}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.name
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.department}
                          onChange={(e) =>
                            setEditedData({ ...editedData, department: e.target.value })
                          }
                        />
                      ) : (
                        row.department
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.college}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              college: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.college
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.types}
                          width="80px"
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              types: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.types
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.teamName}
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              teamName: e.target.value,
                            })
                          }
                        />
                      ) : (
                        row.teamName
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.position}
                          onChange={(e) =>
                            setEditedData({ ...editedData, position: e.target.value })
                          }
                        />
                      ) : (
                        row.position
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.title1}
                          onChange={(e) =>
                            setEditedData({ ...editedData, title1: e.target.value })
                          }
                        />
                      ) : (
                        row.title1
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.title2}
                          onChange={(e) =>
                            setEditedData({ ...editedData, title2: e.target.value })
                          }
                        />
                      ) : (
                        row.title2
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={editedData.mailId}
                          onChange={(e) =>
                            setEditedData({ ...editedData, mailId: e.target.value })
                          }
                        />
                      ) : (
                        row.mailId
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Select
                          name="certiType"
                          value={editedData.certiType}
                          onChange={(e) =>
                            setEditedData({ ...editedData, certiType: e.target.value })
                          }
                          placeholder="Select Certificate Type"
                        >
                          <option value="winner">Winner</option>
                          <option value="participant">Participant</option>
                          <option value="speaker">Speaker</option>
                          <option value="organizer">Organizer</option>
                        </Select>
                      ) : (
                        row.certiType
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      {editRowId === row._id ? (
                        <Input
                          type="text"
                          value={row._id}
                          isDisabled
                        />
                      ) : (
                        <ChakraLink href={`${frontendHost}/cm/c/${eventId}/${row._id}`} isExternal>
                          View certificate
                        </ChakraLink>
                      )}
                    </Center>
                  </Td>
                  <Td>
                    <Center>
                      <Center>
                        {row.isCertificateSent ? "Sent" : "Not sent"}
                      </Center>

                    </Center>
                  </Td>

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

                          <Center>
                            {/* ... (existing Edit and Delete buttons) */}
                            <CustomBlueButton onClick={() => handleMailClick(row._id)}>
                              Mail
                            </CustomBlueButton>
                          </Center>

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

export default Participant;
