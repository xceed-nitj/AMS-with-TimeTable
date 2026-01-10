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
  const [dataCurrent, setDataCurrent] = useState([]);
  const [dataPrevious, setDataPrevious] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [previousSession, setPreviousSession] = useState('');
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
          if (uniqueSessions.length > 1) {
            setPreviousSession(uniqueSessions[1].session);
          }
        }
      } catch (error) {
        console.error('Error fetching session and department data:', error);
      }
    };
    fetchSessions();
  }, [apiUrl]);
  useEffect(() => {
    const fetchDataCurrent = async () => {
      if (!selectedSession) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/mastertable/session/${selectedSession}`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const fetchedData = await response.json();
        setDataCurrent(fetchedData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataCurrent();
  }, [apiUrl, selectedSession]);
  useEffect(() => {
    const fetchDataPrevious = async () => {
      if (!previousSession) return;
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/mastertable/session/${previousSession}`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const fetchedData = await response.json();
        setDataPrevious(fetchedData);
      } catch (error) {
        console.error('Error fetching previous session data:', error);
      }
    };
    fetchDataPrevious();
  }, [apiUrl, previousSession]);
  useEffect(() => {
    if (dataCurrent.length === 0 && dataPrevious.length === 0) return;
    const fetchSubjects = async () => {
      const allData = [...dataCurrent, ...dataPrevious];
      const uniqueCodes = [...new Set(allData.map(item => item.subjectCode).filter(Boolean))];
      try {
        const results = await Promise.all(
          uniqueCodes.map(async (code) => {
            const res = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${code}`, { credentials: 'include' });
            if (!res.ok) {
              console.error(`Error fetching ${code}`);
              return [];
            }
            return await res.json();
          })
        );
        setSubjectData([].concat(...results));
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    fetchSubjects();
  }, [dataCurrent, dataPrevious, apiUrl]);
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
    const filtered = dataCurrent.filter(item =>
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
  }, [dataCurrent, filters, searchTerms]);
  const filterOptions = useMemo(() => {
    return columns.reduce((acc, { key }) => {
      const columnValues = filteredData.map(item => item[key]).filter(value => value !== undefined && value !== null);
      acc[key] = Array.from(new Set(columnValues)).filter(Boolean).sort((a, b) => a.toString().localeCompare(b.toString()));
      return acc;
    }, {});
  }, [filteredData, columns]);
  // Get all unique departments from current session
  const departments = useMemo(() => {
    const depts = new Set();
    dataCurrent.forEach(item => {
      if (item.offeringDept) {
        depts.add(item.offeringDept);
      }
    });
    return Array.from(depts).sort();
  }, [dataCurrent]);
  const computeFacultyLoad = (data, departments, subjectData) => {
    const deptData = {};
    departments.forEach(dept => {
      deptData[dept] = {};
    });
    data.forEach(item => {
      if (!item.subject || !item.faculty || !item.offeringDept) return;
      const dept = item.offeringDept;
      const faculty = item.faculty;
      const subType = item.subjectType?.toLowerCase() || 'other';
      const subject = item.subject;
      const sem = item.sem;
      const subjectInfo = subjectData.find(
        s => s.subName === subject && s.sem === sem
      );
      const studentCount = parseInt(subjectInfo?.studentCount) || 0;
      if (!deptData[dept]) return;
      if (!deptData[dept][faculty]) {
        deptData[dept][faculty] = {
          faculty,
          department: dept,
          total: { theory: 0, laboratory: 0, tutorial: 0, total: 0 },
          subjects: {}
        };
      }
      const facultyData = deptData[dept][faculty];
      const subjectKey = `${subject}-${sem}-${subType}`;
      if (!facultyData.subjects[subjectKey]) {
        facultyData.subjects[subjectKey] = {
          studentCount: studentCount,
          hours: 0,
          type: subType
        };
      }
      facultyData.subjects[subjectKey].hours += 1;
      facultyData.total.total += 1;
      if (subType === 'theory') facultyData.total.theory += 1;
      else if (subType === 'laboratory') facultyData.total.laboratory += 1;
      else if (subType === 'tutorial') facultyData.total.tutorial += 1;
    });
    Object.keys(deptData).forEach(dept => {
      Object.keys(deptData[dept]).forEach(facultyKey => {
        const fd = deptData[dept][facultyKey];
        const studentHours = {
          theory: { totalStudentHours: 0, totalHours: 0 },
          laboratory: { totalStudentHours: 0, totalHours: 0 },
          tutorial: { totalStudentHours: 0, totalHours: 0 }
        };
        Object.values(fd.subjects).forEach(sub => {
          const type = sub.type;
          const sh = sub.studentCount * sub.hours;
          if (type === 'theory') {
            studentHours.theory.totalStudentHours += sh;
            studentHours.theory.totalHours += sub.hours;
          } else if (type === 'laboratory') {
            studentHours.laboratory.totalStudentHours += sh;
            studentHours.laboratory.totalHours += sub.hours;
          } else if (type === 'tutorial') {
            studentHours.tutorial.totalStudentHours += sh;
            studentHours.tutorial.totalHours += sub.hours;
          }
        });
        const normalizedTheory = studentHours.theory.totalHours > 0
          ? (studentHours.theory.totalStudentHours / studentHours.theory.totalHours).toFixed(2)
          : '0.00';
        const normalizedLab = studentHours.laboratory.totalHours > 0
          ? (studentHours.laboratory.totalStudentHours / studentHours.laboratory.totalHours).toFixed(2)
          : '0.00';
        const normalizedTutorial = studentHours.tutorial.totalHours > 0
          ? (studentHours.tutorial.totalStudentHours / studentHours.tutorial.totalHours).toFixed(2)
          : '0.00';
        const normalizedLoad = (
          (fd.total.theory * parseFloat(normalizedTheory)) +
          (fd.total.tutorial * parseFloat(normalizedTutorial)) +
          ((fd.total.laboratory / 2) * parseFloat(normalizedLab))
        ).toFixed(2);
        fd.normalizedStudentCount = {
          theory: normalizedTheory,
          laboratory: normalizedLab,
          tutorial: normalizedTutorial
        };
        fd.normalizedLoad = normalizedLoad;
      });
    });
    const result = {};
    Object.keys(deptData).forEach(dept => {
      result[dept] = Object.values(deptData[dept])
        .sort((a, b) => a.faculty.localeCompare(b.faculty));
    });
    return result;
  };
  // Calculate Faculty Load for current and previous
  const currentLoad = useMemo(() => computeFacultyLoad(dataCurrent, departments, subjectData), [dataCurrent, departments, subjectData]);
  const previousLoad = useMemo(() => computeFacultyLoad(dataPrevious, departments, subjectData), [dataPrevious, departments, subjectData]);
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
    const facultyList = currentLoad[dept] || [];
    const csvData = facultyList.map(item => {
      const prevFaculty = (previousLoad[dept] || []).find(f => f.faculty === item.faculty);
      const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
      const yearlyAvg = (((parseFloat(item.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
      return {
        'Faculty': item.faculty,
        'Department': item.department,
        'Total Theory': item.total.theory,
        'Total Laboratory': item.total.laboratory,
        'Total Tutorial': item.total.tutorial,
        'Total Load': item.total.total,
        'Normalized Student Count (Theory)': item.normalizedStudentCount.theory,
        'Normalized Student Count (Laboratory)': item.normalizedStudentCount.laboratory,
        'Normalized Student Count (Tutorial)': item.normalizedStudentCount.tutorial,
        'Normalized Load (Current)': item.normalizedLoad,
        'Normalized Load (Previous)': prevNormLoad,
        'Yearly Average Load': yearlyAvg,
      };
    });
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
                {previousSession && (
                  <Text mt={2} color="gray.600">Previous Session: {previousSession}</Text>
                )}
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
                                      Load distribution by faculty
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
                                            <Text>Normalized Load (Current)</Text>
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
                                      {previousSession && (
                                        <>
                                          <Th
                                            rowSpan={2}
                                            color="yellow.800"
                                            fontSize={{ base: "xs", md: "sm" }}
                                            fontWeight="bold"
                                            textAlign="center"
                                            borderBottom="2px"
                                            borderColor="teal.200"
                                            bg="yellow.100"
                                            verticalAlign="middle"
                                          >
                                            Normalized Load (Previous)
                                          </Th>
                                          <Th
                                            rowSpan={2}
                                            color="yellow.800"
                                            fontSize={{ base: "xs", md: "sm" }}
                                            fontWeight="bold"
                                            textAlign="center"
                                            borderBottom="2px"
                                            borderColor="teal.200"
                                            bg="yellow.200"
                                            verticalAlign="middle"
                                          >
                                            Yearly Average Load
                                          </Th>
                                        </>
                                      )}
                                    </Tr>
                                    <Tr>
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
                                    {(currentLoad[dept] || []).map((faculty, index) => {
                                      const prevFaculty = (previousLoad[dept] || []).find(f => f.faculty === faculty.faculty);
                                      const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
                                      const yearlyAvg = (((parseFloat(faculty.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
                                      return (
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
                                          {/* Normalized Load Current */}
                                          <Td textAlign="center" bg="yellow.50" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                            <Badge colorScheme="yellow" fontSize="xs" px={3} py={1}>
                                              {faculty.normalizedLoad}
                                            </Badge>
                                          </Td>
                                          {previousSession && (
                                            <>
                                              {/* Normalized Load Previous */}
                                              <Td textAlign="center" bg="yellow.100" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                                <Badge colorScheme="yellow" fontSize="xs" px={3} py={1}>
                                                  {prevNormLoad}
                                                </Badge>
                                              </Td>
                                              {/* Yearly Average */}
                                              <Td textAlign="center" bg="yellow.200" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                                <Badge colorScheme="orange" fontSize="xs" px={3} py={1}>
                                                  {yearlyAvg}
                                                </Badge>
                                              </Td>
                                            </>
                                          )}
                                        </Tr>
                                      );
                                    })}
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