import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  HStack,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  FormControl,
  FormLabel,
  Select,
  Button,
  Input,
  VStack,
  Text,
  IconButton,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Flex,
  SimpleGrid,
  Tooltip,
  AlertDescription,
} from '@chakra-ui/react';
import { FaMinus, FaPlus, FaSearch, FaEye, FaDownload, FaEraser } from 'react-icons/fa';
import { DownloadIcon, ViewIcon, RepeatIcon } from '@chakra-ui/icons';
import { Parser } from '@json2csv/plainjs';
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

const MasterLoadDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [filters, setFilters] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const apiUrl = getEnvironment();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const { uniqueSessions } = data;
        setAllSessions(uniqueSessions);
      } catch (error) {
        console.error('Error fetching session and department data:', error);
      }
    };
    fetchSessions();
  }, [apiUrl]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSession) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/mastertable/session/${selectedSession}`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiUrl, selectedSession]);

  const handleFilterChange = (column, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [column]: value
    }));
  };

  const handleSearchChange = (column, value) => {
    setSearchTerms(prevTerms => ({
      ...prevTerms,
      [column]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerms({});
  };

  const columns = [
    { label: "Subject Full Name", key: "subjectFullName" },
    { label: "Faculty", key: "faculty" },
    { label: "Offering Dept", key: "offeringDept" },
    { label: "Room", key: "room" },
    { label: "Subject Type", key: "subjectType" },
    { label: "Subject Dept", key: "subjectDept" },
    { label: "Sem", key: "sem" },
    { label: "Year", key: "year" },
    { label: "Degree", key: "degree" },
    { label: "Subject Code", key: "subjectCode" },
    { label: "Subject", key: "subject" },
    { label: "Subject Credit", key: "subjectCredit" },
    { label: "Load", key: "count" },
  ];

  const mergeAndFilterData = (data) => {
    const groupedData = data.reduce((acc, item) => {
      const key = `${item.subjectCode}-${item.subjectFullName}-${item.faculty}-${item.sem}-${item.subjectType}`;
      if (!acc[key]) {
        acc[key] = { ...item, count: 1 };
        delete acc[key].day;
        delete acc[key].slot;
      } else {
        acc[key].count += 1;
        Object.keys(item).forEach(field => {
          if (field !== 'subjectCode' && field !== 'subjectType' && field !== 'faculty' && field !== 'day' && field !== 'slot') {
            if (Array.isArray(acc[key][field])) {
              if (!acc[key][field].includes(item[field])) {
                acc[key][field].push(item[field]);
              }
            } else {
              acc[key][field] = [acc[key][field], item[field]];
            }
          }
        });
      }
      return acc;
    }, {});

    return Object.values(groupedData).map(item => {
      const processedItem = { ...item };
      Object.keys(processedItem).forEach(field => {
        if (Array.isArray(processedItem[field])) {
          if (field === 'faculty') {
            processedItem[field] = Array.from(new Set(processedItem[field])).sort().join(', ');
          } else {
            processedItem[field] = Array.from(new Set(processedItem[field])).join(', ');
          }
        }
      });
      return processedItem;
    });
  };

  const filteredData = useMemo(() => {
    const filtered = data.filter(item =>
      item.subject && item.faculty &&
      Object.entries(filters).every(([key, value]) => {
        const itemValue = item[key];
        return !value || (itemValue && itemValue.toString().toLowerCase() === value.toLowerCase());
      }) &&
      Object.entries(searchTerms).every(([key, term]) => {
        const itemValue = item[key];
        return !term || (itemValue && itemValue.toString().toLowerCase().includes(term.toLowerCase()));
      })
    );
    return mergeAndFilterData(filtered);
  }, [data, filters, searchTerms]);

  const filterOptions = useMemo(() => {
    return columns.reduce((acc, { key }) => {
      const columnValues = filteredData.map(item => item[key]).filter(value => value !== undefined && value !== null);
      acc[key] = Array.from(new Set(columnValues)).filter(Boolean).sort((a, b) => a.toString().localeCompare(b.toString()));
      return acc;
    }, {});
  }, [filteredData, columns]);

  const downloadCSV = () => {
    const visibleColumns = columns.filter(c => !hiddenColumns.includes(c.key));
    const csvData = filteredData.map(item => {
      const filteredItem = {};
      visibleColumns.forEach(({ key }) => {
        filteredItem[key] = item[key];
      });
      return filteredItem;
    });

    const parser = new Parser({ fields: visibleColumns.map(c => c.key) });
    const csv = parser.parse(csvData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Timetable-XCEED.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <Helmet>
        <title>Master Search Timetable | XCEED NITJ</title>
        <meta name="description" content="NITJ's official timetable search engine for all semesters and courses" />
      </Helmet>

      <Box bg="white" minH="100vh">
        {/* Hero Header Section */}
        <Box
          bgGradient="linear(to-r, teal.400, green.500, blue.500)"
          pt={0}
          pb={{ base: 16, md: 20, lg: 24 }}
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

          {/* Header/Navbar integrated into hero */}
          <Box
            position="relative"
            zIndex={2}
            sx={{
              '& button[aria-label="Go back"]': { display: "none" },
              '& .chakra-button:first-of-type': { display: "none" },
            }}
          >
            <Header />
          </Box>

          <Container
            maxW="7xl"
            position="relative"
            mt={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6, lg: 8 }}
          >
            <VStack
              spacing={{ base: 3, md: 4 }}
              align={{ base: "center", lg: "start" }}
              textAlign={{ base: "center", lg: "left" }}
            >
              <Badge
                colorScheme="whiteAlpha"
                fontSize={{ base: "xs", md: "sm" }}
                px={{ base: 2, md: 3 }}
                py={1}
                borderRadius="full"
              >
                <HStack spacing={1}>
                  <FaSearch size={12} />
                  <Text>Advanced Search</Text>
                </HStack>
              </Badge>
              <Heading
                size={{ base: "xl", md: "2xl" }}
                color="white"
                fontWeight="bold"
                lineHeight="1.2"
              >
                Timetable Master Search
              </Heading>
              <Text
                color="whiteAlpha.900"
                fontSize={{ base: "md", md: "lg" }}
                maxW={{ base: "full", lg: "2xl" }}
              >
                Search and filter timetable data across all sessions with advanced filtering options
              </Text>
            </VStack>
          </Container>
        </Box>

        <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={6} align="stretch">
            {/* Session Selection Card */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="teal.600" color="white" p={4}>
                <Heading size={{ base: "sm", md: "md" }}>Select Session</Heading>
              </CardHeader>
              <CardBody p={6}>
                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700" fontSize="sm">
                    Academic Session
                  </FormLabel>
                  <Select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    placeholder="Select Session"
                    borderColor="teal.300"
                    _hover={{ borderColor: "teal.400" }}
                    _focus={{
                      borderColor: "teal.500",
                      boxShadow: "0 0 0 1px #319795",
                    }}
                    size="lg"
                  >
                    {allSessions.map((session, index) => (
                      <option key={index} value={session.session}>
                        {session.session}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </CardBody>
            </Card>

            {/* Action Buttons Card */}
            {selectedSession && (
              <Card
                bg="white"
                borderRadius="2xl"
                shadow="2xl"
                border="1px"
                borderColor="gray.300"
                overflow="hidden"
              >
                <CardHeader bg="purple.600" color="white" p={4}>
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                    <Heading size={{ base: "sm", md: "md" }}>Actions</Heading>
                    <Badge colorScheme="orange" fontSize={{ base: "sm", md: "md" }} px={3} py={1}>
                      {filteredData.length} Records
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody p={6}>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                    <Button
                      leftIcon={<RepeatIcon />}
                      onClick={clearFilters}
                      colorScheme="blue"
                      size={{ base: "sm", md: "md" }}
                    >
                      Clear Filters
                    </Button>

                    {hiddenColumns.length > 0 && (
                      <Button
                        leftIcon={<ViewIcon />}
                        onClick={() => setHiddenColumns([])}
                        colorScheme="purple"
                        size={{ base: "sm", md: "md" }}
                      >
                        Show All Columns
                      </Button>
                    )}

                    <Button
                      leftIcon={<DownloadIcon />}
                      onClick={downloadCSV}
                      colorScheme="green"
                      size={{ base: "sm", md: "md" }}
                      gridColumn={{ base: "1", sm: hiddenColumns.length > 0 ? "auto" : "span 2", md: "auto" }}
                    >
                      Download CSV
                    </Button>
                  </SimpleGrid>

                  {hiddenColumns.length > 0 && (
                    <Box mt={4}>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                        Hidden Columns ({hiddenColumns.length}):
                      </Text>
                      <Flex flexWrap="wrap" gap={2}>
                        {hiddenColumns.map((colKey) => {
                          const col = columns.find(c => c.key === colKey);
                          return (
                            <Badge
                              key={colKey}
                              colorScheme="red"
                              fontSize="xs"
                              px={2}
                              py={1}
                              cursor="pointer"
                              onClick={() => setHiddenColumns(hiddenColumns.filter(k => k !== colKey))}
                              _hover={{ transform: 'scale(1.05)' }}
                              transition="all 0.2s"
                            >
                              <HStack spacing={1}>
                                <Text>{col?.label}</Text>
                                <FaPlus size={10} />
                              </HStack>
                            </Badge>
                          );
                        })}
                      </Flex>
                    </Box>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Data Table Card */}
            {selectedSession && (
              <Card
                bg="white"
                borderRadius="2xl"
                shadow="2xl"
                border="1px"
                borderColor="gray.300"
                overflow="hidden"
              >
                <CardHeader bg="teal.600" color="white" p={4}>
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                    <VStack align="start" spacing={0}>
                      <Heading size={{ base: "sm", md: "md" }}>Search Results</Heading>
                      <Text fontSize="xs" color="whiteAlpha.800" mt={1}>
                        Session: {selectedSession}
                      </Text>
                    </VStack>
                    <Badge colorScheme="orange" fontSize={{ base: "sm", md: "md" }} px={3} py={1}>
                      {columns.length - hiddenColumns.length} / {columns.length} Columns
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody p={0}>
                  {loading ? (
                    <Box p={12} textAlign="center">
                      <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="teal.500"
                        size="xl"
                      />
                      <Text mt={4} color="gray.600">Loading timetable data...</Text>
                    </Box>
                  ) : error ? (
                    <Box p={6}>
                      <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>{error.message}</AlertDescription>
                      </Alert>
                    </Box>
                  ) : filteredData.length === 0 ? (
                    <Box p={6}>
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>
                          No data found matching your filters. Try adjusting your search criteria.
                        </AlertDescription>
                      </Alert>
                    </Box>
                  ) : (
                    <Box
                      overflowX="auto"
                      w="100%"
                      sx={{
                        '&::-webkit-scrollbar': {
                          height: '10px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'gray.100',
                          borderRadius: 'full',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'teal.400',
                          borderRadius: 'full',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: 'teal.500',
                        },
                      }}
                    >
                      <Table
                        variant="simple"
                        size={{ base: "sm", md: "md" }}
                        sx={{
                          tableLayout: "auto",
                          width: "100%",
                        }}
                      >
                        <Thead bg="teal.50">
                          <Tr>
                            {columns.filter(c => !hiddenColumns.includes(c.key)).map(({ label, key }) => (
                              <Th
                                key={key}
                                color="teal.700"
                                fontSize={{ base: "xs", md: "sm" }}
                                fontWeight="bold"
                                borderBottom="2px"
                                borderColor="teal.200"
                                p={{ base: 2, md: 3 }}
                                minW="150px"
                              >
                                <VStack align="stretch" spacing={2}>
                                  <HStack justifyContent="space-between">
                                    <Text fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                      {label}
                                    </Text>
                                    <Tooltip label="Hide column" placement="top" hasArrow bg="red.600" fontSize="xs">
                                      <IconButton
                                        icon={<FaMinus />}
                                        size="xs"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => setHiddenColumns([...hiddenColumns, key])}
                                        aria-label={`Hide ${label}`}
                                      />
                                    </Tooltip>
                                  </HStack>
                                  <Input
                                    placeholder={`Search...`}
                                    size="sm"
                                    value={searchTerms[key] || ''}
                                    onChange={(e) => handleSearchChange(key, e.target.value)}
                                    borderColor="teal.300"
                                    _hover={{ borderColor: "teal.400" }}
                                    _focus={{
                                      borderColor: "teal.500",
                                      boxShadow: "0 0 0 1px #319795",
                                    }}
                                    fontSize={{ base: "xs", md: "sm" }}
                                  />
                                  <Select
                                    size="sm"
                                    onChange={(e) => handleFilterChange(key, e.target.value)}
                                    value={filters[key] || ''}
                                    borderColor="teal.300"
                                    _hover={{ borderColor: "teal.400" }}
                                    _focus={{
                                      borderColor: "teal.500",
                                      boxShadow: "0 0 0 1px #319795",
                                    }}
                                    fontSize={{ base: "xs", md: "sm" }}
                                  >
                                    <option value="">All</option>
                                    {filterOptions[key] && filterOptions[key].map((value) => (
                                      <option key={value} value={value}>{value}</option>
                                    ))}
                                  </Select>
                                </VStack>
                              </Th>
                            ))}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredData.map((item, index) => (
                            <Tr
                              key={index}
                              bg={index % 2 === 0 ? "white" : "gray.50"}
                              _hover={{ bg: "teal.50" }}
                              transition="background 0.2s"
                            >
                              {columns.filter(c => !hiddenColumns.includes(c.key)).map(({ key }) => (
                                <Td
                                  key={key}
                                  fontSize={{ base: "xs", md: "sm" }}
                                  whiteSpace="normal"
                                  wordBreak="break-word"
                                  p={{ base: 2, md: 3 }}
                                >
                                  {item[key] !== undefined && item[key] !== null ? (
                                    key === 'count' ? (
                                      <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                                        {item[key].toString()}
                                      </Badge>
                                    ) : key === 'subjectType' ? (
                                      <Badge
                                        colorScheme={
                                          item[key]?.toLowerCase() === 'theory' ? 'green' :
                                          item[key]?.toLowerCase() === 'tutorial' ? 'orange' :
                                          item[key]?.toLowerCase() === 'laboratory' ? 'red' : 'gray'
                                        }
                                        fontSize="xs"
                                        px={2}
                                        py={1}
                                      >
                                        {item[key].toString()}
                                      </Badge>
                                    ) : (
                                      item[key].toString()
                                    )
                                  ) : ''}
                                </Td>
                              ))}
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </CardBody>
              </Card>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default MasterLoadDataTable;