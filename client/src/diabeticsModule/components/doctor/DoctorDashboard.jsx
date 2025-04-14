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
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { getPatientLatestDosage } from '../../api/dailyDosageApi';
import { getCurrentDoctor } from '../../api/doctorApi';
import { getPatientById } from '../../api/patientApi';
import { getStatusColor, getStatusIcon } from '../../utils/statusUtils';
import StatCard from '../common/StatCard';

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
      const data = await getCurrentDoctor();
      setDoctorInfo(data);
      fetchPatients(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load doctor profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Fetch patients assigned to this doctor
  const fetchPatients = async (doctorData) => {
    try {
      const patientsWithDetails = await Promise.all(
        doctorData.patients.map(async (patient) => {
          try {
            const latestReading = await getPatientLatestDosage(patient._id);

            let status = 'unknown';
            if (latestReading && latestReading.bloodSugar !== undefined) {
              console.log(latestReading);
              if (latestReading.bloodSugar > 180) status = 'danger';
              else if (latestReading.bloodSugar < 70) status = 'warning';
              else status = 'normal';
            }

            return {
              ...patient,
              lastReading: latestReading || null,
              status,
              hospital: doctorData.hospital,
            };
          } catch (error) {
            console.error(`Error fetching patient ${patient.name}:`, error);
            return null;
          }
        })
      );

      const validPatients = patientsWithDetails.filter(
        (patient) => patient !== null
      );
      setPatients(validPatients);

      // Calculate stats
      const critical = validPatients.filter(
        (p) => p.status === 'danger'
      ).length;
      const stable = validPatients.filter((p) => p.status === 'normal').length;
      const missing = validPatients.filter(
        (p) => p.lastReading.bloodSugar === undefined
      ).length;

      setStats({
        totalPatients: validPatients.length,
        criticalPatients: critical,
        stabilizedPatients: stable,
        missingReadings: missing,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load patients data',
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
  }, []);

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    console.log(patient);
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
        <Badge colorScheme="teal" p={2} borderRadius="md">
          {doctorInfo?.hospital?.name || 'Unknown Hospital'}
        </Badge>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          description="Under your care"
          icon={FiUsers}
          color="blue.700"
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
          color="teal.300"
        />
        <StatCard
          title="Missing Readings"
          value={stats.missingReadings}
          description="No recent data"
          icon={FiBarChart2}
          color="cyan.300"
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
                          {patient.lastReading.bloodSugar === undefined
                            ? 'No data'
                            : patient.lastReading.bloodSugar + ' mg/dL'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {patient.lastReading.bloodSugar === undefined
                            ? 'No data'
                            : `${format(
                                patient.lastReading.date,
                                'dd/MM/yyyy'
                              )} at ${patient.lastReading.time}`}
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
                          : patient.status === 'unknown'
                          ? 'gray'
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
                        : patient.status === 'unknown'
                        ? 'Unknown'
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
