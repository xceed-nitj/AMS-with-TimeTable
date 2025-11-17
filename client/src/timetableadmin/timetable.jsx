import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import './Timetable.css';
import TimetableSummary from './ttsummary';
import ReactToPrint from 'react-to-print';
import { Container } from '@chakra-ui/layout';
import { Heading, Select } from '@chakra-ui/react';
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
  Portal,
  ChakraProvider,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react';
import { Center, Square, Circle } from '@chakra-ui/react';
import { Button, useToast } from '@chakra-ui/react';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/table';
import { Stack, HStack, VStack } from '@chakra-ui/react';
import Header from '../components/header';

const Timetable = () => {
  const [timetableData, setTimetableData] = useState({});
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [currentSessionCode, setCurrentSessionCode] = useState('');
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage] = useState();
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [lockedTime, setLockedTime] = useState();
  const [savedTime, setSavedTime] = useState();

  const [facultyUpdateTime, setFacultyUpdateTime] = useState();
  const [roomUpdateTime, setRoomUpdateTime] = useState();
  const [commonLoad, setCommonLoad] = useState();

  const semesters = availableSems;
  const [viewselectedSemester, setViewSelectedSemester] = useState(
    availableSems[0]
  );
  const [viewFaculty, setViewFaculty] = useState(availableFaculties[0]);
  const [viewRoom, setViewRoom] = useState(availableRooms[0]);

  const [selectedSemester, setSelectedSemester] = useState(
    availableSems[0] || ''
  );
  const [clash, setClash] = useState([]);
  const [clashFlag, setClashFlag] = useState(false);

  const selectedCell = null;
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 1];
  const apiUrl = getEnvironment();
  const toast = useToast();

  useEffect(() => {
    const fetchSem = async () => {
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
          setSelectedSemester(semValues[0]);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };
    fetchSem();
  }, [apiUrl, currentCode]);

  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        const initialData = generateInitialTimetableData(data, 'sem');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
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
        setSavedTime(data.updatedTime.saveTimeIST);
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
      }
    };

    const fetchTimetableData = async (semester) => {
      const data = await fetchData(semester);
      setTimetableData(data);
    };

    fetchTimetableData(selectedSemester);
    fetchTime();
  }, [selectedSemester, apiUrl, currentCode]);

  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        const initialData = generateInitialTimetableData(data, 'sem');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };

    const fetchViewData = async (semester) => {
      const data = await fetchData(semester);
      setViewData(data);
    };

    fetchViewData(viewselectedSemester);
  }, [selectedSemester, viewselectedSemester, timetableData, savedTime]);

  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`,
          { credentials: 'include' }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setFacultyUpdateTime(data1.updatedTime);
        const initialData = generateInitialTimetableData(data, 'faculty');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
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

    const fetchFacultyData = async (faculty) => {
      const data = await facultyData(currentCode, faculty);
      setViewFacultyData(data);
    };
    fetchFacultyData(viewFaculty);
    fetchCommonLoad(currentCode, viewFaculty);
  }, [viewFaculty, viewData]);

  useEffect(() => {
    const roomData = async (currentCode, room) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`,
          { credentials: 'include' }
        );
        const data1 = await response.json();
        const data = data1.timetableData;
        setRoomUpdateTime(data1.updatedTime);
        const initialData = generateInitialTimetableData(data, 'room');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };

    const fetchRoomData = async (room) => {
      const data = await roomData(currentCode, room);
      setViewRoomData(data);
    };

    fetchRoomData(viewRoom);
  }, [viewRoom, viewData]);

  useEffect(() => {
    const fetchSubjects = async (currentCode, selectedSemester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/subject/filteredsubject/${currentCode}/${selectedSemester}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableSubjects(data);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchRoom = async (currentCode) => {
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

    const fetchFaculty = async (currentCode, selectedSemester) => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/addfaculty/filteredfaculty/${currentCode}/${selectedSemester}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableFaculties(data[0].faculty);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    fetchSubjects(currentCode, selectedSemester);
    fetchRoom(currentCode);
    fetchFaculty(currentCode, selectedSemester);
  }, [selectedSemester, viewData, currentCode, apiUrl]);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/get-current-session`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
        if (!response.ok) {
          throw new Error('Failed to get current session');
        }
        const responseData = await response.json();
        setCurrentSessionCode(responseData.code);
        console.log("Current session code: ", responseData.code);
      } catch (error) {
        console.error('Error setting current session:', error.message);
      }
    };
    fetchCurrentSession();
    return () => {};
  }, [currentSessionCode]);

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

              if (slotSubjects.length > 0) {
                initialData[day]['lunch'].push(slotSubjects);
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
        setTTData(data);
      } catch (error) {
        console.error('Error fetching TTdata:', error);
      }
    };

    fetchSubjectData(currentCode);
    fetchTTData(currentCode);
  }, []);

  const handleCellChange = (day, period, slotIndex, cellIndex, type, event) => {
    const newValue = event.target.value;

    const updatedData = { ...timetableData };
    if (
      updatedData[day] &&
      updatedData[day][`period${period}`] &&
      updatedData[day][`period${period}`][slotIndex]
    ) {
      updatedData[day][`period${period}`][slotIndex][cellIndex][type] =
        newValue;

      saveSlotData(
        day,
        `period${period}`,
        updatedData[day][`period${period}`][slotIndex]
      );
    }

    setTimetableData(updatedData);
  };

  const handleSplitCell = (day, period, slotIndex) => {
    const newCell = {
      subject: '',
      room: '',
      faculty: '',
    };

    timetableData[day][`period${period}`][slotIndex].push(newCell);
    setTimetableData({ ...timetableData });
  };

  // ====== CHANGED: delete a specific cell, persist only that slot ======
  const handleDeleteCell = (day, period, slotIndex, cellIndex) => {
    setTimetableData((prev) => {
      const updated = { ...prev };
      const slotKey = `period${period}`;
      const slot = updated[day]?.[slotKey]?.[slotIndex];
      if (!slot) return prev;

      if (slot.length > 1) {
        // Remove just the targeted cell
        slot.splice(cellIndex, 1);
      } else {
        // Keep structure stable: clear the only cell
        slot[0] = { subject: '', room: '', faculty: '' };
      }

      // Persist ONLY this slot
      saveSlotData(day, slotKey, slot);

      return { ...updated };
    });
  };
  // ====================================================================

  const location = useLocation();
  const currentPathname = location.pathname;
  const handleAddSubject = () => navigate(`${currentPathname}/addsubjects`);
  const handleAddFaculty = () => navigate(`${currentPathname}/addfaculty`);
  const handleAddSem = () => navigate(`${currentPathname}/addsem`);
  const handleFirstYear = () => navigate(`${currentPathname}/firstyearload`);
  const handleAddRoom = () => navigate(`${currentPathname}/addroom`);
  const handleAddNote = () => navigate(`${currentPathname}/addnote`);
  const handleAddCommonLoad = () =>
    navigate(`${currentPathname}/addcommonload`);
  const handleAddLunchSlot = () => navigate(`${currentPathname}/addlunchload`);
  const handleViewRoom = () => navigate(`${currentPathname}/roomallotment`);
  const handleMasterView = () => navigate('/timetable');
  const handleViewSummary = () => navigate(`${currentPathname}/lockedsummary`);
  const handleEditFaculty = () =>
    navigate(`${currentPathname}/editmasterfaculty`);
  const handleImportData = () => navigate(`${currentPathname}/importttdata`);
  const handleDownloadClick = () => {
    const pdfUrl = `${currentPathname}/generatepdf`;
    window.location.href = pdfUrl;
  };
  const saveSlotData = async (day, slot, slotData) => {
    const Url = `${apiUrl}/timetablemodule/tt/saveslot/${day}/${slot}`;
    const code = currentCode;
    const sem = selectedSemester;

    try {
      const response = await fetch(Url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotData, code, sem }),
        credentials: 'include',
      });

      if (response) {
        const data = await response.json();
        setMessage(data.message);
      }
    } catch (error) {
      // handle error silently
    }
  };

  const handleSubmit = async () => {
    const Url = `${apiUrl}/timetablemodule/tt/savett`;
    const code = currentCode;
    const sem = selectedSemester;

    setMessage('Data is being saved....');
    try {
      const response = await fetch(Url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetableData, code, sem }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error(
          'Failed to send data to the backend. HTTP status:',
          response.status
        );
      }
    } catch (error) {
      console.error('Error sending data to the backend:', error);
    } finally {
      setMessage('Data saved successfully');
    }
  };

  const handleLockTT = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to lock the timetable?'
    );
    var toInform = false;
    if (currentCode == currentSessionCode)
      toInform = window.confirm(
        'Do you want to inform the teachers about the timetable changes?'
      );
    if (isConfirmed) {
      setMessage('Data is being saved....');
      setMessage('Data saved. Commencing lock');
      setMessage('Data is being locked');
      const Url = `${apiUrl}/timetablemodule/lock/locktt`;
      const code = currentCode;
      try {
        const response = await fetch(Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, toInform }),
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const { results } = data;
          if (toInform) {
            let successMsg = '✔ Successful Emails:\n';
            let failedMsg = '✘ Failed Emails:\n';

            results.forEach((item) => {
              if (item.success) {
                successMsg += `• ${item.email}\n`;
              } else {
                failedMsg += `• ${item.faculty} (${
                  item.email || 'No Email'
                }) → ${item.error}\n`;
              }
            });

            // Show alerts
            if (results.some((r) => r.success)) alert(successMsg);
            if (results.some((r) => !r.success)) alert(failedMsg);
          }
          setMessage('');
          toast({
            title: 'Timetable Locked',
            status: 'success',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
        } else {
          console.error(
            'Failed to send data to the backend. HTTP status:',
            response.status
          );
        }
      } catch (error) {
        console.error('Error sending data to the backend:', error);
      }
    } else {
      toast({
        title: 'Timetable Lock Failed',
        description:
          'An error occurred while attempting to lock the timetable.',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScroll = () => {
    const scrollPosition = window.scrollY;
    const scrollThreshold = 3100;
    if (scrollPosition > scrollThreshold) setShowMessage(false);
    else setShowMessage(true);
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    if (availableFaculties.length != 0 && availableRooms.length != 0) {
      let obj = [];
      const roomData = async (currentCode, room) => {
        try {
          const response = await fetch(
            `${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`,
            { credentials: 'include' }
          );
          const data1 = await response.json();
          const data = data1.timetableData;
          setRoomUpdateTime(data1.updatedTime);
          const initialData = generateInitialTimetableData(data, 'room');
          return initialData;
        } catch (error) {
          console.error('Error fetching existing timetable data:', error);
          return {};
        }
      };

      const fetchRoomData = async (room) => {
        const data = await roomData(currentCode, room);
        for (let i in data) {
          for (let j in data[i]) {
            if (
              data[i][j].length >= 2 &&
              data[i][j][0][0]['faculty'] !== data[i][j][1][0]['faculty']
            ) {
              let temp = { name: room, day: i, period: j };
              obj.push(temp);
            }
          }
        }
      };

      const facultyData = async (currentCode, faculty) => {
        try {
          const response = await fetch(
            `${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`,
            { credentials: 'include' }
          );
          const data1 = await response.json();
          const data = data1.timetableData;
          setFacultyUpdateTime(data1.updatedTime);
          const initialData = generateInitialTimetableData(data, 'faculty');
          return initialData;
        } catch (error) {
          console.error('Error fetching existing timetable data:', error);
          return {};
        }
      };
      const fetchFacultyData = async (faculty) => {
        const data = await facultyData(currentCode, faculty);
        for (let i in data) {
          for (let j in data[i]) {
            if (
              data[i][j].length >= 2 &&
              data[i][j][0]['room'] !== data[i][j][1]['room']
            ) {
              let temp = { name: faculty, day: i, period: j };
              obj.push(temp);
            }
          }
        }
      };
      (async () => {
        for (let i = 0; i < availableFaculties.length; i++) {
          await fetchFacultyData(availableFaculties[i]);
        }
        for (let i = 0; i < availableRooms.length; i++) {
          await fetchRoomData(availableRooms[i]);
        }
        setClash(obj, setClashFlag(true));
      })();
    }
  }, [availableFaculties, availableRooms]);

  return (
    <Container maxW="8xl">
      <Heading as="h1" size="xl" mt="6" mb="6">
        TIME TABLE ALLOTMENT
      </Heading>

      <Box display="left">
        <Button mx="auto" colorScheme="red" onClick={handleFirstYear}>
          First Year Faculty Allotment
        </Button>
        <Button m="1 auto" colorScheme="blue" onClick={handleViewRoom}>
          View Centrally Alloted Rooms
        </Button>
        <Button m="1 auto" colorScheme="blue" onClick={handleMasterView}>
          Master View of Time Table (any sem/dept)
        </Button>
        <Button m="1 auto" colorScheme="blue" onClick={handleEditFaculty}>
          Edit Faculty Details
        </Button>
        <Button m="1 auto" colorScheme="yellow" onClick={handleImportData}>
          Import Data
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={4}>
        <Box ml="-1.5" display="flex" flexWrap="wrap">
          <Button m={1} colorScheme="teal" onClick={handleAddSem}>
            Add Semester
          </Button>
          <Button m={1} colorScheme="teal" onClick={handleAddSubject}>
            Add Subject
          </Button>
          <Button m={1} colorScheme="teal" onClick={handleAddRoom}>
            Add Room
          </Button>
          <Button m={1} colorScheme="teal" onClick={handleAddFaculty}>
            Add Faculty
          </Button>
          <Button m={1} colorScheme="teal" onClick={handleAddNote}>
            Add Note
          </Button>
          <Button m={1} colorScheme="teal" onClick={handleAddCommonLoad}>
            Add Common Load
          </Button>
          <Button m={1} colorScheme="teal" onClick={handleAddLunchSlot}>
            Add Lunch slots
          </Button>
        </Box>

        <Box
          mr="-1.5"
          display="flex"
          justifyContent="flex-end"
          flexWrap="wrap"
          alignItems="center"
          mt={{ base: 2, md: 0 }}
        >
          <Button m={1} colorScheme="orange" onClick={handleLockTT}>
            Lock TT
          </Button>
          <Button m={1} colorScheme="orange" onClick={handleViewSummary}>
            View Locked TT
          </Button>
          <Button m={1} colorScheme="orange" onClick={handleDownloadClick}>
            Click here for Batch Download
          </Button>
        </Box>
      </Box>

      <Box padding="6px" borderRadius="6px">
        <ul className="tw-flex tw-flex-wrap tw-w-fit">
          {clashFlag == true
            ? clash.length == 0
              ? 'No Clashes'
              : clash.map((elem, index) => (
                  <li
                    key={index}
                    className="tw-h-10 tw-p-2 tw-mx-3 tw-w-1/3 tw-content-center tw-text-red-700 tw-font-normal tw-rounded-md"
                  >
                    Check {elem['name']}'s slot on {elem['day']} at{' '}
                    {elem['period']}
                  </li>
                ))
            : 'searching for clashes...'}
        </ul>
      </Box>

      <Box display="flex" justifyContent="space-between" mb="4">
        <Text fontSize="xl" color="red" id="saveTime">
          Last saved on: {savedTime ? savedTime : 'Not saved yet'}
        </Text>
        <Text fontSize="xl" color="red" id="lockTime">
          Last locked on: {lockedTime ? lockedTime : 'Not Locked yet'}
        </Text>
      </Box>

      <Portal>
        <Box
          bg={showMessage && message ? 'rgba(255, 100, 0, 0.9)' : 0}
          color="white"
          textAlign="center"
          fontWeight="bold"
          fontSize="1.5rem"
          position="fixed"
          top="30%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex="999"
          borderRadius="20px"
          p="10px"
          opacity={showMessage ? 1 : 0}
        >
          <Text>{message}</Text>
        </Box>
      </Portal>

      <Box display="flex" mb="2.5">
        <Text fontWeight="bold" mb="1.5">
          Select Semester:
        </Text>
        <Select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          {semesters.map((semester, index) => (
            <option key={index} value={semester}>
              {semester}
            </option>
          ))}
        </Select>
      </Box>

      {Object.keys(timetableData).length === 0 ? (
        <Box>Loading...</Box>
      ) : (
        <TableContainer>
          <Table variant="striped">
            <Tr fontWeight="bold">
              <Td>
                <Text>Day/Period</Text>
              </Td>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <Td key={period}>
                  <Text>
                    <Center>{period}</Center>
                  </Text>
                </Td>
              ))}
            </Tr>
            {days.map((day) => (
              <Tr key={day} fontWeight="bold">
                <Td>
                  <Text>
                    <Center>{day}</Center>
                  </Text>
                </Td>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <Td key={period}>
                    {timetableData[day][`period${period}`].map(
                      (slot, slotIndex) => (
                        <Box key={slotIndex}>
                          {slot.map((cell, cellIndex) => (
                            <Box key={cellIndex} mb="2">
                              <Select
                                value={cell.subject}
                                onChange={(event) =>
                                  handleCellChange(
                                    day,
                                    period,
                                    slotIndex,
                                    cellIndex,
                                    'subject',
                                    event
                                  )
                                }
                              >
                                <option value="">Select Subject</option>
                                {availableSubjects.map((subject) => (
                                  <option
                                    key={subject._id}
                                    value={subject.subName}
                                  >
                                    {subject.subName}
                                  </option>
                                ))}
                              </Select>

                              <Select
                                value={cell.room}
                                onChange={(event) =>
                                  handleCellChange(
                                    day,
                                    period,
                                    slotIndex,
                                    cellIndex,
                                    'room',
                                    event
                                  )
                                }
                              >
                                <option value="">Select Room</option>
                                {availableRooms.map((roomOption) => (
                                  <option key={roomOption} value={roomOption}>
                                    {roomOption}
                                  </option>
                                ))}
                              </Select>

                              <Select
                                value={cell.faculty}
                                onChange={(event) =>
                                  handleCellChange(
                                    day,
                                    period,
                                    slotIndex,
                                    cellIndex,
                                    'faculty',
                                    event
                                  )
                                }
                              >
                                <option value="">Select Faculty</option>
                                {availableFaculties.map((faculty, index) => (
                                  <option key={index} value={faculty}>
                                    {faculty}
                                  </option>
                                ))}
                              </Select>

                              {/* NEW: per-cell Delete button */}
                              <CustomDeleteButton
                                className="cell-delete-button"
                                onClick={() =>
                                  handleDeleteCell(
                                    day,
                                    period,
                                    slotIndex,
                                    cellIndex
                                  )
                                }
                              >
                                Delete
                              </CustomDeleteButton>
                            </Box>
                          ))}

                          {/* Keep your add (+) at slotIndex 0 if that's intended */}
                          {slotIndex === 0 && (
                            <CustomPlusButton
                              className="cell-split-button"
                              onClick={() =>
                                handleSplitCell(day, period, slotIndex)
                              }
                            >
                              +
                            </CustomPlusButton>
                          )}
                        </Box>
                      )
                    )}
                  </Td>
                ))}
              </Tr>
            ))}
          </Table>
        </TableContainer>
      )}

      <Button colorScheme="teal" mb="3" mt="5" ml="0" onClick={handleSubmit}>
        Save Timetable
      </Button>

      <Box>
        <Heading as="h1" size="xl" mt="6" mb="6">
          View Semester Timetable
        </Heading>

        <Box display="flex" mb="2.5">
          <Text fontWeight="bold">Select Semester:</Text>
          <Select
            value={viewselectedSemester}
            onChange={(e) => setViewSelectedSemester(e.target.value)}
          >
            <option value="">Select </option>
            {semesters.map((semester, index) => (
              <option key={index} value={semester}>
                {semester}
              </option>
            ))}
          </Select>
        </Box>

        <Box>
          {viewselectedSemester ? (
            <Box>
              <Text color="red" id="saveTime" mb="2.5" mt="2.5">
                Last saved on: {savedTime ? savedTime : 'Not saved yet'}
              </Text>
              <ViewTimetable timetableData={viewData} />
              <TimetableSummary
                timetableData={viewData}
                type={'sem'}
                code={currentCode}
                subjectData={subjectData}
                TTData={TTData}
                headTitle={viewselectedSemester}
                commonLoad={commonLoad}
              />
            </Box>
          ) : (
            <Text>Please select a Semester from the dropdown.</Text>
          )}
        </Box>
      </Box>

      <Box>
        <Box>
          <Heading as="h1" size="xl" mt="6" mb="6">
            View Faculty Timetable
          </Heading>
          <Box display="flex" mb="2.5">
            <Text fontWeight="bold">Select Faculty:</Text>
            <Select
              value={viewFaculty}
              onChange={(e) => setViewFaculty(e.target.value)}
            >
              <option value="">Select </option>
              {availableFaculties.map((faculty, index) => (
                <option key={index} value={faculty}>
                  {faculty}
                </option>
              ))}
            </Select>
          </Box>
        </Box>

        <Box>
          {viewFaculty ? (
            <Box>
              <Text color="red" id="saveTime" mb="2.5" mt="2.5">
                Last saved on:{' '}
                {facultyUpdateTime ? facultyUpdateTime : 'Not saved yet'}
              </Text>
              <ViewTimetable timetableData={viewFacultyData} />
              <TimetableSummary
                timetableData={viewFacultyData}
                type={'faculty'}
                code={currentCode}
                subjectData={subjectData}
                TTData={TTData}
                commonLoad={commonLoad}
              />
            </Box>
          ) : (
            <Text>Please select a faculty from the dropdown.</Text>
          )}
        </Box>
      </Box>

      <Box>
        <Heading as="h1" size="xl" mt="6" mb="6">
          View Room Timetable
        </Heading>
        <Box display="flex" mb="2.5">
          <Text fontWeight="bold">Select Room:</Text>
          <Select
            value={viewRoom}
            onChange={(e) => setViewRoom(e.target.value)}
          >
            <option value="">Select </option>
            {availableRooms.map((room, index) => (
              <option key={index} value={room}>
                {room}
              </option>
            ))}
          </Select>
        </Box>
      </Box>

      <Box mb="8">
        {viewRoom ? (
          <Box>
            <Text color="red" id="saveTime" mb="2.5" mt="2.5">
              Last saved on: {roomUpdateTime ? roomUpdateTime : 'Not saved yet'}
            </Text>

            <ViewTimetable timetableData={viewRoomData} />
          </Box>
        ) : (
          <Text>Please select a Room from the dropdown.</Text>
        )}
      </Box>
    </Container>
  );
};

export default Timetable;
