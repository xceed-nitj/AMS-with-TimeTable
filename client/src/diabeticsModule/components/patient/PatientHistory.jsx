import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  useToast,
  useColorModeValue,
  HStack,
  VStack,
  IconButton,
  Card,
  CardBody,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  FiDownload,
  FiArrowLeft,
  FiPrinter,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { axiosInstance } from '../../api/config';

export default function PatientHistory({ patientId }) {
  const [readings, setReadings] = useState([]);
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    session: '',
    bloodSugarMin: '',
    bloodSugarMax: '',
  });
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const tableRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  // Formatted date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Fetch patient data
  const fetchPatientData = async () => {
    try {
      if (!patientId) {
        return;
      }

      const res = await axiosInstance.get(
        `/diabeticsModule/patient/${patientId}`
      );
      setPatient(res.data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  // Fetch all readings for the patient
  const fetchReadings = async () => {
    try {
      setLoading(true);
      if (!patientId) return;

      const res = await axiosInstance.get(
        `/diabeticsModule/dailyDosage/all/${patientId}`
      );
      setReadings(res.data || []);
      setFilteredReadings(res.data || []);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
    fetchReadings();
  }, [patientId]);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...readings];

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(
        (item) => new Date(item.data.date) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter((item) => new Date(item.data.date) <= endDate);
    }

    if (filters.session) {
      filtered = filtered.filter(
        (item) => item.data.session === filters.session
      );
    }

    if (filters.bloodSugarMin) {
      filtered = filtered.filter(
        (item) => item.data.bloodSugar >= Number(filters.bloodSugarMin)
      );
    }

    if (filters.bloodSugarMax) {
      filtered = filtered.filter(
        (item) => item.data.bloodSugar <= Number(filters.bloodSugarMax)
      );
    }

    setFilteredReadings(filtered);
    setPage(1); // Reset to first page when applying filters
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      session: '',
      bloodSugarMin: '',
      bloodSugarMax: '',
    });
    setFilteredReadings(readings);
    setPage(1);
  };

  // Export data to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text('Diabetes Health Log', 14, 22);

      // Add patient info
      doc.setFontSize(12);
      doc.text(`Patient: ${patient?.name || 'Unknown'}`, 14, 32);
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 38);

      // Create table
      const tableColumn = [
        'Date',
        'Session',
        'Blood Sugar',
        'Carbs',
        'Insulin',
      ];
      const tableRows = filteredReadings.map((item) => [
        formatDate(item.data.date),
        item.data.session,
        `${item.data.bloodSugar} mg/dL`,
        `${item.data.carboLevel} g`,
        `${item.data.insulin} units`,
      ]);

      // Generate PDF table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Save the PDF
      doc.save(`diabetes-log-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'PDF Exported',
        description: 'Your health log has been exported to PDF',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Unable to export PDF. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = [
        'Date',
        'Session',
        'Blood Sugar (mg/dL)',
        'Carbs (g)',
        'Insulin (units)',
        'Long Insulin (units)',
        'Activity',
      ];
      const rows = filteredReadings.map((item) => [
        formatDate(item.data.date),
        item.data.session,
        item.data.bloodSugar,
        item.data.carboLevel,
        item.data.insulin,
        item.data.longLastingInsulin,
        item.data.physicalActivity,
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `diabetes-log-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Exported',
        description: 'Your health log has been exported to CSV',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Unable to export CSV. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredReadings.length / itemsPerPage);
  const pageStart = (page - 1) * itemsPerPage;
  const pageEnd = pageStart + itemsPerPage;
  const currentReadings = filteredReadings.slice(pageStart, pageEnd);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex direction="column">
        <Flex align="center" mb={8}>
          <Button
            onClick={() => navigate(-1)}
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            mr={4}
          >
            Go Back
          </Button>
          <Heading flex="1">Health History</Heading>
          <HStack spacing={2}>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="teal"
              variant="outline"
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
            <Button
              leftIcon={<FiPrinter />}
              colorScheme="teal"
              onClick={exportToPDF}
            >
              Export PDF
            </Button>
          </HStack>
        </Flex>

        {/* Patient Details Card */}
        {patient && (
          <Card mb={6} boxShadow="md">
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Patient Information</Heading>
                  <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                    ID: {patient._id}
                  </Badge>
                </Flex>
                <Divider />
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Stat>
                    <StatLabel>Name</StatLabel>
                    <StatNumber fontSize="xl">{patient.name}</StatNumber>
                    <StatHelpText>Age: {patient.age} years</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Contact</StatLabel>
                    <StatNumber fontSize="xl">{patient.phone}</StatNumber>
                    <StatHelpText>{patient.email}</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Address</StatLabel>
                    <StatNumber fontSize="xl">{patient.address}</StatNumber>
                    <StatHelpText>City: {patient.city}</StatHelpText>
                  </Stat>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Filters Section */}
        {/* <Box
          p={6}
          borderRadius="lg"
          borderWidth="1px"
          bg={bg}
          mb={6}
          boxShadow="sm"
        >
          <Flex align="center" mb={4}>
            <Icon as={FiFilter} mr={2} />
            <Heading size="md">Filter Records</Heading>
          </Flex>

          <Grid
            templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }}
            gap={4}
          >
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Date Range</FormLabel>
                <Flex gap={2}>
                  <Input
                    name="startDate"
                    type="date"
                    placeholder="From"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    size="sm"
                  />
                  <Input
                    name="endDate"
                    type="date"
                    placeholder="To"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    size="sm"
                  />
                </Flex>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Session</FormLabel>
                <Select
                  name="session"
                  value={filters.session}
                  onChange={handleFilterChange}
                  placeholder="All Sessions"
                  size="sm"
                >
                  <option value="pre-breakfast">Pre-Breakfast</option>
                  <option value="pre-lunch">Pre-Lunch</option>
                  <option value="pre-dinner">Pre-Dinner</option>
                  <option value="night">Night</option>
                </Select>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Blood Sugar Range (mg/dL)</FormLabel>
                <Flex gap={2}>
                  <Input
                    name="bloodSugarMin"
                    type="number"
                    placeholder="Min"
                    value={filters.bloodSugarMin}
                    onChange={handleFilterChange}
                    size="sm"
                  />
                  <Input
                    name="bloodSugarMax"
                    type="number"
                    placeholder="Max"
                    value={filters.bloodSugarMax}
                    onChange={handleFilterChange}
                    size="sm"
                  />
                </Flex>
              </FormControl>
            </GridItem>
          </Grid>

          <Flex justify="flex-end" mt={4}>
            <Button variant="outline" mr={2} onClick={resetFilters} size="sm">
              Reset
            </Button>
            <Button
              colorScheme="teal"
              onClick={applyFilters}
              leftIcon={<FiSearch />}
              size="sm"
            >
              Apply Filters
            </Button>
          </Flex>
        </Box> */}

        {/* Results Table */}
        <Box
          borderRadius="lg"
          borderWidth="1px"
          overflow="hidden"
          bg={bg}
          boxShadow="md"
          mb={4}
        >
          <Box overflowX="auto">
            <Table variant="simple" ref={tableRef}>
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Time</Th>
                  <Th>Session</Th>
                  <Th>Blood Sugar</Th>
                  <Th>Carbs</Th>
                  <Th>Insulin</Th>
                  <Th>Long Insulin</Th>
                  <Th>Activity</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentReadings.length > 0 ? (
                  currentReadings.map((reading, index) => (
                    <Tr key={reading._id || index}>
                      <Td>{formatDate(reading.data.date)}</Td>
                      <Td>
                        {new Date(reading.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            reading.data.session === 'pre-breakfast'
                              ? 'blue'
                              : reading.data.session === 'pre-lunch'
                              ? 'green'
                              : reading.data.session === 'pre-dinner'
                              ? 'orange'
                              : 'purple'
                          }
                        >
                          {reading.data.session}
                        </Badge>
                      </Td>
                      <Td>
                        <Text
                          fontWeight="medium"
                          color={
                            reading.data.bloodSugar > 180
                              ? 'red.500'
                              : reading.data.bloodSugar < 70
                              ? 'orange.500'
                              : 'green.500'
                          }
                        >
                          {reading.data.bloodSugar} mg/dL
                        </Text>
                      </Td>
                      <Td>{reading.data.carboLevel} g</Td>
                      <Td>{reading.data.insulin} units</Td>
                      <Td>{reading.data.longLastingInsulin || 0} units</Td>
                      <Td>{reading.data.physicalActivity || 'N/A'}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={8} textAlign="center" py={4}>
                      <Text color="gray.500">
                        No records found matching your criteria
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="center" align="center" mt={4}>
            <IconButton
              icon={<FiChevronLeft />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              isDisabled={page === 1}
              aria-label="Previous page"
              mr={2}
            />
            <Text px={4}>
              Page {page} of {totalPages}
            </Text>
            <IconButton
              icon={<FiChevronRight />}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              isDisabled={page === totalPages}
              aria-label="Next page"
              ml={2}
            />
          </Flex>
        )}
      </Flex>
    </Container>
  );
}
