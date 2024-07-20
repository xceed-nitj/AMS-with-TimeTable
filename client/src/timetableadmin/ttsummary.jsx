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
    for (let period = 1; period <= 9; period++) {
      let slots=''
      if (period==9)
      {
      slots=timetableData[day]['lunch'];
      }
      else
      {
      slots = timetableData[day][`period${period}`];
      }
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
                  console.log('subcode inside',foundSubject.subCode)
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
                  }
              
                  // Handle rooms
                  if (!summaryData[subject].rooms.includes(room)) {
                    summaryData[subject].rooms.push(room);
                  }

                }
              }




              
            }
          });
        });
      }
    }
  }
  const mergedSummaryData = {};

  for (const key in summaryData) {
    const entry = summaryData[key];
    const subCode = entry.subCode;
  
    let isMerged = false;
  
    // Check against all existing entries in mergedSummaryData
    for (const existingKey in mergedSummaryData) {
      const existingEntry = mergedSummaryData[existingKey];
  
      if (
        entry.faculties.every(faculty => existingEntry.faculties.includes(faculty)) &&
        entry.subType === existingEntry.subType &&
        entry.subCode === existingEntry.subCode &&
        entry.subSem === existingEntry.subSem &&
        entry.subjectFullName === existingEntry.subjectFullName &&
        entry.rooms.every(room => existingEntry.rooms.includes(room))
      ) {
        // Merge the data
        existingEntry.count += entry.count;
        existingEntry.faculties = [...new Set([...existingEntry.faculties, ...entry.faculties])];
        existingEntry.originalKeys.push(key);
        isMerged = true;
        // Add any other merging logic as needed
        break; // Stop checking further if merged
      }
    }
  
    // If not merged, create a new entry
    if (!isMerged) {
      mergedSummaryData[key] = { ...entry, originalKeys: [key] };
    }
  }
  
// Now, mergedSummaryData contains the merged entries with original keys
// console.log('merged data', mergedSummaryData);

const sortedSummary = Object.values(mergedSummaryData).sort((a, b) => {
  const subCodeComparison = a.subCode.localeCompare(b.subCode);

  if (subCodeComparison !== 0) {
    return subCodeComparison;
  }

  const subtypePriority = (subType) => {
    switch (subType.toLowerCase()) {
      case 'theory':
        return 0;
      case 'tutorial':
        return 1;
      case 'laboratory':
        return 2;
      default:
        return 3; // If there are other subtypes, place them at the end
    }
  };

  const aPriority = subtypePriority(a.subType);
  const bPriority = subtypePriority(b.subType);

  return aPriority - bPriority;
});

// console.log('sorted data', sortedSummary );

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

// console.log('summary',  sortedSummaryEntries)
  return (
    <div>
      <h2 style={{fontWeight:'700', fontSize:'large', padding:'10px'}}>Timetable Summary</h2>
      <TableContainer>
      <Table border="1" cellSpacing="0" align="center" colorScheme='blackAlpha'>
        <thead>
          <Tr>
          <Th>Abbreviation</Th>
            <Th>Subject Code</Th>
            <Th>Subject Name</Th>
            <Th>Subject Type</Th>
            <Th>Hours</Th>
            {type !== 'faculty' && <Th>Faculty Name</Th>}
            {type !== 'room' && <Th>Room No</Th>}
            {type !=='sem' && <Th>Semester</Th>}
          </Tr>
        </thead>
        <tbody>
  {Object.keys(sortedSummaryEntries).map((subCode) => (
    <Tr key={subCode}>
      <Td>{sortedSummaryEntries[subCode].originalKeys.join(', ')}</Td>
      <Td>{sortedSummaryEntries[subCode].subCode}</Td>
      <Td>{sortedSummaryEntries[subCode].subjectFullName}</Td>
      <Td>{sortedSummaryEntries[subCode].subType}</Td>
      <Td>{sortedSummaryEntries[subCode].count}</Td>
      {type !== 'faculty' && <Td>{sortedSummaryEntries[subCode].faculties.join(', ')}</Td>}
      {type !== 'room' && <Td>{sortedSummaryEntries[subCode].rooms.join(', ')}</Td>}
      {type !== 'sem' && type !== 'room'?<Td>{sortedSummaryEntries[subCode].faculties.join(', ')}</Td>: type !== 'sem' && <Td>{sortedSummaryEntries[subCode].rooms.join(', ')}</Td>}
    </Tr>
  ))}
</tbody>
      </Table>
      </TableContainer>
{time?<PDFGenerator timetableData={timetableData} summaryData={sortedSummaryEntries} type={type} ttdata={TTData} updatedTime={time} headTitle={headTitle} notes={notes}/>:null}
    </div>
  );
};

export default TimetableSummary;
