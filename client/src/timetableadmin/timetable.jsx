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
       const subj=fetchedData[day][`period${period}`][0][0].subject;
       const room=fetchedData[day][`period${period}`][0][0].room;
       const faculty=fetchedData[day][`period${period}`][0][0].faculty;
       
       const subInd=availableSubjects.indexOf(subj);
       const roomInd=availableRooms.indexOf(room);
       const facultyInd=availableFaculties.indexOf(faculty);
        initialData[day][`period${period}`] = [
          {
            subject: availableSubjects[subInd],
            room: availableRooms[roomInd],
            faculty: availableFaculties[facultyInd],
          },
        ];
      }
    }

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

  const handleSplitCell = (day, period) => {
    const newCell = {
      subject: availableSubjects[0],
      room: availableRooms[0],
      faculty: availableFaculties[0],
    };

    timetableData[day][`period${period}`].push(newCell);

    setTimetableData({ ...timetableData });
  };

  const handleDeleteCell = (day, period, index) => {
    const cellToDelete = timetableData[day][`period${period}`][index];

    timetableData[day][`period${period}`] = timetableData[day][`period${period}`].filter(
      (_, i) => i !== index
    );

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
      <div>Loading...</div> // or a loading spinner, message, etc.
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
              {timetableData[day][`period${period}`].map((cell, index) => (
                <div key={index} className="cell-container">
                  <div className="cell-slot">
                    <select
                      value={cell.subject}
                      onChange={(event) => handleCellChange(day, period, index, 'subject', event)}
                    >
                      {availableSubjects.map((subjectOption) => (
                        <option key={subjectOption} value={subjectOption}>
                          {subjectOption}
                        </option>
                      ))}
                    </select>
                    <select
                      value={cell.room}
                      onChange={(event) => handleCellChange(day, period, index, 'room', event)}
                    >
                      {availableRooms.map((roomOption) => (
                        <option key={roomOption} value={roomOption}>
                          {roomOption}
                        </option>
                      ))}
                    </select>
                    <select
                      value={cell.faculty}
                      onChange={(event) => handleCellChange(day, period, index, 'faculty', event)}
                    >
                      {availableFaculties.map((facultyOption) => (
                        <option key={facultyOption} value={facultyOption}>
                          {facultyOption}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="cell-split-button"
                    onClick={() => handleSplitCell(day, period)}
                  >
                    +
                  </button>
                  {index > 0 && (
                    <button
                      className="cell-delete-button"
                      onClick={() => handleDeleteCell(day, period, index)}
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
                  }
export default Timetable;
