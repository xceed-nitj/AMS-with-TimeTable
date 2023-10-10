import React from 'react';
import './Timetable.css'
const Timetable = () => {
  const timetableData = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: [
      '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ],
    events: [
      {
        day: 'Monday',
        time: '8:00 AM',
        title: 'Math Class',
      },
      {
        day: 'Monday',
        time: '10:00 AM',
        title: 'History Class',
      },
      {
        day: 'Tuesday',
        time: '9:00 AM',
        title: 'English Class',
      },
      {
        day: 'Wednesday',
        time: '11:00 AM',
        title: 'Science Class',
      },
      {
        day: 'Thursday',
        time: '2:00 PM',
        title: 'Art Class',
      },
      {
        day: 'Friday',
        time: '1:00 PM',
        title: 'Music Class',
      },
      // Add more events here
    ],
  };

  return (
    <div className="timetable">
      <div className="timetable-grid">
        <div className="timetable-row">
          <div className="timetable-cell"></div>
          {timetableData.timeSlots.map((time) => (
            <div className="timetable-cell" key={time}>
              {time}
            </div>
          ))}
        </div>

        {timetableData.days.map((day) => (
          <div className="timetable-row" key={day}>
            <div className="timetable-cell-day">{day}</div>
            {timetableData.timeSlots.map((time) => (
              <div className="timetable-cell" key={`${day}-${time}`}>
                {timetableData.events.map((event) => {
                  if (event.day === day && event.time === time) {
                    return (
                      <div className="event" key={event.title}>
                        {event.title}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Timetable;
