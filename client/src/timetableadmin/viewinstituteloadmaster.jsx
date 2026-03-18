import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Table, Thead, Tbody, HStack, Tr, Th, Td, Spinner,
  Alert, AlertIcon, Container, FormControl, FormLabel, Select,
  Button, Input, VStack, Text, IconButton, Badge, Card,
  CardHeader, CardBody, Heading, Flex, SimpleGrid, Tooltip,
  AlertDescription,
} from '@chakra-ui/react';
import { FaMinus, FaPlus, FaSearch } from 'react-icons/fa';
import { DownloadIcon, ViewIcon, RepeatIcon } from '@chakra-ui/icons';
import { Parser } from '@json2csv/plainjs';
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

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

  const columns = [
    { label: "Subject Full Name", key: "subjectFullName" },
    { label: "Faculty", key: "faculty" },
    { label: "Offering Dept", key: "offeringDept" },
    { label: "Room", key: "room" },
    { label: "Day", key: "day" },
    { label: "Slot", key: "slot" },
    { label: "Subject Type", key: "subjectType" },
    { label: "Subject Dept", key: "subjectDept" },
    { label: "Sem", key: "sem" },
    { label: "Year", key: "year" },
    { label: "Degree", key: "degree" },
    { label: "Subject Code", key: "subjectCode" },
    { label: "Subject", key: "subject" },
    { label: "Subject Credit", key: "subjectCredit" },
  ];

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
        const data = await response.json();
        setAllSessions(data.uniqueSessions);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSessions();
  }, [apiUrl]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSession) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/mastertable/session/${selectedSession}`, { credentials: 'include' });
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
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleSearchChange = (column, value) => {
    setSearchTerms(prev => ({ ...prev, [column]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerms({});
  };

  // ✅ FILTER + SEARCH + DEDUPLICATION
  const filteredData = useMemo(() => {
    const seen = new Set();

    return data
      .filter(item =>
        item.subject && item.faculty &&
        Object.entries(filters).every(([key, value]) => {
          const itemValue = item[key];
          return !value || (itemValue && itemValue.toString().toLowerCase() === value.toLowerCase());
        }) &&
        Object.entries(searchTerms).every(([key, term]) => {
          const itemValue = item[key];
          return !term || (itemValue && itemValue.toString().toLowerCase().includes(term.toLowerCase()));
        })
      )
      .filter(item => {
        const uniqueKey = columns
          .map(col => item[col.key]?.toString().trim().toLowerCase() || '')
          .join('|');

        if (seen.has(uniqueKey)) return false;
        seen.add(uniqueKey);
        return true;
      });

  }, [data, filters, searchTerms, columns]);

  const filterOptions = useMemo(() => {
    return columns.reduce((acc, { key }) => {
      const values = filteredData.map(item => item[key]).filter(Boolean);
      acc[key] = Array.from(new Set(values)).sort((a, b) => a.toString().localeCompare(b.toString()));
      return acc;
    }, {});
  }, [filteredData]);

  const downloadCSV = () => {
    const visibleColumns = columns.filter(c => !hiddenColumns.includes(c.key));
    const parser = new Parser({ fields: visibleColumns.map(c => c.key) });

    const csv = parser.parse(filteredData.map(item => {
      const obj = {};
      visibleColumns.forEach(({ key }) => obj[key] = item[key]);
      return obj;
    }));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Timetable-XCEED.csv';
    link.click();
  };

  return (
    <>
      <Helmet>
        <title>Master Search Timetable | XCEED-NITJ</title>
      </Helmet>

      <Box bg="white" minH="100vh">
        <Header />

        <Container maxW="7xl" py={6}>
          {/* Session Select */}
          <Card mb={4}>
            <CardHeader><Heading size="sm">Select Session</Heading></CardHeader>
            <CardBody>
              <Select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                placeholder="Select Session"
              >
                {allSessions.map((s, i) => (
                  <option key={i} value={s.session}>{s.session}</option>
                ))}
              </Select>
            </CardBody>
          </Card>

          {selectedSession && (
            <Card>
              <CardHeader>
                <Flex justify="space-between">
                  <Heading size="sm">Results</Heading>
                  <Badge>{filteredData.length} Records</Badge>
                </Flex>
              </CardHeader>

              <CardBody>
                {loading ? <Spinner /> : error ? (
                  <Alert status="error"><AlertIcon />{error.message}</Alert>
                ) : (
                  <Box overflowX="auto">
                    <Table>
                      <Thead>
                        <Tr>
                          {columns.map(({ label, key }) => (
                            <Th key={key}>
                              <VStack>
                                <Text>{label}</Text>
                                <Input
                                  size="sm"
                                  placeholder="Search"
                                  onChange={(e) => handleSearchChange(key, e.target.value)}
                                />
                                <Select
                                  size="sm"
                                  onChange={(e) => handleFilterChange(key, e.target.value)}
                                >
                                  <option value="">All</option>
                                  {filterOptions[key]?.map(val => (
                                    <option key={val}>{val}</option>
                                  ))}
                                </Select>
                              </VStack>
                            </Th>
                          ))}
                        </Tr>
                      </Thead>

                      <Tbody>
                        {filteredData.map((item, i) => (
                          <Tr key={i}>
                            {columns.map(({ key }) => (
                              <Td key={key}>
                                {key === 'subjectType' ? (
                                  <Badge>{item[key]}</Badge>
                                ) : item[key]}
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>
          )}
        </Container>
      </Box>
    </>
  );
};

export default MasterLoadDataTable;