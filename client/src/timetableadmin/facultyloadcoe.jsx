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
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const FacultyLoadCOE = () => {
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

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

  // ==================== API FUNCTIONS ====================
  const fetchDepartmentData = useCallback(async (session, department) => {
    if (!session || !department) return [];
    setLoadingCurrent(true);
   
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
        if (!codeResponse.ok) {
          console.error(`No timetable found for ${department} in ${session}`);
          return [];
        }
        code = await codeResponse.json();
        deptCodesCache.current[cacheKey] = code;
      }
      if (!code) {
        return [];
      }
      const [subjectResponse, facultyResponse] = await Promise.all([
        fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${code}`, { credentials: 'include' }),
        fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { credentials: 'include' })
      ]);
      const subjectData = subjectResponse.ok ? await subjectResponse.json() : [];
      const faculties = facultyResponse.ok ? await facultyResponse.json() : [];
      if (!Array.isArray(faculties) || faculties.length === 0) {
        return [];
      }
      const assignments = [];
      const batchSize = 5;
      for (let i = 0; i < faculties.length; i += batchSize) {
        const batch = faculties.slice(i, i + batchSize);
       
        const batchResults = await Promise.all(
          batch.map(async (faculty) => {
            const facultyName = faculty.name;
            const designation = faculty.designation;
            try {
              const [ttResponse, commonLoadResponse] = await Promise.all([
                fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${code}/${facultyName}`, { credentials: 'include' }),
                fetch(`${apiUrl}/timetablemodule/commonLoad/${code}/${facultyName}`, { credentials: 'include' }).catch(() => ({ ok: false }))
              ]);
              if (!ttResponse.ok) return [];
              const ttData = await ttResponse.json();
              const commonLoad = commonLoadResponse.ok ? await commonLoadResponse.json() : [];
             
              const timetableData = ttData.timetableData || {};
              const initialData = generateInitialTimetableData(timetableData, 'faculty');
              const subjects = generateSummary(initialData, subjectData, facultyName, commonLoad);
             
              return subjects.map(sub => ({
                faculty: facultyName,
                designation,
                subCode: sub.subCode,
                subjectFullName: sub.subjectFullName,
                subType: sub.subType,
                hours: sub.count,
              }));
            } catch (e) {
              console.error(`Error processing faculty ${facultyName}:`, e);
              return [];
            }
          })
        );
        assignments.push(...batchResults.flat());
      }
      return assignments;
    } catch (error) {
      console.error('Error fetching department data:', error);
      setError(error);
      return [];
    } finally {
      setLoadingCurrent(false);
    }
  }, [apiUrl, generateInitialTimetableData, generateSummary]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    const fetchSessionsAndDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
       
        const data = await response.json();
        const { uniqueSessions, uniqueDept } = data;
       
        setAllSessions(uniqueSessions || []);
        setAllDepartments(
          (uniqueDept || []).map(d =>
            typeof d === "string" ? { dept: d } : { dept: d.dept || d.department }
          )
        );
       
        if (uniqueSessions?.length > 0) {
          setSelectedSession(uniqueSessions[0].session);
        }
      } catch (error) {
        console.error('Error fetching sessions and departments:', error);
        setError(error);
      } finally {
        setDeptLoading(false);
      }
    };
    fetchSessionsAndDepartments();
  }, [apiUrl]);

  useEffect(() => {
    if (!deptLoading && !selectedDepartment && allDepartments.length > 0) {
      setSelectedDepartment(allDepartments[0].dept);
    }
  }, [deptLoading, selectedDepartment, allDepartments]);

  useEffect(() => {
    if (selectedSession && selectedDepartment && !deptLoading) {
      setCurrentLoadData([]);
      fetchDepartmentData(selectedSession, selectedDepartment).then(data => {
        data.sort((a, b) => a.faculty.localeCompare(b.faculty));
        setCurrentLoadData(data);
      });
    }
  }, [selectedSession, selectedDepartment, deptLoading, fetchDepartmentData]);

  // ==================== DOWNLOAD FUNCTIONS ====================
  const downloadAll = async (filterType, format) => {
    const allData = [];
    for (const deptObj of allDepartments) {
      const d = deptObj.dept;
      const deptData = await fetchDepartmentData(selectedSession, d);
      let filtered = deptData;
      if (filterType !== 'all') {
        if (filterType === 'theory_tut') {
          filtered = filtered.filter(r => r.subType?.toLowerCase() === 'theory' || r.subType?.toLowerCase() === 'tutorial');
        } else if (filterType === 'lab') {
          filtered = filtered.filter(r => r.subType?.toLowerCase() === 'laboratory');
        } else {
          filtered = filtered.filter(r => r.subType?.toLowerCase() === filterType.toLowerCase());
        }
      }
      allData.push(...filtered.map(r => ({ ...r, department: d })));
    }
    allData.sort((a, b) => a.department.localeCompare(b.department) || a.faculty.localeCompare(b.faculty));

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(allData.map(r => ({
        Department: r.department,
        Faculty: r.faculty,
        Designation: r.designation,
        'Subject Code': r.subCode,
        'Subject Name': r.subjectFullName,
        Type: r.subType,
        Hours: r.hours
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Faculty Load");
      XLSX.writeFile(wb, `All_Departments_Load_${filterType}_${selectedSession}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF('landscape');
      doc.autoTable({
        head: [['Department', 'Faculty', 'Designation', 'Subject Code', 'Subject Name', 'Type', 'Hours']],
        body: allData.map(r => [r.department, r.faculty, r.designation, r.subCode, r.subjectFullName, r.subType, r.hours]),
      });
      doc.save(`All_Departments_Load_${filterType}_${selectedSession}.pdf`);
    }
  };

  // ==================== RENDER ====================
  const filteredData = currentLoadData.filter(r => typeFilter === 'ALL' || r.subType?.toLowerCase() === typeFilter.toLowerCase());

  return (
    <Box bg="gray.50" minH="100vh">
      <Box bgGradient="linear(to-r, teal.500, blue.600, purple.600)" pt={0} pb={{ base: 20, md: 24 }} position="relative" overflow="hidden">
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
        <Box position="relative" zIndex={2}>
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
              <Heading size={{ base: "lg", md: "xl", lg: "2xl" }} color="white" fontWeight="bold" lineHeight="1.2">
                Faculty Subject Load
              </Heading>
              <Text color="whiteAlpha.900" fontSize={{ base: "sm", md: "md" }} maxW={{ base: "full", lg: "2xl" }}>
                Department-wise teaching allocation
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

      <Container maxW="7xl" mt={-20}>
        <Card mb={6}>
          <CardHeader bg="teal.600" color="white"><Heading size="md">Filters</Heading></CardHeader>
          <CardBody>
            <SimpleGrid columns={3} spacing={4}>
              <Select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                {allSessions.map(s => <option key={s.session} value={s.session}>{s.session}</option>)}
              </Select>
              <Select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                {allDepartments.map(d => <option key={d.dept} value={d.dept}>{d.dept}</option>)}
              </Select>
              <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="ALL">All</option>
                <option value="theory">Theory</option>
                <option value="laboratory">Lab</option>
                <option value="tutorial">Tutorial</option>
                <option value="project">Project</option>
              </Select>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* ---------------- DOWNLOAD CENTER ---------------- */}
        <Card mb={6}>
          <CardHeader bg="purple.600" color="white"><Heading size="md">Download Center (All Departments)</Heading></CardHeader>
          <CardBody>
            <SimpleGrid columns={4} spacing={4}>
              <VStack>
                <Text fontWeight="bold">All Load</Text>
                <HStack>
                  <Button colorScheme="green" onClick={() => downloadAll("all", "xlsx")}>XLSX</Button>
                  <Button colorScheme="red" onClick={() => downloadAll("all", "pdf")}>PDF</Button>
                </HStack>
              </VStack>
              <VStack>
                <Text fontWeight="bold">Theory</Text>
                <HStack>
                  <Button colorScheme="green" onClick={() => downloadAll("theory", "xlsx")}>XLSX</Button>
                  <Button colorScheme="red" onClick={() => downloadAll("theory", "pdf")}>PDF</Button>
                </HStack>
              </VStack>
              <VStack>
                <Text fontWeight="bold">Theory + Tutorial</Text>
                <HStack>
                  <Button colorScheme="green" onClick={() => downloadAll("theory_tut", "xlsx")}>XLSX</Button>
                  <Button colorScheme="red" onClick={() => downloadAll("theory_tut", "pdf")}>PDF</Button>
                </HStack>
              </VStack>
              <VStack>
                <Text fontWeight="bold">Lab</Text>
                <HStack>
                  <Button colorScheme="green" onClick={() => downloadAll("lab", "xlsx")}>XLSX</Button>
                  <Button colorScheme="red" onClick={() => downloadAll("lab", "pdf")}>PDF</Button>
                </HStack>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* ---------------- TABLE ---------------- */}
        <Card>
          <CardBody p={0}>
            {loadingCurrent ? <Spinner /> : (
              <Table>
                <Thead bg="teal.50">
                  <Tr>
                    <Th>Faculty</Th><Th>Designation</Th><Th>SubCode</Th>
                    <Th>Subject</Th><Th>Type</Th><Th isNumeric>Hours</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredData.map((r, i) => (
                    <Tr key={i}>
                      <Td>{r.faculty}</Td><Td>{r.designation}</Td>
                      <Td><Badge>{r.subCode}</Badge></Td>
                      <Td>{r.subjectFullName}</Td><Td>{r.subType}</Td>
                      <Td isNumeric>{r.hours}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default FacultyLoadCOE;