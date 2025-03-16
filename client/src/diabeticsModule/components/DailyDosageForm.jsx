import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../getenvironment';
import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  chakra,
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
import { FiCheck, FiDroplet } from 'react-icons/fi';

function DailyDosageForm() {
  const [dosageData, setDosageData] = useState({
    patientId: '',
    data: {
      date: '',
      session: '', // "pre-breakfast", "pre-lunch", "pre-dinner", "night"
      bloodSugar: '',
      carboLevel: '',
      insulin: '',
      longLastingInsulin: '',
      physicalActivity: '',
    },
  });

  const [allPatients, setAllPatients] = useState([]); // For storing fetched patients
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
    setDosageData((prevData) => ({
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
    if (name === 'patientId') {
      setDosageData({
        ...dosageData,
        [name]: value,
      });
    } else {
      setDosageData({
        ...dosageData,
        data: {
          ...dosageData.data,
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
      .post('/diabeticsModule/dailyDosage/add', dosageData)
      .then((response) => {
        toast({
          title: 'Success!',
          description: 'Daily dosage record added successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Reset form except for patientId
        setDosageData({
          patientId: dosageData.patientId,
          data: {
            date: new Date().toISOString().split('T')[0],
            session: '',
            bloodSugar: '',
            carboLevel: '',
            insulin: '',
            longLastingInsulin: '',
            physicalActivity: '',
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
            <Icon as={FiDroplet} mr={2} color="red.500" />
            <Heading size="lg">Daily Dosage Entry</Heading>
          </Flex>
        </CardHeader>

        <CardBody>
          <Text mb={6} color="gray.600">
            Record blood sugar levels, insulin doses, and other daily metrics
            for diabetes management.
          </Text>

          <chakra.form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="medium">Select Patient</FormLabel>
                <Select
                  name="patientId"
                  placeholder="Choose a patient"
                  value={dosageData.patientId}
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
                    value={dosageData.data.date}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Session</FormLabel>
                  <Select
                    name="session"
                    placeholder="Select session"
                    value={dosageData.data.session}
                    onChange={handleInputChange}
                  >
                    <option value="pre-breakfast">Pre-Breakfast</option>
                    <option value="pre-lunch">Pre-Lunch</option>
                    <option value="pre-dinner">Pre-Dinner</option>
                    <option value="night">Night</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Blood Sugar (mg/dL)</FormLabel>
                  <Input
                    type="number"
                    name="bloodSugar"
                    placeholder="Enter blood sugar level"
                    value={dosageData.data.bloodSugar}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">
                    Carbohydrate Level (g)
                  </FormLabel>
                  <Input
                    type="number"
                    name="carboLevel"
                    placeholder="Enter carbohydrate level"
                    value={dosageData.data.carboLevel}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">
                    Insulin Dose (units)
                  </FormLabel>
                  <Input
                    type="number"
                    name="insulin"
                    placeholder="Short-acting insulin"
                    value={dosageData.data.insulin}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="medium">
                    Long-lasting Insulin (units)
                  </FormLabel>
                  <Input
                    type="number"
                    name="longLastingInsulin"
                    placeholder="If applicable"
                    value={dosageData.data.longLastingInsulin}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Physical Activity</FormLabel>
                  <Select
                    name="physicalActivity"
                    placeholder="Select activity level"
                    value={dosageData.data.physicalActivity}
                    onChange={handleInputChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <Flex justify="flex-end" mt={4}>
                <Button
                  type="submit"
                  colorScheme="red"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  leftIcon={<FiCheck />}
                >
                  Save Dosage Record
                </Button>
              </Flex>
            </VStack>
          </chakra.form>
        </CardBody>
      </Card>
    </Container>
  );
}

export default DailyDosageForm;
