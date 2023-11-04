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
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [selectedRoom, setSelectedRoom] = useState('');
  
  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];


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
        // console.log(data);
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
  }, [selectedSession, selectedFaculty]);


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


  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);


  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/allotment/session`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          console.error("Failed to fetch sessions");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          console.error("Failed to fetch departments");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchSessions();
    fetchDepartments();

  }, []);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const handleResponse = (response) => {
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  };
  const handleError = (error) => {
    console.error("Error:", error);
  };

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`${apiUrl}/timetablemodule/faculty/dept/${selectedDepartment}`,{credentials: 'include',})
        .then(handleResponse)
        .then((data) => {
          setFaculties(data);
        })
        .catch(handleError);
    }
  }, [selectedDepartment]);



  return (
    <div>

      <h1>View Timetable</h1>
      select session
      <select
        value={selectedSession}
        onChange={(e) => setSelectedSession(e.target.value)}
      >
        <option value="">Select Session</option>
        {sessions.map((session, index) => (
          <option key={index} value={session}>
            {session}
          </option>
        ))}
      </select>


      <select
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
      >
        <option value="">Select Dept</option>
        {departments.map((dept, index) => (
          <option key={index} value={dept}>
            {dept}
          </option>
        ))}
      </select>
      <select
        value={selectedFaculty}
        onChange={(e) => setSelectedFaculty(e.target.value)}
      >
 <option value="" key="default">
              Select a Faculty
            </option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.name}>
                {faculty.name}
              </option>        ))}
      </select>
    
</div>
  );
}

export default LockedView;
