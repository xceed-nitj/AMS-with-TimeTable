import React from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Text,
  VStack,
  Container,
  Badge,
} from '@chakra-ui/react';
import { FiSettings, FiLayers, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const PlatformDashboard = () => {
  const navigate = useNavigate();

  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'gray.900');
  const bgCard = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  const cards = [
    {
      title: 'Platform Configuration',
      description: 'Manage roles and exempted links for the platform',
      icon: FiSettings,
      color: 'blue',
      gradient: 'linear(to-br, blue.500, blue.600)',
      path: '/platform/config'
    },
    {
      title: 'Module Contributors',
      description: 'Add and manage platform modules with contributors',
      icon: FiLayers,
      color: 'purple',
      gradient: 'linear(to-br, purple.500, purple.600)',
      path: '/platform/modules'
    },
    {
      title: 'User Registration',
      description: 'View all platform configurations and user data',
      icon: FiUserPlus,
      color: 'pink',
      gradient: 'linear(to-br, pink.500, pink.600)',
      path: '/platform/data'
    }
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

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
          <VStack spacing={3} align="center" textAlign="center">
            <Badge colorScheme="whiteAlpha" fontSize="sm" px={3} py={1} borderRadius="full">
              Platform Dashboard
            </Badge>
            <Heading size="2xl" color="white" fontWeight="bold">
              Platform Management Center
            </Heading>
            <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
              Select an option below to manage your platform
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {cards.map((card, index) => (
            <Card
              key={index}
              bg={bgCard}
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor={borderColor}
              overflow="hidden"
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => handleCardClick(card.path)}
              _hover={{ 
                transform: 'translateY(-8px)', 
                shadow: '3xl',
                borderColor: `${card.color}.400`
              }}
            >
              <CardBody p={8}>
                <VStack spacing={6} align="start">
                  <Box
                    bgGradient={card.gradient}
                    p={4}
                    borderRadius="xl"
                    display="inline-block"
                  >
                    <Icon as={card.icon} boxSize={10} color="white" />
                  </Box>
                  
                  <VStack spacing={2} align="start">
                    <Heading size="lg" color="gray.800">
                      {card.title}
                    </Heading>
                    <Text color="gray.600" fontSize="md">
                      {card.description}
                    </Text>
                  </VStack>

                  <Badge 
                    colorScheme={card.color} 
                    fontSize="sm" 
                    px={3} 
                    py={1} 
                    borderRadius="full"
                  >
                    Click to access
                  </Badge>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default PlatformDashboard;
