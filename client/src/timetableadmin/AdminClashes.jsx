import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Spinner,
  useToast,
  Collapse,
  Badge,
  Card,
  CardBody,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  RepeatIcon, 
  WarningIcon, 
  CheckCircleIcon,
  ArrowBackIcon
} from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

const AdminClashes = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [clashData, setClashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [deptNameMap, setDeptNameMap] = useState({});
  const [dbError, setDbError] = useState(false);
  const toast = useToast();
  const apiUrl = getEnvironment();

  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'gray.900');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClashes();
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      console.log('Fetching sessions from:', `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`);
      
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      let uniqueSessions = [];
      
      if (Array.isArray(data)) {
        uniqueSessions = [...new Set(data.map(item => item.session).filter(Boolean))];
      } else if (data.uniqueSessions) {
        uniqueSessions = data.uniqueSessions.map(s => s.session || s);
      } else if (data.sessions) {
        uniqueSessions = data.sessions;
      }
      
      console.log('Unique sessions:', uniqueSessions);
      setSessions(uniqueSessions);
      
      if (uniqueSessions.length > 0) {
        setSelectedSession(uniqueSessions[0]);
      } else {
        toast({
          title: 'No Sessions Found',
          description: 'No timetable sessions available',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch sessions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchClashes = async () => {
    if (!selectedSession) {
      toast({
        title: 'No Session Selected',
        description: 'Please select a session first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    setDbError(false);
    
    try {
      const encodedSession = encodeURIComponent(selectedSession);
      const url = `${apiUrl}/timetablemodule/adminclash/${encodedSession}`;
      
      console.log('Fetching clashes for session:', selectedSession);
      console.log('Encoded session:', encodedSession);
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('Clash response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        
        if (response.status === 503 || errorData.error?.includes('timeout') || errorData.error?.includes('connection')) {
          setDbError(true);
          throw new Error('Database connection timeout. The server is reconnecting. Please try again in a few seconds.');
        } else if (errorData.error?.includes('not established')) {
          setDbError(true);
          throw new Error('Database is reconnecting. Please wait a moment and try again.');
        } else {
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('Clash data received:', data);
      setClashData(data);
      setDbError(false);
      
      const nameMap = {};
      Object.entries(data.clashes).forEach(([code, deptData]) => {
        nameMap[code] = deptData.department || code;
      });
      setDeptNameMap(nameMap);
      
      if (data.departmentsWithClashes === 0) {
        toast({
          title: 'No Clashes Found',
          description: 'All departments have clean timetables!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching clashes:', error);
      
      let errorTitle = 'Error Loading Data';
      let errorDescription = error.message;
      
      if (error.message.includes('timeout') || error.message.includes('reconnecting')) {
        errorTitle = 'Database Connection Issue';
        errorDescription = error.message + ' The system will automatically reconnect.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (code) => {
    setExpandedDepts(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const getFilteredClashes = (clashes) => {
    if (filterType === 'all') return clashes;
    return clashes.filter(clash => clash.type === filterType);
  };

  const getClashBadgeColor = (type) => {
    return type === 'room' ? 'orange' : 'purple';
  };

  const getDepartmentName = (code) => {
    return deptNameMap[code] || code;
  };

  return (
    <Box bgGradient={bgGradient} minH="100vh">
      <Box pb={16}>
        {/* Hero Header Section with integrated navbar */}
        <Box 
          bgGradient="linear(to-r, orange.500, red.600, pink.600)"
          pt={4}
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
          
          {/* Header/Navbar integrated into hero - Hide back button */}
          <Box position="relative" zIndex={2} sx={{
            '& button[aria-label="Go back"]': { display: 'none' },
            '& .chakra-button:first-of-type': { display: 'none' }
          }}>
            <Header />
          </Box>

          <Container maxW="7xl" position="relative" mt={20}>
            <Flex justify="space-between" align="center" w="full" gap={4}>
              <VStack spacing={4} align="start" flex="1">
                <Badge colorScheme="whiteAlpha" fontSize="sm" px={3} py={1} borderRadius="full">
                  Admin Dashboard
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  Timetable Clash Detection
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Monitor and resolve timetable conflicts across all departments in real-time.
                </Text>
              </VStack>
              
              {/* New Back Button on Right Side */}
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

        <Container maxW="7xl" mt={-12} position="relative" zIndex={1}>
          <VStack spacing={8} align="stretch">
            {/* Controls */}
            <Box 
              bg={cardBg}
              borderRadius="2xl"
              shadow="2xl"
              p={8}
              border="1px"
              borderColor={borderColor}
            >
              <Flex gap={4} wrap="wrap" align="center">
                <Box flex="1" minW="200px">
                  <Text mb={2} fontWeight="semibold" color="gray.700">
                    Select Session:
                  </Text>
                  <Select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    size="lg"
                    placeholder="Choose a session"
                    bg="gray.50"
                    border="2px"
                    borderColor="gray.200"
                  >
                    {sessions.map(session => (
                      <option key={session} value={session}>
                        {session}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box flex="1" minW="200px">
                  <Text mb={2} fontWeight="semibold" color="gray.700">
                    Filter by Type:
                  </Text>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    size="lg"
                    bg="gray.50"
                    border="2px"
                    borderColor="gray.200"
                  >
                    <option value="all">All Clashes</option>
                    <option value="room">Room Clashes</option>
                    <option value="faculty">Faculty Clashes</option>
                  </Select>
                </Box>

                <Box pt={8}>
                  <Button
                    leftIcon={<RepeatIcon />}
                    size="lg"
                    bgGradient="linear(to-r, orange.500, red.600)"
                    color="white"
                    onClick={fetchClashes}
                    isLoading={loading}
                    isDisabled={!selectedSession}
                    _hover={{ bgGradient: "linear(to-r, orange.600, red.700)" }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Flex>

              {/* Loading Banner */}
              {loading && (
                <Alert status="info" mt={4} borderRadius="lg" bg="blue.50" border="2px" borderColor="blue.200">
                  <AlertIcon>
                    <Spinner size="sm" />
                  </AlertIcon>
                  <Box>
                    <AlertTitle fontSize="md" color="blue.800">
                      {clashData ? 'Refreshing data...' : 'Loading clash data...'}
                    </AlertTitle>
                    <AlertDescription fontSize="sm" color="blue.700">
                      {selectedSession ? `Fetching data for session ${selectedSession}. This may take a moment.` : 'Please wait...'}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Database Connection Error */}
              {dbError && !loading && (
                <Alert status="warning" mt={4} borderRadius="lg" bg="orange.50" border="2px" borderColor="orange.200">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle fontSize="md" color="orange.800">Database Connection Issue</AlertTitle>
                    <AlertDescription fontSize="sm" color="orange.700">
                      The database is temporarily unavailable or reconnecting. 
                      {' '}Please wait a moment and click Refresh to try again.
                    </AlertDescription>
                  </Box>
                  <Button 
                    size="sm" 
                    colorScheme="orange" 
                    onClick={fetchClashes}
                    ml={2}
                  >
                    Retry Now
                  </Button>
                </Alert>
              )}
            </Box>

            {/* Statistics */}
            {clashData && (
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                <GridItem>
                  <Box 
                    bg={cardBg}
                    borderRadius="2xl"
                    shadow="xl"
                    overflow="hidden"
                    border="2px"
                    borderColor="blue.200"
                  >
                    <Box bgGradient="linear(to-br, blue.400, blue.600)" p={6}>
                      <Stat>
                        <StatLabel color="white" fontSize="md" fontWeight="semibold">
                          Total Departments
                        </StatLabel>
                        <StatNumber color="white" fontSize="4xl" fontWeight="bold">
                          {clashData.totalDepartments}
                        </StatNumber>
                        <StatHelpText color="whiteAlpha.900">
                          In session {selectedSession}
                        </StatHelpText>
                      </Stat>
                    </Box>
                  </Box>
                </GridItem>

                <GridItem>
                  <Box 
                    bg={cardBg}
                    borderRadius="2xl"
                    shadow="xl"
                    overflow="hidden"
                    border="2px"
                    borderColor="red.200"
                  >
                    <Box bgGradient="linear(to-br, red.500, red.700)" p={6}>
                      <Stat>
                        <StatLabel color="white" fontSize="md" fontWeight="semibold">
                          Departments with Clashes
                        </StatLabel>
                        <StatNumber color="white" fontSize="4xl" fontWeight="bold">
                          {clashData.departmentsWithClashes}
                        </StatNumber>
                        <StatHelpText color="whiteAlpha.900">
                          <WarningIcon mr={1} />
                          Requires attention
                        </StatHelpText>
                      </Stat>
                    </Box>
                  </Box>
                </GridItem>

                <GridItem>
                  <Box 
                    bg={cardBg}
                    borderRadius="2xl"
                    shadow="xl"
                    overflow="hidden"
                    border="2px"
                    borderColor="green.200"
                  >
                    <Box bgGradient="linear(to-br, green.400, green.600)" p={6}>
                      <Stat>
                        <StatLabel color="white" fontSize="md" fontWeight="semibold">
                          Clean Departments
                        </StatLabel>
                        <StatNumber color="white" fontSize="4xl" fontWeight="bold">
                          {clashData.totalDepartments - clashData.departmentsWithClashes}
                        </StatNumber>
                        <StatHelpText color="whiteAlpha.900">
                          <CheckCircleIcon mr={1} />
                          No conflicts
                        </StatHelpText>
                      </Stat>
                    </Box>
                  </Box>
                </GridItem>
              </Grid>
            )}

            {/* No Clashes Message */}
            {clashData && Object.keys(clashData.clashes).length === 0 && (
              <Box 
                bg={cardBg}
                borderRadius="2xl"
                shadow="xl"
                overflow="hidden"
                border="2px"
                borderColor="green.300"
              >
                <Alert
                  status="success"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  minHeight="200px"
                  bg="transparent"
                >
                  <CheckCircleIcon boxSize="40px" mr={0} />
                  <AlertTitle mt={4} mb={1} fontSize="2xl">
                    No Clashes Found!
                  </AlertTitle>
                  <AlertDescription maxWidth="sm" fontSize="lg">
                    All departments have clean timetables for session {selectedSession}
                  </AlertDescription>
                </Alert>
              </Box>
            )}

            {/* Departments with Clashes */}
            {clashData && Object.entries(clashData.clashes).map(([code, deptData]) => {
              const filteredClashes = getFilteredClashes(deptData.clashes);
              
              if (filteredClashes.length === 0) return null;

              const isExpanded = expandedDepts[code];
              const departmentName = deptData.department || code;

              return (
                <Box 
                  key={code}
                  bg={cardBg}
                  borderRadius="2xl"
                  shadow="xl"
                  overflow="hidden"
                  border="2px"
                  borderColor="red.300"
                >
                  {/* Department Header */}
                  <Flex
                    p={5}
                    bgGradient="linear(to-r, red.500, red.700)"
                    color="white"
                    align="center"
                    justify="space-between"
                    cursor="pointer"
                    onClick={() => toggleDepartment(code)}
                    _hover={{ bgGradient: 'linear(to-r, red.600, red.800)' }}
                    transition="all 0.2s"
                  >
                    <VStack align="start" spacing={1}>
                      <Heading size="lg">{departmentName}</Heading>
                      <Text fontSize="sm" opacity={0.9}>
                        Code: {code}
                      </Text>
                    </VStack>

                    <HStack spacing={4}>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="3xl" fontWeight="bold">
                          {filteredClashes.length}
                        </Text>
                        <Text fontSize="sm" opacity={0.9}>
                          Clash{filteredClashes.length !== 1 ? 'es' : ''} Found
                        </Text>
                      </VStack>
                      <IconButton
                        icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        variant="ghost"
                        color="white"
                        size="lg"
                        _hover={{ bg: 'red.600' }}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      />
                    </HStack>
                  </Flex>

                  {/* Clash Details */}
                  <Collapse in={isExpanded} animateOpacity>
                    <Box p={6} bg="red.50">
                      <VStack spacing={4} align="stretch">
                        {filteredClashes.map((clash, idx) => (
                          <Card key={idx} bg="white" borderColor="red.200" borderWidth="1px">
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                {/* Clash Type and Info */}
                                <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                                  <HStack spacing={3} flexWrap="wrap">
                                    <Badge
                                      colorScheme={getClashBadgeColor(clash.type)}
                                      fontSize="sm"
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                      textTransform="uppercase"
                                    >
                                      {clash.type} Clash
                                    </Badge>
                                    <Text fontWeight="bold" color="gray.700" fontSize="md">
                                      {clash.day} - {clash.slot}
                                    </Text>
                                    <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                                      Semester {clash.sem}
                                    </Badge>
                                  </HStack>
                                  <WarningIcon color="red.500" boxSize={6} />
                                </Flex>

                                {/* Clash Details */}
                                <Box bg="gray.50" p={4} borderRadius="md">
                                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                                    {clash.subject && (
                                      <Box>
                                        <Text fontSize="xs" color="gray.600" fontWeight="bold" mb={1}>
                                          SUBJECT
                                        </Text>
                                        <Text fontSize="sm" color="gray.800" fontWeight="semibold">
                                          {clash.subject}
                                        </Text>
                                      </Box>
                                    )}
                                    {clash.faculty && (
                                      <Box>
                                        <Text fontSize="xs" color="gray.600" fontWeight="bold" mb={1}>
                                          FACULTY
                                        </Text>
                                        <Text fontSize="sm" color="gray.800" fontWeight="semibold">
                                          {clash.faculty}
                                        </Text>
                                      </Box>
                                    )}
                                    {clash.room && (
                                      <Box>
                                        <Text fontSize="xs" color="gray.600" fontWeight="bold" mb={1}>
                                          ROOM
                                        </Text>
                                        <Text fontSize="sm" color="gray.800" fontWeight="semibold">
                                          {clash.room}
                                        </Text>
                                      </Box>
                                    )}
                                  </Grid>
                                </Box>

                                <Divider borderColor="red.300" />

                                {/* Conflicts With */}
                                <Box>
                                  <HStack mb={3} spacing={2}>
                                    <WarningIcon color="red.600" />
                                    <Text fontWeight="bold" color="red.700" fontSize="md">
                                      Conflicts with:
                                    </Text>
                                  </HStack>
                                  <TableContainer>
                                    <Table size="sm" variant="simple">
                                      <Thead>
                                        <Tr bg="red.100">
                                          <Th color="red.800" fontWeight="bold">Department</Th>
                                          <Th color="red.800" fontWeight="bold">Semester</Th>
                                          <Th color="red.800" fontWeight="bold">Subject</Th>
                                          <Th color="red.800" fontWeight="bold">Faculty</Th>
                                          <Th color="red.800" fontWeight="bold">Room</Th>
                                        </Tr>
                                      </Thead>
                                      <Tbody>
                                        {clash.conflictsWith.map((conflict, cIdx) => (
                                          <Tr 
                                            key={cIdx} 
                                            bg="white"
                                            _hover={{ bg: 'red.50' }}
                                            borderBottom={cIdx < clash.conflictsWith.length - 1 ? '1px' : 'none'}
                                            borderColor="red.100"
                                          >
                                            <Td fontWeight="bold" color="gray.800">
                                              <VStack align="start" spacing={0}>
                                                <Text fontWeight="bold" fontSize="sm">
                                                  {getDepartmentName(conflict.code)}
                                                </Text>
                                                {getDepartmentName(conflict.code) !== conflict.code && (
                                                  <Text fontSize="xs" color="gray.500">
                                                    ({conflict.code})
                                                  </Text>
                                                )}
                                              </VStack>
                                            </Td>
                                            <Td color="gray.700">{conflict.sem}</Td>
                                            <Td color="gray.700">{conflict.subject || '-'}</Td>
                                            <Td color="gray.700">{conflict.faculty || '-'}</Td>
                                            <Td color="gray.700">{conflict.room || '-'}</Td>
                                          </Tr>
                                        ))}
                                      </Tbody>
                                    </Table>
                                  </TableContainer>
                                </Box>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminClashes;