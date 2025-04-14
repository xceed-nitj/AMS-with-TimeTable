import {
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Container,
  Divider,
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
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
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
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiEdit,
  FiMapPin,
  FiPhone,
  FiSave,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiUserX,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { axiosInstance } from '../../api/config';

export default function HospitalDetailView({ hospitalId }) {
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [error, setError] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeadBg = useColorModeValue('gray.50', 'gray.800');
  const statBg = useColorModeValue('blue.50', 'blue.900');

  // Fetch hospital data
  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(
        `/diabeticsModule/hospital/${hospitalId}`
      );
      setHospital(res.data.hospital);
      setFormData({
        name: res.data.hospital.name,
        location: res.data.hospital.location,
        phone: res.data.hospital.phone,
      });
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      setError('Failed to load hospital data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors assigned to this hospital
  const fetchHospitalDoctors = async () => {
    try {
      const res = await axiosInstance.get(
        `/diabeticsModule/hospital/${hospitalId}/doctors`
      );
      setDoctors(res.data || []);
    } catch (error) {
      console.error('Error fetching hospital doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hospital doctors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fetch patients assigned to this hospital
  const fetchHospitalPatients = async () => {
    try {
      const res = await axiosInstance.get(
        `/diabeticsModule/hospital/${hospitalId}/patients`
      );
      setPatients(res.data || []);
    } catch (error) {
      console.error('Error fetching hospital patients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hospital patients',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fetch available doctors not yet assigned to this hospital
  const fetchAvailableDoctors = async () => {
    try {
      const res = await axiosInstance.get(
        `/diabeticsModule/hospital/doctor/unassigned/${hospitalId}`
      );
      setAvailableDoctors(res.data || []);
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available doctors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchHospitalData();
    fetchHospitalDoctors();
    fetchHospitalPatients();
    fetchAvailableDoctors();
  }, [hospitalId]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle hospital information update
  const handleUpdate = async () => {
    try {
      await axiosInstance.patch(
        `/diabeticsModule/hospital/${hospitalId}`,
        formData
      );

      toast({
        title: 'Success',
        description: 'Hospital information updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setEditMode(false);
      fetchHospitalData();
    } catch (error) {
      console.error('Error updating hospital:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to update hospital information',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Toggle doctor selection
  const toggleDoctorSelection = (doctorId) => {
    if (selectedDoctors.includes(doctorId)) {
      setSelectedDoctors(selectedDoctors.filter((id) => id !== doctorId));
    } else {
      setSelectedDoctors([...selectedDoctors, doctorId]);
    }
  };

  // Assign selected doctors to hospital
  const assignDoctors = async () => {
    if (selectedDoctors.length === 0) {
      toast({
        title: 'No doctors selected',
        description: 'Please select at least one doctor to assign',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await axiosInstance.post(
        `/diabeticsModule/hospital/${hospitalId}/assignDoctors`,
        {
          doctorIds: selectedDoctors,
        }
      );

      toast({
        title: 'Success',
        description: 'Doctors assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setSelectedDoctors([]);
      fetchHospitalDoctors();
      fetchAvailableDoctors();
    } catch (error) {
      console.error('Error assigning doctors:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to assign doctors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Remove doctor from hospital
  const removeDoctor = async (doctorId) => {
    try {
      await axiosInstance.delete(
        `/diabeticsModule/hospital/${hospitalId}/doctor/${doctorId}`
      );

      toast({
        title: 'Success',
        description: 'Doctor removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchHospitalDoctors();
      fetchAvailableDoctors();
    } catch (error) {
      console.error('Error removing doctor:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove doctor',
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

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!hospital) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Hospital not found
        </Alert>
      </Container>
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
              <Icon
                as={BuildingOfficeIcon}
                boxSize={12}
                mr={4}
                color="blue.500"
              />
              <Box>
                <Heading size="lg">{hospital.name}</Heading>
                <Text color="gray.600">{hospital.location}</Text>
              </Box>
            </Flex>
            <Button
              leftIcon={editMode ? <FiSave /> : <FiEdit />}
              colorScheme={editMode ? 'green' : 'blue'}
              onClick={() => (editMode ? handleUpdate() : setEditMode(true))}
            >
              {editMode ? 'Save Changes' : 'Edit Details'}
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel>Doctors</StatLabel>
              <Flex align="center">
                <Icon as={FiUsers} color="blue.500" mr={2} />
                <StatNumber>{doctors.length}</StatNumber>
              </Flex>
              <StatHelpText>Total assigned doctors</StatHelpText>
            </Stat>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel>Patients</StatLabel>
              <Flex align="center">
                <Icon as={FiUser} color="blue.500" mr={2} />
                <StatNumber>{patients.length}</StatNumber>
              </Flex>
              <StatHelpText>Total registered patients</StatHelpText>
            </Stat>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel>Established</StatLabel>
              <Flex align="center">
                <Icon as={FiCalendar} color="blue.500" mr={2} />
                <StatNumber>
                  {new Date(hospital.createdAt).getFullYear()}
                </StatNumber>
              </Flex>
              <StatHelpText>Year founded</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Divider mb={6} />

          {editMode ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Hospital Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isRequired
                />
              </FormControl>
              <FormControl>
                <FormLabel>Location</FormLabel>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  isRequired
                />
              </FormControl>
              <FormControl>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  isRequired
                />
              </FormControl>
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <HStack>
                <Icon as={FiPhone} color="blue.500" />
                <Text fontWeight="bold">Phone:</Text>
                <Text>{hospital.phone}</Text>
              </HStack>
              <HStack>
                <Icon as={FiMapPin} color="blue.500" />
                <Text fontWeight="bold">Location:</Text>
                <Text>{hospital.location}</Text>
              </HStack>
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      <Tabs variant="enclosed" colorScheme="cyan">
        <TabList>
          <Tab fontWeight="semibold">Doctors</Tab>
          <Tab fontWeight="semibold">Patients</Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} pt={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Doctor List</Heading>
              <Button
                leftIcon={<FiUserPlus />}
                colorScheme="teal"
                onClick={onOpen}
                isDisabled={availableDoctors.length === 0}
              >
                Assign New Doctors
              </Button>
            </Flex>

            {doctors.length === 0 ? (
              <Box p={6} textAlign="center">
                <Text color="gray.500">
                  No doctors assigned to this hospital yet.
                </Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Contact</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {doctors.map((doctor) => (
                      <Tr key={doctor._id}>
                        <Td>
                          <Flex align="center">
                            <Avatar size="sm" name={doctor.name} mr={2} />
                            <Text fontWeight="medium">{doctor.name}</Text>
                          </Flex>
                        </Td>
                        <Td>{doctor.contactNumber || 'N/A'}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<FiUser />}
                              aria-label="View doctor"
                              colorScheme="blue"
                              variant="outline"
                              size="sm"
                              as={RouterLink}
                              to={`/dm/doctor/${doctor._id}`}
                            />
                            <IconButton
                              icon={<FiUserX />}
                              aria-label="Remove doctor"
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDoctor(doctor._id)}
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

          <TabPanel p={0} pt={4}>
            <Heading size="md" mb={4}>
              Patient List
            </Heading>

            {patients.length === 0 ? (
              <Box p={6} textAlign="center">
                <Text color="gray.500">
                  No patients registered in this hospital yet.
                </Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Contact</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {patients.map((patient) => (
                      <Tr key={patient._id}>
                        <Td>
                          <Flex align="center">
                            <Avatar size="sm" name={patient.name} mr={2} />
                            <Text fontWeight="medium">{patient.name}</Text>
                          </Flex>
                        </Td>
                        <Td>{patient.contactNumber || 'N/A'}</Td>
                        <Td>
                          <IconButton
                            icon={<FiUser />}
                            aria-label="View patient"
                            colorScheme="blue"
                            variant="outline"
                            size="sm"
                            as={RouterLink}
                            to={`/dm/patient/${patient._id}`}
                          />
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

      {/* Modal for assigning doctors */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Doctors to {hospital.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {availableDoctors.length === 0 ? (
              <Text>No more doctors available to assign.</Text>
            ) : (
              <>
                <Text mb={4}>Select doctors to assign to this hospital:</Text>
                <Table variant="simple">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th width="50px">Select</Th>
                      <Th>Name</Th>
                      <Th>Contact</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {availableDoctors.map((doctor) => (
                      <Tr key={doctor._id}>
                        <Td>
                          <Checkbox
                            isChecked={selectedDoctors.includes(doctor._id)}
                            onChange={() => toggleDoctorSelection(doctor._id)}
                          />
                        </Td>
                        <Td>
                          <Flex align="center">
                            <Avatar size="sm" name={doctor.name} mr={2} />
                            <Text>{doctor.name}</Text>
                          </Flex>
                        </Td>
                        <Td>{doctor.contactNumber || 'N/A'}</Td>
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
              colorScheme="blue"
              leftIcon={<FiUserCheck />}
              onClick={assignDoctors}
              isDisabled={
                availableDoctors.length === 0 || selectedDoctors.length === 0
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
