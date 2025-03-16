import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  VStack,
  Badge,
  Progress,
  useColorModeValue,
  Divider,
  Icon,
  Input,
  FormControl,
  FormLabel,
  Spinner,
  useToast,
  Select,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import {
  FiActivity,
  FiDroplet,
  FiPieChart,
  FiZap,
  FiCalendar,
  FiClock,
  FiPlus,
  FiBarChart2,
} from 'react-icons/fi';
import { Line } from 'recharts';

// Mock data - replace with actual API calls
const mockWeekData = [
  { day: 'Mon', bloodSugar: 120, carboLevel: 80, insulin: 10 },
  { day: 'Tue', bloodSugar: 140, carboLevel: 95, insulin: 12 },
  { day: 'Wed', bloodSugar: 130, carboLevel: 85, insulin: 11 },
  { day: 'Thu', bloodSugar: 125, carboLevel: 75, insulin: 10 },
  { day: 'Fri', bloodSugar: 145, carboLevel: 90, insulin: 14 },
  { day: 'Sat', bloodSugar: 135, carboLevel: 88, insulin: 12 },
  { day: 'Sun', bloodSugar: 118, carboLevel: 72, insulin: 9 },
];

export default function PatientDashboard() {
  const [patient, setPatient] = useState(null);
  const [todaysReadings, setTodaysReadings] = useState([]);
  const [weekData, setWeekData] = useState(mockWeekData);
  const [loading, setLoading] = useState(true);
  const [newReading, setNewReading] = useState({
    session: 'pre-breakfast',
    bloodSugar: '',
    carboLevel: '',
    insulin: '',
    longLastingInsulin: '',
    physicalActivity: 'Low',
  });
  const toast = useToast();

  // Get current patient info
  const fetchPatientData = async () => {
    try {
      // This would need to get the current logged-in patient
      const patientId = localStorage.getItem('patientId');
      if (!patientId) {
        // Redirect to login if no patient ID
        return;
      }

      const res = await axios.get(`/api/diabeticsModule/patient/${patientId}`);
      setPatient(res.data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      // In development, use mock data
      setPatient({
        name: 'John Doe',
        age: 42,
        hospital: 'Metro Hospital',
        doctorIds: ['Dr. Sarah Wilson'],
      });
    }
  };

  // Get today's readings
  const fetchTodaysReadings = async () => {
    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) return;

      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(
        `/api/diabeticsModule/dailyDosage/patient/${patientId}/date/${today}`
      );
      setTodaysReadings(res.data || []);
    } catch (error) {
      console.error("Error fetching today's readings:", error);
      // Use mock data
      setTodaysReadings([
        {
          session: 'pre-breakfast',
          bloodSugar: 130,
          carboLevel: 80,
          insulin: 11,
          longLastingInsulin: 15,
        },
        {
          session: 'pre-lunch',
          bloodSugar: 145,
          carboLevel: 90,
          insulin: 13,
          longLastingInsulin: 0,
        },
      ]);
    }
  };

  // Get week's data for chart
  const fetchWeekData = async () => {
    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) return;

      // Get data for the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const res = await axios.get(
        `/api/diabeticsModule/dailyDosage/patient/${patientId}/range/${startDate.toISOString()}/${endDate.toISOString()}`
      );

      // Process the data for the chart
      // This would need to be adapted based on the actual API response format
      if (res.data && res.data.length > 0) {
        setWeekData(res.data);
      }
    } catch (error) {
      console.error('Error fetching week data:', error);
      // Keep using mock data if API fails
    } finally {
      setLoading(false);
    }
  };

  // Save a new reading
  const handleSaveReading = async () => {
    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) return;

      // Validate input
      if (
        !newReading.bloodSugar ||
        !newReading.carboLevel ||
        !newReading.insulin
      ) {
        toast({
          title: 'Missing fields',
          description: 'Please fill in all required fields',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Prepare the data
      const data = {
        patientId,
        data: {
          date: new Date(),
          ...newReading,
          bloodSugar: parseFloat(newReading.bloodSugar),
          carboLevel: parseFloat(newReading.carboLevel),
          insulin: parseFloat(newReading.insulin),
          longLastingInsulin: parseFloat(newReading.longLastingInsulin || 0),
        },
      };

      await axios.post('/api/diabeticsModule/dailyDosage', data);

      toast({
        title: 'Reading saved',
        description: 'Your health data has been recorded',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear form and refresh data
      setNewReading({
        session: 'pre-breakfast',
        bloodSugar: '',
        carboLevel: '',
        insulin: '',
        longLastingInsulin: '',
        physicalActivity: 'Low',
      });
      fetchTodaysReadings();
      fetchWeekData();
    } catch (error) {
      console.error('Error saving reading:', error);
      toast({
        title: 'Error',
        description: 'Could not save your reading. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchPatientData();
    fetchTodaysReadings();
    fetchWeekData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReading((prev) => ({ ...prev, [name]: value }));
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading as="h1" size="xl">
          Welcome, {patient?.name || 'Patient'}
        </Heading>
        <Button
          as={RouterLink}
          to="/dm/patient/history"
          colorScheme="teal"
          leftIcon={<FiCalendar />}
        >
          View History
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        {/* Today's Status */}
        <Box
          p={6}
          borderRadius="lg"
          borderWidth="1px"
          bg={cardBg}
          boxShadow="md"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Heading as="h2" size="md">
              Today&apos;s Status
            </Heading>
            <HStack>
              <Icon as={FiClock} />
              <Text fontSize="sm">{new Date().toLocaleDateString()}</Text>
            </HStack>
          </Flex>

          {todaysReadings.length > 0 ? (
            <VStack align="stretch" spacing={4}>
              {todaysReadings.map((reading, index) => (
                <Box key={index} p={3} borderWidth="1px" borderRadius="md">
                  <Flex justify="space-between" mb={2}>
                    <Badge colorScheme="blue">{reading.session}</Badge>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(
                        reading.createdAt || Date.now()
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Flex>
                  <SimpleGrid columns={3} spacing={4}>
                    <ReadingStat
                      icon={FiDroplet}
                      label="Blood Sugar"
                      value={reading.bloodSugar}
                      unit="mg/dL"
                      status={
                        reading.bloodSugar > 180
                          ? 'danger'
                          : reading.bloodSugar < 70
                          ? 'warning'
                          : 'normal'
                      }
                    />
                    <ReadingStat
                      icon={FiPieChart}
                      label="Carbs"
                      value={reading.carboLevel}
                      unit="g"
                      status="normal"
                    />
                    <ReadingStat
                      icon={FiZap}
                      label="Insulin"
                      value={reading.insulin}
                      unit="units"
                      status="normal"
                    />
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="200px"
              bg="gray.50"
              borderRadius="md"
            >
              <Text color="gray.500" mb={2}>
                No readings recorded for today
              </Text>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="teal"
                variant="outline"
                size="sm"
                onClick={() => {
                  document.getElementById('new-reading-form').scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
              >
                Add Your First Reading
              </Button>
            </Flex>
          )}
        </Box>

        {/* Quick Reading Entry */}
        <Box
          p={6}
          borderRadius="lg"
          borderWidth="1px"
          bg={cardBg}
          boxShadow="md"
          id="new-reading-form"
        >
          <Heading as="h2" size="md" mb={4}>
            Add New Reading
          </Heading>

          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Session</FormLabel>
              <Select
                name="session"
                value={newReading.session}
                onChange={handleInputChange}
              >
                <option value="pre-breakfast">Pre-Breakfast</option>
                <option value="pre-lunch">Pre-Lunch</option>
                <option value="pre-dinner">Pre-Dinner</option>
                <option value="night">Night</option>
              </Select>
            </FormControl>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Blood Sugar (mg/dL)</FormLabel>
                <Input
                  type="number"
                  name="bloodSugar"
                  value={newReading.bloodSugar}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Carbohydrate Level (g)</FormLabel>
                <Input
                  type="number"
                  name="carboLevel"
                  value={newReading.carboLevel}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Insulin (units)</FormLabel>
                <Input
                  type="number"
                  name="insulin"
                  value={newReading.insulin}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Long-lasting Insulin (units)</FormLabel>
                <Input
                  type="number"
                  name="longLastingInsulin"
                  value={newReading.longLastingInsulin}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                />
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Expected Physical Activity</FormLabel>
              <Select
                name="physicalActivity"
                value={newReading.physicalActivity}
                onChange={handleInputChange}
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </Select>
            </FormControl>

            <Button
              colorScheme="teal"
              size="md"
              onClick={handleSaveReading}
              mt={2}
            >
              Save Reading
            </Button>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* 7-Day Trend */}
      <Box
        p={6}
        borderRadius="lg"
        borderWidth="1px"
        bg={cardBg}
        boxShadow="md"
        mb={8}
      >
        <Heading as="h2" size="md" mb={4}>
          <Flex align="center">
            <Icon as={FiBarChart2} mr={2} />
            7-Day Trends
          </Flex>
        </Heading>

        <Text mb={6} color="gray.600">
          History of your blood sugar, carbohydrate intake, and insulin dosage
          over the past week
        </Text>

        {/* This would be replaced with Recharts Line Chart */}
        <Box h="300px" position="relative">
          <Text textAlign="center" color="gray.500">
            Last 7 days readings
          </Text>
        </Box>
      </Box>

      {/* Advice & Recommendations */}
      <Box p={6} borderRadius="lg" borderWidth="1px" bg={cardBg} boxShadow="md">
        <Heading as="h2" size="md" mb={4}>
          Tips & Recommendations
        </Heading>

        <VStack align="stretch" spacing={4}>
          <Flex p={4} borderRadius="md" bg="blue.50">
            <Icon as={FiActivity} boxSize={6} color="blue.500" mr={4} />
            <Box>
              <Text fontWeight="bold" color="blue.700">
                Stay Active
              </Text>
              <Text color="blue.600">
                Regular physical activity can help maintain blood sugar levels.
              </Text>
            </Box>
          </Flex>

          <Flex p={4} borderRadius="md" bg="green.50">
            <Icon as={FiPieChart} boxSize={6} color="green.500" mr={4} />
            <Box>
              <Text fontWeight="bold" color="green.700">
                Balance Your Diet
              </Text>
              <Text color="green.600">
                Focus on a diet rich in vegetables, lean proteins, and complex
                carbohydrates.
              </Text>
            </Box>
          </Flex>

          <Flex p={4} borderRadius="md" bg="purple.50">
            <Icon as={FiClock} boxSize={6} color="purple.500" mr={4} />
            <Box>
              <Text fontWeight="bold" color="purple.700">
                Regular Monitoring
              </Text>
              <Text color="purple.600">
                Consistently monitor your blood sugar levels as recommended by
                your doctor.
              </Text>
            </Box>
          </Flex>
        </VStack>
      </Box>
    </Container>
  );
}

// Component for displaying a reading statistic
const ReadingStat = ({ icon, label, value, unit, status }) => {
  let statusColor;
  switch (status) {
    case 'danger':
      statusColor = 'red.500';
      break;
    case 'warning':
      statusColor = 'orange.500';
      break;
    default:
      statusColor = 'green.500';
  }

  return (
    <Stat>
      <StatLabel display="flex" alignItems="center">
        <Icon as={icon} mr={1} color={statusColor} />
        <Text>{label}</Text>
      </StatLabel>
      <StatNumber color={statusColor}>{value}</StatNumber>
      <StatHelpText>{unit}</StatHelpText>
    </Stat>
  );
};
