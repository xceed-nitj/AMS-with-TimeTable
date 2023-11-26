import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import './Timetable.css';
import TimetableSummary from './ttsummary';
import ReactToPrint from 'react-to-print';
import { Container } from "@chakra-ui/layout";
import { Heading } from '@chakra-ui/react';
import {CustomTh, CustomLink, CustomBlueButton, CustomPlusButton, CustomDeleteButton} from '../styles/customStyles'
import { Box, Text, Portal, ChakraProvider } from "@chakra-ui/react";
import downloadPDF from '../filedownload/downloadpdf';
import generateSummaryTablePDF from '../filedownload/downloadsummary'


import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";
import PDFDownloader from '../filedownload/downloadpdf';
import PDFGenerator from '../filedownload/makepdf';
import Header from '../components/header';


const PrintSummary = () => {

// Initialize as an empty array
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

  const [facultyUpdateTime,setFacultyUpdateTime]=useState();
  const [roomUpdateTime,setRoomUpdateTime]=useState();

  const [subjectData, setSubjectData] = useState([]); 
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];
  const apiUrl=getEnvironment();

  const[downloadType, setDownloadType]=useState('')

  const [downloadStatus, setDownloadStatus]=useState('')
  const [initiateStatus, setInitiateStatus]=useState('')
  const [slotStatus, setSlotStatus]=useState('')
  const [summaryStatus, setSummaryStatus]=useState('')
  const [noteStatus, setNoteStatus]=useState('')
  const [headerStatus, setHeaderStatus]=useState('')
  const [prepareStatus, setPrepareStatus]=useState('')
  const [startStatus, setStartStatus]=useState('')
  const [completeStatus, setCompleteStatus]=useState('')


  useEffect(() => {

    // getting all the semester values for this code.
    const fetchSem = async () => {
      try {
          const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`,{credentials: 'include'});
        if (response.ok) {
          const data = await response.json();
          // console.log('filtered data',data)
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);
            // console.log(semValues)
          setAvailableSems(semValues);
          setDownloadStatus("fetchingSemesters")
        //   setSelectedSemester(semValues[0]);
          // console.log('available semesters',availableSems)
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchRoom = async () => {
        try {
          const response = await fetch(`${apiUrl}/timetablemodule/addroom?code=${currentCode}`,{credentials: 'include',});
          if (response.ok) {
            const data = await response.json();
            const filteredSems = data.filter((room) => room.code === currentCode);
            const semValues = filteredSems.map((room) => room.room);
  
            setAvailableRooms(semValues);
            // console.log('available rooms',availableRooms)
          }
        } catch (error) {
          console.error('Error fetching subject data:', error);
        }
      };
  
    

      const fetchFaculty = async () => {
        try {
          const response = await fetch(`${apiUrl}/timetablemodule/addfaculty/all?code=${currentCode}`,{credentials: 'include',});
          if (response.ok) {
            const data = await response.json();
            // console.log('faculty response',data);
            setAvailableFaculties(data);
            // console.log('faculties', availableFaculties);
          }
           
        } catch (error) {
          console.error('Error fetching subject data:', error);
        }
      };


      fetchSem();
      fetchRoom(currentCode);
      fetchFaculty();


  }, []);
// fetching sem data
  const fetchData = async (semester) => {
    try {
      // console.log('sem value',semester);
      // console.log('current code', currentCode);
      const response = await fetch(`${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`,{credentials: 'include'});
      const data1 = await response.json();
      // console.log('fetched',data1);
      const data=data1.timetableData;
      const notes=data1.notes;
      const initialData = generateInitialTimetableData(data,'sem');
      return {initialData,notes};
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };

  const fetchTime = async () => {
    try {
      // console.log('sem value',semester);
      // console.log('current code', currentCode);
      const response = await fetch(`${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,{credentials: 'include'});
      const data = await response.json();
      // console.log('time daata', data)
      setLockedTime(data.updatedTime.lockTimeIST)
      setSavedTime( data.updatedTime.saveTimeIST)
      return data.updatedTime.lockTimeIST;
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      }
  };


  const fetchTimetableData = async (semester) => {
    setDownloadStatus("fetchingSlotData")
    const {initialData,notes} = await fetchData(semester);
    // setTimetableData(initialData);
    setDownloadStatus("fetchingSummaryData")
    // console.log('semdata',initialData)
    return {initialData,notes};
    
};


//fetching faculty data 
  const facultyData = async (currentCode, faculty) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty }`,{credentials: 'include'});
      const data1 = await response.json();
      const data=data1.timetableData;
      // console.log('updated time for faculty', data1.updatedTime)
      const updateTime=data1.updatedTime;
      const notes=data1.notes;
      // console.log('faclty time', facultyUpdateTime)
      const initialData =  generateInitialTimetableData(data,'faculty');
      return {initialData,updateTime,notes};
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
  };
  const fetchFacultyData = async (currentCode, faculty) => {
    const {initialData,updateTime,notes} = await facultyData(currentCode, faculty);
    // setTimetableData(data);
    setSlotStatus('fetchingSlotData')
    return {initialData,updateTime,notes};

  };

// fetching room data

const roomData = async (currentCode, room) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room }`,{credentials: 'include'});
      const data1 = await response.json();
      const data=data1.timetableData;
      // setRoomUpdateTime(data1.updatedTime);
      const updateTime=data1.updatedTime;
      const notes=data1.notes;

      const initialData = generateInitialTimetableData(data,'room');
      return {initialData,updateTime,notes};
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      return {};
    }
 
  };

  const fetchRoomData = async (currentCode, room) => {
    const  {initialData,updateTime,notes} = await roomData(currentCode, room);
    // setViewRoomData(initialData);
    return {initialData,updateTime,notes};
  };


  const generateInitialTimetableData = (fetchedData, type) => {
    const initialData = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  
    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        initialData[day][`period${period}`] = [];
  
        if (fetchedData[day] && fetchedData[day][`period${period}`]) {
          const slotData = fetchedData[day][`period${period}`];
          
          for (const slot of slotData) {
            const slotSubjects = [];
            let faculty = ''; // Declare faculty here
            let room='';
            for (const slotItem of slot) {
              const subj = slotItem.subject || '';
              if (type == 'room')
              {
                room = slotItem.sem || '';
              }
              else
              {
                room=slotItem.room ||'';
              }
              if (type == 'faculty')
              {
              faculty = slotItem.sem || '';
              }
              else
              {
              faculty = slotItem.faculty || '';
              } 
              // Only push the values if they are not empty
              if (subj || room || faculty) {
                slotSubjects.push({
                  subject: subj,
                  room: room,
                  faculty: faculty,
                });
              }
            }
  
            // Push an empty array if no data is available for this slot
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
          // Assign an empty array if day or period data is not available
          initialData[day][`period${period}`].push([]);
        }
      }
    }
    // console.log('intial',initialData);
    return initialData;
  };

