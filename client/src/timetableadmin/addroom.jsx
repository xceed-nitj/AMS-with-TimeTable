import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import FileDownloadButton from "../filedownload/filedownload";
import {
  Box,
  Center,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Text,
  chakra,
  Checkbox,
} from "@chakra-ui/react";import { CustomTh, CustomLink, CustomBlueButton, CustomDeleteButton } from "../styles/customStyles";
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
import Header from "../components/header";

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
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availableDepartment, setAvailableDepartment] = useState([]);

  const location = useLocation();
  const currentPathname = location.pathname;

  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchRoomsData();
    // fetchMasterRooms();
    fetchAvailableDepartments();
  }, []);



  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/masterroom/dept/${selectedDepartment}`,{credentials: 'include',})
        .then(handleResponse)
        .then((data) => {
          setMasterRooms(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);


  const handleViewRoom = () => {
    // Find the last occurrence of "/"
    const lastSlashIndex = currentPathname.lastIndexOf("/");
  
    // Get the portion of the string before the last slash
    const parentPath = currentPathname.substring(0, lastSlashIndex);
  
    // Construct the new path by appending "/roomallotment"
    const newPath = `${parentPath}/roomallotment`;
  
    // Navigate to the new path
    navigate(newPath);
  };
  

  const fetchRoomsData = () => {
    fetch(`${apiUrl}/timetablemodule/addroom`,{credentials: 'include'})
      .then(handleResponse)
      .then((data) => {
        const filteredRooms = data.filter((room) => room.code === currentCode);
        setRooms(filteredRooms);
      })
      .catch(handleError);
  };

  // const fetchMasterRooms = () => {
  //   fetch(`${apiUrl}/timetablemodule/masterroom`,{credentials: 'include'})
  //     .then(handleResponse)
  //     .then((data) => {
  //       setMasterRooms(data);
  //     })
  //     .catch(handleError);
  // };
  const fetchAvailableDepartments = () => {
    fetch(`${apiUrl}/timetablemodule/faculty/dept`,{credentials: 'include'})
      .then(handleResponse)
      .then((data) => {
        const formattedDepartments = data.map((department) => ({
          value: department,
          label: department,
        }));
        setAvailableDepartment(formattedDepartments);
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
    if (rooms.some((room) => room.room === selectedMasterRoom)) {
      toast({
        position: 'top',
        title: "Room Already Added",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
  
    const selectedRoomObject = masterRooms.find(
      (masterRoom) => masterRoom.room === selectedMasterRoom
    );

    const dataToSave = {
      room: selectedMasterRoom,
      type: selectedRoomObject.type,
      code: currentCode,
    };

    fetch(`${apiUrl}/timetablemodule/addroom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
     credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
        // console.log('Data saved successfully:', data);
        // setSuccessMessage('Room added successfully!');
        toast({
          position: 'top',
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
    const isConfirmed = window.confirm("Are you sure you want to delete this room?");
    
    if (isConfirmed) {
      setIsLoading({
        state: true,
        id: roomId,
      });
  
      fetch(`${apiUrl}/timetablemodule/addroom/${roomId}`, {
        method: "DELETE",
        credentials: 'include',
      })
        .then(handleResponse)
        .then(() => {
          fetchRoomsData();
        })
        .catch(handleError)
        .finally(() => {
          setIsLoading({
            ...isLoading,
            state: false,
          });
        });
    }
  };
  
  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setSelectedDepartment(selectedDepartment);
  };
  // useEffect(()=>{
  //   setTimeout(() => {
  //     setSuccessMessage('')
  //   }, 1500);
  // },[successMessage])

  return (
    <Container maxW="5xl">
      {/* <Heading as="h1" size="xl" mt="6" mb="6">
        Add Rooms
      </Heading> */}
      <Header title="Add Rooms "></Header>

      {/* <SuccessMessage message={successMessage} /> */}
      <Box>
        <Box mb="1">
          <Text as="b">Room</Text>
        </Box>
        {/* <Select
          value={selectedMasterRoom}
          onChange={(e) => setSelectedMasterRoom(e.target.value)}
        >
          <option value="">Select a Room</option>
          {masterRooms.map((masterRoom) => (
            <option key={masterRoom._id} value={masterRoom.room}>
              {masterRoom.room}
            </option>
          ))}
        </Select> */}
                <FormControl isRequired mb="2.5">
          <FormLabel>Department:</FormLabel>
          <Select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            isRequired
          >
            <option value="">Select a Department</option>
            {availableDepartment.map((department) => (
              <option key={department.value} value={department.value}>
                {department.label}
              </option>
            ))}
          </Select>
        </FormControl>
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

      </Box >
        <Box display='flex' mt='2' justifyContent='space-between'
        >
          <Button bg="teal" color="white" ml="0" mt="2.5" onClick={handleSubmit}>
            Add Room
          </Button>
          
                <Box ml="-1">
                <Link to="/tt/viewmrooms">
          <Button ml="0">View Master Rooms</Button>
                </Link>
                <Button bg="teal" color="white" ml="0" mt="2.5" onClick={handleViewRoom}>
            View Centrally Alloted Rooms
          </Button>

                </Box>
        </Box>
      <TableContainer>
        <Box>
          <Text as="b">Room Data(Total Entries: {rooms.length}):</Text>
          <Table variant="striped" size="md" mt="1">
            <Thead>
              <Tr>
                <Th>
                  <Center>Room</Center>
                </Th>
                <Th>
                  <Center>Room Type</Center>
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
                    <Center>{room.type} </Center>
                  </Td>
                  <Td>
                    <Center>
                      <CustomDeleteButton
                        isLoading = {isLoading.state && isLoading.id == room._id}
                       
                        onClick={() => handleDelete(room._id)}
                      >
                        Delete
                      </CustomDeleteButton>
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
