// src/DataTable.js
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Alert, AlertIcon, Container, FormControl, FormLabel, Select, Button, Input, VStack, Text } from '@chakra-ui/react';
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

  const filteredData = useMemo(() => {
    return data.filter(item =>
      Object.entries(filters).every(([key, value]) => {
        const itemValue = item[key];
        return !value || (itemValue && itemValue.toString().toLowerCase() === value.toLowerCase());
      }) &&
      Object.entries(searchTerms).every(([key, term]) => {
        const itemValue = item[key];
        return !term || (itemValue && itemValue.toString().toLowerCase().includes(term.toLowerCase()));
      })
    );
  }, [data, filters, searchTerms]);

  const filterOptions = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column] = Array.from(new Set(data.map(item => item[column]))).filter(Boolean);
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
        <Button onClick={clearFilters} mb={4}>Clear Filters</Button>
        <Box p={4}>
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Thead>
                <Tr>
                  {columns.map((column) => (
                    <Th key={column}>
                      <VStack align="stretch" spacing={2}>
                        <Text fontWeight="bold" fontSize="sm">{column.charAt(0).toUpperCase() + column.slice(1)}</Text>
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
                          {filterOptions[column].map((value) => (
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
                    {columns.map((column) => (
                      <Td key={column}>{item[column] !== undefined ? item[column].toString() : ''}</Td>
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