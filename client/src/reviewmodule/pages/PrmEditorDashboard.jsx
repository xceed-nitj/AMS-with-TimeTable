import React from 'react';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getEnvironment from '../../getenvironment';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import {Grid, GridItem, Icon } from '@chakra-ui/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Container } from "@chakra-ui/layout";
import Header from "../../components/header";
import { FaInfoCircle, FaFileAlt, FaUserFriends, FaChartPie, FaEnvelope, FaPlay, FaBullseye } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi'

const PrmEditorDashboard = () => {
  const navigate = useNavigate();
  const location =useLocation();
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [table, setTable] = useState([]);
  const [trackcount, setTrackCount] = useState([]);
  const [paperStatus, setPaperStatus] = useState([]);
  const [reviewStatus, setReviewStatus] = useState([]);
  const [counts, setCounts] = useState({ Accepted: 0, Invited: 0, NotAccepted: 0 });
  const [startSubmission, setStartSubmission] = useState(true)

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
        console.log(event)
        setEvent(event.name);
        if(event.startSubmission) setStartSubmission(true)
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

  
  const fetchReviewer = async () => {
    try {
      const response = await fetch(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      if(response.ok) {
        const data = await response.json();
        setTable(data.reviewer);
      } else {
        console.error("Failed to fetch reviewer details");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  useEffect(() => {
    console.log("Fetching reviewer details with apiUrl:", apiUrl);
    fetchReviewer();
  }, [apiUrl]);

  useEffect(() => {
    let AcceptedCount = 0;
    let InvitedCount = 0;
    let NotAcceptedCount = 0;
    table.forEach(reviewer => {
        if (reviewer.status === "Accepted") AcceptedCount++;
        if (reviewer.status === "Invited") InvitedCount++;
        if (reviewer.status === "Not Accepted") NotAcceptedCount++;
      });
    setCounts({
        Accepted: AcceptedCount,
        Invited: InvitedCount,
        NotAccepted: NotAcceptedCount,
      });
  },[table])

  const fetchCount = async () => {
    try {
      const response = await fetch(`${apiUrl}/reviewmodule/paper/trackcount/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      if(response.ok) {
        const data = await response.json();
        // console.log(data);
        setTrackCount(data);
      } else {
        console.error("Failed to fetch reviewer details");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  useEffect(() => {
    console.log("Fetching Count with apiUrl:", apiUrl);
    fetchCount();
  }, [apiUrl]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/reviewmodule/paper/status/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      if(response.ok) {
        const data = await response.json();
        setPaperStatus(data);
      } else {
        console.error("Failed to fetch reviewer details");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  useEffect(() => {
    console.log("Fetching Status with apiUrl:", apiUrl);
    fetchStatus();
  }, [apiUrl]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${apiUrl}/reviewmodule/paper/trackreviews/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      if(response.ok) {
        const data = await response.json();
        setReviewStatus(data);
      } else {
        console.error("Failed to fetch reviewer details");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  useEffect(() => {
    console.log("Fetching review status with apiUrl:", apiUrl);
    fetchReviews();
  }, [apiUrl]);
  const trackCountsArray = Object.values(trackcount);

    const data1 = trackCountsArray.map(item => ({
        name: item.name,
        value: item.count
    }));
    // Sample data for pie charts
    const data2 = [
        { name: 'Reviewers Invited', value : counts.Invited},
        { name: 'Reviewers Accepted', value: counts.Accepted },
        { name: 'Reviewers Rejected', value: counts.NotAccepted },
    ];
    const data3 = [
        { name: 'Completed Reviews', value: reviewStatus.completed },
        { name: 'Partially Completed Reviews', value: reviewStatus.partial },
        { name: 'Not Received Any Reviews', value: reviewStatus.notReceived },
        // { name: 'Awaiting Reviews', value: 3000 },
    ];
    const data4 = [
        { name: 'Accepted Papers', value: paperStatus.accepted },
        { name: 'Rejected Papers', value: paperStatus.rejected },
        { name: 'Under Review', value: paperStatus.underreview },
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
                        {/* <Button
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
                        </Button> */}
                        <Button
                            width="100%"
                            height="50px"
                            bgGradient="linear(to-r, yellow.600, yellow.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, yellow.500, yellow.400)" }}
                            onClick={() => navigate(`${location.pathname}/startSubmission`)}
                            leftIcon={<Icon as={FaBullseye} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Start Submission
                        </Button>
                        <Button
                            isDisabled = {!startSubmission}
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
                            isDisabled = {!startSubmission}
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
                            isDisabled = {!startSubmission}
                            width='100%'
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
                        <Button
                            width="100%"
                            height="50px"
                            bgGradient="linear(to-r, purple.600, purple.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, orange.500, orange.400)" }}
                            onClick={()=> navigate(`${location.pathname}/forms`)}
                            leftIcon={<Icon as={FiCheckCircle} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Forms
                        </Button>
                        {/* <Button
                            width='100%'
                            height="50px"
                            bgGradient="linear(to-r, purple.600, purple.500)"
                            color="white"
                            _hover={{ bgGradient: "linear(to-r, purple.500, purple.400)" }}
                            onClick={() => navigate(`/prm/${eventId}/ReviewQuestionHome`)}
                            leftIcon={<Icon as={FiCheckCircle} color="white" />}
                            whiteSpace="normal" // Ensure text wraps within the button
                        >
                            Review Questions
                        </Button> */}
                        

                    </Grid>
                    {
                        !startSubmission &&
                        <Text style={{color: 'gray', textAlign:'center', paddingBottom:'30px'}} >Start submission to enable other options...</Text>
                    }
                    <Grid
                        templateColumns={['1fr', '1fr', 'repeat(2, 1fr)', 'repeat(4, 1fr)']}
                        gap={6}
                    >
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
