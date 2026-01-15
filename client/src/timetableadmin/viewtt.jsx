import React, { useState, useEffect } from 'react';
import { 
  Container,
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  Card,
  CardBody,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";

const ViewTimetable = ({ timetableData, tableSummary, headerDetails }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  console.log('data sent to view', timetableData);

  // Modern color palette matching the theme
  const colorList = [
    { bg: 'purple.100', text: 'purple.800', border: 'purple.300' },
    { bg: 'teal.100', text: 'teal.800', border: 'teal.300' },
    { bg: 'cyan.100', text: 'cyan.800', border: 'cyan.300' },
    { bg: 'blue.100', text: 'blue.800', border: 'blue.300' },
    { bg: 'pink.100', text: 'pink.800', border: 'pink.300' },
    { bg: 'orange.100', text: 'orange.800', border: 'orange.300' },
    { bg: 'green.100', text: 'green.800', border: 'green.300' },
    { bg: 'red.100', text: 'red.800', border: 'red.300' },
    { bg: 'indigo.100', text: 'indigo.800', border: 'indigo.300' },
    { bg: 'yellow.100', text: 'yellow.800', border: 'yellow.300' },
  ];

  let colorDict = {};
  
  function colorManager(val) {
    function freshColor() {
      const usedColors = Object.values(colorDict);
      const availableColor = colorList.find(
        (c) => !usedColors.some((used) => used.bg === c.bg)
      );
      return availableColor || colorList[0];
    }
    
    if (!val) return null;
    
    if (!{}.propertyIsEnumerable.call(colorDict, val)) {
      colorDict[val] = freshColor();
    }
    
    return colorDict[val];
  }

  const periods = [
    '8:30 AM - 9:25 AM',
    '9:30 AM - 10:25 AM',
    '10:30 AM - 11:25 AM',
    '11:30 AM - 12:25 PM',
    '12:30 PM - 1:30 PM',
    '1:30 PM - 2:25 PM',
    '2:30 PM - 3:25 PM',
    '3:30 PM - 4:25 PM',
    '4:30 PM - 5:25 PM',
  ];

  return (
    <Box my={6}>
      {Object.keys(timetableData).length === 0 ? (
        <Card borderRadius="2xl" shadow="xl" border="1px" borderColor="gray.200">
          <CardBody p={12}>
            <VStack spacing={4}>
              <Spinner size="xl" thickness="4px" color="purple.500" speed="0.65s" />
              <Text color="gray.600" fontSize="lg">Loading timetable...</Text>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Box id="timetable-summary">
          <Box mb={3} p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
            <Text fontSize="sm" color="blue.700" fontWeight="medium">
              ℹ️ Scroll horizontally to view all periods →
            </Text>
          </Box>
          <TableContainer
            borderRadius="2xl"
            overflowX="auto"
            overflowY="hidden"
            border="2px"
            borderColor="gray.300"
            shadow="xl"
            bg="white"
            maxW="100%"
            sx={{
              '&::-webkit-scrollbar': {
                height: '12px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'gray.100',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'purple.400',
                borderRadius: '6px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'purple.600',
              },
            }}
          >
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  <Th
                    bgGradient="linear(to-r, purple.600, purple.700)"
                    color="white"
                    fontWeight="bold"
                    fontSize="sm"
                    textAlign="center"
                    p={4}
                    borderRightWidth="2px"
                    borderColor="purple.800"
                    minW="140px"
                    w="140px"
                  >
                    Day / Period
                  </Th>
                  {periods.map((period, index) => (
                    <Th
                      key={period}
                      bg={period === '12:30 PM - 1:30 PM' ? 'orange.500' : 'teal.600'}
                      color="white"
                      textAlign="center"
                      fontSize="sm"
                      p={3}
                      whiteSpace="nowrap"
                      fontWeight="bold"
                      borderRightWidth={index < periods.length - 1 ? "1px" : "0"}
                      borderColor="whiteAlpha.400"
                      minW="180px"
                      w="180px"
                    >
                      {period === '12:30 PM - 1:30 PM' ? (
                        <VStack spacing={0.5}>
                          <Text fontSize="sm" fontWeight="bold">LUNCH</Text>
                          <Text fontSize="xs" opacity={0.9}>{period}</Text>
                        </VStack>
                      ) : (
                        <VStack spacing={0.5}>
                          <Text fontSize="sm" fontWeight="bold">Period {index >= 4 ? index : index + 1}</Text>
                          <Text fontSize="xs" opacity={0.9}>{period}</Text>
                        </VStack>
                      )}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {days.map((day, dayIndex) => (
                  <Tr
                    key={day}
                    _hover={{ bg: 'gray.50' }}
                    transition="background 0.2s"
                  >
                    <Td
                      bgGradient="linear(to-r, purple.600, purple.700)"
                      color="white"
                      textAlign="center"
                      fontWeight="bold"
                      fontSize="md"
                      p={4}
                      borderRightWidth="2px"
                      borderColor="purple.800"
                      minW="140px"
                      w="140px"
                    >
                      {day}
                    </Td>
                    {[1, 2, 3, 4, 'Lunch', 5, 6, 7, 8].map((period, periodIndex) => (
                      <Td
                        key={period}
                        textAlign="center"
                        p={period === 'Lunch' ? 3 : 4}
                        bg={period === 'Lunch' ? 'orange.50' : 'white'}
                        borderRightWidth={periodIndex < 8 ? "1px" : "0"}
                        borderColor="gray.200"
                        verticalAlign="top"
                        minW="180px"
                        w="180px"
                        _hover={{
                          bg: period === 'Lunch' ? 'orange.100' : 'purple.50',
                        }}
                        transition="all 0.2s"
                      >
                        {period === 'Lunch' ? (
                          <Box>
                            {timetableData[day]['lunch'] && timetableData[day]['lunch'].length > 0 ? (
                              timetableData[day]['lunch'].map((slot, slotIndex) => (
                                <VStack key={slotIndex} spacing={2} align="stretch">
                                  {slot.map((cell, cellIndex) => {
                                    const colors = colorManager(cell.subject);
                                    return (
                                      <Box
                                        key={cellIndex}
                                        p={3}
                                        borderRadius="md"
                                        bg={colors?.bg || 'orange.100'}
                                        borderWidth="1px"
                                        borderColor={colors?.border || 'orange.300'}
                                        shadow="sm"
                                        _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                        transition="all 0.2s"
                                      >
                                        <VStack spacing={1} align="center">
                                          {cell.subject && (
                                            <Text
                                              fontSize="sm"
                                              fontWeight="bold"
                                              color={colors?.text || 'orange.800'}
                                              noOfLines={2}
                                              title={cell.subject}
                                            >
                                              {cell.subject}
                                            </Text>
                                          )}
                                          {cell.room && (
                                            <Badge
                                              colorScheme="blue"
                                              fontSize="xs"
                                              px={2}
                                              py={0.5}
                                            >
                                              {cell.room}
                                            </Badge>
                                          )}
                                          {cell.faculty && (
                                            <Text
                                              fontSize="xs"
                                              color="gray.600"
                                              noOfLines={2}
                                              title={cell.faculty}
                                            >
                                              {cell.faculty}
                                            </Text>
                                          )}
                                        </VStack>
                                      </Box>
                                    );
                                  })}
                                </VStack>
                              ))
                            ) : (
                              <VStack spacing={1}>
                                <Text fontSize="md" fontWeight="bold" color="orange.700">
                                  Lunch Break
                                </Text>
                              </VStack>
                            )}
                          </Box>
                        ) : (
                          <VStack spacing={2} align="stretch">
                            {timetableData[day][`period${period}`].map((slot, slotIndex) => (
                              <Box key={slotIndex}>
                                {slot.map((cell, cellIndex) => {
                                  const colors = colorManager(cell.subject);
                                  
                                  // Empty cell
                                  if (!cell.subject && !cell.room && !cell.faculty) {
                                    return (
                                      <Box
                                        key={cellIndex}
                                        p={4}
                                        borderRadius="md"
                                        bg="gray.50"
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        borderStyle="dashed"
                                      >
                                        <Text fontSize="sm" color="gray.400" textAlign="center">
                                          Free
                                        </Text>
                                      </Box>
                                    );
                                  }
                                  
                                  return (
                                    <Box
                                      key={cellIndex}
                                      p={3}
                                      borderRadius="md"
                                      bg={colors?.bg || 'gray.100'}
                                      borderWidth="1px"
                                      borderColor={colors?.border || 'gray.300'}
                                      shadow="sm"
                                      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                                      transition="all 0.2s"
                                      mb={slot.length > 1 && cellIndex < slot.length - 1 ? 2 : 0}
                                    >
                                      <VStack spacing={1} align="center">
                                        {cell.subject && (
                                          <Text
                                            fontSize="sm"
                                            fontWeight="bold"
                                            color={colors?.text || 'gray.800'}
                                            noOfLines={2}
                                            title={cell.subject}
                                            textAlign="center"
                                          >
                                            {cell.subject}
                                          </Text>
                                        )}
                                        {cell.room && (
                                          <Badge
                                            colorScheme="blue"
                                            fontSize="xs"
                                            px={2}
                                            py={0.5}
                                          >
                                            {cell.room}
                                          </Badge>
                                        )}
                                        {cell.faculty && (
                                          <Text
                                            fontSize="xs"
                                            color="gray.600"
                                            noOfLines={2}
                                            title={cell.faculty}
                                            textAlign="center"
                                          >
                                            {cell.faculty}
                                          </Text>
                                        )}
                                      </VStack>
                                    </Box>
                                  );
                                })}
                              </Box>
                            ))}
                          </VStack>
                        )}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {/* Color Legend */}
          <Box mt={4} p={4} bg="white" borderRadius="xl" border="1px" borderColor="gray.200" shadow="md">
            <Text fontSize="md" fontWeight="bold" color="gray.700" mb={3}>
              📚 Subject Color Legend:
            </Text>
            <Flex flexWrap="wrap" gap={2}>
              {Object.entries(colorDict).map(([subject, colors]) => (
                <Badge
                  key={subject}
                  bg={colors.bg}
                  color={colors.text}
                  borderWidth="1px"
                  borderColor={colors.border}
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="semibold"
                >
                  {subject}
                </Badge>
              ))}
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ViewTimetable;