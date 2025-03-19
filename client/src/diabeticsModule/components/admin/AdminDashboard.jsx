import {
  Box,
  Button,
  chakra,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import {
  BuildingOfficeIcon,
  ChartBarIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../../getenvironment';

// Create an axios instance with the base URL
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    patientsCount: 0,
    doctorsCount: 0,
    hospitalsCount: 0,
    readingsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      // These endpoints would need to be implemented on the backend
      const [patientsRes, doctorsRes, hospitalsRes, readingsRes] =
        await Promise.all([
          axiosInstance.get('/diabeticsModule/patient/count'),
          axiosInstance.get('/diabeticsModule/doctor/count'),
          axiosInstance.get('/diabeticsModule/hospital/count'),
          axiosInstance.get('/diabeticsModule/dailyDosage/count'),
        ]);

      setStats({
        patientsCount: patientsRes.data.count || 0,
        doctorsCount: doctorsRes.data.count || 0,
        hospitalsCount: hospitalsRes.data.count || 0,
        readingsCount: readingsRes.data.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error fetching data',
        description: 'Unable to load dashboard statistics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Use mock data when API fails
      // setStats({
      //   patientsCount: 28,
      //   doctorsCount: 12,
      //   hospitalsCount: 4,
      //   readingsCount: 348,
      // });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axiosInstance.get('/diabeticsModule/patient/all');
      setPatients(res.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: 'Error',
        description: 'Unable to load patients data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axiosInstance.get('/diabeticsModule/doctor/all');
      setDoctors(res.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: 'Unable to load doctors data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await axiosInstance.get('/diabeticsModule/hospital/all');
      setHospitals(res.data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast({
        title: 'Error',
        description: 'Unable to load hospitals data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPatients();
    fetchDoctors();
    fetchHospitals();
  }, []);

  const bg = useColorModeValue('white', 'gray.800');
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
      <Heading mb={6}>Diabetics Module Admin Dashboard</Heading>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        <StatCard
          icon={UsersIcon}
          title="Total Patients"
          stat={stats.patientsCount}
          helpText="Registered in the system"
          accentColor="teal.500"
        />
        <StatCard
          icon={UserPlusIcon}
          title="Total Doctors"
          stat={stats.doctorsCount}
          helpText="Active practitioners"
          accentColor="blue.500"
        />
        <StatCard
          icon={BuildingOfficeIcon}
          title="Total Hospitals"
          stat={stats.hospitalsCount}
          helpText="Partnered facilities"
          accentColor="purple.500"
        />
        <StatCard
          icon={ChartBarIcon}
          title="Total Readings"
          stat={stats.readingsCount}
          helpText="Patient health metrics"
          accentColor="orange.500"
        />
      </SimpleGrid>

      <Flex justify="space-between" mb={4}>
        <Heading size="md">Manage Users & Facilities</Heading>
        <Flex gap={2}>
          <Button
            as={RouterLink}
            to="/dm/addPatient"
            colorScheme="teal"
            size="sm"
          >
            Add Patient
          </Button>
          <Button
            as={RouterLink}
            to="/dm/addDoctor"
            colorScheme="blue"
            size="sm"
          >
            Add Doctor
          </Button>
          <Button
            as={RouterLink}
            to="/dm/addHospital"
            colorScheme="purple"
            size="sm"
          >
            Add Hospital
          </Button>
        </Flex>
      </Flex>

      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" mt={6} bg={bg}>
        <Tabs isFitted variant="enclosed">
          <TabList>
            <Tab>Patients</Tab>
            <Tab>Doctors</Tab>
            <Tab>Hospitals</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <DataList
                items={patients}
                fields={['name', 'age', 'contactNumber', 'hospital']}
                headers={['Name', 'Age', 'Contact', 'Hospital']}
                emptyText="No patients registered yet"
                type="patients"
              />
            </TabPanel>
            <TabPanel>
              <DataList
                items={doctors}
                fields={['name', 'age', 'contactNumber', 'hospital']}
                headers={['Name', 'Age', 'Contact', 'Hospital']}
                emptyText="No doctors registered yet"
                type="doctors"
              />
            </TabPanel>
            <TabPanel>
              <DataList
                items={hospitals}
                fields={['name', 'location', 'phone']}
                headers={['Name', 'Location', 'Phone']}
                emptyText="No hospitals registered yet"
                type="hospitals"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

const StatCard = ({ title, stat, helpText, icon, accentColor }) => {
  const bg = useColorModeValue('white', 'gray.700');

  return (
    <Box
      bg={bg}
      p={6}
      borderRadius="lg"
      boxShadow="md"
      borderLeft="4px solid"
      borderLeftColor={accentColor}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Box>
          <Stat>
            <StatLabel color="gray.500" fontSize="sm">
              {title}
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold">
              {stat}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.500">
              {helpText}
            </StatHelpText>
          </Stat>
        </Box>
        <Icon as={icon} boxSize={8} color={accentColor} opacity={0.8} />
      </Flex>
    </Box>
  );
};

const DataList = ({ items, fields, headers, emptyText, type }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return (
      <Text p={4} color="gray.500" textAlign="center">
        {emptyText}
      </Text>
    );
  }

  const handleView = (id) => {
    switch (type) {
      case 'patients':
        navigate(`/dm/patient/${id}`);
        break;
      case 'doctors':
        navigate(`/dm/doctor/${id}`);
        break;
      case 'hospitals':
        navigate(`/dm/hospital/${id}`);
        break;
      default:
        break;
    }
  };

  return (
    <Box overflowX="auto">
      <chakra.table w="full">
        <chakra.thead>
          <chakra.tr>
            {headers.map((header, i) => (
              <chakra.th
                key={i}
                px={4}
                py={2}
                borderBottom="1px"
                borderColor={borderColor}
                textAlign="left"
                fontSize="sm"
                fontWeight="semibold"
              >
                {header}
              </chakra.th>
            ))}
            <chakra.th width="80px"></chakra.th>
          </chakra.tr>
        </chakra.thead>
        <chakra.tbody>
          {items.map((item, i) => (
            <chakra.tr key={i}>
              {fields.map((field, j) => (
                <chakra.td
                  key={`${i}-${j}`}
                  px={4}
                  py={3}
                  borderBottom="1px"
                  borderColor={borderColor}
                  fontSize="sm"
                >
                  {item[field]}
                </chakra.td>
              ))}
              <chakra.td
                px={2}
                py={2}
                borderBottom="1px"
                borderColor={borderColor}
                textAlign="right"
              >
                <Button
                  size="xs"
                  colorScheme="blue"
                  variant="ghost"
                  onClick={() => handleView(item._id)}
                >
                  View
                </Button>
              </chakra.td>
            </chakra.tr>
          ))}
        </chakra.tbody>
      </chakra.table>
    </Box>
  );
};
