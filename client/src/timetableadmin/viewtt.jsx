import React from 'react';

const ViewTimetable = ({ timetableData }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div>
      
      {Object.keys(timetableData).length === 0 ? (
        <div>Loading...</div>
      ) : (
        <table border="5" cellSpacing="0" align="center">
          <thead>
            <tr>
              <th align="center" height="50" width="100">
                <b>Day/Period</b>
              </th>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <th key={period} align="center" height="50">
                  <b>{period}</b>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
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
                            {/* Display timetable data in a read-only format */}
                            <p> {cell.subject}</p>
                            <p>{cell.room}</p>
                            <p>{cell.faculty}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewTimetable;
