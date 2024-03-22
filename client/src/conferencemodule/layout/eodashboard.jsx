import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormLabel, Heading, Input, Select, useToast } from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomTealButton} from '../../styles/customStyles'
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
import Header from "../../components/header";
import { useDisclosure } from "@chakra-ui/hooks";

function EODashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = getEnvironment();


  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/conferencemodule/conf/getconf`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
  
      // console.log("Response status:", response.status);
  
      if (response.ok) {
        const data = await response.json();
        // console.log(data)
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
      <Table variant='striped' size="md" mt="1">
        <Thead>
          <Tr>
            <CustomTh>Event Name</CustomTh>
            <CustomTh>Link</CustomTh>
          </Tr>
        </Thead>
        <Tbody>
          {table.map((event) => (
            <Tr key={event._id}>
              <Td><Center>{event.name}</Center></Td>
              <Td>
                <CustomLink
                  href={`http://${domainName}/cf/${event._id}`}
                  // Optional: If you want to open the link in a new tab
                >Adminpanel</CustomLink>
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

export default EODashboard;
