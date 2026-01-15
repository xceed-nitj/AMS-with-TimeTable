import React, { useState, useEffect, useCallback } from 'react';
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
  Menu,
  MenuButton,
  MenuList,
  IconButton,
  useDisclosure,
  Collapse,
  Divider,
  List,
  ListItem,
  ListIcon,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import {
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiTrash2,
  FiPlusCircle,
  FiMinusCircle,
  FiEdit,
  FiClock,
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
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
  const { isOpen, onToggle } = useDisclosure();

  // Summary counts for the "Short Form"
  const totalAdded = facultyChanges.reduce(
    (acc, f) => acc + (f.changes.addedSubjects?.length || 0),
    0
  );
  const totalRemoved = facultyChanges.reduce(
    (acc, f) => acc + (f.changes.removedSubjects?.length || 0),
    0
  );
  const totalUpdated = facultyChanges.reduce(
    (acc, f) => acc + (f.changes.updatedSubjects?.length || 0),
    0
  );

  return (
    <Box>
      {/* Summary View (Short Form) */}
      <HStack wrap="wrap" spacing={2} mb={isOpen ? 4 : 0}>
        {totalAdded > 0 && (
          <Tag size="sm" colorScheme="green" variant="subtle">
            <TagLabel>+{totalAdded} Added</TagLabel>
          </Tag>
        )}
        {totalUpdated > 0 && (
          <Tag size="sm" colorScheme="blue" variant="subtle">
            <TagLabel>~{totalUpdated} Updated</TagLabel>
          </Tag>
        )}
        {totalRemoved > 0 && (
          <Tag size="sm" colorScheme="red" variant="subtle">
            <TagLabel>-{totalRemoved} Removed</TagLabel>
          </Tag>
        )}

        <Button
          size="xs"
          variant="ghost"
          colorScheme="purple"
          onClick={onToggle}
          rightIcon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
        >
          {isOpen ? 'Show Less' : 'View Details'}
        </Button>
      </HStack>

      {/* Expanded View */}
      <Collapse in={isOpen} animateOpacity>
        <VStack
          align="stretch"
          spacing={4}
          mt={4}
          p={3}
          bg="gray.50"
          borderRadius="md"
          border="1px"
          borderColor="gray.100"
        >
          {facultyChanges.map(({ faculty, changes }, idx) => (
            <Box key={idx} pb={idx !== facultyChanges.length - 1 ? 3 : 0}>
              <Text
                fontWeight="bold"
                fontSize="sm"
                color="gray.700"
                mb={2}
                borderBottom="1px solid"
                borderColor="gray.200"
              >
                Faculty: {faculty}
              </Text>

              <VStack align="stretch" spacing={3} pl={2}>
                {/* ADDED SECTION */}
                {changes.addedSubjects?.map((s, i) => (
                  <Box key={`add-${i}`}>
                    <HStack fontSize="xs" fontWeight="bold" color="green.600">
                      <Icon as={FiPlusCircle} />
                      <Text>
                        {s.subject} ({s.sem})
                      </Text>
                    </HStack>
                    <List spacing={1} ml={5} mt={1}>
                      {s.entries.map((e, j) => (
                        <ListItem key={j} fontSize="xs" color="gray.600">
                          <Icon as={FiClock} mr={1} /> {e.day},{' '}
                          {SLOT_TIME_MAP[e.slot]}
                          <Icon as={FiMapPin} ml={2} mr={1} /> Room {e.room}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}

                {/* UPDATED SECTION */}
                {changes.updatedSubjects?.map((u, i) => (
                  <Box key={`upd-${i}`}>
                    <HStack fontSize="xs" fontWeight="bold" color="blue.600">
                      <Icon as={FiEdit} />
                      <Text>
                        {u.subject} ({u.sem})
                      </Text>
                    </HStack>
                    <VStack align="stretch" ml={5} mt={1} spacing={1}>
                      {u.changes.room && (
                        <Text fontSize="xs" color="gray.600">
                          <b>Room:</b> {u.changes.room.from.join(', ')} →{' '}
                          <b>{u.changes.room.to.join(', ')}</b>
                        </Text>
                      )}
                      {u.changes.slots?.added?.length > 0 && (
                        <Text fontSize="xs" color="gray.600">
                          <Text as="span" color="green.600" fontWeight="bold">
                            Added:
                          </Text>{' '}
                          {u.changes.slots.added.join(', ')}
                        </Text>
                      )}
                      {u.changes.slots?.removed?.length > 0 && (
                        <Text fontSize="xs" color="gray.600">
                          <Text as="span" color="red.600" fontWeight="bold">
                            Removed:
                          </Text>{' '}
                          {u.changes.slots.removed.join(', ')}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                ))}

                {/* REMOVED SECTION */}
                {changes.removedSubjects?.map((s, i) => (
                  <HStack
                    key={`rem-${i}`}
                    fontSize="xs"
                    color="red.500"
                    fontWeight="medium"
                  >
                    <Icon as={FiMinusCircle} />
                    <Text strikeThrough>
                      {s.subject} ({s.sem}) Removed
                    </Text>
                  </HStack>
                ))}
              </VStack>
              {idx !== facultyChanges.length - 1 && <Divider mt={4} />}
            </Box>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};

const Logs = () => {
  const apiUrl = getEnvironment();
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allDepts, setAllDepts] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState('');
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'gray.900'
  );
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  const formatTime = (iso) =>
    new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/allotment/session`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    }
  }, [apiUrl]);

  const fetchTotal = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/timetablemodule/logs/total`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setTotalLogs(data.totalLogs || 0);
    } catch (e) {
      console.error(e);
    }
  }, [apiUrl]);

  const fetchLogs = useCallback(async () => {
    try {
      let url = `${apiUrl}/timetablemodule/logs/get?page=${currentPage}&limit=${limit}`;
      if (deptFilter && sessionFilter)
        url = `${apiUrl}/timetablemodule/logs/dept/${encodeURIComponent(
          deptFilter
        )}?session=${encodeURIComponent(
          sessionFilter
        )}&page=${currentPage}&limit=${limit}`;
      else if (deptFilter)
        url = `${apiUrl}/timetablemodule/logs/dept/${encodeURIComponent(
          deptFilter
        )}?page=${currentPage}&limit=${limit}`;
      else if (sessionFilter)
        url = `${apiUrl}/timetablemodule/logs/session/${encodeURIComponent(
          sessionFilter
        )}?page=${currentPage}&limit=${limit}`;

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        toast({
          title: 'Error fetching logs',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const data = await res.json();
      // support both older array responses and new { logs, totalLogs } shape
      const receivedLogs = Array.isArray(data) ? data : data.logs || [];
      const receivedTotal = Array.isArray(data)
        ? receivedLogs.length
        : data.totalLogs || 0;
      setLogs(receivedLogs);
      setTotalLogs(receivedTotal);
      if (!deptFilter)
        setAllDepts([
          ...new Set(receivedLogs.map((l) => l.dept).filter(Boolean)),
        ]);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error fetching logs',
        description: e.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [apiUrl, currentPage, limit, deptFilter, sessionFilter, toast]);

  useEffect(() => {
    fetchSessions();
    fetchTotal();
  }, [fetchSessions, fetchTotal]);
  useEffect(() => {
    setCurrentPage(1);
    fetchLogs();
  }, [deptFilter, sessionFilter, limit, fetchLogs]);

  const deleteSessionLogs = async (session) => {
    if (!session)
      return toast({
        title: 'Select a session first',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      });
    if (
      !window.confirm(
        `Delete all logs for session "${session}"? This cannot be undone.`
      )
    )
      return;
    try {
      const res = await fetch(
        `${apiUrl}/timetablemodule/logs/session/${encodeURIComponent(session)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok)
        return toast({
          title: 'Failed to delete logs',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      const data = await res.json();
      toast({
        title: `Deleted ${data.deletedCount || 0} logs`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
      fetchLogs();
      fetchTotal();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error deleting logs',
        description: e.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
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

              <HStack spacing={3}>
                <Menu>
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
                          : [
                              ...new Set(
                                logs.map((l) => l.dept).filter(Boolean)
                              ),
                            ]
                        ).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>

                      <Select
                        size="sm"
                        value={sessionFilter}
                        onChange={(e) => setSessionFilter(e.target.value)}
                        variant="unstyled"
                        focusBorderColor="transparent"
                        border="none"
                      >
                        <option value="">All Sessions</option>
                        {sessions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </VStack>
                  </MenuList>
                </Menu>

                {/* Delete session: visible on all sizes */}
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<Icon as={FiTrash2} />}
                    aria-label="Select session to delete"
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
                        value={sessionToDelete}
                        onChange={(e) => setSessionToDelete(e.target.value)}
                        placeholder="Select session"
                        variant="unstyled"
                        focusBorderColor="transparent"
                        border="none"
                      >
                        <option value="">Select session</option>
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
                  logs.map((log, i) => (
                    <Tr key={i} _hover={{ bg: 'gray.50' }}>
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
                        <TimetableLockLog
                          facultyChanges={(() => {
                            try {
                              return JSON.parse(log.changes);
                            } catch {
                              return [];
                            }
                          })()}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          <Box p={6} bg="gray.50" borderTop="1px" borderColor={borderColor}>
            <Flex align="center" justify="space-between">
              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  Show per page:
                </Text>
                <Select
                  size="sm"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  Page {currentPage} of{' '}
                  {Math.max(1, Math.ceil(totalLogs / limit))}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={<FiChevronRight />}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(p + 1, Math.max(1, Math.ceil(totalLogs / limit)))
                    )
                  }
                  isDisabled={
                    currentPage === Math.max(1, Math.ceil(totalLogs / limit))
                  }
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Logs;
