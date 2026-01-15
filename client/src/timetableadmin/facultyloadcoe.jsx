import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Container,
  Select,
  Button,
  VStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  SimpleGrid,
  Flex,
  HStack,
  IconButton,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { ArrowBackIcon, DownloadIcon, RepeatIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

const FacultyLoadCalculation = () => {
  const navigate = useNavigate();
  const apiUrl = getEnvironment();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [allSessions, setAllSessions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [deptLoading, setDeptLoading] = useState(true);

  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [currentLoadData, setCurrentLoadData] = useState([]);
  const [error, setError] = useState(null);

  const deptCodesCache = useRef({});

  // ==================== UTILITY FUNCTIONS ====================
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
                const { subject, faculty } = cell;
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
    if (commonLoad && Array.isArray(commonLoad)) {
      commonLoad.forEach((item) => {
        subjects.push({
          count: item.hrs,
          subCode: item.subCode,
          subjectFullName: item.subFullName,
          subType: item.subType,
          subSem: item.sem,
        });
      });
    }
    return subjects;
  }, []);

  // ==================== MERGE SAME SUBJECT NAME ====================
  const mergeSameSubjectNames = (data) => {
    const grouped = {};

    data.forEach(item => {
      const key = `${item.faculty}|${item.designation}|${item.subjectFullName}|${item.subType}`;
      if (!grouped[key]) {
        grouped[key] = { ...item, hours: 0 };
      }
      grouped[key].hours += item.hours;
    });

    return Object.values(grouped);
  };

  // ==================== API FUNCTIONS ====================
  const fetchDepartmentData = useCallback(async (session, department) => {
    if (!session || !department) return [];
    // setLoadingCurrent(true);
   
    try {
      const cacheKey = `${session}-${department}`;
      let code;
     
      if (deptCodesCache.current[cacheKey]) {
        code = deptCodesCache.current[cacheKey];
      } else {
        const codeResponse = await fetch(
          `${apiUrl}/timetablemodule/timetable/getcode/${session}/${department}`,
          { credentials: 'include' }
        );
        if (!codeResponse.ok) return [];
        code = await codeResponse.json();
        deptCodesCache.current[cacheKey] = code;
      }
      if (!code) return [];

      const [subjectResponse, facultyResponse] = await Promise.all([
        fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${code}`, { credentials: 'include' }),
        fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { credentials: 'include' })
      ]);

      const subjectData = subjectResponse.ok ? await subjectResponse.json() : [];
      const faculties = facultyResponse.ok ? await facultyResponse.json() : [];

      if (!faculties?.length) return [];

      const assignments = [];

      for (const faculty of faculties) {
        try {
          const [ttResponse, commonResponse] = await Promise.all([
            fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${code}/${faculty.name}`, { credentials: 'include' }),
            fetch(`${apiUrl}/timetablemodule/commonLoad/${code}/${faculty.name}`, { credentials: 'include' }).catch(() => ({ ok: false }))
          ]);

          if (!ttResponse.ok) continue;

          const ttData = await ttResponse.json();
          const commonLoad = commonResponse.ok ? await commonResponse.json() : [];

          const timetableData = ttData.timetableData || {};
          const initialData = generateInitialTimetableData(timetableData, 'faculty');
          const subjects = generateSummary(initialData, subjectData, faculty.name, commonLoad);

          const facultyAssignments = subjects.map(sub => ({
            faculty: faculty.name,
            designation: faculty.designation || 'N/A',
            subCode: sub.subCode || 'N/A',
            subjectFullName: sub.subjectFullName || sub.subCode || 'Unknown',
            subType: sub.subType || 'Other',
            hours: sub.count,
            subSem: sub.subSem || 'N/A'
          }));

          assignments.push(...facultyAssignments);
        } catch (e) {
          console.error(`Error processing ${faculty.name}:`, e);
        }
      }

      return mergeSameSubjectNames(assignments);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      return [];
    } 
  }, [apiUrl, generateInitialTimetableData, generateSummary]);

  // ==================== DOWNLOAD CURRENT TABLE ====================
  const downloadCurrentTable = (format) => {
    if (filteredData.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to download',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    const dataToDownload = filteredData.map(r => ({
      Faculty: r.faculty,
      Designation: r.designation,
      Semester: r.subSem || '-',
      'Subject Code': r.subCode,
      'Subject Name': r.subjectFullName,
      Type: r.subType,
      Hours: r.hours
    }));

    if (format === 'csv') {
      const csvHeader = ["Faculty", "Designation", "Semester", "Subject Code", "Subject Name", "Type", "Hours"];
      const csvContent = [csvHeader, ...dataToDownload.map(row => Object.values(row))]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedDepartment}_${typeFilter}_${selectedSession}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: 'CSV file downloaded successfully',
        status: 'success',
        duration: 3000,
      });
    } else if (format === 'pdf') {
      const pdf = new jsPDF('landscape');
      
      pdf.setFontSize(16);
      pdf.text(`Department: ${selectedDepartment}`, 14, 20);
      pdf.setFontSize(11);
      pdf.text(`Session: ${selectedSession} | Type: ${typeFilter === 'ALL' ? 'All' : typeFilter.toUpperCase()}`, 14, 28);

      pdf.autoTable({
        startY: 35,
        head: [['Faculty', 'Designation', 'Semester', 'Subject Code', 'Subject Name', 'Type', 'Hours']],
        body: dataToDownload.map(r => [
          r.Faculty,
          r.Designation,
          r.Semester,
          r['Subject Code'],
          r['Subject Name'],
          r.Type,
          r.Hours
        ]),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [45, 55, 72], textColor: 255 },
      });

      pdf.save(`${selectedDepartment}_${typeFilter}_${selectedSession}.pdf`);

      toast({
        title: 'Download Complete',
        description: 'PDF file downloaded successfully',
        status: 'success',
        duration: 3000,
      });
    }
  };

  // ==================== DOWNLOAD ALL DEPARTMENTS ====================
  const downloadAll = async (filterType, format) => {
    const toastId = toast({
      title: 'Preparing Download',
      description: 'Initializing process...',
      status: 'info',
      duration: null,
      isClosable: true,
      position: 'bottom',
    });

    try {
      let allData = [];
      const pdf = format === 'pdf' ? new jsPDF('landscape') : null;
      let isFirstPage = true;

      for (let i = 0; i < allDepartments.length; i++) {
        const deptObj = allDepartments[i];
        const dept = deptObj.dept;

        toast.update(toastId, {
          description: `Fetching data for ${dept} (${i + 1}/${allDepartments.length})...`,
        });

        const rawData = await fetchDepartmentData(selectedSession, dept);
        
        let filtered = rawData;
        if (filterType !== 'all') {
          if (filterType === 'theory_tut') {
            filtered = filtered.filter(r => ['theory', 'tutorial'].includes(r.subType?.toLowerCase()));
          } else if (filterType === 'theory_lab') {
            filtered = filtered.filter(r => ['theory', 'laboratory'].includes(r.subType?.toLowerCase()));
          } else {
            filtered = filtered.filter(r => r.subType?.toLowerCase() === filterType.toLowerCase());
          }
        }

        const deptData = filtered.map(r => ({
          Department: dept,
          Faculty: r.faculty,
          Designation: r.designation,
          Semester: r.subSem || '-',
          'Subject Code': r.subCode,
          'Subject Name': r.subjectFullName,
          Type: r.subType,
          Hours: r.hours
        }));

        allData = [...allData, ...deptData];

        // PDF - one page per department
        if (format === 'pdf' && pdf) {
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;
          
          pdf.setFontSize(16);
          pdf.text(`Department: ${dept} - ${selectedSession}`, 14, 20);
          pdf.setFontSize(11);
          pdf.text(`Load Type: ${filterType === 'all' ? 'All' : filterType.toUpperCase()}`, 14, 28);

          pdf.autoTable({
            startY: 35,
            head: [['Department', 'Faculty', 'Designation', 'Semester', 'Subject Code', 'Subject Name', 'Type', 'Hours']],
            body: deptData.map(r => [
              r.Department,
              r.Faculty,
              r.Designation,
              r.Semester,
              r['Subject Code'],
              r['Subject Name'],
              r.Type,
              r.Hours
            ]),
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [45, 55, 72], textColor: 255 },
          });
        }
      }

      toast.update(toastId, {
        title: 'Generating File',
        description: 'Preparing the final file...',
      });

      if (format === 'csv') {
        const csvHeader = ["Department", "Faculty", "Designation", "Semester", "Subject Code", "Subject Name", "Type", "Hours"];
        const csvContent = [csvHeader, ...allData.map(row => Object.values(row))]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `All_Departments_${filterType}_${selectedSession}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf' && pdf) {
        pdf.save(`All_Departments_${filterType}_${selectedSession}.pdf`);
      }

      toast.update(toastId, {
        title: 'Download Complete',
        description: 'Your file has been downloaded successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (err) {
      console.error('Download error:', err);
      toast.update(toastId, {
        title: 'Error',
        description: `An error occurred: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    const fetchSessionsAndDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch sessions/departments');
       
        const data = await response.json();
        setAllSessions(data.uniqueSessions || []);
        setAllDepartments((data.uniqueDept || []).map(d => ({ dept: typeof d === 'string' ? d : d.dept || d.department })));
       
        if (data.uniqueSessions?.length > 0) {
          setSelectedSession(data.uniqueSessions[0].session);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setDeptLoading(false);
      }
    };
    fetchSessionsAndDepartments();
  }, [apiUrl]);

