import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import TimetableSummary from './ttsummary';
import ReactToPrint from 'react-to-print';
import { Container } from '@chakra-ui/layout';
import { Heading, Select, Input, Badge, Tooltip, IconButton } from '@chakra-ui/react';
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
  Flex,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Divider,
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
import { 
  LockIcon, 
  ViewIcon, 
  DownloadIcon, 
  AddIcon, 
  DeleteIcon,
  EditIcon,
  CalendarIcon,
  TimeIcon,
  SettingsIcon,
  WarningIcon,
  CheckCircleIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { PersonStanding, PersonStandingIcon } from 'lucide-react';
import { FaTasks, FaUser, FaUserAlt, FaUserAltSlash, FaUserTimes } from 'react-icons/fa';

const Timetable = () => {
  // All state declarations
  const [timetableData, setTimetableData] = useState({});
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [currentSessionCodes, setCurrentSessionCodes] = useState([]);
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
  const [viewselectedSemester, setViewSelectedSemester] = useState(availableSems[0]);
  const [viewFaculty, setViewFaculty] = useState(availableFaculties[0]);
  const [viewRoom, setViewRoom] = useState(availableRooms[0]);
  const [selectedSemester, setSelectedSemester] = useState(availableSems[0] || '');
  const [clash, setClash] = useState([]);
  const [clashFlag, setClashFlag] = useState(false);
 
  const [subjectData, setSubjectData] = useState([]);
  const [TTData, setTTData] = useState(null);
  const [showMessage, setShowMessage] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 1];
  const currentPathname = location.pathname;
  const apiUrl = getEnvironment();
  const toast = useToast();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
 
  const [publishedTime, setPublishedTime] = useState();

  const formatDateTime = (dateString) => {
      if (!dateString) return 'Not published yet';

           const date = new Date(dateString);

        return date.toLocaleString('en-IN', {
           day: '2-digit',
           month: '2-digit',
           year: 'numeric',
           hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
         hour12: true,
  });
};
  
  const fetchTime = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`, { credentials: 'include' });
        const data = await response.json();
        setLockedTime(data.updatedTime.lockTimeIST);
        setSavedTime(data.updatedTime.saveTimeIST);
        setPublishedTime(data.updatedTime.publishTimeIST);
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
      }
    };

  

  // Auto-hide notification
 

  // Auto-clear message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

 

  // Fetch semester data
  useEffect(() => {
    const fetchSem = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`, { credentials: 'include' });
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

  // Fetch timetable data and time
  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`, { credentials: 'include' });
        const data = await response.json();
        return generateInitialTimetableData(data, 'sem');
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };

    

    const fetchTimetableData = async (semester) => {
      const data = await fetchData(semester);
      setTimetableData(data);
    };

    fetchTimetableData(selectedSemester);
    fetchTime();
  }, [selectedSemester, apiUrl, currentCode]);

  // Fetch view data
  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`, { credentials: 'include' });
        const data = await response.json();
        return generateInitialTimetableData(data, 'sem');
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

  // Fetch faculty data
  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`, { credentials: 'include' });
        const data1 = await response.json();
        const data = data1.timetableData;
        setFacultyUpdateTime(data1.updatedTime);
        return generateInitialTimetableData(data, 'faculty');
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };

    const fetchCommonLoad = async (currentCode, viewFaculty) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/commonLoad/${currentCode}/${viewFaculty}`, { credentials: 'include' });
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

  // Fetch room data
  useEffect(() => {
    const roomData = async (currentCode, room) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`, { credentials: 'include' });
        const data1 = await response.json();
        const data = data1.timetableData;
        setRoomUpdateTime(data1.updatedTime);
        return generateInitialTimetableData(data, 'room');
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

  // Fetch subjects, rooms, faculties
  useEffect(() => {
    const fetchSubjects = async (currentCode, selectedSemester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/filteredsubject/${currentCode}/${selectedSemester}`, { credentials: 'include' });
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

    const fetchFaculty = async (currentCode, selectedSemester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addfaculty/filteredfaculty/${currentCode}/${selectedSemester}`, { credentials: 'include' });
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

  // Fetch current session
  useEffect(() => {
    const fetchCurrentSession = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/get-current-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to get current session');
        const responseData = await response.json();
        setCurrentSessionCodes(responseData.codes);
      } catch (error) {
        console.error('Error setting current session:', error.message);
      }
    };
    fetchCurrentSession();
    return () => {};
  }, [currentSessionCodes]);

  // Generate initial timetable data
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
              let faculty = '', room = '';
              for (const slotItem of slot) {
                const subj = slotItem.subject || '';
                room = type == 'room' ? (slotItem.sem || '') : (slotItem.room || '');
                faculty = type == 'faculty' ? (slotItem.sem || '') : (slotItem.faculty || '');
                if (subj || room || faculty) {
                  slotSubjects.push({ subject: subj, room: room, faculty: faculty });
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
              let faculty = '', room = '';
              for (const slotItem of slot) {
                const subj = slotItem.subject || '';
                room = type == 'room' ? (slotItem.sem || '') : (slotItem.room || '');
                faculty = type == 'faculty' ? (slotItem.sem || '') : (slotItem.faculty || '');
                if (subj || room || faculty) {
                  slotSubjects.push({ subject: subj, room: room, faculty: faculty });
                }
              }
              if (slotSubjects.length === 0) {
                slotSubjects.push({ subject: '', room: '', faculty: '' });
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

  // Fetch subject and TT data
  useEffect(() => {
    const fetchSubjectData = async (currentCode) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`, { credentials: 'include' });
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
      { credentials: 'include' }
    );

    if (!response.ok) {
      console.error("TTData API failed:", response.status);
      return;
    }

    const data = await response.json();
    console.log("Fetched TTData:", data); 
    setTTData(data);
  } catch (error) {
    console.error('Error fetching TTdata:', error);
  }
};



    fetchSubjectData(currentCode);
    fetchTTData(currentCode);
    
  }, []);
  const handlePublishTT = async () => {
  const timetableId = TTData?._id;


  if (!timetableId) {
    toast({
      title: "Timetable not loaded",
      description: "Timetable ID missing",
      status: "error",
      duration: 3000,
      isClosable: true,
      position: "bottom",
    });
    return;
  }

  const confirm = window.confirm("Are you sure you want to publish this timetable?");
  if (!confirm) return;

  try {
    const response = await fetch(
      `${apiUrl}/timetablemodule/timetable/publish/${timetableId}`,
      {
        method: "PUT",
        credentials: "include",
      }
    );

    if (!response.ok) throw new Error();

    await fetchTime(); // refresh timestamps

    toast({
      title: "Timetable Published",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "bottom",
    });
  } catch (err) {
    toast({
      title: "Publish failed",
      status: "error",
      duration: 3000,
      isClosable: true,
      position: "bottom",
    });
  }
};



  // Handler functions
  const handleCellChange = (day, period, slotIndex, cellIndex, type, event) => {
    const newValue = event.target.value;
    const updatedData = { ...timetableData };
    if (updatedData[day] && updatedData[day][`period${period}`] && updatedData[day][`period${period}`][slotIndex]) {
      updatedData[day][`period${period}`][slotIndex][cellIndex][type] = newValue;
      saveSlotData(day, `period${period}`, updatedData[day][`period${period}`][slotIndex]);
    }
    setTimetableData(updatedData);
  };

  const handleSplitCell = (day, period, slotIndex) => {
    const newCell = { subject: '', room: '', faculty: '' };
    timetableData[day][`period${period}`][slotIndex].push(newCell);
    setTimetableData({ ...timetableData });
  };

  const handleDeleteCell = (day, period, slotIndex, cellIndex) => {
    setTimetableData((prev) => {
      const updated = { ...prev };
      const slotKey = `period${period}`;
      const slot = updated[day]?.[slotKey]?.[slotIndex];
      if (!slot) return prev;
      if (slot.length > 1) {
        slot.splice(cellIndex, 1);
      } else {
        slot[0] = { subject: '', room: '', faculty: '' };
      }
      saveSlotData(day, slotKey, slot);
      return { ...updated };
    });
  };


  const handleAddSubject = () => navigate(`${currentPathname}/addsubjects`);
  const handleAddFaculty = () => navigate(`${currentPathname}/addfaculty`);
  const handleAddSem = () => navigate(`${currentPathname}/addsem`);
  const handleFirstYear = () => navigate(`${currentPathname}/firstyearload`);
  const handleAddRoom = () => navigate(`${currentPathname}/addroom`);
  const handleAddNote = () => navigate(`${currentPathname}/addnote`);
  const handleAddCommonLoad = () => navigate(`${currentPathname}/addcommonload`);
  const handleAddLunchSlot = () => navigate(`${currentPathname}/addlunchload`);
  const handleViewRoom = () => navigate(`${currentPathname}/roomallotment`);
  const handleMasterView = () => navigate('/timetable');
  const handleEditFaculty = () => navigate(`${currentPathname}/editmasterfaculty`);
  const handleImportData = () => navigate(`${currentPathname}/importttdata`);
  const handleViewSummary = () => {
  const url = `${currentPathname}/lockedsummary`;
  window.open(url, "_blank", "noopener,noreferrer");
};
  const handleViewDeptFacultyLoad = () => {
  const url = `${currentPathname}/facultyload`;
  window.open(url, "_blank", "noopener,noreferrer");
};
  const handleViewFacultyLoad = () => {
  const url = `${currentPathname}/generatepdf/loadallocation`;
  window.open(url, "_blank", "noopener,noreferrer");
};
  const handleDownloadClick = () => {
    const pdfUrl = `${currentPathname}/generatepdf`;
  window.open(pdfUrl, "_blank", "noopener,noreferrer");
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

   toast({
     title: "Saving timetable...",
      status: "info",
      duration: 4000,
      isClosable: true,
       position: "bottom",
});

    try {
      const response = await fetch(Url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetableData, code, sem }),
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Failed to send data to the backend. HTTP status:', response.status);
        toast({
  title: "Save failed",
  status: "error",
  duration: 6000,
  isClosable: true,
  position: "bottom",
});

      } else {
       toast({
     title: "Timetable Saved",
     status: "success",
    duration: 3000,
    isClosable: true,
     position: "bottom",
});

      }
    } catch (error) {
      console.error('Error sending data to the backend:', error);
     toast({
     title: "Error saving timetable",
     description: "Something went wrong while saving. Please try again.",
     status: "error",
     duration: 3000,
     isClosable: true,
     position: "bottom",
});

    }
  };

