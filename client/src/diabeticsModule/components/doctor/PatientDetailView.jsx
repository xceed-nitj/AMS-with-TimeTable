import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Stat,
  StatNumber,
  StatHelpText,
  Badge,
  Divider,
  Icon,
  useColorModeValue,
  Spinner,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  useToast,
} from '@chakra-ui/react';
import { axiosInstance } from '../../api/config';
import { getStatusColor } from '../../utils/statusUtils';
const PatientDetailView = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState([]);

  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [selectedSession, setSelectedSession] = useState('all'); // 'all', 'pre-breakfast', etc.
  const toast = useToast();

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await axiosInstance.get(
          `/diabeticsModule/patient/${patientId}`
        );
        setPatient(response.data);
      } catch (error) {
        console.error('Error fetching patient:', error);
        toast({
          title: 'Error',
          description: 'Failed to load patient details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId, toast]);

  // Fetch patient readings
  const fetchReadings = async () => {
    try {
      const res = await axiosInstance.get(
        `/diabeticsModule/dailyDosage/patient/${patientId}`
      );
      setReadings(res.data || []);
      processChartData(res.data || [], timeRange, selectedSession);
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [patientId]);

  // Process data for charts based on time range and session filter
  const processChartData = (data, range, session) => {
    if (!data || data.length === 0) return;

    // Filter by time range
    const now = new Date();
    let startDate;

    switch (range) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    // Filter by date and session
    let filteredData = data.filter(
      (reading) =>
        new Date(reading.data.date) >= startDate &&
        (session === 'all' || reading.data.session === session)
    );

    // Sort by date
    filteredData = filteredData.sort(
      (a, b) => new Date(a.data.date) - new Date(b.data.date)
    );

    // Format for recharts
    const formattedData = filteredData.map((reading) => ({
      date: new Date(reading.data.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      bloodSugar: reading.data.bloodSugar,
      carboLevel: reading.data.carboLevel,
      insulin: reading.data.insulin,
      session: reading.data.session,
    }));

    setChartData(formattedData);
  };

  // Update chart when filters change
  useEffect(() => {
    if (readings.length > 0) {
      processChartData(readings, timeRange, selectedSession);
    }
  }, [timeRange, selectedSession, readings]);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!patient) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Patient not found</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Box>
          <Heading size="lg">{patient.name}</Heading>
          <HStack spacing={4} mt={2}>
            <Badge colorScheme="blue">Patient ID: {patient._id}</Badge>
            <Badge colorScheme="green">Age: {patient.age}</Badge>
            <Badge colorScheme="purple">Gender: {patient.gender}</Badge>
          </HStack>
        </Box>

        <Divider />

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <Heading size="md">Personal Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="bold">Contact Information</Text>
                <Text>Email: {patient.email}</Text>
                <Text>Phone: {patient.contactNumber}</Text>
                <Text>Address: {patient.address}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Family Information</Text>
                <Text>Father&apos;s Name: {patient.father_name}</Text>
                <Text>Mother&apos;s Name: {patient.mother_name}</Text>
                <Text>Economic Status: {patient.economic_status}</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <Heading size="md">Medical Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="bold">Physical Details</Text>
                <Text>Weight: {patient.weight} kg</Text>
                <Text>Height: {patient.height} cm</Text>
                <Text>
                  Date of Birth: {new Date(patient.DOB).toLocaleDateString()}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Diabetes Information</Text>
                <Text>
                  Type 1 Diabetes Diagnosis Date:{' '}
                  {new Date(patient.DOD_of_T1D).toLocaleDateString()}
                </Text>
                <Text>Family History: {patient.family_history}</Text>
                <Text>Referring Physician: {patient.referring_physician}</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader>
            <Heading size="md">Medical History</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="bold">Treatment History</Text>
                <Text>
                  {patient.treatment_history ||
                    'No treatment history available'}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Immunization History</Text>
                <Text>
                  {patient.immunization_history ||
                    'No immunization history available'}
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Hospital Information */}
        <Card>
          <CardHeader>
            <Heading size="md">Hospital Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Hospital Details */}
              <Box>
                <Heading size="sm" mb={3}>
                  Hospital Details
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Name</Text>
                    <Text>{patient.hospital.name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Location</Text>
                    <Text>{patient.hospital.location}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Contact</Text>
                    <Text>{patient.hospital.phone}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Registration Date</Text>
                    <Text>
                      {new Date(
                        patient.hospital.createdAt
                      ).toLocaleDateString()}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Assigned Doctors */}
              <Box>
                <Heading size="sm" mb={3}>
                  Assigned Doctors
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {patient.doctors?.map((doctor) => (
                    <Card key={doctor._id} variant="outline">
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="bold" fontSize="lg">
                            {doctor.name}
                          </Text>
                          <SimpleGrid columns={2} spacing={4} width="100%">
                            <Box>
                              <Text color="gray.600">Age</Text>
                              <Text>{doctor.age}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.600">Contact</Text>
                              <Text>{doctor.contactNumber}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.600">Email</Text>
                              <Text>{doctor.email}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.600">Address</Text>
                              <Text>{doctor.address}</Text>
                            </Box>
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
                {(!patient.doctors || patient.doctors.length === 0) && (
                  <Text color="gray.500">No doctors assigned yet</Text>
                )}
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default PatientDetailView;

// Stat Box Component
const StatBox = ({ title, value, unit, status, icon }) => {
  const color = getStatusColor(status);
  const bg = useColorModeValue('white', 'gray.700');

  return (
    <Box p={5} borderRadius="lg" boxShadow="sm" bg={bg} borderWidth="1px">
      <Flex align="center" mb={2}>
        <Flex
          align="center"
          justify="center"
          h="40px"
          w="40px"
          borderRadius="full"
          bg={`${color}15`}
          mr={3}
        >
          <Icon as={icon} color={color} boxSize={5} />
        </Flex>
        <Text fontWeight="medium">{title}</Text>
      </Flex>
      <Stat>
        <StatNumber fontSize="2xl" color={color}>
          {value}{' '}
          <StatHelpText as="span" fontSize="md">
            {unit}
          </StatHelpText>
        </StatNumber>
      </Stat>
    </Box>
  );
};
