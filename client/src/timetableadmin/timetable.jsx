import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';
import './Timetable.css';
import TimetableSummary from './ttsummary';


const Timetable = () => {
  const [timetableData, setTimetableData] = useState({});
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});
  const [message, setMessage]=useState();
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableSems, setAvailableSems] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState('');

  // const availableRooms = ['L-201', 'L-209','room1','room2'];
  // const availableFaculties = ['Dr. Vinod Ashokan','Dr. Harleen Dahiya','Dr. Abhinav Pratap Singh','Professor Arvinder Singh',
    // 'Dr. Praveen Malik','Dr. Rohit Mehra','Dr. Arvind Kumar','Dr. Kiran Singh','Dr. H. M. Mittal','Dr. Suneel Dutt', 'f1','f2',];
  const semesters=availableSems;
  const [selectedSemester, setSelectedSemester] = useState('1'); 
  const [viewselectedSemester, setViewSelectedSemester] = useState(availableSems[0]); 
  const [viewFaculty, setViewFaculty]= useState('')  
  const [viewRoom, setViewRoom]= useState('')  
  
  const selectedCell = null;
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 1];
  // console.log('Code:', code);
  const apiUrl=getEnvironment();

  useEffect(() => {
    const fetchData = async (semester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewclasstt/${currentCode}/${semester}`);
        const data = await response.json();
        // console.log(data);
        const initialData = generateInitialTimetableData(data,'sem');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };
    const facultyData = async (currentCode, faculty) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty }`);
        const data = await response.json();
        // console.log(data);
        const initialData = generateInitialTimetableData(data,'faculty');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
    };
    const roomData = async (currentCode, room) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room }`);
        const data = await response.json();
        // console.log('roomdata',data);
        const initialData = generateInitialTimetableData(data,'room');
        return initialData;
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
        return {};
      }
   
    };
 
    const fetchTimetableData = async (semester) => {
      const data = await fetchData(semester);
      setTimetableData(data);
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

    fetchTimetableData(selectedSemester);
    fetchViewData(viewselectedSemester);
    fetchFacultyData(viewFaculty);
    fetchRoomData(viewRoom);
    
  }, [selectedSemester, viewselectedSemester, currentCode, viewFaculty, viewRoom]);

  useEffect(() => {
    // Fetch subject data from the database and populate availableSubjects
    const fetchSubjects = async (currentCode,selectedSemester) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/filteredsubject/${currentCode}/${selectedSemester}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSubjects(data);
          // console.log('subjects', availableSubjects);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };
    
    
    const fetchSem = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/addsem?code=${currentCode}`);
        if (response.ok) {
          const data = await response.json();
          // console.log('filtered data',data)
          const filteredSems = data.filter((sem) => sem.code === currentCode);
          const semValues = filteredSems.map((sem) => sem.sem);

          setAvailableSems(semValues);
          // console.log('available semesters',availableSems)
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
          // console.log('available rooms',availableRooms)
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
          // console.log('faculty response',data[0]);
          setAvailableFaculties(data[0].faculty);
          // console.log('faculties', availableFaculties);
        }
         
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };


    fetchSubjects(currentCode,selectedSemester);
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
    // console.log(initialData);
    return initialData;
  };
  
  useEffect(() => {
    // console.log('Updated timetableData:', timetableData);
  }, [timetableData]);


  const handleCellChange = (day, period, slotIndex, cellIndex, type, event) => {
    const newValue = event.target.value;
  
    // Create a copy of the current state to update
    const updatedData = { ...timetableData };
  
    // Ensure that the slot and cell exist before updating
    if (updatedData[day] && updatedData[day][`period${period}`] && updatedData[day][`period${period}`][slotIndex]) {
      updatedData[day][`period${period}`][slotIndex][cellIndex][type] = newValue;
    
      saveSlotData(day, `period${period}`, updatedData[day][`period${period}`][slotIndex]);    }
  

    // Update the state with the modified data
    setTimetableData(updatedData);
  };
  
  const handleSplitCell = (day, period, slotIndex) => {
    const newCell = {
      subject: '',
      room: '',
      faculty: '',
    };
  
    // Add the new cell to the specific slot within the day and period
    timetableData[day][`period${period}`][slotIndex].push(newCell);
  
    // Update the state
    setTimetableData({ ...timetableData });
  };
  
  const handleDeleteCell = (day, period, slotIndex, cellIndex) => {
    // Ensure that the slot and cell exist before updating
    if (timetableData[day] && timetableData[day][`period${period}`]) {
      const slot = timetableData[day][`period${period}`][slotIndex];
  
      // Check if there is more than one item in the slot
      if (slot.length > 0) {
        // Remove the last item from the slot
        slot.pop();
        // Update the state
        setTimetableData({ ...timetableData });
      }
    }
  };
    
  const location = useLocation();
  const currentPathname = location.pathname;
  const handleAddSubject = () => {
    // Navigate to the "Add Subject" page
    // const currentPathname = location.pathname;

    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addsubjects`);
  };

  const handleAddFaculty = () => {
    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addfaculty`);
  };

  const handleAddSem = () => {
    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addsem`);
  };

  const handleAddRoom = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/addroom`);
  };
  const handleViewSummary = () => {
    // Navigate to the "Add Room" page
    navigate(`${currentPathname}/lockedsummary`);
  };
 

  const saveSlotData = async (day,slot,slotData) => { // Mark the function as async
    const Url = `${apiUrl}/timetablemodule/tt/saveslot/${day}/${slot}`;
    const code = currentCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ slotData, code, sem });
  
    // console.log('Slot JSON Data to Send:', dataToSend);
  
    try {
      const response = await fetch(Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotData, code, sem }),
      });
  
      if (response) {
        const data = await response.json();
        // console.log('Slot Data sent to the backend:', data.message);
        setMessage(data.message);
      } else {
        // console.log('no response');
      }
    } catch (error) {
      // console.error('Error sending slot data to the backend:', error);
    }
  };



  


  const handleSubmit = async () => { // Mark the function as async
    const Url = `${apiUrl}/timetablemodule/tt/savett`;
    const code = currentCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ timetableData, code });
  
    // console.log('Data is getting saved');

    setMessage('Data is being saved....')
    try {
      const response = await fetch(Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timetableData, code, sem }),
      });
  
      if (response.ok) {
        const data = await response.json();
        // console.log('Data sent to the backend:', data);
      } else {
        console.error('Failed to send data to the backend. HTTP status:', response.status);
      }
    } catch (error) {
      console.error('Error sending data to the backend:', error);
    }
    finally{
      setMessage('Data saved successfully');
    }
  };
  

  const handleLockTT = async () => { // Mark the function as async
    setMessage('Data is being saved....')
    // await handleSubmit();
    // console.log('Data is getting Locked');
    setMessage('Data saved. Commencing lock')
    setMessage('Data is being locked')
    const Url = `${apiUrl}/timetablemodule/lock/locktt`;
    const code = currentCode;
    const sem = selectedSemester;
    try {
      const response = await fetch(Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({code}),
      });
  
      if (response.ok) {
        const data = await response.json();
        // console.log(data.message);
      } else {
        console.error('Failed to send data to the backend. HTTP status:', response.status);
      }
    } catch (error) {
      console.error('Error sending data to the backend:', error);
    }
    finally{
      setMessage('Data Locked successfully');
    }
  };


  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div>
      <h1>TIME TABLE</h1>
      
      <div className="add-buttons">
      <button onClick={handleAddSem}>Add Semester</button>
      <button onClick={handleAddSubject}>Add Subject</button>
      <button onClick={handleAddFaculty}>Add Faculty</button>
      <button onClick={handleAddRoom}>Add Room</button>
      <button onClick={handleLockTT}>Lock TT</button>
      <button onClick={handleViewSummary}>View/Download Locked TT</button>
    </div>
    <div style={{
  backgroundColor: 'brown',
  color: 'white',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '1.5rem', // Adjust the font size as needed
}}>
  {message}
