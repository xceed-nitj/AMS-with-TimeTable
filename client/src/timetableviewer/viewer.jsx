import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import ViewTimetable from '../timetableadmin/viewtt';
import headernitj from '../assets/nitjheader.svg';
import footerxceed from '../assets/xceedfooter.svg';

// import Header from './header';

function LockedView() {
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage]=useState();
  const [selectedSemester, setSelectedSemester] = useState('B.Sc (2 sem)');
  const [selectedFaculty, setSelectedFaculty] = useState('Dr. Kiran Singh');
  const [selectedSession, setSelectedSession] = useState('ff');
  const [selectedDept, setSelectedDept] = useState('2023');

  const [selectedRoom, setSelectedRoom] = useState('L-201');
  
  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  // Define your options for semesters, faculty, and rooms
//   const availableRooms = ['L-201', 'L-209','room1','room2'];
  const availableFaculties = ['Dr. Vinod Ashokan','Dr. Harleen Dahiya','Dr. Abhinav Pratap Singh','Professor Arvinder Singh',
    'Dr. Praveen Malik','Dr. Rohit Mehra','Dr. Arvind Kumar','Dr. Kiran Singh','Dr. H. M. Mittal','Dr. Suneel Dutt', 'f1','f2',];
//   const semesters=['B.Sc (2 sem)','B.Sc (4 sem)','M.Sc (2 sem)','M.Sc (4 sem)','d-sem1','d-sem2']
    const availableSession=['ff']
    const availableDept=['2023','2024','ee']


  useEffect(() => {
    // const fetchData = async (session, degree, dept, sem) => {
    //   try {
    //     const response = await fetch(`${apiUrl}/timetablemodule/lock/viewfaculty/${session}/${degree}/${dept}/${sem}`);
    //     const data = await response.json();
    //     console.log(data);
    //     const initialData = generateInitialTimetableData(data,'sem');
    //     return initialData;
    //   } catch (error) {
    //     console.error('Error fetching existing timetable data:', error);
    //     return {};
    //   }
    // };
    const facultyData = async (session, faculty) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/lock/viewfaculty/${session}/${faculty}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
    
        const data = await response.json();
        console.log(data);
        const initialData = generateInitialTimetableData(data,'faculty');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };
    // const roomData = async (currentCode, room) => {
    //   try {
    //     const response = await fetch(`${apiUrl}/timetablemodule/lock/lockroomtt/${currentCode}/${room }`);
    //     const data = await response.json();
    //     console.log('roomdata',data);
    //     const initialData = generateInitialTimetableData(data,'room');
    //     return initialData;
    //   } catch (error) {
    //     console.error('Error fetching existing timetable data:', error);
    //     return {};
    //   }
    // };
 
    // const fetchViewData = async (session, degree, dept, sem) => {
    //   const data = await fetchData(session, degree, dept, sem);
    //   setViewData(data);
    // };

    const fetchFacultyData = async (session,faculty) => {
      const data = await facultyData(session, faculty);
      setViewFacultyData(data);
    };

    // const fetchRoomData = async (room) => {
    //   const data = await roomData(currentCode, room);
    //   setViewRoomData(data);
    // };


    // fetchViewData(selectedSemester);
    fetchFacultyData(selectedSession, selectedFaculty);
    // fetchRoomData(selectedRoom);
  }, [selectedSemester, selectedFaculty]);


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
      <h1>View Timetable</h1>
      {/* <button onClick={}>Upload CSV</button> */}


      {/* <h2>Select semester</h2>
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
      <Header />
      <ViewTimetable timetableData={viewData} />     
      </div> */}
      {/* Faculty Dropdown */}
      <select
        value={selectedDept}
        onChange={(e) => setSelectedDept(e.target.value)}
      >
        <option value="">Select Dept</option>
        {availableDept.map((dept, index) => (
          <option key={index} value={dept}>
            {dept}
          </option>
        ))}
      </select>
      select session
      <select
        value={selectedSession}
        onChange={(e) => setSelectedSession(e.target.value)}
      >
        <option value="">Select Session</option>
        {availableSession.map((session, index) => (
          <option key={index} value={session}>
            {session}
          </option>
        ))}
      </select>
 

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
      <div style={{margin: 0, padding:60}}>
      <img src={headernitj} alt="SVG Description" style={{ width: '1200px', height:'400px', display:'block' }} />
      </div>
      <div>
      <ViewTimetable timetableData={viewFacultyData} />     
      </div>
      <img src={footerxceed} alt="SVG Description" style={{ width: '1200px', height:'500px' }} />
     
      {/* Room Dropdown */}
      {/* <select
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
      </div> */}

</div>
  );
}

export default LockedView;
