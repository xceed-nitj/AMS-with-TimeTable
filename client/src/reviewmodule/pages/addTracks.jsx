import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import axios from 'axios';

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
import { EditIcon, DeleteIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import Header from "../../components/header";

function AddTrack() {
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [trackName, setTrackName] = useState('');
  const [tracks, setTracks] = useState([]);
  const [editIndex, setEditIndex] = useState(null); // State to track which track is being edited
  const toast = useToast();

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
        setTracks(response.data.tracks || []);
      } catch (error) {
        console.error('Error fetching tracks:', error);
        setTracks([]); // Set tracks to an empty array in case of an error
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

    try {
      const updatedTracks = [...tracks, trackName]; // Add the new track name to the existing tracks array

      const addTrackResponse = await axios.patch(`${apiUrl}/reviewmodule/event/${eventId}`, { tracks: updatedTracks });

      if (addTrackResponse.status === 200) {
        setTracks(updatedTracks);
        setTrackName(''); // Clear the input field
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
    setEditIndex(index); // Set the index of the track being edited
    setTrackName(tracks[index]); // Set the track name in the input field for editing
  };

  const handleSaveEdit = () => {
    const updatedTracks = [...tracks];
    updatedTracks[editIndex] = trackName; // Update the track name in the tracks array
    setTracks(updatedTracks);
    setEditIndex(null); // Reset editIndex
    setTrackName(''); // Clear the input field
  };

  const handleCancelEdit = () => {
    setEditIndex(null); // Reset editIndex
    setTrackName(''); // Clear the input field
  };

  const handleDeleteTrack = async (index) => {
    try {
        const updatedTracks = [...tracks];
        updatedTracks.splice(index, 1); // Remove the track at the specified index
        setTracks(updatedTracks);

        const deleteTrackResponse = await axios.patch(`${apiUrl}/reviewmodule/event/${eventId}`, { tracks: updatedTracks });

        if (deleteTrackResponse.status === 200) {
            // setTracks([]); // Empty the tracks array after successful deletion
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
    }
};

  return (
    <Container>
      <Header title="Add Track Details"></Header>
      <Box maxW="xl" mx="auto" mt={10}>
        <form onSubmit={handleSubmit}>
          <Input
            mb={4}
            type="text"
            placeholder="Enter track name to add to event"
            value={trackName}
            onChange={handleTrackNameChange}
          />
          {editIndex !== null ? (
            <>
              <Button type="button" colorScheme="blue" onClick={handleSaveEdit} leftIcon={<CheckIcon />} mr={2}>
                Save
              </Button>
              <Button type="button" colorScheme="red" onClick={handleCancelEdit} leftIcon={<CloseIcon />}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="submit" colorScheme="teal" leftIcon={<EditIcon />}>
              Add
            </Button>
          )}
        </form>

        <h1>Existing Tracks</h1>
        <Table variant="simple" mt={8}>
          <Thead>
            <Tr>
              <Th>Track Name</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tracks.map((track, index) => (
              <Tr key={index}>
                <Td>{index === editIndex ? (
                  <Input
                    value={trackName}
                    onChange={handleTrackNameChange}
                  />
                ) : (
                  track
                )}</Td>
                <Td>
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
                      <IconButton
                        aria-label="Edit"
                        icon={<EditIcon />}
                        onClick={() => handleEditTrack(index)}
                        mr={2}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<DeleteIcon />}
                        onClick={() => handleDeleteTrack(index)}
                      />
                    </>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}

export default AddTrack;
