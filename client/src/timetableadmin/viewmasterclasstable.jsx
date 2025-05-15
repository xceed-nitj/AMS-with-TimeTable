import React, { useEffect, useState, useMemo } from 'react';
import { Box, Table, Thead, Tbody, HStack, Tr, Th, Td, TableContainer, Spinner, Alert, 
  AlertIcon, Container, FormControl, FormLabel, Select, Button, Input,
  VStack, Text, Center, Spacer } from '@chakra-ui/react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { Parser } from '@json2csv/plainjs';
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  CustomBlueButton,
} from "../styles/customStyles";

const MasterDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [filters, setFilters] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [refresh, setRefresh] = useState(false)
  if(refresh===true) {setRefresh(filters); setFilters({})} // this makes the filters take effect when columns are hidden, pls dont judge
  else if(refresh!==false) {setFilters(refresh); setRefresh(false)} // this is just a workaround
  const apiUrl = getEnvironment();

  const slotTimeMapping = {
    period1: "8.30 AM - 9:25 AM",
    period2: "9.30 AM - 10:25 AM",
    period3: "10.30 AM - 11:25 AM",
    period4: "11.30 AM - 12:25 PM",
    period5: "1.30 PM - 2:25 PM",
    period6: "2.30 PM - 3:25 PM",
    period7: "3.30 PM - 4:25 PM",
    period8: "4.30 PM - 5:25 PM",
  };

  const getTimeFromSlot = (slot) => slotTimeMapping[slot] || slot;
  const getSlotFromTime = (time) => {
    for (const [key, value] of Object.entries(slotTimeMapping)) {
      if (value === time) return key;
    }
    return time;
  };
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
      [column]: column === 'slot' ? getSlotFromTime(value) : value
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
    { label: "Day", key: "day" },
    { label: "Slot", key: "slot" },
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
  ];

  function filterUniqueObjects(objects) {
    const seen = new Set();
    return objects.filter(obj => {
      const key = JSON.stringify({
        // code: obj.code,
        day: (hiddenColumns.includes('day'))?'reserve':obj.day,
        degree: (hiddenColumns.includes('degree'))?'reserve':obj.degree,
        faculty: (hiddenColumns.includes('faculty'))?'reserve':obj.faculty,
        // mergedClass: (hiddenColumns.includes(''))?'reserve':obj.mergedClass,
        offeringDept: (hiddenColumns.includes('offeringDept'))?'reserve':obj.offeringDept,
        room: (hiddenColumns.includes('room'))?'reserve':obj.room,
        sem: (hiddenColumns.includes('sem'))?'reserve':obj.sem,
        // session: (hiddenColumns.includes('session'))?'reserve':obj.session,
        slot: (hiddenColumns.includes('slot'))?'reserve':obj.slot,
        subject: (hiddenColumns.includes('subject'))?'reserve':obj.subject,
        subjectCode: (hiddenColumns.includes('subjectCode'))?'reserve':obj.subjectCode,
        subjectCredit: (hiddenColumns.includes('subjectCredit'))?'reserve':obj.subjectCredit,
        subjectDept: (hiddenColumns.includes('subjectDept'))?'reserve':obj.subjectDept,
        subjectFullName: (hiddenColumns.includes('subjectFullName'))?'reserve':obj.subjectFullName,
        subjectType: (hiddenColumns.includes('subjectType'))?'reserve':obj.subjectType,
        // updated_at: obj.updated_at,/
        year: (hiddenColumns.includes('year'))?'reserve':obj.year
      });
      if (seen.has(key)) {
        return false;
      } else {
        seen.add(key);
        return true;
      }
    });
  }

  const filteredData = useMemo(() => {
    return filterUniqueObjects(data.filter(item =>
      item.subject && item.faculty &&
      Object.entries(filters).every(([key, value]) => {
        const itemValue = item[key];
        if (key === 'slot') {
          return !value || (itemValue && itemValue === value);
        }
        return !value || (itemValue && itemValue.toString().toLowerCase() === value.toLowerCase());
      }) &&
      Object.entries(searchTerms).every(([key, term]) => {
        const itemValue = item[key];
        return !term || (itemValue && itemValue.toString().toLowerCase().includes(term.toLowerCase()));
      })
    ));
  }, [data, filters, searchTerms]);

  const filterOptions = useMemo(() => {
    return columns.reduce((acc, { key }) => {
      const columnValues = data.map(item => item[key]).filter(value => value !== undefined && value !== null);
      acc[key] = Array.from(new Set(columnValues)).filter(Boolean);
      if (key === 'slot') {
        acc[key] = acc[key].sort((a, b) => a.localeCompare(b));
      } else if (key === 'day') {
        acc[key] = acc[key].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      } else {
        acc[key] = acc[key].sort((a, b) => a.toString().localeCompare(b.toString()));
      }
      return acc;
    }, {});
  }, [data, columns]);

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
        filteredItem[key] = key === 'slot' ? getTimeFromSlot(item[key]) : item[key];
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
              <option key={index} value={session.session}>{session.session}</option>
            ))}
          </Select>
        </FormControl>
        <HStack flexWrap={'wrap'}>
          <CustomBlueButton onClick={clearFilters} mb={4}>Clear Filters</CustomBlueButton>
          {
            !hiddenColumns.length ? '' :
              <CustomBlueButton onClick={() => {setHiddenColumns([]); setRefresh(true)}} mb={4}>Show All Columns</CustomBlueButton>
          }
          <Spacer />
          <Center>
            <Button colorScheme='green' onClick={downloadCSV}>Download in CSV</Button>
          </Center>
        </HStack>
        <Box p={4}>
          <TableContainer style={{transform:'rotateX(180deg)'}}>
            <Table style={{transform:'rotateX(-180deg)'}} variant="striped" colorScheme="teal">
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
                                  setHiddenColumns([...hiddenColumns, key]);
                                  setRefresh(true)
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
  value={key === 'slot' ? getTimeFromSlot(filters[key] || '') : (filters[key] || '')}
>
  <option value="">All</option>
  {filterOptions[key] && filterOptions[key].map((value) => (
    <option 
      key={value} 
      value={key === 'slot' ? getTimeFromSlot(value) : value}
    >
      {key === 'slot' ? getTimeFromSlot(value) : value}
    </option>
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
                    {!refresh&& columns.filter((e)=>{return hiddenColumns||true}).filter(c => !hiddenColumns.includes(c.key)).map(({ key }) => (
                      <Td key={key}>
                        {key === 'slot' ? getTimeFromSlot(item[key]) : item[key]}
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

export default MasterDataTable;