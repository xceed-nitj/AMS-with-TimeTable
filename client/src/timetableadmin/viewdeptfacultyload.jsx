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
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Code,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react';
import { 
  FaChalkboardTeacher,
  FaFlask,
  FaBook,
  FaUsers,
  FaUserTie,
  FaCalendarAlt,
  FaFilePdf,
  FaFileExcel,
  FaCalculator,
} from 'react-icons/fa';
import { DownloadIcon, ArrowBackIcon, InfoIcon, RepeatIcon, ChevronDownIcon, QuestionIcon } from '@chakra-ui/icons';
import { Parser } from '@json2csv/plainjs';
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
        w={{ base: "280px", md: "380px" }} 
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
        <PopoverBody p={0} maxH="350px" overflowY="auto">
          {subjects.length > 0 ? (
            <Box>
              <Box bg="gray.50" px={3} py={2} borderBottom="1px" borderColor="gray.200">
                <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
                  Subject Load Summary (Hours × Students)
                </Text>
              </Box>
              {subjects.map((subject, idx) => {
                const shb = (subject.count || 0) * (subject.studentCount || 0);
                return (
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
                      <VStack align="end" spacing={0}>
                        <Text fontSize="2xs" color="gray.500">
                          {subject.count}h × {subject.studentCount}
                        </Text>
                        <Badge colorScheme="purple" fontSize={{ base: "xs", md: "sm" }} px={2}>
                          {shb} TWU
                        </Badge>
                      </VStack>
                    </Flex>
                  </Box>
                );
              })}
              <Box bg="teal.50" px={3} py={2}>
                <Flex justify="space-between" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                  <VStack align="start" spacing={0}>
                    <Text>Total Hours:</Text>
                    <Text>Course Complexity:</Text>
                    <Text color="purple.600">Teaching Work Units:</Text>
                  </VStack>
                  <VStack align="end" spacing={0}>
                    <Text color="teal.600">{faculty.total?.total || 0} hrs</Text>
                    <Text color="cyan.600">{faculty.courseComplexity?.total || 0} courses</Text>
                    <Text color="purple.600">{faculty.teachingWorkUnits || 0}</Text>
                  </VStack>
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

// Student Count Tooltip Component - Shows Student-Hour Burden breakdown
const StudentCountTooltip = ({ faculty, type, children }) => {
  const subjects = (faculty.subjects || []).filter(s => 
    s.subType?.toLowerCase() === type.toLowerCase()
  );
  
  const totalSHB = subjects.reduce((sum, s) => sum + ((s.count || 0) * (s.studentCount || 0)), 0);
  
  return (
    <Popover trigger="hover" placement="top" openDelay={200}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        w={{ base: "280px", md: "320px" }} 
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
              {type.charAt(0).toUpperCase() + type.slice(1)} - Student-Hour Burden
            </Text>
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0} maxH="250px" overflowY="auto">
          {subjects.length > 0 ? (
            <Box>
              <Box bg="gray.50" px={3} py={1} borderBottom="1px" borderColor="gray.200">
                <Flex justify="space-between" fontSize="2xs" color="gray.500" fontWeight="bold">
                  <Text>Subject</Text>
                  <Text>Hours × Students = SHB</Text>
                </Flex>
              </Box>
              {subjects.map((subject, idx) => {
                const shb = (subject.count || 0) * (subject.studentCount || 0);
                return (
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
                      <HStack spacing={1}>
                        <Text fontSize="2xs" color="gray.500">
                          {subject.count} × {subject.studentCount}
                        </Text>
                        <Badge colorScheme="purple" fontSize="xs">
                          = {shb}
                        </Badge>
                      </HStack>
                    </Flex>
                  </Box>
                );
              })}
              <Box bg="pink.50" px={3} py={2}>
                <Flex justify="space-between" fontWeight="bold" fontSize="sm">
                  <Text>Total {type} SHB:</Text>
                  <Badge colorScheme="pink" fontSize="sm" px={2}>{totalSHB}</Badge>
                </Flex>
              </Box>
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

// TWU Explanation Modal Component
const TWUExplanationModal = ({ isOpen, onClose, totals, currentLoadData }) => {
  // Sample calculation using first faculty if available
  const sampleFaculty = currentLoadData.length > 0 ? currentLoadData[0] : null;
  const sampleSubjects = sampleFaculty?.subjects?.slice(0, 3) || [];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent borderRadius="xl" mx={4}>
        <ModalHeader bg="purple.600" color="white" borderTopRadius="xl">
          <HStack spacing={2}>
            <FaCalculator />
            <Text>Understanding TWU (Teaching Work Units)</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* What is TWU */}
            <Box>
              <Heading size="sm" color="purple.700" mb={2}>What is TWU?</Heading>
              <Text fontSize="sm" color="gray.600">
                Teaching Work Units (TWU) is a comprehensive metric that measures the actual instructional workload 
                of faculty members by considering both the contact hours AND the number of students being taught.
              </Text>
            </Box>

            <Divider />

            {/* Formula */}
            <Box>
              <Heading size="sm" color="purple.700" mb={3}>The Formula</Heading>
              <Box bg="purple.50" p={4} borderRadius="lg" border="2px solid" borderColor="purple.200">
                <Text fontSize="lg" fontWeight="bold" textAlign="center" color="purple.800">
                  TWU = Σ (Contact Hours × Student Count)
                </Text>
                <Text fontSize="sm" color="purple.600" textAlign="center" mt={2}>
                  for each subject taught by the faculty
                </Text>
              </Box>
            </Box>

            <Divider />

            {/* Step by Step */}
            <Box>
              <Heading size="sm" color="purple.700" mb={3}>Calculation Steps</Heading>
              <VStack spacing={3} align="stretch">
                <HStack align="start" spacing={3}>
                  <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>1</Badge>
                  <Text fontSize="sm">For each subject, get the weekly contact hours from the timetable</Text>
                </HStack>
                <HStack align="start" spacing={3}>
                  <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>2</Badge>
                  <Text fontSize="sm">Multiply hours by the number of students enrolled in that subject</Text>
                </HStack>
                <HStack align="start" spacing={3}>
                  <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>3</Badge>
                  <Text fontSize="sm">Sum up all the (Hours × Students) values across all subjects</Text>
                </HStack>
                <HStack align="start" spacing={3}>
                  <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>4</Badge>
                  <Text fontSize="sm">The result is the TWU - representing total student-contact-hours</Text>
                </HStack>
              </VStack>
            </Box>

            <Divider />

            {/* Example Calculation */}
            {sampleFaculty && sampleSubjects.length > 0 && (
              <Box>
                <Heading size="sm" color="purple.700" mb={3}>
                  Example: {sampleFaculty.faculty}
                </Heading>
                <Box bg="gray.50" p={4} borderRadius="lg">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Subject</Th>
                        <Th isNumeric>Hours</Th>
                        <Th isNumeric>Students</Th>
                        <Th isNumeric>SHB</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sampleSubjects.map((sub, idx) => (
                        <Tr key={idx}>
                          <Td fontSize="xs">{sub.subjectFullName || sub.subCode}</Td>
                          <Td isNumeric>{sub.count}</Td>
                          <Td isNumeric>{sub.studentCount}</Td>
                          <Td isNumeric fontWeight="bold">{(sub.count || 0) * (sub.studentCount || 0)}</Td>
                        </Tr>
                      ))}
                      {sampleFaculty.subjects?.length > 3 && (
                        <Tr>
                          <Td colSpan={4} fontSize="xs" color="gray.500" fontStyle="italic">
                            ... and {sampleFaculty.subjects.length - 3} more subjects
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                  <Flex justify="space-between" mt={3} p={2} bg="purple.100" borderRadius="md">
                    <Text fontWeight="bold">Total TWU:</Text>
                    <Badge colorScheme="purple" fontSize="md" px={3}>
                      {sampleFaculty.teachingWorkUnits}
                    </Badge>
                  </Flex>
                </Box>
              </Box>
            )}

            <Divider />

            {/* Department Totals */}
            <Box>
              <Heading size="sm" color="purple.700" mb={3}>Current Department Totals</Heading>
              <SimpleGrid columns={2} spacing={3}>
                <Stat bg="green.50" p={3} borderRadius="lg">
                  <StatLabel fontSize="xs">Theory SHB</StatLabel>
                  <StatNumber fontSize="lg" color="green.700">{totals.shbTheory}</StatNumber>
                </Stat>
                <Stat bg="red.50" p={3} borderRadius="lg">
                  <StatLabel fontSize="xs">Lab SHB</StatLabel>
                  <StatNumber fontSize="lg" color="red.700">{totals.shbLab}</StatNumber>
                </Stat>
                <Stat bg="orange.50" p={3} borderRadius="lg">
                  <StatLabel fontSize="xs">Tutorial SHB</StatLabel>
                  <StatNumber fontSize="lg" color="orange.700">{totals.shbTutorial}</StatNumber>
                </Stat>
                <Stat bg="purple.50" p={3} borderRadius="lg">
                  <StatLabel fontSize="xs">Department Total TWU</StatLabel>
                  <StatNumber fontSize="lg" color="purple.700">{totals.twu.toFixed(0)}</StatNumber>
                </Stat>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Why TWU Matters */}
            <Box>
              <Heading size="sm" color="purple.700" mb={2}>Why TWU Matters</Heading>
              <UnorderedList spacing={2} fontSize="sm" color="gray.600">
                <ListItem>
                  <Text as="span" fontWeight="semibold">Fair Comparison:</Text> Unlike simple hour counts, TWU accounts for class sizes
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="semibold">Workload Distribution:</Text> Helps identify imbalances in teaching loads
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="semibold">Resource Planning:</Text> Better allocation of teaching resources
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="semibold">Yearly Average:</Text> Comparing across semesters reveals consistent workload patterns
                </ListItem>
              </UnorderedList>
            </Box>

            <Divider />

            {/* Course Complexity Explanation */}
            <Box>
              <Heading size="sm" color="cyan.700" mb={2}>Course Complexity</Heading>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Course Complexity counts the number of <Text as="span" fontWeight="bold">unique courses</Text> (based on subject code) 
                a faculty member teaches, not the total number of subject entries.
              </Text>
              <Box bg="cyan.50" p={3} borderRadius="md" border="1px solid" borderColor="cyan.200">
                <Text fontSize="sm" color="cyan.800">
                  <Text as="span" fontWeight="bold">Example:</Text> If a professor teaches "CS301 - Data Structures" to 3 different sections, 
                  the course complexity counts as <Badge colorScheme="cyan">1</Badge> (one unique course preparation based on code CS301), 
                  not 3.
                </Text>
              </Box>
              <Text fontSize="xs" color="gray.500" mt={2}>
                This metric reflects actual preparation effort - teaching the same course (same subject code) to multiple sections 
                requires one preparation, not multiple.
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter bg="gray.50" borderBottomRadius="xl">
          <Button colorScheme="purple" onClick={onClose}>
            Got it!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const MasterLoadDataTable = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isDownloadOpen, onOpen: onDownloadOpen, onClose: onDownloadClose } = useDisclosure();
  const { isOpen: isTWUOpen, onOpen: onTWUOpen, onClose: onTWUClose } = useDisclosure();
  
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
  const [previousDataFetched, setPreviousDataFetched] = useState(false); // Track if previous data fetch was attempted
  
  // Data states
  const [currentLoadData, setCurrentLoadData] = useState([]);
  const [previousLoadData, setPreviousLoadData] = useState([]);
  const [showYearlyLoad, setShowYearlyLoad] = useState(true); // Default to true
  const [error, setError] = useState(null);
  
  // Download options
  const [includeYearlyInDownload, setIncludeYearlyInDownload] = useState(true);
  
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

  // Compute faculty load with Teaching Work Units (TWU) algorithm
  // TWU = Σ (hours × student count) for each subject
  const computeFacultyLoad = useCallback((subjects, facultyName, department, designation) => {
    // Total contact hours by type
    const total = { theory: 0, laboratory: 0, tutorial: 0, total: 0 };
    
    // Student-Hour Burden (SHB) by type = Σ (hours × students)
    const studentHourBurden = {
      theory: 0,
      laboratory: 0,
      tutorial: 0,
      total: 0
    };
    
    // Course complexity - track unique course names by type
    const uniqueCourses = {
      theory: new Set(),
      laboratory: new Set(),
      tutorial: new Set(),
      all: new Set()
    };

    subjects.forEach((item) => {
      const subType = item.subType?.toLowerCase() || 'other';
      const hours = item.count || 0;
      const studentCount = item.studentCount || 0;
      
      // Use subCode as primary identifier for unique course (more standardized)
      // Fall back to subjectFullName if subCode is not available
      const courseName = item.subCode || item.subjectFullName || 'Unknown';
      
      // Calculate Student-Hour Burden for this subject
      const shb = hours * studentCount;

      total.total += hours;
      studentHourBurden.total += shb;
      uniqueCourses.all.add(courseName);
      
      if (subType === 'theory') {
        total.theory += hours;
        studentHourBurden.theory += shb;
        uniqueCourses.theory.add(courseName);
      } else if (subType === 'laboratory') {
        total.laboratory += hours;
        studentHourBurden.laboratory += shb;
        uniqueCourses.laboratory.add(courseName);
      } else if (subType === 'tutorial') {
        total.tutorial += hours;
        studentHourBurden.tutorial += shb;
        uniqueCourses.tutorial.add(courseName);
      }
    });

    // Convert Sets to counts for course complexity
    const courseComplexity = {
      theory: uniqueCourses.theory.size,
      laboratory: uniqueCourses.laboratory.size,
      tutorial: uniqueCourses.tutorial.size,
      total: uniqueCourses.all.size
    };

    // Teaching Work Units (TWU) = Total Student-Hour Burden
    // This represents the true instructional workload
    const teachingWorkUnits = studentHourBurden.total.toFixed(2);

    return {
      faculty: facultyName,
      department,
      designation,
      total,
      studentHourBurden,
      courseComplexity,
      teachingWorkUnits,
      subjects
    };
  }, []);

  // Fetch department data for a specific session
  const fetchDepartmentData = useCallback(async (session, department, isPrevious = false) => {
    if (!session || !department) return [];

    const setLoading = isPrevious ? setLoadingPrevious : setLoadingCurrent;
    setLoading(true);
    
    // Reset previousDataFetched when starting a new fetch for previous session
    if (isPrevious) {
      setPreviousDataFetched(false);
    }
    
    try {
      // Always fetch the timetable code based on session and department
      // This ensures both current and previous sessions use the same logic
      const cacheKey = `${session}-${department}`;
      let code;
      
      if (deptCodesCache.current[cacheKey]) {
        code = deptCodesCache.current[cacheKey];
      } else {
        const codeResponse = await fetch(
          `${apiUrl}/timetablemodule/timetable/getcode/${session}/${department}`,
          { credentials: 'include' }
        );
        if (!codeResponse.ok) {
          console.error(`No timetable found for ${department} in ${session}`);
          if (isPrevious) setPreviousDataFetched(true);
          return [];
        }
        code = await codeResponse.json();
        deptCodesCache.current[cacheKey] = code;
      }

      if (!code) {
        if (isPrevious) setPreviousDataFetched(true);
        return [];
      }

      setLoadingProgress({ current: 0, total: 3, stage: 'Fetching subject data...' });

      // Fetch subject data and faculty list in parallel
      const [subjectResponse, facultyResponse] = await Promise.all([
        fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${code}`, { credentials: 'include' }),
        fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { credentials: 'include' })
      ]);

      const subjectData = subjectResponse.ok ? await subjectResponse.json() : [];
      const faculties = facultyResponse.ok ? await facultyResponse.json() : [];

      if (!Array.isArray(faculties) || faculties.length === 0) {
        if (isPrevious) setPreviousDataFetched(true);
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

      // Sort by TWU (descending)
      facultyLoadData.sort((a, b) => parseFloat(b.teachingWorkUnits) - parseFloat(a.teachingWorkUnits));

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
      if (isPrevious) {
        setPreviousDataFetched(true); // Mark as fetched when done (success or failure)
      }
    }
  }, [apiUrl, generateInitialTimetableData, generateSummary, computeFacultyLoad, toast]);

  // Fetch current session data when department or session changes
  useEffect(() => {
    if (selectedSession && selectedDepartment && !deptLoading) {
      // Clear all data when session changes
      setCurrentLoadData([]);
      setPreviousLoadData([]);
      setPreviousDataFetched(false);
      
      fetchDepartmentData(selectedSession, selectedDepartment, false).then(setCurrentLoadData);
    }
  }, [selectedSession, selectedDepartment, deptLoading, fetchDepartmentData]);

  // Automatically fetch previous session data for yearly load
  useEffect(() => {
    const fetchPreviousData = async () => {
      // Clear previous data when previous session changes
      setPreviousLoadData([]);
      setPreviousDataFetched(false);
      
      if (previousSession && selectedDepartment && currentLoadData.length > 0 && !loadingCurrent) {
        const data = await fetchDepartmentData(previousSession, selectedDepartment, true);
        setPreviousLoadData(data);
      } else if (!previousSession) {
        // If no previous session selected, mark as fetched (no data to fetch)
        setPreviousDataFetched(true);
      }
    };
    
    fetchPreviousData();
  }, [previousSession, selectedDepartment, currentLoadData.length, loadingCurrent, fetchDepartmentData]);

  // Get sorted faculty list - always sorted by TWU (descending)
  // When Yearly ON: Sort by Yearly Average TWU
  // When Yearly OFF: Sort by Current TWU
  const getSortedFacultyList = useCallback(() => {
    if (currentLoadData.length === 0) return [];

    return [...currentLoadData].sort((a, b) => {
      // When yearly load is enabled and previous data is available, sort by yearly average
      if (showYearlyLoad && previousLoadData.length > 0) {
        const prevA = previousLoadData.find(f => f.faculty === a.faculty);
        const prevB = previousLoadData.find(f => f.faculty === b.faculty);
        
        const yearlyAvgA = (parseFloat(a.teachingWorkUnits) + parseFloat(prevA?.teachingWorkUnits || '0.00')) / 2;
        const yearlyAvgB = (parseFloat(b.teachingWorkUnits) + parseFloat(prevB?.teachingWorkUnits || '0.00')) / 2;
        
        return yearlyAvgB - yearlyAvgA;
      }
      
      // Otherwise, sort by current TWU (descending)
      return parseFloat(b.teachingWorkUnits) - parseFloat(a.teachingWorkUnits);
    });
  }, [currentLoadData, previousLoadData, showYearlyLoad]);

  // Calculate department totals
  const getDepartmentTotals = useCallback(() => {
    const totals = {
      theory: 0,
      laboratory: 0,
      tutorial: 0,
      total: 0,
      // Student-Hour Burden totals
      shbTheory: 0,
      shbLab: 0,
      shbTutorial: 0,
      twu: 0,
      // Course complexity
      courses: 0,
      facultyCount: currentLoadData.length
    };

    currentLoadData.forEach(f => {
      totals.theory += f.total.theory;
      totals.laboratory += f.total.laboratory;
      totals.tutorial += f.total.tutorial;
      totals.total += f.total.total;
      totals.shbTheory += f.studentHourBurden.theory;
      totals.shbLab += f.studentHourBurden.laboratory;
      totals.shbTutorial += f.studentHourBurden.tutorial;
      totals.twu += parseFloat(f.teachingWorkUnits);
      totals.courses += f.courseComplexity.total;
    });

    return totals;
  }, [currentLoadData]);

  // Download CSV
  const downloadCSV = (includeYearly = true) => {
    const sortedList = getSortedFacultyList();
    const csvData = sortedList.map((item, index) => {
      const prevFaculty = previousLoadData.find(f => f.faculty === item.faculty);
      const prevTWU = prevFaculty ? prevFaculty.teachingWorkUnits : '0.00';
      const yearlyAvg = (((parseFloat(item.teachingWorkUnits) + parseFloat(prevTWU)) / 2).toFixed(2));
      
      const baseData = {
        'Rank': index + 1,
        'Faculty': item.faculty,
        'Designation': item.designation || '',
        'Department': item.department,
        'Theory Hours': item.total.theory,
        'Lab Hours': item.total.laboratory,
        'Tutorial Hours': item.total.tutorial,
        'Total Hours': item.total.total,
        'Theory SHB (Hrs×Students)': item.studentHourBurden.theory,
        'Lab SHB (Hrs×Students)': item.studentHourBurden.laboratory,
        'Tutorial SHB (Hrs×Students)': item.studentHourBurden.tutorial,
        'Course Complexity': item.courseComplexity.total,
        'TWU (Current)': item.teachingWorkUnits,
      };

      if (includeYearly && showYearlyLoad && previousLoadData.length > 0) {
        baseData['TWU (Previous)'] = prevTWU;
        baseData['Yearly Average TWU'] = yearlyAvg;
      }

      return baseData;
    });

    const parser = new Parser();
    const csv = parser.parse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDepartment}-Faculty-TWU-${selectedSession}${includeYearly ? '-Yearly' : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download PDF
  const downloadPDF = (includeYearly = true) => {
    const sortedList = getSortedFacultyList();
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Faculty Teaching Workload - ${selectedDepartment}`, 14, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Session: ${selectedSession}${includeYearly && previousSession ? ` | Previous: ${previousSession}` : ''}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    
    // Prepare table data
    const headers = [
      '#',
      'Faculty',
      'Designation',
      'Th',
      'Lab',
      'Tut',
      'Total',
      'SHB-Th',
      'SHB-Lab',
      'SHB-Tut',
      'Courses',
      'TWU',
    ];
    
    if (includeYearly && showYearlyLoad && previousLoadData.length > 0) {
      headers.push('Prev TWU', 'Yearly Avg');
    }
    
    const tableData = sortedList.map((item, index) => {
      const prevFaculty = previousLoadData.find(f => f.faculty === item.faculty);
      const prevTWU = prevFaculty ? prevFaculty.teachingWorkUnits : '0.00';
      const yearlyAvg = (((parseFloat(item.teachingWorkUnits) + parseFloat(prevTWU)) / 2).toFixed(2));
      
      const row = [
        index + 1,
        item.faculty,
        item.designation || '-',
        item.total.theory,
        item.total.laboratory,
        item.total.tutorial,
        item.total.total,
        item.studentHourBurden.theory,
        item.studentHourBurden.laboratory,
        item.studentHourBurden.tutorial,
        item.courseComplexity.total,
        item.teachingWorkUnits,
      ];
      
      if (includeYearly && showYearlyLoad && previousLoadData.length > 0) {
        row.push(prevTWU, yearlyAvg);
      }
      
      return row;
    });
    
    // Add totals row
    const totalsRow = [
      '',
      'TOTAL',
      `${sortedList.length} faculty`,
      totals.theory,
      totals.laboratory,
      totals.tutorial,
      totals.total,
      totals.shbTheory,
      totals.shbLab,
      totals.shbTutorial,
      totals.courses,
      totals.twu.toFixed(2),
    ];
    
    if (includeYearly && showYearlyLoad && previousLoadData.length > 0) {
      const prevTotal = previousLoadData.reduce((sum, f) => sum + parseFloat(f.teachingWorkUnits || 0), 0);
      totalsRow.push(prevTotal.toFixed(2), ((totals.twu + prevTotal) / 2).toFixed(2));
    }
    
    tableData.push(totalsRow);
    
    // Generate table
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [56, 178, 172], // Teal
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { halign: 'center', cellWidth: 12 },
        4: { halign: 'center', cellWidth: 12 },
        5: { halign: 'center', cellWidth: 12 },
        6: { halign: 'center', cellWidth: 14 },
        7: { halign: 'center', cellWidth: 18 },
        8: { halign: 'center', cellWidth: 18 },
        9: { halign: 'center', cellWidth: 18 },
        10: { halign: 'center', cellWidth: 16 },
        11: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        12: { halign: 'center', cellWidth: 18 },
        13: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      },
      didParseCell: function(data) {
        // Style the last row (totals)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [237, 242, 247]; // Gray
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount} | TWU = Teaching Work Units (Σ Hours × Students)`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`${selectedDepartment}-Faculty-TWU-${selectedSession}${includeYearly ? '-Yearly' : ''}.pdf`);
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
                  Department Faculty Load
                </Heading>
                <Text color="whiteAlpha.900" fontSize={{ base: "sm", md: "md" }} maxW={{ base: "full", lg: "2xl" }}>
                  Analyze faculty workload with normalized metrics
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
                        {previousSession && ` vs ${previousSession}`}
                      </Text>
                    </VStack>
                    <HStack spacing={2} flexWrap="wrap">
                      {/* TWU Explanation Button */}
                      <Button
                        leftIcon={<QuestionIcon />}
                        onClick={onTWUOpen}
                        colorScheme="purple"
                        variant="outline"
                        size={buttonSize}
                        bg="whiteAlpha.200"
                        borderColor="whiteAlpha.400"
                        _hover={{ bg: "whiteAlpha.300" }}
                      >
                        <Text display={{ base: "none", sm: "inline" }}>How TWU Works</Text>
                        <Text display={{ base: "inline", sm: "none" }}>TWU?</Text>
                      </Button>
                      
                      {/* Toggle Yearly Load Display */}
                      <Button
                        leftIcon={showYearlyLoad ? <RepeatIcon /> : <FaCalendarAlt />}
                        onClick={() => setShowYearlyLoad(!showYearlyLoad)}
                        colorScheme={showYearlyLoad ? "green" : "gray"}
                        variant={showYearlyLoad ? "solid" : "outline"}
                        size={buttonSize}
                        bg={showYearlyLoad ? "green.500" : "whiteAlpha.200"}
                        _hover={{ bg: showYearlyLoad ? "green.600" : "whiteAlpha.300" }}
                      >
                        <Text display={{ base: "none", sm: "inline" }}>
                          {showYearlyLoad ? "Yearly: ON" : "Yearly: OFF"}
                        </Text>
                        <Text display={{ base: "inline", sm: "none" }}>
                          {showYearlyLoad ? "ON" : "OFF"}
                        </Text>
                      </Button>
                      
                      {/* Download Menu */}
                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          leftIcon={<DownloadIcon />}
                          colorScheme="green"
                          size={buttonSize}
                        >
                          <Text display={{ base: "none", sm: "inline" }}>Download</Text>
                        </MenuButton>
                        <MenuList color="gray.800">
                          <MenuItem icon={<FaFileExcel />} onClick={() => downloadCSV(true)}>
                            CSV with Yearly Data
                          </MenuItem>
                          <MenuItem icon={<FaFileExcel />} onClick={() => downloadCSV(false)}>
                            CSV (Current Session Only)
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem icon={<FaFilePdf />} onClick={() => downloadPDF(true)}>
                            PDF with Yearly Data
                          </MenuItem>
                          <MenuItem icon={<FaFilePdf />} onClick={() => downloadPDF(false)}>
                            PDF (Current Session Only)
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Flex>
                </CardHeader>

                {/* Department Summary Stats */}
                <Box p={{ base: 3, md: 4 }} bg="gray.50" borderBottom="1px" borderColor="gray.200">
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={{ base: 2, md: 3 }}>
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
                      <StatLabel fontSize="xs" color="blue.600">Total Hours</StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="blue.700">{totals.total}</StatNumber>
                      <StatHelpText fontSize="2xs">contact hrs</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="cyan.600">Courses</StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="cyan.700">{totals.courses}</StatNumber>
                      <StatHelpText fontSize="2xs">unique courses</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm" cursor="pointer" onClick={onTWUOpen} _hover={{ bg: "purple.50" }}>
                      <StatLabel fontSize="xs" color="purple.600">
                        <HStack spacing={1}>
                          <Text>Total TWU</Text>
                          <Tooltip label="Click to learn how TWU is calculated" hasArrow>
                            <InfoIcon boxSize={2.5} />
                          </Tooltip>
                        </HStack>
                      </StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="purple.700">{totals.twu.toFixed(0)}</StatNumber>
                      <StatHelpText fontSize="2xs">student-hours</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </Box>

                {/* Status indicator for previous session loading */}
                {showYearlyLoad && loadingPrevious && (
                  <Box p={3} bg="yellow.50" borderBottom="1px" borderColor="yellow.200">
                    <HStack justify="center" spacing={3}>
                      <Spinner size="sm" color="yellow.500" />
                      <Text fontSize="sm" color="yellow.700">
                        Computing previous session ({previousSession}) data... {loadingProgress.stage}
                      </Text>
                      {loadingProgress.total > 0 && (
                        <Badge colorScheme="yellow">
                          {loadingProgress.current}/{loadingProgress.total}
                        </Badge>
                      )}
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
                        <Th colSpan={4} color="green.700" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="green.50">Contact Hours</Th>
                        <Th colSpan={3} color="pink.700" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="pink.50">
                          <HStack spacing={1} justify="center">
                            <Text>Student-Hour Burden</Text>
                            <Tooltip label="Hours × Student Count for each subject" placement="top" hasArrow><InfoIcon boxSize={2.5} /></Tooltip>
                          </HStack>
                        </Th>
                        <Th rowSpan={2} color="cyan.800" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="cyan.50" verticalAlign="middle">
                          <HStack spacing={1} justify="center">
                            <Text>Courses</Text>
                            <Tooltip label="Unique courses based on subject code (same course to multiple sections = 1)" placement="top" hasArrow><InfoIcon boxSize={2.5} /></Tooltip>
                          </HStack>
                        </Th>
                        <Th rowSpan={2} color="yellow.800" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="yellow.50" verticalAlign="middle">
                          <HStack spacing={1} justify="center">
                            <Text>TWU</Text>
                            <Tooltip label="Teaching Work Units = Σ(Hours × Students)" placement="top" hasArrow><InfoIcon boxSize={2.5} /></Tooltip>
                          </HStack>
                        </Th>
                        {showYearlyLoad && (
                          <>
                            <Th rowSpan={2} color="orange.800" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="orange.50" verticalAlign="middle">
                              <VStack spacing={0}>
                                <Text>Prev TWU</Text>
                                {loadingPrevious && <Spinner size="xs" color="orange.500" />}
                              </VStack>
                            </Th>
                            <Th rowSpan={2} fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bgGradient="linear(to-r, green.100, teal.100, blue.100)" verticalAlign="middle" color="teal.800">
                              <VStack spacing={0}>
                                <Text>Yearly Avg</Text>
                                {loadingPrevious && <Spinner size="xs" color="teal.500" />}
                              </VStack>
                            </Th>
                          </>
                        )}
                      </Tr>
                      <Tr>
                        {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
                          <Th key={`total-${idx}`} color="green.700" fontSize="2xs" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="green.50" px={1}>{label}</Th>
                        ))}
                        {['Th', 'Lab', 'Tut'].map((label, idx) => (
                          <Th key={`shb-${idx}`} color="pink.700" fontSize="2xs" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="pink.50" px={1}>{label}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sortedFaculty.map((faculty, index) => {
                        const prevFaculty = previousLoadData.find(f => f.faculty === faculty.faculty);
                        const prevTWU = prevFaculty ? prevFaculty.teachingWorkUnits : '0.00';
                        const yearlyAvg = (((parseFloat(faculty.teachingWorkUnits) + parseFloat(prevTWU)) / 2).toFixed(2));
                        const designationStyle = getDesignationStyle(faculty.designation);
                        
                        // FIXED: Use previousDataFetched to determine if still computing
                        // Only show computing if: loading OR (yearly enabled AND previous session selected AND fetch not yet attempted)
                        const isComputingYearly = loadingPrevious || (showYearlyLoad && previousSession && !previousDataFetched);
                        
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
                                <Badge colorScheme="green" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.studentHourBurden.theory}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="laboratory">
                                <Badge colorScheme="red" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.studentHourBurden.laboratory}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="tutorial">
                                <Badge colorScheme="orange" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.studentHourBurden.tutorial}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="cyan.50" fontWeight="bold" fontSize="xs" px={1}>
                              <Badge colorScheme="cyan" fontSize="xs" px={2} py={1}>{faculty.courseComplexity.total}</Badge>
                            </Td>
                            <Td textAlign="center" bg="yellow.50" fontWeight="bold" fontSize="xs" px={1}>
                              <Badge colorScheme="yellow" fontSize="xs" px={2} py={1}>{faculty.teachingWorkUnits}</Badge>
                            </Td>
                            {showYearlyLoad && (
                              <>
                                <Td textAlign="center" bg="orange.50" fontWeight="bold" fontSize="xs" px={1}>
                                  {isComputingYearly ? (
                                    <HStack spacing={1} justify="center">
                                      <Spinner size="xs" color="orange.500" />
                                      <Text fontSize="2xs" color="orange.600">...</Text>
                                    </HStack>
                                  ) : (
                                    <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>{prevTWU}</Badge>
                                  )}
                                </Td>
                                <Td textAlign="center" fontWeight="bold" fontSize="xs" bgGradient="linear(to-r, green.50, teal.50, blue.50)" px={1}>
                                  {isComputingYearly ? (
                                    <HStack spacing={1} justify="center">
                                      <Spinner size="xs" color="teal.500" />
                                      <Text fontSize="2xs" color="teal.600">Computing...</Text>
                                    </HStack>
                                  ) : (
                                    <Badge bgGradient="linear(to-r, green.400, teal.400, blue.400)" color="white" fontSize="sm" px={3} py={1} borderRadius="full" boxShadow="md">
                                      {yearlyAvg}
                                    </Badge>
                                  )}
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
      
      {/* TWU Explanation Modal */}
      <TWUExplanationModal 
        isOpen={isTWUOpen} 
        onClose={onTWUClose} 
        totals={totals}
        currentLoadData={currentLoadData}
      />
    </>
  );
};

export default MasterLoadDataTable;