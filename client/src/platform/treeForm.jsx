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
  Img,
  Card,
  CardBody,
  Heading,
  SimpleGrid,Link,Center,
  useColorModeValue
} from '@chakra-ui/react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon,AttachmentIcon, EditIcon } from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import axios from 'axios';

const TreeForm = () => {
  const [contributors, setContributors] = useState([
    { name: '', designation: '', linkedin: '', image: null },
  ]);
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
      const response = await fetch(
        `${apiUrl}/platform/add-module`, // Add new module
        {
          method: 'POST', // PATCH for update, POST for add
          body: formData, // Attach FormData directly as the body
        }
      );

      if (response.ok) {
        toast({
          title: 'Module added successfully!', // Success message for add
          status: 'success',
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
        setContributors([
          { name: '', designation: '', linkedin: '', image: null },
        ]);
        window.location.reload();
      } else {
        throw new Error(
          moduleDetails.id ? 'Failed to update module' : 'Failed to add module'
        );
      }
    } catch (error) {
      console.error(
        moduleDetails.id ? 'Error updating module:' : 'Error adding module:',
        error
      );
      toast({
        title: moduleDetails.id
          ? 'Error updating module!'
          : 'Error adding module!',
        status: 'error',
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
      console.log('response:', response.body.values);

      if (response.ok) {
        toast({
          title: 'Module updated successfully!',
          status: 'success',
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
        setContributors([
          { name: '', designation: '', linkedin: '', image: null },
        ]);
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
        title: 'Error updating module!',
        description: error.message || 'Something went wrong.',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const fetchModuleDetails = async (moduleId) => {
    try {
      const response = await axios.get(
        `${apiUrl}/platform/get-modules/${moduleId}`
      );

      if (response.status === 200) {
        // Additional validation to check if the response contains the expected data
        if (!response.data || !response.data.name) {
          throw new Error('Module data is incomplete or invalid.');
        }

        return response.data;
      } else {
        throw new Error('Failed to fetch module details.');
      }
    } catch (err) {
      // Use toast to show the error message to the user
      toast({
        title: 'Error',
        description: `Error fetching module: ${err.message}`,
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      console.error('Error fetching module:', err.message);
      return null; // Returning null in case of error, you can modify based on your needs
    }
  };

  const handleUpdate = async (moduleId, e) => {
    e?.preventDefault();
    console.log('moduleId:', moduleId);

    if (!moduleId || typeof moduleId !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid module ID format.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setUpdating(true);

      const result = await fetchModuleDetails(moduleId);

      if (!result || !result.name) {
        throw new Error('Module not found or invalid module ID.');
      }

      // Batch state updates
      setModuleDetails({
        id: moduleId,
        name: result.name || '',
        description: result.description || '',
        yearLaunched: result.yearLaunched || '',
      });
      setContributors(result.contributors || []);
      console.log('result:', result);
      toast({
        title: 'Module loaded successfully.',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err) {
      console.error('Error updating module:', {
        moduleId,
        message: err.message,
        stack: err.stack,
      });
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
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
      console.error('Error fetching modules:', error);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const deleteModule = async (moduleId) => {
    try {
      const { data, status } = await axios.delete(
        `${apiUrl}/platform/delete-module/${moduleId}`
      );
      if (status === 200) {
        window.location.reload();
      } else {
        console.warn('Unexpected status code:', status);
      }
    } catch (error) {
      console.error(
        'Error deleting module:',
        error?.response?.data?.message || error.message
      );
    }
  };

  return (
    <Box w="100%" maxW="1200px" mx="auto" p={6} bg="gray.50" minH="100vh">
      <Card
        bg="white"
        shadow="2xl"
        borderRadius="2xl"
        mb={8}
        borderTop="4px"
        borderTopColor="blue.400"
        _hover={{ transform: 'translateY(-2px)', shadow: '2xl' }}
        transition="all 0.3s ease"
      >
        <CardBody p={8}>
          <VStack
            spacing={6}
            as="form"
            onSubmit={(e) =>
              updating ? handleUpdated(moduleDetails.id, e) : handleSubmit(e)
            }
          >
            {/* Module Information Section Header with gradient */}
            <Box w="100%" textAlign="left">
              <Heading
                size="lg"
                bgGradient="linear(to-r, blue.500, purple.500)"
                bgClip="text"
                mb={4}
                fontWeight="bold"
              >
                Module Information
              </Heading>
            </Box>
            {/* Module Title */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
              <FormControl isRequired>
                <FormLabel color="gray.600" fontWeight="semibold">
                  Module Name{' '}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </FormLabel>
                <Input
                  name="name"
                  value={moduleDetails.name}
                  onChange={handleModuleChange}
                  placeholder="Enter module name"
                  size="lg"
                  borderRadius="md"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                />
              </FormControl>
              {/* Year Launched */}
              <FormControl isRequired>
                <FormLabel color="gray.600" fontWeight="semibold">
                  Year Launched{' '}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </FormLabel>
                <NumberInput
                  min={2000}
                  max={2100}
                  value={moduleDetails.yearLaunched}
                  onChange={(value) =>
                    setModuleDetails({ ...moduleDetails, yearLaunched: value })
                  }
                  size="lg"
                >
                  <NumberInputField
                    name="yearLaunched"
                    borderRadius="md"
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                  />
                </NumberInput>
              </FormControl>
            </SimpleGrid>
            {/* Module Description */}
            {/* Module Description - Full width with enhanced styling */}
            <FormControl isRequired w="100%">
              <FormLabel color="gray.700" fontWeight="600">
                Description{' '}
                <Text as="span" color="red.400">
                  *
                </Text>
              </FormLabel>
              <Textarea
                name="description"
                value={moduleDetails.description}
                onChange={handleModuleChange}
                placeholder="Enter module description"
                size="lg"
                rows={4}
                borderRadius="lg"
                border="2px"
                borderColor="gray.200"
                _hover={{ borderColor: 'blue.300' }}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px #3182ce',
                  transform: 'scale(1.01)',
                }}
                transition="all 0.2s ease"
              />
            </FormControl>

            {/* Contributors Section */}
            <Box w="100%">
              <Heading
                size="md"
                bgGradient="linear(to-r, orange.400, pink.400)"
                bgClip="text"
                mb={6}
                fontWeight="bold"
              >
                Contributors
              </Heading>

              <VStack spacing={4} w="100%">
                {contributors.map((contributor, index) => (
                  <Card
                    key={index}
                    w="100%"
                    bg="linear-gradient(135deg, #fff5f5 0%,rgb(251, 230, 230) 100%)"
                    borderRadius="xl"
                    border="1px"
                    borderColor="red.200"
                    shadow="md"
                    _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                    transition="all 0.3s ease"
                  >
                    <CardBody p={6}>
                      <SimpleGrid
                        columns={{ base: 1, md: 2 }}
                        spacing={4}
                        mb={4}
                      >
                        <FormControl isRequired>
                          <FormLabel color="gray.700" fontWeight="600">
                            Contributor Name
                            <Text as="span" color="red.400">
                              *
                            </Text>
                          </FormLabel>
                          <Input
                            name="name"
                            value={contributor.name}
                            onChange={(e) => handleContributorChange(index, e)}
                            placeholder="Enter name"
                            bg="white"
                            borderRadius="lg"
                            border="2px"
                            borderColor="gray.200"
                            _hover={{ borderColor: 'orange.300' }}
                            _focus={{
                              borderColor: 'orange.400',
                              boxShadow: '0 0 0 1px #f6ad55',
                              transform: 'scale(1.02)',
                            }}
                            transition="all 0.2s ease"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel color="gray.700" fontWeight="600">
                            Designation{' '}
                            <Text as="span" color="red.400">
                              *
                            </Text>
                          </FormLabel>
                          <Input
                            name="designation"
                            value={contributor.designation}
                            onChange={(e) => handleContributorChange(index, e)}
                            placeholder="Enter designation"
                            bg="white"
                            borderRadius="lg"
                            border="2px"
                            borderColor="gray.200"
                            _hover={{ borderColor: 'orange.300' }}
                            _focus={{
                              borderColor: 'orange.400',
                              boxShadow: '0 0 0 1px #f6ad55',
                              transform: 'scale(1.02)',
                            }}
                            transition="all 0.2s ease"
                          />
                        </FormControl>
                      </SimpleGrid>

                      <SimpleGrid
                        columns={{ base: 1, md: 2 }}
                        spacing={4}
                        mb={4}
                      >
                        <FormControl>
                          <FormLabel color="gray.700" fontWeight="600">
                            LinkedIn
                          </FormLabel>
                          <Input
                            name="linkedin"
                            value={contributor.linkedin}
                            onChange={(e) => handleContributorChange(index, e)}
                            placeholder="Enter LinkedIn profile link"
                            bg="white"
                            borderRadius="lg"
                            border="2px"
                            borderColor="gray.200"
                            _hover={{ borderColor: 'blue.300' }}
                            _focus={{
                              borderColor: 'blue.400',
                              boxShadow: '0 0 0 1px #3182ce',
                              transform: 'scale(1.02)',
                            }}
                            transition="all 0.2s ease"
                          />
                        </FormControl>

                         <FormControl mb={4}>
                        <FormLabel color="gray.700" fontWeight="600" mb={2}>
                          Contributor Image
                        </FormLabel>
                        <Box position="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(index, e)}
                            position="absolute"
                            top="0"
                            left="0"
                            width="100%"
                            height="100%"
                            opacity="0"
                            cursor="pointer"
                            zIndex="2"
                          />
                          <Box
                            bg="white"
                            borderRadius="lg"
                            border="2px"
                            borderColor="purple.200"
                            borderStyle="dashed"
                            p={4}
                            cursor="pointer"
                            _hover={{ 
                              borderColor: 'purple.400',
                              bg: 'purple.50',
                              transform: 'scale(1.02)'
                            }}
                            transition="all 0.2s ease"
                            position="relative"
                            zIndex="1"
                            height="60px"
                          >
                            <HStack spacing={3} height="100%" alignItems="center">
                              <Box
                                p={2}
                                borderRadius="md"
                                bg="purple.100"
                                color="purple.500"
                              >
                                <AttachmentIcon boxSize={4} />
                              </Box>
                              <VStack spacing={0} alignItems="flex-start">
                                <Text 
                                  fontWeight="semibold" 
                                  color="purple.600"
                                  fontSize="sm"
                                >
                                  Choose Image File
                                </Text>
                                <Text 
                                  fontSize="xs" 
                                  color="gray.500"
                                >
                                  PNG, JPG, GIF up to 10MB
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </Box>
                      </FormControl>


                      </SimpleGrid>
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          leftIcon={<DeleteIcon />}
                          onClick={() => removeContributor(index)}
                          colorScheme="red"
                          size="sm"
                          variant="outline"
                          borderRadius="full"
                          _hover={{
                            bg: 'red.50',
                            transform: 'scale(1.05)',
                            shadow: 'md',
                          }}
                          transition="all 0.2s ease"
                        >
                          Remove
                        </Button>
                      </Box>
                    </CardBody>
                  </Card>
                ))}
                <Button
                  onClick={addContributor}
                  leftIcon={<AddIcon />}
                  bg="white"
                  color="blue.600"
                  border="3px"
                  borderColor="blue.200"
                  size="lg"
                  w="100%"
                  borderRadius="xl"
                  borderStyle="dashed"
                  h="70px"
                  fontSize="lg"
                  fontWeight="semibold"
                  _hover={{
                    bg: 'blue.50',
                    borderColor: 'blue.400',
                    transform: 'translateY(-2px)',
                    shadow: 'lg',
                  }}
                  transition="all 0.3s ease"
                >
                  Add Contributor
                </Button>
              </VStack>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              bgGradient="linear(to-r, green.400, teal.400)"
              color="white"
              size="lg"
              w="100%"
              h="70px"
              borderRadius="xl"
              fontSize="xl"
              fontWeight="bold"
              leftIcon={<Text fontSize="xl">✓</Text>}
              _hover={{
                bgGradient: 'linear(to-r, green.500, teal.500)',
                transform: 'translateY(-3px)',
                shadow: '2xl',
              }}
              _active={{
                transform: 'translateY(-1px)',
              }}
              transition="all 0.3s ease"
              shadow="lg"
            >
              {updating ? 'Update Module' : 'Submit'}
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Display Submitted Modules */}
      <Card 
        bg="white"
        shadow="2xl" 
        borderRadius="2xl"
        border="1px"
        borderColor="green.200"
        borderTop="4px"
        borderTopColor="green.400"
        _hover={{ transform: 'translateY(-2px)', shadow: '2xl' }}
        transition="all 0.3s ease"
      >
        <CardBody p={8}>
          <Box 
            w="100%" 
            bgGradient="linear(to-r, green.50, teal.50)" 
            p={4} 
            borderRadius="xl" 
            mb={6}
            border="1px"
            borderColor="green.100"
          >
            <Heading 
              size="lg" 
              bgGradient="linear(to-r, green.500, teal.500)"
              bgClip="text"
              fontWeight="bold"
            >
              Submitted Modules
            </Heading>
          </Box>
          
      <TableContainer borderRadius="xl" overflow="hidden" shadow="lg">
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.500, pink.500)">
                  <Th color="white" fontSize="sm" fontWeight="bold" py={4}>SR. NO</Th>
                  <Th color="white" fontSize="sm" fontWeight="bold" py={4}>MODULE NAME</Th>
                  <Th color="white" fontSize="sm" fontWeight="bold" py={4}>DESCRIPTION</Th>
                  <Th color="white" fontSize="sm" fontWeight="bold" py={4}>YEAR LAUNCHED</Th>
                  <Th color="white" fontSize="sm" fontWeight="bold" py={4}>CONTRIBUTORS</Th>
                  <Th color="white" fontSize="sm" fontWeight="bold" py={4}>EDIT/DELETE</Th>
            </Tr>
          </Thead>
          <Tbody>
            {submittedModules.map((module, index) => (
              <Tr key={index} _hover={{ bg: "blue.50", transform: 'scale(1.01)' }}
                    transition="all 0.2s ease"
                    bg={index % 2 === 0 ? "gray.50" : "white"}>
                <Td fontWeight="semibold">{index + 1}</Td>
                <Td>
                  <Text isTruncated maxW="150px" noOfLines={2}>
                    {module.name}
                  </Text>
                </Td>
                <Td>
                  <Text whiteSpace="normal" wordBreak="break-word" fontSize="sm">
                    {module.description}
                  </Text>
                </Td>
                <Td> <Text fontWeight="semibold">
                        {module.yearLaunched}
                      </Text></Td>
                <Td>
                                        <VStack align="start" spacing={3}>
                  {module.contributors.map((contributor, i) => (
                    <Box key={i}  p={4} 
                            bg="white" 
                            borderRadius="lg" 
                            border="1px" 
                            borderColor="gray.200" 
                            w="100%"
                            shadow="sm"
                            _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
                            transition="all 0.2s ease"
                          >
                      <Text fontSize="sm"><strong>{contributor.name}</strong></Text>
                            <Text fontSize="xs" color="gray.600">{contributor.designation}</Text>
                     {contributor.linkedin && (
                              <Link 
                                href={contributor.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                color="blue.500"
                                fontSize="xs"
                                isExternal
                              >
                                LinkedIn Profile
                              </Link>
                            )}
                    {contributor.image && (
                              <Box mt={2}>
                                <Img src={contributor.image} alt={contributor.name} w="40px" h="40px" borderRadius="full" />
                                {contributor.image && contributor.image instanceof Blob && (
                                  <img
                                    src={URL.createObjectURL(contributor.image)}
                                    alt={contributor.name}
                                    width="40"
                                    height="40"
                                    style={{ borderRadius: '50%', marginTop: '8px' }}
                                    onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </Td>
                    <Td>
                   <VStack spacing={2}>
                        <IconButton
                          aria-label="Edit module"
                          icon={<EditIcon />}
                          onClick={(e) => handleUpdate(module._id, e)}
                          colorScheme="green"
                          size="sm"
                          borderRadius="full"
                          _hover={{ 
                            transform: 'scale(1.1)', 
                            shadow: 'md' 
                          }}
                          transition="all 0.2s ease"
                        />
                        <IconButton
                          aria-label="Delete module"
                          icon={<DeleteIcon />}
                          onClick={() => deleteModule(module._id)}
                          colorScheme="red"
                          size="sm"
                          borderRadius="full"
                          _hover={{ 
                            transform: 'scale(1.1)', 
                            shadow: 'md' 
                          }}
                          transition="all 0.2s ease"
                        />
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </Box>
  );
};
export default TreeForm;
