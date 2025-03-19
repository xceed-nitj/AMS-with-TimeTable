import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiSearch,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { axiosInstance } from '../../../getenvironment';

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    stabilizedPatients: 0,
    missingReadings: 0,
  });

  const toast = useToast();

  const boxBg = useColorModeValue('white', 'gray.800');
  const theadBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch doctor's own data
  const fetchDoctorProfile = async () => {
    try {
      const res = await axiosInstance.get('/diabeticsModule/doctor/me');
      setDoctorInfo(res.data);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctor profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Fetch patients assigned to this doctor
  const fetchPatients = async () => {
    try {
      // Get doctor's own data which includes their patients
      const res = await axiosInstance.get('/diabeticsModule/doctor/me');
      const doctorData = res.data;

      // For each patient, get their latest reading using the new doctor-specific endpoint
      const patientsWithReadings = await Promise.all(
        doctorData.patients.map(async (patient) => {
          try {
            const readingRes = await axiosInstance.get(
              `/diabeticsModule/dailyDosage/doctor/patient/${patient._id}/latest`
            );

            let status = 'normal';
            if (readingRes.data && readingRes.data.bloodSugar) {
              if (readingRes.data.bloodSugar > 180) status = 'danger';
              else if (readingRes.data.bloodSugar < 70) status = 'warning';
            }

            return {
              ...patient,
              lastReading: readingRes.data || null,
              status,
            };
          } catch (error) {
            console.error(
              `Error fetching readings for patient ${patient._id}:`,
              error
            );
            return {
              ...patient,
              lastReading: null,
              status: 'unknown',
            };
          }
        })
      );

      setPatients(patientsWithReadings);

      // Calculate stats
      const critical = patientsWithReadings.filter(
        (p) => p.status === 'danger'
      ).length;
      const stable = patientsWithReadings.filter(
        (p) => p.status === 'normal'
      ).length;
      const missing = patientsWithReadings.filter((p) => !p.lastReading).length;

      setStats({
        totalPatients: patientsWithReadings.length,
        criticalPatients: critical,
        stabilizedPatients: stable,
        missingReadings: missing,
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patients data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
    fetchPatients();
  }, []);

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.contactNumber.includes(query) ||
      patient.hospital.toLowerCase().includes(query)
    );
  });

  // Sort patients by status (critical first)
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (a.status === 'danger' && b.status !== 'danger') return -1;
    if (a.status !== 'danger' && b.status === 'danger') return 1;
    if (a.status === 'warning' && b.status === 'normal') return -1;
    if (a.status === 'normal' && b.status === 'warning') return 1;
    return 0;
  });

  // Utility functions
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;

    // Less than a day
    if (diffMs < 86400000) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // More than a day
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'danger':
        return 'red.500';
      case 'warning':
        return 'orange.500';
      case 'normal':
        return 'green.500';
      default:
        return 'gray.500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'danger':
        return FiAlertCircle;
      case 'warning':
        return FiActivity;
      case 'normal':
        return FiCheckCircle;
      default:
        return FiUser;
    }
  };

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
        <Box>
          <Heading mb={1}>Doctor Dashboard</Heading>
          <Text color="gray.600">
            Welcome back, {doctorInfo?.name || 'Doctor'}
          </Text>
        </Box>
        <Badge colorScheme="blue" p={2} borderRadius="md">
          {doctorInfo?.hospital || 'Hospital'}
        </Badge>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          description="Under your care"
          icon={FiUsers}
          color="blue.500"
        />
        <StatCard
          title="Critical Patients"
          value={stats.criticalPatients}
          description="Need immediate attention"
          icon={FiAlertCircle}
          color="red.500"
        />
        <StatCard
          title="Stabilized Patients"
          value={stats.stabilizedPatients}
          description="With normal readings"
          icon={FiCheckCircle}
          color="green.500"
        />
        <StatCard
          title="Missing Readings"
          value={stats.missingReadings}
          description="No recent data"
          icon={FiBarChart2}
          color="orange.500"
        />
      </SimpleGrid>

      {/* Patient Search */}
      <Box mb={6}>
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search patients by name, contact, or hospital"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            borderRadius="md"
          />
        </InputGroup>
      </Box>

      {/* Patient List */}
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={boxBg}>
        <Table variant="simple">
          <Thead bg={theadBg}>
            <Tr>
              <Th>Patient</Th>
              <Th>Age</Th>
              <Th>Contact</Th>
              <Th>Last Reading</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedPatients.length > 0 ? (
              sortedPatients.map((patient) => (
                <Tr key={patient._id}>
                  <Td>
                    <Flex align="center">
                      <Avatar
                        size="sm"
                        name={patient.name}
                        mr={2}
                        bg={getStatusColor(patient.status)}
                      />
                      <Text fontWeight="medium">{patient.name}</Text>
                    </Flex>
                  </Td>
                  <Td>{patient.age}</Td>
                  <Td>{patient.contactNumber}</Td>
                  <Td>
                    {patient.lastReading ? (
                      <Flex direction="column">
                        <Text fontWeight="medium">
                          {patient.lastReading.bloodSugar} mg/dL
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatTime(
                            patient.lastReading.timestamp ||
                              patient.lastReading.createdAt
                          )}
                        </Text>
                      </Flex>
                    ) : (
                      <Text color="gray.500">No data</Text>
                    )}
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        patient.status === 'danger'
                          ? 'red'
                          : patient.status === 'warning'
                          ? 'orange'
                          : 'green'
                      }
                      display="flex"
                      alignItems="center"
                      width="fit-content"
                      px={2}
                      py={1}
                    >
                      <Icon as={getStatusIcon(patient.status)} mr={1} />
                      {patient.status === 'danger'
                        ? 'Critical'
                        : patient.status === 'warning'
                        ? 'Warning'
                        : 'Normal'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      as={RouterLink}
                      to={`/dm/patient/${patient._id}`}
                      colorScheme="teal"
                      size="sm"
                      rightIcon={<FiArrowRight />}
                    >
                      View Details
                    </Button>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={6} textAlign="center" py={6}>
                  <Text color="gray.500">
                    {searchQuery
                      ? 'No patients match your search criteria'
                      : 'No patients assigned to you yet'}
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}

// Stat Card Component
const StatCard = ({ title, value, description, icon, color }) => {
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box
      p={5}
      borderRadius="lg"
      boxShadow="md"
      bg={bgColor}
      borderLeft="4px solid"
      borderLeftColor={color}
    >
      <Flex justify="space-between">
        <Box>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">
              {title}
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold">
              {value}
            </StatNumber>
            <StatHelpText m={0} fontSize="xs">
              {description}
            </StatHelpText>
          </Stat>
        </Box>
        <Flex
          align="center"
          justify="center"
          h="50px"
          w="50px"
          borderRadius="md"
          bg={`${color}15`}
        >
          <Icon as={icon} boxSize={6} color={color} />
        </Flex>
      </Flex>
    </Box>
  );
};
