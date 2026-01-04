import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Flex,
  Text,
  VStack,
  Spinner,
  Center,
  useToast,
  Container,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { FiUsers, FiLayers, FiSettings, FiDatabase } from 'react-icons/fi';
import getEnvironment from '../getenvironment';

const PlatformDashboard = () => {
  const [platformData, setPlatformData] = useState(null);
  const [moduleData, setModuleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const apiUrl = getEnvironment();

  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'gray.900');
  const bgCard = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [platformResponse, moduleResponse] = await Promise.all([
        axios.get(`${apiUrl}/platform/getplatform`),
        axios.get(`${apiUrl}/platform/getmodule`),
      ]);

      if (platformResponse.data.length > 0) {
        setPlatformData(platformResponse.data[0]);
      }
      setModuleData(moduleResponse.data);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Failed to fetch dashboard data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  const stats = [
    {
      label: 'Total Roles',
      value: platformData?.roles?.length || 0,
      icon: FiUsers,
      color: 'blue',
      helpText: 'Active platform roles',
    },
    {
      label: 'Modules',
      value: moduleData?.length || 0,
      icon: FiLayers,
      color: 'purple',
      helpText: 'Total modules',
    },
    {
      label: 'Exempted Links',
      value: platformData?.exemptedLinks?.length || 0,
      icon: FiSettings,
      color: 'orange',
      helpText: 'Public access links',
    },
  ];

  return (
    <Box bgGradient={bgGradient} minH="100vh" pb={16}>
      <Box 
        bgGradient="linear(to-r, purple.600, blue.600, teal.500)"
        pt={8}
        pb={20}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.1"
          bgImage="radial-gradient(circle, white 1px, transparent 1px)"
          bgSize="30px 30px"
        />
        <Container maxW="7xl" position="relative">
          <VStack spacing={3} align="start">
            <Badge colorScheme="whiteAlpha" fontSize="sm" px={3} py={1} borderRadius="full">
              Platform Dashboard
            </Badge>
            <Heading size="2xl" color="white" fontWeight="bold">
              Platform Management Center
            </Heading>
            <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
              Overview of your platform configuration and modules
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1}>
        <Box 
          bg={bgCard}
          borderRadius="2xl"
          shadow="2xl"
          p={8}
          mb={8}
          border="1px"
          borderColor={borderColor}
        >
          <HStack justify="space-between" mb={6}>
            <VStack align="start" spacing={1}>
              <Heading size="lg" bgGradient="linear(to-r, purple.600, blue.600)" bgClip="text">
                Platform Statistics
              </Heading>
              <Text color="gray.600" fontSize="sm">Key metrics and overview</Text>
            </VStack>
            <Badge colorScheme="purple" fontSize="md" px={3} py={2} borderRadius="lg">
              {stats.length} Metrics
            </Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            {stats.map((stat, index) => (
              <Box
                key={index}
                bgGradient={`linear(to-br, ${stat.color}.600, ${stat.color}.800)`}
                p={6}
                borderRadius="xl"
                transition="all 0.3s"
                cursor="pointer"
                border="2px solid"
                borderColor="whiteAlpha.300"
                shadow="lg"
                _hover={{ transform: 'translateY(-8px)', shadow: '2xl' }}
              >
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Box bg="whiteAlpha.400" p={3} borderRadius="lg" border="2px solid" borderColor="whiteAlpha.500">
                      <Icon as={stat.icon} boxSize={6} color="white" />
                    </Box>
                    <Text fontSize="4xl" fontWeight="bold" color="white" textShadow="0 2px 10px rgba(0,0,0,0.6)">
                      {stat.value}
                    </Text>
                  </HStack>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="bold" fontSize="lg" textShadow="0 2px 10px rgba(0,0,0,0.6)">
                      {stat.label}
                    </Text>
                    <Text color="whiteAlpha.900" fontSize="sm">
                      {stat.helpText}
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          {platformData && (
            <VStack align="stretch" spacing={6} mb={8}>
              <Heading size="md" color="gray.700">Active Roles</Heading>
              <Box bg="gray.50" p={6} borderRadius="xl" border="1px" borderColor={borderColor}>
                <Flex wrap="wrap" gap={3}>
                  {platformData.roles?.map((role, index) => (
                    <Badge
                      key={index}
                      px={4}
                      py={2}
                      bg="blue.500"
                      color="white"
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="semibold"
                      textTransform="capitalize"
                      boxShadow="md"
                    >
                      {role}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </VStack>
          )}

          {moduleData.length > 0 && (
            <VStack align="stretch" spacing={6}>
              <Heading size="md" color="gray.700">Recent Modules</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {moduleData.slice(0, 6).map((module, index) => (
                  <Box
                    key={index}
                    bg="white"
                    p={5}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor={borderColor}
                    _hover={{ borderColor: 'purple.400', shadow: 'lg', transform: 'translateY(-4px)' }}
                    transition="all 0.3s"
                  >
                    <VStack align="start" spacing={2}>
                      <Badge colorScheme="purple" fontSize="xs">{module.yearLaunched}</Badge>
                      <Text fontWeight="bold" fontSize="md" color="gray.800">
                        {module.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={3}>
                        {module.description}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default PlatformDashboard;
