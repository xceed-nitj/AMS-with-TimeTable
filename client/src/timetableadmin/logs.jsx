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
} from '@chakra-ui/react';
import { FiList, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const apiUrl = getEnvironment();
  const toast = useToast();

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'gray.900'
  );
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');

  useEffect(() => {
    fetchLogs();
    fetchTotalLogs();
    setTotalPages(totalLogs / limit === 0 ? 1 : Math.ceil(totalLogs / limit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/logs/get?page=${currentPage}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
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
      }
    } catch (error) {
      console.error('Error fetching total logs:', error);
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
            <HStack justify="space-between">
              <HStack spacing={3}>
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
