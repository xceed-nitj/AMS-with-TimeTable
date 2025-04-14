import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginPatient } from '../api/patientApi';
import { loginDoctor } from '../api/doctorApi';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';

export default function LoginPage() {
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginPatient({
        email: patientEmail,
        password: patientPassword,
      });

      // Store patient ID in localStorage
      localStorage.setItem('patientId', response.patient._id);
      localStorage.setItem('patientName', response.patient.name);
      localStorage.setItem('role', 'patient');

      toast({
        title: 'Login successful',
        description: 'Welcome to your dashboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirect to patient dashboard
      navigate('/dm/patient/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginDoctor({
        email: doctorEmail,
        password: doctorPassword,
      });

      // Store doctor ID and other info in localStorage
      localStorage.setItem('doctorId', response.doctor._id);
      localStorage.setItem('doctorName', response.doctor.name);
      localStorage.setItem('role', 'doctor');

      toast({
        title: 'Login successful',
        description: 'Welcome to your dashboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirect to doctor dashboard
      navigate('/dm/doctor/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Admin credentials validation (hardcoded for now, should be replaced with backend validation)
    const adminCredentials = {
      email: 'admin@diabetes.com',
      password: 'admin123',
    };

    if (
      adminEmail === adminCredentials.email &&
      adminPassword === adminCredentials.password
    ) {
      // Store admin role in localStorage
      localStorage.setItem('role', 'admin');
      localStorage.setItem('adminName', 'Admin');

      toast({
        title: 'Admin login successful',
        description: 'Welcome to the admin dashboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirect to admin dashboard
      navigate('/dm/admin/dashboard');
    } else {
      toast({
        title: 'Admin login failed',
        description: 'Invalid admin credentials',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    setLoading(false);
  };

  return (
    <Container maxW="container.md" py={12}>
      <Flex direction="column" align="center" mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          Diabetics Management System
        </Heading>
        <Text color="gray.600" textAlign="center">
          Monitor, track, and manage diabetes care with ease
        </Text>
      </Flex>

      <Box
        p={8}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="lg"
        bg={bgColor}
      >
        <Tabs isFitted variant="enclosed" colorScheme="cyan">
          <TabList mb="1em">
            <Tab>Patient Login</Tab>
            <Tab>Doctor Login</Tab>
            <Tab>Admin Login</Tab>
          </TabList>

          <TabPanels>
            {/* Patient Login Panel */}
            <TabPanel>
              <form onSubmit={handlePatientLogin}>
                <Stack spacing={4}>
                  <FormControl id="patient-email" isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </FormControl>

                  <FormControl id="patient-password" isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={patientPassword}
                      onChange={(e) => setPatientPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="teal"
                    size="lg"
                    fontSize="md"
                    isLoading={loading}
                  >
                    Sign in as Patient
                  </Button>
                </Stack>
              </form>
            </TabPanel>

            {/* Doctor Login Panel */}
            <TabPanel>
              <form onSubmit={handleDoctorLogin}>
                <Stack spacing={4}>
                  <FormControl id="doctor-email" isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={doctorEmail}
                      onChange={(e) => setDoctorEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </FormControl>

                  <FormControl id="doctor-password" isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={doctorPassword}
                      onChange={(e) => setDoctorPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    fontSize="md"
                    isLoading={loading}
                  >
                    Sign in as Doctor
                  </Button>
                </Stack>
              </form>
            </TabPanel>

            {/* Admin Login Panel */}
            <TabPanel>
              <form onSubmit={handleAdminLogin}>
                <Stack spacing={4}>
                  <FormControl id="admin-email" isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Enter admin email"
                    />
                  </FormControl>

                  <FormControl id="admin-password" isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="purple"
                    size="lg"
                    fontSize="md"
                    isLoading={loading}
                  >
                    Sign in as Admin
                  </Button>
                </Stack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}
