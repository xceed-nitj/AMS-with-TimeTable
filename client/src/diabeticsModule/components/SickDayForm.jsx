import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/config';
import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  chakra,
  Textarea,
  VStack,
  SimpleGrid,
  Flex,
  Text,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiCheck } from 'react-icons/fi';

function SickDayForm() {
  const [sickDayData, setSickDayData] = useState({
    patientId: '',
    reason: '',
    ketones: '',
    data: {
      date: '',
      bloodSugar: '',
      insulin: '',
    },
  });

  const [allPatients, setAllPatients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch patients data
  useEffect(() => {
    axiosInstance
      .get('/diabeticsModule/patient/all')
      .then((response) => {
        setAllPatients(response.data);
      })
      .catch(handleError);
  }, []);

  // Set today's date as default when the component mounts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSickDayData((prevData) => ({
      ...prevData,
      data: {
        ...prevData.data,
        date: today,
      },
    }));
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'patientId' || name === 'reason' || name === 'ketones') {
      setSickDayData({
        ...sickDayData,
        [name]: value,
      });
    } else {
      setSickDayData({
        ...sickDayData,
        data: {
          ...sickDayData.data,
          [name]: value,
        },
      });
    }
  };

  // Submit the form
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    axiosInstance
      .post('/diabeticsModule/sickday/add', sickDayData)
      .then((response) => {
        toast({
          title: 'Success!',
          description: 'Sick day record added successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Reset form except for patientId
        setSickDayData({
          patientId: sickDayData.patientId,
          reason: '',
          ketones: '',
          data: {
            date: new Date().toISOString().split('T')[0],
            bloodSugar: '',
            insulin: '',
          },
        });
      })
      .catch(handleError)
      .finally(() => {
        setIsSubmitting(false);
      });
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
            <Icon as={FiAlertTriangle} mr={2} color="orange.500" />
            <Heading size="lg">Sick Day Record</Heading>
          </Flex>
        </CardHeader>

        <CardBody>
          <Text mb={6} color="gray.600">
            Record special blood sugar readings and insulin doses during illness
            or stress periods.
          </Text>

          <chakra.form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="medium">Select Patient</FormLabel>
                <Select
                  name="patientId"
                  placeholder="Choose a patient"
                  value={sickDayData.patientId}
                  onChange={handleInputChange}
                >
                  {allPatients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.age} years
                    </option>
                  ))}
                </Select>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Date</FormLabel>
                  <Input
                    type="date"
                    name="date"
                    value={sickDayData.data.date}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Ketones Present</FormLabel>
                  <Select
                    name="ketones"
                    placeholder="Select ketone status"
                    value={sickDayData.ketones}
                    onChange={handleInputChange}
                  >
                    <option value="none">None</option>
                    <option value="trace">Trace</option>
                    <option value="small">Small</option>
                    <option value="moderate">Moderate</option>
                    <option value="large">Large</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel fontWeight="medium">Reason for Sick Day</FormLabel>
                <Textarea
                  name="reason"
                  placeholder="Describe the illness or stress causing elevated blood sugar"
                  value={sickDayData.reason}
                  onChange={handleInputChange}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Blood Sugar (mg/dL)</FormLabel>
                  <Input
                    type="number"
                    name="bloodSugar"
                    placeholder="Enter blood sugar level"
                    value={sickDayData.data.bloodSugar}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">
                    Insulin Dose (units)
                  </FormLabel>
                  <Input
                    type="number"
                    name="insulin"
                    placeholder="Enter insulin units"
                    value={sickDayData.data.insulin}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </SimpleGrid>

              <Flex justify="flex-end" mt={4}>
                <Button
                  type="submit"
                  colorScheme="orange"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  leftIcon={<FiCheck />}
                >
                  Save Sick Day Record
                </Button>
              </Flex>
            </VStack>
          </chakra.form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default SickDayForm;
