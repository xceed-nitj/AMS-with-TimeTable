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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FaMinus, FaPlus, FaSearch, FaEye, FaDownload, FaEraser, FaChartBar, FaTable, FaBuilding, FaInfoCircle } from 'react-icons/fa';
import { DownloadIcon, ViewIcon, RepeatIcon, InfoIcon } from '@chakra-ui/icons';
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
        
        // Automatically select the first session (current session)
        if (uniqueSessions && uniqueSessions.length > 0) {
          setSelectedSession(uniqueSessions[0].session);
        }
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

  // Get all unique departments
  const departments = useMemo(() => {
    const depts = new Set();
    data.forEach(item => {
      if (item.offeringDept) {
        depts.add(item.offeringDept);
      }
    });
    return Array.from(depts).sort();
  }, [data]);

  // Calculate Faculty Load by Department
  const facultyLoadByDepartment = useMemo(() => {
    const deptData = {};

    departments.forEach(dept => {
      deptData[dept] = {};
    });

    data.forEach(item => {
      if (!item.subject || !item.faculty || !item.offeringDept) return;

      const dept = item.offeringDept;
      const faculty = item.faculty;
      const slotNum = parseInt(item.slot);
      const subType = item.subjectType?.toLowerCase() || 'other';
      const studentCount = parseInt(item.studentCount) || 0;

      if (!deptData[dept]) return;

      if (!deptData[dept][faculty]) {
        deptData[dept][faculty] = {
          faculty,
          department: dept,
          firstSlot: { theory: 0, laboratory: 0, tutorial: 0, total: 0 },
          secondSlot: { theory: 0, laboratory: 0, tutorial: 0, total: 0 },
          total: { theory: 0, laboratory: 0, tutorial: 0, total: 0 },
          studentCount: {
            theory: { total: 0, hours: 0 },
            laboratory: { total: 0, hours: 0 },
            tutorial: { total: 0, hours: 0 }
          }
        };
      }

      const facultyData = deptData[dept][faculty];

      // Count student hours
      if (subType === 'theory') {
        facultyData.studentCount.theory.total += studentCount;
        facultyData.studentCount.theory.hours += 1;
      } else if (subType === 'laboratory') {
        facultyData.studentCount.laboratory.total += studentCount;
        facultyData.studentCount.laboratory.hours += 1;
      } else if (subType === 'tutorial') {
        facultyData.studentCount.tutorial.total += studentCount;
        facultyData.studentCount.tutorial.hours += 1;
      }

      // First slot: only slot 1, Second slot: only slot 2
      if (slotNum === 1) {
        facultyData.firstSlot.total++;
        if (subType === 'theory') facultyData.firstSlot.theory++;
        else if (subType === 'laboratory') facultyData.firstSlot.laboratory++;
        else if (subType === 'tutorial') facultyData.firstSlot.tutorial++;
      } else if (slotNum === 2) {
        facultyData.secondSlot.total++;
        if (subType === 'theory') facultyData.secondSlot.theory++;
        else if (subType === 'laboratory') facultyData.secondSlot.laboratory++;
        else if (subType === 'tutorial') facultyData.secondSlot.tutorial++;
      }

      // Total (includes all slots)
      facultyData.total.total++;
      if (subType === 'theory') facultyData.total.theory++;
      else if (subType === 'laboratory') facultyData.total.laboratory++;
      else if (subType === 'tutorial') facultyData.total.tutorial++;
    });

    // Convert to array and calculate normalized values
    const result = {};
    Object.keys(deptData).forEach(dept => {
      result[dept] = Object.values(deptData[dept])
        .map(faculty => {
          const normalizedTheory = faculty.studentCount.theory.hours > 0 
            ? parseFloat((faculty.studentCount.theory.total / faculty.studentCount.theory.hours).toFixed(2))
            : 0;
          
          const normalizedLab = faculty.studentCount.laboratory.hours > 0
            ? parseFloat((faculty.studentCount.laboratory.total / faculty.studentCount.laboratory.hours).toFixed(2))
            : 0;
          
          const normalizedTutorial = faculty.studentCount.tutorial.hours > 0
            ? parseFloat((faculty.studentCount.tutorial.total / faculty.studentCount.tutorial.hours).toFixed(2))
            : 0;

          // Calculate normalized load
          // Formula: (Theory hrs × Normalized Theory Students) + (Tutorial hrs × Normalized Tutorial Students) + ((Lab hrs / 2) × Normalized Lab Students)
          const normalizedLoad = (
            (faculty.total.theory * normalizedTheory) +
            (faculty.total.tutorial * normalizedTutorial) +
            ((faculty.total.laboratory / 2) * normalizedLab)
          ).toFixed(2);

          return {
            ...faculty,
            sumFirstSecond: {
              theory: faculty.firstSlot.theory + faculty.secondSlot.theory,
              laboratory: faculty.firstSlot.laboratory + faculty.secondSlot.laboratory,
              tutorial: faculty.firstSlot.tutorial + faculty.secondSlot.tutorial,
              total: faculty.firstSlot.total + faculty.secondSlot.total
            },
            normalizedStudentCount: {
              theory: normalizedTheory.toFixed(2),
              laboratory: normalizedLab.toFixed(2),
              tutorial: normalizedTutorial.toFixed(2)
            },
            normalizedLoad: normalizedLoad
          };
        })
        .sort((a, b) => a.faculty.localeCompare(b.faculty));
    });

    return result;
  }, [data, departments]);

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

  const downloadDepartmentFacultyLoadCSV = (dept) => {
    const facultyList = facultyLoadByDepartment[dept] || [];
    
    const csvData = facultyList.map(item => ({
      'Faculty': item.faculty,
      'Department': item.department,
      'First Slot Theory': item.firstSlot.theory,
      'First Slot Laboratory': item.firstSlot.laboratory,
      'First Slot Tutorial': item.firstSlot.tutorial,
      'First Slot Total': item.firstSlot.total,
      'Second Slot Theory': item.secondSlot.theory,
      'Second Slot Laboratory': item.secondSlot.laboratory,
      'Second Slot Tutorial': item.secondSlot.tutorial,
      'Second Slot Total': item.secondSlot.total,
      'Sum (Slot 1 + 2) Theory': item.sumFirstSecond.theory,
      'Sum (Slot 1 + 2) Laboratory': item.sumFirstSecond.laboratory,
      'Sum (Slot 1 + 2) Tutorial': item.sumFirstSecond.tutorial,
      'Sum (Slot 1 + 2) Total': item.sumFirstSecond.total,
      'Total Theory': item.total.theory,
      'Total Laboratory': item.total.laboratory,
      'Total Tutorial': item.total.tutorial,
      'Total Load': item.total.total,
      'Normalized Student Count (Theory)': item.normalizedStudentCount.theory,
      'Normalized Student Count (Laboratory)': item.normalizedStudentCount.laboratory,
      'Normalized Student Count (Tutorial)': item.normalizedStudentCount.tutorial,
      'Normalized Load': item.normalizedLoad,
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${dept}-Faculty-Load-Analysis.csv`);
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
                  <Text>Faculty Load Analytics</Text>
                </HStack>
              </Badge>
              <Heading
                size={{ base: "xl", md: "2xl" }}
                color="white"
                fontWeight="bold"
                lineHeight="1.2"
              >
                Department Faculty Load Analysis
              </Heading>
              <Text
                color="whiteAlpha.900"
                fontSize={{ base: "md", md: "lg" }}
                maxW={{ base: "full", lg: "2xl" }}
              >
                Analyze faculty workload distribution across departments with normalized metrics
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
                <Heading size={{ base: "sm", md: "md" }}>Current Session</Heading>
              </CardHeader>
              <CardBody p={6}>
                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700" fontSize="sm">
                    Academic Session
                  </FormLabel>
                  <Select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
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

            {selectedSession && (
              <>
                {loading ? (
                  <Card
                    bg="white"
                    borderRadius="2xl"
                    shadow="2xl"
                    border="1px"
                    borderColor="gray.300"
                  >
                    <CardBody p={12} textAlign="center">
                      <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="teal.500"
                        size="xl"
                      />
                      <Text mt={4} color="gray.600">Loading timetable data...</Text>
                    </CardBody>
                  </Card>
                ) : error ? (
                  <Card
                    bg="white"
                    borderRadius="2xl"
                    shadow="2xl"
                    border="1px"
                    borderColor="gray.300"
                  >
                    <CardBody p={6}>
                      <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>{error.message}</AlertDescription>
                      </Alert>
                    </CardBody>
                  </Card>
                ) : (
                  <>
                    {/* Department Tabs */}
                    <Card
                      bg="white"
                      borderRadius="2xl"
                      shadow="2xl"
                      border="1px"
                      borderColor="gray.300"
                      overflow="hidden"
                    >
                      <CardHeader bg="purple.600" color="white" p={4}>
                        <HStack spacing={2}>
                          <FaBuilding />
                          <Heading size={{ base: "sm", md: "md" }}>Department-wise Faculty Load Analysis</Heading>
                        </HStack>
                      </CardHeader>
                      <Tabs colorScheme="teal" isLazy>
                        <TabList overflowX="auto" overflowY="hidden" flexWrap="nowrap">
                          {departments.map((dept) => (
                            <Tab key={dept}>
                              <Text fontSize={{ base: "xs", md: "sm" }} whiteSpace="nowrap">
                                {dept}
                              </Text>
                            </Tab>
                          ))}
                        </TabList>

                        <TabPanels>
                          {/* Department Tabs */}
                          {departments.map((dept) => (
                            <TabPanel key={dept} p={0}>
                              <Box p={6} borderBottom="1px" borderColor="gray.200">
                                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                                  <VStack align="start" spacing={0}>
                                    <Heading size={{ base: "sm", md: "md" }}>{dept} - Faculty Load Analysis</Heading>
                                    <Text fontSize="xs" color="gray.600" mt={1}>
                                      Load distribution by faculty (Slot 1 and Slot 2 only)
                                    </Text>
                                  </VStack>
                                  <Button
                                    leftIcon={<DownloadIcon />}
                                    onClick={() => downloadDepartmentFacultyLoadCSV(dept)}
                                    colorScheme="green"
                                    size={{ base: "sm", md: "md" }}
                                  >
                                    Download CSV
                                  </Button>
                                </Flex>
                              </Box>

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
                                <Table variant="simple" size={{ base: "sm", md: "md" }}>
                                  <Thead bg="teal.50">
                                    <Tr>
                                      <Th
                                        rowSpan={2}
                                        color="teal.700"
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold"
                                        borderBottom="2px"
                                        borderColor="teal.200"
                                        verticalAlign="middle"
                                        minW="150px"
                                      >
                                        Faculty
                                      </Th>
                                      <Th
                                        colSpan={4}
                                        color="blue.700"
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold"
                                        textAlign="center"
                                        borderBottom="2px"
                                        borderColor="teal.200"
                                        bg="blue.50"
                                      >
                                        Slot 1
                                      </Th>
                                      <Th
                                        colSpan={4}
                                        color="purple.700"
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold"
                                        textAlign="center"
                                        borderBottom="2px"
                                        borderColor="teal.200"
                                        bg="purple.50"
                                      >
                                        Slot 2
                                      </Th>
                                      <Th
                                        colSpan={4}
                                        color="orange.700"
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold"
                                        textAlign="center"
                                        borderBottom="2px"
                                        borderColor="teal.200"
                                        bg="orange.50"
                                      >
                                        Sum (Slot 1 + 2)
                                      </Th>
                                      <Th
                                        colSpan={4}
                                        color="green.700"
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold"
                                        textAlign="center"
                                        borderBottom="2px"
                                        borderColor="teal.200"
                                        bg="green.50"
                                      >
                                        Total Load
                                      </Th>
                                      <Th
                                        colSpan={3}
                                        color="pink.700"
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold"
                                        textAlign="center"
                                        borderBottom="2px"
                                        borderColor="teal.200"
                                        bg="pink.50"
                                      >
                                        <HStack spacing={1} justify="center">
                                          <Text>Normalized Student Count</Text>
                                          <Tooltip
                                            label={
                                              <Box p={2}>
                                                <Text fontWeight="bold" mb={2}>Calculation:</Text>
                                                <Text fontSize="xs">
                                                  Total Students ÷ Total Hours
                                                </Text>
                                                <Text fontSize="xs" mt={2}>
                                                  (Calculated separately for Theory, Lab, and Tutorial)
                                                </Text>
                                              </Box>
                                            }
                                            placement="top"
                                            hasArrow
                                            bg="gray.700"
                                            color="white"
                                            fontSize="xs"
                                          >
                                            <InfoIcon boxSize={3} cursor="pointer" />
                                          </Tooltip>
                                        </HStack>
                                      </Th>
                                      <Th
                                        rowSpan={2}
                                        color="yellow.800"
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold"
                                        textAlign="center"
                                        borderBottom="2px"
                                        borderColor="teal.200"
                                        bg="yellow.50"
                                        verticalAlign="middle"
                                      >
                                        <VStack spacing={1}>
                                          <HStack spacing={1}>
                                            <Text>Normalized Load</Text>
                                            <Tooltip
                                              label={
                                                <Box p={2}>
                                                  <Text fontWeight="bold" mb={2}>Calculation Formula:</Text>
                                                  <Text fontSize="xs">
                                                    (Theory hrs × Norm. Theory Students) +
                                                  </Text>
                                                  <Text fontSize="xs">
                                                    (Tutorial hrs × Norm. Tutorial Students) +
                                                  </Text>
                                                  <Text fontSize="xs">
                                                    ((Lab hrs ÷ 2) × Norm. Lab Students)
                                                  </Text>
                                                  <Text fontSize="xs" mt={2} fontStyle="italic">
                                                    Note: Lab hours are weighted at 0.5
                                                  </Text>
                                                </Box>
                                              }
                                              placement="top"
                                              hasArrow
                                              bg="gray.700"
                                              color="white"
                                              fontSize="xs"
                                            >
                                              <InfoIcon boxSize={3} cursor="pointer" />
                                            </Tooltip>
                                          </HStack>
                                        </VStack>
                                      </Th>
                                    </Tr>
                                    <Tr>
                                      {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
                                        <Th
                                          key={`first-${idx}`}
                                          color="blue.700"
                                          fontSize={{ base: "2xs", md: "xs" }}
                                          textAlign="center"
                                          borderBottom="2px"
                                          borderColor="teal.200"
                                          bg="blue.50"
                                        >
                                          {label}
                                        </Th>
                                      ))}
                                      {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
                                        <Th
                                          key={`second-${idx}`}
                                          color="purple.700"
                                          fontSize={{ base: "2xs", md: "xs" }}
                                          textAlign="center"
                                          borderBottom="2px"
                                          borderColor="teal.200"
                                          bg="purple.50"
                                        >
                                          {label}
                                        </Th>
                                      ))}
                                      {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
                                        <Th
                                          key={`sum-${idx}`}
                                          color="orange.700"
                                          fontSize={{ base: "2xs", md: "xs" }}
                                          textAlign="center"
                                          borderBottom="2px"
                                          borderColor="teal.200"
                                          bg="orange.50"
                                        >
                                          {label}
                                        </Th>
                                      ))}
                                      {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
                                        <Th
                                          key={`total-${idx}`}
                                          color="green.700"
                                          fontSize={{ base: "2xs", md: "xs" }}
                                          textAlign="center"
                                          borderBottom="2px"
                                          borderColor="teal.200"
                                          bg="green.50"
                                        >
                                          {label}
                                        </Th>
                                      ))}
                                      {['Th', 'Lab', 'Tut'].map((label, idx) => (
                                        <Th
                                          key={`norm-${idx}`}
                                          color="pink.700"
                                          fontSize={{ base: "2xs", md: "xs" }}
                                          textAlign="center"
                                          borderBottom="2px"
                                          borderColor="teal.200"
                                          bg="pink.50"
                                        >
                                          {label}
                                        </Th>
                                      ))}
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {(facultyLoadByDepartment[dept] || []).map((faculty, index) => (
                                      <Tr
                                        key={index}
                                        bg={index % 2 === 0 ? "white" : "gray.50"}
                                        _hover={{ bg: "teal.50" }}
                                      >
                                        <Td 
                                          fontWeight="bold" 
                                          fontSize={{ base: "xs", md: "sm" }}
                                          whiteSpace="normal"
                                          wordBreak="break-word"
                                        >
                                          {faculty.faculty}
                                        </Td>
                                        {/* Slot 1 */}
                                        <Td textAlign="center" bg="blue.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="green" fontSize="xs">{faculty.firstSlot.theory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="blue.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="red" fontSize="xs">{faculty.firstSlot.laboratory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="blue.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="orange" fontSize="xs">{faculty.firstSlot.tutorial}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="blue.100" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                          {faculty.firstSlot.total}
                                        </Td>
                                        {/* Slot 2 */}
                                        <Td textAlign="center" bg="purple.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="green" fontSize="xs">{faculty.secondSlot.theory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="purple.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="red" fontSize="xs">{faculty.secondSlot.laboratory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="purple.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="orange" fontSize="xs">{faculty.secondSlot.tutorial}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="purple.100" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                          {faculty.secondSlot.total}
                                        </Td>
                                        {/* Sum */}
                                        <Td textAlign="center" bg="orange.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="green" fontSize="xs">{faculty.sumFirstSecond.theory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="orange.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="red" fontSize="xs">{faculty.sumFirstSecond.laboratory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="orange.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="orange" fontSize="xs">{faculty.sumFirstSecond.tutorial}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="orange.100" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                          {faculty.sumFirstSecond.total}
                                        </Td>
                                        {/* Total */}
                                        <Td textAlign="center" bg="green.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="green" fontSize="xs">{faculty.total.theory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="green.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="red" fontSize="xs">{faculty.total.laboratory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="green.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="orange" fontSize="xs">{faculty.total.tutorial}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="green.100" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                          {faculty.total.total}
                                        </Td>
                                        {/* Normalized Student Count */}
                                        <Td textAlign="center" bg="pink.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="cyan" fontSize="xs">{faculty.normalizedStudentCount.theory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="pink.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="cyan" fontSize="xs">{faculty.normalizedStudentCount.laboratory}</Badge>
                                        </Td>
                                        <Td textAlign="center" bg="pink.50" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="cyan" fontSize="xs">{faculty.normalizedStudentCount.tutorial}</Badge>
                                        </Td>
                                        {/* Normalized Load */}
                                        <Td textAlign="center" bg="yellow.50" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                          <Badge colorScheme="yellow" fontSize="xs" px={3} py={1}>
                                            {faculty.normalizedLoad}
                                          </Badge>
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </Box>
                            </TabPanel>
                          ))}
                        </TabPanels>
                      </Tabs>
                    </Card>
                  </>
                )}
              </>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default MasterLoadDataTable;