import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  Thead,
  Tbody,
  HStack,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  FormControl,
  FormLabel,
  Select,
  Button,
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
  Progress,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  useBreakpointValue,
  Wrap,
  WrapItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
} from '@chakra-ui/react';
import { 
  FaChalkboardTeacher,
  FaFlask,
  FaBook,
  FaUsers,
  FaUserTie,
  FaCalendarAlt,
} from 'react-icons/fa';
import { DownloadIcon, ArrowBackIcon, InfoIcon, RepeatIcon } from '@chakra-ui/icons';
import { Parser } from '@json2csv/plainjs';
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

// Designation color mapping
const getDesignationStyle = (designation) => {
  const lowerDesignation = designation?.toLowerCase() || '';
  
  if (lowerDesignation.includes('professor') && !lowerDesignation.includes('assistant') && !lowerDesignation.includes('associate')) {
    return { bg: 'purple.50', hoverBg: 'purple.100', borderLeft: '4px solid', borderColor: 'purple.500', badge: 'purple' };
  } else if (lowerDesignation.includes('associate')) {
    return { bg: 'blue.50', hoverBg: 'blue.100', borderLeft: '4px solid', borderColor: 'blue.500', badge: 'blue' };
  } else if (lowerDesignation.includes('assistant')) {
    return { bg: 'teal.50', hoverBg: 'teal.100', borderLeft: '4px solid', borderColor: 'teal.500', badge: 'teal' };
  } else {
    return { bg: 'gray.50', hoverBg: 'gray.100', borderLeft: '4px solid', borderColor: 'gray.400', badge: 'gray' };
  }
};

