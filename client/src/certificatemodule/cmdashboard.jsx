import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormLabel, Heading, Input, Select } from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomBlueButton} from '../styles/customStyles'
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";
import { Center, Square, Circle } from '@chakra-ui/react'
import Header from "../components/header";


function CMDashboard() {
  const navigate = useNavigate();

  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const apiUrl = getEnvironment();
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);


  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/certificatemodule/addevent/getevents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      console.log("Response status:", response.status);
  
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setTable(data);
      } else {
        console.error("Failed to fetch timetables");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  useEffect(() => {
    console.log("Fetching events with apiUrl:", apiUrl);
    fetchEvents();
  }, [apiUrl]);
  
  const currentUrl = window.location.href;
  const urlParts = currentUrl.split("/");
  const domainName = urlParts[2];

  return (
    <Container maxW='5xl'>
        <Header title="List of Events"></Header>
      <TableContainer>
        <Table
        variant='striped'
        size="md" 
        mt="1"
        >
          <Thead>
            <Tr>
              <CustomTh>Event Name</CustomTh>
              <CustomTh>Expiry Date</CustomTh>
              <CustomTh>Department/Club</CustomTh>
              <CustomTh>Link</CustomTh>
            </Tr>
          </Thead>
          <Tbody>
            {table.map((timetable) => (
              <Tr key={timetable._id}>
                <Td><Center>{timetable.name}</Center></Td>
                <Td><Center>{timetable.user}</Center></Td>
                <Td><Center>{timetable.date}</Center></Td>
                <Td><Center>
                <CustomLink
                href={`http://${domainName}/cm/${timetable._id}`}
                target="_blank" // Optional: If you want to open the link in a new tab
              >
                {timetable.code}
              </CustomLink></Center>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {loading && <p>Loading...</p>}
    </Container>
  );
}

export default CMDashboard;
