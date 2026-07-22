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
    name: 'iLEED Admin',
    link: '/iams-admin',
    description: 'Manage face recognition attendance system',
    icon: FiUserCheck,
    accent: 'cyan',
  },
  'iams-dept-admin': {
    name: 'iLEED Department Admin',
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

const RoleItem = ({ role, index, onOpen }) => {
  const { name, description, accent } = roleMeta(role);
  const cardBg = useColorModeValue(`${accent}.50`, `${accent}.900`);
  const cardBorder = useColorModeValue(`${accent}.100`, `${accent}.700`);
  const hoverBg = useColorModeValue(`${accent}.100`, `${accent}.800`);
  const hoverBorder = useColorModeValue(`${accent}.400`, `${accent}.500`);
  const descColor = useColorModeValue('gray.600', 'gray.300');
  const nameColor = useColorModeValue('gray.800', 'white');
  const numColor = useColorModeValue(`${accent}.500`, `${accent}.300`);

  return (
    <Flex
      as="button"
      onClick={onOpen}
      role="group"
      direction="column"
      textAlign="left"
      h="full"
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="2xl"
      p={{ base: 5, md: 6 }}
      transition="all 0.2s ease"
      _hover={{
        bg: hoverBg,
        borderColor: hoverBorder,
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
      }}
      _focusVisible={{ boxShadow: 'outline' }}
    >
      <Flex align="center" justify="space-between" w="full" mb={{ base: 4, md: 5 }}>
        <Text
          fontSize={{ base: '3xl', md: '4xl' }}
          fontWeight="extrabold"
          fontFamily="mono"
          lineHeight="1"
          color={numColor}
        >
          {String(index + 1).padStart(2, '0')}
        </Text>
        <Box
          as="span"
          aria-hidden="true"
          fontSize={{ base: '2xl', md: '3xl' }}
          lineHeight="1"
          color={numColor}
          opacity={0}
          transform="translateX(-10px)"
          transition="all 0.2s ease"
          _groupHover={{ opacity: 1, transform: 'translateX(0)' }}
        >
          &rarr;
        </Box>
      </Flex>
      <Heading
        as="h3"
        fontSize={{ base: 'lg', md: 'xl' }}
        lineHeight="1.3"
        mb={2}
        color={nameColor}
      >
        {name}
      </Heading>
      <Text fontSize={{ base: 'sm', md: 'md' }} color={descColor} lineHeight="1.5">
        {description}
      </Text>
    </Flex>
  );
};

const AllocatedRolesPage = () => {
  const navigate = useNavigate();
  const [allocatedRoles, setAllocatedRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const subColor = useColorModeValue('gray.500', 'gray.400');
  const emptyCardBg = useColorModeValue('white', 'gray.800');
  const emptyCardBorder = useColorModeValue('gray.100', 'gray.700');
  const labelColor = useColorModeValue('gray.400', 'gray.500');
  const emptyIconBg = useColorModeValue('gray.100', 'gray.700');

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
  const displayName = user?.name || email || 'there';
  const roleCount = allocatedRoles.length;

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 8, md: 16 }}>
      <Container maxW="5xl">
        {/* Header */}
        <Box mb={{ base: 8, md: 12 }}>
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="bold"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color={labelColor}
            mb={2}
          >
            Welcome back
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: 'xl', md: '3xl' }}
            lineHeight="1.2"
            letterSpacing="-0.01em"
            wordBreak="break-word"
          >
            {email || displayName}
          </Heading>
          <Text color={subColor} fontSize={{ base: 'md', md: 'lg' }} mt={3}>
            {roleCount
              ? `Choose a workspace to continue — you have ${roleCount} ${roleCount === 1 ? 'role' : 'roles'}.`
              : 'No roles have been assigned to your account yet.'}
          </Text>
        </Box>

        {roleCount ? (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
            {allocatedRoles.map((role, index) => (
              <RoleItem
                key={role}
                role={role}
                index={index}
                onOpen={() => navigate(singleRoleTarget(role, user))}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Flex
            direction="column"
            align="center"
            textAlign="center"
            bg={emptyCardBg}
            borderWidth="1px"
            borderColor={emptyCardBorder}
            borderRadius="2xl"
            py={{ base: 12, md: 16 }}
            px={6}
          >
            <Flex
              align="center"
              justify="center"
              boxSize={16}
              borderRadius="full"
              bg={emptyIconBg}
              color={subColor}
              mb={4}
            >
              <Icon as={FiUser} boxSize={8} />
            </Flex>
            <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }} mb={2}>
              No roles assigned yet
            </Heading>
            <Text color={subColor} fontSize={{ base: 'sm', md: 'md' }} maxW="sm">
              Your account doesn&apos;t have any roles yet. Please contact your administrator to get access.
            </Text>
          </Flex>
        )}
      </Container>
    </Box>
  );
};

export default AllocatedRolesPage;