//   fetchTimetableData(selectedSemester);
//   fetchFacultyData(viewFaculty);
//   fetchRoomData(viewRoom);


  const fetchSubjectData = async (currentCode) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`);
      const data = await response.json();
      setSubjectData(data);
      return data
      // console.log('subjectdata',data)
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
        // body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      const data = await response.json();
      // console.log('ttdata',data)
    setTTData(data);
      return data;
    //   
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
  };


  const fetchDeptFaculty = async (currentCode) => {
    try {
      const fetchedttdetails=await fetchTTData(currentCode);

      const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails[0].dept}`,{credentials: 'include',});
      if (response.ok) {
        const data = await response.json();
        // console.log('faculty response',data);
        setDeptFaculties(data);
        console.log('deptfaculties', data);
        return data;
      }
       
    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };




function generateSummary(timetableData, subjectData, type, headTitle){
  const summaryData = {};

  // Iterate through the timetable data to calculate the summary
  for (const day in timetableData) {
    for (let period = 1; period <= 8; period++) {
      const slots = timetableData[day][`period${period}`];

      // Check if the slot is not empty
      if (slots) {
        slots.forEach((slot) => {
          slot.forEach((cell) => {
            // Check if the cell contains data
            if (cell.subject) {
              const { subject, faculty, room } = cell;
              let foundSubject=''
              if(type == 'faculty'){
              foundSubject = subjectData.find(item => item.subName === subject && item.sem === faculty);
              }
              else if(type == 'room'){
                foundSubject = subjectData.find(item => item.subName === subject && item.sem === room);
                }
              else if(type == 'sem')
              {
              foundSubject = subjectData.find(item => item.subName === subject && item.sem === headTitle );
              }
              // Initialize or update the subject entry in the summaryData
              if (foundSubject) {
                if (!summaryData[subject]) {
                  summaryData[subject] = {
                    subCode: foundSubject.subCode,
                    count: 1,
                    faculties: [faculty],
                    subType: foundSubject.type,
                    rooms:[room],
                    subjectFullName: foundSubject.subjectFullName,
                    subSem:foundSubject.sem,
                  };
                  console.log('sum',summaryData[subject])
                } else {
                  summaryData[subject].count++;
                  if (!summaryData[subject].faculties.includes(faculty)) {
                    summaryData[subject].faculties.push(faculty);
                    // summaryData[subject].rooms.push(room);

                  }
                }
              }




              
            }
          });
        });
      }
    }
  }

// Create an object to store merged entries
const mergedSummaryData = {};

for (const key in summaryData) {
  const entry = summaryData[key];
  const subCode = entry.subCode;

  // Check if an entry with the same subCode already exists in the mergedSummaryData
  if (!mergedSummaryData[subCode]) {
    // If not, add the entry to the mergedSummaryData
    mergedSummaryData[subCode] = { ...entry, originalKeys: [key] };
  } else {
    // If an entry with the same subCode exists, check faculty and type before merging
    if (
      entry.faculties.every(faculty => mergedSummaryData[subCode].faculties.includes(faculty)) &&
      entry.subType === mergedSummaryData[subCode].subType
    ) {
      // Merge the data
      mergedSummaryData[subCode].count += entry.count;
      mergedSummaryData[subCode].faculties = [...new Set([...mergedSummaryData[subCode].faculties, ...entry.faculties])];
      mergedSummaryData[subCode].rooms = [...new Set([...mergedSummaryData[subCode].rooms, ...entry.rooms])];
      mergedSummaryData[subCode].originalKeys.push(key);
      // Add any other merging logic as needed
    } else {
      // If faculty or type is different, treat as a new entry
      mergedSummaryData[`${subCode}-${key}`] = { ...entry, originalKeys: [key] };
    }
  }
}

// Now, mergedSummaryData contains the merged entries with original keys
// console.log('merged data', mergedSummaryData);

const sortedSummaryEntries = Object.values(mergedSummaryData).sort((a, b) =>
  a.subCode.localeCompare(b.subCode)
);

  // console.log('summary dataaaa',summaryData)
  return sortedSummaryEntries;
}

