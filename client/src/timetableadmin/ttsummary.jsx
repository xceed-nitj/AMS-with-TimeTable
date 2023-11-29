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


const TimetableSummary = ({ timetableData, code, type, time, headTitle,subjectData,TTData,notes,commonLoad }) => {

  
console.log('commonload data',commonLoad);
console.log(type)

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
              else if(type == 'sem')
              {
              foundSubject = subjectData.find(item => item.subName === subject && item.sem === headTitle );
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

// Create an object to store merged entries
const mergedSummaryData = {};

for (const key in summaryData) {
  const entry = summaryData[key];
  const subCode = entry.subCode;

  // Check if an entry with the same subCode already exists in the mergedSummaryData
  if (!mergedSummaryData[subCode]) {
    // If not, add the entry to the mergedSummaryData
    mergedSummaryData[subCode] = { ...entry, originalKeys: [key] };
  } else {
    // If an entry with the same subCode exists, check faculty and type before merging
    if (!mergedSummaryData[subCode]) {
      // If not, add the entry to the mergedSummaryData
      mergedSummaryData[subCode] = { ...entry, originalKeys: [key] };
    } else {
      // If an entry with the same subCode exists, check if all relevant fields are the same before merging
      const existingEntry = mergedSummaryData[subCode];
      const isDifferent =
        !arraysEqual(existingEntry.originalKeys, entry.originalKeys) ||
        !arraysEqual(existingEntry.faculties, entry.faculties) ||
        !arraysEqual(existingEntry.rooms, entry.rooms) ||
        existingEntry.subType !== entry.subType;
  
      if (!isDifferent) {
        // Merge the data
        existingEntry.count += entry.count;
        existingEntry.faculties = [...new Set([...existingEntry.faculties, ...entry.faculties])];
        existingEntry.rooms = [...new Set([...existingEntry.rooms, ...entry.rooms])];
        existingEntry.originalKeys.push(...entry.originalKeys);
        // Add any other merging logic as needed
      } else {
        // If any relevant field is different, treat as a new entry
        mergedSummaryData[`${subCode}-${key}`] = { ...entry, originalKeys: [key] };
      }
    }
  }
}

// Now, mergedSummaryData contains the merged entries with original keys
console.log('merged data', mergedSummaryData);

const sortedSummary = Object.values(mergedSummaryData).sort((a, b) =>
  a.subCode.localeCompare(b.subCode)
);
console.log('sorted data', sortedSummary );

// let sortedSummaryEntries={};

let sortedSummaryEntries = { ...sortedSummary }; // Assuming sortedSummary is an existing object

if (commonLoad) {
  commonLoad.forEach((commonLoadItem) => {
    sortedSummaryEntries = {
      ...sortedSummaryEntries,
      [commonLoadItem.subCode]: {
        ...sortedSummaryEntries[commonLoadItem.subCode],
        count: commonLoadItem.hrs,
        faculties: [],
        originalKeys: [commonLoadItem.subName],
        rooms: [],
        subCode: commonLoadItem.subCode,
        subjectFullName: commonLoadItem.subFullName,
        subType: commonLoadItem.subType,
        subSem: commonLoadItem.sem,
        // code: commonLoadItem.code,
        // add other fields from commonLoadItem as needed
      },
    };
  });
}

// Now, sortedSummaryEntries contains the merged data from commonLoad
// console.log(sortedSummaryEntries);

console.log('summary',  sortedSummaryEntries)
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
  {Object.keys(sortedSummaryEntries).map((subCode) => (
    <tr key={subCode}>
      <td>{sortedSummaryEntries[subCode].originalKeys.join(', ')}</td>
      <td>{sortedSummaryEntries[subCode].subCode}</td>
      <td>{sortedSummaryEntries[subCode].subjectFullName}</td>
      <td>{sortedSummaryEntries[subCode].subType}</td>
      <td>{sortedSummaryEntries[subCode].count}</td>
      {type !== 'faculty' && <td>{sortedSummaryEntries[subCode].faculties.join(', ')}</td>}
      {type !== 'room' && <td>{sortedSummaryEntries[subCode].rooms.join(', ')}</td>}
      {type !== 'sem' && <td>{sortedSummaryEntries[subCode].subSem}</td>}
    </tr>
  ))}
</tbody>
      </table>
{time?<PDFGenerator timetableData={timetableData} summaryData={sortedSummaryEntries} type={type} ttdata={TTData} updatedTime={time} headTitle={headTitle} notes={notes}/>:null}
    </div>
  );
};

export default TimetableSummary;
