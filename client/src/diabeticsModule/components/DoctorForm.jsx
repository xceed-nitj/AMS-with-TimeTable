import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/config';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  VStack,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Text,
  Select,
  Flex,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUserPlus, FiCheck } from 'react-icons/fi';

function DoctorForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '12345', // default password
    name: '',
    age: '',
    contactNumber: '',
    address: '',
    hospital: '',
    specialization: '',
  });

  const [hospitals, setHospitals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch hospitals for the dropdown
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await axiosInstance.get(
          '/diabeticsModule/hospital/all'
        );
        setHospitals(response.data || []);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        toast({
          title: 'Error',
          description: 'Unable to load hospitals data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchHospitals();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post(
        '/diabeticsModule/doctor/add',
        formData
      );

      toast({
        title: 'Success!',
        description: 'Doctor added successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        email: '',
        password: '12345', // maintain default password
        name: '',
        age: '',
        contactNumber: '',
        address: '',
        hospital: '',
        specialization: '',
      });
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add doctor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
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
            <Icon as={FiUserPlus} mr={2} color="blue.500" />
            <Heading size="lg">Doctor Registration</Heading>
          </Flex>
        </CardHeader>

        <CardBody>
          <Text mb={6} color="gray.600">
            Register a new doctor to provide care for diabetic patients.
          </Text>

          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Full Name</FormLabel>
                  <Input
                    name="name"
                    placeholder="Enter doctor's full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Age</FormLabel>
                  <Input
                    type="number"
                    name="age"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Contact Number</FormLabel>
                  <Input
                    name="contactNumber"
                    placeholder="Enter contact number"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel fontWeight="medium">Address</FormLabel>
                <Input
                  name="address"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Hospital</FormLabel>
                  <Select
                    name="hospital"
                    placeholder="Select hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                  >
                    {hospitals.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="medium">Specialization</FormLabel>
                  <Input
                    name="specialization"
                    placeholder="Enter specialization (optional)"
                    value={formData.specialization}
                    onChange={handleChange}
                  />
                </FormControl>
              </SimpleGrid>

              <Box pt={2}>
                <Text fontSize="sm" color="gray.500">
                  Note: Default password will be &quot;12345&quot;. The doctor
                  will be prompted to change it on first login.
                </Text>
              </Box>

              <Flex justify="flex-end" mt={4}>
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Registering..."
                  leftIcon={<FiCheck />}
                >
                  Register Doctor
                </Button>
              </Flex>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default DoctorForm;
