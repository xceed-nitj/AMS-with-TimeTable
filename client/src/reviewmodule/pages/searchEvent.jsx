import React, { useState, useEffect } from 'react';
import { Container, Box, Table, Thead, Tbody, Tr, Th, Td, Link } from '@chakra-ui/react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from "@chakra-ui/react";


function SearchEvent() {
    const apiUrl = getEnvironment();
    const [events, setEvents] = useState([]);
    const toast = useToast();

    useEffect(() => {
        // Fetch the list of events
        const fetchEvents = async () => {
            try {
                const response = await axios.get(`${apiUrl}/reviewmodule/event/getAllEvents`);
                setEvents(response.data);
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching events:', error);
                toast({
                    title: "Error",
                    description: "Unable to fetch events",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        };

        fetchEvents();
    }, [apiUrl, toast]);

    return (
        <Container>
            <Header title="Event List" />

            <Box maxW="xl" mx="auto" mt={10}>
                <h1>Events</h1>
                <Table variant="simple" mt={8}>
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Date</Th>
                            <Th>Link</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {events.map((event) => (
                            <Tr key={event.id}>
                                <Td>{event.name}</Td>
                                <Td>{new Date(event.date).toLocaleDateString()}</Td>
                                <Td>
                                    <Link as={RouterLink} to={`/prm/${event._id}/author/newpaper`} color="teal.500">
                                        Go to Event
                                    </Link>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        </Container>
    );
}

export default SearchEvent;
