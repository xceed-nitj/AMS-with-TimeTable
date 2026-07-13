import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import {
  Container, Box, Flex, Heading, Text, Button, Badge, Center, Icon, SimpleGrid, useToast,
} from "@chakra-ui/react";
import { FaCalendarAlt, FaArrowRight, FaPlus } from "react-icons/fa";
import Header from "../../components/header";

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

      if (response.ok) {
        const data = await response.json();
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
    <main className="tw-min-h-screen tw-bg-slate-100 tw-pb-10">
      <Container maxW='6xl'>
        <Header title="List of Events"></Header>

        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <Text color="gray.600">Select a conference to open its admin panel.</Text>
          <Button
            colorScheme="blue"
            leftIcon={<FaPlus />}
            onClick={() => navigate("/cf/addconf")}
          >
            New Conference
          </Button>
        </Flex>

        {table.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {table.map((event) => (
              <Box
                key={event._id}
                bg="white"
                borderRadius="2xl"
                boxShadow="md"
                overflow="hidden"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-4px)", boxShadow: "xl" }}
              >
                <Box h="6px" bgGradient="linear(to-r, blue.500, purple.500)" />
                <Box p={5}>
                  <Flex align="center" gap={3} mb={3}>
                    <Center bg="blue.50" color="blue.600" borderRadius="lg" boxSize="40px">
                      <Icon as={FaCalendarAlt} />
                    </Center>
                    <Heading as="h3" size="sm" noOfLines={2}>{event.name}</Heading>
                  </Flex>
                  <Button
                    as="a"
                    href={`http://${domainName}/cf/${event._id}`}
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    width="100%"
                    rightIcon={<FaArrowRight />}
                  >
                    Open Admin Panel
                  </Button>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Center py={16} flexDirection="column" color="gray.400" gap={3} bg="white" borderRadius="2xl" boxShadow="md">
            <Icon as={FaCalendarAlt} fontSize="36px" />
            <Text>No conferences assigned to you yet.</Text>
          </Center>
        )}

        {loading && <p>Loading...</p>}
      </Container>
    </main>
  );
}

export default EODashboard;
