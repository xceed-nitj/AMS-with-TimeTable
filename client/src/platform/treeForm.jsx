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
  Text,
  HStack,
  useToast,
  IconButton,
  Img
} from '@chakra-ui/react';
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import getEnvironment from "../getenvironment";
import axios from 'axios';

const TreeForm = () => {
  const [contributors, setContributors] = useState([{ name: '', designation: '', linkedin: '', image: null }]);
  const [submittedModules, setSubmittedModules] = useState([]); // Store submitted modules
  const [updating, setUpdating] = useState(false);
  const apiUrl = getEnvironment();
  const toast = useToast();

  const [moduleDetails, setModuleDetails] = useState({
    id: '',
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
  
    // Append images if they exist
    contributors.forEach((contributor) => {
      if (contributor.image) {
        formData.append('contributorImages', contributor.image);
      }
    });
  
    try {
      // Conditional API call: if `moduleDetails.id` exists, use the update API
      const response = await fetch(`${apiUrl}/platform/add-module`, // Add new module
        {
          method: 'POST', // PATCH for update, POST for add
          body: formData, // Attach FormData directly as the body
        }
      );
  
      if (response.ok) {
        toast({
          title: "Module added successfully!", // Success message for add
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
        window.location.reload();
      } else {
        throw new Error(moduleDetails.id ? 'Failed to update module' : 'Failed to add module');
      }
    } catch (error) {
      console.error(moduleDetails.id ? 'Error updating module:' : 'Error adding module:', error);
      toast({
        title: moduleDetails.id ? 'Error updating module!' : 'Error adding module!',
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleUpdated = async (id, e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append('name', moduleDetails.name);
    formData.append('description', moduleDetails.description);
    formData.append('yearLaunched', moduleDetails.yearLaunched);
    formData.append('contributors', JSON.stringify(contributors));
    // Append images if they exist
    contributors.forEach((contributor) => {
      if (contributor.image) {
        formData.append('contributorImages', contributor.image);
      }
    });
  
    try {
      // API call
      const response = await fetch(`${apiUrl}/platform/update-module/${id}`, {
        method: 'PUT',
        body: formData,
      });
      console.log("response:", response.body.values);
  
      if (response.ok) {
        toast({
          title: "Module updated successfully!",
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
            contributors,
          },
        ]);
  
        // Reset form fields
        setModuleDetails({
          name: '',
          description: '',
          yearLaunched: '',
        });
        setContributors([{ name: '', designation: '', linkedin: '', image: null }]);
        setUpdating(false);
  
        // Optional: Reload the page if necessary
        // window.location.reload();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to update module: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: "Error updating module!",
        description: error.message || "Something went wrong.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  
  const fetchModuleDetails = async (moduleId) => {
    try {
      const response = await axios.get(`${apiUrl}/platform/get-modules/${moduleId}`);
      
      if (response.status === 200) {
  
        // Additional validation to check if the response contains the expected data
        if (!response.data || !response.data.name) {
          throw new Error("Module data is incomplete or invalid.");
        }
  
        return response.data;
      } else {
        throw new Error("Failed to fetch module details.");
      }
    } catch (err) {
      // Use toast to show the error message to the user
      toast({
        title: "Error",
        description: `Error fetching module: ${err.message}`,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      console.error("Error fetching module:", err.message);
      return null; // Returning null in case of error, you can modify based on your needs
    }
  };
  
  
  const handleUpdate = async (moduleId, e) => {
    e?.preventDefault();
    console.log("moduleId:", moduleId);
  
    if (!moduleId || typeof moduleId !== "string") {
      toast({
        title: "Error",
        description: "Invalid module ID format.",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }
  
    try {
      setUpdating(true);
  
      const result = await fetchModuleDetails(moduleId);
  
      if (!result || !result.name) {
        throw new Error("Module not found or invalid module ID.");
      }
  
      // Batch state updates
      setModuleDetails({
        id: moduleId,
        name: result.name || "",
        description: result.description || "",
        yearLaunched: result.yearLaunched || "",
      });
      setContributors(result.contributors || []);
      console.log("result:", result);
      toast({
        title: "Module loaded successfully.",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    } catch (err) {
      console.error("Error updating module:", {
        moduleId,
        message: err.message,
        stack: err.stack,
      });
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      // setUpdating(false);
    }
  };    

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${apiUrl}/platform/get-modules`);
      setSubmittedModules(response.data);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);


  const deleteModule = async (moduleId) => {
    try {
      const { data, status } = await axios.delete(`${apiUrl}/platform/delete-module/${moduleId}`);
      if (status === 200) {
        window.location.reload();
      } else {
        console.warn("Unexpected status code:", status);
      }
    } catch (error) {
      console.error("Error deleting module:", error?.response?.data?.message || error.message);
    }
  };
  
  

  return (
    <Box w="100%" p="5" borderRadius="lg">
      <VStack spacing={4} as="form" onSubmit={(e) => (updating ? handleUpdated(moduleDetails.id, e) : handleSubmit(e))}>
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
            {updating ? "Update Module" : "Submit"}
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
              <Td>
                <Text isTruncated maxW="150px" noOfLines={2}>
                  {module.name}
                </Text>
              </Td>
              <Td>
                <Text whiteSpace="normal" wordBreak="break-word">
                  {module.description}
                </Text>
              </Td>
              <Td>{module.yearLaunched}</Td>
              <Td>
                {module.contributors.map((contributor, i) => (
                  <Box key={i} mb={3}>
                    <strong>Name:</strong> {contributor.name} <br />
                    <strong>Designation:</strong> {contributor.designation} <br />
                    <strong>LinkedIn:</strong> <a href={contributor.linkedin} target="_blank" rel="noopener noreferrer">{contributor.linkedin}</a> <br />
                    {contributor.image && (
                      <Box>
                        <strong>Image:</strong>
                        <Img src={contributor.image} />
                        {contributor.image && contributor.image instanceof Blob ? (
                          <img
                            src={URL.createObjectURL(contributor.image)}
                            alt={contributor.name}
                            width="50"
                            height="50"
                            onLoad={(e) => URL.revokeObjectURL(e.target.src)} // Revoke the object URL to prevent memory leaks
                          />
                        ) : (
                          <span></span> // Fallback if no image is provided
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Td>
              <Td>
                <Button colorScheme="red" size="sm" onClick={() => deleteModule(module._id)}>
                  <DeleteIcon />
                </Button>
                <Button colorScheme="green" size="sm" onClick={(e) => handleUpdate(module._id, e)}>
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
