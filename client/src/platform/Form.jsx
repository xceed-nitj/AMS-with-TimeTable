
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  useToast,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  Textarea,
  SimpleGrid,
  HStack,
  useToken,
  VStack,
} from '@chakra-ui/react';
import getEnvironment from '../getenvironment';

const FormComponent = () => {
  const [roles, setRoles] = useState([
    'PRM',
    'Admin',
    'Editor',
    'SuperAdmin',
    'doctor',
    'patient',
    'dm-admin',
  ]); // Default values
  const [exemptedLinks, setExemptedLinks] = useState([
    'login',
    'register',
    'verify',
  ]); // Default values
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedExemptedLinks, setSelectedExemptedLinks] = useState([]);
  const [data, setData] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [newExemptedLink, setNewExemptedLink] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const toast = useToast();
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/platform/getplatform`);
      setData(response.data);
      console.log(response.data);
      if (response.data.length > 0) {
        setRoles((prevRoles) => [
          ...new Set([...prevRoles, ...(response.data[0].roles || [])]),
        ]);
        setExemptedLinks((prevLinks) => [
          ...new Set([...prevLinks, ...(response.data[0].exemptedLinks || [])]),
        ]);
      }
      // Also fetch dedicated exempted links endpoint to ensure sync
      try {
        const resLinks = await axios.get(`${apiUrl}/platform/get-exempted-links`);
        setExemptedLinks((prev) => [
          ...new Set([...(prev || []), ...(resLinks.data || [])]),
        ]);
      } catch (err) {
        // ignore; we already have some data from getplatform
        console.debug('Failed to fetch dedicated exempted links', err?.message || err);
      }
    } catch (error) {
      toast({
        title: 'Failed to fetch data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleAddRole = () => {
    if (!newRole) {
      toast({
        title: 'Role cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setRoles((prevRoles) => [...new Set([...prevRoles, newRole])]);
    setNewRole('');
  };

  const handleAddExemptedLink = async () => {
    if (!newExemptedLink) {
      toast({
        title: 'Exempted Link cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/platform/add-exempted-link`, {
        link: newExemptedLink,
      });
      // response.data is expected to be the updated exemptedLinks array
      setExemptedLinks((prevLinks) => [
        ...new Set([...(prevLinks || []), ...(response.data || [])]),
      ]);
      setNewExemptedLink('');
      toast({
        title: 'Link added',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to add exempted link',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleCreatePlatform = async () => {
    if (
      !selectedRoles.length ||
      !selectedExemptedLinks.length
    ) {
      toast({
        title: 'All fields are required',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/platform/add`, {
        roles: selectedRoles,
        exemptedLinks: selectedExemptedLinks,
      });
      setData((prevData) => [...prevData, response.data]);
      setSelectedRoles([]);
      setSelectedExemptedLinks([]);
      toast({
        title: 'Platform created successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to create platform',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`${apiUrl}/platform/get/${id}`);
      const item = response.data;
      setSelectedRoles(item[0].roles || []);
      setSelectedExemptedLinks(item[0].exemptedLinks || []);
      setIsEditing(true);
      setCurrentId(id);
    } catch (error) {
      toast({
        title: 'Failed to fetch data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleUpdate = async () => {
    if (!currentId) return;

    try {
      const response = await axios.patch(
        `${apiUrl}/platform/update/${currentId}`,
        {
          roles: selectedRoles,
          exemptedLinks: selectedExemptedLinks,
        }
      );
      setData((prevData) =>
        prevData.map((item) => (item._id === currentId ? response.data : item))
      );
      setSelectedRoles([]);
      setSelectedExemptedLinks([]);
      setIsEditing(false);
      setCurrentId(null);
      toast({
        title: 'Data updated successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to update data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${apiUrl}/platform/delete/${id}`);
      setData((prevData) => prevData.filter((item) => item._id !== id));
      toast({
        title: 'Data deleted successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to delete data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };
  const ScrollableBox = ({ children, maxHeight = '280px' }) => (
    <Box
      position="relative"
      maxHeight={maxHeight}
      overflow="hidden"
      borderRadius="lg"
    >
      {/* Top fade overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="15px"
        background="linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 70%, rgba(255, 255, 255, 0) 100%)"
        zIndex={2}
        pointerEvents="none"
        borderTopRadius="lg"
      />

      {/* Bottom fade overlay */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height="15px"
        background="linear-gradient(0deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 70%, rgba(255, 255, 255, 0) 100%)"
        zIndex={2}
        pointerEvents="none"
        borderBottomRadius="lg"
      />

      <Box
        maxHeight={maxHeight}
        overflow="auto"
        sx={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '3px',
            margin: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background:
              'linear-gradient(180deg, #e2e8f0 0%, #cbd5e0 50%, #94a3b8 100%)',
            borderRadius: '3px',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background:
              'linear-gradient(180deg, #cbd5e0 0%, #94a3b8 50%, #64748b 100%)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
  const FormCard = ({ title, color, gradient, children }) => (
  
    <Box
      p={6}
      border="1px"
      borderColor={`${color}.100`}
      borderRadius="2xl"
      bg={`linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`}
      shadow="xl"
      maxWidth="600px"
      width="100%"
      position="relative"
      overflow="hidden"
    
    >
      <VStack align="stretch" spacing={6}>
        <HStack spacing={3} mb={2}>
          <Heading size="md" color="gray.700" fontWeight="600">
            {title}
          </Heading>
        </HStack>
        {children}
      </VStack>
    </Box>
  );

  return (
    <Box 
      bg="rgba(255, 255, 255, 0.95)"
      borderRadius="2xl"
      shadow="2xl"
      p={8}
      border="1px"
      borderColor="gray.300"
    >
      <VStack spacing={8} align="stretch">
        <Box>
          <HStack justify="space-between" mb={2}>
            <VStack align="start" spacing={1}>
              <Heading
                size="lg"
                bgGradient="linear(to-r, blue.600, purple.600)"
                bgClip="text"
              >
                Platform Configuration
              </Heading>
              <Text color="gray.600" fontSize="sm">Configure roles and exempted links</Text>
            </VStack>
          </HStack>
        </Box>

        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          spacing={6}
        >
          <FormCard
            title="Roles"
            color="blue"
            gradient={{ from: '#eff6ff', to: '#f0f9ff' }}
          >
            <Box
              bg="white"
              p={5}
              borderRadius="xl"
              shadow="md"
              border="1px"
              borderColor="blue.50"
            >
              <ScrollableBox>
                <VStack align="stretch" spacing={3} p={2}>
                  <Text/>
                  {roles.map((role) => (
                    <Box
                      key={role}
                      p={3}
                      borderRadius="lg"
                      bg={selectedRoles.includes(role) ? 'blue.50' : 'gray.50'}
                      border="1px"
                      borderColor={
                        selectedRoles.includes(role) ? 'blue.200' : 'gray.100'
                      }
                      transition="all 0.2s"
                      _hover={{ shadow: 'sm', transform: 'translateY(-1px)' }}
                    >
                      <Checkbox
                        isChecked={selectedRoles.includes(role)}
                        onChange={(e) => {
                          const updatedRoles = e.target.checked
                            ? [...selectedRoles, role]
                            : selectedRoles.filter((r) => r !== role);
                          setSelectedRoles(updatedRoles);
                        }}
                        colorScheme="blue"
                        size="md"
                        fontWeight="500"
                        color="gray.700"
                        alignItems="flex-start"
                      >
                        <Text>{role}</Text>
                      </Checkbox>
                    </Box>
                  ))}
                </VStack>
              </ScrollableBox>

              <Box mt={5} pt={4} borderTop="1px" borderColor="gray.100">
                <Text fontSize="sm" fontWeight="600" color="gray.600" mb={3}>
                  Add New Role
                </Text>
                <VStack spacing={3}>
                  <Textarea
                    flex="1"
                    placeholder="Enter role name..."
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    resize="none"
                    rows={2}
                    borderColor="blue.200"
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                    bg="blue.25"
                  />
                  <Button
                    onClick={handleAddRole}
                    colorScheme="blue"
                    size="sm"
                    width="full"
                    fontWeight="600"
                    _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                    transition="all 0.2s"
                  >
                    Add Role
                  </Button>
                </VStack>
              </Box>
            </Box>
          </FormCard>

          <FormCard
            title="Exempted Links"
            color="purple"
            gradient={{ from: '#faf5ff', to: '#f3e8ff' }}
          >
            <Box
              bg="white"
              p={5}
              borderRadius="xl"
              shadow="md"
              border="1px"
              borderColor="purple.50"
            >
              <ScrollableBox>
                <VStack align="stretch" spacing={3} p={2}>
                  <Text />
                  {exemptedLinks.map((link, index) => (
                    <Box
                      key={link}
                      p={3}
                      borderRadius="lg"
                      bg={
                        selectedExemptedLinks.includes(link)
                          ? 'purple.50'
                          : 'gray.50'
                      }
                      border="1px"
                      borderColor={
                        selectedExemptedLinks.includes(link)
                          ? 'purple.200'
                          : 'gray.100'
                      }
                      transition="all 0.2s"
                      _hover={{ shadow: 'sm', transform: 'translateY(-1px)' }}
                    >
                      <Checkbox
                        isChecked={selectedExemptedLinks.includes(link)}
                        onChange={(e) => {
                          const updatedLinks = e.target.checked
                            ? [...selectedExemptedLinks, link]
                            : selectedExemptedLinks.filter((l) => l !== link);
                          setSelectedExemptedLinks(updatedLinks);
                        }}
                        colorScheme="purple"
                        size="md"
                        fontWeight="500"
                        color="gray.700"
                        alignItems="flex-start"
                      >
                        <Text fontFamily="mono" fontSize="sm">
                          {link}
                        </Text>
                      </Checkbox>
                    </Box>
                  ))}
                </VStack>
              </ScrollableBox>

              <Box mt={5} pt={4} borderTop="1px" borderColor="gray.100">
                <Text fontSize="sm" fontWeight="600" color="gray.600" mb={3}>
                  Add New Link
                </Text>
                <VStack spacing={3}>
                  <Textarea
                    placeholder="Enter exempted link..."
                    value={newExemptedLink}
                    onChange={(e) => setNewExemptedLink(e.target.value)}
                    resize="none"
                    rows={2}
                    borderColor="purple.200"
                    _focus={{
                      borderColor: 'purple.400',
                      boxShadow: '0 0 0 1px #805ad5',
                    }}
                    bg="purple.25"
                    fontFamily="mono"
                    fontSize="sm"
                  />
                  <Button
                    onClick={handleAddExemptedLink}
                    colorScheme="purple"
                    size="sm"
                    width="full"
                    fontWeight="600"
                    _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                    transition="all 0.2s"
                  >
                    Add Link
                  </Button>
                </VStack>
              </Box>
            </Box>
          </FormCard>
        </SimpleGrid>

        <Box textAlign="center" pt={6}>
          <Button
            onClick={handleCreatePlatform}
            size="lg"
            px={12}
            py={6}
            bgGradient="linear(to-r, blue.500, purple.500)"
            color="white"
            fontWeight="700"
            fontSize="lg"
            borderRadius="2xl"
            shadow="xl"
            _hover={{
              transform: 'translateY(-2px)',
              shadow: '2xl',
              bgGradient: 'linear(to-r, blue.600, purple.600, pink.600)',
            }}
            _active={{
              transform: 'translateY(0)',
            }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            Create Platform
          </Button>
        </Box>

        {isEditing && (
          <Button
            mt={4}
            onClick={handleUpdate}
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            color="white"
            _hover={{
              bg: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            _active={{
              transform: 'translateY(0px)',
            }}
            transition="all 0.2s ease"
            borderRadius="md"
            fontWeight="semibold"
          >
            Update
          </Button>
        )}

        <Box mt={8}>
          <Heading
            size="lg"
            mb={6}
            bgGradient="linear(to-r, #667eea, #764ba2)"
            bgClip="text"
            fontWeight="bold"
          >
            Data
          </Heading>

          <Box
            borderRadius="lg"
            overflow="hidden"
            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            bg="white"
            border="1px solid"
            borderColor="#e5e7eb"
          >
            <Table variant="simple" size="md">
              <Thead bgGradient="linear(to-r, #e0f2fe, #ede9fe)">
                <Tr>
                  <Th
                    color="#4b5563"
                    fontWeight="semibold"
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    py={4}
                    borderBottom="2px solid"
                    borderColor="gray.300"
                  >
                    Roles
                  </Th>
                  <Th
                    color="#4b5563"
                    fontWeight="semibold"
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    py={4}
                    borderBottom="2px solid"
                    borderColor="gray.300"
                  >
                    Exempted Links
                  </Th>
                  <Th
                    color="#4b5563"
                    fontWeight="semibold"
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    py={4}
                    borderBottom="2px solid"
                    borderColor="gray.300"
                  >
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <Tr
                      key={item._id}
                      bg={index % 2 === 0 ? 'white' : '#f0f4f8'}
                      _hover={{
                        bg: '#f3f4f6',
                        transform: 'scale(1.001)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Td
                        py={4}
                        fontSize="sm"
                        color="gray.700"
                        fontWeight="medium"
                        borderBottom="1px solid"
                        borderColor="gray.200"
                      >
                        <Text isTruncated maxWidth="200px">
                          {item.roles.join(', ')}
                        </Text>
                      </Td>
                      <Td
                        py={4}
                        fontSize="sm"
                        color="gray.700"
                        borderBottom="1px solid"
                        borderColor="gray.200"
                      >
                        <Text isTruncated maxWidth="250px">
                          {item.exemptedLinks.join(', ')}
                        </Text>
                      </Td>
                      <Td
                        py={4}
                        borderBottom="1px solid"
                        borderColor="gray.200"
                      >
                        <HStack spacing={2}>
                          <Button
                            onClick={() => handleEdit(item._id)}
                            bg="#e0e7ff"
                            color="#4338ca"
                            size="sm"
                            fontWeight="semibold"
                            borderRadius="md"
                            _hover={{
                              bg: '#c7d2fe',
                              color: '#3730a3',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
                            }}
                            _active={{
                              transform: 'translateY(0px)',
                            }}
                            transition="all 0.2s ease"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(item._id)}
                            bg="#fee2e2"
                            color="#b91c1c"
                            size="sm"
                            fontWeight="semibold"
                            borderRadius="md"
                            _hover={{
                              bg: '#fecaca',
                              color: '#991b1b',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 8px rgba(185, 28, 28, 0.3)',
                            }}
                            _active={{
                              transform: 'translateY(0px)',
                            }}
                            transition="all 0.2s ease"
                          >
                            Delete
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr bg="white">
                    <Td
                      colSpan="4"
                      textAlign="center"
                      py={12}
                      color="gray.500"
                      fontSize="md"
                      fontStyle="italic"
                    >
                      <VStack spacing={3}>
                        <Box
                          w={12}
                          h={12}
                          borderRadius="full"
                          bg="gray.100"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="xl" color="gray.400">
                            📋
                          </Text>
                        </Box>
                        <Text>No data available</Text>
                        <Text fontSize="sm" color="gray.400">
                          Add some data to get started
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default FormComponent;
