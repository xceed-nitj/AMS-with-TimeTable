import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Icon,
  Avatar,
  useColorModeValue,
  Spinner,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Textarea,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Select,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiActivity,
  FiDroplet,
  FiPieChart,
  FiZap,
  FiClock,
  FiSend,
  FiPlus,
  FiDownload,
  FiRefreshCw,
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
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

// Mock data - replace with actual API calls
const mockPatient = {
  _id: '123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 42,
  DOB: '1980-05-15',
  gender: 'Male',
  contactNumber: '123-456-7890',
  address: '123 Main St, Anytown, USA',
  hospital: 'Metro Hospital',
  medicalHistory: 'Type 1 Diabetes since 2010, Hypertension',
  doctorIds: ['789'],
  father_name: 'Richard Doe',
  mother_name: 'Mary Doe',
  weight: 75,
  height: 175,
  DOD_of_T1D: '2010-03-22',
  family_history: 'Father had Type 2 Diabetes',
  economic_status: 'Middle class',
  immunization_history: 'Up to date with standard immunizations',
  treatment_history: 'Insulin therapy since 2010',
};

const mockReadings = Array(30)
  .fill(0)
  .map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);

    return {
      _id: `reading-${i}`,
      data: {
        date: date.toISOString(),
        session: ['pre-breakfast', 'pre-lunch', 'pre-dinner', 'night'][i % 4],
        bloodSugar: 100 + Math.floor(Math.random() * 100),
        carboLevel: 60 + Math.floor(Math.random() * 40),
        insulin: 8 + Math.floor(Math.random() * 8),
        longLastingInsulin: i % 2 === 0 ? 15 : 0,
        physicalActivity: ['Low', 'Moderate', 'High'][i % 3],
      },
      createdAt: date.toISOString(),
    };
  });

const mockNotes = [
  {
    _id: 'note1',
    content:
      'Patient showing good blood sugar control. Continue with current insulin regimen.',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    doctorName: 'Dr. Sarah Wilson',
  },
  {
    _id: 'note2',
    content:
      'Discussed dietary adjustments to manage morning highs. Patient agreed to reduce carb intake at dinner.',
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    doctorName: 'Dr. Sarah Wilson',
  },
];

