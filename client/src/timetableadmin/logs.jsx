import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  useToast,
  useColorModeValue,
  Icon,
  Button,
  Select,
  Flex,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  IconButton,
} from '@chakra-ui/react';
import {
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiTrash2,
} from 'react-icons/fi';
import getEnvironment from '../getenvironment.js';

const SLOT_TIME_MAP = {
  period1: '08:30 AM',
  period2: '09:30 AM',
  period3: '10:30 AM',
  period4: '11:30 AM',
  period5: '01:30 PM',
  period6: '02:30 PM',
  period7: '03:30 PM',
  period8: '04:30 PM',
};

const TimetableLockLog = ({ facultyChanges }) => {
  return (
    <>
      {facultyChanges.map(({ faculty, changes }, index) => (
        <div key={index} style={{ marginBottom: 16 }}>
          <strong>Faculty:</strong> {faculty}
          <br />
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            {/* 🟢 SUBJECT ADDED */}
            {changes.addedSubjects.length > 0 && (
              <li>
                <strong>Subjects Added</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {changes.addedSubjects.map((s, i) => (
                    <li key={i}>
                      {s.subject} ({s.sem})
                      <ul>
                        {s.entries.map((e, j) => (
                          <li key={j}>
                            {e.day}, {SLOT_TIME_MAP[e.slot]} — Room {e.room}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            )}

            {/* 🔴 SUBJECT REMOVED */}
            {changes.removedSubjects.length > 0 && (
              <li>
                <strong>Subjects Removed</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {changes.removedSubjects.map((s, i) => (
                    <li key={i}>
                      {s.subject}, ({s.sem})
                    </li>
                  ))}
                </ul>
              </li>
            )}

            {/* 🟡 SUBJECT UPDATED */}
            {changes.updatedSubjects.length > 0 && (
              <li>
                <strong>Subjects Updated</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {changes.updatedSubjects.map((u, i) => (
                    <li key={i}>
                      {u.subject} ({u.sem})
                      <ul>
                        {u.changes.room && (
                          <li>
                            <strong>Room:</strong>{' '}
                            {u.changes.room.from.join(', ')} →{' '}
                            {u.changes.room.to.join(', ')}
                          </li>
                        )}

                        {u.changes.slots && (
                          <li>
                            <strong>Slots:</strong>
                            <ul>
                              <li>Added: {u.changes.slots.added.join(', ')}</li>
                              <li>
                                Removed: {u.changes.slots.removed.join(', ')}
                              </li>
                            </ul>
                          </li>
                        )}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </div>
      ))}
    </>
  );
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allDepts, setAllDepts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [deptFilter, setDeptFilter] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState('');
  const [hasMore, setHasMore] = useState(false);
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
    fetchLogs();
    fetchTotalLogs();
    setTotalPages(totalLogs / limit === 0 ? 1 : Math.ceil(totalLogs / limit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit]);

  useEffect(() => {
    // when dept filter changes reset page
    setCurrentPage(1);
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptFilter]);

  const fetchLogs = async () => {
    try {
      let url = '';
      if (deptFilter) {
        url = `${apiUrl}/timetablemodule/logs/dept/${encodeURIComponent(
          deptFilter
        )}?page=${currentPage}&limit=${limit}`;
      } else {
        url = `${apiUrl}/timetablemodule/logs/get?page=${currentPage}&limit=${limit}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        // For dept routes there is no total endpoint; use length to determine more pages
        setHasMore(Array.isArray(data) && data.length === limit);
        // Cache the full departments list when not filtering by dept
        if (!deptFilter && Array.isArray(data)) {
          const depts = [...new Set(data.map((l) => l.dept).filter(Boolean))];
          setAllDepts(depts);
        }
      } else {
        toast({
          title: 'Error fetching logs',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error fetching logs',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
  };
  const fetchTotalLogs = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/logs/total`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTotalLogs(data.totalLogs);
        setTotalPages(Math.max(1, Math.ceil(data.totalLogs / limit)));
      }
    } catch (error) {
      console.error('Error fetching total logs:', error);
    }
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
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const deleteSessionLogs = async (session) => {
    if (!session) {
      toast({
        title: 'Select a session first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    const confirmed = window.confirm(
      `Delete all logs for session "${session}"? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/logs/session/${encodeURIComponent(session)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        toast({
          title: `Deleted ${data.deletedCount || 0} logs`,
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        // refresh
        fetchLogs();
        fetchTotalLogs();
      } else {
        const err = await response.json();
        toast({
          title: 'Failed to delete logs',
          description: err.error || 'Server error',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast({
        title: 'Error deleting logs',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <VStack spacing={3} align="start">
            <Badge
              colorScheme="whiteAlpha"
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              Logs
            </Badge>
            <Heading size="2xl" color="white" fontWeight="bold">
              Timetable Change Logs
            </Heading>
            <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
              View all changes made to the timetable system.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1}>
        <Box
          bg={cardBg}
          borderRadius="2xl"
          shadow="xl"
          overflow="hidden"
          border="1px"
          borderColor={borderColor}
        >
          <Box bgGradient="linear(to-r, gray.700, gray.800)" p={6}>
            <HStack justify="space-between" align="center">
              <HStack spacing={3} align="center">
                <Box bg="whiteAlpha.200" p={2} borderRadius="lg">
                  <Icon as={FiList} boxSize={5} color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="white">
                    Change Logs
                  </Heading>
                  <Text color="whiteAlpha.800" fontSize="sm">
                    {totalLogs} total logs
                  </Text>
                </VStack>
              </HStack>

              {/* Mobile menu */}
              <Menu display={{ base: 'inline-flex', md: 'none' }}>
                <MenuButton
                  as={IconButton}
                  icon={<Icon as={FiFilter} />}
                  aria-label="Open filters"
                  variant="ghost"
                  color="white"
                  size="md"
                  _hover={{ bg: 'gray.700' }}
                  _active={{ bg: 'gray.700' }}
                  _focus={{ boxShadow: 'none' }}
                />
                <MenuList p={3} bg={cardBg} borderColor={borderColor}>
                  <VStack align="stretch" spacing={3}>
                    <Select
                      size="sm"
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      variant="unstyled"
                      focusBorderColor="transparent"
                      border="none"
                    >
                      <option value="">All Depts</option>
                      {(allDepts.length
                        ? allDepts
                        : [...new Set(logs.map((l) => l.dept).filter(Boolean))]
                      ).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Select>

                    <Select
                      size="sm"
                      value={sessionToDelete}
                      onChange={(e) => setSessionToDelete(e.target.value)}
                      placeholder="Select session"
                      variant="unstyled"
                      focusBorderColor="transparent"
                      border="none"
                    >
                      {sessions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>

                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => deleteSessionLogs(sessionToDelete)}
                    >
                      Delete Logs
                    </Button>
                  </VStack>
                </MenuList>
              </Menu>
            </HStack>
          </Box>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Time</Th>
                  <Th>User</Th>
                  <Th>Department & Session</Th>
                  <Th>Changes</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={8}>
                      <Text color="gray.500">No logs found.</Text>
                    </Td>
                  </Tr>
                ) : (
                  logs.map((log, index) => (
                    <Tr key={index} _hover={{ bg: 'gray.50' }}>
                      <Td py={5}>
                        <Text fontSize="sm" color="gray.600">
                          {formatTime(log.time)}
                        </Text>
                      </Td>
                      <Td py={5}>
                        <Text fontSize="sm" color="gray.800">
                          {log.userEmail}
                        </Text>
                      </Td>
                      <Td py={5}>
                        <Badge colorScheme="blue" variant="subtle">
                          {log.dept} - {log.session}
                        </Badge>
                      </Td>
                      <Td py={5}>
                        <Text fontSize="sm" color="gray.800">
                          <TimetableLockLog
                            facultyChanges={JSON.parse(log.changes)}
                          />
                        </Text>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          {/* Pagination Controls */}
          {totalLogs ? (
            <Box p={6} bg="gray.50" borderTop="1px" borderColor={borderColor}>
              <Flex align="center" justify="space-between">
                <HStack spacing={4}>
                  <Text fontSize="sm" color="gray.600">
                    Show per page:
                  </Text>
                  <Select
                    size="sm"
                    value={limit}
                    onChange={(e) =>
                      handleLimitChange(parseInt(e.target.value))
                    }
                    width="80px"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </Select>
                </HStack>

                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FiChevronLeft />}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    minW="100px"
                    textAlign="center"
                  >
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<FiChevronRight />}
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>
            </Box>
          ) : (
            <></>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Logs;
