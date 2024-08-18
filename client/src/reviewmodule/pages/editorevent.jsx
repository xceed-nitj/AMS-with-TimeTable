import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import {
  Container,
  Box,
  Input,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  useToast,
  IconButton as Button1,
  Heading,
  chakra,
  Select
} from "@chakra-ui/react";
import Header from "../../components/header";

function EventForm() {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    paperSubmissionDate: "",
    reviewTime: "",
    editorEmails: []
  });

  const toast = useToast();
  const apiUrl = getEnvironment();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
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
            credentials: "include"
          }
        );
        if (response.ok) {
          const data = await response.json();
          setFormData({
            ...data,
            startDate: data.startDate ? data.startDate.split("T")[0] : "",
            endDate: data.endDate ? data.endDate.split("T")[0] : "",
            paperSubmissionDate: data.paperSubmissionDate ? data.paperSubmissionDate.toString().slice(0, 16) : "",
            editorEmails: data.editor.map(editor => editor.email).flat()
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchEventById();
  }, [apiUrl, eventId]);

  const validateDates = () => {
    const now = new Date();
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const paperSubmissionDate = new Date(formData.paperSubmissionDate);

    if (endDate <= startDate) {
      toast({
        title: "Invalid end date",
        description: "End date should be after the start date!",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "bottom"
      });
      return false;
    }

    if (paperSubmissionDate <= now) {
      toast({
        title: "Invalid submission date",
        description: "Submission date should be a future date",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "bottom"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDates()) return;

    try {
      const formdate = new Date(formData.paperSubmissionDate);
      const finalDate = new Date(formdate.getTime() - formdate.getTimezoneOffset() * 60000).toISOString();
      const response = await fetch(
        `${apiUrl}/api/v1/reviewmodule/event/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({...formData,paperSubmissionDate: finalDate}),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Conference data updated",
          status: "success",
          duration: 6000,
          isClosable: true,
          position: "bottom"
        });
      } else {
        toast({
          title: "Error updating conference data",
          description: "Please try again later",
          status: "error",
          duration: 6000,
          isClosable: true,
          position: "bottom"
        });
      }
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error updating conference data",
        description: "Please try again later",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "bottom"
      });
    }
  };

  const HeaderEditorPage = ({ title }) => {
    const navigate = useNavigate();

    return (
      <Heading display="flex">
        <Button1
          mb="1"
          variant="ghost"
          onClick={() => navigate(-1)}
          _hover={{ bgColor: "transparent" }}
        >
          <chakra.svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="white"
            className="w-6 h-6"
            _hover={{ stroke: "#00BFFF" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </chakra.svg>
        </Button1>
        <chakra.div marginInline="auto" color="white" fontSize="30px" mt="2">
          {title}
        </chakra.div>
      </Heading>
    );
  };

  const clearAllInputs = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      paperSubmissionDate: "",
      reviewTime: "",
      editorEmails: []
    });
  };

  const handleAddEditor = () => {
    setFormData((prevData) => ({
      ...prevData,
      editorEmails: [...prevData.editorEmails, ""]
    }));
  };

  const handleDeleteEditor = (index) => {
    setFormData((prevData) => ({
      ...prevData,
      editorEmails: prevData.editorEmails.filter((_, i) => i !== index)
    }));
  };

  const handleEditorEmailChange = (index, value) => {
    setFormData((prevData) => {
      const newEditorEmails = [...prevData.editorEmails];
      newEditorEmails[index] = value;
      return { ...prevData, editorEmails: newEditorEmails };
    });
  };

  return (
    <Container maxWidth={{ base: "100%", md: "80%" }} p={5} mx="auto" bg="white">
      <Box bg="black" p={0.01} borderTopRadius="md">
        <HeaderEditorPage color="white" textAlign="center" title="Add conference details" />
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
              type="datetime-local"
              name="paperSubmissionDate"
              value={formData.paperSubmissionDate}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl id="reviewTime" mb={4}>
            <FormLabel>Review Time</FormLabel>
            <Select
              name="reviewTime"
              value={formData.reviewTime}
              onChange={handleChange}
            >
              {[...Array(60).keys()].map(day => (
                <option key={day + 1} value={day + 1}>{day + 1} </option>
              ))}
            </Select>
          </FormControl>
          <FormControl id="editorEmails" mb={4}>
            <HStack justifyContent="space-between">
              <FormLabel>List of Editors</FormLabel>
              <Button colorScheme="blue" size="sm" onClick={handleAddEditor}>
                Add Editor
              </Button>
            </HStack>
            <VStack align="stretch">
              {formData.editorEmails.map((email, index) => (
                <HStack key={index} p={2} border="1px" borderRadius="md">
                  <Input
                    flex="1"
                    value={email}
                    onChange={(e) => handleEditorEmailChange(index, e.target.value)}
                    placeholder="Editor Email"
                  />
                  {formData.editorEmails.length > 1 && (
                    <Button size="sm" colorScheme="red" onClick={() => handleDeleteEditor(index)}>
                      Delete
                    </Button>
                  )}
                </HStack>
              ))}
            </VStack>
          </FormControl>
          <Box display="flex" justifyContent="center" p={4}>
            <Button type="submit" size="lg" style={{ backgroundColor: 'green', width: '100px' }}>
              Save
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
}

export default EventForm;
