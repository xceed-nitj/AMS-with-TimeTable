import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
import {
  Box,
  Container,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Select,
  VStack,
  Flex,
  Heading,
  Badge,
  Card,
  CardHeader,
  CardBody,
  FormControl,
  FormLabel,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  HStack,
  Button,
  IconButton,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { ExternalLinkIcon, DownloadIcon, CheckIcon } from '@chakra-ui/icons';
import { FaChalkboardTeacher, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';

function TimetableMasterView() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [lockedTimes, setLockedTimes] = useState({});
  const [savedTimes, setSavedTimes] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishingCode, setPublishingCode] = useState(null);
  const apiUrl = getEnvironment();
  const toast = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    fetch(`${apiUrl}/timetablemodule/allotment/session`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((sessionsData) => {
        setSessions(sessionsData);
        
        // Find current session and set as default
        const currentSession = sessionsData.find(session => {
          // You might need to adjust this logic based on how current session is marked
          // For now, selecting the first session as default
          return true;
        });
        
        if (sessionsData.length > 0) {
          setSelectedSession(sessionsData[0]); // Set first session as default
        }
      })
      .catch((error) => {
        console.error('Error fetching sessions:', error);
      });
  };

  const fetchLockedTime = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,
        { credentials: "include" }
      );
      const lockedTimeData = await response.json();
      setLockedTimes(prevLockedTimes => ({
        ...prevLockedTimes,
        [currentCode]: lockedTimeData.updatedTime.lockTimeIST,
      }));
    } catch (error) {
      console.error("Error fetching locked time data:", error);
    }
  };

  const fetchSavedTime = async (currentCode) => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/lock/viewsem/${currentCode}`,
        { credentials: "include" }
      );
      const savedTimeData = await response.json();
      setSavedTimes(prevSavedTimes => ({
        ...prevSavedTimes,
        [currentCode]: savedTimeData.updatedTime.saveTimeIST,
      }));
    } catch (error) {
      console.error("Error fetching saved time data:", error);
    }
  };

  const fetchData = () => {
    if (selectedSession) {
      setLoading(true);
      fetch(`${apiUrl}/timetablemodule/timetable/getallcodes/${selectedSession}`, { credentials: 'include' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(jsonData => {
          const uniqueDepartments = new Set();
          const uniqueData = jsonData.map(item => {
            if (!uniqueDepartments.has(item.dept)) {
              uniqueDepartments.add(item.dept);
              return {
                ...item,
              };
            }
            return null;
          }).filter(Boolean);
          setData(uniqueData);

          jsonData.forEach(item => {
            fetchLockedTime(item.code);
          });
          jsonData.forEach(item => {
            fetchSavedTime(item.code);
          });
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSession]);

  const handleSessionChange = (event) => {
    const newSession = event.target.value;
    setSelectedSession(newSession);
  };

  const handlePublish = async (code) => {
    setPublishingCode(code);
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/publish/${code}`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast({
          title: 'Published Successfully & Mail sent to all faculty members',
          description: 'Timetable has been published.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh data to show updated publish status
        fetchData();
      } else {
        throw new Error('Failed to publish');
      }
    } catch (error) {
      console.error('Error publishing timetable:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish timetable.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPublishingCode(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Timetable Admin Master View | XCEED NITJ</title>
        <meta name='description' content="Admin view for timetable management" />
      </Helmet>

      <Box bg="white" minH="100vh">
        {/* Hero Header Section - Changed gradient */}
        <Box
          bgGradient="linear(to-r, purple.500, pink.500, orange.400)"
          pt={0}
          pb={{ base: 16, md: 20, lg: 24 }}
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            opacity="0.1"
            bgImage="radial-gradient(circle, white 1px, transparent 1px)"
            bgSize="30px 30px"
          />

          {/* Header/Navbar integrated into hero */}
          <Box
            position="relative"
            zIndex={2}
            sx={{
              '& button[aria-label="Go back"]': { display: "none" },
              '& .chakra-button:first-of-type': { display: "none" },
            }}
          >
            <Header />
          </Box>

          <Container 
            maxW="7xl" 
            position="relative" 
            mt={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6, lg: 8 }}
          >
            <VStack 
              spacing={{ base: 3, md: 4 }}
              align={{ base: "center", lg: "start" }}
              textAlign={{ base: "center", lg: "left" }}
            >
              <Badge
                colorScheme="whiteAlpha"
                fontSize={{ base: "xs", md: "sm" }}
                px={{ base: 2, md: 3 }}
                py={1}
                borderRadius="full"
              >
                Admin Panel
              </Badge>
              <Heading 
                size={{ base: "xl", md: "2xl" }}
                color="white" 
                fontWeight="bold" 
                lineHeight="1.2"
              >
                Timetable Master View
              </Heading>
              <Text 
                color="whiteAlpha.900" 
                fontSize={{ base: "md", md: "lg" }}
                maxW={{ base: "full", lg: "2xl" }}
              >
                Manage and monitor all department timetables across sessions
              </Text>
            </VStack>
          </Container>
        </Box>

        <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={6} align="stretch">
            {/* Session Filter Card */}
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="2xl"
              border="1px"
              borderColor="gray.300"
              overflow="hidden"
            >
              <CardHeader bg="purple.600" color="white" p={4}>
                <Heading size="md">Select Session</Heading>
              </CardHeader>
              <CardBody p={6}>
                <FormControl>
                  <FormLabel fontWeight="semibold" color="gray.700" fontSize="sm">
                    Academic Session
                  </FormLabel>
                  <Select
                    onChange={handleSessionChange}
                    value={selectedSession}
                    borderColor="purple.300"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 1px #805AD5",
                    }}
                    size="lg"
                  >
                    {sessions.map((session) => (
                      <option key={session} value={session}>
                        {session}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </CardBody>
            </Card>

            {/* Timetables Table Card */}
            {selectedSession && (
              <Card
                bg="white"
                borderRadius="2xl"
                shadow="2xl"
                border="1px"
                borderColor="gray.300"
                overflow="hidden"
              >
                <CardHeader bg="teal.600" color="white" p={4}>
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                    <VStack align="start" spacing={0}>
                      <Heading size="md">Department Timetables</Heading>
                      <Text fontSize="xs" color="whiteAlpha.800" mt={1}>
                        Session: {selectedSession}
                      </Text>
                    </VStack>
                    <Badge colorScheme="orange" fontSize={{ base: "sm", md: "md" }} px={3} py={1}>
                      {data.length} Departments
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody p={0}>
                  {loading ? (
                    <Box p={12} textAlign="center">
                      <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="teal.500"
                        size="xl"
                      />
                      <Text mt={4} color="gray.600">Loading timetable data...</Text>
                    </Box>
                  ) : data.length === 0 ? (
                    <Box p={6}>
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>
                          No timetables found for session "{selectedSession}".
                        </AlertDescription>
                      </Alert>
                    </Box>
                  ) : (
                    <Box
                      overflowX="auto"
                      w="100%"
                      sx={{
                        '&::-webkit-scrollbar': {
                          height: '10px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'gray.100',
                          borderRadius: 'full',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'teal.400',
                          borderRadius: 'full',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: 'teal.500',
                        },
                      }}
                    >
                      <Table 
                        variant="simple" 
                        size={{ base: "sm", md: "md" }}
                        sx={{
                          tableLayout: "fixed",
                          width: "100%",
                        }}
                      >
                        <Thead bg="teal.50">
                          <Tr>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              whiteSpace="normal"
                              wordBreak="break-word"
                              width="12%"
                            >
                              Department
                            </Th>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              whiteSpace="normal"
                              wordBreak="break-word"
                              width="8%"
                            >
                              Code
                            </Th>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              whiteSpace="normal"
                              wordBreak="break-word"
                              width="15%"
                            >
                              Last Saved
                            </Th>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              whiteSpace="normal"
                              wordBreak="break-word"
                              width="15%"
                            >
                              Last Locked
                            </Th>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              whiteSpace="normal"
                              wordBreak="break-word"
                              width="10%"
                            >
                              Publish Status
                            </Th>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              textAlign="center"
                              width="10%"
                            >
                              View TT
                            </Th>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              textAlign="center"
                              width="10%"
                            >
                              Faculty Load
                            </Th>
                            <Th
                              color="teal.700"
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="bold"
                              borderBottom="2px"
                              borderColor="teal.200"
                              textAlign="center"
                              width="11%"
                            >
                              Download
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {data.map((item, index) => (
                            <Tr
                              key={item._id}
                              bg={index % 2 === 0 ? "white" : "gray.50"}
                              _hover={{ bg: "teal.50" }}
                              transition="background 0.2s"
                            >
                              <Td 
                                fontWeight="semibold" 
                                fontSize={{ base: "xs", md: "sm" }}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                p={{ base: 2, md: 3 }}
                              >
                                <Badge 
                                  colorScheme="purple" 
                                  fontSize="xs" 
                                  px={2} 
                                  py={1}
                                  whiteSpace="normal"
                                  wordBreak="break-word"
                                  display="block"
                                  textAlign="center"
                                >
                                  {item.dept}
                                </Badge>
                              </Td>
                              <Td 
                                fontSize={{ base: "xs", md: "sm" }}
                                fontWeight="medium"
                                p={{ base: 2, md: 3 }}
                              >
                                {item.code}
                              </Td>
                              <Td 
                                fontSize={{ base: "xs", md: "sm" }}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                p={{ base: 2, md: 3 }}
                              >
                                {savedTimes[item.code] !== null && savedTimes[item.code] !== undefined ? (
                                  <Text color="green.600" fontWeight="medium" fontSize="2xs">
                                    {savedTimes[item.code]}
                                  </Text>
                                ) : (
                                  <Text color="gray.500" fontSize="xs">
                                    Not saved yet
                                  </Text>
                                )}
                              </Td>
                              <Td 
                                fontSize={{ base: "xs", md: "sm" }}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                p={{ base: 2, md: 3 }}
                              >
                                {lockedTimes[item.code] !== null && lockedTimes[item.code] !== undefined ? (
                                  <Text color="orange.600" fontWeight="medium" fontSize="2xs">
                                    {lockedTimes[item.code]}
                                  </Text>
                                ) : (
                                  <Text color="gray.500" fontSize="xs">
                                    Not locked yet
                                  </Text>
                                )}
                              </Td>
                              <Td 
                                fontSize={{ base: "xs", md: "sm" }}
                                p={{ base: 2, md: 3 }}
                              >
                                {item.publish ? (
                                  <VStack spacing={0} align="start">
                                    <HStack spacing={1}>
                                      <FaCheckCircle color="green" size={12} />
                                      <Text color="green.600" fontWeight="semibold" fontSize="xs">
                                        Published
                                      </Text>
                                    </HStack>
                                    <Text color="gray.600" fontSize="2xs">
                                      {new Date(item.datePublished).toLocaleString()}
                                    </Text>
                                  </VStack>
                                ) : (
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    leftIcon={<CheckIcon />}
                                    onClick={() => handlePublish(item._id)}
                                    isLoading={publishingCode === item.code}
                                    loadingText="Publishing..."
                                    fontSize="xs"
                                    px={3}
                                    py={1}
                                  >
                                    Publish
                                  </Button>
                                )}
                              </Td>
                              <Td textAlign="center" p={{ base: 2, md: 3 }}>
                                <Tooltip label="View Timetable" placement="top" hasArrow bg="teal.600" fontSize="sm">
                                  <IconButton
                                    as="a"
                                    href={`${window.location.origin}/tt/${item.code}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<ExternalLinkIcon />}
                                    colorScheme="teal"
                                    size="sm"
                                    borderRadius="lg"
                                    boxShadow="md"
                                    _hover={{ transform: 'scale(1.05)', boxShadow: 'lg' }}
                                    transition="all 0.3s"
                                    aria-label="View Timetable"
                                  />
                                </Tooltip>
                              </Td>
                              <Td textAlign="center" p={{ base: 2, md: 3 }}>
                                <Tooltip label="View Faculty Load Allocation" placement="top" hasArrow bg="purple.600" fontSize="sm">
                                  <IconButton
                                    as="a"
                                    href={`${window.location.origin}/tt/${item.code}/generatepdf/loadallocation`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<FaChalkboardTeacher color="white" />}
                                    bg="purple.600"
                                    color="white"
                                    size="sm"
                                    borderRadius="lg"
                                    boxShadow="md"
                                    _hover={{ 
                                      transform: 'scale(1.05)', 
                                      boxShadow: 'lg',
                                      bg: 'purple.700'
                                    }}
                                    transition="all 0.3s"
                                    aria-label="View Faculty Load Allocation"
                                  />
                                </Tooltip>
                              </Td>
                              <Td textAlign="center" p={{ base: 2, md: 3 }}>
                                <Tooltip label="Download PDF" placement="top" hasArrow bg="blue.600" fontSize="sm">
                                  <IconButton
                                    as="a"
                                    href={`${window.location.origin}/tt/${item.code}/generatepdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<DownloadIcon />}
                                    colorScheme="blue"
                                    size="sm"
                                    borderRadius="lg"
                                    boxShadow="md"
                                    _hover={{ transform: 'scale(1.05)', boxShadow: 'lg' }}
                                    transition="all 0.3s"
                                    aria-label="Download PDF"
                                  />
                                </Tooltip>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </CardBody>
              </Card>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
}

export default TimetableMasterView;