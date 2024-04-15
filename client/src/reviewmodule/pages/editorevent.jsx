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
import { FormControl, FormLabel } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";

function EventForm() {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    paperSubmissionDate: "",
    reviewTime: "",
    instructions: "",
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

  return (
    <Container>
      <Box maxW="md" mx="auto" mt={10}>
      <Link to={`/prm/${eventId}/editor/addEditor`}>   {/* Add This Link Button to where ever you want to add Editor Option */}
      <Button colorScheme="teal" mr={4}>
             Click Here to Add New Editor
            </Button>
          </Link>
        <form onSubmit={handleSubmit}>
          <FormControl id="name" mb={4}>
            <FormLabel>Name</FormLabel>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              isDisabled
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
            <FormLabel>End Date of the conference</FormLabel>
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
          <FormControl id="instructions" mb={4}>
            <FormLabel>Instructions</FormLabel>
            <Textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
            />
          </FormControl>  
          <Button type="submit" colorScheme="teal">
            Save
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default EventForm;
