import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import getEnvironment from "../../getenvironment";
import {
  Container,
  Box,
  Input,
  Button,
  VStack,
  Textarea,
} from "@chakra-ui/react";
import { FormControl, FormLabel} from "@chakra-ui/react";
import { IconButton as Button1, Heading, chakra } from '@chakra-ui/react';
import { useToast } from "@chakra-ui/react";
import Header from "../../components/header";

function EventForm() {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    paperSubmissionDate: "",
    reviewTime: "",
    // instructions: "",
  });

  const toast = useToast();
  const apiUrl = getEnvironment();

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: formattedValue,
    }));
  };
  
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const eventId = parts[parts.length - 3];

  useEffect(() => {
    const fetchEventById = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/reviewmodule/event/${eventId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if(response.ok)
        {
        const data = await response.json();
        console.log(data)
        setFormData({
          ...data,
          // Extracting date part only
          startDate: data.startDate ? data.startDate.split("T")[0] : "",
          endDate: data.endDate ? data.endDate.split("T")[0] : "",
          paperSubmissionDate: data.paperSubmissionDate
            ? data.paperSubmissionDate.split("T")[0]
            : "",
        });
      }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchEventById();
  }, [apiUrl, eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/reviewmodule/event/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Conference data updated",
          status: "success",
          duration: 6000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        // Handle non-OK response
        toast({
          title: "Error updating conference data",
          description: "Please try again later",
          status: "error",
          duration: 6000,
          isClosable: true,
          position: "bottom",
        });
      }
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
      // Handle fetch error
      toast({
        title: "Error updating conference data",
        description: "Please try again later",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const HeaderEditorPage = ({ title }) => {
    const navigate = useNavigate();
    
    return (
      <Heading display='flex' >
        <Button1
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
        </Button1>
        <chakra.div marginInline='auto' color="white" fontSize='30px' mt='2' >
          {title}
        </chakra.div>
      </Heading>
    );
  };

  const clearAllInputs = () => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.value = '';
    });
  };

  return (
    <Container maxWidth={{ base: "100%", md: "md" }} p={5} mx="auto" bg="white" >
      <Box bg="black" p={0.01} borderTopRadius="md" >
        <HeaderEditorPage  color="white" textAlign="center" title="Add conference details"/>
      </Box>
      <Box bg="white" p={8} borderBottomRadius="md">
        <form onSubmit={handleSubmit}>
          <FormControl id="name" mb={4}>
            <FormLabel>Name</FormLabel>
            <Input
              type="text"
              name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl id="startDate" mb={4}>
              <FormLabel>Start Date of the conference</FormLabel>
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl id="endDate" mb={4}>
              <FormLabel >End Date of the conference</FormLabel>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl id="paperSubmissionDate" mb={4}>
              <FormLabel>Paper Submission Deadline</FormLabel>
              <Input
                type="date"
                name="paperSubmissionDate"
                value={formData.paperSubmissionDate}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl id="reviewTime" mb={4}>
              <FormLabel>Review Time</FormLabel>
              <Input
                type="text"
                name="reviewTime"
                value={formData.reviewTime}
                onChange={handleChange}
              />
            </FormControl>          
            <FormControl id="name" mb={4}>
              <FormLabel>List of Editors</FormLabel>
              <Input
                type="text"
                name="name"
                value={formData.editor}
                onChange={handleChange}
              />
            </FormControl>

            <Box display="flex" justifyContent="center" p={4}>
              <Button type="submit" size='lg' style={{backgroundColor:'green',width:'100px'}}>
                Save
              </Button>
              <Button onClick={clearAllInputs} type="submit" size='lg' style={{ backgroundColor: '#CC0000',width:'100px' }}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
  );
}

export default EventForm;