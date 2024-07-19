import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';

import {
  Container,
  Box,
  Input,
  Button,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  IconButton,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { Heading, chakra, Spinner } from '@chakra-ui/react';

function AddTrack() {
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [trackName, setTrackName] = useState('');
  const [tracks, setTracks] = useState();
  const [editIndex, setEditIndex] = useState(null);
  const toast = useToast();
  const [trackToDelete, setTrackToDelete] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
        setTracks(response.data.tracks || []);
      } catch (error) {
        console.error('Error fetching tracks:', error);
        setTracks([]);
      }
    };

    fetchTracks();
  }, [apiUrl, eventId]);

  const handleTrackNameChange = (e) => {
    setTrackName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (trackName.trim() === '') {
      toast({
        title: 'Track name is required',
        status: 'warning',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    if (tracks.includes(trackName.trim())) {
      toast({
        title: 'Track already exists',
        description: 'Please enter a different track name',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    try {
      const updatedTracks = [...tracks, trackName];

      const addTrackResponse = await axios.patch(`${apiUrl}/reviewmodule/event/${eventId}`, { tracks: updatedTracks });

      if (addTrackResponse.status === 200) {
        setTracks(updatedTracks);
        setTrackName('');
        toast({
          title: 'Track added successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      } else {
        toast({
          title: 'Error adding track',
          description: 'Please try again later',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error adding track',
        description: error.response?.data || 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  const handleEditTrack = (index) => {
    setEditIndex(index);
    setTrackName(tracks[index]);
  };

  const handleSaveEdit = () => {
    const updatedTracks = [...tracks];
    updatedTracks[editIndex] = trackName;
    setTracks(updatedTracks);
    setEditIndex(null);
    setTrackName('');
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setTrackName('');
  };

  const deleteTrack = async (index) => {
    try {
      const updatedTracks = [...tracks];
      updatedTracks.splice(index, 1);
      setTracks(updatedTracks);

      const deleteTrackResponse = await axios.patch(`${apiUrl}/reviewmodule/event/${eventId}`, { tracks: updatedTracks });

      if (deleteTrackResponse.status === 200) {
        toast({
          title: 'Track deleted successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      } else {
        toast({
          title: 'Error deleting track',
          description: 'Please try again later',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error deleting track',
        description: error.response?.data || 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    } finally {
      onClose();
    }
  };

  const handleDelete = (index) => {
    setTrackToDelete(index);
    onOpen();
  };

  const HeaderAddTrack = ({ title }) => {
    const navigate = useNavigate();

    return (
      <Heading mr='1' ml='1' display='flex' >
        <IconButton
          mb='1'
          variant='ghost'
          onClick={() => navigate(-1)}
          _hover={{ bgColor: 'transparent' }}
        >
          <chakra.svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='white'
            className='w-6 h-6'
            _hover={{ stroke: '#00BFFF' }}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </chakra.svg>
        </IconButton>
        <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2'>
          {title}
        </chakra.div>
      </Heading>
    );
  };

  return (
    <Container maxWidth='100%' >
      <br />
      <Box display="flex" justifyContent="center" mt={4}>
        <Box bg="black" p={0.2} width='80%'>
          <HeaderAddTrack color="white" textAlign="center" title="Add Track Details" />
        </Box>
      </Box>
      <br />
      <br />
      <form onSubmit={handleSubmit}>
        <Box display="flex" justifyContent="center" mb={4}>
          <Input
            type="text"
            placeholder="Enter track name to add to event"
            value={trackName}
            onChange={handleTrackNameChange}
            p={2}
            maxWidth='80%'
          />
        </Box>
        <Box display="flex" justifyContent="center" pt='5'>
          {editIndex !== null ? (
            <>
              <Button type="button" style={{ width: '90px' }} colorScheme="blue" onClick={handleSaveEdit} leftIcon={<CheckIcon />} mr={2}>
                Save
              </Button>
              <Button type="submit" style={{ backgroundColor: '#CC0000', width: '90px' }} onClick={handleCancelEdit} leftIcon={<CloseIcon />}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="submit" colorScheme="blue" leftIcon={<EditIcon />}>
              Add
            </Button>
          )}
        </Box>
      </form>

      <br />

      <p style={{ textAlign: 'center', margin: '10px', fontWeight: 'bold', fontSize: '28px' }}>Existing Tracks</p>

      {tracks && (tracks.length > 0 ? (
        <>
          <Box display="flex" justifyContent="center" overflowX="auto">
            <Table variant="simple" mt={8} maxWidth='80%'>
              <Thead>
                <Tr>
                  <Th fontSize='sm' textAlign='center'>Track Name</Th>
                  <Th fontSize='sm' textAlign='center'>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tracks.map((track, index) => (

                  <Tr key={index}>
                    <Td>
                      <Box display="flex" justifyContent="center" alignItems="center">
                        {index === editIndex ? (
                          <Input
                            value={trackName}
                            onChange={handleTrackNameChange}
                          />
                        ) : (
                          track
                        )}
                      </Box>
                    </Td>

                    <Td>
                      <Box display="flex" justifyContent="center" alignItems="center">
                        {index === editIndex ? (
                          <>
                            <IconButton
                              aria-label="Save"
                              icon={<CheckIcon />}
                              onClick={handleSaveEdit}
                              mr={2}
                            />
                            <IconButton
                              aria-label="Cancel"
                              icon={<CloseIcon />}
                              onClick={handleCancelEdit}
                            />
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleEditTrack(index)}
                              type="button"
                              size="md"
                              width="100px"
                              colorScheme="blue"
                              mr={2}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(index)}
                              type="button"
                              size="md"
                              colorScheme="red"
                              width="100px"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </Box>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </>
      ) : (
        <Box mt={8} textAlign="center" fontSize="lg" fontWeight="bold">
          No tracks found...
        </Box>
      ))}

      {!tracks && (
        <Box mt={8} textAlign="center" fontSize="lg" fontWeight="bold">
          <Spinner />
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Confirmation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this track?
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={() => deleteTrack(trackToDelete)}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default AddTrack;