</div>

    <div>
        <label>Select Semester:</label>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          {semesters.map((semester, index) => (
            <option key={index} value={semester}>
              {semester}
            </option>
          ))}
        </select>
      </div>


      {Object.keys(timetableData).length === 0 ? (
  <div>Loading...</div>
) : (
  <table border="5" cellSpacing="0" align="center">
    <tr>
      <td align="center" height="50" width="100">
        <b>Day/Period</b>
      </td>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
        <td key={period} align="center" height="50">
          <b>{period}</b>
        </td>
      ))}
    </tr>
    {days.map((day) => (
      <tr key={day}>
        <td align="center" height="50">
          <b>{day}</b>
        </td>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
          <td key={period} align="center" height="50">
            {timetableData[day][`period${period}`].map((slot, slotIndex) => (
              <div key={slotIndex} className="cell-container">
                {slot.map((cell, cellIndex) => (
                  <div key={cellIndex} className="cell-slot">
<select
  value={cell.subject}
  onChange={(event) => handleCellChange(day, period, slotIndex, cellIndex, 'subject', event)}
>

<option value="">Select Subject</option>
    {availableSubjects.map((subject) => (
      <option key={subject._id} value={subject.subName}>
        {subject.subName}
      </option>
  ))}
</select>
<select
  value={cell.room}
  onChange={(event) => handleCellChange(day, period, slotIndex, cellIndex, 'room', event)}
>
  <option value="">Select Room</option> {/* Add an empty option */}
  {availableRooms.map((roomOption) => (
    <option key={roomOption} value={roomOption}>
      {roomOption}
    </option>
  ))}
</select>
<select
  value={cell.faculty}
  onChange={(event) => handleCellChange(day, period, slotIndex, cellIndex, 'faculty', event)}
>
  <option value="">Select Faculty</option> {/* Add an empty option */}
  {availableFaculties.map((faculty, index) => (
    <option key={index} value={faculty}>
      {faculty}
    </option>
  ))}
</select>

                  </div>
                ))}
                 {slotIndex === 0 && (
      <button
        className="cell-split-button"
        onClick={() => handleSplitCell(day, period, slotIndex)}
      >
        +
      </button>
    )}
    {slotIndex === 0 && slot.length > 1 && (
      <button
        className="cell-delete-button"
        onClick={() => handleDeleteCell(day, period, slotIndex)}
      >
        Delete
      </button>
    )}
              </div>
            ))}
          </td>
        ))}
      </tr>
    ))}
  </table>
)}
      <button onClick={handleSubmit}>Save Timetable</button>
