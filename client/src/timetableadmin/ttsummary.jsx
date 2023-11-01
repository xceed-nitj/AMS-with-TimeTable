import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';

const TimetableSummary = ({ timetableData, code, type }) => {

  const [subjectData, setSubjectData] = useState([]); // Initialize as an empty array


  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;

  const [pdfData, setPdfData] = useState(null);

  useEffect(() => {
    const generatePDF = async () => {
      const content = document.getElementById('timetable-summary');
    
      try {
        const canvas = await html2canvas(content);
        const pdf = new jspdf();
        pdf.addImage(canvas, 'PNG', 0, 0);
        const pdfDataURL = pdf.output('datauristring');
        setPdfData(pdfDataURL);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    };
    
    generatePDF();
  }, []);

  const downloadPDF = () => {
    // Create a new anchor element
    const anchor = document.createElement('a');

    // Set the anchor element's href attribute to the PDF data URL
    anchor.href = pdfData;

    // Set the anchor element's download attribute to the PDF file name
    anchor.download = 'timetable-summary.pdf';

    // Click the anchor element to download the PDF file
    anchor.click();
  };


const currentCode=code;
  useEffect(() => {
    const fetchSubjectData = async (currentCode) => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`);
        const data = await response.json();
        setSubjectData(data);
        console.log('subjectdata',data)
      } catch (error) {
        console.error('Error fetching subject data:', error);
      }
    };

    fetchSubjectData(currentCode);
  


  }, []);

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
              let foundSubject=''
              if(type == 'faculty'){
              foundSubject = subjectData.find(item => item.subName === subject && item.sem === faculty);
              }
              else if(type == 'room'){
                foundSubject = subjectData.find(item => item.subName === subject && item.sem === room);
                }
              else
              {
              foundSubject = subjectData.find(item => item.subName === subject);
              }
              // Initialize or update the subject entry in the summaryData
              if (foundSubject) {
                if (!summaryData[subject]) {
                  summaryData[subject] = {
                    subCode: foundSubject.subCode,
                    count: 1,
                    faculties: [faculty],
                    subType: foundSubject.type,
                    rooms:[room],
                    subjectFullName: foundSubject.subjectFullName,
                    subSem:foundSubject.sem,
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
          <th>Abbreviation</th>
            <th>Subject Code</th>
            <th>Subject Name</th>
            {type !== 'room' && <th>Subject Type</th>}
            <th>Hours</th>
            {type !== 'faculty' && <th>Faculty Name</th>}
            {type !== 'room' && <th>Room No</th>}
            {type !=='sem' && <th>Semester</th>}
          </tr>
        </thead>
        <tbody>
          {Object.keys(summaryData).map((subject) => (
            <tr key={subject}>
              <td>{subject}</td>
              <td>{summaryData[subject].subCode}</td>
              <td>{summaryData[subject].subjectFullName}</td>
              {type !== 'room' && <td>{summaryData[subject].subType}</td>}
              <td>{summaryData[subject].count}</td>
              {type !== 'faculty' && <td>{summaryData[subject].faculties.join(', ')}</td>}
              {type !== 'room' && <td>{summaryData[subject].rooms.join(', ')}</td>}
              {type !=='sem' && <td>{summaryData[subject].subSem}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={downloadPDF}>Download PDF</button>
    </div>
  );
};

export default TimetableSummary;
