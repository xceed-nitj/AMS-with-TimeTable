import React, { useState, useEffect } from 'react';
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
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import getEnvironment from "../getenvironment";
import axios from 'axios';

const TreeForm = () => {
  const [contributors, setContributors] = useState([{ name: '', designation: '', linkedin: '', image: null }]);
  const [submittedModules, setSubmittedModules] = useState([]); // Store submitted modules
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
    setContributors([...contributors, { name: '', designation: '', linkedin: '', image: null }]);
  };

  const removeContributor = (index) => {
    const updatedContributors = contributors.filter((_, i) => i !== index);
    setContributors(updatedContributors);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', moduleDetails.name);
    formData.append('description', moduleDetails.description);
    formData.append('yearLaunched', moduleDetails.yearLaunched);
    formData.append('contributors', JSON.stringify(contributors));

    contributors.forEach((contributor) => {
      if (contributor.image) {
        formData.append('contributorImages', contributor.image);
      }
    });

    try {
      const response = await axios.post(`http://localhost:8010/platform/add-module`, formData, {
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

      setSubmittedModules((prevModules) => [
        ...prevModules,
        {
          name: moduleDetails.name,
          description: moduleDetails.description,
          yearLaunched: moduleDetails.yearLaunched,
          contributors: contributors,
        },
      ]);

      // Reset form fields
      setModuleDetails({
        name: '',
        description: '',
        yearLaunched: '',
      });
      setContributors([{ name: '', designation: '', linkedin: '', image: null }]);

    } catch (error) {
      toast({
        title: 'Error adding module!',
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const deleteModule = async (moduleId) => {
    try {
      const response = await axios.delete(`${apiUrl}/platform/delete-module/${moduleId}`);
      if (response.status === 200) {
        alert('Module deleted successfully');
      }
    } catch (error) {
      console.error(`Error deleting module with ID ${moduleId}:`, error);
    }
  };
  

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${apiUrl}/platform/get-modules`);
      console.log(response.data);
      return response.data;  // Return fetched module data
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);


  const updateModule = async (moduleId, updatedData) => {
    try {
      const response = await axios.patch(`${apiUrl}/platform/modules/${moduleId}`, updatedData);
      if (response.status === 200) {
        alert('Module updated successfully');
      }
    } catch (error) {
      console.error(`Error updating module with ID ${moduleId}:`, error);
    }
  };
  

  return (
    <Box w="100%" p="5" borderRadius="lg">
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
            onChange={(value) => setModuleDetails({ ...moduleDetails, yearLaunched: value })}
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

      {/* Display Submitted Modules */}
      <TableContainer mt={6}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Sr. No</Th>
              <Th>Module Name</Th>
              <Th>Description</Th>
              <Th>Year Launched</Th>
              <Th>Contributors</Th>
              <Th>Edit/Delete</Th>
            </Tr>
          </Thead>
          <Tbody>
            {submittedModules.map((module, index) => (
              <Tr key={index}>
                <Td>{index + 1}</Td>
                <Td>{module.name}</Td>
                <Td>{module.description}</Td>
                <Td>{module.yearLaunched}</Td>
                <Td>
                  {module.contributors.map((contributor, i) => (
                    <Box key={i} mb={3}>
                      <strong>Name:</strong> {contributor.name} <br />
                      <strong>Designation:</strong> {contributor.designation} <br />
                      <strong>LinkedIn:</strong> <a href={contributor.linkedin} target="_blank" rel="noopener noreferrer">{contributor.linkedin}</a> <br />
                      {contributor.image && (
                        <Box>
                          <strong>Image:</strong> <img src={URL.createObjectURL(contributor.image)} alt={contributor.name} width="50" height="50" />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Td>
                <Td>
                  <Button colorScheme="red" size="sm" onClick={() => deleteModule(module._id)}>
                    <DeleteIcon />
                  </Button>
                  <Button colorScheme="green" size="sm" onClick={() => handleUpdate(module._id)}>
                    <EditIcon />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TreeForm;
