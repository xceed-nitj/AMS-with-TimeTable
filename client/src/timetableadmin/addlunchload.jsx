import React, { useState, useEffect } from "react";
import { Button, FormControl, FormLabel, useToast , Input,Table,Thead,Tr,Th,Td,Tbody, Select,HStack, VStack,  Container, Box, Text } from '@chakra-ui/react';
import getEnvironment from '../getenvironment';
import Header from "../components/header";




const LunchLoad = () => {
  const toast = useToast();

    const apiUrl = getEnvironment();
    const currentURL = window.location.pathname;
    const parts = currentURL.split('/');
    const currentCode = parts[parts.length - 2];
  
    const [formData, setFormData] = useState({
      day: '',
      slot: 'lunch',
      slotData: [
        {
          subject: '',
          faculty: '',
          room: '',
        },
      ],
      sem: '',
      code: '',
    });
  
    const [responseMessage, setResponseMessage] = useState('');
    const [availableSems, setAvailableSems] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [availableFaculties, setAvailableFaculties] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState([]);
    const [lunchData, setLunchData] = useState([]);


    const semesters=availableSems;
  
    useEffect(() => {
      const fetchSem = async () => {
        try {
          const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            const filteredSems = data.filter((sem) => sem.code === currentCode);
            const semValues = filteredSems.map((sem) => sem.sem);
  
            setAvailableSems(semValues);
            setSelectedSemester(semValues[0]);
          }
        } catch (error) {
          console.error('Error fetching sem data:', error);
        }
      };
      fetchSem();
      fetchLunchLoad();
    }, []);
  
    useEffect(() => {
      const fetchSubjects = async (currentCode, selectedSemester) => {
        try {
          const response = await fetch(
            `${apiUrl}/timetablemodule/subject/filteredsubject/${currentCode}/${selectedSemester}`,
            { credentials: 'include' }
          );
          if (response.ok) {
            const data = await response.json();
            setAvailableSubjects(data);
          }
        } catch (error) {
          console.error('Error fetching subject data:', error);
        }
      };
  
      const fetchRoom = async (currentCode) => {
        try {
          const response = await fetch(`${apiUrl}/timetablemodule/addroom?code=${currentCode}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            const filteredRooms = data.filter((room) => room.code === currentCode);
            const roomValues = filteredRooms.map((room) => room.room);
  
            setAvailableRooms(roomValues);
          }
        } catch (error) {
          console.error('Error fetching room data:', error);
        }
      };
  
      const fetchFaculty = async (currentCode, selectedSemester) => {
        try {
          const response = await fetch(
            `${apiUrl}/timetablemodule/addfaculty/filteredfaculty/${currentCode}/${selectedSemester}`,
            { credentials: 'include' }
          );
          if (response.ok) {
            const data = await response.json();
            setAvailableFaculties(data[0].faculty);
          }
        } catch (error) {
          console.error('Error fetching faculty data:', error);
        }
      };
  
      fetchSubjects(currentCode, selectedSemester);
      fetchRoom(currentCode);
      fetchFaculty(currentCode, selectedSemester);
    }, [selectedSemester]);
  
    const handleInputChange = (field, value) => {
      setFormData({
        ...formData,
        [field]: value,
      });
    };
  
    const handleSlotDataChange = (index, field, value) => {
      const updatedSlotData = [...formData.slotData];
      updatedSlotData[index][field] = value;
  
      setFormData({
        ...formData,
        slotData: updatedSlotData,
      });
    };
  
    const handlePostRequest = async () => {
      try {
        const code = currentCode;
        // const sem = selectedSemester;
        const dataToSend = JSON.stringify({ formData });
        console.log('data to be sent',dataToSend)
        const response = await fetch(`${apiUrl}/timetablemodule/tt/savelunchslot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({formData, selectedSemester, code}),
        });
  
        const responseData = await response.json();
        console.log(responseData)
        if(responseData.lunchrecords)
        {
            toast({
                position: 'top',
                title: "Lunch Slot Added",
                // description: "",
                status: "success",
                duration: 2000,
                isClosable: true,
              });
        }
        // setResponseMessage(`POST request successful: ${JSON.stringify(responseData)}`);
        setLunchData(responseData.lunchrecords)
    } catch (error) {
        setResponseMessage(`Error making POST request: ${error.message}`);
      }
    };
console.log('lunchdaataa',lunchData)

const handleDelete = (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this alloment?');
  
    if (isConfirmed) {
      fetch(`${apiUrl}/timetablemodule/tt/deletelunchslot/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then(handleResponse)
        .then(() => {
            toast({
                position: 'top',
                title: "Slot deleted",
                // description: "",
                status: "success",
                duration: 2000,
                isClosable: true,
              });
          fetchLunchLoad();
        })
        .catch(handleError);
    }
  };
  
  const fetchLunchLoad = () => {
    fetch(`${apiUrl}/timetablemodule/tt/getlunchslot/${currentCode}`, {
      credentials: 'include',
    })
      .then(handleResponse)
      .then((data) => {
    console.log("lunchdata",data.lunchrecords)
        setLunchData(data.lunchrecords);
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
    console.error('Error:', error);
  };

    return (
      <Container maxW="9xl" centerContent>
     <Header title="Add Lunch Hour load"></Header>

     <HStack spacing={2}>
  <FormControl>
  <FormLabel>Semester</FormLabel>

    <Box display="flex" mb="0.5">
      {/* <Text fontWeight="bold">Select Sem:</Text> */}
      <Select
        value={selectedSemester}
        onChange={(e) => setSelectedSemester(e.target.value)}
        maxW="10rem"
      >
        <option value="">Select</option>
        {semesters.map((semester, index) => (
          <option key={index} value={semester}>
            {semester}
          </option>
        ))}
      </Select>
    </Box>
  </FormControl>

  <FormControl>
  <FormLabel>Day</FormLabel>

    <Select
      placeholder="Select day"
      value={formData.day}
      onChange={(e) => handleInputChange('day', e.target.value)}
      maxW="9rem"
    >
      <option value="Monday">Monday</option>
      <option value="Tuesday">Tuesday</option>
      <option value="Wednesday">Wednesday</option>
      <option value="Thursday">Thursday</option>
      <option value="Friday">Friday</option>
    </Select>
  </FormControl>

  {/* Additional fields can be added here */}
  {formData.slotData.map((slot, index) => (
    <React.Fragment key={index}>
      <FormControl>
        <FormLabel>Subject</FormLabel>
        <Select
          placeholder="Select subject"
          value={slot.subject}
          onChange={(e) => handleSlotDataChange(index, 'subject', e.target.value)}
        >
          {availableSubjects.map((subjectOption) => (
            <option key={subjectOption._id} value={subjectOption.subName}>
              {subjectOption.subName}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Faculty</FormLabel>
        <Select
          placeholder="Select faculty"
          value={slot.faculty}
          onChange={(e) => handleSlotDataChange(index, 'faculty', e.target.value)}
        >
          {availableFaculties.map((faculty, index) => (
            <option key={index} value={faculty}>
              {faculty}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Room</FormLabel>
        <Select
          placeholder="Select room"
          value={slot.room}
          onChange={(e) => handleSlotDataChange(index, 'room', e.target.value)}
        >
          {availableRooms.map((roomOption) => (
            <option key={roomOption} value={roomOption}>
              {roomOption}
            </option>
          ))}
        </Select>
      </FormControl>
    </React.Fragment>
  ))}
</HStack>

        <Button colorScheme="teal" onClick={handlePostRequest}>
            Submit
          </Button>
          <Container maxW="6xl" centerContent>
  {lunchData.length === 0 ? (
    <p>***</p>
  ) : (
    <Table variant="striped">
      <Thead>
        <Tr>
          <Th>Semester</Th>
          <Th>Day</Th>
          <Th>Subject</Th>
          <Th>Faculty</Th>
          <Th>Room</Th>
          <Th>Action</Th> {/* Add delete button column */}
        </Tr>
      </Thead>
      <Tbody>
        {lunchData.map((record) => (
          <Tr key={record._id}>
            <Td>{record.sem}</Td>
            <Td>{record.day}</Td>
            <Td>{record.slotData[0].subject}</Td>
            <Td>{record.slotData[0].faculty}</Td>
            <Td>{record.slotData[0].room}</Td>
            <Td>
              <Button colorScheme="red" onClick={() => handleDelete(record._id)}>
                Delete
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )}
</Container>

      </Container>

      
    );
  };
  
export default LunchLoad;
