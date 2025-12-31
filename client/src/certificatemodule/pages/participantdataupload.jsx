import React, { useState, useEffect } from 'react';
import getEnvironment from '../../getenvironment';
import FileDownloadButton from '../../filedownload/filedownload';
import { Link as ChakraLink } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { IconButton } from '@chakra-ui/react';
import { FiEdit2, FiMail, FiTrash2 } from 'react-icons/fi';
import { FiCheck } from 'react-icons/fi';
import { FiDownload } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/react';

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
} from '@chakra-ui/react';
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomDeleteButton,
  CustomTealButton,
} from '../../styles/customStyles';

import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/table';
import { Button } from '@chakra-ui/button';
import Header from '../../components/header';
import { FaUpload } from 'react-icons/fa';

function Participant() {
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 2];
  const frontendHost = parts[parts.length - 4];
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [tableData, setTableData] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [semesterData, setSemesterData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [duplicateEntryMessage, setDuplicateEntryMessage] = useState('');
  const [addduplicateEntryMessage, addsetDuplicateEntryMessage] = useState('');
  const [isAddSubjectFormVisible, setIsAddSubjectFormVisible] = useState(false);
  const [downloadClicked, setDownloadClicked] = useState(false);

  const [editedData, setEditedData] = useState({
    name: '',
    department: '',
    college: '',
    types: '',
    teamName: '',
    position: '',
    title1: '',
    title2: '',
    certiType: '',
    mailId: '',
    eventId: eventId,
    isCertificateSent: false,
  });

  const [editedSData, setEditedSData] = useState({
    name: '',
    department: '',
    college: '',
    types: '',
    teamName: '',
    position: '',
    title1: '',
    title2: '',
    certiType: '',
    mailId: '',
    eventId: eventId,
    isCertificateSent: false,
  });

  const [downloadType, setDownloadType] = useState(false);

  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchParticipantData();
  }, [eventId]);

  const fetchParticipantData = () => {
    if (eventId) {
      fetch(
        `${apiUrl}/certificatemodule/participant/getparticipant/${eventId}`,
        {
          credentials: 'include',
        }
      )
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
          console.error('Error:', error);
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
        credentials: 'include',
      })
        .then((response) => response.json())
        .then(() => {
          fetchParticipantDataparticipantData();
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
          alert('Name is required');
          return;
        }
        if (!editedData.certiType.trim()) {
          alert('Certificate type is required');
          return;
        }
        if (!editedData.mailId.trim()) {
          alert('E-mail is required');
          return;
        }

        fetch(
          `${apiUrl}/certificatemodule/participant/addparticipant/${editRowId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(editedData),
            credentials: 'include',
          }
        )
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

              name: '',
              department: '',
              college: '',
              types: '',
              position: '',
              teamName: '',
              title1: '',
              title2: '',
              certiType: '',
              mailId: '',
              eventId: eventId,
              isCertificateSent: false,
            });
          })
          .catch((error) => {
            console.error('Update Error:', error);
          });
      }
    }
  };

  const handleMailstatus = (RowId) => {
    let data = {};
    if (RowId) {
      console.log(RowId);
      const rowIndex = tableData.findIndex((row) => row._id === RowId);
      console.log(rowIndex);

      if (rowIndex !== -1) {
        data.isCertificateSent = true;
        console.log('data to be sent', editedData);
        fetch(
          `${apiUrl}/certificatemodule/participant/addparticipant/${RowId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },

            body: JSON.stringify(data),
            credentials: 'include',
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Error: ${response.status} - ${response.statusText}`
              );
            }
            return response.json();
          })
          .then((data) => {
            console.log('Update Success:', data);
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
            console.error('Update Error:', error);
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
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this entry?'
    );

    if (isConfirmed) {
      fetch(
        `${apiUrl}/certificatemodule/participant/deleteparticipant/${_id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error: ${response.status} - ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          // console.log("Delete Success:", data);
          const updatedData = tableData.filter((row) => row._id !== _id);
          setTableData(updatedData);
        })
        .catch((error) => {
          console.error('Delete Error:', error);
        });
    }
  };

  const handleCancelAddSubject = () => {
    setIsAddSubjectFormVisible(false);
  };

  const handleAddSubject = () => {
    setEditedSData({
      name: '',
      department: '',
      college: '',
      types: '',
      position: '',
      teamName: '',
      title1: '',
      title2: '',
      certiType: '',
      mailId: '',
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
      alert('Name is required');
      return;
    }
    if (!editedSData.certiType.trim()) {
      alert('Certificate type is required');
      return;
    }
    if (!editedSData.mailId.trim()) {
      alert('E-mail is required');
      return;
    }
    fetch(`${apiUrl}/certificatemodule/participant/addparticipant/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedSData),
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Data saved successfully:', data);
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
        addsetDuplicateEntryMessage('');
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    // }
  };

  // const handleDeleteAll = () => {
  //   if (eventId) {
  //     if (
  //       window.confirm(
  //         "Are you sure you want to delete all entries with the current code?"
  //       )
  //     ) {
  //       fetch(`${apiUrl}/certificatemodule/participant/deleteall/${eventId}`, {
  //         method: "DELETE",
  //         credentials: "include",
  //       })
  //         .then((response) => {
  //           if (!response.ok) {
  //             throw new Error(
  //               `Error: ${response.status} - ${response.statusText}`
  //             );
  //           }
  //           return response.json();
  //         })
  //         .then((data) => {
  //           // console.log("Delete All Success:", data);
  //           fetchParticipantData();
  //         })
  //         .catch((error) => {
  //           console.error("Delete All Error:", error);
  //         });
  //     }
  //   }
  // };

  // const handleChangeType = async (e) => setDownloadType(e.target.value);
  // const handleDownloadAll = async (e) => {
  //   if (!downloadType) { alert("choose a download type first"); return; }
  //   if (downloadClicked) {
  //     const clicked = confirm("Do you want to download again");
  //     if (!clicked) { return; }
  //   }
  //   try {
  //     const response = await fetch(
  //       `${apiUrl}/certificatemodule/certificate/downloadall`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json'
  //         },

  //         credentials: 'include',
  //         body: JSON.stringify({ eventID: eventId, type: downloadType }),
  //       }
  //     );
  //     const zipBlob = await response.blob();
  //     console.log(zipBlob)
  //     saveAs(zipBlob, "certificates.zip", "application/zip")
  //   } catch (error) {
  //     console.error('Error converting SVGs:', error);
  //   }
  // }
  return (
    <Container maxW="8xl">
      <Header title="Add Participant" />

      <Box
        p="3"
        display={'flex'}
        flexDirection={'column'}
        gap="6"
        bg="gray.50"
        borderRadius="md"
        justifyItems={'start'}
        border={'1px'}
        boxShadow={'md'}
        borderColor={'gray.200'}
      >
        {/* add new participant form or Batch Upload (both grouped together in a BOX)*/}
        <Box
          bg="white"
          p={{ base: 3, md: 6 }}
          borderRadius="lg"
          boxShadow="md"
          display="flex"
          flexDirection="column"
          gap={4}
        >
          {/* Header + Batch Upload */}
          <Box
            display="flex"
            alignItems={{ base: 'flex-start', md: 'center' }}
            gap="4"
            flexWrap="wrap"
            flexDirection={{ base: 'column', md: 'row' }}
          >
            <h1 className="tw-text-[18px] tw-font-medium">Batch Upload:</h1>

            <Box
              display="flex"
              alignItems="center"
              gap="3"
              border="1px solid"
              borderColor="gray.300"
              borderRadius="md"
              px="3"
              py="2"
              bg="white"
              width={{ base: '100%', md: 'auto' }}
              flexWrap="wrap"
            >
              <Input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                name="XlsxFile"
                variant="unstyled"
                width={{ base: '100%', md: '260px' }}
                cursor="pointer"
                sx={{
                  '::file-selector-button': {
                    border: 'none',
                    bg: 'purple.50',
                    color: 'purple.600',
                    px: '3',
                    py: '1',
                    mr: '3',
                    borderRadius: 'md',
                    cursor: 'pointer',
                    fontWeight: '500',
                  },
                  '::file-selector-button:hover': {
                    bg: 'purple.100',
                  },
                }}
              />

              <Box
                as={CustomTealButton}
                onClick={handleUpload}
                p="8px"
                borderRadius="md"
                cursor="pointer"
                bgColor="purple.500"
                _hover={{ bg: 'purple.700' }}
                flexShrink={0}
              >
                <FaUpload style={{ height: 18, width: 18, color: 'white' }} />
              </Box>
            </Box>

            {uploadMessage && (
              <Box fontSize="sm" color="gray.600">
                {uploadMessage}
              </Box>
            )}
          </Box>

          {/* Form / Manual Add */}
          <Box>
            {isAddSubjectFormVisible ? (
              <FormControl>
                <Box
                  display="grid"
                  gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
                  gap={{ base: 4, md: 5 }}
                >
                  <Box>
                    <FormLabel>Name</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Name of the participant"
                      value={editedSData.name}
                      onChange={(e) =>
                        setEditedSData({ ...editedSData, name: e.target.value })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Department</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Name of the department"
                      value={editedSData.department}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          department: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>College</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Name of the college"
                      value={editedSData.college}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          college: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Type</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Type of the event"
                      value={editedSData.types}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          types: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Team Name</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Team Name"
                      value={editedSData.teamName}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          teamName: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Position</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Position"
                      value={editedSData.position}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          position: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Title-1</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Title 1"
                      value={editedSData.title1}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          title1: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Title-2</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Title 2"
                      value={editedSData.title2}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          title2: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Email</FormLabel>
                    <Input
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Mail"
                      value={editedSData.mailId}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          mailId: e.target.value,
                        })
                      }
                    />
                  </Box>

                  <Box>
                    <FormLabel>Certificate Type</FormLabel>
                    <Select
                      border="1px"
                      borderColor="gray.300"
                      placeholder="Select Certificate Type"
                      value={editedSData.certiType}
                      onChange={(e) =>
                        setEditedSData({
                          ...editedSData,
                          certiType: e.target.value,
                        })
                      }
                    >
                      <option value="winner">Winner</option>
                      <option value="participant">Participant</option>
                      <option value="speaker">Speaker</option>
                      <option value="organizer">Organizer</option>
                    </Select>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box
                  mt={8}
                  display="flex"
                  flexDirection={{ base: 'column', md: 'row' }}
                  justifyContent="flex-end"
                  gap={{ base: 1, md: 4 }}
                >
                  <CustomBlueButton
                    variant="outline"
                    border="1px solid"
                    borderColor="gray.300"
                    color="gray.700"
                    bg="white"
                    boxShadow="sm"
                    _hover={{
                      bg: 'gray.50',
                      borderColor: 'gray.400',
                      boxShadow: 'md',
                    }}
                    onClick={handleCancelAddSubject}
                  >
                    Cancel
                  </CustomBlueButton>

                  <CustomBlueButton
                    bg="blue.500"
                    color="white"
                    boxShadow="md"
                    _hover={{ bg: 'blue.600', boxShadow: 'lg' }}
                    onClick={handleSaveNewSubject}
                  >
                    Save New Participant Data
                  </CustomBlueButton>
                </Box>
              </FormControl>
            ) : (
              <CustomTealButton
                bg="teal.600"
                color="white"
                px={6}
                py={2.5}
                fontSize="sm"
                fontWeight="medium"
                borderRadius="md"
                boxShadow="sm"
                width={{ base: '100%', md: 'auto' }}
                _hover={{ bg: 'teal.700' }}
                _active={{ bg: 'teal.800' }}
                onClick={handleAddSubject}
              >
                + Add Participant Manually
              </CustomTealButton>
            )}
          </Box>
        </Box>

        {addduplicateEntryMessage && <p>{addduplicateEntryMessage}</p>}

        {/* Table to display participant data along with the buttons-> batch mail and download partic. template */}
        <Box
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
          bg="white"
          display={'flex'}
          flexDirection={'column'}
          gap={0}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px="4"
            pt="4"
          >
            <Text fontSize="lg" fontWeight="semibold">
              Participants Data
            </Text>

            <Box display="flex" alignItems="center" gap="2">
              <Tooltip
                label="Send email to all participants"
                hasArrow
                placement="bottom"
              >
                <IconButton
                  aria-label="Send email to all participants"
                  icon={<FiMail />}
                  onClick={handleBatchMail}
                  variant="ghost"
                  size="lg"
                />
              </Tooltip>

              <Tooltip
                label="Download participants Excel template"
                hasArrow
                placement="bottom"
              >
                <IconButton
                  aria-label="Download participant template"
                  icon={<FiDownload />}
                  variant="ghost"
                  size="lg"
                  onClick={() =>
                    window.open('/participant_template.xlsx', '_blank')
                  }
                />
              </Tooltip>
            </Box>
          </Box>

          <TableContainer mt={4} overflowX="auto">
            {isLoading ? (
              <Text px="4" py="6">
                Loading data...
              </Text>
            ) : (
              <Table size="sm" variant="striped" colorScheme="gray">
                <Thead position="sticky" top="0" zIndex="1" bg="gray.50">
                  <Tr>
                    <Th>Name</Th>
                    <Th textAlign="center">Department</Th>
                    <Th textAlign="center">College</Th>
                    <Th textAlign="center">Type</Th>
                    <Th textAlign="center">Team Name</Th>
                    <Th textAlign="center">Position</Th>
                    <Th textAlign="center">Title-1</Th>
                    <Th textAlign="center">Title-2</Th>
                    <Th textAlign="center">Email</Th>
                    <Th textAlign="center">Certificate Type</Th>
                    <Th textAlign="center">Certificate Link</Th>
                    <Th textAlign="center">Mail Status</Th>
                    <Th textAlign="center">Actions</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {tableData.map((row, index) => (
                    <Tr key={row._id}>
                      <Td fontWeight="medium">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
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
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
                            value={editedData.department}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                department: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.department
                        )}
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
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
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
                            width="80px"
                            value={editedData.types}
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
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
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
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
                            value={editedData.position}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                position: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.position
                        )}
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
                            value={editedData.title1}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                title1: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.title1
                        )}
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
                            value={editedData.title2}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                title2: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.title2
                        )}
                      </Td>

                      <Td fontSize="sm">
                        {editRowId === row._id ? (
                          <Input
                            size="sm"
                            value={editedData.mailId}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                mailId: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.mailId
                        )}
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Select
                            size="sm"
                            value={editedData.certiType}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                certiType: e.target.value,
                              })
                            }
                          >
                            <option value="winner">Winner</option>
                            <option value="participant">Participant</option>
                            <option value="speaker">Speaker</option>
                            <option value="organizer">Organizer</option>
                          </Select>
                        ) : (
                          row.certiType
                        )}
                      </Td>

                      <Td textAlign="center">
                        {editRowId === row._id ? (
                          <Input size="sm" value={row._id} isDisabled />
                        ) : (
                          <ChakraLink
                            href={`${frontendHost}/cm/c/${eventId}/${row._id}`}
                            color="blue.500"
                            fontWeight="medium"
                            isExternal
                          >
                            View
                          </ChakraLink>
                        )}
                      </Td>

                      <Td
                        textAlign="center"
                        fontWeight="medium"
                        color={row.isCertificateSent ? 'green.600' : 'red.500'}
                      >
                        {row.isCertificateSent ? 'Sent' : 'Not sent'}
                      </Td>

                      <Td>
                        <Center gap="2" flexWrap="wrap">
                          {editRowId === row._id ? (
                            <IconButton
                              aria-label="Save"
                              icon={<FiCheck size={16} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              _hover={{
                                bg: index % 2 === 0 ? 'white' : 'gray.50',
                              }}
                              onClick={handleSaveEdit}
                            />
                          ) : (
                            <HStack spacing="1" justify="center">
                              {(() => {
                                const isGrayRow = index % 2 === 0; // even = gray row
                                return (
                                  <>
                                    <IconButton
                                      aria-label="Edit"
                                      icon={<FiEdit2 size={16} />}
                                      size="sm"
                                      variant="ghost"
                                      _hover={{
                                        bg: isGrayRow ? 'white' : 'gray.100',
                                      }}
                                      onClick={() => handleEditClick(row._id)}
                                    />

                                    <IconButton
                                      aria-label="Delete"
                                      icon={<FiTrash2 size={16} />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="red"
                                      _hover={{
                                        bg: isGrayRow ? 'white' : 'gray.100',
                                      }}
                                      onClick={() => handleDelete(row._id)}
                                    />

                                    <IconButton
                                      aria-label="Mail"
                                      icon={<FiMail size={16} />}
                                      size="sm"
                                      variant="ghost"
                                      _hover={{
                                        bg: isGrayRow ? 'white' : 'gray.100',
                                      }}
                                      onClick={() => handleMailClick(row._id)}
                                    />
                                  </>
                                );
                              })()}
                            </HStack>
                          )}
                        </Center>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TableContainer>
        </Box>
      </Box>
    </Container>
  );
}

export default Participant;
