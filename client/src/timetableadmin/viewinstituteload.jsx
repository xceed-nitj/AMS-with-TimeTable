// src/DataTable.js
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Table, Thead, Tbody, HStack, Tr, Th, Td, TableContainer, Spinner, Alert, 
  AlertIcon, Container, FormControl, FormLabel, Select, Button, Input,
  VStack, Text, Center, Spacer } from '@chakra-ui/react';
import { FaMinus } from 'react-icons/fa';
import { Parser } from '@json2csv/plainjs';
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  CustomBlueButton,
} from "../styles/customStyles";

const MasterLoadDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [filters, setFilters] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const apiUrl = getEnvironment();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const { uniqueSessions } = data;
        setAllSessions(uniqueSessions);
      } catch (error) {
        console.error('Error fetching session and department data:', error);
      }
    };
    fetchSessions();
  }, [apiUrl]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSession) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/mastertable/session/${selectedSession}`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiUrl, selectedSession]);

  const handleFilterChange = (column, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [column]: value
    }));
  };

  const handleSearchChange = (column, value) => {
    setSearchTerms(prevTerms => ({
      ...prevTerms,
      [column]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerms({});
  };

  const columns = [
    { label: "Subject Full Name", key: "subjectFullName" },
    { label: "Faculty", key: "faculty" },
    { label: "Offering Dept", key: "offeringDept" },
    { label: "Room", key: "room" },
    { label: "Subject Type", key: "subjectType" },
    { label: "Subject Dept", key: "subjectDept" },
    { label: "Sem", key: "sem" },
    { label: "Year", key: "year" },
    { label: "Degree", key: "degree" },
    { label: "Subject Code", key: "subjectCode" },
    { label: "Subject", key: "subject" },
    { label: "Subject Credit", key: "subjectCredit" },
    { label: "Load", key: "count" },
  ];

  function filterUniqueObjects(objects) {
    const seen = new Set();
    return objects.filter(obj => {
      const key = JSON.stringify({
        code: obj.code,
        degree: obj.degree,
        faculty: obj.faculty,
        mergedClass: obj.mergedClass,
        offeringDept: obj.offeringDept,
        room: obj.room,
        sem: obj.sem,
        session: obj.session,
        subject: obj.subject,
        subjectCode: obj.subjectCode,
        subjectCredit: obj.subjectCredit,
        subjectDept: obj.subjectDept,
        subjectFullName: obj.subjectFullName,
        subjectType: obj.subjectType,
        updated_at: obj.updated_at,
        year: obj.year
      });

      if (seen.has(key)) {
        return false;
      } else {
        seen.add(key);
        return true;
      }
    });
  }

  const mergeAndFilterData = (data) => {
    const mergedData = {};
    data.forEach(item => {
      const key = item.subjectCode+item.subjectType+item.sem;
      if (!mergedData[key]) {
        mergedData[key] = { 
          ...item, 
          count: 1, 
          faculty: [item.faculty],
          offeringDept: [item.offeringDept],
          room: [item.room],
        };
        delete mergedData[key].day;
        delete mergedData[key].slot;
      } else {
        mergedData[key].count += 1;
        if (!mergedData[key].faculty.includes(item.faculty)) {
          mergedData[key].faculty.push(item.faculty);
        }
        if (!mergedData[key].offeringDept.includes(item.offeringDept)) {
          mergedData[key].offeringDept.push(item.offeringDept);
        }
        if (!mergedData[key].room.includes(item.room)) {
          mergedData[key].room.push(item.room);
        }
      }
    });

    return Object.values(mergedData).map(item => ({
      ...item,
      faculty: item.faculty.sort().join(', '),
      offeringDept: item.offeringDept.join(', '),
      room: item.room.join(', '),
    }));
  };

  const filteredData = useMemo(() => {
    const filtered = filterUniqueObjects(data.filter(item =>
      item.subject && item.faculty &&
      Object.entries(filters).every(([key, value]) => {
        const itemValue = item[key];
        return !value || (itemValue && itemValue.toString().toLowerCase() === value.toLowerCase());
      }) &&
      Object.entries(searchTerms).every(([key, term]) => {
        const itemValue = item[key];
        return !term || (itemValue && itemValue.toString().toLowerCase().includes(term.toLowerCase()));
      })
    ));
    return mergeAndFilterData(filtered);
  }, [data, filters, searchTerms]);

  const filterOptions = useMemo(() => {
    return columns.reduce((acc, { key }) => {
      const columnValues = filteredData.map(item => item[key]).filter(value => value !== undefined && value !== null);
      acc[key] = Array.from(new Set(columnValues)).filter(Boolean).sort((a, b) => a.toString().localeCompare(b.toString()));
      return acc;
    }, {});
  }, [filteredData, columns]);
  
  if (loading) {
    return <Spinner size="xl" />;
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error.message}
      </Alert>
    );
  }

  const downloadCSV = () => {
    const visibleColumns = columns.filter(c => !hiddenColumns.includes(c.key));
    const csvData = filteredData.map(item => {
      const filteredItem = {};
      visibleColumns.forEach(({ key }) => {
        filteredItem[key] = item[key];
      });
      return filteredItem;
    });

    const parser = new Parser({ fields: visibleColumns.map(c => c.key) });
    const csv = parser.parse(csvData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Timetable-XCEED.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <Helmet>
        <title>Master search Time Table | XCEED NITJ</title>
        <meta name="description" content="NITJ's official time table search engine for all semesters and courses" />
      </Helmet>
      <Container maxW="7xl">
        <Header title="Timetable Master Search" />
        <FormControl id="session" my={4}>
          <FormLabel fontWeight="bold">Select Session:</FormLabel>
          <Select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} isRequired>
            <option value="">Select Session</option>
            {allSessions.map((session, index) => (
              <option key={index} value={session}>{session}</option>
            ))}
          </Select>
        </FormControl>
        <HStack>
          <CustomBlueButton onClick={clearFilters} mb={4}>Clear Filters</CustomBlueButton>
          {
            !hiddenColumns.length ? '' :
              <CustomBlueButton onClick={() => setHiddenColumns([])} mb={4}>Show All Columns</CustomBlueButton>
          }
          <Spacer />
          <Center>
            <Button colorScheme='green' onClick={downloadCSV}>Download in CSV</Button>
          </Center>
        </HStack>
        <Box p={4}>
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Thead>
                <Tr>
                  {columns.filter(c => !hiddenColumns.includes(c.key)).map(({ label, key }) => (
                    <Th key={key}>
                      <VStack align="stretch" spacing={2}>
                        <HStack justifyContent={'space-between'}>
                          <Text fontWeight="bold" fontSize="sm" color="blueviolet">{label}</Text>
                          {
                            (hiddenColumns.includes(key)) ? '' :
                              <Box aspectRatio={'1/1'} padding={'2px'}
                                borderRadius={'50%'} color={'red'}
                                border='2px solid red' cursor={'pointer'}
                                onClick={() => {
                                  setHiddenColumns([...hiddenColumns, key])
                                }}
                              >
                                <FaMinus />
                              </Box>
                          }
                        </HStack>
                        <Input
                          placeholder={`Search ${label}`}
                          size="sm"
                          value={searchTerms[key] || ''}
                          onChange={(e) => handleSearchChange(key, e.target.value)}
                        />
                        <Select
                          size="sm"
                          onChange={(e) => handleFilterChange(key, e.target.value)}
                          value={filters[key] || ''}
                        >
                          <option value="">All</option>
                          {filterOptions[key] && filterOptions[key].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </Select>
                      </VStack>
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {filteredData.map((item, index) => (
                  <Tr key={index}>
                    {columns.filter(c => !hiddenColumns.includes(c.key)).map(({ key }) => (
                      <Td key={key}>
                        {item[key] !== undefined && item[key] !== null ? item[key].toString() : ''}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </>
  );
};

export default MasterLoadDataTable;
