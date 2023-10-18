import React, { useState, useEffect } from 'react';


const Timetable = () => {
  const [timetableData, setTimetableData] = useState({});
  const availableSubjects = ['Eng', 'Mat', 'Che', 'Phy', 'Other'];
  const availableRooms = ['Room1', 'Room2', 'Room3', 'Room4', 'Room5'];
  const availableFaculties = ['Faculty1', 'Faculty2', 'Faculty3', 'Faculty4', 'Faculty5'];
  const selectedCell = null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/timetablemodule/tt/viewclasstt/abc-def-hij/3');
        const data = await response.json();
       console.log(data);
        const initialData = generateInitialTimetableData(data);
       
        setTimetableData(initialData);
      } catch (error) {
        console.error('Error fetching existing timetable data:', error);
      }
    };
    fetchData();
  }, []);

  const generateInitialTimetableData = (fetchedData) => {
    const initialData = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        const slotData = fetchedData[day][`period${period}`];
        initialData[day][`period${period}`] = [];
  
        for (const slot of slotData) {
          const slotSubjects = [];
  
          for (const slotItem of slot) {
            const subj = slotItem.subject;
            const room = slotItem.room;
            const faculty = slotItem.faculty;
            const subInd = availableSubjects.indexOf(subj);
            const roomInd = availableRooms.indexOf(room);
            const facultyInd = availableFaculties.indexOf(faculty);
  
            slotSubjects.push({
              subject: availableSubjects[subInd],
              room: availableRooms[roomInd],
              faculty: availableFaculties[facultyInd],
            });
          }
  
          initialData[day][`period${period}`].push(slotSubjects);
        }
      }
    }
  console.log(initialData);
    return initialData;
  };

  useEffect(() => {
    console.log('Updated timetableData:', timetableData);
  }, [timetableData]);


  const handleCellChange = (day, period, index, type, event) => {
    const newValue = event.target.value;
    const updatedData = { ...timetableData };
    updatedData[day][`period${period}`][index][type] = newValue;
    setTimetableData(updatedData);
  };

  const handleSplitCell = (day, period, slotIndex) => {
    const newCell = {
      subject: availableSubjects[0],
      room: availableRooms[0],
      faculty: availableFaculties[0],
    };
  
    // Add the new cell to the specific slot within the day and period
    timetableData[day][`period${period}`][slotIndex].push(newCell);
  
    // Update the state
    setTimetableData({ ...timetableData });
  };
  
  const handleDeleteCell = (day, period, slotIndex, cellIndex) => {
    // Remove the cell at the specified cellIndex within the specific slot
    timetableData[day][`period${period}`][slotIndex].splice(cellIndex, 1);
  
    // Update the state
    setTimetableData({ ...timetableData });
  };
  
  const handleSubmit = () => {
    const apiUrl = 'http://127.0.0.1:8000/timetablemodule/tt/savett';
    const code = 'abc-def-hij';
    const sem = '3';
    const dataToSend = JSON.stringify({ timetableData, code });

    console.log('JSON Data to Send:', dataToSend);

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timetableData, code, sem }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Data sent to the backend:', data);
      })
      .catch(error => {
        console.error('Error sending data to the backend:', error);
      });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div>
      <h1>TIME TABLE</h1>
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
    </div>
  );
};

export default Timetable;
