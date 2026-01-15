import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from '../getenvironment';
import {
  Box,
  Container,
  FormControl,
  FormLabel,
  Input,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Heading,
  VStack,
  HStack,
  Badge,
  IconButton,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Button,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  AddIcon,
  DeleteIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import Header from '../components/header';

function Faculty() {
  const [facultyList, setFacultyList] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    facultyID: '',
    name: '',
    designation: '',
    dept: '',
    email: '',
    extension: '',
    type: '',
    order: '',
  });

  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const toast = useToast();

  // Extract current code
  const parts = window.location.pathname.split("/");
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchTTData(currentCode);
  }, []);

  const fetchTTData = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setDepartment(data[0].dept);
      } else {
        setDepartment(data.dept);
      }
      console.log("tt", data);
    } catch (error) {
      console.error("Error fetching TTdata:", error);
      toast({
        title: 'Error',
        description: 'Failed to fetch timetable data',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  // Fetch faculty when department is set
  useEffect(() => {
    if (!department) return;

    const fetchFaculty = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { 
          credentials: 'include' 
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        setFacultyList(data.reverse());
        setIsLoading(false);
      } catch (err) {
        console.error('Faculty fetch error:', err);
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load faculty data',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    };
    fetchFaculty();
  }, [apiUrl, department]);

  const startEdit = id => {
    setEditRowId(id);
    const row = facultyList.find(r => r._id === id);
    if (row) setFormData({ ...row });
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setFormData({ 
      facultyID: '', 
      name: '', 
      designation: '', 
      dept: department, 
      email: '', 
      extension: '', 
      type: '', 
      order: '' 
    });
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/faculty/${editRowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setFacultyList(facultyList.map(r => r._id === editRowId ? formData : r));
      setEditRowId(null);
      setFormData({ 
        facultyID: '', 
        name: '', 
        designation: '', 
        dept: department, 
        email: '', 
        extension: '', 
        type: '', 
        order: '' 
      });
      toast({
        title: 'Faculty Updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (err) {
      console.error('Update error:', err);
      toast({
        title: 'Update Failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const deleteRow = async id => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/faculty/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setFacultyList(facultyList.filter(r => r._id !== id));
      toast({
        title: 'Faculty Deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: 'Delete Failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const startAdd = () => {
    setFormData({ 
      facultyID: '', 
      name: '', 
      designation: '', 
      dept: department, 
      email: '', 
      extension: '', 
      type: '', 
      order: '' 
    });
    onOpen();
  };

  const cancelAdd = () => {
    onClose();
    setFormData({ 
      facultyID: '', 
      name: '', 
      designation: '', 
      dept: department, 
      email: '', 
      extension: '', 
      type: '', 
      order: '' 
    });
  };

  const saveNew = async () => {
    if (facultyList.some(r => r.name === formData.name)) {
      toast({
        title: 'Duplicate Entry',
        description: 'A faculty member with this name already exists.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    if (!formData.facultyID || !formData.name || !formData.designation || !formData.email) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      onClose();
      setDepartment(department); // trigger refetch
      setFormData({ 
        facultyID: '', 
        name: '', 
        designation: '', 
        dept: department, 
        email: '', 
        extension: '', 
        type: '', 
        order: '' 
      });
      toast({
        title: 'Faculty Added',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (err) {
      console.error('Add error:', err);
      toast({
        title: 'Add Failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header Section */}
      <Box
        bgGradient="linear(to-r, cyan.400, teal.500, green.500)"
        pt={0}
        pb={24}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.1"
          bgImage="radial-gradient(circle, white 1px, transparent 1px)"
          bgSize="30px 30px"
        />

        <Box
          position="relative"
          zIndex={2}
          sx={{
            '& button[aria-label="Go back"]': { display: 'none' },
            '& .chakra-button:first-of-type': { display: 'none' },
          }}
        >
          <Header />
        </Box>

        <Container maxW="7xl" position="relative" mt={8}>
          <Flex justify="space-between" align="center" w="full" gap={4}>
            <VStack spacing={4} align="start" flex="1">
              <Badge
                colorScheme="whiteAlpha"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                Faculty Management
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Department Faculty
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Manage faculty members for {department || 'your department'}.
              </Text>
            </VStack>

            <HStack spacing={3}>
              {/* Add Faculty Button */}
              <Button
                leftIcon={<AddIcon />}
                colorScheme="whiteAlpha"
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                size="lg"
                onClick={startAdd}
                _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
                _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
                borderRadius="full"
                boxShadow="lg"
                border="2px solid"
                borderColor="whiteAlpha.400"
              >
                Add Faculty
              </Button>

              {/* Back Button */}
              <IconButton
                icon={<ArrowBackIcon />}
                aria-label="Go back"
                onClick={() => window.history.back()}
                size="lg"
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                fontSize="2xl"
                _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
                _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
                borderRadius="full"
                boxShadow="lg"
                border="2px solid"
                borderColor="whiteAlpha.400"
                flexShrink={0}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16}>
        <VStack spacing={6} align="stretch">
          {/* Add Faculty Modal */}
          <Modal isOpen={isOpen} onClose={cancelAdd} size="xl">
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" zIndex={1400} />
            <ModalContent maxH="85vh" overflowY="auto" zIndex={1400} mt="80px">
              <ModalHeader bg="purple.600" color="white" borderTopRadius="md">
                Add New Faculty Member
              </ModalHeader>
              <ModalCloseButton color="white" />
              <ModalBody p={6}>
                <FormControl isRequired>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Faculty ID
                      </FormLabel>
                      <Input
                        type="text"
                        value={formData.facultyID}
                        onChange={e => setFormData({ ...formData, facultyID: e.target.value })}
                        placeholder="Enter Faculty ID"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Name
                      </FormLabel>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter Full Name"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Designation
                      </FormLabel>
                      <Input
                        type="text"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="Enter Designation"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Department
                      </FormLabel>
                      <Input
                        type="text"
                        value={department || formData.dept}
                        isDisabled
                        bg="gray.100"
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Type
                      </FormLabel>
                      <Input
                        type="text"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        placeholder="e.g., Regular, Contract"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Email
                      </FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter Email Address"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Extension
                      </FormLabel>
                      <Input
                        type="text"
                        value={formData.extension}
                        onChange={e => setFormData({ ...formData, extension: e.target.value })}
                        placeholder="Phone Extension"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      />
                    </Box>

                    <Box>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Order
                      </FormLabel>
                      <Input
                        type="number"
                        value={formData.order}
                        onChange={e => setFormData({ ...formData, order: e.target.value })}
                        placeholder="Display Order"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      />
                    </Box>
                  </SimpleGrid>
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={cancelAdd}>
                  Cancel
                </Button>
                <Button
                  colorScheme="teal"
                  leftIcon={<CheckIcon />}
                  onClick={saveNew}
                >
                  Save Faculty
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Faculty List Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="teal.600" color="white" p={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Faculty Members</Heading>
                <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                  {facultyList.length} Total
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody p={0}>
              {isLoading ? (
                <Box p={12}>
                  <VStack spacing={4}>
                    <Spinner size="xl" thickness="4px" color="teal.500" speed="0.65s" />
                    <Text color="gray.600" fontSize="lg">Loading faculty...</Text>
                  </VStack>
                </Box>
              ) : facultyList.length === 0 ? (
                <Box p={6}>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                      No faculty members found. Add your first faculty member using the button above.
                    </AlertDescription>
                  </Alert>
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg="teal.50">
                      <Tr>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Faculty ID
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Name
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Designation
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Department
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Type
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Email
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Extension
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200">
                          Order
                        </Th>
                        <Th color="teal.700" fontSize="xs" borderBottom="2px" borderColor="teal.200" textAlign="center">
                          Actions
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {facultyList.map(row => (
                        <Tr key={row._id} _hover={{ bg: 'teal.50' }}>
                          {['facultyID', 'name', 'designation', 'dept', 'type', 'email', 'extension', 'order'].map(field => (
                            <Td key={field} fontSize="sm">
                              {editRowId === row._id ? (
                                <Input
                                  size="sm"
                                  value={formData[field]}
                                  onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                                  isDisabled={field === 'dept'}
                                  bg={field === 'dept' ? 'gray.100' : 'white'}
                                />
                              ) : (
                                <Text fontWeight={field === 'name' ? 'bold' : 'normal'}>
                                  {row[field] || '-'}
                                </Text>
                              )}
                            </Td>
                          ))}
                          <Td>
                            <HStack spacing={1} justify="center">
                              {editRowId === row._id ? (
                                <>
                                  <IconButton
                                    icon={<CheckIcon />}
                                    size="xs"
                                    colorScheme="green"
                                    onClick={saveEdit}
                                    aria-label="Save"
                                  />
                                  <IconButton
                                    icon={<CloseIcon />}
                                    size="xs"
                                    colorScheme="gray"
                                    onClick={cancelEdit}
                                    aria-label="Cancel"
                                  />
                                </>
                              ) : (
                                <>
                                  <IconButton
                                    icon={<EditIcon />}
                                    size="xs"
                                    colorScheme="blue"
                                    onClick={() => startEdit(row._id)}
                                    aria-label="Edit"
                                  />
                                  <IconButton
                                    icon={<DeleteIcon />}
                                    size="xs"
                                    colorScheme="red"
                                    onClick={() => deleteRow(row._id)}
                                    aria-label="Delete"
                                  />
                                </>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

export default Faculty;