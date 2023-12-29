import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import ViewTimetable from './viewtt';
import TimetableSummary from './ttsummary';
import './Timetable.css'
import { Container } from "@chakra-ui/layout";
import { Heading } from '@chakra-ui/react';
import {CustomTh, CustomLink, CustomBlueButton, CustomPlusButton, CustomDeleteButton} from '../styles/customStyles'
import { Box, Text, Portal, ChakraProvider } from "@chakra-ui/react";

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
import Header from '../components/header';


// import PDFViewTimetable from '../filedownload/chakrapdf'

function LoadDistribution() {
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage]=useState();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  
  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [lockedTime, setLockedTime] = useState();
  const [facultyLockedTime,setFacultyLockedTime]=useState();
  const [roomlockedTime,setRoomLockedTime]=useState();


  const semesters=availableSems;
  
  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/lock/lockfacultytt/${currentCode}/${faculty}`,{credentials: 'include',});
        const data1 = await response.json();
        const data=data1.timetableData;
        setFacultyLockedTime(data1.updatedTime);
        // console.log(data)
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


    fetchFacultyData(selectedFaculty);
  }, [selectedFaculty]);

  
  useEffect(() => {
        
  
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

    const fetchTime = async () => {
      try {
        // console.log('sem value',semester);
        // console.log('current code', currentCode);
        const response = await fetch(`${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,{credentials: 'include',});
        const data = await response.json();
        setLockedTime(data.updatedTime.lockTimeIST)
        // setSavedTime( data.updatedTime.saveTimeIST)
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        }
    };

    fetchTime();
    fetchFaculty(currentCode); // Call the function to fetch subject data
  }, [apiUrl,currentCode,selectedSemester, selectedFaculty,selectedRoom]);


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

// const navigate = useNavigate();

function calculateOccupiedSlots(schedule) {
    const subjectSlots = {};
    let totalHours = 0;
    let facultyTotalHours = 0; // New variable to track faculty's total hours
  
    for (const day in schedule) {
      const dayData = schedule[day];
  
      for (const period in dayData) {
        const subjects = dayData[period];
  
        subjects.forEach((subject) => {
          if (!subjectSlots[subject]) {
            subjectSlots[subject] = 0;
          }
  
          subjectSlots[subject]++;
          totalHours++;
          facultyTotalHours++; // Increment faculty's total hours for each subject
        });
      }
    }
  
    return { subjectSlots, totalHours, facultyTotalHours };
  }  // Example usage with a faculty schedule  


const hoursCalculation = calculateOccupiedSlots(viewFacultyData)
console.log(hoursCalculation)

  return (
    <div>
      <Header title="Load distribution Summary"></Header>
      {/* <Button onClick={handleDownloadClick}>Download Timetable</Button> */}
      <h2>Semester timetable (locked)</h2>
      <select
        value={selectedSemester}
        onChange={(e) => setSelectedSemester(e.target.value)}
      >
        <option value="">Select Semester</option>
        {semesters.map((semester, index) => (
          <option key={index} value={semester}>
            {semester}
          </option>
        ))}
      </select>
      <div>
  {selectedSemester ? (
    <div>
      <Text fontSize="xl" color="blue" id="saveTime">
         Last saved on: {lockedTime ? lockedTime: 'Not saved yet'}
        </Text>
      <ViewTimetable timetableData={viewData} />     
      <TimetableSummary timetableData={viewData} type={'sem'} code={currentCode} time={lockedTime} headTitle={selectedSemester}/> 

    </div>

    
  ) : (
    <p>Please select a Semester from the dropdown.</p>
  )}
</div>
      {/* Faculty Dropdown */}
      <h2>Faculty timetable (locked)</h2>
      <select
        value={selectedFaculty}
        onChange={(e) => setSelectedFaculty(e.target.value)}
      >
        <option value="">Select Faculty</option>
        {availableFaculties.map((faculty, index) => (
          <option key={index} value={faculty}>
            {faculty}
          </option>
        ))}
      </select>
      <div>
  {selectedFaculty ? (<div>
    <Text fontSize="xl" color="blue" id="saveTime">
         Last saved on: {facultyLockedTime ? facultyLockedTime: 'Not saved yet'}
        </Text>

    <ViewTimetable timetableData={viewFacultyData} />
<TimetableSummary timetableData={viewFacultyData} type={'faculty'} code={currentCode} time={facultyLockedTime} headTitle={selectedFaculty}/> 
{/* <CustomBlueButton onClick={() => generatePDF(viewFacultyData)}>Generate PDF</CustomBlueButton> */}
{/* <PDFViewTimetable timetableData={viewFacultyData} /> */}
{/* <TimetableSummary timetableData={viewFacultyData} type={'faculty'}/>  */}
</div>
    ) : (
    <p>Please select a faculty from the dropdown.</p>
  )}
</div> 
      <h2>Room timetable (locked)</h2>
      {/* Room Dropdown */}
      <select
        value={selectedRoom}
        onChange={(e) => setSelectedRoom(e.target.value)}
      >
        <option value="">Select Room</option>
        {availableRooms.map((room, index) => (
          <option key={index} value={room}>
            {room}
          </option>
        ))}
      </select>
      <div>
  {selectedRoom ? (
    <div>
            <Text fontSize="xl" color="blue" id="saveTime">
         Last saved on: {roomlockedTime ? roomlockedTime: 'Not saved yet'}
        </Text>

    <ViewTimetable timetableData={viewRoomData} />
{/* <TimetableSummary timetableData={viewFacultyData} type={'faculty'} code={currentCode}/>  */}

{/* <TimetableSummary timetableData={viewRoomData} type={'room'} />  */}
    
    </div>
  ) : (
    <p>Please select a Room from the dropdown.</p>
  )}
</div>

</div>
  );
}

export default LoadDistribution;