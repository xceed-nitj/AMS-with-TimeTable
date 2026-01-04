import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  Text,
  useToast,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
  Center,
  Badge,
  Flex,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Image,
  Link as ChakraLink,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  HStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';

const PlatformData = () => {
  const [platformData, setPlatformData] = useState([]);
  const [moduleData, setModuleData] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const apiUrl = getEnvironment();

  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'gray.900');
  const bgCard = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [platformResponse, moduleResponse] = await Promise.all([
        axios.get(`${apiUrl}/platform/getplatform`),
        axios.get(`${apiUrl}/platform/getmodule`),
      ]);

      setPlatformData(platformResponse.data);
      setModuleData(moduleResponse.data);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Failed to fetch data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const handleViewModule = (module) => {
    setSelectedModule(module);
    onOpen();
  };

  if (loading) {
    return (
      <Box bgGradient={bgGradient} minH="100vh" pb={16}>
        <Center minH="400px">
          <Spinner size="xl" color="purple.500" thickness="4px" />
        </Center>
      </Box>
    );
  }

  return (
    <Box bgGradient={bgGradient} minH="100vh" pb={16}>
      <Box 
        bgGradient="linear(to-r, teal.600, cyan.600, blue.500)"
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
              Data Management
            </Badge>
            <Heading size="2xl" color="white" fontWeight="bold">
              View All Data
            </Heading>
            <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
              View all platform configurations and modules
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
          border="1px"
          borderColor={borderColor}
        >
          <HStack justify="space-between" mb={6}>
            <VStack align="start" spacing={1}>
              <Heading size="lg" bgGradient="linear(to-r, teal.600, cyan.600)" bgClip="text">
                Platform Data
              </Heading>
              <Text color="gray.600" fontSize="sm">Browse configurations and modules</Text>
            </VStack>
          </HStack>

          <Tabs colorScheme="teal" variant="enclosed" size="lg">
            <TabList>
              <Tab fontWeight="semibold">Platform Configuration</Tab>
              <Tab fontWeight="semibold">
                Modules ({moduleData.length})
              </Tab>
            </TabList>

            <TabPanels>
              {/* Platform Configuration Tab */}
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  {platformData.length === 0 ? (
                    <Card bg="gray.50" borderWidth="2px" borderColor={borderColor}>
                      <CardBody>
                        <Text color="gray.500" textAlign="center">
                          No platform configuration found
                        </Text>
                      </CardBody>
                  </Card>
                ) : (
                  platformData.map((platform, index) => (
                    <Card
                      key={index}
                      bg={bgCard}
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <Box>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color="gray.600"
                              mb={2}
                            >
                              Roles
                            </Text>
                            <Flex wrap="wrap" gap={2}>
                              {platform.roles?.map((role, idx) => (
                                <Badge
                                  key={idx}
                                  colorScheme="blue"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  {role}
                                </Badge>
                              ))}
                            </Flex>
                          </Box>

                          <Divider />

                          <Box>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color="gray.600"
                              mb={2}
                            >
                              Exempted Links
                            </Text>
                            <Flex wrap="wrap" gap={2}>
                              {platform.exemptedLinks?.map((link, idx) => (
                                <Badge
                                  key={idx}
                                  colorScheme="orange"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                >
                                  {link}
                                </Badge>
                              ))}
                            </Flex>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </TabPanel>

              {/* Modules Tab */}
              <TabPanel>
                {moduleData.length === 0 ? (
                  <Card bg="gray.50" borderWidth="2px" borderColor={borderColor}>
                    <CardBody>
                      <Text color="gray.500" textAlign="center">
                        No modules found
                      </Text>
                    </CardBody>
                  </Card>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {moduleData.map((module, index) => (
                      <Card
                        key={index}
                        bg="white"
                        borderWidth="2px"
                        borderColor={borderColor}
                        _hover={{ shadow: 'xl', borderColor: 'teal.400', transform: 'translateY(-4px)' }}
                        transition="all 0.3s"
                      >
                        <CardHeader pb={2}>
                          <HStack justify="space-between">
                            <Heading size="sm" color="gray.800">{module.name}</Heading>
                            <Badge colorScheme="teal" fontSize="xs">{module.yearLaunched}</Badge>
                          </HStack>
                        </CardHeader>
                        <CardBody pt={2}>
                          <Text fontSize="sm" color="gray.600" noOfLines={3} mb={4}>
                            {module.description}
                          </Text>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            variant="solid"
                            onClick={() => handleViewModule(module)}
                            w="full"
                            _hover={{ transform: 'scale(1.02)' }}
                          >
                            View Details
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>

      {/* Module Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedModule?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedModule && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Description
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedModule.description}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Year Launched
                  </Text>
                  <Badge colorScheme="blue">{selectedModule.yearLaunched}</Badge>
                </Box>

                {selectedModule.contributors &&
                  selectedModule.contributors.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={3}>
                        Contributors
                      </Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {selectedModule.contributors.map((contributor, idx) => (
                          <Box
                            key={idx}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor={borderColor}
                          >
                            {contributor.image && (
                              <Image
                                src={contributor.image}
                                alt={contributor.name}
                                boxSize="60px"
                                borderRadius="full"
                                objectFit="cover"
                                mb={2}
                              />
                            )}
                            <Text fontWeight="medium" fontSize="sm">
                              {contributor.name}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {contributor.designation}
                            </Text>
                            {contributor.linkedin && (
                              <ChakraLink
                                href={contributor.linkedin}
                                isExternal
                                fontSize="xs"
                                color="blue.500"
                                mt={1}
                              >
                                LinkedIn <ExternalLinkIcon mx="2px" />
                              </ChakraLink>
                            )}
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PlatformData;
