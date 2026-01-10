import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { useNavigate, useLocation, Form, Link } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import ViewTimetable from './viewtt';
import TimetableSummary from './ttsummary';
import './Timetable.css';
import {
  Container,
  FormControl,
  FormLabel,
  Heading,
  Select,
  UnorderedList,
  ListItem,
  Input,
  Spinner,
  List,
  Flex,
  Box,
  Text,
  HStack,
  VStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  Badge,
  IconButton,
  Alert,
  AlertIcon,
  AlertDescription,
  Wrap,
  WrapItem,
  Divider,
} from '@chakra-ui/react';
import { 
  ArrowBackIcon, 
  SearchIcon,
  TimeIcon,
  CalendarIcon,
  ExternalLinkIcon,
} from '@chakra-ui/icons';
import Header from '../components/header';
import { Helmet } from 'react-helmet-async';
import debounce from 'lodash.debounce';

function MasterView({ autofill = false }) {
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [semNotes, setSemNotes] = useState([]);
  const [facultyNotes, setFacultyNotes] = useState([]);
  const [roomNotes, setRoomNotes] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [commonLoad, setCommonLoad] = useState();

  const apiUrl = getEnvironment();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const autofillid = parts[parts.length - 1];

  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [lockedTime, setLockedTime] = useState();
  const [facultyLockedTime, setFacultyLockedTime] = useState();
  const [roomlockedTime, setRoomLockedTime] = useState();

  const [allsessions, setAllSessions] = useState([]);
  const [availableDepts, setAvailableDepts] = useState([]);
  const [currentCode, setCurrentCode] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isSemesterDataLoading, setIsSemesterDataLoading] = useState(false);
  const [isFacultyDataLoading, setIsFacultyDataLoading] = useState(false);
  const [isRoomDataLoading, setIsRoomDataLoading] = useState(false);
  const facultySectionRef = useRef(null);
  const roomSectionRef = useRef(null);

  const [allotmentData, setAllotmentData] = useState(null);
  const [roomDeptIndex, setRoomDeptIndex] = useState({});
  const [roomCatalog, setRoomCatalog] = useState([]);
  const roomCatalogRef = useRef([]);

  useEffect(() => {
    roomCatalogRef.current = roomCatalog;
  }, [roomCatalog]);

  const semesters = availableSems;

  useEffect(() => {
    const fetchSessions = async () => {
      setIsSessionsLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`,
          { credentials: 'include' }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const { uniqueSessions, uniqueDept } = data;

        setAllSessions(uniqueSessions.map((s) => s.session));
        setAvailableDepts(uniqueDept);

        const currentSessionObj = uniqueSessions.find((s) => s.currentSession);
        if (currentSessionObj) {
          setSelectedSession(currentSessionObj.session);
        } else if (uniqueSessions.length > 0) {
          setSelectedSession(uniqueSessions[0].session);
        }
        setIsSessionsLoading(false);
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        setIsSessionsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchCode = async (session, dept) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/getcode/${session}/${dept}`,
          { credentials: 'include' }
        );
        const data1 = await response.json();
        console.log('received code:', data1);
        setCurrentCode(data1);
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };
    fetchCode(selectedSession, selectedDept);
  }, [selectedSession, selectedDept]);

  useEffect(() => {
    const fetchAllotment = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/timetablemodule/allotment?session=${selectedSession}`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const data = await res.json();
          const [allotment] = Array.isArray(data) ? data : [];
          setAllotmentData(allotment);
          console.log('Fetched allotment:', allotment);
          
          const index = {};
          const catalog = [];
          const ingest = (arr, source) => {
            if (!Array.isArray(arr)) return;
            arr.forEach(({ dept, rooms }) => {
              (rooms || []).forEach((r) => {
                const room =
                  r?.room || r?.roomNo || r?.room_no || r?.name || r?.roomName;
                if (!room || !dept) return;
                index[room] = dept;
                catalog.push({
                  room,
                  dept,
                  morningSlot: !!r.morningSlot,
                  afternoonSlot: !!r.afternoonSlot,
                });
              });
            });
          };
          ingest(allotment?.centralisedAllotments, 'centralised');
          ingest(allotment?.openElectiveAllotments, 'openElective');

          setRoomDeptIndex(index);
          setRoomCatalog(catalog);
        } else {
          console.error('Failed to fetch allotment');
          setAllotmentData(null);
          setRoomDeptIndex({});
          setRoomCatalog([]);
        }
      } catch (e) {
        console.error('Error fetching allotment:', e);
        setAllotmentData(null);
        setRoomDeptIndex({});
        setRoomCatalog([]);
      }
    };
    fetchAllotment();
  }, [apiUrl, selectedSession]);

  useEffect(() => {
    const fetchData = async (semester, currentCode) => {
      if (!semester || !currentCode) return;
      setIsSemesterDataLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`,
          { credentials: 'include' }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setSemNotes(data1.notes);
        const initialData = generateInitialTimetableData(data, 'sem');
        setViewData(initialData);
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      } finally {
        setIsSemesterDataLoading(false);
      }
    };

    const fetchViewData = async (semester, currentCode) => {
      const data = await fetchData(semester, currentCode);
    };
    fetchViewData(selectedSemester, currentCode);
  }, [selectedSemester, currentCode]);

  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
      if (!faculty || !currentCode) return {};
      setIsFacultyDataLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/lockfacultytt/${currentCode}/${faculty}`,
          { credentials: 'include' }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setFacultyLockedTime(data1.updatedTime);
        setFacultyNotes(data1.notes);
        const initialData = generateInitialTimetableData(data, 'faculty');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      } finally {
        setIsFacultyDataLoading(false);
      }
    };

    const fetchFacultyData = async (faculty) => {
      const data = await facultyData(currentCode, faculty);
      setViewFacultyData(data);
    };

    const fetchCommonLoad = async (currentCode, viewFaculty) => {
      if (!viewFaculty || !currentCode) return;
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/commonLoad/${currentCode}/${viewFaculty}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setCommonLoad(data);
        }
      } catch (error) {
        console.error('Error fetching commonload:', error);
      }
    };
    fetchCommonLoad(currentCode, selectedFaculty);
    fetchFacultyData(selectedFaculty);
  }, [currentCode, selectedFaculty]);

  useEffect(() => {
    const roomData = async (currentCode, room) => {
      if (!room || !currentCode) return {};
      setIsRoomDataLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/lockroomtt/${currentCode}/${room}`,
          { credentials: 'include' }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setRoomLockedTime(data1.updatedTime);
        setRoomNotes(data1.notes);
        const initialData = generateInitialTimetableData(data, 'room');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      } finally {
        setIsRoomDataLoading(false);
      }
    };

    const fetchRoomData = async (currentCode, room) => {
      const data = await roomData(currentCode, room);
      setViewRoomData(data);
    };

    fetchRoomData(currentCode, selectedRoom);
  }, [currentCode, selectedRoom]);

  useEffect(() => {
    const fetchSem = async (currentCode) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addsem?code=${currentCode}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);
          setAvailableSems(semValues);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchRoom = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addroom?code=${currentCode}`,
          { credentials: 'include' }
        );
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

    const fetchFaculty = async (currentCode) => {
      try {
        const fetchedttdetails = await fetchTTData(currentCode);
        const response = await fetch(
          `${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails.dept}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          const facultydata = data.map((faculty) => faculty.name);
          setAvailableFaculties(facultydata);
          return data;
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchTime = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        setLockedTime(data.updatedTime.lockTimeIST);
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
      }
    };

    fetchSem(currentCode);
    fetchRoom();
    fetchTime();
    fetchFaculty(currentCode);
  }, [apiUrl, currentCode, selectedSemester, selectedFaculty, selectedRoom]);

  const fetchTTData = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      const data = await response.json();
      console.log('ttdata---recent', data);
      setTTData(data);
      return data;
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
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

                if (slotSubjects.length > 0) {
                  initialData[day]['lunch'].push(slotSubjects);
                }
              }
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

    return initialData;
  };

  const handleDownloadClick = () => {
    const pathArray = window.location.pathname
      .split('/')
      .filter((part) => part !== '');
    const pathExceptLastPart = `/${pathArray.slice(0, -1).join('/')}`;
    const pdfUrl = `${pathExceptLastPart}/generatepdf`;
    window.location.href = pdfUrl;
  };

  const handleFacultyClick = async (faculty) => {
    const { name, dept } = faculty;
    setSelectedDept(dept);

    setTimeout(() => {
      setSelectedFaculty(name);
      setTimeout(() => {
        if (facultySectionRef.current) {
          const y =
            facultySectionRef.current.getBoundingClientRect().top +
            window.pageYOffset;

          window.scrollTo({
            top: y,
            behavior: 'smooth',
          });
        }
      }, 100);
    }, 300);
    setSuggestions([]);
  };

  const handleRoomClick = (roomItem) => {
    const roomName = roomItem?.room || roomItem?.name;
    if (!roomName) return;

    const rawDept =
      roomDeptIndex[roomName.trim().toUpperCase()] || roomItem?.dept;
    const dept = canonDept(rawDept);
    if (dept) setSelectedDept(dept);

    setPendingRoom(roomName);
    setQuery('');
    setSuggestions([]);
  };

  const [subjectData, setSubjectData] = useState([]);
  const [TTData, setTTData] = useState([]);

  useEffect(() => {
    const fetchSubjectData = async (currentCode) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        setSubjectData(data);
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    fetchSubjectData(currentCode);
    fetchTTData(currentCode);
  }, [currentCode]);

  const fetchSuggestions = useRef(
    debounce(async (q) => {
      if (!q) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const facRes = await fetch(
          `${apiUrl}/timetablemodule/faculty/search?q=${encodeURIComponent(q)}`,
          { credentials: 'include' }
        );
        const facJson = facRes.ok ? await facRes.json() : [];
        const facultyItems = (Array.isArray(facJson) ? facJson : [])
          .map((f) => ({
            _id: f._id || f.id || f.name || Math.random().toString(36).slice(2),
            name: f.name || f.fullName || f.displayName || '',
            dept: f.dept || f.department || '',
            kind: 'faculty',
          }))
          .filter((x) => x.name);

        if (facultyItems.length === 1) {
          try {
            handleFacultyClick(facultyItems[0]);
          } catch (err) {
            console.error('Error auto-selecting single faculty:', err);
          }
          return;
        }

        const qlc = q.toLowerCase();
        const roomLocal = (roomCatalogRef.current || [])
          .filter(
            (r) =>
              (r.room && r.room.toLowerCase().includes(qlc)) ||
              (r.dept && r.dept.toLowerCase().includes(qlc))
          )
          .slice(0, 12)
          .map((r) => ({
            _id: `room-${r.room}`,
            name: r.room,
            dept: r.dept,
            kind: 'room',
            room: r.room,
          }));

        let roomRemote = [];
        if (roomLocal.length > 0) {
          const rRes = await fetch(
            `${apiUrl}/timetablemodule/masterroom/search?q=${encodeURIComponent(
              q
            )}`,
            { credentials: 'include' }
          );
          if (rRes.ok) {
            const rJson = await rRes.json().catch(() => []);
            const rArr = Array.isArray(rJson)
              ? rJson
              : Array.isArray(rJson?.data)
              ? rJson.data
              : Array.isArray(rJson?.results)
              ? rJson.results
              : [];
            roomRemote = rArr
              .slice(0, 12)
              .map((r) => ({
                _id: `room-${
                  r.room || r.roomNo || r.room_no || r.name || r.roomName
                }`,
                name:
                  r.room || r.roomNo || r.room_no || r.name || r.roomName || '',
                dept:
                  r.dept ||
                  r.department ||
                  r.allottedDept ||
                  r.allotedDept ||
                  '',
                kind: 'room',
                room:
                  r.room || r.roomNo || r.room_no || r.name || r.roomName || '',
              }))
              .filter((x) => x.name);
          }
        }

        const seen = new Set();
        const merged = [...facultyItems, ...roomLocal, ...roomRemote].filter(
          (it) => {
            const key = `${it.kind}:${it.name}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }
        );

        setSuggestions(merged);
      } catch (err) {
        console.error('Error in fetchSuggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => () => fetchSuggestions.cancel?.(), [fetchSuggestions]);
  const [pendingRoom, setPendingRoom] = useState(null);

  useEffect(() => {
    const fetchAndAutofill = async () => {
      try {
        const id = decodeURIComponent(autofillid || '').trim();
        if (id) {
          const response = await fetch(`${apiUrl}/timetablemodule/faculty/id/${id}`, { credentials: 'include' });
          if (response.ok) {
            const faculty = await response.json();
            handleFacultyClick({ name: faculty.name, dept: faculty.dept });
          } else {
            console.error('Failed to fetch faculty by ID');
          }
        }
      } catch (e) {
        console.error('Error in autofill:', e);
      }
    };
    fetchAndAutofill();
  }, [autofillid]);

  const canonDept = (name) => {
    const n = (name || '').trim().toLowerCase();
    const match = availableDepts.find(
      (d) => (d || '').trim().toLowerCase() === n
    );
    return match || name || '';
  };

  useEffect(() => {
    if (!pendingRoom) return;
    const target = (pendingRoom || '').trim().toLowerCase();
    const match = availableRooms.find(
      (r) => (r || '').trim().toLowerCase() === target
    );
    if (match) {
      setSelectedRoom(match);
      setPendingRoom(null);
      setTimeout(() => {
        if (roomSectionRef.current) {
          const y =
            roomSectionRef.current.getBoundingClientRect().top +
            window.pageYOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [availableRooms, pendingRoom]);

  return (
    <>
      <Helmet>
        <title>Time Table | XCEED NITJ</title>
        <meta
          name="description"
          content="NITJ's official time table search engine for all semesters and courses"
        />
      </Helmet>

      <Box bg="white" minH="100vh">
        {/* Hero Header Section */}
        <Box
          bgGradient="linear(to-r, purple.900, purple.700, pink.500)"
          pt={0}
          pb={32}
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

          <Container maxW="7xl" position="relative" mt={2}>
            <Flex justify="space-between" align="center" w="full" gap={4} mb={4}>
              <VStack spacing={2} align="start" flex="1">
                <Badge
                  colorScheme="whiteAlpha"
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  Timetable Search
                </Badge>
                <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                  View Timetables
                </Heading>
                <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                  Search and view timetables by semester, faculty, or room.
                </Text>
              </VStack>

              <IconButton
                icon={<ArrowBackIcon />}
                aria-label="Go back"
                onClick={() => window.history.back()}
                size="lg"
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                fontSize="2xl"
                _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
                _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
                borderRadius="full"
                boxShadow="lg"
                border="2px solid"
                borderColor="whiteAlpha.400"
                flexShrink={0}
              />
            </Flex>

            {/* Quick Action Buttons */}
            <Wrap spacing={3} mb={6}>
              <WrapItem>
                <Button
                  as={Link}
                  to="/tt/masterdata"
                  bg="rgba(220, 38, 38, 0.9)"
                  color="white"
                  leftIcon={<SearchIcon />}
                  size="md"
                  _hover={{ bg: 'rgba(220, 38, 38, 1)' }}
                  boxShadow="lg"
                >
                  Slot-wise Master Search
                </Button>
              </WrapItem>
              <WrapItem>
                <Button
                  as={Link}
                  to="/tt/commonslot"
                  bg="rgba(37, 99, 235, 0.9)"
                  color="white"
                  leftIcon={<CalendarIcon />}
                  size="md"
                  _hover={{ bg: 'rgba(37, 99, 235, 1)' }}
                  boxShadow="lg"
                >
                  Search Meet-Slot
                </Button>
              </WrapItem>
              <WrapItem>
                <Button
                  as={Link}
                  to="/classrooms"
                  bg="rgba(22, 163, 74, 0.9)"
                  color="white"
                  leftIcon={<ExternalLinkIcon />}
                  size="md"
                  _hover={{ bg: 'rgba(22, 163, 74, 1)' }}
                  boxShadow="lg"
                >
                  Geo Locate Classrooms
                </Button>
              </WrapItem>
            </Wrap>

            {/* Smart Search Bar */}
            <Box position="relative" maxW="4xl">
              <Box position="relative">
                <Input
                  placeholder="Type faculty name or room number..."
                  value={query}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuery(value);
                    fetchSuggestions(value);
                  }}
                  size="lg"
                  bg="white"
                  borderColor="whiteAlpha.400"
                  _hover={{ borderColor: 'whiteAlpha.600' }}
                  _focus={{ 
                    borderColor: 'white', 
                    boxShadow: '0 0 0 3px rgba(255,255,255,0.3)',
                    bg: 'white'
                  }}
                  pr="50px"
                  fontSize="md"
                />
                <SearchIcon
                  position="absolute"
                  right="16px"
                  top="50%"
                  transform="translateY(-50%)"
                  color="purple.500"
                  boxSize={5}
                />
              </Box>

              {loading && (
                <Flex align="center" mt={2} color="white">
                  <Spinner size="sm" mr={2} />
                  <Text fontSize="sm">Searching...</Text>
                </Flex>
              )}

              {suggestions.length > 0 && (
                <Box
                  mt={2}
                  maxH="300px"
                  overflowY="auto"
                  borderWidth="1px"
                  borderColor="whiteAlpha.300"
                  borderRadius="md"
                  bg="white"
                  shadow="2xl"
                >
                  {suggestions.map((item) => (
                    <Box
                      key={item._id || item.name || item.room}
                      p={3}
                      _hover={{ bg: 'purple.50', cursor: 'pointer' }}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      onClick={() =>
                        item.kind === 'room'
                          ? handleRoomClick(item)
                          : handleFacultyClick(item)
                      }
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="sm">
                            {item.kind === 'room' ? item.room : item.name}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {item.kind === 'faculty'
                              ? item.dept
                              : `Allotted to ${item.dept} & others`}
                          </Text>
                        </VStack>
                        <Badge
                          colorScheme={item.kind === 'faculty' ? 'blue' : 'green'}
                          fontSize="xs"
                        >
                          {item.kind || 'faculty'}
                        </Badge>
                      </HStack>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Container>
        </Box>

        <Container maxW="7xl" mt={-20} position="relative" zIndex={1} pb={16}>
          <VStack spacing={2} align="stretch">
            {/* Session and Department Selection */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="cyan.600" color="white" p={4}>
                <Heading size="md">Select Session & Department</Heading>
              </CardHeader>
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Academic Session
                    </FormLabel>
                    {isSessionsLoading ? (
                      <HStack spacing={3}>
                        <Spinner size="sm" color="cyan.500" />
                        <Text fontSize="sm" color="gray.600">Loading sessions...</Text>
                      </HStack>
                    ) : (
                      <Select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        size="lg"
                        borderColor="cyan.300"
                        _hover={{ borderColor: 'cyan.400' }}
                        _focus={{ borderColor: 'cyan.500', boxShadow: '0 0 0 1px #0891B2' }}
                      >
                        {allsessions.map((session, index) => (
                          <option key={index} value={session}>
                            {session}
                          </option>
                        ))}
                      </Select>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700">
                      Department
                    </FormLabel>
                    <Select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      placeholder="Select Department"
                      size="lg"
                      borderColor="cyan.300"
                      _hover={{ borderColor: 'cyan.400' }}
                      _focus={{ borderColor: 'cyan.500', boxShadow: '0 0 0 1px #0891B2' }}
                    >
                      {availableDepts.map((dept, index) => (
                        <option key={index} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {(selectedSession === '' || selectedDept === '') && (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      <AlertDescription fontSize="sm">
                        Please select both session and department to view timetables.
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Timetable Views - Only show if session and dept selected */}
            {selectedSession !== '' && selectedDept !== '' && (
              <>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    Select semester, faculty, or room below to view the corresponding timetable
                  </AlertDescription>
                </Alert>

                {/* Semester Timetable */}
                <Card
                  bg="white"
                  borderRadius="2xl"
                  shadow="2xl"
                  border="1px"
                  borderColor="gray.300"
                  overflow="hidden"
                >
                  <CardHeader bg="purple.600" color="white" p={4}>
                    <Heading size="md">Semester Timetable</Heading>
                  </CardHeader>
                  <CardBody p={6}>
                    <FormControl mb={4}>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Select Semester
                      </FormLabel>
                      <Select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        placeholder="Select Semester"
                        size="lg"
                        borderColor="purple.300"
                        _hover={{ borderColor: 'purple.400' }}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px #805AD5' }}
                      >
                        {semesters.map((semester, index) => (
                          <option key={index} value={semester}>
                            {semester}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedSemester ? (
                      isSemesterDataLoading ? (
                        <Box p={8}>
                          <VStack spacing={4}>
                            <Spinner size="xl" thickness="4px" color="purple.500" speed="0.65s" />
                            <Text color="gray.600" fontSize="lg">Loading semester timetable...</Text>
                          </VStack>
                        </Box>
                      ) : (
                        <Box>
                          <HStack spacing={2} mb={4}>
                            <TimeIcon color="green.500" />
                            <Text fontSize="sm" fontWeight="semibold" color="green.600">
                              Last saved: {lockedTime || 'Not saved yet'}
                            </Text>
                          </HStack>
                          <ViewTimetable timetableData={viewData} />
                          {Array.isArray(subjectData) && subjectData.length > 0 ? (
                            <TimetableSummary
                              timetableData={viewData}
                              type={'sem'}
                              code={currentCode}
                              time={lockedTime}
                              headTitle={selectedSemester}
                              subjectData={subjectData}
                              TTData={TTData}
                              notes={semNotes}
                            />
                          ) : (
                            <Flex justify="center" align="center" p={4}>
                              <Spinner size="md" color="purple.500" mr={2} />
                              <Text color="gray.600" fontWeight="bold">
                                Loading TimeTable Summary...
                              </Text>
                            </Flex>
                          )}
                          {semNotes.length > 0 && (
                            <Box mt={4} p={4} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                              <Text fontSize="md" fontWeight="bold" color="yellow.800" mb={2}>
                                Notes:
                              </Text>
                              {semNotes.map((noteArray, index) => (
                                <UnorderedList key={index} color="yellow.700">
                                  {noteArray.map((note, noteIndex) => (
                                    <ListItem key={noteIndex} fontSize="sm">{note}</ListItem>
                                  ))}
                                </UnorderedList>
                              ))}
                            </Box>
                          )}
                        </Box>
                      )
                    ) : (
                      <Text color="gray.600">Please select a semester from the dropdown.</Text>
                    )}
                  </CardBody>
                </Card>

                <Divider />

                {/* Faculty Timetable */}
                <Card
                  ref={facultySectionRef}
                  bg="white"
                  borderRadius="2xl"
                  shadow="2xl"
                  border="1px"
                  borderColor="gray.300"
                  overflow="hidden"
                >
                  <CardHeader bg="teal.600" color="white" p={4}>
                    <Heading size="md">Faculty Timetable</Heading>
                  </CardHeader>
                  <CardBody p={6}>
                    <FormControl mb={4}>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Select Faculty
                      </FormLabel>
                      <Select
                        value={selectedFaculty}
                        onChange={(e) => setSelectedFaculty(e.target.value)}
                        placeholder="Select Faculty"
                        size="lg"
                        borderColor="teal.300"
                        _hover={{ borderColor: 'teal.400' }}
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px #14B8A6' }}
                      >
                        {availableFaculties.map((faculty, index) => (
                          <option key={index} value={faculty}>
                            {faculty}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedFaculty ? (
                      isFacultyDataLoading ? (
                        <Box p={8}>
                          <VStack spacing={4}>
                            <Spinner size="xl" thickness="4px" color="teal.500" speed="0.65s" />
                            <Text color="gray.600" fontSize="lg">Loading faculty timetable...</Text>
                          </VStack>
                        </Box>
                      ) : (
                        <Box>
                          <HStack spacing={2} mb={4}>
                            <TimeIcon color="green.500" />
                            <Text fontSize="sm" fontWeight="semibold" color="green.600">
                              Last saved: {facultyLockedTime || 'Not saved yet'}
                            </Text>
                          </HStack>
                          <ViewTimetable timetableData={viewFacultyData} />
                          {Array.isArray(subjectData) && subjectData.length > 0 ? (
                            <TimetableSummary
                              timetableData={viewFacultyData}
                              type={'faculty'}
                              code={currentCode}
                              time={facultyLockedTime}
                              headTitle={selectedFaculty}
                              subjectData={subjectData}
                              TTData={TTData}
                              notes={facultyNotes}
                              commonLoad={commonLoad}
                            />
                          ) : (
                            <Flex justify="center" align="center" p={4}>
                              <Spinner size="md" color="teal.500" mr={2} />
                              <Text color="gray.600" fontWeight="bold">
                                Loading TimeTable Summary...
                              </Text>
                            </Flex>
                          )}
                          {facultyNotes.length > 0 && (
                            <Box mt={4} p={4} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                              <Text fontSize="md" fontWeight="bold" color="yellow.800" mb={2}>
                                Notes:
                              </Text>
                              {facultyNotes.map((noteArray, index) => (
                                <UnorderedList key={index} color="yellow.700">
                                  {noteArray.map((note, noteIndex) => (
                                    <ListItem key={noteIndex} fontSize="sm">{note}</ListItem>
                                  ))}
                                </UnorderedList>
                              ))}
                            </Box>
                          )}
                        </Box>
                      )
                    ) : (
                      <Text color="gray.600">Please select a faculty from the dropdown.</Text>
                    )}
                  </CardBody>
                </Card>

                <Divider />

                {/* Room Timetable */}
                <Card
                  ref={roomSectionRef}
                  bg="white"
                  borderRadius="2xl"
                  shadow="2xl"
                  border="1px"
                  borderColor="gray.300"
                  overflow="hidden"
                >
                  <CardHeader bg="green.600" color="white" p={4}>
                    <Heading size="md">Room Timetable</Heading>
                  </CardHeader>
                  <CardBody p={6}>
                    <FormControl mb={4}>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Select Room
                      </FormLabel>
                      <Select
                        value={selectedRoom}
                        onChange={(e) => {
                          const rm = e.target.value;
                          setSelectedRoom(rm);
                          const dep = roomDeptIndex[rm.trim().toUpperCase()];
                          const depCanon = canonDept(dep);
                          if (dep && dep !== selectedDept) setSelectedDept(dep);
                          if (depCanon && depCanon !== selectedDept)
                            setSelectedDept(depCanon);
                        }}
                        placeholder="Select Room"
                        size="lg"
                        borderColor="green.300"
                        _hover={{ borderColor: 'green.400' }}
                        _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px #10B981' }}
                      >
                        {availableRooms.map((room, index) => (
                          <option key={index} value={room}>
                            {room}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedRoom ? (
                      isRoomDataLoading ? (
                        <Box p={8}>
                          <VStack spacing={4}>
                            <Spinner size="xl" thickness="4px" color="green.500" speed="0.65s" />
                            <Text color="gray.600" fontSize="lg">Loading room timetable...</Text>
                          </VStack>
                        </Box>
                      ) : (
                        <Box>
                          <HStack spacing={2} mb={4}>
                            <TimeIcon color="green.500" />
                            <Text fontSize="sm" fontWeight="semibold" color="green.600">
                              Last saved: {roomlockedTime || 'Not saved yet'}
                            </Text>
                          </HStack>
                          <ViewTimetable timetableData={viewRoomData} />
                          {Array.isArray(subjectData) && subjectData.length > 0 ? (
                            <TimetableSummary
                              timetableData={viewRoomData}
                              type={'room'}
                              code={currentCode}
                              time={roomlockedTime}
                              headTitle={selectedRoom}
                              subjectData={subjectData}
                              TTData={TTData}
                              notes={roomNotes}
                            />
                          ) : (
                            <Flex justify="center" align="center" p={4}>
                              <Spinner size="md" color="green.500" mr={2} />
                              <Text color="gray.600" fontWeight="bold">
                                Loading TimeTable Summary...
                              </Text>
                            </Flex>
                          )}
                          {roomNotes.length > 0 && (
                            <Box mt={4} p={4} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                              <Text fontSize="md" fontWeight="bold" color="yellow.800" mb={2}>
                                Notes:
                              </Text>
                              {roomNotes.map((noteArray, index) => (
                                <UnorderedList key={index} color="yellow.700">
                                  {noteArray.map((note, noteIndex) => (
                                    <ListItem key={noteIndex} fontSize="sm">{note}</ListItem>
                                  ))}
                                </UnorderedList>
                              ))}
                            </Box>
                          )}
                        </Box>
                      )
                    ) : (
                      <Text color="gray.600">Please select a room from the dropdown.</Text>
                    )}
                  </CardBody>
                </Card>
              </>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
}

export default MasterView;