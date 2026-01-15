import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import {
  Box,
  Text,
  Heading,
  VStack,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Flex,
} from '@chakra-ui/react';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/table';
import PDFGenerator from '../filedownload/makepdf';

const TimetableSummary = ({ timetableData, code, type, time, headTitle, subjectData, TTData, notes, commonLoad }) => {
  console.log('faculty name', headTitle);

  const summaryData = {};

  // Iterate through the timetable data to calculate the summary
  for (const day in timetableData) {
    for (let period = 1; period <= 9; period++) {
      let slots = '';
      if (period == 9) {
        slots = timetableData[day]['lunch'];
      } else {
        slots = timetableData[day][`period${period}`];
      }
      // Check if the slot is not empty
      if (slots) {
        slots.forEach((slot) => {
          slot.forEach((cell) => {
            // Check if the cell contains data
            if (cell.subject) {
              const { subject, faculty, room } = cell;
              let foundSubject = '';
              if (type == 'faculty') {
                foundSubject = subjectData.find((item) => item.subName === subject && item.sem === faculty);
              } else if (type == 'room') {
                foundSubject = subjectData.find((item) => item.subName === subject && item.sem === room);
              } else if (type == 'sem') {
                foundSubject = subjectData.find((item) => item.subName === subject && item.sem === headTitle);
              }
              // Initialize or update the subject entry in the summaryData
              if (foundSubject) {
                if (!summaryData[subject]) {
                  console.log('subcode inside', foundSubject.subCode);
                  summaryData[subject] = {
                    subCode: foundSubject.subCode,
                    count: 1,
                    faculties: [faculty],
                    subType: foundSubject.type,
                    rooms: [room],
                    subjectFullName: foundSubject.subjectFullName,
                    subSem: foundSubject.sem,
                  };
                  console.log('sum', summaryData[subject]);
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
        entry.faculties.every((faculty) => existingEntry.faculties.includes(faculty)) &&
        entry.subType === existingEntry.subType &&
        entry.subCode === existingEntry.subCode &&
        entry.subSem === existingEntry.subSem &&
        entry.subjectFullName === existingEntry.subjectFullName &&
        entry.rooms.every((room) => existingEntry.rooms.includes(room))
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
          return 3;
      }
    };

    const aPriority = subtypePriority(a.subType);
    const bPriority = subtypePriority(b.subType);

    return aPriority - bPriority;
  });

  let sortedSummaryEntries = { ...sortedSummary };

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
        },
      };
    });
  }

  const getTypeColor = (subType) => {
    switch (subType?.toLowerCase()) {
      case 'theory':
        return 'blue';
      case 'tutorial':
        return 'purple';
      case 'laboratory':
        return 'green';
      default:
        return 'gray';
    }
  };

  const totalHours = Object.values(sortedSummaryEntries).reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Box my={6}>
      <Card bg="white" borderRadius="2xl" shadow="2xl" border="1px" borderColor="gray.300" overflow="hidden">
        <CardHeader bg="cyan.600" color="white" p={4}>
          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify={{ base: "flex-start", md: "space-between" }} 
            align={{ base: "flex-start", md: "center" }}
            gap={3}
          >
            <Heading size={{ base: "sm", md: "md" }}>Timetable Summary</Heading>
            <Flex gap={2} flexWrap="wrap">
              <Badge colorScheme="orange" fontSize={{ base: "sm", md: "md" }} px={3} py={1}>
                {Object.keys(sortedSummaryEntries).length} Subjects
              </Badge>
              <Badge colorScheme="green" fontSize={{ base: "sm", md: "md" }} px={3} py={1}>
                {totalHours} Hours/Week
              </Badge>
            </Flex>
          </Flex>
        </CardHeader>
        <CardBody p={0}>
          {/* Scroll Hint for Mobile */}
          <Box 
            display={{ base: "block", lg: "none" }} 
            p={3} 
            bg="blue.50" 
            borderBottom="1px" 
            borderColor="blue.200"
          >
            <Text fontSize="xs" color="blue.700" fontWeight="medium">
              ℹ️ Scroll horizontally to view all columns →
            </Text>
          </Box>
          
          <TableContainer 
            maxH="600px" 
            overflowY="auto"
            overflowX="auto"
            sx={{
              '&::-webkit-scrollbar': {
                height: '8px',
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'gray.100',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'cyan.400',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'cyan.600',
              },
            }}
          >
            <Table variant="simple" size="sm">
              <Thead position="sticky" top={0} zIndex={1} bg="cyan.50">
                <Tr>
                  <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} minW="100px">
                    Abbreviation
                  </Th>
                  <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} minW="100px">
                    Subject Code
                  </Th>
                  <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} minW="200px">
                    Subject Name
                  </Th>
                  <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} minW="100px">
                    Type
                  </Th>
                  <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} textAlign="center" minW="80px">
                    Hours
                  </Th>
                  {type !== 'faculty' && (
                    <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} minW="150px">
                      Faculty Name
                    </Th>
                  )}
                  {type !== 'room' && (
                    <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} minW="100px">
                      Room No
                    </Th>
                  )}
                  {type !== 'sem' && (
                    <Th color="cyan.700" fontSize="xs" borderBottom="2px" borderColor="cyan.200" p={3} minW="100px">
                      Semester
                    </Th>
                  )}
                </Tr>
              </Thead>
              <Tbody>
                {Object.keys(sortedSummaryEntries).map((subCode, index) => (
                  <Tr key={subCode} _hover={{ bg: 'cyan.50' }} transition="background 0.2s">
                    <Td fontSize="sm" p={3} borderColor="gray.200" minW="100px">
                      <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
                        {sortedSummaryEntries[subCode].originalKeys.join(', ')}
                      </Text>
                    </Td>
                    <Td fontSize="sm" p={3} borderColor="gray.200" minW="100px">
                      <Badge colorScheme="purple" fontSize={{ base: "2xs", md: "xs" }} px={2} py={1}>
                        {sortedSummaryEntries[subCode].subCode}
                      </Badge>
                    </Td>
                    <Td fontSize="sm" p={3} borderColor="gray.200" minW="200px">
                      <Text fontWeight="medium" color="gray.800" noOfLines={2} fontSize={{ base: "xs", md: "sm" }}>
                        {sortedSummaryEntries[subCode].subjectFullName}
                      </Text>
                    </Td>
                    <Td fontSize="sm" p={3} borderColor="gray.200" minW="100px">
                      <Badge
                        colorScheme={getTypeColor(sortedSummaryEntries[subCode].subType)}
                        fontSize={{ base: "2xs", md: "xs" }}
                        px={2}
                        py={1}
                      >
                        {sortedSummaryEntries[subCode].subType}
                      </Badge>
                    </Td>
                    <Td fontSize="sm" p={3} borderColor="gray.200" textAlign="center" minW="80px">
                      <Badge colorScheme="teal" fontSize={{ base: "xs", md: "sm" }} px={2} py={1} fontWeight="bold">
                        {sortedSummaryEntries[subCode].count}
                      </Badge>
                    </Td>
                    {type !== 'faculty' && (
                      <Td fontSize="sm" p={3} borderColor="gray.200" minW="150px">
                        <Text color="gray.700" noOfLines={2} fontSize={{ base: "xs", md: "sm" }}>
                          {sortedSummaryEntries[subCode].faculties.join(', ') || '-'}
                        </Text>
                      </Td>
                    )}
                    {type !== 'room' && (
                      <Td fontSize="sm" p={3} borderColor="gray.200" minW="100px">
                        <Text color="gray.700" noOfLines={2} fontSize={{ base: "xs", md: "sm" }}>
                          {sortedSummaryEntries[subCode].rooms.join(', ') || '-'}
                        </Text>
                      </Td>
                    )}
                    {type !== 'sem' && type !== 'room' ? (
                      <Td fontSize="sm" p={3} borderColor="gray.200" minW="100px">
                        <Text color="gray.700" noOfLines={2} fontSize={{ base: "xs", md: "sm" }}>
                          {sortedSummaryEntries[subCode].faculties.join(', ') || '-'}
                        </Text>
                      </Td>
                    ) : (
                      type !== 'sem' && (
                        <Td fontSize="sm" p={3} borderColor="gray.200" minW="100px">
                          <Text color="gray.700" noOfLines={2} fontSize={{ base: "xs", md: "sm" }}>
                            {sortedSummaryEntries[subCode].rooms.join(', ') || '-'}
                          </Text>
                        </Td>
                      )
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {/* Total Hours Row */}
          {/* <Box bg="cyan.50" p={4} borderTop="2px" borderColor="cyan.200">
            <Flex justify="space-between" align="center">
              <Text fontWeight="bold" color="cyan.800" fontSize="md">
                Total Teaching Load:
              </Text>
              <Badge colorScheme="cyan" fontSize="lg" px={4} py={2} fontWeight="bold">
                {totalHours} Hours/Week
              </Badge>
            </Flex>
          </Box> */}
        </CardBody>
      </Card>

      {/* PDF Generator */}
      {time && (
        <Box mt={6}>
          <PDFGenerator
            timetableData={timetableData}
            summaryData={sortedSummaryEntries}
            type={type}
            ttdata={TTData}
            updatedTime={time}
            headTitle={headTitle}
            notes={notes}
          />
        </Box>
      )}
    </Box>
  );
};

export default TimetableSummary;