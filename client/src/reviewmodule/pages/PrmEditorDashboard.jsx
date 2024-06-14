import React from 'react';
import { Box, Button,HStack,VStack, Grid, GridItem, Icon } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Container } from "@chakra-ui/layout";
import Header from "../../components/header";
import { FaInfoCircle, FaFileAlt, FaUserFriends, FaChartPie, FaEnvelope } from 'react-icons/fa';

const PrmEditorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

    <Box p={9}>
       {/* <Text fontSize="2xl" fontWeight="bold">Editor Dashboard</Text> */}
 
      <HStack spacing={7} align="center">
        <Button width="230px" height="50px" colorScheme="teal" onClick={() => navigate(`${location.pathname}/confdetails`)}>Conference Details</Button>
        <Button width="230px" height="50px" colorScheme="orange" onClick={() => navigate(`${location.pathname}/addtrack`)}>Add Tracks</Button>
        <Button width="230px" height="50px" colorScheme="red" onClick={() => navigate(`${location.pathname}/papers`)}>Paper Details</Button>
        <Button width="230px" height="50px" colorScheme="blue" onClick={() => navigate(`${location.pathname}/addreviewer`)}>Invite Reviewer</Button>
        <Button width="230px" height="50px" colorScheme="green" onClick={() => navigate(`${location.pathname}/addtemplate`)}>Communication Templates</Button>
</HStack>
<HStack>
        <ResponsiveContainer width="100%" height={300}>
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

        <ResponsiveContainer width="100%" height={300}>
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

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data4}
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
        <ResponsiveContainer width="100%" height={300}>
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

      </HStack>    </Box>
      </Container>
    </Box>
  );
};

export default PrmEditorDashboard;