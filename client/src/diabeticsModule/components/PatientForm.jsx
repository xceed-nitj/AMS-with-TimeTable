import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../getenvironment';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  VStack,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Text,
  Textarea,
  Flex,
  Icon,
  Divider,
  RadioGroup,
  Radio,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiCheck, FiUsers } from 'react-icons/fi';

function PatientForm() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    DOB: '',
    gender: '',
    father_name: '',
    mother_name: '',
    weight: '',
    height: '',
    DOD_of_T1D: '',
    family_history: '',
    economic_status: '',
    family_tree: '',
    immunization_history: '',
    treatment_history: '',
    referring_physician: '',
    age: '',
    contactNumber: '',
    address: '',
    selectedDoctors: [],
    password: '12345', // Default password
    hospital: '',
  });

  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch hospitals and doctors when component mounts
  useEffect(() => {
    fetchHospitals();
    fetchDoctors();
  }, []);

  // Fetch hospitals data
  const fetchHospitals = async () => {
    try {
      const response = await axiosInstance.get('/diabeticsModule/hospital/all');
      setHospitals(response.data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hospitals data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Fetch doctors data
  const fetchDoctors = async () => {
    try {
      const response = await axiosInstance.get('/diabeticsModule/doctor/all');
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctors data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle patient input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle doctor selection
  const handleDoctorChange = (e) => {
    const value = e.target.value;

    if (!formData.selectedDoctors.includes(value) && value) {
      setFormData({
        ...formData,
        selectedDoctors: [...formData.selectedDoctors, value],
      });
    }
  };

  // Remove a doctor from the selection
  const removeDoctor = (doctorId) => {
    setFormData({
      ...formData,
      selectedDoctors: formData.selectedDoctors.filter((id) => id !== doctorId),
    });
  };

  // Calculate age when DOB changes
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Update age when DOB changes
  const handleDOBChange = (e) => {
    const dob = e.target.value;
    const calculatedAge = calculateAge(dob);

    setFormData({
      ...formData,
      DOB: dob,
      age: calculatedAge.toString(),
    });
  };

  // Submit the patient form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post(
        '/diabeticsModule/patient/add',
        formData
      );

      toast({
        title: 'Success!',
        description: 'Patient registered successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        email: '',
        name: '',
        DOB: '',
        gender: '',
        father_name: '',
        mother_name: '',
        weight: '',
        height: '',
        DOD_of_T1D: '',
        family_history: '',
        economic_status: '',
        family_tree: '',
        immunization_history: '',
        treatment_history: '',
        referring_physician: '',
        age: '',
        contactNumber: '',
        address: '',
        selectedDoctors: [],
        password: '12345',
        hospital: '',
      });
    } catch (error) {
      console.error('Error registering patient:', error);
      toast({
        title: 'Registration failed',
        description:
          error.response?.data?.message || 'Error registering patient',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
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
            <Icon as={FiUsers} mr={2} color="teal.500" />
            <Heading size="lg">Patient Registration</Heading>
          </Flex>
        </CardHeader>

        <CardBody>
          <Text mb={6} color="gray.600">
            Register a new patient for the diabetes management program. Please
            fill out all required fields.
          </Text>

          <form onSubmit={handleSubmit}>
            <VStack spacing={8} align="stretch">
              {/* Personal Information Section */}
              <Box>
                <Heading size="md" mb={4}>
                  Personal Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      name="name"
                      placeholder="Patient's full name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Contact Number</FormLabel>
                    <Input
                      name="contactNumber"
                      placeholder="Phone number"
                      value={formData.contactNumber}
                      onChange={handleChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={4}>
                  <FormControl isRequired>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input
                      type="date"
                      name="DOB"
                      value={formData.DOB}
                      onChange={handleDOBChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Age</FormLabel>
                    <Input
                      type="number"
                      name="age"
                      placeholder="Age"
                      value={formData.age}
                      onChange={handleChange}
                      isReadOnly
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Gender</FormLabel>
                    <RadioGroup
                      name="gender"
                      value={formData.gender}
                      onChange={(value) =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <Stack direction="row">
                        <Radio value="Male">Male</Radio>
                        <Radio value="Female">Female</Radio>
                        <Radio value="Other">Other</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                </SimpleGrid>

                <FormControl mt={4} isRequired>
                  <FormLabel>Address</FormLabel>
                  <Textarea
                    name="address"
                    placeholder="Full address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </FormControl>
              </Box>

              <Divider />

              {/* Family Information */}
              <Box>
                <Heading size="md" mb={4}>
                  Family Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel>Father&apos;s Name</FormLabel>
                    <Input
                      name="father_name"
                      placeholder="Father's name"
                      value={formData.father_name}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Mother&apos;s Name</FormLabel>
                    <Input
                      name="mother_name"
                      placeholder="Mother's name"
                      value={formData.mother_name}
                      onChange={handleChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl mt={4}>
                  <FormLabel>Family History</FormLabel>
                  <Textarea
                    name="family_history"
                    placeholder="Any family history of diabetes or related conditions"
                    value={formData.family_history}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>Economic Status</FormLabel>
                  <Select
                    name="economic_status"
                    placeholder="Select economic status"
                    value={formData.economic_status}
                    onChange={handleChange}
                  >
                    <option value="Below Poverty Line">
                      Below Poverty Line
                    </option>
                    <option value="Low Income">Low Income</option>
                    <option value="Middle Class">Middle Class</option>
                    <option value="Upper Middle Class">
                      Upper Middle Class
                    </option>
                    <option value="High Income">High Income</option>
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              {/* Medical Information */}
              <Box>
                <Heading size="md" mb={4}>
                  Medical Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Hospital</FormLabel>
                    <Select
                      name="hospital"
                      placeholder="Select hospital"
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
                    <FormLabel>Referring Physician</FormLabel>
                    <Input
                      name="referring_physician"
                      placeholder="Name of referring doctor (if any)"
                      value={formData.referring_physician}
                      onChange={handleChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={4}>
                  <FormControl isRequired>
                    <FormLabel>Diagnosis Date</FormLabel>
                    <Input
                      type="date"
                      name="DOD_of_T1D"
                      value={formData.DOD_of_T1D}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Weight (kg)</FormLabel>
                    <Input
                      type="number"
                      name="weight"
                      placeholder="Weight in kg"
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Height (cm)</FormLabel>
                    <Input
                      type="number"
                      name="height"
                      placeholder="Height in cm"
                      value={formData.height}
                      onChange={handleChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl mt={4}>
                  <FormLabel>Medical History</FormLabel>
                  <Textarea
                    name="medicalHistory"
                    placeholder="Detailed medical history including complications, allergies, etc."
                    value={formData.medicalHistory}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>Treatment History</FormLabel>
                  <Textarea
                    name="treatment_history"
                    placeholder="Previous treatments, medications, etc."
                    value={formData.treatment_history}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>Immunization History</FormLabel>
                  <Textarea
                    name="immunization_history"
                    placeholder="Immunization details"
                    value={formData.immunization_history}
                    onChange={handleChange}
                  />
                </FormControl>
              </Box>

              <Divider />

              {/* Doctor Assignment */}
              <Box>
                <Heading size="md" mb={4}>
                  Assign Doctors
                </Heading>
                <FormControl>
                  <FormLabel>Select Doctors</FormLabel>
                  <Select
                    placeholder="Select a doctor"
                    onChange={handleDoctorChange}
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name}{' '}
                        {doctor.specialization
                          ? `- ${doctor.specialization}`
                          : ''}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {formData.selectedDoctors.length > 0 && (
                  <Box mt={4}>
                    <Text fontWeight="medium" mb={2}>
                      Assigned Doctors:
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                      {formData.selectedDoctors.map((doctorId) => {
                        const doctor = doctors.find((d) => d._id === doctorId);
                        return doctor ? (
                          <Button
                            key={doctorId}
                            size="sm"
                            colorScheme="cyan"
                            variant="outline"
                            onClick={() => removeDoctor(doctorId)}
                          >
                            {doctor.name} ✕
                          </Button>
                        ) : null;
                      })}
                    </Flex>
                  </Box>
                )}
              </Box>
            </VStack>

            <Flex justify="flex-end" mt={8}>
              <Button
                type="submit"
                colorScheme="teal"
                size="lg"
                isLoading={isSubmitting}
                loadingText="Registering..."
                leftIcon={<FiCheck />}
              >
                Register Patient
              </Button>
            </Flex>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default PatientForm;
