import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import './Timetable.css';
import TimetableSummary from './ttsummary';
import ReactToPrint from 'react-to-print';
import {
  Box,
  Container,
  Text,
  VStack,
  Flex,
  Heading,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Button,
  SimpleGrid,
  HStack,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  Icon,
  Spinner,
  CircularProgress,
  CircularProgressLabel,
} from "@chakra-ui/react";
import { DownloadIcon, ExternalLinkIcon, CheckCircleIcon, TimeIcon } from '@chakra-ui/icons';
import { FaFilePdf, FaUsers, FaChalkboard, FaDoorOpen, FaClipboardList, FaArrowRight } from 'react-icons/fa';
import Header from '../components/header';
import { Helmet } from 'react-helmet-async';
import downloadPDF from '../filedownload/downloadpdf';
import downloadMergedPDF from '../filedownload/downloadmergedpdf';
import mergePdfs from '../filedownload/mergepdf';
import generateSummaryTablePDF from '../filedownload/downloadsummary';

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
  
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];
  const apiUrl = getEnvironment();

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
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
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
          setDownloadStatus("fetchingSemesters");
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

  // [Keep all the existing fetch and generation functions - same as before]
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
    setDownloadStatus("fetchingSlotData");
    const { initialData, notes } = await fetchData(semester);
    setDownloadStatus("fetchingSummaryData");
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
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
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
              let faculty = "";
              let room = "";
              for (const slotItem of slot) {
                const subj = slotItem.subject || "";
                if (type == "room") {
                  room = slotItem.sem || "";
                } else {
                  room = slotItem.room || "";
                }
                if (type == "faculty") {
                  faculty = slotItem.sem || "";
                } else {
                  faculty = slotItem.faculty || "";
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
              let faculty = "";
              let room = "";
              for (const slotItem of slot) {
                const subj = slotItem.subject || "";
                if (type == "room") {
                  room = slotItem.sem || "";
                } else {
                  room = slotItem.room || "";
                }
                if (type == "faculty") {
                  faculty = slotItem.sem || "";
                } else {
                  faculty = slotItem.faculty || "";
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
                  subject: "",
                  room: "",
                  faculty: "",
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
        credentials: 'include'
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
      const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails.dept}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDeptFaculties(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };

  const [commonLoad, setCommonLoad] = useState('');

  const fetchCommonLoad = async (currentCode, viewFaculty) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/commonLoad/${currentCode}/${viewFaculty}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setCommonLoad(data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching commonload:", error);
    }
  };

  function generateSummary(timetableData, subjectData, type, headTitle, commonLoad) {
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
                  foundSubject = subjectData.find(item => item.subName === subject && item.sem === faculty);
                } else if (type == 'room') {
                  foundSubject = subjectData.find(item => item.subName === subject && item.sem === room);
                } else if (type == 'sem') {
                  foundSubject = subjectData.find(item => item.subName === subject && item.sem === headTitle);
                }
                if (foundSubject) {
                  if (!summaryData[subject]) {
                    summaryData[subject] = {
                      subCode: foundSubject.subCode,
                      count: 1,
                      faculties: [faculty],
                      subType: foundSubject.type,
                      rooms: [room],
                      subjectFullName: foundSubject.subjectFullName,
                      subSem: foundSubject.sem,
                    };
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
      let isMerged = false;
      for (const existingKey in mergedSummaryData) {
        const existingEntry = mergedSummaryData[existingKey];
        if (
          entry.faculties.every(faculty => existingEntry.faculties.includes(faculty)) &&
          entry.subType === existingEntry.subType &&
          entry.subjectFullName === existingEntry.subjectFullName &&
          entry.rooms.every(room => existingEntry.rooms.includes(room))
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
          case 'theory': return 0;
          case 'tutorial': return 1;
          case 'laboratory': return 2;
          default: return 3;
        }
      };
      return subtypePriority(a.subType) - subtypePriority(b.subType);
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
    return sortedSummaryEntries;
  }

  const fetchAndStoreTimetableDataForAllSemesters = async () => {
    setIsLoading(true);
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFooters");
    const fetchedttdetails = await fetchTTData(currentCode);

    for (const semester of availableSems) {
      const { initialData, notes } = await fetchTimetableData(semester);
      const fetchedttdata = initialData;
      const semNotes = notes;
      const summaryData = generateSummary(fetchedttdata, subjectData, 'sem', semester);
      const lockTime = await fetchTime();
      setPrepareStatus("preparingDownload");
      downloadPDF(fetchedttdata, summaryData, 'sem', fetchedttdetails, lockTime, semester, semNotes);
      setStartStatus("downloadStarted");
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(semester);
    }
    setCompleteStatus("downloadCompleted");
    setIsLoading(false);
  };

  const fetchAndStoreTimetableDataForAllSemestersMerged = async () => {
    setIsLoading(true);
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFooters");
    const fetchedttdetails = await fetchTTData(currentCode);
    let allSemMerged = [];
    
    for (const semester of availableSems) {
      const { initialData, notes } = await fetchTimetableData(semester);
      const fetchedttdata = initialData;
      const semNotes = notes;
      const summaryData = generateSummary(fetchedttdata, subjectData, 'sem', semester);
      const lockTime = await fetchTime();
      setPrepareStatus("preparingDownload");
      downloadMergedPDF(fetchedttdata, summaryData, 'sem', fetchedttdetails, lockTime, semester, semNotes, allSemMerged);
      setStartStatus("downloadStarted");
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(semester);
    }
    mergePdfs(allSemMerged, "allSem.pdf");
    setCompleteStatus("downloadCompleted");
    setIsLoading(false);
  };

  const fetchAndStoreTimetableDataForAllFacultyMerged = async () => {
    setIsLoading(true);
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFootersMerged");
    const allFacultySummaries = [];
    const fetchedttdetails = await fetchTTData(currentCode);
    let allFacultyPdfBlob = [];
    
    for (const faculty of availableFaculties) {
      const { initialData, updateTime, notes } = await fetchFacultyData(currentCode, faculty);
      const fetchedttdata = initialData;
      const facultyNotes = notes;
      const projectLoad = await fetchCommonLoad(currentCode, faculty);
      const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty', faculty, projectLoad);
      allFacultySummaries.push({ faculty, summaryData });
      const lockTime = updateTime;
      setHeaderStatus("fetchingHeadersFootersMerged");
      setNoteStatus("fetchingNotesMerged");
      setDownloadStatus("preparingDownloadMerged");
      setPrepareStatus("preparingDownloadMerged");
      downloadMergedPDF(fetchedttdata, summaryData, 'faculty', fetchedttdetails, lockTime, faculty, facultyNotes, allFacultyPdfBlob);
      setDownloadStatus("downloadStartedMerged");
      setStartStatus("downloadStartedMerged");
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(faculty);
    }
    mergePdfs(allFacultyPdfBlob, "allFaculty.pdf");
    setCompleteStatus("downloadCompletedMerged");
    setIsLoading(false);
  };

  const fetchAndStoreTimetableDataForAllFaculty = async () => {
    setIsLoading(true);
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFooters");
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
      setHeaderStatus("fetchingHeadersFooters");
      setNoteStatus("fetchingNotes");
      setDownloadStatus("preparingDownload");
      setPrepareStatus("preparingDownload");
      downloadPDF(fetchedttdata, summaryData, 'faculty', fetchedttdetails, lockTime, faculty, facultyNotes);
      setDownloadStatus("downloadStarted");
      setStartStatus("downloadStarted");
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(faculty);
    }
    setCompleteStatus("downloadCompleted");
    setIsLoading(false);
  };

  const fetchAndStoreTimetableDataForAllRoom = async () => {
    setIsLoading(true);
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFooters");
    const fetchedttdetails = await fetchTTData(currentCode);

    for (const room of availableRooms) {
      const { initialData, updateTime, notes } = await fetchRoomData(currentCode, room);
      const fetchedttdata = initialData;
      const roomNotes = notes;
      const summaryData = generateSummary(fetchedttdata, subjectData, 'room', room);
      const lockTime = updateTime;
      setHeaderStatus("fetchingHeadersFooters");
      setNoteStatus("fetchingNotes");
      setDownloadStatus("preparingDownload");
      setPrepareStatus("preparingDownload");
      downloadPDF(fetchedttdata, summaryData, 'room', fetchedttdetails, lockTime, room, roomNotes);
      setDownloadStatus("downloadStarted");
      setStartStatus("downloadStarted");
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(room);
    }
    setCompleteStatus("downloadCompleted");
    setIsLoading(false);
  };

  const fetchAndStoreTimetableDataForAllRoomMerged = async () => {
    setIsLoading(true);
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFooters");
    const fetchedttdetails = await fetchTTData(currentCode);
    let allRoomMerged = [];
    
    for (const room of availableRooms) {
      const { initialData, updateTime, notes } = await fetchRoomData(currentCode, room);
      const fetchedttdata = initialData;
      const roomNotes = notes;
      const summaryData = generateSummary(fetchedttdata, subjectData, 'room', room);
      const lockTime = updateTime;
      setHeaderStatus("fetchingHeadersFooters");
      setNoteStatus("fetchingNotes");
      setDownloadStatus("preparingDownload");
      setPrepareStatus("preparingDownload");
      downloadMergedPDF(fetchedttdata, summaryData, 'room', fetchedttdetails, lockTime, room, roomNotes, allRoomMerged);
      setDownloadStatus("downloadStarted");
      setStartStatus("downloadStarted");
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(room);
    }
    mergePdfs(allRoomMerged, "allRoom.pdf");
    setCompleteStatus("downloadCompleted");
    setIsLoading(false);
  };

  const fetchDeptLoadAllocation = async () => {
    setIsLoading(true);
    const subjectData = await fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFooters");
    const allFacultySummaries = [];
    const fetchedttdetails = await fetchTTData(currentCode);
    const filteredFaculties = await fetchDeptFaculty(currentCode);
    const facultyNames = filteredFaculties.map(faculty => faculty.name);
    
    for (const faculty of facultyNames) {
      const { initialData, updateTime, notes } = await fetchFacultyData(currentCode, faculty);
      const fetchedttdata = initialData;
      const facultyNotes = notes;
      const projectLoad = await fetchCommonLoad(currentCode, faculty);
      const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty', faculty, projectLoad);
      allFacultySummaries.push({ faculty, summaryData });
      const lockTime = updateTime;
      setHeaderStatus("fetchingHeadersFooters");
      setDownloadStatus("preparingDownload");
      setPrepareStatus("preparingDownload");
      setDownloadStatus("downloadStarted");
      setStartStatus("downloadStarted");
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(faculty);
    }
    generateSummaryTablePDF(allFacultySummaries, filteredFaculties, fetchedttdetails.session, fetchedttdetails.dept);
    setCompleteStatus("downloadCompleted");
    setIsLoading(false);
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

  const handleDownloadAllSemestersMerged = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('semMerged');
    setInitiateStatus('starting');
    fetchAndStoreTimetableDataForAllSemestersMerged();
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

  const handleDownloadAllFacultyMerged = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('facultyMerged');
    setInitiateStatus('startingMerged');
    fetchAndStoreTimetableDataForAllFacultyMerged();
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

  const handleDownloadAllRoomMerged = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('roomMerged');
    setInitiateStatus('starting');
    fetchAndStoreTimetableDataForAllRoomMerged();
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

  const StatusMessage = ({ type: msgType, status, message, color = "blue" }) => {
    if (downloadType !== msgType || !status) return null;
    
    return (
      <Alert status={color === "green" ? "success" : "info"} borderRadius="md" mb={2}>
        <AlertIcon />
        {isLoading && color !== "green" && (
          <Spinner size="sm" mr={2} color="blue.500" />
        )}
        <AlertDescription fontWeight={color === "green" ? "bold" : "medium"} color={color === "green" ? "green.700" : undefined}>
          {message}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <>
      <Helmet>
        <title>XCEED Express Download | NITJ</title>
        <meta name='description' content="Bulk download timetables for semesters, faculty, and rooms" />
      </Helmet>

      <Box bg="white" minH="100vh">
        {/* Hero Header Section */}
        <Box
          bgGradient="linear(to-r, blue.500, cyan.500, purple.600)"
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
                Bulk Download
              </Badge>
              <Heading 
                size={{ base: "xl", md: "2xl" }}
                color="white" 
                fontWeight="bold" 
                lineHeight="1.2"
              >
                XCEED Express Download
              </Heading>
              <Text 
                color="whiteAlpha.900" 
                fontSize={{ base: "md", md: "lg" }}
                maxW={{ base: "full", lg: "2xl" }}
              >
                Download timetables in bulk for all semesters, faculty members, and rooms
              </Text>
            </VStack>
          </Container>
        </Box>

        <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={6} align="stretch">
            {/* Statistics Card */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="blue.600" color="white" p={4}>
                <Heading size={{ base: "sm", md: "md" }}>Available Resources</Heading>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                  <Box
                    bg="blue.50"
                    p={{ base: 3, md: 4 }}
                    borderRadius="lg"
                    border="2px"
                    borderColor="blue.200"
                  >
                    <HStack spacing={{ base: 2, md: 3 }}>
                      <Icon as={FaChalkboard} boxSize={{ base: 6, md: 8 }} color="blue.600" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="blue.700">
                          {availableSems.length}
                        </Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Semesters</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  <Box
                    bg="purple.50"
                    p={{ base: 3, md: 4 }}
                    borderRadius="lg"
                    border="2px"
                    borderColor="purple.200"
                  >
                    <HStack spacing={{ base: 2, md: 3 }}>
                      <Icon as={FaUsers} boxSize={{ base: 6, md: 8 }} color="purple.600" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="purple.700">
                          {availableFaculties.length}
                        </Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Faculty Members</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  <Box
                    bg="cyan.50"
                    p={{ base: 3, md: 4 }}
                    borderRadius="lg"
                    border="2px"
                    borderColor="cyan.200"
                  >
                    <HStack spacing={{ base: 2, md: 3 }}>
                      <Icon as={FaDoorOpen} boxSize={{ base: 6, md: 8 }} color="cyan.600" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="cyan.700">
                          {availableRooms.length}
                        </Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Rooms</Text>
                      </VStack>
                    </HStack>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Semester Downloads Card */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="teal.600" color="white" p={4}>
                <HStack spacing={2}>
                  <Icon as={FaChalkboard} boxSize={{ base: 4, md: 5 }} />
                  <Heading size={{ base: "sm", md: "md" }}>Semester Timetables</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Button
                      leftIcon={<DownloadIcon />}
                      onClick={handleDownloadAllSemesters}
                      colorScheme="teal"
                      size={{ base: "md", md: "lg" }}
                      height="auto"
                      py={{ base: 3, md: 4 }}
                      isDisabled={isLoading && downloadType === 'sem'}
                      isLoading={isLoading && downloadType === 'sem'}
                    >
                      <VStack spacing={0} align="start">
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Download Separate</Text>
                        <Text fontSize="xs" opacity={0.9}>Individual PDFs</Text>
                      </VStack>
                    </Button>

                    <Button
                      leftIcon={<FaFilePdf />}
                      onClick={handleDownloadAllSemestersMerged}
                      colorScheme="purple"
                      size={{ base: "md", md: "lg" }}
                      height="auto"
                      py={{ base: 3, md: 4 }}
                      isDisabled={isLoading && downloadType === 'semMerged'}
                      isLoading={isLoading && downloadType === 'semMerged'}
                    >
                      <VStack spacing={0} align="start">
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Download Merged</Text>
                        <Text fontSize="xs" opacity={0.9}>Single PDF</Text>
                      </VStack>
                    </Button>
                  </SimpleGrid>

                  <Box>
                    <StatusMessage type="sem" status={initiateStatus === 'starting'} message="Initiating download. It may take a while! Sit back and relax!" />
                    <StatusMessage type="sem" status={slotStatus === 'fetchingSlotData'} message="Fetching slot data..." />
                    <StatusMessage type="sem" status={summaryStatus === 'fetchingSummaryData'} message="Fetching summary data..." />
                    <StatusMessage type="sem" status={noteStatus === 'fetchingNotes'} message="Fetching notes..." />
                    <StatusMessage type="sem" status={headerStatus === 'fetchingHeadersFooters'} message="Fetching headers and footers..." />
                    <StatusMessage type="sem" status={prepareStatus === 'preparingDownload'} message="Preparing download..." />
                    <StatusMessage type="sem" status={startStatus === 'downloadStarted'} message="Download in progress..." />
                    <StatusMessage type="sem" status={completeStatus === 'downloadCompleted'} message="Download Completed." color="green" />

                    <StatusMessage type="semMerged" status={initiateStatus === 'starting'} message="Initiating merged download. It may take a while!" />
                    <StatusMessage type="semMerged" status={slotStatus === 'fetchingSlotData'} message="Fetching slot data..." />
                    <StatusMessage type="semMerged" status={summaryStatus === 'fetchingSummaryData'} message="Fetching summary data..." />
                    <StatusMessage type="semMerged" status={noteStatus === 'fetchingNotes'} message="Fetching notes..." />
                    <StatusMessage type="semMerged" status={headerStatus === 'fetchingHeadersFooters'} message="Fetching headers and footers..." />
                    <StatusMessage type="semMerged" status={prepareStatus === 'preparingDownload'} message="Preparing download..." />
                    <StatusMessage type="semMerged" status={startStatus === 'downloadStarted'} message="Download in progress...S" />
                    <StatusMessage type="semMerged" status={completeStatus === 'downloadCompleted'} message="Download Completed." color="green" />
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Faculty Downloads Card */}
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
                  <Icon as={FaUsers} boxSize={{ base: 4, md: 5 }} />
                  <Heading size={{ base: "sm", md: "md" }}>Faculty Timetables</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Button
                      leftIcon={<DownloadIcon />}
                      onClick={handleDownloadAllFaculty}
                      colorScheme="teal"
                      size={{ base: "md", md: "lg" }}
                      height="auto"
                      py={{ base: 3, md: 4 }}
                      isDisabled={isLoading && downloadType === 'faculty'}
                      isLoading={isLoading && downloadType === 'faculty'}
                    >
                      <VStack spacing={0} align="start">
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Download Separate</Text>
                        <Text fontSize="xs" opacity={0.9}>Individual PDFs</Text>
                      </VStack>
                    </Button>

                    <Button
                      leftIcon={<FaFilePdf />}
                      onClick={handleDownloadAllFacultyMerged}
                      colorScheme="purple"
                      size={{ base: "md", md: "lg" }}
                      height="auto"
                      py={{ base: 3, md: 4 }}
                      isDisabled={isLoading && downloadType === 'facultyMerged'}
                      isLoading={isLoading && downloadType === 'facultyMerged'}
                    >
                      <VStack spacing={0} align="start">
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Download Merged</Text>
                        <Text fontSize="xs" opacity={0.9}>Single PDF</Text>
                      </VStack>
                    </Button>
                  </SimpleGrid>

                  <Box>
                    <StatusMessage type="faculty" status={initiateStatus === 'starting'} message="Initiating download. Last few miles to go..." />
                    <StatusMessage type="faculty" status={slotStatus === 'fetchingSlotData'} message="Fetching slot data..." />
                    <StatusMessage type="faculty" status={summaryStatus === 'fetchingSummaryData'} message="Fetching summary data..." />
                    <StatusMessage type="faculty" status={noteStatus === 'fetchingNotes'} message="Fetching notes..." />
                    <StatusMessage type="faculty" status={headerStatus === 'fetchingHeadersFooters'} message="Fetching headers and footers..." />
                    <StatusMessage type="faculty" status={prepareStatus === 'preparingDownload'} message="Preparing download..." />
                    <StatusMessage type="faculty" status={startStatus === 'downloadStarted'} message="Download in progress. Last few miles to go..." />
                    <StatusMessage type="faculty" status={completeStatus === 'downloadCompleted'} message="Download Completed." color="green" />

                    <StatusMessage type="facultyMerged" status={initiateStatus === 'startingMerged'} message="Initiating merged download..." />
                    <StatusMessage type="facultyMerged" status={slotStatus === 'fetchingSlotDataMerged'} message="Fetching slot data..." />
                    <StatusMessage type="facultyMerged" status={summaryStatus === 'fetchingSummaryDataMerged'} message="Fetching summary data..." />
                    <StatusMessage type="facultyMerged" status={noteStatus === 'fetchingNotesMerged'} message="Fetching notes..." />
                    <StatusMessage type="facultyMerged" status={headerStatus === 'fetchingHeadersFootersMerged'} message="Fetching headers and footers..." />
                    <StatusMessage type="facultyMerged" status={prepareStatus === 'preparingDownloadMerged'} message="Preparing download..." />
                    <StatusMessage type="facultyMerged" status={startStatus === 'downloadStartedMerged'} message="Download in progress..." />
                    <StatusMessage type="facultyMerged" status={completeStatus === 'downloadCompletedMerged'} message="Download Completed." color="green" />
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Room Downloads Card */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="cyan.600" color="white" p={4}>
                <HStack spacing={2}>
                  <Icon as={FaDoorOpen} boxSize={{ base: 4, md: 5 }} />
                  <Heading size={{ base: "sm", md: "md" }}>Room Timetables</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Button
                      leftIcon={<DownloadIcon />}
                      onClick={handleDownloadAllRoom}
                      colorScheme="teal"
                      size={{ base: "md", md: "lg" }}
                      height="auto"
                      py={{ base: 3, md: 4 }}
                      isDisabled={isLoading && downloadType === 'room'}
                      isLoading={isLoading && downloadType === 'room'}
                    >
                      <VStack spacing={0} align="start">
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Download Separate</Text>
                        <Text fontSize="xs" opacity={0.9}>Individual PDFs</Text>
                      </VStack>
                    </Button>

                    <Button
                      leftIcon={<FaFilePdf />}
                      onClick={handleDownloadAllRoomMerged}
                      colorScheme="purple"
                      size={{ base: "md", md: "lg" }}
                      height="auto"
                      py={{ base: 3, md: 4 }}
                      isDisabled={isLoading && downloadType === 'roomMerged'}
                      isLoading={isLoading && downloadType === 'roomMerged'}
                    >
                      <VStack spacing={0} align="start">
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Download Merged</Text>
                        <Text fontSize="xs" opacity={0.9}>Single PDF</Text>
                      </VStack>
                    </Button>
                  </SimpleGrid>

                  <Box>
                    <StatusMessage type="room" status={initiateStatus === 'starting'} message="Initiating download. Last few miles to go!!" />
                    <StatusMessage type="room" status={slotStatus === 'fetchingSlotData'} message="Fetching slot data..." />
                    <StatusMessage type="room" status={summaryStatus === 'fetchingSummaryData'} message="Fetching summary data..." />
                    <StatusMessage type="room" status={noteStatus === 'fetchingNotes'} message="Fetching notes..." />
                    <StatusMessage type="room" status={headerStatus === 'fetchingHeadersFooters'} message="Fetching headers and footers..." />
                    <StatusMessage type="room" status={prepareStatus === 'preparingDownload'} message="Preparing download..." />
                    <StatusMessage type="room" status={startStatus === 'downloadStarted'} message="Download in progress. Last few miles to go!!" />
                    <StatusMessage type="room" status={completeStatus === 'downloadCompleted'} message="Download Completed." color="green" />

                    <StatusMessage type="roomMerged" status={initiateStatus === 'starting'} message="Initiating merged download..." />
                    <StatusMessage type="roomMerged" status={slotStatus === 'fetchingSlotData'} message="Fetching slot data..." />
                    <StatusMessage type="roomMerged" status={summaryStatus === 'fetchingSummaryData'} message="Fetching summary data..." />
                    <StatusMessage type="roomMerged" status={noteStatus === 'fetchingNotes'} message="Fetching notes..." />
                    <StatusMessage type="roomMerged" status={headerStatus === 'fetchingHeadersFooters'} message="Fetching headers and footers..." />
                    <StatusMessage type="roomMerged" status={prepareStatus === 'preparingDownload'} message="Preparing download..." />
                    <StatusMessage type="roomMerged" status={startStatus === 'downloadStarted'} message="Download in progress..." />
                    <StatusMessage type="roomMerged" status={completeStatus === 'downloadCompleted'} message="Download Completed." color="green" />
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Load Allocation Card */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="orange.600" color="white" p={4}>
                <HStack spacing={2}>
                  <Icon as={FaClipboardList} boxSize={{ base: 4, md: 5 }} />
                  <Heading size={{ base: "sm", md: "md" }}>Department Load Allocation</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={4} align="stretch">
                  <Button
                    leftIcon={<FaFilePdf />}
                    onClick={handleDownloadDeptLoadDistribution}
                    colorScheme="orange"
                    size={{ base: "md", md: "lg" }}
                    isDisabled={isLoading && downloadType === 'load'}
                    isLoading={isLoading && downloadType === 'load'}
                  >
                    <Text fontSize={{ base: "sm", md: "md" }}>Download Department Load Allocation (PDF)</Text>
                  </Button>

                  <Divider />

                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Alternative Formats:
                    </Text>
                    
                    <Button
                      as={Link}
                      to="/tt/masterload"
                      rightIcon={<FaArrowRight />}
                      colorScheme="blue"
                      variant="outline"
                      size={{ base: "sm", md: "md" }}
                    >
                      <Text fontSize={{ base: "xs", md: "sm" }}>Department Load Without Project Load (Format-1)</Text>
                    </Button>

                    <Button
                      as={Link}
                      to={`${currentPath}/loadallocation`}
                      rightIcon={<FaArrowRight />}
                      colorScheme="purple"
                      variant="outline"
                      size={{ base: "sm", md: "md" }}
                    >
                      <Text fontSize={{ base: "xs", md: "sm" }}>Department Load (Format-2)</Text>
                    </Button>

                    {/* <Button
                      as={Link}
                      to={`${currentPath}/mergepdf`}
                      rightIcon={<ExternalLinkIcon />}
                      colorScheme="teal"
                      variant="outline"
                      size={{ base: "sm", md: "md" }}
                    >
                      <Text fontSize={{ base: "xs", md: "sm" }}>Navigate to Merge PDF Page</Text>
                    </Button> */}
                  </VStack>

                  <Box>
                    <StatusMessage type="load" status={initiateStatus === 'starting'} message="Initiating download. Last few miles to go!" />
                    <StatusMessage type="load" status={slotStatus === 'fetchingSlotData'} message="Fetching slot data..." />
                    <StatusMessage type="load" status={summaryStatus === 'fetchingSummaryData'} message="Fetching summary data..." />
                    <StatusMessage type="load" status={noteStatus === 'fetchingNotes'} message="Fetching department faculties..." />
                    <StatusMessage type="load" status={headerStatus === 'fetchingHeadersFooters'} message="Fetching headers and footers..." />
                    <StatusMessage type="load" status={prepareStatus === 'preparingDownload'} message="Preparing download..." />
                    <StatusMessage type="load" status={startStatus === 'downloadStarted'} message="Download in progress!! Last few miles to go!" />
                    <StatusMessage type="load" status={completeStatus === 'downloadCompleted'} message="Download Completed." color="green" />
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default PrintSummary;