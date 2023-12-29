import React, { useState, useEffect } from 'react';
import { Container } from "@chakra-ui/layout";
import { Heading } from '@chakra-ui/react';
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


// ... (other imports)

const ViewTimetable = ({ timetableData, tableSummary, headerDetails }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  console.log('data sent to view', timetableData);

  return (
    <div>
      {Object.keys(timetableData).length === 0 ? (
        <div>Loading...</div>
      ) : (
        <div id='timetable-summary'>
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <CustomTh>Day/Period </CustomTh>
                  {[    '8:30 AM - 9:25 AM',
    '9:30 AM - 10:25 AM',
    '10:30 AM - 11:25 AM',
    '11:30 AM - 12:25 PM',
    '12:30 PM - 1:30 PM',
    '1:30 PM - 2:25 PM',
    '2:30 PM - 3:25 PM',
    '3:30 PM - 4:25 PM',
    '4:30 PM - 5:25 PM',
].map((period) => (
                    <th key={period} align="center" height="50">
                      <b>{period === '12:30 PM - 1:30 PM' ? '12:30 PM - 1:30 PM' : period}</b>
                    </th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td align="center" height="50">
                      <b>{day}</b>
                    </td>
                    {[1, 2, 3, 4, 'Lunch', 5, 6, 7, 8].map((period) => (
                      <td key={period} align="center" height="50">
                        {period === 'Lunch'  ? (
                           <div className="cell-container">
                           {/* Check if lunch data exists for the current day */}
                           {timetableData[day]['lunch'] && timetableData[day]['lunch'].length > 0 ? (
                             timetableData[day]['lunch'].map((slot, slotIndex) => (
                              <div key={slotIndex} className="cell-container">
                              {slot.map((cell, cellIndex) => (
                                <div key={cellIndex} className="cell-slot">
                                  <p>{cell.subject}</p>
                                  <p>{cell.room}</p>
                                  <p>{cell.faculty}</p>
                                </div>
                              ))}
                            </div>
                             ))
                           ) : (
                             <p>Lunch</p>
                           )}
                         </div>
                        ) : (
                          timetableData[day][`period${period}`].map((slot, slotIndex) => (
                            <div key={slotIndex} className="cell-container">
                              {slot.map((cell, cellIndex) => (
                                <div key={cellIndex} className="cell-slot">
                                  <p>{cell.subject}</p>
                                  <p>{cell.room}</p>
                                  <p>{cell.faculty}</p>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          {/* <button onClick={downloadPDF}>Download PDF</button> */}
        </div>
      )}
    </div>
  );
};

export default ViewTimetable;