useEffect(() => {
  if (!selectedSession || !selectedDepartment || deptLoading) return;

  // IMPORTANT: clear old data & show spinner immediately
  setCurrentLoadData([]);
  setLoadingCurrent(true);

  fetchDepartmentData(selectedSession, selectedDepartment)
    .then(data => {
      setCurrentLoadData(data);
    })
    .finally(() => {
      setLoadingCurrent(false);
    });

}, [selectedSession, selectedDepartment, deptLoading, fetchDepartmentData]);


  // ==================== RENDER ====================
  const filteredData = currentLoadData.filter(r => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'theory_tut') {
      return ['theory', 'tutorial'].includes(r.subType?.toLowerCase());
    }
    if (typeFilter === 'theory_lab') {
      return ['theory', 'laboratory'].includes(r.subType?.toLowerCase());
    }
    return r.subType?.toLowerCase() === typeFilter.toLowerCase();
  });

  return (
    <Box bg="gray.50" minH="100vh">
      {/* Hero Header */}
      <Box
        bgGradient="linear(to-r, teal.500, blue.600, purple.600)"
        pt={8}
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

        <Container maxW="7xl" mt={{ base: 4, md: 6 }}>
          <Flex
            justify="space-between"
            align={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={6}
          >
            <VStack spacing={3} align={{ base: "center", md: "start" }} textAlign={{ base: "center", md: "left" }}>
              <Heading size={{ base: "xl", md: "2xl" }} color="white" fontWeight="bold">
                Faculty Load Dashboard
              </Heading>
              <Text color="whiteAlpha.900" fontSize={{ base: "md", md: "lg" }}>
                Department-wise teaching allocation – {selectedSession}
              </Text>
            </VStack>

            <HStack spacing={3}>
              <Button
                leftIcon={<DownloadIcon boxSize={6} />}
                onClick={onOpen}
                size="lg"
                bg="orange.500"
                color="white"
                _hover={{ bg: "orange.400" }}
                borderRadius="full"
                border="2px solid"
                borderColor="whiteAlpha.500"
              >
                Download Center
              </Button>
                
              <IconButton
                icon={<ArrowBackIcon boxSize={6} />}
                aria-label="Go back"
                onClick={() => navigate(-1)}
                size="lg"
                bg="whiteAlpha.300"
                color="white"
                _hover={{ bg: "whiteAlpha.400" }}
                borderRadius="full"
                border="2px solid"
                borderColor="whiteAlpha.500"
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-16} pb={16}>
        <VStack spacing={8} align="stretch">
          {/* Filters */}
          <Card shadow="xl" borderRadius="2xl" overflow="hidden">
            <CardHeader bg="teal.600" color="white" p={5}>
              <Heading size="md">Filters</Heading>
            </CardHeader>
            <CardBody p={6}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Select
                  value={selectedSession}
                  onChange={e => setSelectedSession(e.target.value)}
                  placeholder="Select Session"
                >
                  {allSessions.map(s => (
                    <option key={s.session} value={s.session}>{s.session}</option>
                  ))}
                </Select>

                <Select
                  value={selectedDepartment}
                  onChange={e => setSelectedDepartment(e.target.value)}
                  placeholder="Select Department"
                >
                  {allDepartments.map(d => (
                    <option key={d.dept} value={d.dept}>{d.dept}</option>
                  ))}
                </Select>

                <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="ALL">All Types</option>
                  <option value="theory">Theory</option>
                  <option value="theory_lab">Theory + Lab</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="laboratory">Lab</option>
                  <option value="theory_tut">Theory + Tutorial</option>
                </Select>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Main Table - Department Style */}
          <Card shadow="2xl" borderRadius="2xl" overflow="hidden">
            <CardHeader bg="teal.600" color="white" p={5}>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                <Heading size="md">
                  {selectedDepartment || 'Select Department'} Load Distribution
                </Heading>
                <HStack spacing={3}>
                  <Badge colorScheme="yellow" fontSize="lg" px={4} py={2}>
                    {filteredData.length} Entries
                  </Badge>
                  {filteredData.length > 0 && (
                    <Menu>
                      <MenuButton
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                        leftIcon={<DownloadIcon />}
                        colorScheme="green"
                        size="sm"
                      >
                        Download Table
                      </MenuButton>
                      <MenuList bg="green.50" borderColor="green.100">
  <MenuItem
    color="green.900"
    _hover={{ bg: 'green.100', color: 'green.900' }}
    _focus={{ bg: 'green.100', color: 'green.900' }}
    onClick={() => downloadCurrentTable('csv')}
  >
    Download as CSV
  </MenuItem>

  <MenuItem
    color="green.900"
    _hover={{ bg: 'green.100', color: 'green.900' }}
    _focus={{ bg: 'green.100', color: 'green.900' }}
    onClick={() => downloadCurrentTable('pdf')}
  >
    Download as PDF
  </MenuItem>
</MenuList>

                    </Menu>
                  )}
                </HStack>
              </Flex>
            </CardHeader>

            <CardBody p={0}>
              {loadingCurrent ? (
                <Box p={12} textAlign="center">
                  <Spinner size="xl" thickness="4px" color="teal.500" />
                  <Text mt={4} fontSize="lg" color="gray.600">Loading department load data...</Text>
                </Box>
              ) : filteredData.length === 0 ? (
                <Box p={10} textAlign="center">
                  <Alert status="info" borderRadius="lg" maxW="xl" mx="auto">
                    <AlertIcon />
                    <AlertDescription>Loading..</AlertDescription>
                  </Alert>
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size={{ base: "sm", md: "md" }}>
                    <Thead bg="teal.50">
                      <Tr>
                        <Th rowSpan={2} width="18%">Faculty Name</Th>
                        <Th rowSpan={2} width="14%">Designation</Th>
                        <Th width="10%">Sem</Th>
                        <Th width="12%">Subject Code</Th>
                        <Th width="22%">Subject Name</Th>
                        <Th width="12%">Type</Th>
                        <Th isNumeric width="10%">Hours</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredData
                        .sort((a, b) => a.faculty.localeCompare(b.faculty))
                        .map((row, i) => {
                          const isFirstForFaculty = i === 0 || filteredData[i-1].faculty !== row.faculty;
                          const rowSpan = filteredData.filter(r => r.faculty === row.faculty).length;

                          return (
                            <Tr
                              key={i}
                              bg={i % 2 === 0 ? "green.50" : "cyan.50"}
                              _hover={{ bg: "teal.100" }}
                              transition="background 0.2s"
                            >
                              {isFirstForFaculty && (
                                <>
                                  <Td rowSpan={rowSpan} fontWeight="bold" verticalAlign="top">
                                    {row.faculty}
                                  </Td>
                                  <Td rowSpan={rowSpan} verticalAlign="top">
                                    <Badge colorScheme="blue" fontSize="xs" px={3} py={1}>
                                      {row.designation}
                                    </Badge>
                                  </Td>
                                </>
                              )}
                              <Td>
                                <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
                                  {row.subSem || '-'}
                                </Badge>
                              </Td>
                              <Td>{row.subCode}</Td>
                              <Td>{row.subjectFullName}</Td>
                              <Td>
                                <Badge
                                  colorScheme={
                                    row.subType?.toLowerCase() === 'theory' ? 'green' :
                                    row.subType?.toLowerCase() === 'tutorial' ? 'orange' :
                                    row.subType?.toLowerCase() === 'laboratory' ? 'red' : 'gray'
                                  }
                                  fontSize="xs"
                                  px={3}
                                  py={1}
                                >
                                  {row.subType}
                                </Badge>
                              </Td>
                              <Td isNumeric fontWeight="bold">{row.hours}</Td>
                            </Tr>
                          );
                        })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Download Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Download Center (All Departments)</ModalHeader>
          <Text px={6} color="violet.900" fontSize={{ base: "md", md: "lg" }}>
            Current Session: {selectedSession}
          </Text>
          <ModalCloseButton />
          <ModalBody p={6}>
            <Text pb={3} color="green.900" fontSize={{ base: "md", md: "lg" }}>
              Details will be downloaded for the session selected
            </Text>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={6}>
              {[
                { label: 'All Load', type: 'all' },
                { label: 'Theory', type: 'theory' },
                { label: 'Theory + Tut', type: 'theory_tut' },
                { label: 'Theory + Lab', type: 'theory_lab' },
              ].map(item => (
                <VStack key={item.type} spacing={3}>
                  <Text fontWeight="bold" fontSize="lg">{item.label}</Text>
                  <VStack spacing={3}>
                    <Button
                      leftIcon={<DownloadIcon />}
                      colorScheme="green"
                      size="md"
                      onClick={() => downloadAll(item.type, 'csv')}
                    >
                      CSV
                    </Button>
                    <Button
                      leftIcon={<DownloadIcon />}
                      colorScheme="red"
                      size="md"
                      onClick={() => downloadAll(item.type, 'pdf')}
                    >
                      PDF
                    </Button>
                  </VStack>
                </VStack>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FacultyLoadCalculation;