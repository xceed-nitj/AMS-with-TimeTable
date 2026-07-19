import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiFileText,
  FiHeart,
  FiMic,
  FiShield,
  FiUser,
  FiUserCheck,
} from 'react-icons/fi';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

const ROLE_META = {
  ITTC: {
    name: 'Institute Time Table Coordinator',
    link: '/tt/admin',
    description: 'Manage institute-wide timetables',
    icon: FiCalendar,
    accent: 'blue',
  },
  DTTI: {
    name: 'Department Time Table Coordinator',
    link: '/tt/dashboard',
    description: 'Manage department timetables',
    icon: FiCalendar,
    accent: 'blue',
  },
  CM: {
    name: 'Event Certificate Manager',
    link: '/cm/dashboard',
    description: 'Create and manage certificates',
    icon: FiAward,
    accent: 'green',
  },
  admin: {
    name: 'XCEED Super User',
    link: '/superadmin',
    description: 'Full system administration',
    icon: FiShield,
    accent: 'red',
  },
  EO: {
    name: 'Event Organiser',
    link: '/cf/dashboard',
    description: 'Organize and manage events',
    icon: FiMic,
    accent: 'purple',
  },
  editor: {
    name: 'Paper Review Management',
    link: '/prm/dashboard',
    description: 'Manage paper reviews',
    icon: FiFileText,
    accent: 'orange',
  },
  PRM: {
    name: 'PRM',
    link: '/prm/home',
    description: 'Paper Review Management',
    icon: FiFileText,
    accent: 'orange',
  },
  FACULTY: {
    name: 'Faculty',
    link: '/prm/home',
    description: 'Faculty dashboard',
    icon: FiUser,
    accent: 'orange',
  },
  doctor: {
    name: 'Diabetics Module Doctor',
    link: '/dm/doctor/dashboard',
    description: 'Patient management',
    icon: FiHeart,
    accent: 'pink',
  },
  patient: {
    name: 'Diabetics Module Patient',
    link: '/dm/patient/dashboard',
    description: 'Track your health',
    icon: FiHeart,
    accent: 'pink',
  },
  'dm-admin': {
    name: 'Diabetics Module Admin',
    link: '/dm/admin/dashboard',
    description: 'Manage diabetics module',
    icon: FiActivity,
    accent: 'pink',
  },
  'iams-admin': {
    name: 'IAMS Admin',
    link: '/iams-admin',
    description: 'Manage face recognition attendance system',
    icon: FiUserCheck,
    accent: 'cyan',
  },
  'iams-dept-admin': {
    name: 'IAMS Department Admin',
    link: '/dept-admin/dashboard',
    description: 'Department-level attendance management',
    icon: FiUserCheck,
    accent: 'cyan',
  },
};

const roleMeta = (role) =>
  ROLE_META[role] || {
    name: role,
    link: '#',
    description: 'Access your dashboard',
    icon: FiUser,
    accent: 'gray',
  };

// Roles that map to 'editor' historically appear with either casing.
const singleRoleTarget = (role, user) => {
  if (user?.name?.toLowerCase() === 'coe@nitj.ac.in') return '/tt/coe/facultyload';
  if (role === 'Editor') return ROLE_META.editor.link;
  return roleMeta(role).link;
};

const RoleCard = ({ role, onOpen }) => {
  const { name, description, icon, accent } = roleMeta(role);
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const iconBg = useColorModeValue(`${accent}.50`, `${accent}.900`);
  const iconColor = useColorModeValue(`${accent}.600`, `${accent}.300`);
  const hoverBorder = useColorModeValue(`${accent}.400`, `${accent}.500`);

  return (
    <Box
      as="button"
      textAlign="left"
      onClick={onOpen}
      role="group"
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      p={6}
      display="flex"
      flexDirection="column"
      gap={4}
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
        borderColor: hoverBorder,
      }}
      _focusVisible={{ boxShadow: 'outline' }}
    >
      <Flex align="center" justify="space-between" w="full">
        <Flex align="center" justify="center" boxSize={12} borderRadius="lg" bg={iconBg} color={iconColor}>
          <Icon as={icon} boxSize={6} />
        </Flex>
        <Icon
          as={FiArrowRight}
          boxSize={5}
          color={iconColor}
          opacity={0}
          transform="translateX(-6px)"
          transition="all 0.2s ease"
          _groupHover={{ opacity: 1, transform: 'translateX(0)' }}
        />
      </Flex>
      <Box>
        <Heading as="h3" size="md" mb={1}>
          {name}
        </Heading>
        <Text fontSize="sm" color={descColor}>
          {description}
        </Text>
      </Box>
    </Box>
  );
};

const AllocatedRolesPage = () => {
  const navigate = useNavigate();
  const [allocatedRoles, setAllocatedRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const subColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${apiUrl}/user/getuser`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch allocated roles');
        const userdetails = await response.json();
        const excludedRoles = ['Reviewer', 'Author'];
        setAllocatedRoles(
          (userdetails.user.role || []).filter((role) => !excludedRoles.includes(role)),
        );
        setUser(userdetails.user);
      } catch (error) {
        console.error('Error fetching allocated roles:', error.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Single-role users skip the picker and land on their dashboard directly.
  useEffect(() => {
    if (!isLoading && allocatedRoles.length === 1 && user) {
      const target = singleRoleTarget(allocatedRoles[0], user);
      if (target !== '#') navigate(target);
    }
  }, [isLoading, allocatedRoles, user, navigate]);

  if (isLoading) {
    return (
      <Flex bg={pageBg} minH="100vh" align="center" justify="center">
        <Spinner size="lg" />
      </Flex>
    );
  }

  const email = Array.isArray(user?.email) ? user.email[0] : user?.email;

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 8, md: 14 }}>
      <Container maxW="5xl">
        <Box mb={{ base: 8, md: 12 }} textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            Welcome{email ? `, ${email}` : ''}
          </Heading>
          <Text color={subColor} fontSize={{ base: 'md', md: 'lg' }}>
            {allocatedRoles.length
              ? `You have ${allocatedRoles.length} role${allocatedRoles.length === 1 ? '' : 's'} — select one to open its dashboard.`
              : 'No roles have been assigned to your account yet. Contact your administrator.'}
          </Text>
        </Box>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
          {allocatedRoles.map((role) => (
            <RoleCard
              key={role}
              role={role}
              onOpen={() => navigate(singleRoleTarget(role, user))}
            />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default AllocatedRolesPage;
