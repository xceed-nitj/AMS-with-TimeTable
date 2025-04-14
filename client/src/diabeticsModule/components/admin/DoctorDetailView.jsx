import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiEdit,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUserX,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { axiosInstance } from '../../api/config';

export default function DoctorDetailView({ doctorId }) {
  const [doctor, setDoctor] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedPatients, setSelectedPatients] = useState([]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeadBg = useColorModeValue('gray.50', 'gray.800');

  // Fetch doctor data
  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/diabeticsModule/doctor/${doctorId}`
      );
      setDoctor(res.data);
      setAssignedPatients(res.data.patients);
      setFormData({
        name: res.data.name,
        email: res.data.email,
        age: res.data.age,
        contactNumber: res.data.contactNumber,
        address: res.data.address,
        hospital: res.data.hospital,
        specialization: res.data.specialization || '',
      });
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    }
  };

  // Fetch available patients
  const fetchAvailablePatients = async () => {
    try {
      const res = await axiosInstance.get(
        `/diabeticsModule/patient/unassigned/${doctorId}`
      );
      setAvailablePatients(res.data || []);
    } catch (error) {
      console.error('Error fetching available patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hospitals for dropdown
  const fetchHospitals = async () => {
    try {
      const res = await axiosInstance.get('/diabeticsModule/hospital/all');
      setHospitals(res.data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast({
        title: 'Error',
        description: 'Unable to load hospitals',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchDoctorData();
    fetchAvailablePatients();
    fetchHospitals();
  }, [doctorId]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle doctor information update
  const handleUpdate = async () => {
    try {
      setLoading(true);
      // TODO: create a function in the api file for update doctor
      const response = await axiosInstance.patch(
        `/diabeticsModule/doctor/${doctorId}`,
        formData
      );

      if (response.data && response.data.doctor) {
        toast({
          title: 'Success',
          description: `Doctor ${response.data.doctor.name}'s information has been updated successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        setEditMode(false);
        await fetchDoctorData();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to update doctor information. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle patient selection
  const togglePatientSelection = (patientId) => {
    if (selectedPatients.includes(patientId)) {
      setSelectedPatients(selectedPatients.filter((id) => id !== patientId));
    } else {
      setSelectedPatients([...selectedPatients, patientId]);
    }
  };

  // Assign selected patients to doctor
  const assignPatients = async () => {
    if (selectedPatients.length === 0) {
      toast({
        title: 'No patients selected',
        description: 'Please select at least one patient to assign',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await axiosInstance.post(
        `/diabeticsModule/doctor/${doctorId}/assignPatients`,
        {
          patientIds: selectedPatients,
        }
      );

      toast({
        title: 'Success',
        description: 'Patients assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setSelectedPatients([]);
      fetchDoctorData();
      fetchAvailablePatients();
    } catch (error) {
      console.error('Error assigning patients:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to assign patients',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Remove patient from doctor
  const removePatient = async (patientId) => {
    try {
      await axiosInstance.delete(
        `/diabeticsModule/doctor/${doctorId}/patient/${patientId}`
      );

      toast({
        title: 'Success',
        description: 'Patient removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchDoctorData();
      fetchAvailablePatients();
    } catch (error) {
      console.error('Error removing patient:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to remove patient',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Button
        as={RouterLink}
        to="/dm/admin/dashboard"
        leftIcon={<FiArrowLeft />}
        mb={6}
        variant="outline"
      >
        Back to Dashboard
      </Button>

      <Card
        bg={cardBg}
        boxShadow="md"
        mb={6}
        borderColor={borderColor}
        borderWidth="1px"
      >
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Flex align="center">
              <Avatar size="lg" name={doctor?.name} mr={4} />
              <Box>
                <Heading size="lg">{doctor?.name}</Heading>
                <Text color="gray.600">
                  {doctor?.specialization || 'General Practitioner'}
                </Text>
              </Box>
            </Flex>
            <Button
              leftIcon={editMode ? <FiSave /> : <FiEdit />}
              colorScheme={editMode ? 'green' : 'blue'}
              onClick={() => (editMode ? handleUpdate() : setEditMode(true))}
            >
              {editMode ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          {editMode ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Full Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Age</FormLabel>
                <Input
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Contact Number</FormLabel>
                <Input
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Hospital</FormLabel>
                <Select
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleChange}
                >
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital.name}>
                      {hospital.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Specialization</FormLabel>
                <Input
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                />
              </FormControl>
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <HStack>
                <Icon as={FiMail} color="blue.500" />
                <Text fontWeight="bold">Email:</Text>
                <Text>{doctor?.email}</Text>
              </HStack>
              <HStack>
                <Icon as={FiUser} color="blue.500" />
                <Text fontWeight="bold">Age:</Text>
                <Text>{doctor?.age} years</Text>
              </HStack>
              <HStack>
                <Icon as={FiPhone} color="blue.500" />
                <Text fontWeight="bold">Contact:</Text>
                <Text>{doctor?.contactNumber}</Text>
              </HStack>
              <HStack>
                <Icon as={FiMapPin} color="blue.500" />
                <Text fontWeight="bold">Hospital:</Text>
                <Text>
                  <Button
                    variant="link"
                    colorScheme="blue"
                    onClick={() => {
                      window.open(
                        `/dm/hospital/${doctor?.hospital._id}`,
                        '_blank'
                      );
                    }}
                  >
                    {doctor?.hospital?.name}
                  </Button>
                </Text>
              </HStack>
              <HStack gridColumn={{ md: 'span 2' }}>
                <Icon as={FiMapPin} color="blue.500" />
                <Text fontWeight="bold">Address:</Text>
                <Text>{doctor?.address}</Text>
              </HStack>
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      <Tabs variant="enclosed" colorScheme="cyan">
        <TabList>
          <Tab fontWeight="semibold">Assigned Patients</Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} pt={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Patient List</Heading>
              <Button
                leftIcon={<FiUserPlus />}
                colorScheme="green"
                onClick={onOpen}
              >
                Assign New Patients
              </Button>
            </Flex>

            {assignedPatients.length === 0 ? (
              <Box p={6} textAlign="center">
                <Text color="gray.500">
                  No patients assigned to this doctor yet.
                </Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Age</Th>
                      <Th>Contact</Th>
                      <Th>Hospital</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {assignedPatients.map((patient) => (
                      <Tr key={patient._id}>
                        <Td>
                          <Flex align="center">
                            <Avatar size="sm" name={patient.name} mr={2} />
                            <Text fontWeight="medium">{patient.name}</Text>
                          </Flex>
                        </Td>
                        <Td>{patient.age}</Td>
                        <Td>{patient.contactNumber}</Td>
                        <Td>
                          <Button
                            variant="link"
                            colorScheme="blue"
                            onClick={() => {
                              window.open(
                                `/dm/hospital/${doctor?.hospital._id}`,
                                '_blank'
                              );
                            }}
                          >
                            {doctor?.hospital?.name}
                          </Button>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<FiUser />}
                              aria-label="View patient"
                              colorScheme="blue"
                              variant="outline"
                              size="sm"
                              as={RouterLink}
                              to={`/dm/patient/${patient._id}`}
                            />
                            <IconButton
                              icon={<FiUserX />}
                              aria-label="Remove patient"
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => removePatient(patient._id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal for assigning patients */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Patients to {doctor?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {availablePatients.length === 0 ? (
              <Text>No more patients available to assign.</Text>
            ) : (
              <>
                <Text mb={4}>Select patients to assign to this doctor:</Text>
                <Table variant="simple">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th width="50px">Select</Th>
                      <Th>Name</Th>
                      <Th>Age</Th>
                      <Th>Hospital</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {availablePatients.map((patient) => (
                      <Tr key={patient._id}>
                        <Td>
                          <Checkbox
                            isChecked={selectedPatients.includes(patient._id)}
                            onChange={() => togglePatientSelection(patient._id)}
                          />
                        </Td>
                        <Td>
                          <Flex align="center">
                            <Avatar size="sm" name={patient.name} mr={2} />
                            <Text>{patient.name}</Text>
                          </Flex>
                        </Td>
                        <Td>{patient.age}</Td>
                        <Td>{patient.hospital}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              leftIcon={<FiUserCheck />}
              onClick={assignPatients}
              isDisabled={
                availablePatients.length === 0 || selectedPatients.length === 0
              }
            >
              Assign Selected
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