const handleLockTT = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to lock the timetable?'
    );
    var toInform = false;
    if (currentSessionCodes.includes(currentCode) && TTData?.publish === true)
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
                failedMsg += `• ${item.faculty} (${item.email || 'No Email'
                  }) → ${item.error}\n`;
              }
            });

            if (results.some((r) => r.success)) alert(successMsg);
            if (results.some((r) => !r.success)) alert(failedMsg);
          }
          setMessage('');
          toast({
            title: 'Timetable Locked',
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'bottom',
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
        duration: 3000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  

  // Scroll handler
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

  // Clash detection
  useEffect(() => {
    if (availableFaculties.length != 0 && availableRooms.length != 0) {
      let obj = [];
      const roomData = async (currentCode, room) => {
        try {
          const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room}`, { credentials: 'include' });
          const data1 = await response.json();
          const data = data1.timetableData;
          setRoomUpdateTime(data1.updatedTime);
          return generateInitialTimetableData(data, 'room');
        } catch (error) {
          console.error('Error fetching existing timetable data:', error);
          return {};
        }
      };

      const fetchRoomData = async (room) => {
        const data = await roomData(currentCode, room);
        for (let i in data) {
          for (let j in data[i]) {
            if (data[i][j].length >= 2 && data[i][j][0][0]['faculty'] !== data[i][j][1][0]['faculty']) {
              let temp = { name: room, day: i, period: j };
              obj.push(temp);
            }
          }
        }
      };

    

      const facultyData = async (currentCode, faculty) => {
        try {
          const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty}`, { credentials: 'include' });
          const data1 = await response.json();
          const data = data1.timetableData;
          setFacultyUpdateTime(data1.updatedTime);
          return generateInitialTimetableData(data, 'faculty');
        } catch (error) {
          console.error('Error fetching existing timetable data:', error);
          return {};
        }
      };

      const fetchFacultyData = async (faculty) => {
        const data = await facultyData(currentCode, faculty);
        for (let i in data) {
          for (let j in data[i]) {
            if (data[i][j].length >= 2 && data[i][j][0]['room'] !== data[i][j][1]['room']) {
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

  useEffect(() => {
  console.log("TTData updated:", TTData);
}, [TTData]);


  // RENDER
  return (
    <Container maxW="full" p={0} bg="gray.50" overflowX="hidden">
      {/* Enhanced Hero Section with Gradient */}
      <Box 
        bgGradient="linear(135deg, #FF6B35 0%, #F7931E 50%, #EC008C 100%)" 
        py={{ base: 7, md: 10 }} 
        position="relative" 
        overflow="hidden"
      >
        <Box position="absolute" top="0" left="0" right="0" bottom="0" opacity="0.1">
          <Box position="absolute" top="15%" left="8%" w={{ base: "60px", md: "120px" }} h={{ base: "60px", md: "120px" }} borderRadius="full" bg="white" />
          <Box position="absolute" top="50%" right="12%" w={{ base: "90px", md: "180px" }} h={{ base: "90px", md: "180px" }} borderRadius="full" bg="white" />
          <Box position="absolute" bottom="10%" left="40%" w={{ base: "50px", md: "100px" }} h={{ base: "50px", md: "100px" }} borderRadius="full" bg="white" />
        </Box>
        <Container maxW="8xl" position="relative" zIndex="1" px={{ base: 4, md: 6 }}>
          <VStack spacing={0} align="center" justify="center" minH={{ base: "90px", md: "110px" }}>
            <Badge fontSize={{ base: "sm", md: "xl" }} px={{ base: 2, md: 3 }} py={{ base: 1, md: 2 }} borderRadius="full" bg="whiteAlpha.400" color="white" fontWeight="bold" textTransform="uppercase">
              Dashboard - Timetable Management System
            </Badge>
          </VStack>
        </Container>
      </Box>

      <Container maxW="8xl" mt={-8} position="relative" zIndex="2" pb={8} px={{ base: 2, md: 6 }} overflowX="hidden">
        
        {/* Enhanced Quick Actions Card */}
        <Card bg="white" borderRadius="2xl" boxShadow="2xl" mb={6} border="1px" borderColor="gray.100">
          <CardBody p={{ base: 3, md: 5 }}>
            <Flex justify="space-between" align="center" mb={5} direction={{ base: "column", md: "row" }} gap={{ base: 2, md: 0 }}>
              <Box textAlign={{ base: "center", md: "left" }}>
                <Heading size={{ base: "sm", md: "md" }} mb={1} bgGradient="linear(to-r, purple.600, blue.500)" bgClip="text">
                  Quick Actions
                </Heading>
              </Box>
            </Flex>

            <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={{ base: 2, md: 4 }} mb={3}>
              {[
                { icon: TimeIcon, label: 'First Year', c: 'red', fn: handleFirstYear },
                { icon: CalendarIcon, label: 'Master View', c: 'blue', fn: handleMasterView },
                { icon: ViewIcon, label: 'View Rooms', c: 'pink', fn: handleViewRoom },
                { icon: EditIcon, label: 'Edit Faculty', c: 'cyan', fn: handleEditFaculty },
                { icon: DownloadIcon, label: 'Import Data', c: 'yellow', fn: handleImportData },
              ].map((a, i) => (
                <Button 
                  key={i} 
                  onClick={a.fn} 
                  colorScheme={a.c} 
                  size={{ base: "md", md: "lg" }}
                  h={{ base: "80px", md: "90px" }}
                  flexDirection="column" 
                  gap={{ base: 1, md: 2 }}
                  borderRadius="xl"
                  boxShadow="md"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                  transition="all 0.3s"
                  px={{ base: 2, md: 4 }}
                  whiteSpace="normal"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <a.icon boxSize={{ base: 4, md: 7 }} />
                  <Text 
                    fontSize={{ base: "2xs", md: "sm" }} 
                    fontWeight="bold" 
                    textAlign="center"
                    lineHeight="1.2"
                    noOfLines={2}
                  >
                    {a.label}
                  </Text>
                </Button>
              ))}
            </SimpleGrid>
          
            <Box>
              <SimpleGrid columns={{ base: 2, md: 4, lg: 7 }} spacing={{ base: 3, md: 4 }}>
                {[
                  { l: 'Semester', fn: handleAddSem, icon: AddIcon },
                  { l: 'Subject', fn: handleAddSubject, icon: AddIcon },
                  { l: 'Room', fn: handleAddRoom, icon: AddIcon },
                  { l: 'Faculty', fn: handleAddFaculty, icon: AddIcon },
                  { l: 'Note', fn: handleAddNote, icon: AddIcon },
                  { l: 'Common Load', fn: handleAddCommonLoad, icon: AddIcon },
                  { l: 'Lunch Slot', fn: handleAddLunchSlot, icon: AddIcon },
                ].map((c, i) => (
                  <Button 
                    key={i} 
                    onClick={c.fn} 
                    leftIcon={<c.icon />} 
                    colorScheme="teal" 
                    size={{ base: "sm", md: "md" }}
                    fontSize={{ base: "2xs", md: "sm" }}
                    borderRadius="lg"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                    whiteSpace="normal"
                    h={{ base: "auto", md: "40px" }}
                    py={{ base: 2, md: 2 }}
                    px={{ base: 2, md: 4 }}
                  >
                    {c.l}
                  </Button>
                ))}
              </SimpleGrid>
            </Box>
          </CardBody>
        </Card>

        {/* Enhanced Edit Section */}
        <Card borderRadius="2xl" boxShadow="2xl" mb={2} overflow="hidden">
          <CardHeader 
            bgGradient="linear(to-r, purple.500, blue.500)" 
            py={{ base: 3, md: 4 }}
          >
            <Flex align="center" gap={{ base: 2, md: 4 }} direction={{ base: "column", md: "row" }}>
              <Box bg="whiteAlpha.300" p={{ base: 2, md: 3 }} borderRadius="xl" display={{ base: "none", md: "block" }}>
                <EditIcon color="white" boxSize={{ base: 5, md: 7 }} />
              </Box>
              <Box textAlign={{ base: "center", md: "left" }}>
                <Heading size={{ base: "sm", md: "md" }} color="white" mb={1}>Details</Heading>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5} mb={2}>
          {/* Clash Detection */}
         

          {/* Saved Status */}
          <Card 
            borderRadius="2xl" 
            borderLeftWidth="6px" 
            borderLeftColor="blue.500"
            boxShadow="lg"
            _hover={{ boxShadow: '2xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody p={2}>
              <Flex align="center" gap={2}>
                <Box bg="blue.100" p={4} borderRadius="xl" boxShadow="md">
                  <TimeIcon boxSize={4} color="blue.600" />
                </Box>
                <Box flex="1">
                  <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold" textTransform="uppercase">
                    Last Saved Time
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.700">
                    {savedTime || 'Not saved yet'}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>

          {/* Locked Status */}
          <Card 
            borderRadius="2xl" 
            borderLeftWidth="6px" 
            borderLeftColor="orange.500"
            boxShadow="lg"
            _hover={{ boxShadow: '2xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody p={2}>
              <Flex align="center" gap={4}>
                <Box bg="orange.100" p={4} borderRadius="xl" boxShadow="md">
                  <LockIcon boxSize={8} color="orange.600" />
                </Box>
                <Box flex="1">
                  <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold" textTransform="uppercase">
                    Last Locked Time
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="orange.700">
                    {lockedTime || 'Not locked yet'}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>

          {/* Published Status */}
          <Card 
            borderRadius="2xl" 
            borderLeftWidth="6px" 
            borderLeftColor="purple.500"
            boxShadow="lg"
            _hover={{ boxShadow: '2xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody p={2}>
              <Flex align="center" gap={4}>
                <Box bg="purple.100" p={4} borderRadius="xl" boxShadow="md">
                  <CheckCircleIcon boxSize={8} color="purple.600" />
                </Box>
                <Box flex="1">
                  <Text fontSize="xs" color="gray.600" mb={1} fontWeight="semibold" textTransform="uppercase">
                    Published Date
                  </Text>
                <Text fontSize="lg" fontWeight="bold" color="purple.700">
                    {formatDateTime(TTData?.datePublished)}

                </Text>

                </Box>
              </Flex>
            </CardBody>
          </Card>
       <Card 
            borderRadius="2xl" 
            borderWidth="3px" 
            borderColor={clash.length > 0 ? 'red.300' : 'green.300'}
            boxShadow="lg"
            _hover={{ boxShadow: '2xl', transform: 'translateY(-2px)' }}
            transition="all 0.3s"
          >
            <CardBody p={2}>
              <VStack align="stretch" spacing={3}>
                <Flex align="center" gap={3}>
                  <Box 
                    bg={clash.length > 0 ? 'red.100' : 'green.100'} 
                    p={1} 
                    borderRadius="xl"
                    boxShadow="md"
                  >
                    {clash.length > 0 ? 
                      <WarningIcon boxSize={8} color="red.600" /> : 
                      <CheckCircleIcon boxSize={8} color="green.600" />
                    }
                  </Box>
                  <Text fontSize="md" fontWeight="bold" color="gray.700">
                    Clash Detection
                  </Text>
                </Flex>
                {clashFlag ? (
                  clash.length === 0 ? (
                    <Badge colorScheme="green" fontSize="md" px={4} py={2} borderRadius="lg" textAlign="center">
                      ✓ NO CLASHES FOUND
                    </Badge>
                  ) : (
                    <VStack spacing={2} align="stretch">
                      <Badge colorScheme="red" fontSize="md" px={4} py={2} borderRadius="lg" textAlign="center">
                        ⚠ {clash.length} Clash(es) Found
                      </Badge>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="solid"
                        leftIcon={<WarningIcon />}
                        onClick={() => window.open(`admin/clashes`, '_blank', 'noopener,noreferrer')}
                        borderRadius="lg"
                        fontWeight="bold"
                        _hover={{ transform: 'scale(1.02)' }}
                        transition="all 0.2s"
                      >
                        View Clashes
                      </Button>
                    </VStack>
                  )
                ) : (
                  <Badge colorScheme="yellow" fontSize="md" px={4} py={2} borderRadius="lg" textAlign="center">
                    🔍 Searching...
                  </Badge>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

              
            </Flex>
          </CardHeader>

          <CardBody p={{ base: 3, md: 6 }}>
       

            <Flex align="center" gap={{ base: 2, md: 4 }} mb={{ base: 4, md: 6 }} bg="purple.50" p={{ base: 2, md: 4 }} borderRadius="xl" direction={{ base: "column", md: "row" }}>
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "lg" }} minW={{ base: "auto", md: "120px" }} color="purple.800">
                Select Semester:
              </Text>
              <Select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)} 
                size={{ base: "sm", md: "lg" }}
                borderColor="purple.400" 
                maxW={{ base: "100%", md: "400px" }}
                borderRadius="xl"
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="semibold"
                _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
              >
                {semesters.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </Select>
              <HStack spacing={{ base: 2, md: 3 }} ml={{ base: 0, md: "auto" }} w={{ base: "100%", md: "auto" }} justify={{ base: "center", md: "flex-start" }}>
                <Tooltip label="Lock Timetable" placement="top" hasArrow bg="orange.600" fontSize="sm">
                  <IconButton
                    icon={<LockIcon />}
                    onClick={handleLockTT}
                    colorScheme="orange"
                    size={{ base: "sm", md: "md" }}
                    borderRadius="lg"
                    boxShadow="md"
                  />
                </Tooltip>
                <Tooltip label="Publish Timetable" placement="bottom" hasArrow bg="green.600" fontSize="sm">
                  <IconButton
                    icon={<CheckCircleIcon />}
                    onClick={handlePublishTT}
                    colorScheme="green"
                    size={{ base: "sm", md: "md" }}
                    borderRadius="lg"
                    isDisabled={TTData?.publish === true}
                  />
                </Tooltip>
                <Tooltip label="View Summary" placement="top" hasArrow bg="purple.600" fontSize="sm">
                  <IconButton
                    icon={<ViewIcon />}
                    onClick={handleViewSummary}
                    colorScheme="blue"
                    size={{ base: "sm", md: "md" }}
                    borderRadius="lg"
                    boxShadow="md"
                  />
                </Tooltip>
                <Tooltip label=" Student Normalised Faculty Load" placement="bottom" hasArrow bg="yellow.600" fontSize="sm">
                  <IconButton
                    icon={<FaUserTimes color="white"/>}
                    onClick={handleViewDeptFacultyLoad}
                    colorScheme="yellow"
                    size={{ base: "sm", md: "md" }}
                    borderRadius="lg"
                    boxShadow="md"
                  />
                </Tooltip>
                <Tooltip label="Subject Wise Faculty Load" placement="top" hasArrow bg="pink.600" fontSize="sm">
                  <IconButton
                    icon={<FaUserAlt color="white"/>}
                    onClick={handleViewFacultyLoad}
                    colorScheme="pink"
                    size={{ base: "sm", md: "md" }}
                    borderRadius="lg"
                    boxShadow="md"
                  />
                </Tooltip>

                <Tooltip label="Download PDF" placement="bottom" hasArrow bg="cyan.600" fontSize="sm">
                  <IconButton
                    icon={<DownloadIcon color="white"/>}
                    onClick={handleDownloadClick}
                    colorScheme="cyan"
                    size={{ base: "sm", md: "md" }}
                    borderRadius="lg"
                    boxShadow="md"
                  />
                </Tooltip>
              </HStack>
            </Flex>

            {Object.keys(timetableData).length === 0 ? (
              <Flex justify="center" align="center" minH="300px" bg="gray.50" borderRadius="2xl">
                <VStack spacing={4}>
                  <RepeatIcon boxSize={12} color="purple.400" className="spin" />
                  <Text fontSize="lg" color="gray.600" fontWeight="semibold">Loading Timetable...</Text>
                </VStack>
              </Flex>
            ) : (
              <Box borderRadius="2xl" border="2px" borderColor="gray.200" boxShadow="inner" overflowX={{ base: "auto", md: "visible" }} w="100%">
                <Table size="sm" variant="simple" minW={{ base: "1200px", md: "100%" }} w="100%" tableLayout="fixed">
                  <Thead bg="purple.600">
                    <Tr>
                      <Th color="white" fontSize={{ base: "xs", md: "sm" }} p={{ base: 1, md: 2 }} textAlign="center" fontWeight="bold" w={{ base: "100px", md: "8%" }}>DAY</Th>
                      {[1,2,3,4,5,6,7,8].map(p => (
                        <Th key={p} color="white" fontSize={{ base: "xs", md: "sm" }} p={{ base: 1, md: 2 }} textAlign="center" fontWeight="bold" w={{ base: "150px", md: "11.5%" }}>
                          {p}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {days.map((day, di) => (
                      <Tr 
                        key={day} 
                        bg="white"
                        _hover={{ bg: 'purple.50' }}
                        transition="background 0.2s"
                        borderBottom="1px"
                        borderColor="gray.200"
                      >
                        <Td fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color="purple.700" p={{ base: 1, md: 2 }}>
                          {day}
                        </Td>
                        {[1,2,3,4,5,6,7,8].map(period => (
                          <Td key={period} p={{ base: 1, md: 2 }} verticalAlign="top" bg="white">
                            {timetableData[day][`period${period}`].map((slot, si) => (
                              <Box key={si}>
                                {slot.map((cell, ci) => {
                                  const getSubjectColor = (subject) => {
                                    if (!subject) return 'white';
                                    const colors = [
                                      'red.100', 'red.200', 'red.300',
                                      'orange.100', 'orange.200', 'orange.300',
                                      'yellow.100', 'yellow.200', 'yellow.300',
                                      'green.100', 'green.200', 'green.300',
                                      'teal.100', 'teal.200', 'teal.300',
                                      'blue.100', 'blue.200', 'blue.300',
                                      'cyan.100', 'cyan.200', 'cyan.300',
                                      'purple.100', 'purple.200', 'purple.300',
                                      'pink.100', 'pink.200', 'pink.300',
                                    ];
                                    let hash = 0;
                                    for (let i = 0; i < subject.length; i++) {
                                      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
                                    }
                                    return colors[Math.abs(hash) % colors.length];
                                  };

                                  const isEmpty = !cell.subject;

                                  return (
                                    <Box 
                                      key={ci} 
                                      mb={2} 
                                      p={{ base: 1, md: 2 }}
                                      bg={getSubjectColor(cell.subject)}
                                      borderRadius="md" 
                                      borderWidth="2px" 
                                      borderColor={isEmpty ? "gray.300" : "gray.400"}
                                      boxShadow="sm"
                                    >
                                      <Select 
                                        value={cell.subject} 
                                        onChange={(e) => handleCellChange(day, period, si, ci, 'subject', e)} 
                                        size="xs"
                                        borderColor="blue.400" 
                                        fontSize="xs"
                                        fontWeight={isEmpty ? "normal" : "bold"}
                                        borderRadius="md"
                                        mb={1}
                                        bg="white"
                                      >
                                        <option value="">📚 Subject</option>
                                        {availableSubjects.map(s => (
                                          <option key={s._id} value={s.subName}>{s.subName}</option>
                                        ))}
                                      </Select>

                                      <Select 
                                        value={cell.room} 
                                        onChange={(e) => handleCellChange(day, period, si, ci, 'room', e)} 
                                        size="xs"
                                        borderColor="green.400" 
                                        fontSize="xs"
                                        fontWeight={isEmpty ? "normal" : "bold"}
                                        borderRadius="md"
                                        mb={1}
                                        bg="white"
                                      >
                                        <option value="">🏢 Room</option>
                                        {availableRooms.map(r => (
                                          <option key={r} value={r}>{r}</option>
                                        ))}
                                      </Select>

                                      <Select 
                                        value={cell.faculty} 
                                        onChange={(e) => handleCellChange(day, period, si, ci, 'faculty', e)} 
                                        size="xs"
                                        borderColor="purple.400" 
                                        fontSize="xs"
                                        fontWeight={isEmpty ? "normal" : "bold"}
                                        borderRadius="md"
                                        mb={1}
                                        bg="white"
                                      >
                                        <option value="">👨‍🏫 Faculty</option>
                                        {availableFaculties.map((f, i) => (
                                          <option key={i} value={f}>{f}</option>
                                        ))}
                                      </Select>

                                      <IconButton 
                                        icon={<DeleteIcon />} 
                                        size="xs" 
                                        colorScheme="red" 
                                        variant="outline" 
                                        width="100%" 
                                        onClick={() => handleDeleteCell(day, period, si, ci)}
                                        borderRadius="md"
                                      />
                                    </Box>
                                  );
                                })}
                                {si === 0 && (
                                  <IconButton 
                                    icon={<AddIcon />} 
                                    size="xs" 
                                    colorScheme="purple" 
                                    width="100%" 
                                    onClick={() => handleSplitCell(day, period, si)}
                                    borderRadius="md"
                                  />
                                )}
                              </Box>
                            ))}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}

            <Button 
              colorScheme="green" 
              size={{ base: "md", md: "xl" }}
              mt={{ base: 4, md: 6 }}
              width={{ base: "100%", md: "25%" }}
              borderRadius="xl" 
              onClick={handleSubmit} 
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="bold"
              h={{ base: "50px", md: "60px" }}
              boxShadow="lg"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '2xl' }}
              transition="all 0.3s"
            >
              Save Timetable
            </Button>
          </CardBody>
        </Card>

        {/* Enhanced View Sections */}
        <Box mb={6}>
          <Heading size={{ base: "md", md: "lg" }} mb={4} bgGradient="linear(to-r, purple.600, blue.500)" bgClip="text">
          </Heading>
          
          {/* View Semester */}
          <Card borderRadius="2xl" boxShadow="xl" overflow="hidden" mb={4}>
            <CardHeader bg="blue.500" py={{ base: 3, md: 5 }}>
              <Flex align="center" gap={3}>
                <Box bg="whiteAlpha.300" p={3} borderRadius="lg">
                  <ViewIcon color="white" boxSize={{ base: 4, md: 6 }} />
                </Box>
                <Heading size={{ base: "sm", md: "md" }} color="white">View Semester</Heading>
              </Flex>
            </CardHeader>
            <CardBody p={{ base: 3, md: 6 }}>
              <Flex align="center" gap={3} mb={4} bg="blue.50" p={3} borderRadius="lg" direction={{ base: "column", md: "row" }}>
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" minW={{ base: "auto", md: "80px" }} color="blue.800">
                  Semester:
                </Text>
                <Select 
                  value={viewselectedSemester} 
                  onChange={(e) => setViewSelectedSemester(e.target.value)} 
                  size={{ base: "sm", md: "md" }}
                  borderColor="blue.400" 
                  placeholder="Select Semester" 
                  fontSize="sm"
                  borderRadius="lg"
                >
                  {semesters.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </Select>
              </Flex>
              {viewselectedSemester ? (
                <Box>
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
                <Flex justify="center" align="center" minH="100px" bg="gray.50" borderRadius="lg">
                  <Text color="gray.500" fontSize="sm">Please select a semester</Text>
                </Flex>
              )}
            </CardBody>
          </Card>

          {/* View Faculty */}
          <Card borderRadius="2xl" boxShadow="xl" overflow="hidden" mb={4}>
            <CardHeader bg="green.500" py={{ base: 3, md: 5 }}>
              <Flex align="center" gap={3}>
                <Box bg="whiteAlpha.300" p={3} borderRadius="lg">
                  <ViewIcon color="white" boxSize={{ base: 4, md: 6 }} />
                </Box>
                <Heading size={{ base: "sm", md: "md" }} color="white">View Faculty</Heading>
              </Flex>
            </CardHeader>
            <CardBody p={{ base: 3, md: 6 }}>
              <Flex align="center" gap={3} mb={4} bg="green.50" p={3} borderRadius="lg" direction={{ base: "column", md: "row" }}>
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" minW={{ base: "auto", md: "80px" }} color="green.800">
                  Faculty:
                </Text>
                <Select 
                  value={viewFaculty} 
                  onChange={(e) => setViewFaculty(e.target.value)} 
                  size={{ base: "sm", md: "md" }}
                  borderColor="green.400" 
                  placeholder="Select Faculty" 
                  fontSize="sm"
                  borderRadius="lg"
                >
                  {availableFaculties.map((f, i) => <option key={i} value={f}>{f}</option>)}
                </Select>
              </Flex>
              {viewFaculty ? (
                <Box>
                  <Badge colorScheme="green" fontSize="xs" mb={3} px={3} py={1} borderRadius="full">
                    Updated: {facultyUpdateTime || 'N/A'}
                  </Badge>
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
                <Flex justify="center" align="center" minH="100px" bg="gray.50" borderRadius="lg">
                  <Text color="gray.500" fontSize="sm">Please select a faculty</Text>
                </Flex>
              )}
            </CardBody>
          </Card>

          {/* View Room */}
          <Card borderRadius="2xl" boxShadow="xl" overflow="hidden">
            <CardHeader bg="orange.500" py={{ base: 3, md: 5 }}>
              <Flex align="center" gap={3}>
                <Box bg="whiteAlpha.300" p={3} borderRadius="lg">
                  <ViewIcon color="white" boxSize={{ base: 4, md: 6 }} />
                </Box>
                <Heading size={{ base: "sm", md: "md" }} color="white">View Room</Heading>
              </Flex>
            </CardHeader>
            <CardBody p={{ base: 3, md: 6 }}>
              <Flex align="center" gap={3} mb={4} bg="orange.50" p={3} borderRadius="lg" direction={{ base: "column", md: "row" }}>
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" minW={{ base: "auto", md: "80px" }} color="orange.800">
                  Room:
                </Text>
                <Select 
                  value={viewRoom} 
                  onChange={(e) => setViewRoom(e.target.value)} 
                  size={{ base: "sm", md: "md" }}
                  borderColor="orange.400" 
                  placeholder="Select Room" 
                  fontSize="sm"
                  borderRadius="lg"
                >
                  {availableRooms.map((r, i) => <option key={i} value={r}>{r}</option>)}
                </Select>
              </Flex>
              {viewRoom ? (
                <Box>
                  <Badge colorScheme="orange" fontSize="xs" mb={3} px={3} py={1} borderRadius="full">
                    Updated: {roomUpdateTime || 'N/A'}
                  </Badge>
                  <ViewTimetable timetableData={viewRoomData} />
                </Box>
              ) : (
                <Flex justify="center" align="center" minH="100px" bg="gray.50" borderRadius="lg">
                  <Text color="gray.500" fontSize="sm">Please select a room</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
        </Box>
      </Container>

      {/* Message Toast */}
      <Portal>
        <Box
          bg={showMessage && message ? 'orange.500' : 'transparent'}
          color="white"
          textAlign="center"
          fontWeight="bold"
          fontSize={{ base: "sm", md: "md" }}
          position="fixed"
          top="30%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex="999"
          borderRadius="xl"
          p={{ base: 2, md: 3 }}
          opacity={showMessage && message ? 1 : 0}
          transition="opacity 0.3s"
          maxW={{ base: "90%", md: "auto" }}
        >
          {message}
        </Box>
      </Portal>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Container>
  );
};

export default Timetable;