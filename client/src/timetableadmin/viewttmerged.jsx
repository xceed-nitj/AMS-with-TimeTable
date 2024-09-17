import React, { useState, useEffect } from 'react';
import { Container } from "@chakra-ui/layout";
import { color, Heading } from '@chakra-ui/react';
import { CustomTh, CustomLink, CustomBlueButton, CustomPlusButton, CustomDeleteButton } from '../styles/customStyles'
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

const ViewTimetable = ({ timetableData}) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // console.log('data sent to view', timetableData);

  const colorList = [
    'darkturquoise',
    'darkred',
    'green',
    'red',
    'brown',
    'orange',
    'navy',
    'blue',
    'purple',
    'darkgolden',
    'darkmagenta',
    'darkseagreen',
    'teal',
    'darkolivegreen',
    'darkslateblue',
    'saddlebrown',
    'indigo',
    'darkcyan',
    'firebrick',
    'darkorchid'
  ]
  let colorDict = {}
  function colorManager(val) {
    function freshColor() {
      return colorList.filter((c) => !Object.values(colorDict).includes(c))[0]
    }
    if (!val) return
    if (!{}.propertyIsEnumerable.call(colorDict, val)) {
      colorDict[val] = freshColor()
    }
    return colorDict[val]
  }

  return (
    <div>
      {Object.keys(timetableData).length === 0 ? (
        <div></div>
      ) : (
        <div id='timetable-summary'>
          <TableContainer>
            <Table variant={'striped'} colorScheme='blackAlpha'>
              <Thead>
                <Tr>
                  <Th style={{ backgroundColor: '#24304c', fontWeight: '900', fontSize: 'small', color: 'white' }}>Day/Period </Th>
                  {['8:30 AM - 9:25 AM',
                    ('9:30 AM - 10:25 AM'),
                    '10:30 AM - 11:25 AM',
                    '11:30 AM - 12:25 PM',
                    '12:30 PM - 1:30 PM',
                    '1:30 PM - 2:25 PM',
                    '2:30 PM - 3:25 PM',
                    '3:30 PM - 4:25 PM',
                    '4:30 PM - 5:25 PM',
                  ].map((period) => (
                    <Th key={period} style={{ textWrap: 'nowrap', backgroundColor: '#24304c', color: "white", textAlign: "center" }} height="50">
                      <b>{period === '12:30 PM - 1:30 PM' ? '12:30 PM - 1:30 PM' : period}</b>
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {days.map((day) => (
                  <Tr key={day}>
                    <Td style={{ backgroundColor: '#24304c', color: "white" }} align="center" height="50">
                      <b>{day}</b>
                    </Td>
                    {[1, 2, 3, 4, 'Lunch', 5, 6, 7, 8].map((period) => (
                      <Td key={period} align="center" height="50" style={{
                        backgroundColor: period == 'Lunch' ? '#DECA57cc' : timetableData[day][`period${period}`].length==0?"green":"",
                        color: period == 'Lunch' ? 'rgba(0,0,0,0.7)' : ''
                      }}>
                        {period === 'Lunch' ? (
                          <div className="cell-container">
                            {/* Check if lunch data exists for the current day */}
                            {timetableData[day]['lunch'] && timetableData[day]['lunch'].length > 0 ? (
                              timetableData[day]['lunch'].map((slot, slotIndex) => (
                                <div key={slotIndex} className="cell-container">
                                  {slot.map((cell, cellIndex) => (
                                    <div style={{
                                      color: colorManager(cell.subject)
                                    }} key={cellIndex} className="cell-slot">
                                      {/* <p style={{ textAlign: 'center' }}>{cell.subject}</p><br />
                                      <p style={{ textAlign: 'center' }}>{cell.room}</p><br />
                                      <p style={{ textAlign: 'center' }}>{cell.faculty}</p> */}
                                    </div>
                                  ))}
                                </div>
                              ))
                            ) : (
                              <p>Lunch</p>
                            )}
                          </div>
                        ) : (
                          timetableData[day][`period${period}`].map((elem)=>(<p key={elem}>{elem}</p>))
                        )}
                      </Td>
                    ))}
                  </Tr>
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
