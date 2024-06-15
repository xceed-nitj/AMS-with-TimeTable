import React from 'react';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getEnvironment from '../../getenvironment';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import {Grid, GridItem, Icon } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Container } from "@chakra-ui/layout";
import Header from "../../components/header";
import { FaInfoCircle, FaFileAlt, FaUserFriends, FaChartPie, FaEnvelope } from 'react-icons/fa';

const PrmEditorDashboard = () => {
  const navigate = useNavigate();
  const location =useLocation();
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      if (response.ok) {
        const event = await response.json();
        console.log(event.name)
        setEvent(event.name);
      } else {
        console.error("Failed to fetch event");
      }
    } catch (error) {
      console.error("Error:", error);
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

    // Calculate the height dynamically based on the number of items
    const calculateHeight = (dataLength) => {
        const baseHeight = 300; // Base height for each box
        const extraHeightPerItem = 20; // Additional height per item to accommodate text

        // Calculate the total height needed based on data length
        const totalHeight = baseHeight + (dataLength * extraHeightPerItem);

        return totalHeight;
    };

    return (
        <Box
            bg="white"
            p={4}
            minHeight="100vh"
        >
            <Container maxW="7xl">
                <Header title="Welcome to the Editor Dashboard" />
                  <Text fontSize="xl" align="center">{event}</Text>
                <Box p={9}>
                    <Grid
                        templateColumns={['repeat(1, 1fr)', 'repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)']}
                        gap={6}
                        mb={8}
                    >
                        <Button
                            width="100%"
                            height="50px"
                            bgGradient="linear(to-r, cyan.600, cyan.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, cyan.500, cyan.400)" }}
                            onClick={() => navigate(`${location.pathname}/confdetails`)}
                            leftIcon={<Icon as={FaInfoCircle} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Conference Details
                        </Button>
                        <Button
                            width="100%"
                            height="50px"
                            bgGradient="linear(to-r, orange.600, orange.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, orange.500, orange.400)" }}
                            onClick={() => navigate(`${location.pathname}/addtrack`)}
                            leftIcon={<Icon as={FaChartPie} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Add Tracks
                        </Button>
                        <Button
                            width="100%"
                            height="50px"
                            bgGradient="linear(to-r, red.600, red.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, red.500, red.400)" }}
                            onClick={() => navigate(`${location.pathname}/papers`)}
                            leftIcon={<Icon as={FaFileAlt} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Paper Details
                        </Button>
                        <Button
                            width="100%"
                            height="50px"
                            bgGradient="linear(to-r, blue.600, blue.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, blue.500, blue.400)" }}
                            onClick={() => navigate(`${location.pathname}/addreviewer`)}
                            leftIcon={<Icon as={FaUserFriends} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Invite Reviewer
                        </Button>
                        <Button
                            width={['100%', '100%', '230px', '230px']}
                            height="50px"
                            bgGradient="linear(to-r, green.600, green.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, green.500, green.400)" }}
                            onClick={() => navigate(`${location.pathname}/edittemplate`)}
                            leftIcon={<Icon as={FaEnvelope} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Communication Templates
                        </Button>

                    </Grid>
                    <Grid
                        templateColumns={['1fr', '1fr', 'repeat(2, 1fr)', 'repeat(4, 1fr)']}
                        gap={6}
                    >
                        <GridItem colSpan={[1, 1, 1, 1]}>
                            <Box
                                height={calculateHeight(data1.length)}
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
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </GridItem>

                        <GridItem colSpan={[1, 1, 1, 1]}>
                            <Box
                                height={calculateHeight(data2.length)}
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
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </GridItem>

                        <GridItem colSpan={[1, 1, 1, 1]}>
                            <Box
                                height={calculateHeight(data3.length)}
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
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </GridItem>

                        <GridItem colSpan={[1, 1, 1, 1]}>
                            <Box
                                height={calculateHeight(data4.length)}
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
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </GridItem>
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default PrmEditorDashboard;