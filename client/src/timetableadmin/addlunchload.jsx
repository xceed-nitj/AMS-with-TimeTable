import React, { useState, useEffect } from "react";
import { Button, FormControl, FormLabel, Input, Select,HStack, VStack,  Container, Box, Text } from '@chakra-ui/react';
import getEnvironment from '../getenvironment';
import Header from "../components/header";




const LunchLoad = () => {
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
    }, [apiUrl, currentCode]);
  
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
    }, [selectedSemester, currentCode, apiUrl]);
  
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
        setResponseMessage(`POST request successful: ${JSON.stringify(responseData)}`);
      } catch (error) {
        setResponseMessage(`Error making POST request: ${error.message}`);
      }
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

      </Container>
    );
  };
  
export default LunchLoad;