<div>
<div>
<h1>View Semester Timetable</h1>
        <label>Select Semester:</label>
        <select
          value={viewselectedSemester}
          onChange={(e) => setViewSelectedSemester(e.target.value)}
        >          <option value="">Select </option>

          {semesters.map((semester, index) => (
            <option key={index} value={semester}>
              {semester}
            </option>
          ))}
        </select>
      </div>
  

<div>
  {viewselectedSemester ? (
    <div>
      <ViewTimetable timetableData={viewData} />     
<TimetableSummary timetableData={viewData} /> 
    </div>
  ) : (
    <p>Please select a Semester from the dropdown.</p>
  )}
</div>


</div>
<div>
<div>
<h1>View Faculty Timetable</h1>
        <label>Select Faculty:</label>
        <select
          value={viewFaculty}
          onChange={(e) => setViewFaculty(e.target.value)}
        >
          <option value="">Select </option>
          {availableFaculties.map((faculty, index) => (
            <option key={index} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      </div>
      <div>
  {viewFaculty ? (
    <ViewTimetable timetableData={viewFacultyData} />
  ) : (
    <p>Please select a faculty from the dropdown.</p>
  )}
</div>     
</div>

<div>
<h1>View Room Timetable</h1>
        <label>Select Room:</label>
        <select
          value={viewRoom}
          onChange={(e) => setViewRoom(e.target.value)}
        >
           <option value="">Select </option>
          {availableRooms.map((room, index) => (
            <option key={index} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>
  
      <div>
  {viewRoom ? (
    <ViewTimetable timetableData={viewRoomData} />
  ) : (
    <p>Please select a Room from the dropdown.</p>
  )}
</div>

    </div>
    
  );
  
};

export default Timetable;
