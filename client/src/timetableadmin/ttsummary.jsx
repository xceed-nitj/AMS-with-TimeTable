import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';

const TimetableSummary = ({ timetableData, type }) => {



  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  function extractCodeFromURL(url) {
    try {
      const urlObject = new URL(`http://${url}`);
      const pathParts = urlObject.pathname.split('/');

      if (pathParts.length >= 2) {
        const code = pathParts[pathParts.length - 2];
        return code;
      }
      else
      {
      const code = pathParts[pathParts.length - 1];
      return code;
      }
    } catch (error) {
      console.error('Error extracting code from URL:', error);
      return null; // Handle error or return a default value if needed
    }
  }
  
const currentCode=extractCodeFromURL(currentURL);

  const [subjectData, setSubjectData] = useState([]); // Initialize as an empty array

  useEffect(() => {
    const fetchSubjectData = async (currentCode) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`);
        const data = await response.json();
        setSubjectData(data);
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    fetchSubjectData(currentCode);
  }, [apiUrl, currentCode]);

  const summaryData = {};

  // Iterate through the timetable data to calculate the summary
  for (const day in timetableData) {
    for (let period = 1; period <= 8; period++) {
      const slots = timetableData[day][`period${period}`];

      // Check if the slot is not empty
      if (slots) {
        slots.forEach((slot) => {
          slot.forEach((cell) => {
            // Check if the cell contains data
            if (cell.subject) {
              const { subject, faculty, room } = cell;

              // Find the subject data in the subjectData array
              const foundSubject = subjectData.find(item => item.subName === subject);

              // Initialize or update the subject entry in the summaryData
              if (foundSubject) {
                if (!summaryData[subject]) {
                  summaryData[subject] = {
                    subCode: foundSubject.subCode,
                    count: 1,
                    faculties: [faculty],
                    subType: foundSubject.type,
                    rooms:[room],
                  };
                } else {
                  summaryData[subject].count++;
                  if (!summaryData[subject].faculties.includes(faculty)) {
                    summaryData[subject].faculties.push(faculty);
                    // summaryData[subject].rooms.push(room);

                  }
                }
              }
            }
          });
        });
      }
    }
  }

  return (
    <div>
      <h2>Timetable Summary</h2>
      <table border="1" cellSpacing="0" align="center">
        <thead>
          <tr>
            <th>Subject Code</th>
            <th>Subject Name</th>
            {type !== 'room' && <th>Subject Type</th>}
            <th>Hours</th>
            {type !== 'faculty' && <th>Faculty Name</th>}
            {type !== 'room' && <th>Room No</th>}
          </tr>
        </thead>
        <tbody>
          {Object.keys(summaryData).map((subject) => (
            <tr key={subject}>
              <td>{summaryData[subject].subCode}</td>
              <td>{subject}</td>
              {type !== 'room' && <td>{summaryData[subject].subType}</td>}
              <td>{summaryData[subject].count}</td>
              {type !== 'faculty' && <td>{summaryData[subject].faculties.join(', ')}</td>}
              {type !== 'room' && <td>{summaryData[subject].rooms.join(', ')}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableSummary;
