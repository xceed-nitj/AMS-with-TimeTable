import React, { useState, useEffect } from 'react';
import {
  Button,
  VStack,
  Input,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Container,
  Select,
  Box,
  Text,
  Flex,
  Tag,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Icon,
  HStack,
  useToast,
  IconButton,
  Badge,
  InputGroup,
  InputLeftElement,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiEdit2,
  FiTrash2,
  FiSave,
  FiPlus,
  FiCalendar,
  FiCheck,
  FiStar,
  FiUsers,
  FiBook,
  FiHome,
  FiSettings,
  FiMessageSquare,
  FiAlertCircle,
  FiBarChart2,
  FiFileText,
  FiList,
} from 'react-icons/fi';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  CustomBlueButton,
  CustomDeleteButton,
  CustomTealButton,
} from '../styles/customStyles';

const AdminPage = () => {
  const [formData, setFormData] = useState({ session: '' });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionValue, setEditingSessionValue] = useState('');
  const [sessions, setSessions] = useState([]);
  const [currentSessionName, setCurrentSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  const apiUrl = getEnvironment();
  const toast = useToast();

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'gray.900'
  );
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  useEffect(() => {
    fetchSessions();
    fetchCurrentStatus();
  }, []);

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
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      // CHANGED: Using query parameter approach
      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment?action=current-status`,
        {
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionName(data.currentSession || '');
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleSetCurrentSession = async (session) => {
    if (!session) {
      toast({
        title: 'Please select a session first.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    try {
      // CHANGED: Using query parameter approach with POST to base endpoint
      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment?action=set-current-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session }),
          credentials: 'include',
        }
      );
      if (response.ok) {
        toast({
          title: `Session "${session}" is now the current session.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        setCurrentSessionName(session);
        setSelectedSession('');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Failed to set current session',
          description:
            errorData.error ||
            "Please ensure TimeTable schema has 'currentSession' field",
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error setting current session:', error.message);
      toast({
        title: 'Error setting current session',
        description:
          "Please check if TimeTable model has 'currentSession' field",
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleDelete = async (session) => {
    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete session "${session}"?`
      );
      if (!confirmed) return;

      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment/session/${session}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        setSessions((prev) => prev.filter((item) => item !== session));

        if (session.trim() === currentSessionName.trim()) {
          setCurrentSessionName('');
        }

        toast({
          title: 'Session deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error deleting:', error.message);
    }
  };

  const handleSubmit = async () => {
    if (!formData.session.trim()) {
      toast({
        title: 'Please enter a session name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/allotment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (response.ok) {
        await fetchSessions();
        setFormData({ session: '' });
        toast({
          title: 'Session created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error creating:', error.message);
    }
  };

  const handleEdit = (session) => {
    setEditingSessionId(session);
    setEditingSessionValue(session);
  };

  const handleSave = async () => {
    if (!editingSessionValue.trim()) {
      toast({
        title: 'Session name cannot be empty',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment/session/${editingSessionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: editingSessionValue }),
          credentials: 'include',
        }
      );

      if (response.ok) {
        setSessions((prev) =>
          prev.map((item) =>
            item === editingSessionId ? editingSessionValue : item
          )
        );

        if (editingSessionId.trim() === currentSessionName.trim()) {
          setCurrentSessionName(editingSessionValue);
        }

        setEditingSessionId(null);
        setEditingSessionValue('');

        toast({
          title: 'Session updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error editing:', error.message);
    }
  };

  const navigationItems = [
    {
      path: '/tt/mastersem',
      label: 'Master Semester',
      icon: FiBook,
      gradient: 'linear(to-br, blue.600, blue.800)',
    },
    {
      path: '/tt/masterfaculty',
      label: 'Master Faculty',
      icon: FiUsers,
      gradient: 'linear(to-br, green.600, teal.800)',
    },
    {
      path: '/tt/masterroom',
      label: 'Master Room',
      icon: FiHome,
      gradient: 'linear(to-br, orange.600, red.700)',
    },
    {
      path: '/tt/masterdelete',
      label: 'Delete Records',
      icon: FiTrash2,
      gradient: 'linear(to-br, red.600, pink.800)',
    },
    {
      path: '/tt/allotment',
      label: 'Room Allotment',
      icon: FiFileText,
      gradient: 'linear(to-br, purple.600, purple.800)',
    },
    {
      path: '/tt/admin/adminview',
      label: 'Edit Timetable',
      icon: FiEdit2,
      gradient: 'linear(to-br, gray.600, gray.800)',
    },
    {
      path: '/tt/admin/clashes',
      label: 'View Clashes',
      icon: FiAlertCircle,
      gradient: 'linear(to-br, yellow.500, yellow.700)',
    },
    {
      path: '/tt/admin/facultyload',
      label: 'Department Faculty Load',
      icon: FiBarChart2,
      gradient: 'linear(to-br, pink.600, pink.800)',
    },
    {
      path: '/tt/messages',
      label: 'Messages',
      icon: FiMessageSquare,
      gradient: 'linear(to-br, cyan.600, blue.800)',
    },
    {
      path: '/tt/logs',
      label: 'Logs',
      icon: FiList,
      gradient: 'linear(to-br, purple.600, pink.700)',
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
            <Badge
              colorScheme="whiteAlpha"
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              Admin Dashboard
            </Badge>
            <Heading size="2xl" color="white" fontWeight="bold">
              Timetable Management Center
            </Heading>
            <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
              Manage academic sessions, configure timetables, and oversee all
              scheduling operations from one place.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1}>
        <Box
          bg={cardBg}
          borderRadius="2xl"
          shadow="2xl"
          p={8}
          mb={8}
          border="1px"
          borderColor={borderColor}
        >
          <HStack justify="space-between" mb={6}>
            <VStack align="start" spacing={1}>
              <Heading
                size="lg"
                bgGradient="linear(to-r, purple.600, blue.600)"
                bgClip="text"
              >
                Quick Actions
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Access key management features
              </Text>
            </VStack>
            <Badge
              colorScheme="purple"
              fontSize="md"
              px={3}
              py={2}
              borderRadius="lg"
            >
              {navigationItems.length} Tools
            </Badge>
          </HStack>

          <VStack align="stretch" spacing={6} mb={6}>
            <Heading size="md" color="gray.700">
              Centralized Data Entry
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              {navigationItems
                .slice(0, 3)
                .map(({ path, label, icon, gradient }) => (
                  <Box
                    key={path}
                    as="a"
                    href={path}
                    bgGradient={gradient}
                    p={6}
                    borderRadius="xl"
                    transition="all 0.3s"
                    cursor="pointer"
                    border="2px solid"
                    borderColor="whiteAlpha.300"
                    shadow="lg"
                    _hover={{ transform: 'translateY(-8px)', shadow: '2xl' }}
                  >
                    <VStack spacing={3}>
                      <Box
                        bg="whiteAlpha.400"
                        p={3}
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="whiteAlpha.500"
                      >
                        <Icon as={icon} boxSize={6} color="white" />
                      </Box>
                      <Text
                        color="white"
                        fontWeight="bold"
                        fontSize="md"
                        textAlign="center"
                        textShadow="0 2px 10px rgba(0,0,0,0.6)"
                      >
                        {label}
                      </Text>
                    </VStack>
                  </Box>
                ))}
            </SimpleGrid>
          </VStack>

          <VStack align="stretch" spacing={6} mb={6}>
            <Heading size="md" color="gray.700">
              Centralized Room Allotment
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              {navigationItems
                .slice(4, 5)
                .map(({ path, label, icon, gradient }) => (
                  <Box
                    key={path}
                    as="a"
                    href={path}
                    bgGradient={gradient}
                    p={6}
                    borderRadius="xl"
                    transition="all 0.3s"
                    cursor="pointer"
                    border="2px solid"
                    borderColor="whiteAlpha.300"
                    shadow="lg"
                    _hover={{ transform: 'translateY(-8px)', shadow: '2xl' }}
                  >
                    <VStack spacing={3}>
                      <Box
                        bg="whiteAlpha.400"
                        p={3}
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="whiteAlpha.500"
                      >
                        <Icon as={icon} boxSize={6} color="white" />
                      </Box>
                      <Text
                        color="white"
                        fontWeight="bold"
                        fontSize="md"
                        textAlign="center"
                        textShadow="0 2px 10px rgba(0,0,0,0.6)"
                      >
                        {label}
                      </Text>
                    </VStack>
                  </Box>
                ))}
            </SimpleGrid>
          </VStack>

          <VStack align="stretch" spacing={6} mb={6}>
            <Heading size="md" color="gray.700">
              Timetable Modifications
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {[navigationItems[3], ...navigationItems.slice(5, 8)].map(
                ({ path, label, icon, gradient }) => (
                  <Box
                    key={path}
                    as="a"
                    href={path}
                    bgGradient={gradient}
                    p={6}
                    borderRadius="xl"
                    transition="all 0.3s"
                    cursor="pointer"
                    border="2px solid"
                    borderColor="whiteAlpha.300"
                    shadow="lg"
                    _hover={{ transform: 'translateY(-8px)', shadow: '2xl' }}
                  >
                    <VStack spacing={3}>
                      <Box
                        bg="whiteAlpha.400"
                        p={3}
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="whiteAlpha.500"
                      >
                        <Icon as={icon} boxSize={6} color="white" />
                      </Box>
                      <Text
                        color="white"
                        fontWeight="bold"
                        fontSize="md"
                        textAlign="center"
                        textShadow="0 2px 10px rgba(0,0,0,0.6)"
                      >
                        {label}
                      </Text>
                    </VStack>
                  </Box>
                )
              )}
            </SimpleGrid>
          </VStack>

          <VStack align="stretch" spacing={6}>
            <Heading size="md" color="gray.700">
              Others
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              {navigationItems
                .slice(8)
                .map(({ path, label, icon, gradient }) => (
                  <Box
                    key={path}
                    as="a"
                    href={path}
                    bgGradient={gradient}
                    p={6}
                    borderRadius="xl"
                    transition="all 0.3s"
                    cursor="pointer"
                    border="2px solid"
                    borderColor="whiteAlpha.300"
                    shadow="lg"
                    _hover={{ transform: 'translateY(-8px)', shadow: '2xl' }}
                  >
                    <VStack spacing={3}>
                      <Box
                        bg="whiteAlpha.400"
                        p={3}
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="whiteAlpha.500"
                      >
                        <Icon as={icon} boxSize={6} color="white" />
                      </Box>
                      <Text
                        color="white"
                        fontWeight="bold"
                        fontSize="md"
                        textAlign="center"
                        textShadow="0 2px 10px rgba(0,0,0,0.6)"
                      >
                        {label}
                      </Text>
                    </VStack>
                  </Box>
                ))}
            </SimpleGrid>
          </VStack>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
          <Box
            bg={cardBg}
            borderRadius="2xl"
            shadow="xl"
            overflow="hidden"
            border="1px"
            borderColor={borderColor}
          >
            <Box bgGradient="linear(to-r, teal.400, green.400)" p={6}>
              <HStack spacing={3}>
                <Box bg="whiteAlpha.300" p={2} borderRadius="lg">
                  <Icon as={FiCalendar} boxSize={6} color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="white">
                    Create Session
                  </Heading>
                  <Text color="whiteAlpha.900" fontSize="sm">
                    Add a new academic year
                  </Text>
                </VStack>
              </HStack>
            </Box>
            <Box p={6}>
              <VStack spacing={4} align="stretch">
                <InputGroup size="lg">
                  <InputLeftElement>
                    <Icon as={FiCalendar} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={formData.session}
                    onChange={(e) => setFormData({ session: e.target.value })}
                    placeholder="e.g., 2025-2026"
                    bg="gray.50"
                    border="2px"
                    borderColor="gray.200"
                  />
                </InputGroup>
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  bgGradient="linear(to-r, teal.400, green.400)"
                  color="white"
                  leftIcon={<Icon as={FiPlus} />}
                  _hover={{ bgGradient: 'linear(to-r, teal.500, green.500)' }}
                >
                  Create New Session
                </Button>
              </VStack>
            </Box>
          </Box>

          <Box
            bg={cardBg}
            borderRadius="2xl"
            shadow="xl"
            overflow="hidden"
            border="1px"
            borderColor={borderColor}
          >
            <Box bgGradient="linear(to-r, blue.400, purple.500)" p={6}>
              <HStack spacing={3}>
                <Box bg="whiteAlpha.300" p={2} borderRadius="lg">
                  <Icon as={FiCheck} boxSize={6} color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="white">
                    Set Current Session
                  </Heading>
                  <Text color="whiteAlpha.900" fontSize="sm">
                    Mark the active academic year
                  </Text>
                </VStack>
              </HStack>
            </Box>
            <Box p={6}>
              <VStack spacing={4} align="stretch">
                {currentSessionName && (
                  <HStack
                    bg="green.50"
                    p={3}
                    borderRadius="lg"
                    border="2px"
                    borderColor="green.200"
                    justify="space-between"
                  >
                    <HStack>
                      <Icon as={FiStar} color="green.600" />
                      <Text fontWeight="bold" color="green.700">
                        Current:
                      </Text>
                    </HStack>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      {currentSessionName}
                    </Badge>
                  </HStack>
                )}
                <Select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  size="lg"
                  placeholder="Select session..."
                  bg="gray.50"
                  border="2px"
                  borderColor="gray.200"
                >
                  {sessions.map((session, index) => (
                    <option key={index} value={session}>
                      {session}
                    </option>
                  ))}
                </Select>
                <Button
                  onClick={() => handleSetCurrentSession(selectedSession)}
                  size="lg"
                  bgGradient="linear(to-r, blue.400, purple.500)"
                  color="white"
                  leftIcon={<Icon as={FiCheck} />}
                  _hover={{ bgGradient: 'linear(to-r, blue.500, purple.600)' }}
                >
                  Mark as Current
                </Button>
              </VStack>
            </Box>
          </Box>
        </SimpleGrid>

        <Box
          bg={cardBg}
          borderRadius="2xl"
          shadow="xl"
          overflow="hidden"
          border="1px"
          borderColor={borderColor}
        >
          <Box bgGradient="linear(to-r, gray.700, gray.800)" p={6}>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Box bg="whiteAlpha.200" p={2} borderRadius="lg">
                  <Icon as={FiSettings} boxSize={5} color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="white">
                    All Sessions
                  </Heading>
                  <Text color="whiteAlpha.800" fontSize="sm">
                    {sessions.length} total sessions
                  </Text>
                </VStack>
              </HStack>
            </HStack>
          </Box>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Session Details</Th>
                  <Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sessions.length === 0 ? (
                  <Tr>
                    <Td colSpan={2} textAlign="center" py={8}>
                      <Text color="gray.500">
                        No sessions found. Create one to get started!
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  sessions.map((session, index) => (
                    <Tr key={index} _hover={{ bg: 'gray.50' }}>
                      <Td py={5}>
                        {editingSessionId === session ? (
                          <Input
                            value={editingSessionValue}
                            onChange={(e) =>
                              setEditingSessionValue(e.target.value)
                            }
                            autoFocus
                          />
                        ) : (
                          <HStack spacing={4}>
                            <Box
                              bg={
                                session.trim() === currentSessionName.trim()
                                  ? 'green.100'
                                  : 'gray.100'
                              }
                              p={3}
                              borderRadius="lg"
                            >
                              <Icon
                                as={
                                  session.trim() === currentSessionName.trim()
                                    ? FiStar
                                    : FiCalendar
                                }
                                color={
                                  session.trim() === currentSessionName.trim()
                                    ? 'green.600'
                                    : 'gray.600'
                                }
                                boxSize={5}
                              />
                            </Box>
                            <VStack align="start" spacing={1}>
                              <Text
                                fontSize="lg"
                                fontWeight={
                                  session.trim() === currentSessionName.trim()
                                    ? 'bold'
                                    : 'semibold'
                                }
                                color={
                                  session.trim() === currentSessionName.trim()
                                    ? 'green.700'
                                    : 'gray.800'
                                }
                              >
                                {session}
                              </Text>
                              {session.trim() === currentSessionName.trim() && (
                                <Badge
                                  colorScheme="green"
                                  fontSize="xs"
                                  borderRadius="full"
                                >
                                  ✓ Currently Active
                                </Badge>
                              )}
                            </VStack>
                          </HStack>
                        )}
                      </Td>
                      <Td py={5}>
                        <HStack spacing={2} justify="flex-end">
                          {editingSessionId === session ? (
                            <>
                              <Button
                                size="sm"
                                colorScheme="green"
                                leftIcon={<Icon as={FiSave} />}
                                onClick={handleSave}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSessionId(null);
                                  setEditingSessionValue('');
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Tooltip label="Edit session">
                                <IconButton
                                  icon={<Icon as={FiEdit2} />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                  onClick={() => handleEdit(session)}
                                />
                              </Tooltip>
                              <Tooltip label="Delete session">
                                <IconButton
                                  icon={<Icon as={FiTrash2} />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDelete(session)}
                                />
                              </Tooltip>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPage;
