import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  Button,
  VStack,
  HStack,
  useToast,
  IconButton
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import getEnvironment from "../getenvironment";
import axios from 'axios';


const TreeForm = () => {
  const [contributors, setContributors] = useState([
    { name: '', designation: '', linkedin: '', image: null }
  ]);
  const apiUrl = getEnvironment();
  const toast = useToast();

  const [moduleDetails, setModuleDetails] = useState({
    name: '',
    description: '',
    yearLaunched: '',
  });

  // Handle form field changes
  const handleModuleChange = (e) => {
    setModuleDetails({
      ...moduleDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleContributorChange = (index, e) => {
    const updatedContributors = [...contributors];
    updatedContributors[index] = {
      ...updatedContributors[index],
      [e.target.name]: e.target.value,
    };
    setContributors(updatedContributors);
  };

  const handleImageChange = (index, e) => {
    const updatedContributors = [...contributors];
    updatedContributors[index].image = e.target.files[0];
    setContributors(updatedContributors);
  };

  const addContributor = () => {
    setContributors([
      ...contributors,
      { name: '', designation: '', linkedin: '', image: null },
    ]);
  };

  const removeContributor = (index) => {
    const updatedContributors = contributors.filter((_, i) => i !== index);
    setContributors(updatedContributors);
  };

  // Handle form submission

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Prepare the form data
    const formData = new FormData();
    formData.append('name', moduleDetails.name);
    formData.append('description', moduleDetails.description);
    formData.append('yearLaunched', moduleDetails.yearLaunched);
  
    // Append contributors as a single JSON string
    formData.append('contributors', JSON.stringify(contributors));
  
    contributors.forEach((contributor) => {
      if (contributor.image) {
        formData.append('contributorImages', contributor.image); // Add corresponding image
      }
    });
  
    try {
      const response = await axios.post(`${apiUrl}/platform/add-module`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      toast({
        title: "Module added successfully!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      console.log(response.data);
    } catch (error) {
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
      } else if (error.request) {
        console.error('Request data:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      toast({
        title: 'Error adding module! ',
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  

  return (
    <Box w="500px" p="5" boxShadow="md" borderRadius="lg" bg="gray.50">
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        {/* Module Title */}
        <FormControl isRequired>
          <FormLabel>Module Name</FormLabel>
          <Input
            name="name"
            value={moduleDetails.name}
            onChange={handleModuleChange}
            placeholder="Enter module name"
          />
        </FormControl>

        {/* Module Description */}
        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            value={moduleDetails.description}
            onChange={handleModuleChange}
            placeholder="Enter module description"
          />
        </FormControl>

        {/* Year Launched */}
        <FormControl isRequired>
          <FormLabel>Year Launched</FormLabel>
          <NumberInput
            min={2000}
            max={2100}
            value={moduleDetails.yearLaunched}
            onChange={(value) =>
              setModuleDetails({ ...moduleDetails, yearLaunched: value })
            }
          >
            <NumberInputField name="yearLaunched" />
          </NumberInput>
        </FormControl>

        {/* Contributors Section */}
        <FormLabel>Contributors</FormLabel>
        {contributors.map((contributor, index) => (
          <Box key={index} w="100%" p="4" border="1px" borderColor="gray.200" borderRadius="md">
            <HStack spacing={4} mb={2}>
              <FormControl isRequired>
                <FormLabel>Contributor Name</FormLabel>
                <Input
                  name="name"
                  value={contributor.name}
                  onChange={(e) => handleContributorChange(index, e)}
                  placeholder="Enter name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Designation</FormLabel>
                <Input
                  name="designation"
                  value={contributor.designation}
                  onChange={(e) => handleContributorChange(index, e)}
                  placeholder="Enter designation"
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} mb={2}>
              <FormControl>
                <FormLabel>LinkedIn</FormLabel>
                <Input
                  name="linkedin"
                  value={contributor.linkedin}
                  onChange={(e) => handleContributorChange(index, e)}
                  placeholder="Enter LinkedIn profile link"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Contributor Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(index, e)}
                />
              </FormControl>
            </HStack>

            <IconButton
              aria-label="Remove contributor"
              icon={<DeleteIcon />}
              onClick={() => removeContributor(index)}
              colorScheme="red"
              size="sm"
            />
          </Box>
        ))}

        {/* Button to add more contributors */}
        <Button
          onClick={addContributor}
          leftIcon={<AddIcon />}
          colorScheme="teal"
          variant="outline"
          w="100%"
        >
          Add Contributor
        </Button>

        {/* Submit Button */}
        <Button type="submit" colorScheme="blue" size="lg" w="100%">
          Submit
        </Button>
      </VStack>
    </Box>
  );
};

export default TreeForm;
