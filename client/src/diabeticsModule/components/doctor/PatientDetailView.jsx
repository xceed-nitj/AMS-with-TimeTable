import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  StatLabel,
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
  Button,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { axiosInstance } from '../../api/config';
import {
  FiArrowLeft,
  FiCalendar,
  FiDroplet,
  FiPieChart,
  FiZap,
  FiBarChart2,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const PatientDetailView = ({ patientId }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statBg = useColorModeValue('blue.50', 'blue.900');

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
        `/diabeticsModule/dailyDosage/all/${patientId}`
      );
      setReadings(res.data || []);
      processChartData(res.data || []);
    } catch (error) {
      console.error('Error fetching readings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patient readings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [patientId]);

  // Process data for charts
  const processChartData = (data) => {
    if (!data || data.length === 0) return;

    // Sort by date
    const sortedData = data.sort(
      (a, b) => new Date(a.data.date) - new Date(b.data.date)
    );

    // Format for recharts
    const formattedData = sortedData.map((reading) => ({
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
      <Button
        onClick={() => navigate(-1)}
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
              <Avatar size="xl" name={patient.name} mr={4} />
              <Box>
                <Heading size="lg">{patient.name}</Heading>
                <HStack spacing={4} mt={2}>
                  <Badge colorScheme="blue">
                    Hospital: {patient?.hospital?.name}
                  </Badge>
                  <Badge colorScheme="green">Age: {patient.age}</Badge>
                  <Badge colorScheme="purple">Gender: {patient.gender}</Badge>
                </HStack>
              </Box>
            </Flex>
            <Button
              as={RouterLink}
              to={`/dm/patient/${patientId}/history`}
              colorScheme="teal"
              leftIcon={<FiCalendar />}
            >
              View History
            </Button>
          </Flex>
        </CardHeader>

        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel>Latest Blood Sugar</StatLabel>
              <Flex align="center">
                <Icon as={FiDroplet} color="blue.500" mr={2} />
                <StatNumber>
                  {readings.length > 0
                    ? readings[readings.length - 1].data.bloodSugar
                    : 'N/A'}
                </StatNumber>
              </Flex>
              <StatHelpText>mg/dL</StatHelpText>
            </Stat>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel>Latest Carbs</StatLabel>
              <Flex align="center">
                <Icon as={FiPieChart} color="blue.500" mr={2} />
                <StatNumber>
                  {readings.length > 0
                    ? readings[readings.length - 1].data.carboLevel
                    : 'N/A'}
                </StatNumber>
              </Flex>
              <StatHelpText>grams</StatHelpText>
            </Stat>
            <Stat bg={statBg} p={4} borderRadius="md" boxShadow="sm">
              <StatLabel>Latest Insulin</StatLabel>
              <Flex align="center">
                <Icon as={FiZap} color="blue.500" mr={2} />
                <StatNumber>
                  {readings.length > 0
                    ? readings[readings.length - 1].data.insulin
                    : 'N/A'}
                </StatNumber>
              </Flex>
              <StatHelpText>units</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Divider mb={6} />

          <Tabs variant="enclosed" colorScheme="cyan">
            <TabList>
              <Tab fontWeight="semibold">Patient Information</Tab>
              <Tab fontWeight="semibold">Medical Records</Tab>
              <Tab fontWeight="semibold">Health Trends</Tab>
            </TabList>

            <TabPanels>
              <TabPanel p={0} pt={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card variant="outline">
                    <CardHeader>
                      <Heading size="md">Personal Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
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
                          <Text>
                            Economic Status: {patient.economic_status}
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline">
                    <CardHeader>
                      <Heading size="md">Medical Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Box>
                          <Text fontWeight="bold">Physical Details</Text>
                          <Text>Weight: {patient.weight} kg</Text>
                          <Text>Height: {patient.height} cm</Text>
                          <Text>
                            Date of Birth:{' '}
                            {new Date(patient.DOB).toLocaleDateString()}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Diabetes Information</Text>
                          <Text>
                            Type 1 Diabetes Diagnosis Date:{' '}
                            {new Date(patient.DOD_of_T1D).toLocaleDateString()}
                          </Text>
                          <Text>Family History: {patient.family_history}</Text>
                          <Text>
                            Referring Physician: {patient.referring_physician}
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              <TabPanel p={0} pt={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card variant="outline">
                    <CardHeader>
                      <Heading size="md">Medical History</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
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
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline">
                    <CardHeader>
                      <Heading size="md">Hospital Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Box>
                          <Text fontWeight="bold">Hospital Details</Text>
                          <Text>Name: {patient.hospital.name}</Text>
                          <Text>Location: {patient.hospital.location}</Text>
                          <Text>Contact: {patient.hospital.phone}</Text>
                          <Text>
                            Registration Date:{' '}
                            {new Date(
                              patient.hospital.createdAt
                            ).toLocaleDateString()}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Assigned Doctors</Text>
                          {patient.doctors?.map((doctor) => (
                            <Box key={doctor._id} mb={2}>
                              <Text>
                                {doctor.name} -{' '}
                                {doctor.specialization || 'General'}
                              </Text>
                            </Box>
                          ))}
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              <TabPanel p={0} pt={4}>
                <Card variant="outline">
                  <CardHeader>
                    <Heading size="md">
                      <Flex align="center">
                        <Icon as={FiBarChart2} mr={2} />
                        Health Trends
                      </Flex>
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    {chartData.length > 0 ? (
                      <Box h="400px">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) =>
                                format(new Date(date), 'MMM dd')
                              }
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                              labelFormatter={(date) =>
                                format(new Date(date), 'MMM dd, yyyy')
                              }
                            />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="bloodSugar"
                              name="Blood Sugar"
                              stroke="#5BA9B3"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="carboLevel"
                              name="Carbs"
                              stroke="#3B5998"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="insulin"
                              name="Insulin"
                              stroke="#FF8C00"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        h="400px"
                        bg="gray.50"
                        borderRadius="md"
                      >
                        <Text color="gray.500">No readings available</Text>
                      </Flex>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Container>
  );
};

export default PatientDetailView;
