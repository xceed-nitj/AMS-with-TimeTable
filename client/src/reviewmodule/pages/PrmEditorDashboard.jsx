// src/components/EditorDashboard.js

import React from 'react';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getEnvironment from '../../getenvironment';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Container } from "@chakra-ui/layout";
import Header from "../../components/header";


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
  const data4 = [
    { name: 'Accepted Papers', value: 400 },
    { name: 'Rejected Papers', value: 300 },
    { name: 'Pending decision', value: 300 },
  ];

  const data2 = [
    { name: 'Reviwers Invited', value: 2400 },
    { name: 'Reviwers accepted', value: 4567 },
    { name: 'Reviwers rejected', value: 1398 },
  ];

  const data3 = [
    { name: 'Reviewers assigned', value: 1000 },
    { name: 'Review Completed', value: 2000 },
    { name: 'Partial Review Completed', value: 1500 },
    { name: 'Awaiting reviews', value: 3000 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Container maxW='7xl'>
    <Header title="Welcome to the Editor Dashoarad"></Header>
    <Text fontSize="xl" align="center">{event}</Text>

    <Box p={9}>
       {/* <Text fontSize="2xl" fontWeight="bold">Editor Dashboard</Text> */}
 
      <HStack spacing={7} align="center">
        <Button width="230px" height="50px" colorScheme="teal" onClick={() => navigate(`${location.pathname}/confdetails`)}>Conference Details</Button>
        <Button width="230px" height="50px" colorScheme="orange" onClick={() => navigate(`${location.pathname}/addtrack`)}>Add Tracks</Button>
        <Button width="230px" height="50px" colorScheme="red" onClick={() => navigate(`${location.pathname}/papers`)}>Paper Details</Button>
        <Button width="230px" height="50px" colorScheme="blue" onClick={() => navigate(`${location.pathname}/addreviewer`)}>Invite Reviewer</Button>
        <Button width="230px" height="50px" colorScheme="green" onClick={() => navigate(`${location.pathname}/edittemplate`)}>Communication Templates</Button>
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
  );
};

export default PrmEditorDashboard;
