import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/config';
import {
  Box,
  Container,
  FormControl,
  FormLabel,
  Input,
  Select,
  chakra,
  Text,
  Button,
  Heading,
  VStack,
  HStack,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useColorModeValue,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FiPlus, FiUsers, FiHome, FiCheck, FiUserPlus } from 'react-icons/fi';

function HospitalForm() {
  const [hospitalData, setHospitalData] = useState({
    name: '',
    location: '',
    phone: '',
    doctors: [],
    patients: [],
  });

  const [allDoctors, setAllDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch doctors and patients when the component mounts
  useEffect(() => {
    // Fetch doctors
    axiosInstance
      .get('/diabeticsModule/doctor/all')
      .then((response) => {
        setAllDoctors(response.data || []);
      })
      .catch(handleError);

    // Fetch patients
    axiosInstance
      .get('/diabeticsModule/patient/all')
      .then((response) => {
        setAllPatients(response.data || []);
      })
      .catch(handleError);
  }, []);

  // Handle API error
  const handleError = (error) => {
    console.error('Error:', error);
    toast({
      title: 'Error',
      description: error.message || 'An error occurred',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  // Handle hospital input changes
  const handleHospitalChange = (e) => {
    const { name, value } = e.target;
    setHospitalData({ ...hospitalData, [name]: value });
  };

  // Add a doctor to the hospital
  const addDoctor = () => {
    if (!selectedDoctor) return;

    // Check if doctor is already in the list
    if (hospitalData.doctors.some((doctor) => doctor.id === selectedDoctor)) {
      toast({
        title: 'Doctor already added',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Find the selected doctor's details
    const doctorDetails = allDoctors.find(
      (doctor) => doctor._id === selectedDoctor
    );

    if (doctorDetails) {
      const newDoctor = {
        id: doctorDetails._id,
        name: doctorDetails.name,
      };

      setHospitalData({
        ...hospitalData,
        doctors: [...hospitalData.doctors, newDoctor],
      });

      setSelectedDoctor(''); // Reset selection
    }
  };

  // Remove a doctor from the hospital
  const removeDoctor = (doctorId) => {
    setHospitalData({
      ...hospitalData,
      doctors: hospitalData.doctors.filter((doctor) => doctor.id !== doctorId),
    });
  };

  // Add a patient to the hospital
  const addPatient = () => {
    if (!selectedPatient) return;

    // Check if patient is already in the list
    if (
      hospitalData.patients.some((patient) => patient.id === selectedPatient)
    ) {
      toast({
        title: 'Patient already added',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Find the selected patient's details
    const patientDetails = allPatients.find(
      (patient) => patient._id === selectedPatient
    );

    if (patientDetails) {
      const newPatient = {
        id: patientDetails._id,
        name: patientDetails.name,
      };

      setHospitalData({
        ...hospitalData,
        patients: [...hospitalData.patients, newPatient],
      });

      setSelectedPatient(''); // Reset selection
    }
  };

  // Remove a patient from the hospital
  const removePatient = (patientId) => {
    setHospitalData({
      ...hospitalData,
      patients: hospitalData.patients.filter(
        (patient) => patient.id !== patientId
      ),
    });
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO : create a function in the api file for add hospital
      const response = await axiosInstance.post(
        '/diabeticsModule/hospital/add',
        hospitalData
      );

      toast({
        title: 'Success!',
        description: 'Hospital added successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setHospitalData({
        name: '',
        location: '',
        phone: '',
        doctors: [],
        patients: [],
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <Card
        bg={bg}
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
      >
        <CardHeader pb={0}>
          <Flex align="center">
            <Icon as={FiHome} mr={2} color="blue.500" />
            <Heading size="lg">Register New Hospital</Heading>
          </Flex>
        </CardHeader>

        <CardBody>
          <chakra.form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Hospital Name</FormLabel>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Enter hospital name"
                    value={hospitalData.name}
                    onChange={handleHospitalChange}
                    size="md"
                    borderRadius="md"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Phone Number</FormLabel>
                  <Input
                    type="text"
                    name="phone"
                    placeholder="Enter contact number"
                    value={hospitalData.phone}
                    onChange={handleHospitalChange}
                    size="md"
                    borderRadius="md"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel fontWeight="medium">Location</FormLabel>
                <Input
                  type="text"
                  name="location"
                  placeholder="Enter hospital address"
                  value={hospitalData.location}
                  onChange={handleHospitalChange}
                  size="md"
                  borderRadius="md"
                />
              </FormControl>

              <Divider my={3} />

              {/* Doctors Section */}
              <Box>
                <Flex align="center" mb={2}>
                  <Icon as={FiUserPlus} mr={2} color="blue.500" />
                  <Heading size="md">Assign Doctors</Heading>
                </Flex>

                <HStack spacing={4} mb={4}>
                  <FormControl>
                    <Select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      placeholder="Select Doctor"
                      size="md"
                      borderRadius="md"
                    >
                      {allDoctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name}{' '}
                          {doctor.specialization
                            ? `- ${doctor.specialization}`
                            : ''}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    onClick={addDoctor}
                    colorScheme="blue"
                    leftIcon={<FiPlus />}
                    flexShrink={0}
                  >
                    Add
                  </Button>
                </HStack>

                {hospitalData.doctors.length > 0 ? (
                  <Flex wrap="wrap" gap={2} mb={4}>
                    {hospitalData.doctors.map((doctor) => (
                      <Tag
                        key={doctor.id}
                        size="md"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="cyan"
                      >
                        <TagLabel>{doctor.name}</TagLabel>
                        <TagCloseButton
                          onClick={() => removeDoctor(doctor.id)}
                        />
                      </Tag>
                    ))}
                  </Flex>
                ) : (
                  <Text color="gray.500" fontSize="sm" mb={4}>
                    No doctors added yet
                  </Text>
                )}
              </Box>

              <Divider my={3} />

              {/* Patients Section */}
              <Box>
                <Flex align="center" mb={2}>
                  <Icon as={FiUsers} mr={2} color="green.500" />
                  <Heading size="md">Register Patients</Heading>
                </Flex>

                <HStack spacing={4} mb={4}>
                  <FormControl>
                    <Select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      placeholder="Select Patient"
                      size="md"
                      borderRadius="md"
                    >
                      {allPatients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.name} - {patient.age} years
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    onClick={addPatient}
                    colorScheme="green"
                    leftIcon={<FiPlus />}
                    flexShrink={0}
                  >
                    Add
                  </Button>
                </HStack>

                {hospitalData.patients.length > 0 ? (
                  <Flex wrap="wrap" gap={2}>
                    {hospitalData.patients.map((patient) => (
                      <Tag
                        key={patient.id}
                        size="md"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="blue"
                        m={1}
                      >
                        <TagLabel>{patient.name}</TagLabel>
                        <TagCloseButton
                          onClick={() => removePatient(patient.id)}
                        />
                      </Tag>
                    ))}
                  </Flex>
                ) : (
                  <Text color="gray.500" fontSize="sm">
                    No patients added yet
                  </Text>
                )}
              </Box>
            </VStack>

            <Flex justify="flex-end" mt={8}>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                isLoading={isSubmitting}
                loadingText="Creating..."
                leftIcon={<FiCheck />}
              >
                Create Hospital
              </Button>
            </Flex>
          </chakra.form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default HospitalForm;
