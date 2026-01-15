import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Container,
  Box,
  Text,
  VStack,
  Spinner,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Button,
  Badge,
  Flex,
  Link as ChakraLink,
} from '@chakra-ui/react';
import getEnvironment from '../getenvironment';
import { Navigate, useNavigate } from 'react-router-dom';
const apiUrl = getEnvironment();

const AllocatedRolesPage = () => {
  const navigate = useNavigate();
  const [allocatedRoles, setAllocatedRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState('');

  useEffect(() => {
    const fetchAllocatedRoles = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/getuser`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch allocated roles');
        }

        const userdetails = await response.json();
        console.log('Fetched user details:', userdetails); // Log the fetched data
        const excludedRoles = ['Reviewer', 'Author'];
        setAllocatedRoles(
          userdetails.user.role.filter((role) => !excludedRoles.includes(role))
        ); // Filter out empty roles
        setUser(userdetails.user);
      } catch (error) {
        console.error('Error fetching allocated roles:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllocatedRoles();
  }, []);

  if (isLoading) {
    return <Spinner />;
  }
  if (allocatedRoles.length === 1 && user) {
     const email = user.name?.toLowerCase();
    if (email === 'coe@nitj.ac.in') {
      console.log('Navigating to COE faculty load page for user:', email);
    navigate('/tt/coe/facultyload');
    return null;
  }
    switch (allocatedRoles[0]) {
      case 'ITTC':
        navigate('/tt/admin');
        break;
      case 'DTTI':
        navigate('/tt/dashboard');
        break;
      case 'CM':
        navigate('/cm/dashboard');
        break;
      case 'admin':
        navigate('/superadmin');
        break;
      case 'EO':
        navigate('/cf/dashboard');
        break;
      case 'Editor':
      case 'editor':
        navigate('/prm/dashboard');
        break;
      case 'PRM':
      case 'FACULTY':
        navigate('/prm/home');
        break;
      case 'doctor':
        navigate('/dm/doctor/dashboard');
        break;
      case 'patient':
        navigate('/dm/patient/dashboard');
        break;
      case 'dm-admin':
        navigate('/dm/admin/dashboard');
        break;
      default:
        return 'some unknown role! If it is a new role, add it in the cases';
    }
  }
  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={8}>
        <Box p={4}>
          {isLoading ? (
            <Spinner />
          ) : (
            <VStack spacing={6} align="stretch">
              {user && (
                <Box textAlign="center" mb={4}>
                  <Heading size="lg" mb={2}>Welcome, {user.email}!</Heading>
                  <Text color="gray.600" fontSize="md">Select a role to access your dashboard</Text>
                </Box>
              )}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {allocatedRoles.map((role, index) => {
                  // Define role details
                  let roleName = '';
                  let roleLink = '';
                  let roleDescription = '';
                  let roleColor = 'teal';

                  switch(role) {
                    case 'ITTC':
                      roleName = 'Institute Time Table Coordinator';
                      roleLink = '/tt/admin';
                      roleDescription = 'Manage institute-wide timetables';
                      roleColor = 'blue';
                      break;
                    case 'DTTI':
                      roleName = 'Department Time Table Coordinator';
                      roleLink = '/tt/dashboard';
                      roleDescription = 'Manage department timetables';
                      roleColor = 'blue';
                      break;
                    case 'CM':
                      roleName = 'Event Certificate Manager';
                      roleLink = '/cm/dashboard';
                      roleDescription = 'Create and manage certificates';
                      roleColor = 'blue';
                      break;
                    case 'admin':
                      roleName = 'XCEED Super User';
                      roleLink = '/superadmin';
                      roleDescription = 'Full system administration';
                      roleColor = 'blue';
                      break;
                    case 'EO':
                      roleName = 'Event Organiser';
                      roleLink = '/cf/dashboard';
                      roleDescription = 'Organize and manage events';
                      roleColor = 'blue';
                      break;
                    case 'editor':
                      roleName = 'Paper Review Management';
                      roleLink = '/prm/dashboard';
                      roleDescription = 'Manage paper reviews';
                      roleColor = 'blue';
                      break;
                    case 'PRM':
                      roleName = 'PRM';
                      roleLink = '/prm/home';
                      roleDescription = 'Paper Review Management';
                      roleColor = 'blue';
                      break;
                    case 'FACULTY':
                      roleName = 'Faculty';
                      roleLink = '/prm/home';
                      roleDescription = 'Faculty dashboard';
                      roleColor = 'blue';
                      break;
                    case 'doctor':
                      roleName = 'Diabetics Module Doctor';
                      roleLink = '/dm/doctor/dashboard';
                      roleDescription = 'Patient management';
                      roleColor = 'blue';
                      break;
                    case 'patient':
                      roleName = 'Diabetics Module Patient';
                      roleLink = '/dm/patient/dashboard';
                      roleDescription = 'Track your health';
                      roleColor = 'blue';
                      break;
                    case 'dm-admin':
                      roleName = 'Diabetics Module Admin';
                      roleLink = '/dm/admin/dashboard';
                      roleDescription = 'Manage diabetics module';
                      roleColor = 'blue';
                      break;
                    default:
                      roleName = role;
                      roleLink = '#';
                      roleDescription = 'Access your dashboard';
                      roleColor = 'blue';
                  }

                  return (
                    <Card 
                      key={index}
                      variant="elevated"
                      size="md"
                      _hover={{
                        transform: 'translateY(-4px)',
                        shadow: 'xl',
                        transition: 'all 0.3s ease',
                      }}
                      transition="all 0.2s ease"
                    >
                      <CardHeader pb={2}>
                        <Flex justifyContent="space-between" alignItems="center">
                          <Badge colorScheme={roleColor} fontSize="sm" px={3} py={1} borderRadius="full">
                            Role #{index + 1}
                          </Badge>
                        </Flex>
                      </CardHeader>
                      <CardBody py={3}>
                        <Heading size="md" mb={2} color={`${roleColor}.600`}>
                          {roleName}
                        </Heading>
                        <Text color="gray.600" fontSize="sm">
                          {roleDescription}
                        </Text>
                      </CardBody>
                      <CardFooter pt={0}>
                        <Button
                          as={ChakraLink}
                          href={roleLink}
                          colorScheme={roleColor}
                          width="full"
                          _hover={{ textDecoration: 'none' }}
                        >
                          Access Dashboard
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </VStack>
          )}
        </Box>
      </Container>
    </ChakraProvider>
  );
};

export default AllocatedRolesPage;