// Faculty Summary Tooltip Component
const FacultySummaryTooltip = ({ faculty, children }) => {
  const subjects = faculty.subjects || [];
  
  return (
    <Popover trigger="hover" placement="right" openDelay={200}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        w={{ base: "280px", md: "350px" }} 
        boxShadow="xl" 
        borderRadius="lg"
        border="2px solid"
        borderColor="teal.200"
      >
        <PopoverArrow />
        <PopoverHeader 
          bg="teal.500" 
          color="white" 
          fontWeight="bold" 
          borderTopRadius="md"
          py={3}
        >
          <HStack spacing={2}>
            <FaUserTie />
            <Text fontSize={{ base: "sm", md: "md" }}>{faculty.faculty}</Text>
          </HStack>
          {faculty.designation && (
            <Badge colorScheme="whiteAlpha" mt={1} fontSize="xs">
              {faculty.designation}
            </Badge>
          )}
        </PopoverHeader>
        <PopoverBody p={0} maxH="300px" overflowY="auto">
          {subjects.length > 0 ? (
            <Box>
              <Box bg="gray.50" px={3} py={2} borderBottom="1px" borderColor="gray.200">
                <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
                  Subject Load Summary
                </Text>
              </Box>
              {subjects.map((subject, idx) => (
                <Box 
                  key={idx} 
                  px={3} 
                  py={2} 
                  borderBottom="1px" 
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                >
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={1}>
                    <VStack align="start" spacing={0} flex="1" minW="0">
                      <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium" noOfLines={2}>
                        {subject.subjectFullName || subject.subCode}
                      </Text>
                      <HStack spacing={1} flexWrap="wrap">
                        <Badge 
                          size="sm" 
                          colorScheme={
                            subject.subType?.toLowerCase() === 'theory' ? 'green' :
                            subject.subType?.toLowerCase() === 'laboratory' ? 'red' : 'orange'
                          }
                          fontSize="2xs"
                        >
                          {subject.subType}
                        </Badge>
                        <Text fontSize="2xs" color="gray.500">{subject.subSem}</Text>
                      </HStack>
                    </VStack>
                    <Badge colorScheme="blue" fontSize={{ base: "xs", md: "sm" }} px={2}>
                      {subject.count} hrs
                    </Badge>
                  </Flex>
                </Box>
              ))}
              <Box bg="teal.50" px={3} py={2}>
                <Flex justify="space-between" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                  <Text>Total Load:</Text>
                  <Text color="teal.600">{faculty.total?.total || 0} hrs</Text>
                </Flex>
              </Box>
            </Box>
          ) : (
            <Box p={4} textAlign="center">
              <Text color="gray.500" fontSize="sm">No subject data available</Text>
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

// Student Count Tooltip Component
const StudentCountTooltip = ({ faculty, type, children }) => {
  const subjects = (faculty.subjects || []).filter(s => 
    s.subType?.toLowerCase() === type.toLowerCase()
  );
  
  return (
    <Popover trigger="hover" placement="top" openDelay={200}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        w={{ base: "250px", md: "300px" }} 
        boxShadow="xl" 
        borderRadius="lg"
        border="2px solid"
        borderColor="pink.200"
      >
        <PopoverArrow />
        <PopoverHeader 
          bg="pink.500" 
          color="white" 
          fontWeight="bold" 
          borderTopRadius="md"
          py={2}
        >
          <HStack spacing={2}>
            <FaUsers />
            <Text fontSize={{ base: "xs", md: "sm" }}>
              {type.charAt(0).toUpperCase() + type.slice(1)} - Student Details
            </Text>
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0} maxH="200px" overflowY="auto">
          {subjects.length > 0 ? (
            <Box>
              {subjects.map((subject, idx) => (
                <Box 
                  key={idx} 
                  px={3} 
                  py={2} 
                  borderBottom="1px" 
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                >
                  <Flex justify="space-between" align="center" gap={2}>
                    <Text fontSize={{ base: "xs", md: "sm" }} noOfLines={1} flex="1">
                      {subject.subjectFullName || subject.subCode}
                    </Text>
                    <Badge colorScheme="purple" fontSize="xs">
                      {subject.studentCount || 0} students
                    </Badge>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : (
            <Box p={3} textAlign="center">
              <Text color="gray.500" fontSize="sm">No {type} subjects</Text>
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const FacultyDeptHourLoad = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Extract timetable code from URL: /tt/:code/facultyload
  const pathParts = window.location.pathname.split("/");
  const currentCode = pathParts[pathParts.length - 2];
  
  // Session and department states
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [previousSession, setPreviousSession] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [deptLoading, setDeptLoading] = useState(true);
  
  // Loading states
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, stage: '' });
  
  // Data states
  const [currentLoadData, setCurrentLoadData] = useState([]);
  const [previousLoadData, setPreviousLoadData] = useState([]);
  const [showYearlyLoad, setShowYearlyLoad] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for department codes
  const deptCodesCache = useRef({});
  
  const apiUrl = getEnvironment();
  
  // Responsive values
  const tableSize = useBreakpointValue({ base: "sm", md: "md" });
  const headingSize = useBreakpointValue({ base: "sm", md: "md", lg: "lg" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });

  // Fetch department from timetable code on mount
  useEffect(() => {
    const fetchDepartmentFromCode = async () => {
      if (!currentCode) {
        setDeptLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          }
        );

        const data = await response.json();
        
        // Handle both array and object responses
        if (Array.isArray(data) && data.length > 0) {
          setSelectedDepartment(data[0].dept);
        } else if (data?.dept) {
          setSelectedDepartment(data.dept);
        }
      } catch (error) {
        console.error('Error fetching department from code:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch department information',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setDeptLoading(false);
      }
    };

    fetchDepartmentFromCode();
  }, [apiUrl, currentCode, toast]);

  // Fetch all sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        const { uniqueSessions } = data;
        
        setAllSessions(uniqueSessions || []);
        
        if (uniqueSessions?.length > 0) {
          setSelectedSession(uniqueSessions[0].session);
          if (uniqueSessions.length > 1) {
            setPreviousSession(uniqueSessions[1].session);
          }
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError(error);
      }
    };
    fetchSessions();
  }, [apiUrl]);

  // Generate initial timetable data structure
  const generateInitialTimetableData = useCallback((fetchedData, type) => {
    const initialData = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 'lunch'];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        const periodKey = period === 'lunch' ? 'lunch' : `period${period}`;
        initialData[day][periodKey] = [];
        
        if (fetchedData[day]?.[periodKey]) {
          for (const slot of fetchedData[day][periodKey]) {
            const slotSubjects = [];
            for (const slotItem of slot) {
              const subj = slotItem.subject || "";
              const room = type === "room" ? (slotItem.sem || "") : (slotItem.room || "");
              const faculty = type === "faculty" ? (slotItem.sem || "") : (slotItem.faculty || "");
              if (subj || room || faculty) {
                slotSubjects.push({ subject: subj, room, faculty });
              }
            }
            if (slotSubjects.length > 0 || period !== 'lunch') {
              initialData[day][periodKey].push(slotSubjects.length > 0 ? slotSubjects : [{ subject: "", room: "", faculty: "" }]);
            }
          }
        }
        if (initialData[day][periodKey].length === 0 && period !== 'lunch') {
          initialData[day][periodKey].push([]);
        }
      }
    }
    return initialData;
  }, []);

  // Generate summary from timetable data
  const generateSummary = useCallback((timetableData, subjectDataArray, facultyName, commonLoad) => {
    const summaryData = {};

    for (const day in timetableData) {
      for (let period = 1; period <= 9; period++) {
        const periodKey = period === 9 ? 'lunch' : `period${period}`;
        const slots = timetableData[day][periodKey];
        
        if (slots) {
          slots.forEach((slot) => {
            slot.forEach((cell) => {
              if (cell.subject) {
                const { subject, faculty, room } = cell;
                const foundSubject = subjectDataArray.find(item => 
                  item.subName === subject && item.sem === faculty
                );
                
                if (foundSubject) {
                  const key = `${subject}-${faculty}-${foundSubject.type}`;
                  if (!summaryData[key]) {
                    summaryData[key] = {
                      subCode: foundSubject.subCode,
                      count: 1,
                      subType: foundSubject.type,
                      subjectFullName: foundSubject.subjectFullName,
                      subSem: foundSubject.sem,
                      studentCount: parseInt(foundSubject.studentCount) || 0,
                    };
                  } else {
                    summaryData[key].count++;
                  }
                }
              }
            });
          });
        }
      }
    }

    let subjects = Object.values(summaryData);

    // Add common load items
    if (commonLoad && Array.isArray(commonLoad)) {
      commonLoad.forEach((item) => {
        subjects.push({
          count: item.hrs,
          subCode: item.subCode,
          subjectFullName: item.subFullName,
          subType: item.subType,
          subSem: item.sem,
          studentCount: parseInt(item.studentCount) || 0,
        });
      });
    }

    return subjects;
  }, []);

  // Compute faculty load with normalized metrics
  const computeFacultyLoad = useCallback((subjects, facultyName, department, designation) => {
    const total = { theory: 0, laboratory: 0, tutorial: 0, total: 0 };
    const studentHours = {
      theory: { totalStudentHours: 0, totalHours: 0 },
      laboratory: { totalStudentHours: 0, totalHours: 0 },
      tutorial: { totalStudentHours: 0, totalHours: 0 }
    };

    subjects.forEach((item) => {
      const subType = item.subType?.toLowerCase() || 'other';
      const hours = item.count || 0;
      const studentCount = item.studentCount || 0;

      total.total += hours;
      
      if (subType === 'theory') {
        total.theory += hours;
        studentHours.theory.totalStudentHours += studentCount * hours;
        studentHours.theory.totalHours += hours;
      } else if (subType === 'laboratory') {
        total.laboratory += hours;
        studentHours.laboratory.totalStudentHours += studentCount * hours;
        studentHours.laboratory.totalHours += hours;
      } else if (subType === 'tutorial') {
        total.tutorial += hours;
        studentHours.tutorial.totalStudentHours += studentCount * hours;
        studentHours.tutorial.totalHours += hours;
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
      (total.theory * parseFloat(normalizedTheory)) +
      (total.tutorial * parseFloat(normalizedTutorial)) +
      ((total.laboratory / 2) * parseFloat(normalizedLab))
    ).toFixed(2);

    return {
      faculty: facultyName,
      department,
      designation,
      total,
      normalizedStudentCount: {
        theory: normalizedTheory,
        laboratory: normalizedLab,
        tutorial: normalizedTutorial
      },
      normalizedLoad,
      subjects
    };
  }, []);

  // Fetch department data for a specific session using the currentCode
  const fetchDepartmentData = useCallback(async (session, department, isPrevious = false) => {
    if (!session || !department) return [];

    const setLoading = isPrevious ? setLoadingPrevious : setLoadingCurrent;
    setLoading(true);
    
    try {
      // Use currentCode directly for current session, fetch code for previous session
      let code;
      if (!isPrevious) {
        code = currentCode;
      } else {
        const cacheKey = `${session}-${department}`;
        if (deptCodesCache.current[cacheKey]) {
          code = deptCodesCache.current[cacheKey];
        } else {
          const codeResponse = await fetch(
            `${apiUrl}/timetablemodule/timetable/getcode/${session}/${department}`,
            { credentials: 'include' }
          );
          if (!codeResponse.ok) {
            console.error(`No timetable found for ${department} in ${session}`);
            return [];
          }
          code = await codeResponse.json();
          deptCodesCache.current[cacheKey] = code;
        }
      }

      if (!code) return [];

      setLoadingProgress({ current: 0, total: 3, stage: 'Fetching subject data...' });

      // Fetch subject data and faculty list in parallel
      const [subjectResponse, facultyResponse] = await Promise.all([
        fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${code}`, { credentials: 'include' }),
        fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { credentials: 'include' })
      ]);

      const subjectData = subjectResponse.ok ? await subjectResponse.json() : [];
      const faculties = facultyResponse.ok ? await facultyResponse.json() : [];

      if (!Array.isArray(faculties) || faculties.length === 0) {
        return [];
      }

      setLoadingProgress({ current: 1, total: 3, stage: `Processing ${faculties.length} faculty members...` });

      const facultyLoadData = [];
      const batchSize = 5; // Process 5 faculty members at a time

      for (let i = 0; i < faculties.length; i += batchSize) {
        const batch = faculties.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (faculty) => {
            const facultyName = faculty.name;
            const designation = faculty.designation;

            try {
              // Fetch timetable and common load in parallel
              const [ttResponse, commonLoadResponse] = await Promise.all([
                fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${code}/${facultyName}`, { credentials: 'include' }),
                fetch(`${apiUrl}/timetablemodule/commonLoad/${code}/${facultyName}`, { credentials: 'include' }).catch(() => ({ ok: false }))
              ]);

              if (!ttResponse.ok) return null;

              const ttData = await ttResponse.json();
              const commonLoad = commonLoadResponse.ok ? await commonLoadResponse.json() : [];
              
              const timetableData = ttData.timetableData || {};
              const initialData = generateInitialTimetableData(timetableData, 'faculty');
              const subjects = generateSummary(initialData, subjectData, facultyName, commonLoad);
              
              const facultyLoad = computeFacultyLoad(subjects, facultyName, department, designation);
              
              return facultyLoad.total.total > 0 ? facultyLoad : null;
            } catch (e) {
              console.error(`Error processing faculty ${facultyName}:`, e);
              return null;
            }
          })
        );

        facultyLoadData.push(...batchResults.filter(Boolean));
        
        setLoadingProgress({ 
          current: Math.min(i + batchSize, faculties.length), 
          total: faculties.length, 
          stage: `Processed ${Math.min(i + batchSize, faculties.length)}/${faculties.length} faculty...` 
        });
      }

      // Sort by normalized load (descending)
      facultyLoadData.sort((a, b) => parseFloat(b.normalizedLoad) - parseFloat(a.normalizedLoad));

      return facultyLoadData;
    } catch (error) {
      console.error('Error fetching department data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch data for ${department}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return [];
    } finally {
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0, stage: '' });
    }
  }, [apiUrl, currentCode, generateInitialTimetableData, generateSummary, computeFacultyLoad, toast]);

  // Fetch current session data when department or session changes
  useEffect(() => {
    if (selectedSession && selectedDepartment && !deptLoading) {
      setShowYearlyLoad(false);
      setPreviousLoadData([]);
      fetchDepartmentData(selectedSession, selectedDepartment, false).then(setCurrentLoadData);
    }
  }, [selectedSession, selectedDepartment, deptLoading, fetchDepartmentData]);

  // Handle showing yearly load
  const handleShowYearlyLoad = async () => {
    if (!previousSession || !selectedDepartment) {
      toast({
        title: 'Missing Selection',
        description: 'Please select a previous session first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const data = await fetchDepartmentData(previousSession, selectedDepartment, true);
    setPreviousLoadData(data);
    setShowYearlyLoad(true);
  };

  // Get sorted faculty list with yearly average
  const getSortedFacultyList = useCallback(() => {
    if (!showYearlyLoad || previousLoadData.length === 0) {
      return currentLoadData;
    }

    return [...currentLoadData].sort((a, b) => {
      const prevA = previousLoadData.find(f => f.faculty === a.faculty);
      const prevB = previousLoadData.find(f => f.faculty === b.faculty);
      
      const yearlyAvgA = ((parseFloat(a.normalizedLoad) + parseFloat(prevA?.normalizedLoad || '0.00')) / 2);
      const yearlyAvgB = ((parseFloat(b.normalizedLoad) + parseFloat(prevB?.normalizedLoad || '0.00')) / 2);
      
      return yearlyAvgB - yearlyAvgA;
    });
  }, [currentLoadData, previousLoadData, showYearlyLoad]);

  // Calculate department totals
  const getDepartmentTotals = useCallback(() => {
    const totals = {
      theory: 0,
      laboratory: 0,
      tutorial: 0,
      total: 0,
      normalizedLoad: 0,
      facultyCount: currentLoadData.length
    };

    currentLoadData.forEach(f => {
      totals.theory += f.total.theory;
      totals.laboratory += f.total.laboratory;
      totals.tutorial += f.total.tutorial;
      totals.total += f.total.total;
      totals.normalizedLoad += parseFloat(f.normalizedLoad);
    });

    return totals;
  }, [currentLoadData]);

  // Download CSV
  const downloadCSV = () => {
    const sortedList = getSortedFacultyList();
    const csvData = sortedList.map((item, index) => {
      const prevFaculty = previousLoadData.find(f => f.faculty === item.faculty);
      const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
      const yearlyAvg = (((parseFloat(item.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
      
      const baseData = {
        'Rank': index + 1,
        'Faculty': item.faculty,
        'Designation': item.designation || '',
        'Department': item.department,
        'Total Theory': item.total.theory,
        'Total Laboratory': item.total.laboratory,
        'Total Tutorial': item.total.tutorial,
        'Total Load': item.total.total,
        'Normalized Student Count (Theory)': item.normalizedStudentCount.theory,
        'Normalized Student Count (Laboratory)': item.normalizedStudentCount.laboratory,
        'Normalized Student Count (Tutorial)': item.normalizedStudentCount.tutorial,
        'Normalized Load (Current)': item.normalizedLoad,
      };

      if (showYearlyLoad) {
        baseData['Normalized Load (Previous)'] = prevNormLoad;
        baseData['Yearly Average Load'] = yearlyAvg;
      }

      return baseData;
    });

    const parser = new Parser();
    const csv = parser.parse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDepartment}-Faculty-Load-${selectedSession}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedFaculty = getSortedFacultyList();
  const totals = getDepartmentTotals();

  return (
    <>
      <Helmet>
        <title>Faculty Load Analysis | XCEED NITJ</title>
        <meta name="description" content="NITJ faculty load analysis by department" />
      </Helmet>
      <Box bg="gray.50" minH="100vh">
        {/* Hero Header */}
        <Box
          bgGradient="linear(to-r, teal.500, blue.600, purple.600)"
          pt={0}
          pb={{ base: 20, md: 24 }}
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
          <Container maxW="7xl" position="relative" mt={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
            <Flex 
              justify="space-between" 
              align={{ base: "start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <VStack spacing={{ base: 2, md: 3 }} align={{ base: "center", lg: "start" }} textAlign={{ base: "center", lg: "left" }}>
                <Badge colorScheme="whiteAlpha" fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 3 }} py={1} borderRadius="full">
                  <HStack spacing={1}>
                    <FaChalkboardTeacher size={12} />
                    <Text>Faculty Load Analytics</Text>
                  </HStack>
                </Badge>
                <Heading size={{ base: "lg", md: "xl", lg: "2xl" }} color="white" fontWeight="bold" lineHeight="1.2">
                  Student Normalised Faculty Workload Analysis
                </Heading>
                <Text color="whiteAlpha.900" fontSize={{ base: "sm", md: "md" }} maxW={{ base: "full", lg: "2xl" }}>
                  Analyze faculty workload with normalized metrics over the year
                </Text>
              </VStack>

              <IconButton
                icon={<ArrowBackIcon boxSize={{ base: 5, md: 6 }} />}
                aria-label="Go back"
                onClick={() => navigate(-1)}
                size={{ base: "md", md: "lg" }}
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.3)', transform: 'scale(1.05)' }}
                borderRadius="full"
                boxShadow="lg"
                border="2px solid"
                borderColor="whiteAlpha.400"
              />
            </Flex>
          </Container>
        </Box>

        <Container maxW="7xl" mt={{ base: -12, md: -16 }} position="relative" zIndex={1} pb={16} px={{ base: 3, md: 6, lg: 8 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Selection Card */}
            <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="2xl" border="1px" borderColor="gray.200" overflow="hidden">
              <CardHeader bg="teal.600" color="white" p={{ base: 3, md: 4 }}>
                <Heading size={headingSize}>Department & Session</Heading>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {/* Department - Auto-filled and Disabled */}
                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
                      Department
                    </FormLabel>
                    {deptLoading ? (
                      <Flex align="center" gap={2} h="48px">
                        <Spinner size="sm" color="teal.500" />
                        <Text color="gray.500" fontSize="sm">Loading department...</Text>
                      </Flex>
                    ) : (
                      <Select
                        value={selectedDepartment}
                        isDisabled={true}
                        borderColor="gray.300"
                        bg="gray.100"
                        cursor="not-allowed"
                        size={{ base: "md", md: "lg" }}
                        _disabled={{
                          opacity: 0.8,
                          bg: "gray.100",
                        }}
                      >
                        <option value={selectedDepartment}>{selectedDepartment}</option>
                      </Select>
                    )}
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
                      Current Session
                    </FormLabel>
                    <Select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      borderColor="teal.300"
                      _hover={{ borderColor: "teal.400" }}
                      _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                      size={{ base: "md", md: "lg" }}
                    >
                      {allSessions.map((session, index) => (
                        <option key={index} value={session.session}>{session.session}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
                      Previous Session (for comparison)
                    </FormLabel>
                    <Select
                      value={previousSession}
                      onChange={(e) => setPreviousSession(e.target.value)}
                      borderColor="teal.300"
                      _hover={{ borderColor: "teal.400" }}
                      _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                      size={{ base: "md", md: "lg" }}
                    >
                      <option value="">None</option>
                      {allSessions.map((session, index) => (
                        <option key={index} value={session.session}>{session.session}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* Legend */}
                <Box mt={4} p={3} bg="gray.50" borderRadius="lg">
                  <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" mb={2} color="gray.600">
                    Designation Color Legend:
                  </Text>
                  <Wrap spacing={2}>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="purple.500" borderRadius="sm" /><Text fontSize="xs">Professor</Text></HStack></WrapItem>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="blue.500" borderRadius="sm" /><Text fontSize="xs">Associate Prof.</Text></HStack></WrapItem>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="teal.500" borderRadius="sm" /><Text fontSize="xs">Assistant Prof.</Text></HStack></WrapItem>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="gray.400" borderRadius="sm" /><Text fontSize="xs">Others</Text></HStack></WrapItem>
                  </Wrap>
                </Box>
              </CardBody>
            </Card>

            {/* Data Display */}
            {deptLoading ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={{ base: 8, md: 12 }} textAlign="center">
                  <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="teal.500" size="xl" />
                  <Text mt={4} color="gray.600" fontWeight="medium">Loading department information...</Text>
                </CardBody>
              </Card>
            ) : !selectedDepartment ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={{ base: 8, md: 12 }} textAlign="center">
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>Could not fetch department from timetable code</AlertDescription>
                  </Alert>
                </CardBody>
              </Card>
            ) : loadingCurrent ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={{ base: 8, md: 12 }} textAlign="center">
                  <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="teal.500" size="xl" />
                  <Text mt={4} color="gray.600" fontWeight="medium">{loadingProgress.stage || 'Loading...'}</Text>
                  {loadingProgress.total > 0 && (
                    <Box mt={4} maxW="300px" mx="auto">
                      <Progress 
                        value={(loadingProgress.current / loadingProgress.total) * 100} 
                        colorScheme="teal"
                        borderRadius="full"
                        size="sm"
                      />
                      <Text mt={2} fontSize="sm" color="gray.500">
                        {loadingProgress.current} / {loadingProgress.total}
                      </Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ) : error ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={6}>
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                </CardBody>
              </Card>
            ) : currentLoadData.length === 0 ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={6}>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>No faculty load data found for {selectedDepartment} in {selectedSession}</AlertDescription>
                  </Alert>
                </CardBody>
              </Card>
            ) : (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="2xl" border="1px" borderColor="gray.200" overflow="hidden">
                {/* Header with Actions */}
                <CardHeader bg="purple.600" color="white" p={{ base: 3, md: 4 }}>
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                    <VStack align="start" spacing={0}>
                      <Heading size={headingSize}>{selectedDepartment}</Heading>
                      <Text fontSize={{ base: "xs", md: "sm" }} opacity={0.9}>
                        {sortedFaculty.length} faculty members • {selectedSession}
                      </Text>
                    </VStack>
                    <HStack spacing={2} flexWrap="wrap">
                      {!showYearlyLoad && previousSession && (
                        <Button
                          leftIcon={loadingPrevious ? <Spinner size="sm" /> : <FaCalendarAlt />}
                          onClick={handleShowYearlyLoad}
                          colorScheme="yellow"
                          size={buttonSize}
                          isLoading={loadingPrevious}
                          loadingText="Loading..."
                        >
                          <Text display={{ base: "none", sm: "inline" }}>Show Yearly Load</Text>
                          <Text display={{ base: "inline", sm: "none" }}>Yearly</Text>
                        </Button>
                      )}
                      {showYearlyLoad && (
                        <Button
                          leftIcon={<RepeatIcon />}
                          onClick={() => { setShowYearlyLoad(false); setPreviousLoadData([]); }}
                          colorScheme="gray"
                          variant="outline"
                          size={buttonSize}
                          bg="white"
                        >
                          Hide
                        </Button>
                      )}
                      <Button
                        leftIcon={<DownloadIcon />}
                        onClick={downloadCSV}
                        colorScheme="green"
                        size={buttonSize}
                      >
                        <Text display={{ base: "none", sm: "inline" }}>Download CSV</Text>
                        <Text display={{ base: "inline", sm: "none" }}>CSV</Text>
                      </Button>
                    </HStack>
                  </Flex>
                </CardHeader>

                {/* Department Summary Stats */}
                <Box p={{ base: 3, md: 4 }} bg="gray.50" borderBottom="1px" borderColor="gray.200">
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={{ base: 2, md: 3 }}>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="green.600"><HStack spacing={1}><FaBook size={10} /><Text>Theory</Text></HStack></StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="green.700">{totals.theory}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="red.600"><HStack spacing={1}><FaFlask size={10} /><Text>Lab</Text></HStack></StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="red.700">{totals.laboratory}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="orange.600"><HStack spacing={1}><FaUsers size={10} /><Text>Tutorial</Text></HStack></StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="orange.700">{totals.tutorial}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="blue.600">Total</StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="blue.700">{totals.total}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="purple.600">Normalized</StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="purple.700">{totals.normalizedLoad.toFixed(2)}</StatNumber>
                      <StatHelpText fontSize="2xs">total</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </Box>

                {/* Loading indicator for previous session */}
                {loadingPrevious && (
                  <Box p={3} bg="yellow.50" borderBottom="1px" borderColor="yellow.200">
                    <HStack justify="center" spacing={3}>
                      <Spinner size="sm" color="yellow.500" />
                      <Text fontSize="sm" color="yellow.700">Loading previous session data...</Text>
                    </HStack>
                  </Box>
                )}

                {/* Table */}
                <Box
                  overflowX="auto"
                  css={{
                    '&::-webkit-scrollbar': { height: '8px' },
                    '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb': { background: '#38B2AC', borderRadius: '4px' },
                  }}
                >
                  <Table variant="simple" size={tableSize}>
                    <Thead bg="teal.50" position="sticky" top={0} zIndex={1}>
                      <Tr>
                        <Th rowSpan={2} fontSize="xs" fontWeight="bold" borderBottom="2px" borderColor="teal.200" verticalAlign="middle" textAlign="center" w="40px">#</Th>
                        <Th rowSpan={2} color="teal.700" fontSize="xs" fontWeight="bold" borderBottom="2px" borderColor="teal.200" verticalAlign="middle" minW="150px">Faculty</Th>
                        <Th colSpan={4} color="green.700" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="green.50">Total Load</Th>
                        <Th colSpan={3} color="pink.700" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="pink.50">
                          <HStack spacing={1} justify="center">
                            <Text>Norm. Student Count</Text>
                            <Tooltip label="Total Students ÷ Total Hours" placement="top" hasArrow><InfoIcon boxSize={2.5} /></Tooltip>
                          </HStack>
                        </Th>
                        <Th rowSpan={2} color="yellow.800" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="yellow.50" verticalAlign="middle">
                          <HStack spacing={1} justify="center">
                            <Text>Current</Text>
                            <Tooltip label="(Theory × Norm.Th) + (Tutorial × Norm.Tut) + ((Lab÷2) × Norm.Lab)" placement="top" hasArrow><InfoIcon boxSize={2.5} /></Tooltip>
                          </HStack>
                        </Th>
                        {showYearlyLoad && (
                          <>
                            <Th rowSpan={2} color="orange.800" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="orange.50" verticalAlign="middle">Previous</Th>
                            <Th rowSpan={2} fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bgGradient="linear(to-r, green.100, teal.100, blue.100)" verticalAlign="middle" color="teal.800">Yearly Avg</Th>
                          </>
                        )}
                      </Tr>
                      <Tr>
                        {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
                          <Th key={`total-${idx}`} color="green.700" fontSize="2xs" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="green.50" px={1}>{label}</Th>
                        ))}
                        {['Th', 'Lab', 'Tut'].map((label, idx) => (
                          <Th key={`norm-${idx}`} color="pink.700" fontSize="2xs" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="pink.50" px={1}>{label}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sortedFaculty.map((faculty, index) => {
                        const prevFaculty = previousLoadData.find(f => f.faculty === faculty.faculty);
                        const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
                        const yearlyAvg = (((parseFloat(faculty.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
                        const designationStyle = getDesignationStyle(faculty.designation);
                        
                        return (
                          <Tr
                            key={index}
                            bg={designationStyle.bg}
                            _hover={{ bg: designationStyle.hoverBg }}
                            borderLeft={designationStyle.borderLeft}
                            borderColor={designationStyle.borderColor}
                            transition="all 0.2s"
                          >
                            <Td textAlign="center" fontWeight="bold" color="gray.500" fontSize="xs">{index + 1}</Td>
                            <Td>
                              <FacultySummaryTooltip faculty={faculty}>
                                <Box cursor="pointer">
                                  <Text fontWeight="bold" fontSize="sm" color="gray.800" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>
                                    {faculty.faculty}
                                  </Text>
                                  {faculty.designation && (
                                    <Badge colorScheme={designationStyle.badge} fontSize="2xs" mt={0.5}>{faculty.designation}</Badge>
                                  )}
                                </Box>
                              </FacultySummaryTooltip>
                            </Td>
                            <Td textAlign="center" bg="green.50" fontSize="xs" px={1}><Badge colorScheme="green" fontSize="2xs">{faculty.total.theory}</Badge></Td>
                            <Td textAlign="center" bg="green.50" fontSize="xs" px={1}><Badge colorScheme="red" fontSize="2xs">{faculty.total.laboratory}</Badge></Td>
                            <Td textAlign="center" bg="green.50" fontSize="xs" px={1}><Badge colorScheme="orange" fontSize="2xs">{faculty.total.tutorial}</Badge></Td>
                            <Td textAlign="center" bg="green.100" fontWeight="bold" fontSize="xs" px={1}>{faculty.total.total}</Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="theory">
                                <Badge colorScheme="cyan" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.normalizedStudentCount.theory}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="laboratory">
                                <Badge colorScheme="cyan" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.normalizedStudentCount.laboratory}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="tutorial">
                                <Badge colorScheme="cyan" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.normalizedStudentCount.tutorial}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="yellow.50" fontWeight="bold" fontSize="xs" px={1}>
                              <Badge colorScheme="yellow" fontSize="xs" px={2} py={1}>{faculty.normalizedLoad}</Badge>
                            </Td>
                            {showYearlyLoad && (
                              <>
                                <Td textAlign="center" bg="orange.50" fontWeight="bold" fontSize="xs" px={1}>
                                  <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>{prevNormLoad}</Badge>
                                </Td>
                                <Td textAlign="center" fontWeight="bold" fontSize="xs" bgGradient="linear(to-r, green.50, teal.50, blue.50)" px={1}>
                                  <Badge bgGradient="linear(to-r, green.400, teal.400, blue.400)" color="white" fontSize="sm" px={3} py={1} borderRadius="full" boxShadow="md">
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
              </Card>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default FacultyDeptHourLoad;