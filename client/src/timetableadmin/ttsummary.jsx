import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import {CustomTh, CustomLink, CustomBlueButton, CustomPlusButton, CustomDeleteButton} from '../styles/customStyles'
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";

import PDFGenerator from '../filedownload/makepdf';


const TimetableSummary = ({ timetableData, code, type, time, headTitle,subjectData,TTData }) => {

  
  console.log('TT data',TTData);


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
                  console.log('sum',summaryData[subject])
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
console.log('summary',  summaryData)
  return (
    <div>
      <h2>Timetable Summary</h2>
      <table border="1" cellSpacing="0" align="center">
        <thead>
          <tr>
          <th>Abbreviation</th>
            <th>Subject Code</th>
            <th>Subject Name</th>
            <th>Subject Type</th>
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
              <td>{summaryData[subject].subType}</td>
              <td>{summaryData[subject].count}</td>
              {type !== 'faculty' && <td>{summaryData[subject].faculties.join(', ')}</td>}
              {type !== 'room' && <td>{summaryData[subject].rooms.join(', ')}</td>}
              {type !=='sem' && <td>{summaryData[subject].subSem}</td>}
            </tr>
          ))}
        </tbody>
      </table>
{time?<PDFGenerator timetableData={timetableData} summaryData={summaryData} type={type} ttdata={TTData} updatedTime={time} headTitle={headTitle}/>:null}
    </div>
  );
};

export default TimetableSummary;
