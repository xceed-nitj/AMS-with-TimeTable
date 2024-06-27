import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import axios from 'axios';

import {
  Container,
  Text,
  Box,
  Input,
  Button,
  TableContainer,
  Table,
  Thead,
  HStack,
  Tfoot,
  Avatar,
  Tr,
  Th,
  Tbody,
  Td,
  IconButton,
  Checkbox,
  Tab,
  Tabs,
  TabPanel,
  TabPanels,
  TabList,
  Center,
  Spacer
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
    <Container maxWidth="1300px">
      <Center fontSize="50px" fontWeight="bold">Track Details</Center>
      <Spacer></Spacer>
        <TableContainer>
          <Table  size="md" overflowX="auto">
            <Thead>
              <Tr>
                <Th><Checkbox></Checkbox></Th>
                <Th>Company</Th>
                <Th>Status</Th>
                <Th>Type</Th>
                <Th>SKU</Th>
                <Th>Conatct</Th>
                <Th>Price</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td><Checkbox></Checkbox></Td>
                <Td><HStack>
                  <Avatar name='Mickey Mouse' src='https://www.google.com/url?sa=i&url=https%3A%2F%2Fgallery.yopriceville.com%2FFree-Clipart-Pictures%2FCartoons-PNG%2FMickey_Mouse_PNG_Clip-Art_Image&psig=AOvVaw0ZITEjx0G9z4Nqymi6R2aN&ust=1718538451634000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCJD6l-HE3YYDFQAAAAAdAAAAABAEclient\public\Mickey_Mouse_PNG_Clip-Art_Image.png'></Avatar>
                  <Text>Mickey Mouse</Text>
                  </HStack></Td>
                <Td>millimetres (mm)</Td>
                <Td isNumeric>25.4</Td>
                <Td>inches</Td>
                <Td>millimetres (mm)</Td>
                <Td isNumeric>25.4</Td>
                <Td>inches</Td>
              </Tr>
              <Tr>
                <Td><Checkbox></Checkbox></Td>
                <Td><HStack>
                  <Avatar name='Mickey Mouse' src='https://www.google.com/url?sa=i&url=https%3A%2F%2Fgallery.yopriceville.com%2FFree-Clipart-Pictures%2FCartoons-PNG%2FMickey_Mouse_PNG_Clip-Art_Image&psig=AOvVaw0ZITEjx0G9z4Nqymi6R2aN&ust=1718538451634000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCJD6l-HE3YYDFQAAAAAdAAAAABAEclient\public\Mickey_Mouse_PNG_Clip-Art_Image.png'></Avatar>
                  <Text>Mickey Mouse</Text>
                  </HStack></Td>
                <Td>centimetres (cm)</Td>
                <Td isNumeric>30.48</Td>
                <Td>inches</Td>
                <Td>millimetres (mm)</Td>
                <Td isNumeric>25.4</Td>
                <Td>inches</Td>
              </Tr>
              <Tr>
                <Td><Checkbox></Checkbox></Td>
                <Td><HStack>
                  <Avatar name='Mickey Mouse' src="Mickey.png"></Avatar>
                  <Text>Mickey Mouse</Text>
                  </HStack></Td>
                <Td><Box border="1px solid green.500">Online</Box></Td>
                <Td isNumeric>0.91444</Td>
                <Td>inches</Td>
                <Td>millimetres (mm)</Td>
                <Td isNumeric>25.4</Td>
                <Td>inches</Td>
              </Tr>
            </Tbody>
          </Table>
       </TableContainer>      
    </Container>
  );
}

export default AddTrack;
