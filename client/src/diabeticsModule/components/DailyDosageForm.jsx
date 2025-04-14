import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../api/config';
import {
  Button,
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
  Divider,
  Box,
  Badge,
} from '@chakra-ui/react';
import {
  FiCheck,
  FiDroplet,
  FiClock,
  FiActivity,
  FiThermometer,
} from 'react-icons/fi';

function DailyDosageForm({ patientId, onSuccess }) {
  const [dosageData, setDosageData] = useState({
    data: {
      date: '',
      time: '',
      session: '',
      bloodSugar: '',
      carboLevel: '',
      insulin: '',
      longLastingInsulin: '',
      physicalActivity: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  // Set today's date and current time as default when the component mounts
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA'); // Format as YYYY-MM-DD
    const currentTime = new Date().toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setDosageData((prevData) => ({
      ...prevData,
      data: {
        ...prevData.data,
        date: today,
        time: currentTime,
      },
    }));
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDosageData({
      ...dosageData,
      data: {
        ...dosageData.data,
        [name]: value,
      },
    });
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        patientId,
        ...dosageData,
      };

      await axiosInstance.post('/diabeticsModule/dailyDosage/add', data);

      toast({
        title: 'Success!',
        description: 'Daily dosage record added successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setDosageData({
        data: {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-CA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          session: 'pre-breakfast',
          bloodSugar: '',
          carboLevel: '',
          insulin: '',
          longLastingInsulin: '',
          physicalActivity: 'Low',
        },
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card shadow={'none'} p={0}>
      <CardHeader p={0}>
        <Flex align="center" mb={2}>
          <Icon as={FiDroplet} mr={2} color="red.500" boxSize={6} />
          <Heading as="h2" size="md">
            Daily Dosage Entry
          </Heading>
        </Flex>
        <Text color="gray.600" fontSize="sm">
          Record blood sugar levels, insulin doses, and other daily metrics for
          diabetes management.
        </Text>
      </CardHeader>

      <CardBody p={0} pt={6}>
        <chakra.form onSubmit={handleSubmit}>
          <VStack spacing={8} align="stretch">
            {/* Date and Time Section */}
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FiClock} mr={2} color="gray.500" />
                <Text fontWeight="medium">Date & Time Information</Text>
              </Flex>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Date</FormLabel>
                  <Input
                    type="date"
                    name="date"
                    value={dosageData.data.date}
                    onChange={handleInputChange}
                    size="md"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Time of Dosage</FormLabel>
                  <Input
                    type="time"
                    name="time"
                    value={dosageData.data.time}
                    onChange={handleInputChange}
                    size="md"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Session</FormLabel>
                  <Select
                    name="session"
                    placeholder="Select session"
                    value={dosageData.data.session}
                    onChange={handleInputChange}
                    size="md"
                  >
                    <option value="pre-breakfast">Pre-Breakfast</option>
                    <option value="pre-lunch">Pre-Lunch</option>
                    <option value="pre-dinner">Pre-Dinner</option>
                    <option value="night">Night</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Health Metrics Section */}
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FiThermometer} mr={2} color="gray.500" />
                <Text fontWeight="medium">Health Metrics</Text>
              </Flex>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Blood Sugar (mg/dL)</FormLabel>
                  <Input
                    type="number"
                    name="bloodSugar"
                    placeholder="Enter blood sugar level"
                    value={dosageData.data.bloodSugar}
                    onChange={handleInputChange}
                    size="md"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">
                    Carbohydrate Intake (g)
                  </FormLabel>
                  <Input
                    type="number"
                    name="carboLevel"
                    placeholder="Enter carbohydrate intake"
                    value={dosageData.data.carboLevel}
                    onChange={handleInputChange}
                    size="md"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Insulin and Activity Section */}
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FiActivity} mr={2} color="gray.500" />
                <Text fontWeight="medium">Insulin & Activity</Text>
              </Flex>
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
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
                      size="md"
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
                      size="md"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Physical Activity</FormLabel>
                  <Select
                    name="physicalActivity"
                    placeholder="Select activity level"
                    value={dosageData.data.physicalActivity}
                    onChange={handleInputChange}
                    size="md"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </Select>
                </FormControl>
              </VStack>
            </Box>

            <Flex justify="flex-end" mt={6}>
              <Button
                type="submit"
                colorScheme="red"
                isLoading={isSubmitting}
                loadingText="Saving..."
                leftIcon={<FiCheck />}
                size="lg"
                px={8}
              >
                Save Dosage Record
              </Button>
            </Flex>
          </VStack>
        </chakra.form>
      </CardBody>
    </Card>
  );
}

export default DailyDosageForm;
