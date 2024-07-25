import React, { useState, useEffect } from 'react';
import { Container, Box, Table, Thead, Tbody, Tr, Th, Td, Link, Input, Button, Spinner, Flex } from '@chakra-ui/react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from "@chakra-ui/react";

function DynamicTable(props) {
    const toast = useToast();
    let [pageNo, setPageNo] = useState(1)
    const pageItems = 5 // max number of items in a page
    const numberOfPages = Math.floor(props.events.length/pageItems) + (props.events.length%pageItems ? 1 : 0) // it gives total number of possible pages

    let itemsInPage = (pageno) => (pageno === numberOfPages)? (props.events.length+1 % pageItems) : pageItems // it gives number of items in current page

    function pageFilter(events) {
        let pageEvents = []
        for(let i = 0; i < events.length; i++)
            if((i+1 > (pageItems*(pageNo-1))) && (i+1 <= ((pageItems*(pageNo-1)) + itemsInPage(pageNo))))
                pageEvents.push(events[i])
        return pageEvents
    }

    // Function to check if the submission deadline has passed
    function isSubmissionEnded(deadline) {
        const currentDate = new Date();
        const submissionDeadline = new Date(deadline);
        return currentDate > submissionDeadline;
    }
    //   // Function to format date from ISO string
    //   const formatDate = (isoDate) => {
    //     if (!isoDate) return ''; // Handle case where isoDate is null or undefined
    //     const dateObj = new Date(isoDate);
    //     return dateObj.toLocaleDateString(); // Format date according to locale
    // };
    console.log('real',props.events)
    return(
        <>
        <div>
            <div style={{overflow:'auto', display:'block'}}>
                <Table variant="striped" mt={8}>
                    <Thead>
                        <Tr>
                            <Th textAlign={'center'} >Name</Th>
                            <Th textAlign={'center'} >Date</Th>
                            <Th textAlign={'center'} >Deadline</Th>
                            <Th textAlign={'center'} >Link</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {pageFilter(props.events).map((event) => (
                            <Tr key={event.id}>
                                <Td>{event.name}</Td>
                                <Td>{new Date(event.startDate).toLocaleDateString()}</Td>
                                <Td>{new Date(event.paperSubmissionDate).toLocaleDateString()}</Td>
                                <Td>
                                    {
                                    event.startSubmission?
                                    (isSubmissionEnded(event.paperSubmissionDate) ? (
                                        <Link as={RouterLink} to={`/prm/end`} color="teal.500">
                                            Submission Ended!
                                        </Link>
                                    ) : (
                                        <Link as={RouterLink} to={`/prm/${event._id}/author/newpaper`} color="teal.500">
                                            Go to Event
                                        </Link>
                                    ))
                                    :<Link as={RouterLink} to={`/prm/end`} color="teal.500">
                                    Submission not yet started
                                </Link>
                                    }
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>
            <br/>
            {numberOfPages > 1 ? (
                <div
                    style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}
                >
                    <Button colorScheme='blue' isDisabled={(pageNo === 1)} onClick={() => setPageNo(pageNo - 1)}>Previous</Button>
                    <p style={{color: 'slategrey'}}>Page {pageNo} out of {numberOfPages}</p>
                    <Button colorScheme='blue' isDisabled={(pageNo === numberOfPages)} onClick={() => setPageNo(pageNo + 1)}>Next</Button>
                </div>
            ) : ''}
        </div>
        </>
    )
}

function SearchEvent() {
    const apiUrl = getEnvironment();
    const [events, setEvents] = useState();
    const toast = useToast();

    let [searchQuery, setSearchQuery] = useState('')

    const handleChange = (e)=> setSearchQuery(e.target.value)

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

    function EventFilter(events) {
        if (!searchQuery) return events
        return events.filter(event => event.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return (
        <Container style={{maxWidth:'80vw'}}>
            <Header title="Event List" />
            <Box maxW="xl" mx="auto" mt={10}>
                <Input
                    type='text'
                    placeholder='Search Event'
                    id='searchQuery'
                    value={searchQuery}
                    onChange={handleChange}
                />
                {events ?( !EventFilter(events).length ? (
                    <p style={{color: 'slategrey', textAlign:'center'}}><br/>No events found...</p>
                ) : (
                    <DynamicTable events={EventFilter(events)} />
                )):(
                <Flex height={'10vh'}>
                    <Spinner margin='auto' />
                </Flex>)}
            </Box>
        </Container>
    );
}

export default SearchEvent;
