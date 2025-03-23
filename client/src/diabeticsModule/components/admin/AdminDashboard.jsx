import {
  Box,
  Button,
  chakra,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Link, Link as RouterLink, useNavigate } from 'react-router-dom';
import { getDailyDosageCount } from '../../api/dailyDosageApi';
import { getAllDoctors, getDoctorCount } from '../../api/doctorApi';
import { getAllHospitals, getHospitalCount } from '../../api/hospitalApi';
import { getAllPatients, getPatientCount } from '../../api/patientApi';
import StatCard from '../common/StatCard';

const AdminDashboard = () => {
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

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [patientsCount, doctorsCount, hospitalsCount, readingsCount] =
        await Promise.all([
          getPatientCount(),
          getDoctorCount(),
          getHospitalCount(),
          getDailyDosageCount(),
        ]);

      setStats({
        patientsCount: patientsCount.count || 0,
        doctorsCount: doctorsCount.count || 0,
        hospitalsCount: hospitalsCount.count || 0,
        readingsCount: readingsCount.count || 0,
      });
    } catch (error) {
      toast({
        title: 'Error fetching data',
        description: error.message || 'Unable to load dashboard statistics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await getAllPatients();
      setPatients(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Unable to load patients data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctors();
      setDoctors(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Unable to load doctors data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchHospitals = async () => {
    try {
      const data = await getAllHospitals();
      setHospitals(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Unable to load hospitals data',
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
          value={stats.patientsCount}
          description="Registered in the system"
          color="cyan.400"
        />
        <StatCard
          icon={UserPlusIcon}
          title="Total Doctors"
          value={stats.doctorsCount}
          description="Active practitioners"
          color="blue.400"
        />
        <StatCard
          icon={BuildingOfficeIcon}
          title="Total Hospitals"
          value={stats.hospitalsCount}
          description="Partnered facilities"
          color="teal.400"
        />
        <StatCard
          icon={ChartBarIcon}
          title="Total Readings"
          value={stats.readingsCount}
          description="Patient health metrics"
          color="cyan.400"
        />
      </SimpleGrid>

      <Flex justify="space-between" mb={4}>
        <Heading size="md">Manage Users & Facilities</Heading>
        <Flex gap={2}>
          <Button
            as={RouterLink}
            to="/dm/addPatient"
            colorScheme="cyan"
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
            colorScheme="teal"
            size="sm"
          >
            Add Hospital
          </Button>
        </Flex>
      </Flex>

      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" mt={6} bg={bg}>
        <Tabs isFitted variant="enclosed">
          <TabList>
            <Tab
              _selected={{
                color: 'cyan.800',
                bg: 'cyan.100',
                borderBottomColor: 'transparent',
              }}
            >
              Patients
            </Tab>
            <Tab
              _selected={{
                color: 'blue.800',
                bg: 'blue.100',
                borderBottomColor: 'transparent',
              }}
            >
              Doctors
            </Tab>
            <Tab
              _selected={{
                color: 'teal.800',
                bg: 'teal.100',
                borderBottomColor: 'transparent',
              }}
            >
              Hospitals
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel bg="cyan.100">
              <DataList
                items={patients}
                fields={['name', 'age', 'contactNumber', 'hospital']}
                headers={['Name', 'Age', 'Contact', 'Hospital']}
                emptyText="No patients registered yet"
                type="patients"
              />
            </TabPanel>
            <TabPanel bg="blue.100">
              <DataList
                items={doctors}
                fields={['name', 'age', 'contactNumber', 'hospital']}
                headers={['Name', 'Age', 'Contact', 'Hospital']}
                emptyText="No doctors registered yet"
                type="doctors"
              />
            </TabPanel>
            <TabPanel bg="teal.100">
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
};

export default AdminDashboard;

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
                  {field === 'hospital' ? (
                    item.hospital ? (
                      <Button size="xs" colorScheme="blue" variant="ghost">
                        <Link
                          to={`/dm/hospital/${item.hospital._id}`}
                          color="blue.500"
                        >
                          {item.hospital.name}
                        </Link>
                      </Button>
                    ) : (
                      'N/A'
                    )
                  ) : (
                    item[field]
                  )}
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
                  colorScheme="teal"
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
