import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import ViewTimetable from './viewtt';
import Header from './header';
import './lockedsummary.css'

function LockedSummary() {
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage]=useState();
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  
  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];
  // const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const semesters=availableSems;

  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/lock/lockclasstt/${currentCode}/${semester}`);
        const data = await response.json();
        console.log(data);
        const initialData = generateInitialTimetableData(data,'sem');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/lock/lockfacultytt/${currentCode}/${faculty }`);
        const data = await response.json();
        console.log(data);
        const initialData = generateInitialTimetableData(data,'faculty');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };
    const roomData = async (currentCode, room) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/lock/lockroomtt/${currentCode}/${room }`);
        const data = await response.json();
        console.log('roomdata',data);
        const initialData = generateInitialTimetableData(data,'room');
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

    const fetchFacultyData = async (faculty) => {
      const data = await facultyData(currentCode, faculty);
      setViewFacultyData(data);
    };

    const fetchRoomData = async (room) => {
      const data = await roomData(currentCode, room);
      setViewRoomData(data);
    };


    fetchViewData(selectedSemester);
    fetchFacultyData(selectedFaculty);
    fetchRoomData(selectedRoom);
  }, [selectedSemester, currentCode, selectedFaculty, selectedRoom]);

  useEffect(() => {
    const fetchSem = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`);
        if (response.ok) {
          const data = await response.json();
          console.log('filtered data',data)
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);

          setAvailableSems(semValues);
          console.log('available semesters',availableSems)
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchRoom = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addroom?code=${currentCode}`);
        if (response.ok) {
          const data = await response.json();
          const filteredSems = data.filter((room) => room.code === currentCode);
          const semValues = filteredSems.map((room) => room.room);

          setAvailableRooms(semValues);
          console.log('available rooms',availableRooms)
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    const fetchFaculty = async (currentCode,selectedSemester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addfaculty/filteredfaculty/${currentCode}/${selectedSemester}`);
        if (response.ok) {
          const data = await response.json();
          console.log('faculty response',data[0]);
          setAvailableFaculties(data[0].faculty);
          console.log('faculties', availableFaculties);
        }
         
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    fetchSem();
    fetchRoom();
    fetchFaculty(currentCode,selectedSemester); // Call the function to fetch subject data
  }, [apiUrl,currentCode,selectedSemester]);

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
    console.log(initialData);
    return initialData;
  };


  return (
    <div class="lockedsum-container">
        <h1 class="lockedsum-page-title">Summary</h1>

        <h2 class="lockedsum-section-title">Select semester</h2>
        <select class="lockedsum-form-select" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="">Select Semester</option>
            {semesters.map((semester, index) => (
                <option key={index} value={semester}>
                    {semester}
                </option>
            ))}
        </select>

        <div class="lockedsum-table-container">
            <Header />
            <ViewTimetable class="lockedsum-table" timetableData={viewData} />
        </div>

        <h2 class="lockedsum-section-title">Faculty Dropdown</h2>
        <select class="lockedsum-form-select" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
            <option value="">Select Faculty</option>
            {availableFaculties.map((faculty, index) => (
                <option key={index} value={faculty}>
                    {faculty}
                </option>
            ))}
        </select>

        <div class="lockedsum-table-container">
            <ViewTimetable class="lockedsum-table" timetableData={viewFacultyData} />
        </div>

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
      <ViewTimetable timetableData={viewRoomData} />     
      </div>

</div>
  );
}

export default LockedSummary;
