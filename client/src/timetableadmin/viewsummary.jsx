import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import './Timetable.css';
import TimetableSummary from './ttsummary';
import {
  Container,
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  Badge,
  IconButton,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  Progress,
  Divider,
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  DownloadIcon,
  CheckCircleIcon,
  TimeIcon,
  InfoIcon,
} from '@chakra-ui/icons';
import downloadPDF from '../filedownload/downloadpdf';
import generateSummaryTablePDF from '../filedownload/downloadsummary';
import Header from '../components/header';

const PrintSummary = () => {
  const [TTData, setTTData] = useState([]);
  const [deptFaculties, setDeptFaculties] = useState([]);
  const [timetableData, setTimetableData] = useState({});
  const [summaryData, setSummaryData] = useState({});
  const [type, setType] = useState('');
  const [updateTime, setUpdatedTime] = useState('');
  const [headTitle, setHeadTitle] = useState('');
  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const [lockedTime, setLockedTime] = useState();
  const [savedTime, setSavedTime] = useState();
  const [facultyUpdateTime, setFacultyUpdateTime] = useState();
  const [roomUpdateTime, setRoomUpdateTime] = useState();
  const [subjectData, setSubjectData] = useState([]);
  const [downloadType, setDownloadType] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [initiateStatus, setInitiateStatus] = useState('');
  const [slotStatus, setSlotStatus] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [headerStatus, setHeaderStatus] = useState('');
  const [prepareStatus, setPrepareStatus] = useState('');
  const [startStatus, setStartStatus] = useState('');
  const [completeStatus, setCompleteStatus] = useState('');
  const [commonLoad, setCommonLoad] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];
  const apiUrl = getEnvironment();
  const currentPath = location.pathname;

  useEffect(() => {
    const fetchSem = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);
          setAvailableSems(semValues);
          setDownloadStatus('fetchingSemesters');
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchRoom = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addroom?code=${currentCode}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((room) => room.code === currentCode);
          const semValues = filteredSems.map((room) => room.room);
          setAvailableRooms(semValues);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchFaculty = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addfaculty/all?code=${currentCode}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setAvailableFaculties(data);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    fetchSem();
    fetchRoom(currentCode);
    fetchFaculty();
  }, []);

  const fetchData = async (semester) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`, { credentials: 'include' });
      const data1 = await response.json();
      const data = data1.timetableData;
      const notes = data1.notes;
      const initialData = generateInitialTimetableData(data, 'sem');
      return { initialData, notes };
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };

  const fetchTime = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`, { credentials: 'include' });
      const data = await response.json();
      setLockedTime(data.updatedTime.lockTimeIST);
      setSavedTime(data.updatedTime.saveTimeIST);
      return data.updatedTime.lockTimeIST;
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
    }
  };

  const fetchTimetableData = async (semester) => {
    setDownloadStatus('fetchingSlotData');
    const { initialData, notes } = await fetchData(semester);
    setDownloadStatus('fetchingSummaryData');
    return { initialData, notes };
  };

  const facultyData = async (currentCode, faculty) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`, { credentials: 'include' });
      const data1 = await response.json();
      const data = data1.timetableData;
      const updateTime = data1.updatedTime;
      const notes = data1.notes;
      const initialData = generateInitialTimetableData(data, 'faculty');
      return { initialData, updateTime, notes };
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };

  const fetchFacultyData = async (currentCode, faculty) => {
    const { initialData, updateTime, notes } = await facultyData(currentCode, faculty);
    setSlotStatus('fetchingSlotData');
    return { initialData, updateTime, notes };
  };

  const roomData = async (currentCode, room) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`, { credentials: 'include' });
      const data1 = await response.json();
      const data = data1.timetableData;
      const updateTime = data1.updatedTime;
      const notes = data1.notes;
      const initialData = generateInitialTimetableData(data, 'room');
      return { initialData, updateTime, notes };
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };

  const fetchRoomData = async (currentCode, room) => {
    const { initialData, updateTime, notes } = await roomData(currentCode, room);
    return { initialData, updateTime, notes };
  };

  const generateInitialTimetableData = (fetchedData, type) => {
    const initialData = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 'lunch'];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        if (period == 'lunch') {
          initialData[day]['lunch'] = [];
          if (fetchedData[day] && fetchedData[day]['lunch']) {
            const slotData = fetchedData[day]['lunch'];
            for (const slot of slotData) {
              const slotSubjects = [];
              let faculty = '';
              let room = '';
              for (const slotItem of slot) {
                const subj = slotItem.subject || '';
                if (type == 'room') {
                  room = slotItem.sem || '';
                } else {
                  room = slotItem.room || '';
                }
                if (type == 'faculty') {
                  faculty = slotItem.sem || '';
                } else {
                  faculty = slotItem.faculty || '';
                }
                if (subj || room || faculty) {
                  slotSubjects.push({
                    subject: subj,
                    room: room,
                    faculty: faculty,
                  });
                }
              }
              initialData[day]['lunch'].push(slotSubjects);
            }
          }
        } else {
          initialData[day][`period${period}`] = [];
          if (fetchedData[day] && fetchedData[day][`period${period}`]) {
            const slotData = fetchedData[day][`period${period}`];
            for (const slot of slotData) {
              const slotSubjects = [];
              let faculty = '';
              let room = '';
              for (const slotItem of slot) {
                const subj = slotItem.subject || '';
                if (type == 'room') {
                  room = slotItem.sem || '';
                } else {
                  room = slotItem.room || '';
                }
                if (type == 'faculty') {
                  faculty = slotItem.sem || '';
                } else {
                  faculty = slotItem.faculty || '';
                }
                if (subj || room || faculty) {
                  slotSubjects.push({
                    subject: subj,
                    room: room,
                    faculty: faculty,
                  });
                }
              }
              if (slotSubjects.length === 0) {
                slotSubjects.push({
                  subject: '',
                  room: '',
                  faculty: '',
                });
              }
              initialData[day][`period${period}`].push(slotSubjects);
            }
          } else {
            initialData[day][`period${period}`].push([]);
          }
        }
      }
    }
    console.log('initial datat to be received', initialData);
    return initialData;
  };

  const fetchSubjectData = async (currentCode) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`);
      const data = await response.json();
      setSubjectData(data);
      return data;
    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };

  const fetchTTData = async (currentCode) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await response.json();
      setTTData(data);
      return data;
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
  };

  const fetchDeptFaculty = async (currentCode) => {
    try {
      const fetchedttdetails = await fetchTTData(currentCode);
      const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails[0].dept}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDeptFaculties(data);
        console.log('deptfaculties', data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };

  const fetchCommonLoad = async (currentCode, viewFaculty) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/commonLoad/${currentCode}/${viewFaculty}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('faculty common response', data);
        setCommonLoad(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching commonload:', error);
    }
  };

  function generateSummary(timetableData, subjectData, type, headTitle, commonLoad) {
    console.log(headTitle);
    console.log('load', commonLoad);
    const summaryData = {};

    for (const day in timetableData) {
      for (let period = 1; period <= 9; period++) {
        let slots = '';
        if (period == 9) {
          slots = timetableData[day]['lunch'];
        } else {
          slots = timetableData[day][`period${period}`];
        }
        if (slots) {
          slots.forEach((slot) => {
            slot.forEach((cell) => {
              if (cell.subject) {
                const { subject, faculty, room } = cell;
                let foundSubject = '';
                if (type == 'faculty') {
                  foundSubject = subjectData.find((item) => item.subName === subject && item.sem === faculty);
                } else if (type == 'room') {
                  foundSubject = subjectData.find((item) => item.subName === subject && item.sem === room);
                } else if (type == 'sem') {
                  foundSubject = subjectData.find((item) => item.subName === subject && item.sem === headTitle);
                }
                if (foundSubject) {
                  if (!summaryData[subject]) {
                    console.log('subcode inside', foundSubject.subCode);
                    summaryData[subject] = {
                      subCode: foundSubject.subCode,
                      count: 1,
                      faculties: [faculty],
                      subType: foundSubject.type,
                      rooms: [room],
                      subjectFullName: foundSubject.subjectFullName,
                      subSem: foundSubject.sem,
                    };
                    console.log('sum', summaryData[subject]);
                  } else {
                    summaryData[subject].count++;
                    if (!summaryData[subject].faculties.includes(faculty)) {
                      summaryData[subject].faculties.push(faculty);
                    }
                    if (!summaryData[subject].rooms.includes(room)) {
                      summaryData[subject].rooms.push(room);
                    }
                  }
                }
              }
            });
          });
        }
      }
    }

    const mergedSummaryData = {};
    for (const key in summaryData) {
      const entry = summaryData[key];
      const subCode = entry.subCode;
      let isMerged = false;
      for (const existingKey in mergedSummaryData) {
        const existingEntry = mergedSummaryData[existingKey];
        if (
          entry.faculties.every((faculty) => existingEntry.faculties.includes(faculty)) &&
          entry.subType === existingEntry.subType &&
          entry.subjectFullName === existingEntry.subjectFullName &&
          entry.rooms.every((room) => existingEntry.rooms.includes(room))
        ) {
          existingEntry.count += entry.count;
          existingEntry.faculties = [...new Set([...existingEntry.faculties, ...entry.faculties])];
          existingEntry.originalKeys.push(key);
          isMerged = true;
          break;
        }
      }
      if (!isMerged) {
        mergedSummaryData[key] = { ...entry, originalKeys: [key] };
      }
    }

    const sortedSummary = Object.values(mergedSummaryData).sort((a, b) => {
      const subCodeComparison = a.subCode.localeCompare(b.subCode);
      if (subCodeComparison !== 0) {
        return subCodeComparison;
      }
      const subtypePriority = (subtype) => {
        switch (subtype.toLowerCase()) {
          case 'theory':
            return 0;
          case 'tutorial':
            return 1;
          case 'laboratory':
            return 2;
          default:
            return 3;
        }
      };
      const aPriority = subtypePriority(a.subType);
      const bPriority = subtypePriority(b.subType);
      return aPriority - bPriority;
    });

    let sortedSummaryEntries = { ...sortedSummary };

    if (commonLoad) {
      commonLoad.forEach((commonLoadItem) => {
        sortedSummaryEntries = {
          ...sortedSummaryEntries,
          [commonLoadItem.subCode]: {
            ...sortedSummaryEntries[commonLoadItem.subCode],
            count: commonLoadItem.hrs,
            faculties: [],
            originalKeys: [commonLoadItem.subName],
            rooms: [],
            subCode: commonLoadItem.subCode,
            subjectFullName: commonLoadItem.subFullName,
            subType: commonLoadItem.subType,
            subSem: commonLoadItem.sem,
          },
        };
      });
    }

    console.log('summary dataaaa', sortedSummaryEntries);
    return sortedSummaryEntries;
  }

  const fetchAndStoreTimetableDataForAllSemesters = async () => {
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus('fetchingHeadersFooters');
    const fetchedttdetails = await fetchTTData(currentCode);

    for (const semester of availableSems) {
      const { initialData, notes } = await fetchTimetableData(semester);
      const fetchedttdata = initialData;
      const semNotes = notes;
      const summaryData = generateSummary(fetchedttdata, subjectData, 'sem', semester);
      const lockTime = await fetchTime();
      const postData = {
        session: fetchedttdetails[0].session,
        name: semester,
        type: 'sem',
        timeTableData: fetchedttdata,
        summaryData: summaryData,
        updatedTime: lockTime,
        TTData: fetchedttdetails,
        headTitle: semester,
      };
      setPrepareStatus('preparingDownload');
      downloadPDF(fetchedttdata, summaryData, 'sem', fetchedttdetails, lockTime, semester, semNotes);
      setStartStatus('downloadStarted');
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(semester);
    }
    setCompleteStatus('downloadCompleted');
  };

  const fetchAndStoreTimetableDataForAllFaculty = async () => {
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus('fetchingHeadersFooters');
    const allFacultySummaries = [];
    const fetchedttdetails = await fetchTTData(currentCode);

    for (const faculty of availableFaculties) {
      const { initialData, updateTime, notes } = await fetchFacultyData(currentCode, faculty);
      const fetchedttdata = initialData;
      const facultyNotes = notes;
      const projectLoad = await fetchCommonLoad(currentCode, faculty);
      const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty', faculty, projectLoad);
      allFacultySummaries.push({ faculty, summaryData });
      const lockTime = updateTime;
      setHeaderStatus('fetchingHeadersFooters');
      const postData = {
        session: fetchedttdetails[0].session,
        name: faculty,
        type: 'faculty',
        timeTableData: fetchedttdata,
        summaryData: summaryData,
        updatedTime: lockTime,
        TTData: fetchedttdetails,
        headTitle: faculty,
      };
      setNoteStatus('fetchingNotes');
      setDownloadStatus('preparingDownload');
      setPrepareStatus('preparingDownload');
      downloadPDF(fetchedttdata, summaryData, 'faculty', fetchedttdetails, lockTime, faculty, facultyNotes);
      setDownloadStatus('downloadStarted');
      setStartStatus('downloadStarted');
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(faculty);
    }
    setCompleteStatus('downloadCompleted');
  };

  const fetchAndStoreTimetableDataForAllRoom = async () => {
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus('fetchingHeadersFooters');
    const fetchedttdetails = await fetchTTData(currentCode);

    for (const room of availableRooms) {
      const { initialData, updateTime, notes } = await fetchRoomData(currentCode, room);
      const fetchedttdata = initialData;
      const roomNotes = notes;
      const summaryData = generateSummary(fetchedttdata, subjectData, 'room', room);
      const lockTime = updateTime;
      setHeaderStatus('fetchingHeadersFooters');
      const postData = {
        session: fetchedttdetails[0].session,
        name: room,
        type: 'room',
        timeTableData: fetchedttdata,
        summaryData: summaryData,
        updatedTime: lockTime,
        TTData: fetchedttdetails,
        headTitle: room,
      };
      setNoteStatus('fetchingNotes');
      setDownloadStatus('preparingDownload');
      setPrepareStatus('preparingDownload');
      downloadPDF(fetchedttdata, summaryData, 'room', fetchedttdetails, lockTime, room, roomNotes);
      setDownloadStatus('downloadStarted');
      setStartStatus('downloadStarted');
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(room);
    }
    setCompleteStatus('downloadCompleted');
  };

  const fetchDeptLoadAllocation = async () => {
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus('fetchingHeadersFooters');
    const allFacultySummaries = [];
    const fetchedttdetails = await fetchTTData(currentCode);
    const filteredFaculties = await fetchDeptFaculty(currentCode);
    const facultyNames = [];

    for (const faculty of filteredFaculties) {
      facultyNames.push(faculty.name);
    }
    for (const faculty of facultyNames) {
      const { initialData, updateTime, notes } = await fetchFacultyData(currentCode, faculty);
      const fetchedttdata = initialData;
      const facultyNotes = notes;
      const projectLoad = await fetchCommonLoad(currentCode, faculty);
      const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty', faculty, projectLoad);
      allFacultySummaries.push({ faculty, summaryData });
      console.log(summaryData);
      const lockTime = updateTime;
      setHeaderStatus('fetchingHeadersFooters');
      const postData = {
        session: fetchedttdetails[0].session,
        name: faculty,
        type: 'faculty',
        timeTableData: fetchedttdata,
        summaryData: summaryData,
        updatedTime: lockTime,
        TTData: fetchedttdetails,
        headTitle: faculty,
      };
      setDownloadStatus('preparingDownload');
      setPrepareStatus('preparingDownload');
      setDownloadStatus('downloadStarted');
      setStartStatus('downloadStarted');
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(faculty);
    }
    console.log(allFacultySummaries);
    generateSummaryTablePDF(allFacultySummaries, filteredFaculties, fetchedttdetails[0].session, fetchedttdetails[0].dept);
    setCompleteStatus('downloadCompleted');
  };

  const handleDownloadAllSemesters = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('sem');
    setInitiateStatus('starting');
    fetchAndStoreTimetableDataForAllSemesters();
  };

  const handleDownloadAllFaculty = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('faculty');
    setInitiateStatus('starting');
    fetchAndStoreTimetableDataForAllFaculty();
  };

  const handleDownloadAllRoom = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('room');
    setInitiateStatus('starting');
    fetchAndStoreTimetableDataForAllRoom();
  };

  const handleDownloadDeptLoadDistribution = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('load');
    setInitiateStatus('starting');
    fetchDeptLoadAllocation();
  };

  const getStatusMessage = (type) => {
    if (downloadType !== type) return null;

    if (initiateStatus === 'starting') {
      return (
        <Alert status="info" borderRadius="md" mt={3}>
          <AlertIcon />
          <AlertDescription>
            Initiating download. It may take a while! Sit back and relax!
          </AlertDescription>
        </Alert>
      );
    }

    if (slotStatus === 'fetchingSlotData') {
      return (
        <Alert status="info" borderRadius="md" mt={3}>
          <AlertIcon />
          <AlertDescription>Fetching slot data...</AlertDescription>
        </Alert>
      );
    }

    if (summaryStatus === 'fetchingSummaryData') {
      return (
        <Alert status="info" borderRadius="md" mt={3}>
          <AlertIcon />
          <AlertDescription>Fetching summary data...</AlertDescription>
        </Alert>
      );
    }

    if (noteStatus === 'fetchingNotes') {
      return (
        <Alert status="info" borderRadius="md" mt={3}>
          <AlertIcon />
          <AlertDescription>{type === 'load' ? 'Fetching department faculties...' : 'Fetching notes...'}</AlertDescription>
        </Alert>
      );
    }

    if (headerStatus === 'fetchingHeadersFooters') {
      return (
        <Alert status="info" borderRadius="md" mt={3}>
          <AlertIcon />
          <AlertDescription>Fetching headers and footers...</AlertDescription>
        </Alert>
      );
    }

    if (prepareStatus === 'preparingDownload') {
      return (
        <Alert status="warning" borderRadius="md" mt={3}>
          <AlertIcon />
          <AlertDescription>Preparing download...</AlertDescription>
        </Alert>
      );
    }

    if (startStatus === 'downloadStarted') {
      return (
        <Alert status="warning" borderRadius="md" mt={3}>
          <AlertIcon />
          <AlertDescription>Download in progress. Check downloads folder!</AlertDescription>
        </Alert>
      );
    }

    if (completeStatus === 'downloadCompleted') {
      return (
        <Alert status="success" borderRadius="md" mt={3}>
          <CheckCircleIcon mr={2} />
          <AlertDescription fontWeight="bold">Download Completed!</AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header Section */}
      <Box
        bgGradient="linear(to-r, purple.500, purple.600, pink.600)"
        pt={0}
        pb={8}
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
            '& button[aria-label="Go back"]': { display: 'none' },
            '& .chakra-button:first-of-type': { display: 'none' },
          }}
        >
          <Header />
        </Box>

        <Container maxW="7xl" position="relative" mt={4}>
          <Flex justify="space-between" align="center" w="full" gap={4}>
            <HStack spacing={3}>
              <Badge colorScheme="whiteAlpha" fontSize="xs" px={2} py={1} borderRadius="full">
                Bulk Downloads
              </Badge>
              <Heading size="lg" color="white" fontWeight="bold">
                XCEED Express Download
              </Heading>
            </HStack>

            <IconButton
              icon={<ArrowBackIcon />}
              aria-label="Go back"
              onClick={() => window.history.back()}
              size="md"
              bg="rgba(255, 255, 255, 0.2)"
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
              _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
              borderRadius="full"
              boxShadow="md"
              border="2px solid"
              borderColor="whiteAlpha.400"
              flexShrink={0}
            />
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-2} position="relative" zIndex={1} pb={16}>
        <VStack spacing={6} align="stretch">
          {/* Info Alert */}
          <Alert status="info" borderRadius="xl" variant="left-accent">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" mb={1}>
                Bulk Download Timetables
              </Text>
              <Text fontSize="sm">
                Download all semester, faculty, or room timetables in one click. The process may take several minutes depending on the number of items.
              </Text>
            </Box>
          </Alert>

          {/* Semesters Download Card */}
          <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="gray.300">
            <CardHeader bg="purple.600" color="white" p={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">All Semesters</Heading>
                {downloadStatus === 'fetchingSemesters' && availableSems.length > 0 && (
                  <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                    {availableSems.length} Semesters
                  </Badge>
                )}
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <VStack align="stretch" spacing={3}>
                <Text color="gray.600" fontSize="sm">
                  Download PDF timetables for all available semesters in the current session.
                </Text>
                <Button
                  onClick={handleDownloadAllSemesters}
                  colorScheme="purple"
                  size="lg"
                  leftIcon={<DownloadIcon />}
                  isDisabled={downloadType && downloadType !== 'sem' && completeStatus !== 'downloadCompleted'}
                >
                  Download All Semesters
                </Button>
                {getStatusMessage('sem')}
              </VStack>
            </CardBody>
          </Card>

          {/* Faculty Download Card */}
          <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="gray.300">
            <CardHeader bg="teal.600" color="white" p={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">All Faculty</Heading>
                {downloadStatus === 'fetchingSemesters' && availableFaculties.length > 0 && (
                  <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                    {availableFaculties.length} Faculty
                  </Badge>
                )}
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <VStack align="stretch" spacing={3}>
                <Text color="gray.600" fontSize="sm">
                  Download PDF timetables for all faculty members in the current session.
                </Text>
                <Button
                  onClick={handleDownloadAllFaculty}
                  colorScheme="teal"
                  size="lg"
                  leftIcon={<DownloadIcon />}
                  isDisabled={downloadType && downloadType !== 'faculty' && completeStatus !== 'downloadCompleted'}
                >
                  Download All Faculty Timetables
                </Button>
                {getStatusMessage('faculty')}
              </VStack>
            </CardBody>
          </Card>

          {/* Rooms Download Card */}
          <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="gray.300">
            <CardHeader bg="green.600" color="white" p={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md">All Rooms</Heading>
                {downloadStatus === 'fetchingSemesters' && availableRooms.length > 0 && (
                  <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                    {availableRooms.length} Rooms
                  </Badge>
                )}
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <VStack align="stretch" spacing={3}>
                <Text color="gray.600" fontSize="sm">
                  Download PDF timetables for all rooms in the current session.
                </Text>
                <Button
                  onClick={handleDownloadAllRoom}
                  colorScheme="green"
                  size="lg"
                  leftIcon={<DownloadIcon />}
                  isDisabled={downloadType && downloadType !== 'room' && completeStatus !== 'downloadCompleted'}
                >
                  Download All Room Timetables
                </Button>
                {getStatusMessage('room')}
              </VStack>
            </CardBody>
          </Card>

          {/* Load Allocation Card */}
          <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="gray.300">
            <CardHeader bg="orange.600" color="white" p={4}>
              <Heading size="md">Department Load Allocation</Heading>
            </CardHeader>
            <CardBody p={6}>
              <VStack align="stretch" spacing={3}>
                <Text color="gray.600" fontSize="sm">
                  Generate and download department-wise load allocation summary for all faculty.
                </Text>
                <Button
                  onClick={handleDownloadDeptLoadDistribution}
                  colorScheme="orange"
                  size="lg"
                  leftIcon={<DownloadIcon />}
                  isDisabled={downloadType && downloadType !== 'load' && completeStatus !== 'downloadCompleted'}
                >
                  Download Department Load Allocation
                </Button>
                {getStatusMessage('load')}
              </VStack>
            </CardBody>
          </Card>

          <Divider />

          {/* Merge PDF Navigation */}
          <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="blue.300">
            <CardBody p={6}>
              <Flex justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color="blue.700">
                    Merge Multiple PDFs
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Combine multiple downloaded PDFs into a single document
                  </Text>
                </VStack>
                <Button
                  as={Link}
                  to={`${currentPath}/mergepdf`}
                  colorScheme="blue"
                  size="lg"
                  rightIcon={<InfoIcon />}
                >
                  Go to Merge PDF
                </Button>
              </Flex>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default PrintSummary;