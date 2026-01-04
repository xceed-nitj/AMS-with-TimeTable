import React from 'react';
import {
  Box,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiSettings,
  FiLayers,
  FiHome,
  FiDatabase,
} from 'react-icons/fi';

const PlatformSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('blue.50', 'blue.900');
  const activeBg = useColorModeValue('blue.100', 'blue.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const activeTextColor = useColorModeValue('blue.600', 'blue.200');

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/platform',
      icon: FiHome,
      description: 'Platform Overview',
    },
    {
      name: 'Platform Configuration',
      path: '/platform/config',
      icon: FiSettings,
      description: 'Roles & Settings',
    },
    {
      name: 'Module Management',
      path: '/platform/modules',
      icon: FiLayers,
      description: 'Add & Manage Modules',
    },
    {
      name: 'Data Management',
      path: '/platform/data',
      icon: FiDatabase,
      description: 'View All Data',
    },
  ];

  const isActive = (path) => {
    if (path === '/platform') {
      return location.pathname === '/platform';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      w="280px"
      minH="calc(100vh - 64px)"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      py={6}
      px={4}
      position="sticky"
      top="64px"
      overflowY="auto"
    >
      <VStack align="stretch" spacing={2}>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="gray.500"
          textTransform="uppercase"
          mb={2}
          px={3}
        >
          Platform Modules
        </Text>

        {menuItems.map((item) => (
          <Box
            key={item.path}
            onClick={() => navigate(item.path)}
            cursor="pointer"
            px={3}
            py={3}
            borderRadius="md"
            bg={isActive(item.path) ? activeBg : 'transparent'}
            color={isActive(item.path) ? activeTextColor : textColor}
            _hover={{
              bg: isActive(item.path) ? activeBg : hoverBg,
              transform: 'translateX(2px)',
            }}
            transition="all 0.2s"
          >
            <Flex align="center" gap={3}>
              <Icon
                as={item.icon}
                boxSize={5}
                color={isActive(item.path) ? activeTextColor : 'gray.500'}
              />
              <Box flex="1">
                <Text
                  fontSize="sm"
                  fontWeight={isActive(item.path) ? 'semibold' : 'medium'}
                >
                  {item.name}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={0.5}>
                  {item.description}
                </Text>
              </Box>
            </Flex>
          </Box>
        ))}

        <Divider my={4} />

        <Box px={3} py={2}>
          <Text fontSize="xs" color="gray.500">
            Platform Management System
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Version 1.0.0
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default PlatformSidebar;