// Function to fetch and store data for all available semesters sequentially
const fetchAndStoreTimetableDataForAllSemesters = async () => {
  const subjectData = await  fetchSubjectData(currentCode);
    setDownloadStatus("fetchingHeadersFooters")

    const fetchedttdetails=await fetchTTData(currentCode);


    
    // console.log('ttdetails', fetchedttdetails);
    // setTTData(fetchedttdetails);

    for (const semester of availableSems) {
      
      const {initialData,notes} = await fetchTimetableData(semester);

      const fetchedttdata = initialData;
      // console.log('semdddddd',initialData)
      const semNotes=notes;
      
      const summaryData = generateSummary(fetchedttdata, subjectData, 'sem', semester); 
      // console.log(summaryData)
      const lockTime= await fetchTime();

      const postData = {
        session: fetchedttdetails[0].session,
        name: semester,
        type: 'sem',
        timeTableData: fetchedttdata,
        summaryData: summaryData,
        updatedTime: lockTime,
        TTData:fetchedttdetails,
        headTitle: semester,
      };
      setPrepareStatus("preparingDownload")
      downloadPDF(fetchedttdata,summaryData,'sem',fetchedttdetails,lockTime,semester,semNotes);
      setStartStatus("downloadStarted")
      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(lockTime);
      setHeadTitle(semester);

      // Make a POST request to store the data in your schema
      // const postResponse = await fetch(`${apiUrl}/timetablemodule/lockfaculty`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(postData),
      //   credentials: 'include'
      // });
  
      // if (postResponse.ok) {
      //   console.log(`Timetable data for semester ${semester} stored successfully.`);
      // } else {
      //   console.error(`Error storing timetable data for semester ${semester}.`);
      // }
    }
      setCompleteStatus("downloadCompleted")    

  };

  const fetchAndStoreTimetableDataForAllFaculty = async () => {
    const subjectData = await  fetchSubjectData(currentCode);
      setDownloadStatus("fetchingHeadersFooters")
      
      const allFacultySummaries = [];
      const fetchedttdetails=await fetchTTData(currentCode);
  
  
      for (const faculty of availableFaculties) {
        // console.log(faculty);        
        const {initialData,updateTime,notes} = await fetchFacultyData( currentCode, faculty);
        const fetchedttdata= initialData;
        const facultyNotes=notes;
        // console.log('dataaaa faculty',fetchedttdata);        
        
        const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty',faculty); 
        allFacultySummaries.push({ faculty, summaryData }); // Store the summary data in the array

        // console.log(summaryData)
        const lockTime= updateTime;
        setHeaderStatus("fetchingHeadersFooters")
        const postData = {
          session: fetchedttdetails[0].session,
          name: faculty,
          type: 'faculty',
          timeTableData: fetchedttdata,
          summaryData: summaryData,
          updatedTime: lockTime,
          TTData:fetchedttdetails,
          headTitle: faculty,
        };
        // console.log(postData);
        // console.log('All Faculty Summaries:', allFacultySummaries);
        setNoteStatus("fetchingNotes")

        setDownloadStatus("preparingDownload")
        setPrepareStatus("preparingDownload")

        downloadPDF(fetchedttdata,summaryData,'faculty',fetchedttdetails,lockTime,faculty,facultyNotes);
        setDownloadStatus("downloadStarted")
        setStartStatus("downloadStarted")

        setTimetableData(fetchedttdata);
        setSummaryData(summaryData);
        setType(type);
        setUpdatedTime(lockTime);
        setHeadTitle(faculty);
  
      }
      setCompleteStatus("downloadCompleted")    
      // generateSummaryTablePDF(allFacultySummaries, fetchedttdetails[0].session, fetchedttdetails[0].dept)

    };
    
    const fetchAndStoreTimetableDataForAllRoom = async () => {
      const subjectData = await  fetchSubjectData(currentCode);
        setDownloadStatus("fetchingHeadersFooters")
        
    
        const fetchedttdetails=await fetchTTData(currentCode);
    
    
        for (const room of availableRooms) {
          // console.log('room', room);        
          const {initialData,updateTime,notes} = await fetchRoomData( currentCode, room);
          const fetchedttdata= initialData;
          const roomNotes=notes;
          // console.log('dataaaa room',fetchedttdata);        
          
          const summaryData = generateSummary(fetchedttdata, subjectData, 'room',room); 
          // console.log('room summary dara',summaryData)
          const lockTime= updateTime;
          setHeaderStatus("fetchingHeadersFooters")
          const postData = {
            session: fetchedttdetails[0].session,
            name: room,
            type: 'room',
            timeTableData: fetchedttdata,
            summaryData: summaryData,
            updatedTime: lockTime,
            TTData:fetchedttdetails,
            headTitle: room,
          };
          // console.log('posttt',postData);
          setNoteStatus("fetchingNotes")
  
          setDownloadStatus("preparingDownload")
          setPrepareStatus("preparingDownload")
  
          downloadPDF(fetchedttdata,summaryData,'room',fetchedttdetails,lockTime,room,roomNotes);
          setDownloadStatus("downloadStarted")
          setStartStatus("downloadStarted")
  
          setTimetableData(fetchedttdata);
          setSummaryData(summaryData);
          setType(type);
          setUpdatedTime(lockTime);
          setHeadTitle(room);
    
          // Make a POST request to store the data in your schema
          // const postResponse = await fetch(`${apiUrl}/timetablemodule/lockfaculty`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify(postData),
          //   credentials: 'include'
          // });
      
          // if (postResponse.ok) {
          //   console.log(`Timetable data for room ${room} stored successfully.`);
          // } else {
          //   console.error(`Error storing timetable data for room ${rooom}.`);
          // }
        }
        setCompleteStatus("downloadCompleted")    
  
      };


      // const fetchLoadAllocation = async () => {
      //   const subjectData = await  fetchSubjectData(currentCode);
      //     setDownloadStatus("fetchingHeadersFooters")
          
      //     const allFacultySummaries = [];
      //     const fetchedttdetails=await fetchTTData(currentCode);
      
      
      //     for (const faculty of availableFaculties) {
      //       console.log(faculty);        
      //       const {initialData,updateTime,notes} = await fetchFacultyData( currentCode, faculty);
      //       const fetchedttdata= initialData;
      //       const facultyNotes=notes;
      //       // console.log('dataaaa faculty',fetchedttdata);        
            
      //       const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty',faculty); 
      //       allFacultySummaries.push({ faculty, summaryData }); // Store the summary data in the array
    
      //       // console.log(summaryData)
      //       const lockTime= updateTime;
      //       setHeaderStatus("fetchingHeadersFooters")
      //       const postData = {
      //         session: fetchedttdetails[0].session,
      //         name: faculty,
      //         type: 'faculty',
      //         timeTableData: fetchedttdata,
      //         summaryData: summaryData,
      //         updatedTime: lockTime,
      //         TTData:fetchedttdetails,
      //         headTitle: faculty,
      //       };
      //       // console.log(postData);
      //       console.log('All Faculty Summaries:', allFacultySummaries);
      //       // setNoteStatus("fetchingNotes")
    
      //       setDownloadStatus("preparingDownload")
      //       setPrepareStatus("preparingDownload")
    
      //       // downloadPDF(fetchedttdata,summaryData,'faculty',fetchedttdetails,lockTime,faculty,facultyNotes);
      //       setDownloadStatus("downloadStarted")
      //       setStartStatus("downloadStarted")
    
      //       setTimetableData(fetchedttdata);
      //       setSummaryData(summaryData);
      //       setType(type);
      //       setUpdatedTime(lockTime);
      //       setHeadTitle(faculty);
      
      //     }
      //     setCompleteStatus("downloadCompleted")    
      //     generateSummaryTablePDF(allFacultySummaries, fetchedttdetails[0].session, fetchedttdetails[0].dept)
    
      //   };
        

        const fetchDeptLoadAllocation = async () => {
          const subjectData = await  fetchSubjectData(currentCode);
            setDownloadStatus("fetchingHeadersFooters")
            
            const allFacultySummaries = [];
            const fetchedttdetails=await fetchTTData(currentCode);
        
            const filteredFaculties = await fetchDeptFaculty(currentCode);
            const facultyNames = [];

            for (const faculty of filteredFaculties) {
              facultyNames.push(faculty.name);
              }
            for (const faculty of facultyNames) {
              // console.log(faculty);        
              const {initialData,updateTime,notes} = await fetchFacultyData( currentCode, faculty);
              const fetchedttdata= initialData;
              const facultyNotes=notes;
              // console.log('dataaaa faculty',fetchedttdata);        
              
              const summaryData = generateSummary(fetchedttdata, subjectData, 'faculty',faculty); 
              allFacultySummaries.push({ faculty, summaryData }); // Store the summary data in the array
      
              // console.log(summaryData)
              const lockTime= updateTime;
              setHeaderStatus("fetchingHeadersFooters")
              const postData = {
                session: fetchedttdetails[0].session,
                name: faculty,
                type: 'faculty',
                timeTableData: fetchedttdata,
                summaryData: summaryData,
                updatedTime: lockTime,
                TTData:fetchedttdetails,
                headTitle: faculty,
              };
              // console.log(postData);
              // console.log('All Faculty Summaries:', allFacultySummaries);
              // setNoteStatus("fetchingNotes")
      
              setDownloadStatus("preparingDownload")
              setPrepareStatus("preparingDownload")
      
              // downloadPDF(fetchedttdata,summaryData,'faculty',fetchedttdetails,lockTime,faculty,facultyNotes);
              setDownloadStatus("downloadStarted")
              setStartStatus("downloadStarted")
      
              setTimetableData(fetchedttdata);
              setSummaryData(summaryData);
              setType(type);
              setUpdatedTime(lockTime);
              setHeadTitle(faculty);
        
            }
            setCompleteStatus("downloadCompleted")    
            generateSummaryTablePDF(allFacultySummaries,deptFaculties, fetchedttdetails[0].session, fetchedttdetails[0].dept)
      
          };

  // Call the function to fetch and store data for all available semesters sequentially
