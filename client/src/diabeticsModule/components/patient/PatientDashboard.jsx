import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiDroplet,
  FiPieChart,
  FiPlus,
  FiZap,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
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
import DailyDosageForm from '../DailyDosageForm';
import { getCurrentPatient } from '../../api/patientApi';
import {
  getPatientDailyDosageByDate,
  getPatientDailyDosageByRange,
} from '../../api/dailyDosageApi';

export default function PatientDashboard() {
  const [patient, setPatient] = useState(null);
  const [todaysReadings, setTodaysReadings] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current patient info
  const fetchPatientData = async () => {
    try {
      const data = await getCurrentPatient();
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  // Get today's readings
  const fetchTodaysReadings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await getPatientDailyDosageByDate(today);
      // Extract the data from the nested structure
      const readings = data.map((reading) => reading.data);
      setTodaysReadings(readings || []);
    } catch (error) {
      console.error("Error fetching today's readings:", error);
    }
  };

  // Get week's data for chart
  const fetchWeekData = async () => {
    try {
      // Get data for the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const data = await getPatientDailyDosageByRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (data && data.length > 0) {
        const readings = data.map((reading) => reading.data);
        setWeekData(readings);
      } else {
        setWeekData([]);
      }
    } catch (error) {
      console.error('Error fetching week data:', error);
      setWeekData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
    fetchTodaysReadings();
    fetchWeekData();
  }, []);

  const cardBg = useColorModeValue('white', 'gray.800');

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
          to={`/dm/patient/${patient?._id}/history`}
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
              <Text fontSize="sm">{format(new Date(), 'dd-MM-yyyy')}</Text>
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
                      ).toLocaleTimeString('en-CA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
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
          <DailyDosageForm
            patientId={patient?._id}
            onSuccess={() => {
              fetchTodaysReadings();
              fetchWeekData();
            }}
          />
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

        {weekData.length > 0 ? (
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weekData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={(data) => `${data.date} ${data.time}`}
                  tickFormatter={(dateTime) => {
                    if (!dateTime) return '';
                    const [date, time] = dateTime.split(' ');
                    return `${format(new Date(date), 'MMM dd')} / ${time}`;
                  }}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(dateTime) => {
                    if (!dateTime) return '';
                    const [date, time] = dateTime.split(' ');
                    return `${format(new Date(date), 'MMM dd')} at ${time}`;
                  }}
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
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="longLastingInsulin"
                  name="Long Lasting Insulin"
                  stroke="#805AD5"
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
            h="300px"
            bg="gray.50"
            borderRadius="md"
          >
            <Text color="gray.500">
              No readings available for the past week
            </Text>
          </Flex>
        )}
      </Box>

      <Box p={6} borderRadius="lg" borderWidth="1px" bg={cardBg} boxShadow="md">
        <Heading as="h2" size="md" mb={4}>
          Tips & Recommendations
        </Heading>

        <VStack align="stretch" spacing={4}>
          <Flex p={4} borderRadius="md" bg="cyan.50">
            <Icon as={FiActivity} boxSize={6} color="cyan.500" mr={4} />
            <Box>
              <Text fontWeight="bold" color="cyan.700">
                Stay Active
              </Text>
              <Text color="cyan.600">
                Regular physical activity can help maintain blood sugar levels.
              </Text>
            </Box>
          </Flex>

          <Flex p={4} borderRadius="md" bg="blue.50">
            <Icon as={FiPieChart} boxSize={6} color="blue.700" mr={4} />
            <Box>
              <Text fontWeight="bold" color="blue.700">
                Balance Your Diet
              </Text>
              <Text color="blue.600">
                Focus on a diet rich in vegetables, lean proteins, and complex
                carbohydrates.
              </Text>
            </Box>
          </Flex>

          <Flex p={4} borderRadius="md" bg="teal.50">
            <Icon as={FiClock} boxSize={6} color="teal.500" mr={4} />
            <Box>
              <Text fontWeight="bold" color="teal.700">
                Regular Monitoring
              </Text>
              <Text color="teal.600">
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
