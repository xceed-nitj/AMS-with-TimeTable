import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewTimetable from './viewtt';
import getEnvironment from '../getenvironment';



const Timetable = () => {
  const [timetableData, setTimetableData] = useState({});
  const [viewData, setViewData] = useState({});
  const [viewFacultyData, setViewFacultyData] = useState({});
  const [viewRoomData, setViewRoomData] = useState({});

  const availableSubjects = ['Eng', 'Mat', 'Che', 'Phy', 'Other'];
  const availableRooms = ['Room1', 'Room2', 'Room3', 'Room4', 'Room5'];
  const availableFaculties = ['Faculty1', 'Faculty2', 'Faculty3', 'Faculty4', 'Faculty5'];
  const semesters=[1,3,5,7]
  const [selectedSemester, setSelectedSemester] = useState('1'); 
  const [viewselectedSemester, setViewSelectedSemester] = useState('1'); 
  const [viewFaculty, setViewFaculty]= useState('Faculty1')  
  const [viewRoom, setViewRoom]= useState('Room1')  
  
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
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${faculty }`);
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
        const response = await fetch(`${apiUrl}/timetablemodule/tt/viewroomtt/${currentCode}/${room }`);
        const data = await response.json();
        console.log('roomdata',data);
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
  
  useEffect(() => {
    console.log('Updated timetableData:', timetableData);
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

  const handleAddSubject = () => {
    // Navigate to the "Add Subject" page
    const currentPathname = location.pathname;

    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addsubject`);
  };

  const handleAddFaculty = () => {
    const currentPathname = location.pathname;

    // Navigate to the current URL with an additional path segment
    navigate(`${currentPathname}/addfaculty`);
  };

  const handleAddRoom = () => {
    // Navigate to the "Add Room" page
    navigate('/addroom');
  };
 

    //  const saveSlotData = async (day,slot) => {
    //   try {
    //     const response = await fetch(`${apiUrl}/timetablemodule/tt/saveslot/${day}/${slot}`);
    //     const data = await response.json();
    //   } catch (error) {
    //     console.error('Error fetching existing timetable data:', error);
    //     return {};
    //   }
    // };

  const saveSlotData = async (day,slot,slotData) => { // Mark the function as async
    const Url = `${apiUrl}/timetablemodule/tt/saveslot/${day}/${slot}`;
    const code = currentCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ slotData, code, sem });
  
    console.log('Slot JSON Data to Send:', dataToSend);
  
    try {
      const response = await fetch(Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotData, code, sem }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Slot Data sent to the backend:', data);
      } else {
        console.error('Failed to send slot data to the backend. HTTP status:', response.status);
      }
    } catch (error) {
      console.error('Error sending slot data to the backend:', error);
    }
  };



  


  const handleSubmit = async () => { // Mark the function as async
    const Url = `${apiUrl}/timetablemodule/tt/savett`;
    const code = currentCode;
    const sem = selectedSemester;
    const dataToSend = JSON.stringify({ timetableData, code });
  
    console.log('JSON Data to Send:', dataToSend);
  
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
        console.log('Data sent to the backend:', data);
      } else {
        console.error('Failed to send data to the backend. HTTP status:', response.status);
      }
    } catch (error) {
      console.error('Error sending data to the backend:', error);
    }
  };
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div>
      <h1>TIME TABLE</h1>
      
      <div className="add-buttons">
      <button onClick={handleAddSubject}>Add Subject</button>
      <button onClick={handleAddFaculty}>Add Faculty</button>
      <button onClick={handleAddRoom}>Add Room</button>
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
  <option value="">Select Subject</option> {/* Add an empty option */}
  {availableSubjects.map((subjectOption) => (
    <option key={subjectOption} value={subjectOption}>
      {subjectOption}
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
  {availableFaculties.map((facultyOption) => (
    <option key={facultyOption} value={facultyOption}>
      {facultyOption}
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
        >
          {semesters.map((semester, index) => (
            <option key={index} value={semester}>
              {semester}
            </option>
          ))}
        </select>
      </div>
  
<ViewTimetable timetableData={viewData} />     
</div>
<div>
<div>
<h1>View Faculty Timetable</h1>
        <label>Select Faculty:</label>
        <select
          value={viewFaculty}
          onChange={(e) => setViewFaculty(e.target.value)}
        >
          {availableFaculties.map((faculty, index) => (
            <option key={index} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      </div>
  
<ViewTimetable timetableData={viewFacultyData} />     
</div>

<div>
<h1>View Room Timetable</h1>
        <label>Select Room:</label>
        <select
          value={viewRoom}
          onChange={(e) => setViewRoom(e.target.value)}
        >
          {availableRooms.map((room, index) => (
            <option key={index} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>
  
<ViewTimetable timetableData={viewRoomData} />     


    </div>
    
  );
  
};

export default Timetable;