//   fetchAndStoreTimetableDataForAllSemesters();


  const handleDownloadAllSemesters = () => {
    setSlotStatus(null);
    setSummaryStatus(null);
    setNoteStatus(null);
    setHeaderStatus(null);
    setPrepareStatus(null);
    setStartStatus(null);
    setCompleteStatus(null);
    setDownloadType('sem')
    setInitiateStatus('starting')
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
    setDownloadType('faculty')
    setInitiateStatus('starting')
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
        setDownloadType('room')
        setInitiateStatus('starting')
            fetchAndStoreTimetableDataForAllRoom();
          };
        
    

          // const handleDownloadLoadDistribution = () => {
          //   setSlotStatus(null);
          //   setSummaryStatus(null);
          //   setNoteStatus(null);
          //   setHeaderStatus(null);
          //   setPrepareStatus(null);
          //   setStartStatus(null);
          //   setCompleteStatus(null);
          //   setDownloadType('load')
          //   setInitiateStatus('starting')
          //       fetchLoadAllocation();
          //     };
            
              const handleDownloadDeptLoadDistribution = () => {
                setSlotStatus(null);
                setSummaryStatus(null);
                setNoteStatus(null);
                setHeaderStatus(null);
                setPrepareStatus(null);
                setStartStatus(null);
                setCompleteStatus(null);
                setDownloadType('Dload')
                setInitiateStatus('starting')
                    fetchDeptLoadAllocation();
                  };
            
          return (
            <div>
              {/* Your other components and UI elements */}
              <Container maxW='4xl'>

              {/* <Heading>XCEED Express Download </Heading> */}
              <Header title="XCEED Express Download"></Header>
              <Button
                onClick={handleDownloadAllSemesters}
                colorScheme="teal"
                variant="solid"
              >
                Download All Semesters
              </Button>
          
 {/* Render the messages again for the second button */}
              <div className="message">
                {downloadStatus === 'fetchingSemesters' && (
                  <p>
                    {availableFaculties ? `No of Semesters data available: ${availableSems.length}` : 'No semester available'}
                  </p>
                )}
                {downloadType ==='sem' && 
                initiateStatus === 'starting' && (
                  <p className={initiateStatus === 'starting' ? 'bold-message' : ''}>
                    Initiating download. It may take while! Sit back and relax!
                  </p>
                )}

                  {downloadType ==='sem' &&
                slotStatus === 'fetchingSlotData' && (
                  <p className={slotStatus === 'fetchingSlotData' ? 'bold-message' : ''}>
                    Fetching slot data...
                  </p>
                )}

                {downloadType ==='sem' &&
                summaryStatus === 'fetchingSummaryData' && (
                  <p className={summaryStatus === 'fetchingSummaryData' ? 'bold-message' : ''}>
                    Fetching summary data...
                  </p>
                )}
                {downloadType ==='sem' &&
                noteStatus === 'fetchingNotes' && (
                  <p className={noteStatus === 'fetchingNotes' ? 'bold-message' : ''}>
                    Fetching notes...
                  </p>
                )}
                {downloadType ==='sem' &&
                headerStatus === 'fetchingHeadersFooters' && (
                  <p className={headerStatus === 'fetchingHeadersFooters' ? 'bold-message' : ''}>
                    Fetching headers and footers...
                  </p>
                )}
                {downloadType ==='sem' &&
                prepareStatus === 'preparingDownload' && (
                  <p className={prepareStatus === 'preparingDownload' ? 'bold-message' : ''}>
                    Preparing download...
                  </p>
                )}
                {downloadType ==='sem' &&
                startStatus === 'downloadStarted' && (
                  <p className={startStatus === 'downloadStarted' ? 'bold-message' : ''}>
                    Download in progress. Check downloads folder
                  </p>
                )}
                {downloadType ==='sem' &&
                 completeStatus === 'downloadCompleted' && (
  <p style={{ fontWeight: 'bold', color: 'green' }}>
    Download Completed.
  </p>
)}
              </div>
          
              <Button
                onClick={handleDownloadAllFaculty}
                colorScheme="teal"
                variant="solid"
              >
                Download All Fauculty Time Table
              </Button>
          
              {/* Render the messages again for the second button */}
              <div className="message">
                {downloadStatus === 'fetchingSemesters' && (
                  <p>
                    {availableFaculties ? `No of Faculty: ${availableFaculties.length}` : 'No faculty available'}
                  </p>
                )}
                {downloadType ==='faculty' && 
                initiateStatus === 'starting' && (
                  <p className={initiateStatus === 'starting' ? 'bold-message' : ''}>
                    Initiating download. It may take while! Sit back and relax!
                  </p>
                )}

                  {downloadType ==='faculty' &&
                slotStatus === 'fetchingSlotData' && (
                  <p className={slotStatus === 'fetchingSlotData' ? 'bold-message' : ''}>
                    Fetching slot data...
                  </p>
                )}

                {downloadType ==='faculty' &&
                summaryStatus === 'fetchingSummaryData' && (
                  <p className={summaryStatus === 'fetchingSummaryData' ? 'bold-message' : ''}>
                    Fetching summary data...
                  </p>
                )}
                {downloadType ==='faculty' &&
                noteStatus === 'fetchingNotes' && (
                  <p className={noteStatus === 'fetchingNotes' ? 'bold-message' : ''}>
                    Fetching notes...
                  </p>
                )}
                {downloadType ==='faculty' &&
                headerStatus === 'fetchingHeadersFooters' && (
                  <p className={headerStatus === 'fetchingHeadersFooters' ? 'bold-message' : ''}>
                    Fetching headers and footers...
                  </p>
                )}
                {downloadType ==='faculty' &&
                prepareStatus === 'preparingDownload' && (
                  <p className={prepareStatus === 'preparingDownload' ? 'bold-message' : ''}>
                    Preparing download...
                  </p>
                )}
                {downloadType ==='faculty' &&
                startStatus === 'downloadStarted' && (
                  <p className={startStatus === 'downloadStarted' ? 'bold-message' : ''}>
                    Download in progress. Check downloads folder
                  </p>
                )}
                {downloadType ==='faculty' &&
                 completeStatus === 'downloadCompleted' && (
  <p style={{ fontWeight: 'bold', color: 'green' }}>
    Download Completed.
  </p>
)}

                 
                 
              </div>
  
              <Button
                onClick={handleDownloadAllRoom}
                colorScheme="teal"
                variant="solid"
              >
                Download All Room Time Table
              </Button>
          
              {/* Render the messages again for the second button */}
              <div className="message">
                {downloadStatus === 'fetchingSemesters' && (
                  <p>
                    {availableFaculties ? `No of Rooms: ${availableRooms.length}` : 'No Room available'}
                  </p>
                )}
                {downloadType ==='room' && 
                initiateStatus === 'starting' && (
                  <p className={initiateStatus === 'starting' ? 'bold-message' : ''}>
                    Initiating download. It may take while! Sit back and relax!
                  </p>
                )}

                  {downloadType ==='room' &&
                slotStatus === 'fetchingSlotData' && (
                  <p className={slotStatus === 'fetchingSlotData' ? 'bold-message' : ''}>
                    Fetching slot data...
                  </p>
                )}

                {downloadType ==='room' &&
                summaryStatus === 'fetchingSummaryData' && (
                  <p className={summaryStatus === 'fetchingSummaryData' ? 'bold-message' : ''}>
                    Fetching summary data...
                  </p>
                )}
                {downloadType ==='room' &&
                noteStatus === 'fetchingNotes' && (
                  <p className={noteStatus === 'fetchingNotes' ? 'bold-message' : ''}>
                    Fetching notes...
                  </p>
                )}
                {downloadType ==='room' &&
                headerStatus === 'fetchingHeadersFooters' && (
                  <p className={headerStatus === 'fetchingHeadersFooters' ? 'bold-message' : ''}>
                    Fetching headers and footers...
                  </p>
                )}
                {downloadType ==='room' &&
                prepareStatus === 'preparingDownload' && (
                  <p className={prepareStatus === 'preparingDownload' ? 'bold-message' : ''}>
                    Preparing download...
                  </p>
                )}
                {downloadType ==='room' &&
                startStatus === 'downloadStarted' && (
                  <p className={startStatus === 'downloadStarted' ? 'bold-message' : ''}>
                    Download in progress. Check downloads folder
                  </p>
                )}
                {downloadType ==='room' &&
                 completeStatus === 'downloadCompleted' && (
  <p style={{ fontWeight: 'bold', color: 'green' }}>
    Download Completed.
  </p>
)}

                
</div>

  

<Button
    onClick={handleDownloadDeptLoadDistribution}
    colorScheme="teal"
    variant="solid"
  >
    Download Department Load Allocation
  </Button>


  {/* Render the messages again for the second button */}
  <div className="message">
    {downloadStatus === 'fetchingSemesters' && (
      <p>
        {availableFaculties ? `No of Faculties: ${availableFaculties.length}` : 'No Faculty available'}
      </p>
    )}
    {downloadType ==='load' && 
    initiateStatus === 'starting' && (
      <p className={initiateStatus === 'starting' ? 'bold-message' : ''}>
        Initiating download. It may take while! Sit back and relax!
      </p>
    )}

      {downloadType ==='load' &&
    slotStatus === 'fetchingSlotData' && (
      <p className={slotStatus === 'fetchingSlotData' ? 'bold-message' : ''}>
        Fetching slot data...
      </p>
    )}

    {downloadType ==='load' &&
    summaryStatus === 'fetchingSummaryData' && (
      <p className={summaryStatus === 'fetchingSummaryData' ? 'bold-message' : ''}>
        Fetching summary data...
      </p>
    )}
    {downloadType ==='load' &&
    noteStatus === 'fetchingNotes' && (
      <p className={noteStatus === 'fetchingNotes' ? 'bold-message' : ''}>
        Fetching notes...
      </p>
    )}
    {downloadType ==='load' &&
    headerStatus === 'fetchingHeadersFooters' && (
      <p className={headerStatus === 'fetchingHeadersFooters' ? 'bold-message' : ''}>
        Fetching headers and footers...
      </p>
    )}
    {downloadType ==='load' &&
    prepareStatus === 'preparingDownload' && (
      <p className={prepareStatus === 'preparingDownload' ? 'bold-message' : ''}>
        Preparing download...
      </p>
    )}
    {downloadType ==='load' &&
    startStatus === 'downloadStarted' && (
      <p className={startStatus === 'downloadStarted' ? 'bold-message' : ''}>
        Download in progress!! Last few miles to go!
      </p>
    )}
    {downloadType ==='load' &&
     completeStatus === 'downloadCompleted' && (
<p style={{ fontWeight: 'bold', color: 'green' }}>
Download Completed.
</p>
)}
</div>

 
              </Container>
            
            </div>
            
          );
          
  
};

export default PrintSummary;

