import React from 'react';
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



const ViewTimetable = ({ timetableData }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div>
      
      {Object.keys(timetableData).length === 0 ? (
        <div>Loading...</div>
      ) : (
        <TableContainer>
        <Table

        >
          <Thead>
            <Tr>
                
              <CustomTh>Day/Period </CustomTh>
              {/* </th> */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                <th key={period} align="center" height="50">
                  <b>{period}</b>
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
          </Tbody>
        </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default ViewTimetable;
