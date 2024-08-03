// src/DataTable.js
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Table, Thead, Tbody, HStack, Tr, Th, Td, TableContainer, Spinner, Alert, 
  AlertIcon, Container, FormControl, FormLabel, Select, Button, Input,
  VStack, Text, Center } from '@chakra-ui/react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import {Parser} from '@json2csv/plainjs'
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

const MasterDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [filters, setFilters] = useState({});
  const [searchTerms, setSearchTerms] = useState({});

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
    "day", "slot", "subject", "subjectCode", "subjectFullName", "subjectType", 
    "subjectCredit", "faculty", "subjectDept", "offeringDept", "degree", "room", 
    "sem", "code", "mergedClass"
  ];

  const [hiddenColumns, setHiddenColumns] = useState([])
  function filterUniqueObjects(objects) { //GPT wrote this function :??
    const seen = new Set();
    return objects.filter(obj => {
        const key = JSON.stringify({
            code: obj.code,
            day: obj.day,
            degree: obj.degree,
            faculty: obj.faculty,
            mergedClass: obj.mergedClass,
            offeringDept: obj.offeringDept,
            room: obj.room,
            sem: obj.sem,
            session: obj.session,
            slot: obj.slot,
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

  const filteredData = useMemo(() => {
    return filterUniqueObjects(data.filter(item =>
      Object.entries(filters).every(([key, value]) => {
        const itemValue = item[key];
        return !value || (itemValue && itemValue.toString().toLowerCase() === value.toLowerCase());
      }) &&
      Object.entries(searchTerms).every(([key, term]) => {
        const itemValue = item[key];
        return !term || (itemValue && itemValue.toString().toLowerCase().includes(term.toLowerCase()));
      })
    ))
  }, [data, filters, searchTerms]);
  console.log('filter is', filteredData)

  const filterOptions = useMemo(() => {
    return columns.reduce((acc, column) => {
      const columnValues = data.map(item => item[column]).filter(value => value !== undefined && value !== null);
      acc[column] = Array.from(new Set(columnValues)).filter(Boolean);
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

  function downloadCSV(){
    let csvData = []
    for(let u in filteredData){
      let templist = []
      for(let k in filteredData[u])
        if(!hiddenColumns.includes(k)&&columns.includes(k))
          templist[k] = filteredData[u][k]
      csvData.push(templist)
    }
    const downloadCSV = () => {
      const parser = new Parser({ 
        fields: columns.filter(c=>!hiddenColumns.includes(c))})
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
    downloadCSV()
  }

  return (
    <>
      <Helmet>
        <title>Time Table | XCEED NITJ</title>
        <meta name="description" content="NITJ's official time table search engine for all semesters and courses" />
      </Helmet>
      <Container maxW="7xl">
        <Header title="View TimeTable" />
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
          <Button onClick={clearFilters} mb={4}>Clear Filters</Button>
          {
            !hiddenColumns.length?'': 
            <Button onClick={()=>setHiddenColumns([])} mb={4}>Show All Columns</Button>
          }
        </HStack>
        <Center><Button colorScheme='green' onClick={downloadCSV}>DOWNLOAD</Button></Center>
        <Box p={4}>
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Thead>
                <Tr>
                  {columns.filter(c=>!hiddenColumns.includes(c)).map((column) => (
                    <Th key={column}>
                      <VStack align="stretch" spacing={2}>
                        <HStack justifyContent={'space-between'}>
                          <Text fontWeight="bold" fontSize="sm">{column.charAt(0).toUpperCase() + column.slice(1)}</Text>
                          {
                            (hiddenColumns.includes(column))?'':
                            <Box aspectRatio={'1/1'} padding={'2px'} 
                            borderRadius={'50%'} color={'red'}
                            border='2px solid red' cursor={'pointer'}
                            onClick={()=>{
                              setHiddenColumns([...hiddenColumns, column])
                            }}
                            >
                            <FaMinus/></Box>
                          }

                        </HStack>
                        <Input
                          placeholder={`Search ${column}`}
                          size="sm"
                          value={searchTerms[column] || ''}
                          onChange={(e) => handleSearchChange(column, e.target.value)}
                        />
                        <Select 
                          size="sm" 
                          onChange={(e) => handleFilterChange(column, e.target.value)}
                          value={filters[column] || ''}
                        >
                          <option value="">All</option>
                          {filterOptions[column] && filterOptions[column].map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </Select>
                      </VStack>
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {filteredData.map((item) => (
                  <Tr key={item._id}>
                    {columns.filter(c=>!hiddenColumns.includes(c)).map((column) => (
                      <Td key={column}>
                        {item[column] !== undefined && item[column] !== null ? item[column].toString() : ''}
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