export default function PatientDetailView() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [readings, setReadings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [selectedSession, setSelectedSession] = useState('all'); // 'all', 'pre-breakfast', etc.
  const toast = useToast();

  // Fetch patient data
  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/diabeticsModule/patient/${patientId}`);
      setPatient(res.data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      // Use mock data for development
      setPatient(mockPatient);
    }
  };

  // Fetch patient readings
  const fetchReadings = async () => {
    try {
      const res = await axios.get(
        `/api/diabeticsModule/dailyDosage/patient/${patientId}`
      );
      setReadings(res.data || []);
      processChartData(res.data || [], timeRange, selectedSession);
    } catch (error) {
      console.error('Error fetching readings:', error);
      // Use mock data for development
      setReadings(mockReadings);
      processChartData(mockReadings, timeRange, selectedSession);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctor notes
  const fetchNotes = async () => {
    try {
      const res = await axios.get(
        `/api/diabeticsModule/patient/${patientId}/notes`
      );
      setNotes(res.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Use mock data for development
      setNotes(mockNotes);
    }
  };

  useEffect(() => {
    fetchPatientData();
    fetchReadings();
    fetchNotes();
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

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const doctorId = localStorage.getItem('doctorId');
      if (!doctorId) {
        // Redirect to login if no doctor ID
        return;
      }

      const noteData = {
        patientId,
        doctorId,
        content: newNote,
      };

      const res = await axios.post(
        '/api/diabeticsModule/patient/note',
        noteData
      );

      // Add the new note to the list
      setNotes([res.data, ...notes]);
      setNewNote('');

      toast({
        title: 'Note Added',
        description: 'Your note has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding note:', error);

      // For development, simulate adding a note
      const mockNewNote = {
        _id: `note-${Date.now()}`,
        content: newNote,
        createdAt: new Date().toISOString(),
        doctorName: 'Dr. Sarah Wilson',
      };

      setNotes([mockNewNote, ...notes]);
      setNewNote('');

      toast({
        title: 'Note Added',
        description: 'Your note has been added successfully (mock)',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!patient) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" align="center" justify="center" h="50vh">
          <Icon as={FiUser} boxSize={12} color="gray.400" mb={4} />
          <Heading size="md" mb={2}>
            Patient Not Found
          </Heading>
          <Text color="gray.500" mb={6}>
            The patient you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access.
          </Text>
          <Button
            as={RouterLink}
            to="/dm/doctor/dashboard"
            leftIcon={<FiArrowLeft />}
            colorScheme="teal"
          >
            Back to Dashboard
          </Button>
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header Section */}
      <Flex align="center" mb={8}>
        <Button
          as={RouterLink}
          to="/dm/doctor/dashboard"
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          mr={4}
        >
          Back
        </Button>
        <Box>
          <Heading mb={1}>Patient Profile</Heading>
          <Text color="gray.600">Manage and monitor patient health data</Text>
        </Box>
      </Flex>

      {/* Patient Info Section */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={8}>
        {/* Left Column - Basic Info */}
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Box
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            bg={bg}
            boxShadow="md"
            height="100%"
          >
            <Flex direction="column" align="center" mb={6}>
              <Avatar size="xl" name={patient.name} mb={4} bg="teal.500" />
              <Heading size="md">{patient.name}</Heading>
              <Badge colorScheme="blue" mt={2}>
                Type 1 Diabetes
              </Badge>
            </Flex>

            <Divider mb={6} />

            <VStack align="start" spacing={4}>
              <Flex align="center">
                <Icon as={FiUser} color="gray.500" mr={3} />
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Age
                  </Text>
                  <Text fontWeight="medium">{patient.age} years</Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Icon as={FiCalendar} color="gray.500" mr={3} />
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Date of Birth
                  </Text>
                  <Text fontWeight="medium">{formatDate(patient.DOB)}</Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Icon as={FiPhone} color="gray.500" mr={3} />
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Contact
                  </Text>
                  <Text fontWeight="medium">{patient.contactNumber}</Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Icon as={FiMapPin} color="gray.500" mr={3} />
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Address
                  </Text>
                  <Text fontWeight="medium">{patient.address}</Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Icon as={BuildingOfficeIcon} color="gray.500" mr={3} />
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Hospital
                  </Text>
                  <Text fontWeight="medium">{patient.hospital}</Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Icon as={FiActivity} color="gray.500" mr={3} />
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Diagnosis Date
                  </Text>
                  <Text fontWeight="medium">
                    {formatDate(patient.DOD_of_T1D)}
                  </Text>
                </Box>
              </Flex>
            </VStack>
          </Box>
        </GridItem>

        {/* Middle Column - Medical Info */}
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Box
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            bg={bg}
            boxShadow="md"
            height="100%"
          >
            <Heading size="md" mb={4}>
              Medical Information
            </Heading>

            <SimpleGrid columns={2} spacing={4} mb={6}>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Height
                </Text>
                <Text fontWeight="medium">{patient.height || 'N/A'} cm</Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.500">
                  Weight
                </Text>
                <Text fontWeight="medium">{patient.weight || 'N/A'} kg</Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.500">
                  Gender
                </Text>
                <Text fontWeight="medium">{patient.gender || 'N/A'}</Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.500">
                  Family History
                </Text>
                <Text fontWeight="medium" noOfLines={1}>
                  {patient.family_history || 'N/A'}
                </Text>
              </Box>
            </SimpleGrid>

            <Divider mb={4} />

            <Box mb={4}>
              <Text fontSize="sm" color="gray.500" mb={1}>
                Medical History
              </Text>
              <Text>
                {patient.medicalHistory || 'No recorded medical history'}
              </Text>
            </Box>

            <Box mb={4}>
              <Text fontSize="sm" color="gray.500" mb={1}>
                Treatment History
              </Text>
              <Text>
                {patient.treatment_history || 'No recorded treatment history'}
              </Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>
                Immunization
              </Text>
              <Text>
                {patient.immunization_history ||
                  'No recorded immunization history'}
              </Text>
            </Box>
          </Box>
        </GridItem>

        {/* Right Column - Family & Recent Readings */}
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <VStack spacing={4} align="stretch" height="100%">
            <Box
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              bg={bg}
              boxShadow="md"
            >
              <Heading size="md" mb={4}>
                Family Information
              </Heading>

              <SimpleGrid columns={1} spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Father&apos;s Name
                  </Text>
                  <Text fontWeight="medium">
                    {patient.father_name || 'N/A'}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Mother&apos;s Name
                  </Text>
                  <Text fontWeight="medium">
                    {patient.mother_name || 'N/A'}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Economic Status
                  </Text>
                  <Text fontWeight="medium">
                    {patient.economic_status || 'N/A'}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            <Box
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              bg={bg}
              boxShadow="md"
              flex="1"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Recent Readings</Heading>
                <IconButton
                  icon={<FiRefreshCw />}
                  aria-label="Refresh data"
                  size="sm"
                  variant="ghost"
                  onClick={fetchReadings}
                />
              </Flex>

              {readings.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                  {readings.slice(0, 3).map((reading, index) => (
                    <Box
                      key={index}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderLeftWidth="4px"
                      borderLeftColor={
                        reading.data.bloodSugar > 180
                          ? 'red.400'
                          : reading.data.bloodSugar < 70
                          ? 'orange.400'
                          : 'green.400'
                      }
                    >
                      <Flex justify="space-between" mb={1}>
                        <Badge colorScheme="blue">{reading.data.session}</Badge>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(reading.data.date).toLocaleDateString()}
                        </Text>
                      </Flex>
                      <SimpleGrid columns={3} spacing={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Blood Sugar
                          </Text>
                          <Text
                            fontWeight="bold"
                            color={
                              reading.data.bloodSugar > 180
                                ? 'red.500'
                                : reading.data.bloodSugar < 70
                                ? 'orange.500'
                                : 'green.500'
                            }
                          >
                            {reading.data.bloodSugar} mg/dL
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Carbs
                          </Text>
                          <Text>{reading.data.carboLevel} g</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            Insulin
                          </Text>
                          <Text>{reading.data.insulin} units</Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py={6}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <Text color="gray.500" mb={2}>
                    No readings recorded
                  </Text>
                </Flex>
              )}

              <Button
                as={RouterLink}
                to={`/dm/doctor/patient/${patientId}/readings`}
                colorScheme="teal"
                variant="outline"
                size="sm"
                width="full"
                mt={3}
                leftIcon={<FiActivity />}
              >
                View All Readings
              </Button>
            </Box>
          </VStack>
        </GridItem>
      </SimpleGrid>

      {/* Tabs Section for Data, Charts, and Notes */}
      <Box
        borderRadius="lg"
        borderWidth="1px"
        overflow="hidden"
        bg={bg}
        boxShadow="md"
      >
        <Tabs variant="enclosed" colorScheme="teal">
          <TabList px={4} pt={4}>
            <Tab>Blood Sugar Analytics</Tab>
            <Tab>Doctor Notes</Tab>
            <Tab>Treatment Plan</Tab>
          </TabList>

          <TabPanels>
            {/* Blood Sugar Analytics Panel */}
            <TabPanel p={6}>
              <Flex
                justify="space-between"
                align="center"
                mb={6}
                wrap="wrap"
                gap={3}
              >
                <Heading size="md">Blood Sugar Trends</Heading>
                <HStack spacing={4}>
                  <FormControl w="auto">
                    <FormLabel fontSize="sm">Time Range</FormLabel>
                    <Select
                      size="sm"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      minW="120px"
                    >
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="year">Last Year</option>
                    </Select>
                  </FormControl>

                  <FormControl w="auto">
                    <FormLabel fontSize="sm">Session</FormLabel>
                    <Select
                      size="sm"
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      minW="140px"
                    >
                      <option value="all">All Sessions</option>
                      <option value="pre-breakfast">Pre-Breakfast</option>
                      <option value="pre-lunch">Pre-Lunch</option>
                      <option value="pre-dinner">Pre-Dinner</option>
                      <option value="night">Night</option>
                    </Select>
                  </FormControl>
                </HStack>
              </Flex>

              {/* Chart Section */}
              <Box p={1} borderRadius="md" mb={6} height="400px">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                        domain={[0, 'auto']}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                        domain={[0, 'auto']}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="bloodSugar"
                        name="Blood Sugar (mg/dL)"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="carboLevel"
                        name="Carbs (g)"
                        stroke="#82ca9d"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="insulin"
                        name="Insulin (units)"
                        stroke="#ffc658"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Flex
                    justify="center"
                    align="center"
                    height="100%"
                    bg="gray.50"
                    borderRadius="md"
                  >
                    <Text color="gray.500">
                      No data available for the selected filters
                    </Text>
                  </Flex>
                )}
              </Box>

              {/* Analytics Summary */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <StatBox
                  title="Average Blood Sugar"
                  value={
                    chartData.length > 0
                      ? Math.round(
                          chartData.reduce(
                            (sum, item) => sum + item.bloodSugar,
                            0
                          ) / chartData.length
                        )
                      : 'N/A'
                  }
                  unit="mg/dL"
                  status={
                    chartData.length > 0
                      ? chartData.reduce(
                          (sum, item) => sum + item.bloodSugar,
                          0
                        ) /
                          chartData.length >
                        180
                        ? 'warning'
                        : 'normal'
                      : 'normal'
                  }
                  icon={FiDroplet}
                />

                <StatBox
                  title="Average Carb Intake"
                  value={
                    chartData.length > 0
                      ? Math.round(
                          chartData.reduce(
                            (sum, item) => sum + item.carboLevel,
                            0
                          ) / chartData.length
                        )
                      : 'N/A'
                  }
                  unit="g"
                  status="normal"
                  icon={FiPieChart}
                />

                <StatBox
                  title="Average Insulin Dose"
                  value={
                    chartData.length > 0
                      ? (
                          chartData.reduce(
                            (sum, item) => sum + item.insulin,
                            0
                          ) / chartData.length
                        ).toFixed(1)
                      : 'N/A'
                  }
                  unit="units"
                  status="normal"
                  icon={FiZap}
                />
              </SimpleGrid>
            </TabPanel>

            {/* Doctor Notes Panel */}
            <TabPanel p={6}>
              <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md">Treatment Notes</Heading>
                <Button
                  leftIcon={<FiDownload />}
                  size="sm"
                  variant="outline"
                  colorScheme="teal"
                  onClick={() => {
                    toast({
                      title: 'Export functionality',
                      description: 'This would export notes as PDF',
                      status: 'info',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                >
                  Export Notes
                </Button>
              </Flex>

              {/* Add Note Section */}
              <Card mb={6} variant="outline">
                <CardHeader pb={0}>
                  <Heading size="sm">Add New Note</Heading>
                </CardHeader>
                <CardBody>
                  <FormControl mb={3}>
                    <Textarea
                      placeholder="Enter your treatment notes, observations, or recommendations here..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                  </FormControl>
                  <Flex justify="flex-end">
                    <Button
                      leftIcon={<FiSend />}
                      colorScheme="teal"
                      onClick={handleAddNote}
                      isDisabled={!newNote.trim()}
                    >
                      Save Note
                    </Button>
                  </Flex>
                </CardBody>
              </Card>

              {/* Notes List */}
              <VStack spacing={4} align="stretch">
                {notes.length > 0 ? (
                  notes.map((note, index) => (
                    <Card key={note._id || index} variant="outline">
                      <CardBody>
                        <Text mb={3}>{note.content}</Text>
                        <Flex
                          justify="space-between"
                          align="center"
                          fontSize="sm"
                          color="gray.500"
                        >
                          <Text>{note.doctorName}</Text>
                          <Flex align="center">
                            <Icon as={FiClock} mr={1} />
                            <Text>{formatDate(note.createdAt)}</Text>
                          </Flex>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    py={8}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    <Icon as={FiPlus} color="gray.400" boxSize={8} mb={2} />
                    <Text color="gray.500">
                      No notes recorded for this patient
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Add the first note using the form above
                    </Text>
                  </Flex>
                )}
              </VStack>
            </TabPanel>

            {/* Treatment Plan Panel */}
            <TabPanel p={6}>
              <Heading size="md" mb={6}>
                Treatment Plan
              </Heading>
              <Text color="gray.600" mb={4}>
                This section would contain the patient&apos;s treatment plan,
                medication schedule, and care recommendations.
              </Text>
              <Box p={8} borderWidth="1px" borderRadius="md" bg="gray.50">
                <Text textAlign="center" color="gray.500">
                  Treatment plan feature will be implemented in a future update.
                </Text>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

// Stat Box Component
const StatBox = ({ title, value, unit, status, icon }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'warning':
        return 'orange.500';
      case 'danger':
        return 'red.500';
      default:
        return 'green.500';
    }
  };

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
