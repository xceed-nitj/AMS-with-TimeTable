import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";
import {
  Box,
  Center,
  Container,
  Heading,
  Select,
  Text,
} from "@chakra-ui/react";
import { CustomTh, CustomLink, CustomBlueButton } from "../styles/customStyles";
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
import { Link } from "react-router-dom";
import { useToast } from "@chakra-ui/react";

// function SuccessMessage({ message }) {
//   return (
//     <div className="success-message">
//       {message}
//     </div>
//   );
// }

function AddRoomComponent() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [isLoading, setIsLoading] = useState({
    state : false, 
    id : ''
  });
  // const [successMessage, setSuccessMessage] = useState('');
  const [masterRooms, setMasterRooms] = useState([]);
  const [selectedMasterRoom, setSelectedMasterRoom] = useState("");

  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchRoomsData();
    fetchMasterRooms();
  }, []);

  const fetchRoomsData = () => {
    fetch(`${apiUrl}/timetablemodule/addroom`)
      .then(handleResponse)
      .then((data) => {
        const filteredRooms = data.filter((room) => room.code === currentCode);
        setRooms(filteredRooms);
      })
      .catch(handleError);
  };

  const fetchMasterRooms = () => {
    fetch(`${apiUrl}/timetablemodule/masterroom`)
      .then(handleResponse)
      .then((data) => {
        setMasterRooms(data);
      })
      .catch(handleError);
  };

  const handleResponse = (response) => {
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  };

  const handleError = (error) => {
    console.error("Error:", error);
  };

  const handleSubmit = () => {
    const dataToSave = {
      room: selectedMasterRoom,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/addroom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
    })
      .then(handleResponse)
      .then((data) => {
        // console.log('Data saved successfully:', data);
        // setSuccessMessage('Room added successfully!');
        toast({
          title: "Room Added",
          // description: "",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        fetchRoomsData();
        setSelectedMasterRoom("");
      })
      .catch(handleError);
  };

  const handleDelete = (roomId) => {
    setIsLoading({
      state : true, 
      id : roomId
    });

    fetch(`${apiUrl}/timetablemodule/addroom/${roomId}`, {
      method: "DELETE",
    })
      .then(handleResponse)
      .then(() => {
        console.log("Room deleted successfully");
        fetchRoomsData();
      })
      .catch(handleError)
      .finally(() => {
        setIsLoading(
          {
            ... isLoading,
            state : false
          }
        )
      });
  };

  // useEffect(()=>{
  //   setTimeout(() => {
  //     setSuccessMessage('')
  //   }, 1500);
  // },[successMessage])

  return (
    <Container maxW="5xl">
      <Heading as="h1" size="xl" mt="6" mb="6">
        Add Rooms
      </Heading>

      {/* <SuccessMessage message={successMessage} /> */}
      <Box>
        <Box mb="1">
          <Text as="b">Room</Text>
        </Box>
        <Select
          value={selectedMasterRoom}
          onChange={(e) => setSelectedMasterRoom(e.target.value)}
        >
          <option value="">Select a Room</option>
          {masterRooms.map((masterRoom) => (
            <option key={masterRoom._id} value={masterRoom.room}>
              {masterRoom.room}
            </option>
          ))}
        </Select>
        <Button bg="teal" color="white" ml="0" mt="2.5" onClick={handleSubmit}>
          Add Room
        </Button>
      </Box>
      <Link to="/tt/viewmrooms">
        <Button ml="0">View Master Rooms</Button>
      </Link>

      <Box ml="-1">
        <FileDownloadButton
          fileUrl="/room_template.xlsx"
          fileName="Room_template.xlsx"
        />
      </Box>
      <TableContainer>
        <Box>
          <Text as="b">Room Data</Text>
          <Table variant="striped" size="md" mt="1">
            <Thead>
              <Tr>
                <Th>
                  <Center>Room</Center>
                </Th>
                <Th>
                  <Center>Actions</Center>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {rooms.map((room) => (
                <Tr key={room._id}>
                  <Td>
                    <Center>{room.room} </Center>
                  </Td>
                  <Td>
                    <Center>
                      <Button
                        isLoading = {isLoading.state && isLoading.id == room._id}
                        bg="teal"
                        color="white"
                        onClick={() => handleDelete(room._id)}
                      >
                        Delete
                      </Button>
                    </Center>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </TableContainer>
    </Container>
  );
}

export default AddRoomComponent;
