import React from 'react';

const TimetableSummary = ({ timetableData }) => {
  // Create an object to store subject-wise counts and faculty assignments
  const summaryData = {};

  // Iterate through the timetable data to calculate the summary
  for (const day in timetableData) {
    for (let period = 1; period <= 8; period++) {
      const slots = timetableData[day][`period${period}`];
      slots.forEach((slot) => {
        slot.forEach((cell) => {
          const { subject, faculty } = cell;

          // Initialize or update the subject entry in the summaryData
          if (!summaryData[subject]) {
            summaryData[subject] = { count: 1, faculties: [faculty] };
          } else {
            summaryData[subject].count++;
            if (!summaryData[subject].faculties.includes(faculty)) {
              summaryData[subject].faculties.push(faculty);
            }
          }
        });
      });
    }
  }

  return (
    <div>
      <h2>Timetable Summary</h2>
      <table border="1" cellSpacing="0" align="center">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Count</th>
            <th>Faculties</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(summaryData).map((subject) => (
            <tr key={subject}>
              <td>{subject}</td>
              <td>{summaryData[subject].count}</td>
              <td>{summaryData[subject].faculties.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableSummary;
