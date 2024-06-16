import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import {
  Box,
  Button,
  Grid,
  GridItem,
  Text,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Container } from '@chakra-ui/layout';
import Header from '../../components/header';
import {
  FaInfoCircle,
  FaFileAlt,
  FaUserFriends,
  FaChartPie,
  FaEnvelope,
} from 'react-icons/fa';

const PrmEdDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();
  const apiUrl = getEnvironment();
  const [event, setEvent] = useState(null);
  const breakpoints = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 });

  const fetchEvent = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/reviewmodule/event/getEvents/${eventId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const event = await response.json();
        setEvent(event.name);
      } else {
        console.error('Failed to fetch event');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [apiUrl]);

  // Sample data for pie charts
  const data1 = [
    { name: 'Track-1', value: 400 },
    { name: 'Track-2', value: 300 },
    { name: 'Track-3', value: 300 },
    { name: 'Track-4', value: 200 },
  ];
  const data2 = [
    { name: 'Reviewers Invited', value: 2400 },
    { name: 'Reviewers Accepted', value: 4567 },
    { name: 'Reviewers Rejected', value: 1398 },
  ];
  const data3 = [
    { name: 'Reviewers Assigned', value: 1000 },
    { name: 'Review Completed', value: 2000 },
    { name: 'Partial Review Completed', value: 1500 },
    { name: 'Awaiting Reviews', value: 3000 },
  ];
  const data4 = [
    { name: 'Accepted Papers', value: 400 },
    { name: 'Rejected Papers', value: 300 },
    { name: 'Pending Decision', value: 300 },
  ];

  const COLORS = ['#00BFFF', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box bg="white" color="white" p={4} minHeight="100vh">
      <Container maxW="7xl">
        <Header title="Welcome to the Editor Dashboard" />
        <Text fontSize="xl" align="center" mb={4}>
          {event}
        </Text>
        <Grid
          templateColumns={`repeat(auto-fit, minmax(250px, 1fr))`}
          gap={6}
          mb={8}
        >
          <Button
            width="100%"
            height="50px"
            bgGradient="linear(to-r, cyan.600, cyan.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, cyan.500, cyan.400)' }}
            onClick={() => navigate(`${location.pathname}/confdetails`)}
            leftIcon={<Icon as={FaInfoCircle} color="white" />}
          >
            Conference Details
          </Button>
          <Button
            width="100%"
            height="50px"
            bgGradient="linear(to-r, orange.600, orange.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, orange.500, orange.400)' }}
            onClick={() => navigate(`${location.pathname}/addtrack`)}
            leftIcon={<Icon as={FaChartPie} color="white" />}
          >
            Add Tracks
          </Button>
          <Button
            width="100%"
            height="50px"
            bgGradient="linear(to-r, red.600, red.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, red.500, red.400)' }}
            onClick={() => navigate(`${location.pathname}/papers`)}
            leftIcon={<Icon as={FaFileAlt} color="white" />}
          >
            Paper Details
          </Button>
          <Button
            width="100%"
            height="50px"
            bgGradient="linear(to-r, blue.600, blue.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, blue.500, blue.400)' }}
            onClick={() => navigate(`${location.pathname}/addreviewer`)}
            leftIcon={<Icon as={FaUserFriends} color="white" />}
          >
            Invite Reviewer
          </Button>
          <Button
            width="100%"
            height="50px"
            bgGradient="linear(to-r, green.600, green.500)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, green.500, green.400)' }}
            onClick={() => navigate(`${location.pathname}/addtemplate`)}
            leftIcon={<Icon as={FaEnvelope} color="white" />}
          >
            Communication Templates
          </Button>
        </Grid>

        <Grid templateColumns={`repeat(4, 1fr)`} gap={6}>
          <GridItem>
            <Box
              height={{ base: '250px', md: '350px' }}
              bg="gray.800"
              borderRadius="lg"
              p={4}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data1}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data1.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              height={{ base: '250px', md: '350px' }}
              bg="gray.800"
              borderRadius="lg"
              p={4}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data2}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {data2.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              height={{ base: '250px', md: '350px' }}
              bg="gray.800"
              borderRadius="lg"
              p={4}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data3}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#ffc658"
                    dataKey="value"
                  >
                    {data3.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              height={{ base: '250px', md: '350px' }}
              bg="gray.800"
              borderRadius="lg"
              p={4}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data4}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data4.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default PrmEdDashboard;
