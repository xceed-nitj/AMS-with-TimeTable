import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import ViewTimetable from './viewtt';
import TimetableSummary from './ttsummary';

function LockedSummary() {
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage]=useState();
  const [selectedSemester, setSelectedSemester] = useState('B.Sc (2 sem)');
  const [selectedFaculty, setSelectedFaculty] = useState('Dr. Kiran Singh');
  const [selectedRoom, setSelectedRoom] = useState('L-201');
  
  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  // // Define your options for semesters, faculty, and rooms
  // const availableRooms = ['L-201', 'L-209','room1','room2'];
  // const availableFaculties = ['Dr. Vinod Ashokan','Dr. Harleen Dahiya','Dr. Abhinav Pratap Singh','Professor Arvinder Singh',
  //   'Dr. Praveen Malik','Dr. Rohit Mehra','Dr. Arvind Kumar','Dr. Kiran Singh','Dr. H. M. Mittal','Dr. Suneel Dutt', 'f1','f2',];
  // const semesters=['B.Sc (2 sem)','B.Sc (4 sem)','M.Sc (2 sem)','M.Sc (4 sem)','d-sem1','d-sem2']

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
 
    const fetchViewData = async (semester) => {
      const data = await fetchData(semester);
      setViewData(data);
    };
    fetchViewData(selectedSemester);
  }, [selectedSemester]);

  useEffect(() => {
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/lock/lockfacultytt/${currentCode}/${faculty}`);
        const data = await response.json();
        console.log('facultydata',data);
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

    const fetchRoomData = async (room) => {
      const data = await roomData(currentCode, room);
      setViewRoomData(data);
    };

    fetchRoomData(selectedRoom);
  }, [selectedRoom]);




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

    const fetchFaculty = async (currentCode) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addfaculty/all?code=${currentCode}`);
        if (response.ok) {
          const data = await response.json();
          console.log('faculty response',data);
          setAvailableFaculties(data);
          console.log('faculties', availableFaculties);
        }
         
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };


    fetchSem();
    fetchRoom();
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
    console.log(initialData);
    return initialData;
  };


  return (
    <div>
      <h1>Locked TimeTable Summary</h1>
      {/* <button onClick={}>Upload CSV</button> */}


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
      <ViewTimetable timetableData={viewData} />     
<TimetableSummary timetableData={viewData} /> 
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
    <ViewTimetable timetableData={viewFacultyData} />
<TimetableSummary timetableData={viewFacultyData} type={'faculty'}/> 
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
    <ViewTimetable timetableData={viewRoomData} />
<TimetableSummary timetableData={viewRoomData} type={'room'} /> 
    
    </div>
  ) : (
    <p>Please select a Room from the dropdown.</p>
  )}
</div>

</div>
  );
}

export default LockedSummary;