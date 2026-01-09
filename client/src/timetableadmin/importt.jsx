import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Select,
  Button,
  VStack,
  HStack,
  Container,
  useToast,
  Spinner,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Box,
  Heading,
  Badge,
  IconButton,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  List,
  ListItem,
  ListIcon,
  Divider,
} from '@chakra-ui/react';
import { 
  WarningIcon, 
  ArrowBackIcon, 
  InfoIcon,
  CheckCircleIcon,
} from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

function ImportTT() {
  const [fromSession, setFromSession] = useState('');
  const [toSession, setToSession] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = getEnvironment();
  const toast = useToast();

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchSessions();
    fetchTTData(currentCode);
  }, []);

  const fetchTTData = async (code) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/alldetails/${code}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      const data = await response.json();
      console.log('data', data);

      setSelectedDept(data.dept);
      setToSession(data.session);

      console.log('data', selectedDept);
    } catch (error) {
      console.error('Error fetching timetable data:', error);
      toast({
        title: 'Failed to load data.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
    }
    setLoading(false);
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment/session`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDept || !fromSession || !toSession) {
      toast({
        title: 'All fields are required.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/import/ttdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dept: selectedDept, fromSession, toSession }),
      });

      if (response.ok) {
        toast({
          title: 'Time Table Imported Successfully',
          description: 'Your timetable has been updated.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: '',
        });
        onClose();
      } else {
        const errData = await response.json();
        toast({
          title: 'Import failed',
          description: errData.message || 'Something went wrong.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: 'Server error',
        description: 'Could not complete the request.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
    }
    setSubmitting(false);
  };

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleImportClick = (e) => {
    e.preventDefault();
    if (!selectedDept || !fromSession || !toSession) {
      toast({
        title: 'All fields are required.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: '',
      });
      return;
    }
    onOpen();
  };

  const confirmImport = () => {
    handleSubmit({ preventDefault: () => {} });
  };

  const cancelImport = () => {
    toast({
      title: 'Import Cancelled',
      description: 'Your existing timetable remains unchanged.',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'bottom',
    });
    onClose();
  };

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header Section */}
      <Box
        bgGradient="linear(to-r, cyan.400, teal.500, green.500)"
        pt={0}
        pb={24}
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

        <Box
          position="relative"
          zIndex={2}
          sx={{
            '& button[aria-label="Go back"]': { display: 'none' },
            '& .chakra-button:first-of-type': { display: 'none' },
          }}
        >
          <Header />
        </Box>

        <Container maxW="7xl" position="relative" mt={8}>
          <Flex justify="space-between" align="center" w="full" gap={4}>
            <VStack spacing={4} align="start" flex="1">
              <Badge
                colorScheme="whiteAlpha"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                Import Timetable
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Import from Previous Session
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Copy timetable data from a previous session to quickly set up your current session.
              </Text>
            </VStack>

            <IconButton
              icon={<ArrowBackIcon />}
              aria-label="Go back"
              onClick={() => window.history.back()}
              size="lg"
              bg="rgba(255, 255, 255, 0.2)"
              color="white"
              fontSize="2xl"
              _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
              _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
              borderRadius="full"
              boxShadow="lg"
              border="2px solid"
              borderColor="whiteAlpha.400"
              flexShrink={0}
            />
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16}>
        {loading ? (
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardBody p={12}>
              <VStack spacing={4}>
                <Spinner size="xl" thickness="4px" color="teal.500" speed="0.65s" />
                <Text color="gray.600" fontSize="lg">Loading timetable data...</Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={6} align="stretch">
            {/* Important Information Alert */}
            <Alert status="warning" borderRadius="lg" variant="left-accent">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="md" mb={1}>Important Information</AlertTitle>
                <AlertDescription fontSize="sm">
                  This action will permanently replace your current timetable with data from the selected session. 
                  Make sure you have backed up any important data before proceeding.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Import Form Card */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="purple.600" color="white" p={4}>
                <Heading size="md">Import Timetable Settings</Heading>
              </CardHeader>
              <CardBody p={6}>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={5} align="stretch">
                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Department (Current)
                      </FormLabel>
                      <Select
                        value={selectedDept}
                        isDisabled
                        bg="gray.100"
                        size="lg"
                      >
                        <option value={selectedDept}>{selectedDept}</option>
                      </Select>
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        This is your current department and cannot be changed
                      </Text>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        From Session (Source) *
                      </FormLabel>
                      <Select
                        value={fromSession}
                        onChange={(e) => setFromSession(e.target.value)}
                        placeholder="Select the session to import from"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                        size="lg"
                      >
                        {sessions.map((session, index) => (
                          <option key={index} value={session}>
                            {session}
                          </option>
                        ))}
                      </Select>
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        Select which previous session's data you want to copy
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        To Session (Destination)
                      </FormLabel>
                      <Select
                        value={toSession}
                        isDisabled
                        bg="gray.100"
                        size="lg"
                      >
                        <option value={toSession}>{toSession}</option>
                      </Select>
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        This is your current session where data will be imported
                      </Text>
                    </FormControl>

                    <Divider my={2} />

                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box fontSize="sm">
                        <Text fontWeight="bold" mb={1}>What will be imported:</Text>
                        <List spacing={1} ml={4}>
                          <ListItem>• All timetable entries from {fromSession || 'selected session'}</ListItem>
                          <ListItem>• Faculty assignments</ListItem>
                          <ListItem>• Room allocations</ListItem>
                          <ListItem>• Subject schedules</ListItem>
                        </List>
                      </Box>
                    </Alert>

                    <Button
                      colorScheme="teal"
                      size="lg"
                      onClick={handleImportClick}
                      isLoading={submitting}
                      loadingText="Importing..."
                      w={{ base: "full", md: "auto" }}
                      alignSelf="center"
                    >
                      Import Timetable
                    </Button>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </VStack>
        )}
      </Container>

      {/* Enhanced Warning Modal */}
      <Modal isOpen={isOpen} onClose={cancelImport} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" zIndex={1400} />
        <ModalContent zIndex={1400}>
          <ModalHeader bg="red.600" color="white" borderTopRadius="md">
            <HStack spacing={3}>
              <Icon as={WarningIcon} boxSize={6} />
              <Text>⚠️ Confirm Timetable Import</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            <VStack spacing={4} align="stretch">
              {/* Critical Warning */}
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="md">Critical Action - Data Loss Warning!</AlertTitle>
                  <AlertDescription fontSize="sm">
                    This action is <strong>IRREVERSIBLE</strong> and will permanently delete your current timetable.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* What Will Happen */}
              <Box p={4} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
                <Text fontWeight="bold" color="red.800" mb={2}>
                  ❌ What will be DELETED:
                </Text>
                <List spacing={2} ml={4} color="red.700" fontSize="sm">
                  <ListItem>
                    <ListIcon as={WarningIcon} color="red.500" />
                    All existing timetable entries for {toSession}
                  </ListItem>
                  <ListItem>
                    <ListIcon as={WarningIcon} color="red.500" />
                    Current faculty assignments
                  </ListItem>
                  <ListItem>
                    <ListIcon as={WarningIcon} color="red.500" />
                    Current room allocations
                  </ListItem>
                  <ListItem>
                    <ListIcon as={WarningIcon} color="red.500" />
                    Any manual adjustments you've made
                  </ListItem>
                </List>
              </Box>

              {/* What Will Be Imported */}
              <Box p={4} bg="green.50" borderRadius="md" borderWidth="1px" borderColor="green.200">
                <Text fontWeight="bold" color="green.800" mb={2}>
                  ✅ What will be IMPORTED:
                </Text>
                <List spacing={2} ml={4} color="green.700" fontSize="sm">
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    All timetable data from {fromSession || 'selected session'}
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    Faculty assignments from previous session
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    Room allocations from previous session
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    Subject schedules from previous session
                  </ListItem>
                </List>
              </Box>

              {/* Additional Warnings */}
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box fontSize="sm">
                  <AlertTitle fontSize="sm" mb={1}>Before proceeding:</AlertTitle>
                  <AlertDescription>
                    • Make sure the source session ({fromSession || 'selected'}) has the correct data
                    <br />
                    • Verify that faculty members are still available
                    <br />
                    • Check that room numbers haven't changed
                    <br />
                    • Consider taking a backup if needed
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Confirmation Summary */}
              <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                <Text fontWeight="bold" color="blue.800" mb={2}>
                  📋 Import Summary:
                </Text>
                <VStack align="stretch" spacing={1} fontSize="sm" color="blue.700">
                  <HStack justify="space-between">
                    <Text>Department:</Text>
                    <Text fontWeight="bold">{selectedDept}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>From Session:</Text>
                    <Text fontWeight="bold">{fromSession}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>To Session:</Text>
                    <Text fontWeight="bold">{toSession}</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={cancelImport}>
                Cancel - Keep Current Timetable
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmImport}
                isLoading={submitting}
                loadingText="Importing..."
              >
                Yes, Import and Replace
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ImportTT;