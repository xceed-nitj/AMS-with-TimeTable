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


const PrintSummary = () => {

// Initialize as an empty array
const [TTData, setTTData] = useState([]); // Initialize as an empty array
const [timetableData, setTimetableData] = useState({});
const [summaryData, setSummaryData] = useState({});
const [type, setType] = useState(''); 
const [updatedTime, setUpdatedTime] = useState(''); 
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
  
      const fetchFaculty = async (currentCode) => {
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
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`,{credentials: 'include'});
      const data = await response.json();
      // console.log(data);
      const initialData = generateInitialTimetableData(data,'sem');
      return initialData;
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
      setLockedTime(data.updatedTime.lockTimeIST)
      setSavedTime( data.updatedTime.saveTimeIST)
    } catch (error) {
      console.error('Error fetching existing timetable data:', error);
      }
  };


  const fetchTimetableData = async (semester) => {
    const data = await fetchData(semester);
    await fetchTime();
    setTimetableData(data);
    return(data);
    
};


//fetching faculty data 
  const facultyData = async (currentCode, faculty) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty }`,{credentials: 'include'});
      const data1 = await response.json();
      const data=data1.timetableData;
      setFacultyUpdateTime(data1.updatedTime);
      const initialData = generateInitialTimetableData(data,'faculty');
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

// fetching room data

const roomData = async (currentCode, room) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room }`,{credentials: 'include'});
      const data1 = await response.json();
      const data=data1.timetableData;
      setRoomUpdateTime(data1.updatedTime);
      const initialData = generateInitialTimetableData(data,'room');
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
    // console.log(initialData);
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
      console.log('ttdata',data)
    //   setTTData(data);
      return data;
    //   
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
  };



function generateSummary(timetableData, type){

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
              else
              {
              foundSubject = subjectData.find(item => item.subName === subject);
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
return summaryData;
}


  
// Function to fetch and store data for all available semesters sequentially
const fetchAndStoreTimetableDataForAllSemesters = async () => {
    fetchSubjectData(currentCode);
    const fetchedttdetails=await fetchTTData(currentCode);
    console.log('ttdetails', fetchedttdetails);
    // setTTData(fetchedttdetails);

    for (const semester of availableSems) {
      const fetchedttdata = await fetchTimetableData(semester);
      const summaryData = generateSummary(fetchedttdata,'sem');
      const time = {lockedTime}; 
      const postData = {
        session: fetchedttdetails[0].session,
        name: semester,
        type: 'sem',
        timeTableData: fetchedttdata,
        summaryData: summaryData,
        updatedTime: time.lockedTime,
        TTData:fetchedttdetails,
        headTitle: semester,
      };

      downloadPDF(fetchedttdata,summaryData,'sem',fetchedttdetails,lockedTime,semester);

      setTimetableData(fetchedttdata);
      setSummaryData(summaryData);
      setType(type);
      setUpdatedTime(time);
      setHeadTitle(semester);

      // Make a POST request to store the data in your schema
      const postResponse = await fetch(`${apiUrl}/timetablemodule/lockfaculty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        credentials: 'include'
      });
  
      if (postResponse.ok) {
        console.log(`Timetable data for semester ${semester} stored successfully.`);
      } else {
        console.error(`Error storing timetable data for semester ${semester}.`);
      }
    }
  };
  
  // Call the function to fetch and store data for all available semesters sequentially
//   fetchAndStoreTimetableDataForAllSemesters();


  const handleDownloadAllSemesters = () => {
    fetchAndStoreTimetableDataForAllSemesters();
      };

  return (
    <div>
      {/* Your other components and UI elements */}
      <Button
        onClick={handleDownloadAllSemesters}
        colorScheme="teal"
        variant="solid"
      >
        Download All Semesters
{/* pdfMake.createPdf(documentDefinition).download(`${headTitle}_timetable.pdf`);     */}
      </Button>
{/* <PDFDownloader timetableData={timetableData} summaryData={summaryData} type={type} Tdata={TTData} updatedTime={updatedTime} headTitle={headTitle}/> */}
{/* <PDFGenerator timetableData={timetableData} summaryData={summaryData} type={type} ttdata={TTData} updatedTime={updatedTime.lockedTime} headTitle={headTitle}/> */}

    </div>
  );


  
};

export default PrintSummary;

