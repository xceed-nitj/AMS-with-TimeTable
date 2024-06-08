import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import getEnvironment from "../../getenvironment";
import Header from "../../components/header";

import {
  Container,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  Heading,
} from "@chakra-ui/react";

function EventPaper() {
  const [papers, setPapers] = useState([]); // State to store papers
  const apiUrl = getEnvironment();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const eventId = parts[parts.length - 3];

  useEffect(() => {
    const fetchPapersById = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/reviewmodule/paper/${eventId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched papers data:", data);
          setPapers(data); // Set the fetched data to state
        } else {
          console.error("Error fetching papers:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching papers:", error);
      }
    };

    fetchPapersById();
  }, [apiUrl, eventId]);

  return (
    <Container maxW="container.xl" p={4}>
      <Header title="Paper Details"></Header>
      
      <Box boxShadow="md" p={6} rounded="md" bg="white">
        
        <Table variant="Strip">
          <TableCaption>Papers for Event ID: {eventId}</TableCaption>
          <Thead>
            <Tr>
            <Th>ID</Th>
              <Th>Title</Th>
              <Th>Authors</Th>
              <Th>Paper</Th>
              <Th>Version</Th>
              <Th>Status</Th>

            </Tr>
          </Thead>
          <Tbody>
            {papers.map((paper) => (
              <Tr key={paper._id}>
                <Td>{paper._id}</Td>
                <Td>{paper.title}</Td>
                <Td>{paper.authors}</Td>
                <Td>
                  <Link to={`/paper/details/${paper._id}`}>
                    paper link
                  </Link>
                </Td>
                <Td>{paper.version}</Td>
                <Td>{paper.status}</Td>

              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}

export default EventPaper;
