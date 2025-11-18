import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { useNavigate, useLocation, Form, Link } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import ViewTimetable from './viewtt';
import TimetableSummary from './ttsummary';
import './Timetable.css';
import { Container } from '@chakra-ui/layout';
import {
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
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  CustomTh,
  CustomLink,
  CustomBlueButton,
  CustomPlusButton,
  CustomDeleteButton,
} from '../styles/customStyles';
import {
  Box,
  Text,
  HStack,
  Center,
  Portal,
  ChakraProvider,
  Spacer,
} from '@chakra-ui/react';

import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/table';
import { Button } from '@chakra-ui/button';
import Header from '../components/header';
import { Helmet } from 'react-helmet-async';
import debounce from 'lodash.debounce';

// import PDFViewTimetable from '../filedownload/chakrapdf'

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
  const autofillname = parts[parts.length - 1];
  // const autofilltype = parts[parts.length - 2];

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
  const facultySectionRef = useRef(null);
  const roomSectionRef = useRef(null); // 🔹 ADDED

  // 🔹 ADDED: Allotment-backed room maps for search + dept matching
  const [allotmentData, setAllotmentData] = useState(null);
  const [roomDeptIndex, setRoomDeptIndex] = useState({}); // room -> dept
  const [roomCatalog, setRoomCatalog] = useState([]); // {room, dept, source, morningSlot, afternoonSlot}
  // ⬆️ near your other state
  const roomCatalogRef = useRef([]);

  // keep the ref in sync with state
  useEffect(() => {
    roomCatalogRef.current = roomCatalog;
  }, [roomCatalog]);

  const semesters = availableSems;

  const softGlow = keyframes`
  0% {
    border-color: #a78bfa;  /* Soft Purple */
    box-shadow: 0 0 10px #d6bffb;
  }
  25% {
    border-color: #38bdf8;  /* Sky Blue */
    box-shadow: 0 0 10px #a1e3fc;
  }
  50% {
  border-color: #ffe0ac;  /* Light Apricot */
    box-shadow: 0 0 10px #fff1cc;
    
  }
  75% {
    border-color: #34d399;  /* Mint Green */
    box-shadow: 0 0 10px #bafce4;
  }
  100% {
    border-color: #a78bfa;  /* Back to Soft Purple */
    box-shadow: 0 0 10px #d6bffb;
  }
`;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`,
          { credentials: 'include' }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        // console.log(data)
        const { uniqueSessions, uniqueDept } = data;

        setAllSessions(uniqueSessions.map((s) => s.session));
        setAvailableDepts(uniqueDept);

        const currentSessionObj = uniqueSessions.find((s) => s.currentSession);
        if (currentSessionObj) {
          setSelectedSession(currentSessionObj.session);
        } else if (uniqueSessions.length > 0) {
          setSelectedSession(uniqueSessions[0].session);
        }
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
      }
    };

    fetchSessions();
  }, []); // Empty dependency array means this effect runs once on mount

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

  // 🔹 ADDED: Fetch allotment for current session and build room maps
  useEffect(() => {
    const fetchAllotment = async () => {
      // if (!selectedSession) return;
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
          // Build room -> dept index & a flat room catalog
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
                  // source, // "centralised" | "openElective"
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
  }, [apiUrl, selectedSession]); // runs whenever session changes

  useEffect(() => {
    const fetchData = async (semester, currentCode) => {
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
      }
    };

    const fetchViewData = async (semester, currentCode) => {
      const data = await fetchData(semester, currentCode);
    };
    fetchViewData(selectedSemester, currentCode);
  }, [selectedSemester]);

  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
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
      }
    };

    const fetchFacultyData = async (faculty) => {
      const data = await facultyData(currentCode, faculty);
      setViewFacultyData(data);
    };

    const fetchCommonLoad = async (currentCode, viewFaculty) => {
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
      }
    };

    const fetchRoomData = async (currentCode, room) => {
      const data = await roomData(currentCode, room);
      setViewRoomData(data);
    };

    fetchRoomData(currentCode, selectedRoom);
  }, [selectedRoom]);

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

  // 🔹 ADDED: Handle room selection from search suggestions
  const handleRoomClick = (roomItem) => {
    const roomName = roomItem?.room || roomItem?.name;
    if (!roomName) return;

    const rawDept =
      roomDeptIndex[roomName.trim().toUpperCase()] || roomItem?.dept;
    const dept = canonDept(rawDept);
    if (dept) setSelectedDept(dept); // triggers currentCode + rooms refresh

    setPendingRoom(roomName); // select after rooms load
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

  // 🔸 CHANGED: augment suggestions with rooms from allotment (keeping faculty fetch)
  const fetchSuggestions = useRef(
    debounce(async (q) => {
      if (!q) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        // ---- FACULTY (existing endpoint) ----
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

        // If exactly one faculty is returned, auto-select them using the
        // existing handler so the dept is set and the view scrolls.
        if (facultyItems.length === 1) {
          try {
            // call handler which also clears suggestions
            handleFacultyClick(facultyItems[0]);
          } catch (err) {
            console.error('Error auto-selecting single faculty:', err);
          }
          // let finally block clear loading; return early to avoid extra work
          return;
        }

        // ---- ROOMS from allotment (local) ----
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

        // ---- Fallback: backend room search when local is empty ----
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

        // ---- Merge & dedupe by kind+name ----
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
        // Optional debug (won't crash prod):
        // console.log('[rooms] local:', roomLocal.length, 'remote:', roomRemote.length, 'catalog:', roomCatalogRef.current?.length || 0);
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

  // Autofill input from URL when the page first loads (if present)
  useEffect(() => {
    try {
      const name = decodeURIComponent(autofillname || '').trim();
      if (name) {
        setQuery(name);
        // trigger suggestions for the autofilled name
        fetchSuggestions(name);
      }
    } catch (e) {
      // ignore malformed URI component
    }
    // We depend on autofillname which is derived from the pathname
  }, [autofillname]);

  // map any dept string to the exact option in availableDepts (case/space tolerant)
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
      <Container maxW="7xl">
        <Header title="View TimeTable "></Header>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="flex-start"
          gap={2}
          wrap="wrap"
        >
          <Link to="/tt/masterdata">
            <Button
              colorScheme="purple"
              style={{ marginRight: 'auto', background: 'darkred' }}
            >
              Slot wise master search
            </Button>
          </Link>
          <Link to="/tt/commonslot">
            <Button
              colorScheme="blue"
              style={{ marginRight: 'auto', background: 'darkblue' }}
            >
              Search Meet-Slot
            </Button>
          </Link>
          <Box
            flex="1"
            style={{
              width: '100%',
              marginRight: '',
              position: 'relative',
              zIndex: '5',
            }}
          >
            <Input
              style={{
                backgroundColor: 'white',
                borderRadius: '5px',
                padding: '10px',
                border: '1px solid #ccc',
                height: '45px',
              }}
              placeholder="Type faculty or room "
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                fetchSuggestions(value);
              }}
              sx={{
                backgroundColor: 'white',
                borderRadius: '5px',
                padding: '10px',
                height: '45px',
                border: '2px solid',
                animation: `${softGlow} 20s infinite ease-in-out`,
                transition: 'box-shadow 5s ease-in-out',
              }}
            />
            {loading && (
              <Spinner
                mt={2}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: '11',
                }}
              />
            )}
            <List
              spacing={2}
              mt={4}
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                width: '100%',
                position: 'absolute',
                zIndex: '10',
                backgroundColor: 'white',
              }}
            >
              {suggestions.map((item) => (
                <ListItem
                  onClick={() =>
                    item.kind === 'room'
                      ? handleRoomClick(item)
                      : handleFacultyClick(item)
                  }
                  _hover={{ backgroundColor: 'gray.100', cursor: 'pointer' }}
                  key={item._id || item.name || item.room}
                  p={2}
                  borderWidth="1px"
                  borderRadius="md"
                >
                  <Text fontWeight="bold">
                    {item.kind === 'room' ? item.room : item.name}
                    <Text as="span" ml={2} fontSize="xs" color="gray.600">
                      [{item.kind || 'faculty'}]
                    </Text>
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {item.kind === 'faculty'
                      ? item.dept
                      : `Allotted to ${item.dept} & others`}
                  </Text>
                </ListItem>
              ))}
            </List>
          </Box>

          <Link to="/classrooms">
            <Button
              colorScheme="green"
              style={{ marginRight: 'auto', background: 'darkgreen' }}
            >
              Geo Locate Classrooms
            </Button>
          </Link>
        </Flex>
        <FormLabel fontWeight="bold">Select Session:</FormLabel>

        <Select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          isRequired
        >
          {allsessions.map((session, index) => (
            <option key={index} value={session}>
              {session}
            </option>
          ))}
        </Select>

        <FormLabel fontWeight="bold">Select Department:</FormLabel>

        <Select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          isRequired
        >
          <option value="">Select Department</option>
          {availableDepts.map((dept, index) => (
            <option key={index} value={dept}>
              {dept}
            </option>
          ))}
        </Select>

        {selectedSession === '' || selectedDept === '' ? (
          <Text color="red">
            Please select Session and Department to proceed further.
          </Text>
        ) : (
          <>
            <Container maxW="6xl">
              <Center my={4}>
                <Text color="blue">
                  Select semester (or) faculty (or) room to view the time table
                </Text>
              </Center>
              <FormControl>
                <FormLabel fontWeight="bold">
                  View Semester timetable:
                </FormLabel>

                <Select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester, index) => (
                    <option key={index} value={semester}>
                      {semester}
                    </option>
                  ))}
                </Select>
                <Box mb="5">
                  {selectedSemester ? (
                    <Box>
                      <Text
                        color="green"
                        style={{ fontWeight: '700' }}
                        id="saveTime"
                        mb="2.5"
                        mt="2.5"
                      >
                        Last saved on:{' '}
                        {lockedTime ? lockedTime : 'Not saved yet'}
                      </Text>
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
                        <Text style={{ fontWeight: '700', color: 'red' }}>
                          Loading TimeTable Summary...
                        </Text>
                      )}
                      <Box>
                        {semNotes.length > 0 ? (
                          <div>
                            <Text fontSize="xl" fontWeight="bold">
                              Notes:
                            </Text>
                            {semNotes.map((noteArray, index) => (
                              <UnorderedList key={index}>
                                {noteArray.map((note, noteIndex) => (
                                  <ListItem key={noteIndex}>{note}</ListItem>
                                ))}
                              </UnorderedList>
                            ))}
                          </div>
                        ) : (
                          <Text>No notes added for this selection.</Text>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Text>Please select a Semester from the dropdown.</Text>
                  )}
                </Box>
                <Center my={4}>
                  <Text
                    style={{
                      fontWeight: '800',
                      color: '#394870',
                      fontSize: 'large',
                    }}
                  >
                    or
                  </Text>
                </Center>
                {/* Faculty Dropdown */}
                <FormControl ref={facultySectionRef}>
                  <FormLabel fontWeight="bold">
                    View Faculty timetable
                  </FormLabel>
                  <Select
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                  >
                    <option value="">Select Faculty</option>
                    {availableFaculties.map((faculty, index) => (
                      <option key={index} value={faculty}>
                        {faculty}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Box mb="5">
                  {selectedFaculty ? (
                    <Box>
                      <Text
                        color="green"
                        style={{ fontWeight: '700' }}
                        id="saveTime"
                        mb="2.5"
                        mt="2.5"
                      >
                        Last saved on:{' '}
                        {facultyLockedTime
                          ? facultyLockedTime
                          : 'Not saved yet'}
                      </Text>

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
                        <Text style={{ fontWeight: '700', color: 'red' }}>
                          Loading TimeTable Summary...
                        </Text>
                      )}
                      <Box>
                        {facultyNotes.length > 0 ? (
                          <div>
                            <Text fontSize="xl" fontWeight="bold">
                              Notes:
                            </Text>
                            {facultyNotes.map((noteArray, index) => (
                              <UnorderedList key={index}>
                                {noteArray.map((note, noteIndex) => (
                                  <ListItem key={noteIndex}>{note}</ListItem>
                                ))}
                              </UnorderedList>
                            ))}
                          </div>
                        ) : (
                          <Text>No notes added for this selection.</Text>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Text>Please select a faculty from the dropdown.</Text>
                  )}
                </Box>
                <Center my={4}>
                  <Text
                    style={{
                      fontWeight: '800',
                      color: '#394870',
                      fontSize: 'large',
                    }}
                  >
                    or
                  </Text>
                </Center>

                <FormControl ref={roomSectionRef}>
                  <FormLabel fontWeight="bold">View Room timetable</FormLabel>
                  {/* Room Dropdown */}
                  <Select
                    value={selectedRoom}
                    onChange={(e) => {
                      const rm = e.target.value;
                      setSelectedRoom(rm);
                      // 🔹 ADDED: auto-match dept from allotment mapping
                      // const dep = roomDeptIndex[rm];
                      // if (dep && dep !== selectedDept) setSelectedDept(dep);
                      const dep = roomDeptIndex[rm.trim().toUpperCase()];
                      const depCanon = canonDept(dep);
                      if (dep && dep !== selectedDept) setSelectedDept(dep);
                      if (depCanon && depCanon !== selectedDept)
                        setSelectedDept(depCanon);
                    }}
                  >
                    <option value="">Select Room</option>
                    {availableRooms.map((room, index) => (
                      <option key={index} value={room}>
                        {room}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Box mb="5">
                  {selectedRoom ? (
                    <Box>
                      <Text color="black" id="saveTime" mb="2.5" mt="2.5">
                        Last saved on:{' '}
                        {roomlockedTime ? roomlockedTime : 'Not saved yet'}
                      </Text>

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
                        <Text style={{ fontWeight: '700', color: 'red' }}>
                          Loading TimeTable Summary...
                        </Text>
                      )}
                      <Box>
                        {roomNotes.length > 0 ? (
                          <div>
                            <Text fontSize="xl" fontWeight="bold">
                              Notes:
                            </Text>
                            {roomNotes.map((noteArray, index) => (
                              <UnorderedList key={index}>
                                {noteArray.map((note, noteIndex) => (
                                  <ListItem key={noteIndex}>{note}</ListItem>
                                ))}
                              </UnorderedList>
                            ))}
                          </div>
                        ) : (
                          <Text>No notes added for this selection.</Text>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Text>Please select a Room from the dropdown.</Text>
                  )}
                </Box>
                <Box height="200px" />
              </FormControl>
            </Container>
          </>
        )}
      </Container>
    </>
  );
}

export default MasterView;
