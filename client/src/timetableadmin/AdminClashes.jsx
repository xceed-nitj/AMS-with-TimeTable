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
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  RepeatIcon, 
  WarningIcon, 
  CheckCircleIcon 
} from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

const AdminClashes = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [clashData, setClashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [filterType, setFilterType] = useState('all'); // all, room, faculty
  const toast = useToast();
  const apiUrl = getEnvironment();

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
      
      // Handle different response formats
      let uniqueSessions = [];
      
      if (Array.isArray(data)) {
        // If data is array of objects with session property
        uniqueSessions = [...new Set(data.map(item => item.session).filter(Boolean))];
      } else if (data.uniqueSessions) {
        // If data has uniqueSessions property
        uniqueSessions = data.uniqueSessions.map(s => s.session || s);
      } else if (data.sessions) {
        // If data has sessions array
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
    try {
      console.log('Fetching clashes for session:', selectedSession);
      console.log('API URL:', `${apiUrl}/timetablemodule/adminclash/${selectedSession}`);
      
      const response = await fetch(`${apiUrl}/timetablemodule/adminclash/${selectedSession}`, {
        credentials: 'include'
      });
      
      console.log('Clash response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch clash data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Clash data received:', data);
      setClashData(data);
      
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch clash data',
        status: 'error',
        duration: 5000,
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

  if (loading && !clashData) {
    return (
      <>
        <Header />
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="60vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text fontSize="lg" color="gray.600">Loading clash data...</Text>
            </VStack>
          </Flex>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Page Header */}
          <Box>
            <Heading size="xl" mb={2} color="blue.700">
              Timetable Clash Detection
            </Heading>
            <Text color="gray.600">
              Admin Panel - Monitor and resolve timetable conflicts across all departments
            </Text>
          </Box>

          {/* Controls */}
          <Card>
            <CardBody>
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
                  >
                    <option value="all">All Clashes</option>
                    <option value="room">Room Clashes</option>
                    <option value="faculty">Faculty Clashes</option>
                  </Select>
                </Box>

                <Box pt={8}>
                  <Button
                    leftIcon={<RepeatIcon />}
                    colorScheme="blue"
                    size="lg"
                    onClick={fetchClashes}
                    isLoading={loading}
                  >
                    Refresh
                  </Button>
                </Box>
              </Flex>
            </CardBody>
          </Card>

          {/* Statistics */}
          {clashData && (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
              <GridItem>
                <Card bg="blue.50" borderColor="blue.200" borderWidth="2px">
                  <CardBody>
                    <Stat>
                      <StatLabel color="blue.700" fontSize="md">
                        Total Departments
                      </StatLabel>
                      <StatNumber color="blue.800" fontSize="3xl">
                        {clashData.totalDepartments}
                      </StatNumber>
                      <StatHelpText color="blue.600">
                        In session {selectedSession}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem>
                <Card bg="red.50" borderColor="red.200" borderWidth="2px">
                  <CardBody>
                    <Stat>
                      <StatLabel color="red.700" fontSize="md">
                        Departments with Clashes
                      </StatLabel>
                      <StatNumber color="red.800" fontSize="3xl">
                        {clashData.departmentsWithClashes}
                      </StatNumber>
                      <StatHelpText color="red.600">
                        <WarningIcon mr={1} />
                        Requires attention
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem>
                <Card bg="green.50" borderColor="green.200" borderWidth="2px">
                  <CardBody>
                    <Stat>
                      <StatLabel color="green.700" fontSize="md">
                        Clean Departments
                      </StatLabel>
                      <StatNumber color="green.800" fontSize="3xl">
                        {clashData.totalDepartments - clashData.departmentsWithClashes}
                      </StatNumber>
                      <StatHelpText color="green.600">
                        <CheckCircleIcon mr={1} />
                        No conflicts
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          )}

          {/* No Clashes Message */}
          {clashData && Object.keys(clashData.clashes).length === 0 && (
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              minHeight="200px"
              borderRadius="lg"
            >
              <CheckCircleIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="2xl">
                No Clashes Found!
              </AlertTitle>
              <AlertDescription maxWidth="sm" fontSize="lg">
                All departments have clean timetables for session {selectedSession}
              </AlertDescription>
            </Alert>
          )}

          {/* Departments with Clashes */}
          {clashData && Object.entries(clashData.clashes).map(([code, deptData]) => {
            const filteredClashes = getFilteredClashes(deptData.clashes);
            
            if (filteredClashes.length === 0) return null;

            const isExpanded = expandedDepts[code];

            return (
              <Card key={code} borderWidth="2px" borderColor="red.300">
                <CardBody p={0}>
                  {/* Department Header */}
                  <Flex
                    p={5}
                    bg="red.500"
                    color="white"
                    align="center"
                    justify="space-between"
                    cursor="pointer"
                    onClick={() => toggleDepartment(code)}
                    _hover={{ bg: 'red.600' }}
                    transition="all 0.2s"
                  >
                    <VStack align="start" spacing={1}>
                      <Heading size="lg">{deptData.department}</Heading>
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
                          Clashes Found
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
                    <Box p={6}>
                      <VStack spacing={4} align="stretch">
                        {filteredClashes.map((clash, idx) => (
                          <Card key={idx} bg="red.50" borderColor="red.200" borderWidth="1px">
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                {/* Clash Type and Info */}
                                <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                                  <HStack spacing={3}>
                                    <Badge
                                      colorScheme={getClashBadgeColor(clash.type)}
                                      fontSize="sm"
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                    >
                                      {clash.type.toUpperCase()} CLASH
                                    </Badge>
                                    <Text fontWeight="semibold" color="gray.700">
                                      {clash.day} - {clash.slot}
                                    </Text>
                                    <Badge colorScheme="blue" fontSize="sm">
                                      Sem {clash.sem}
                                    </Badge>
                                  </HStack>
                                  <WarningIcon color="red.500" boxSize={5} />
                                </Flex>

                                {/* Clash Details */}
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                                  {clash.subject && (
                                    <Box>
                                      <Text fontSize="xs" color="gray.600" fontWeight="semibold">
                                        Subject:
                                      </Text>
                                      <Text fontSize="sm" color="gray.800">
                                        {clash.subject}
                                      </Text>
                                    </Box>
                                  )}
                                  {clash.faculty && (
                                    <Box>
                                      <Text fontSize="xs" color="gray.600" fontWeight="semibold">
                                        Faculty:
                                      </Text>
                                      <Text fontSize="sm" color="gray.800">
                                        {clash.faculty}
                                      </Text>
                                    </Box>
                                  )}
                                  {clash.room && (
                                    <Box>
                                      <Text fontSize="xs" color="gray.600" fontWeight="semibold">
                                        Room:
                                      </Text>
                                      <Text fontSize="sm" color="gray.800">
                                        {clash.room}
                                      </Text>
                                    </Box>
                                  )}
                                </Grid>

                                <Divider />

                                {/* Conflicts With */}
                                <Box>
                                  <Text fontWeight="bold" color="red.700" mb={2}>
                                    Conflicts with:
                                  </Text>
                                  <TableContainer>
                                    <Table size="sm" variant="simple">
                                      <Thead>
                                        <Tr bg="white">
                                          <Th>Department</Th>
                                          <Th>Semester</Th>
                                          <Th>Subject</Th>
                                          <Th>Faculty</Th>
                                          <Th>Room</Th>
                                        </Tr>
                                      </Thead>
                                      <Tbody>
                                        {clash.conflictsWith.map((conflict, cIdx) => (
                                          <Tr key={cIdx} bg="white">
                                            <Td fontWeight="semibold">{conflict.code}</Td>
                                            <Td>{conflict.sem}</Td>
                                            <Td>{conflict.subject || '-'}</Td>
                                            <Td>{conflict.faculty || '-'}</Td>
                                            <Td>{conflict.room || '-'}</Td>
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
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      </Container>
    </>
  );
};

export default AdminClashes;