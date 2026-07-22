import React from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import {
  FiCalendar,
  FiUserCheck,
  FiAward,
  FiMic,
  FiFileText,
  FiUsers,
  FiActivity,
  FiZap,
  FiArrowRight,
} from 'react-icons/fi';

const MODULES = [
  {
    title: 'Time Table Admin',
    description: 'Create and manage department timetables, semesters and slots.',
    to: '/tt/admin',
    icon: FiCalendar,
    accent: 'blue',
  },
  {
    title: 'iLEED Admin',
    description: 'Intelligent learning engagement and entity detection: cameras, ground truth and reports.',
    to: '/attendance',
    icon: FiUserCheck,
    accent: 'cyan',
  },
  {
    title: 'Certificate Management Admin',
    description: 'Design certificate templates and manage event certificates.',
    to: '/cm/addevent',
    icon: FiAward,
    accent: 'green',
  },
  {
    title: 'Conference Management Admin',
    description: 'Set up conferences, tracks and submission workflows.',
    to: '/cf/addconf',
    icon: FiMic,
    accent: 'purple',
  },
  {
    title: 'Review Management Admin',
    description: 'Assign editors and oversee the paper review pipeline.',
    to: '/prm/assigneditor',
    icon: FiFileText,
    accent: 'orange',
  },
  {
    title: 'User Management',
    description: 'Manage user accounts, roles and access permissions.',
    to: '/usermanagement',
    icon: FiUsers,
    accent: 'teal',
  },
  {
    title: 'Logs',
    description: 'Inspect platform activity and system logs.',
    to: '/platform',
    icon: FiActivity,
    accent: 'pink',
  },
  {
    title: 'XCEED',
    description: 'Open the XCEED platform tools.',
    to: '/platform',
    icon: FiZap,
    accent: 'gray',
  },
];

const ModuleCard = ({ title, description, to, icon, accent }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const iconBg = useColorModeValue(`${accent}.50`, `${accent}.900`);
  const iconColor = useColorModeValue(`${accent}.600`, `${accent}.300`);
  const hoverBorder = useColorModeValue(`${accent}.400`, `${accent}.500`);

  return (
    <Box
      as={RouterLink}
      to={to}
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
        textDecoration: 'none',
      }}
      _focusVisible={{ boxShadow: 'outline' }}
    >
      <Flex align="center" justify="space-between">
        <Flex
          align="center"
          justify="center"
          boxSize={12}
          borderRadius="lg"
          bg={iconBg}
          color={iconColor}
        >
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
          {title}
        </Heading>
        <Text fontSize="sm" color={descColor}>
          {description}
        </Text>
      </Box>
    </Box>
  );
};

const SuperAdminPage = () => {
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const subColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 8, md: 14 }}>
      <Container maxW="6xl">
        <Box mb={{ base: 8, md: 12 }} textAlign={{ base: 'left', md: 'center' }}>
          <Heading as="h1" size="xl" mb={2}>
            Super Admin
          </Heading>
          <Text color={subColor} fontSize={{ base: 'md', md: 'lg' }}>
            Manage every module of the platform from one place.
          </Text>
        </Box>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
          {MODULES.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default SuperAdminPage;
