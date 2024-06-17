import React, { useState, useEffect } from 'react';
import { Container, Box, Table, Thead, Tbody, Tr, Th, Td, Link } from '@chakra-ui/react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from "@chakra-ui/react";


function CompletedAssignment() {
    const apiUrl = getEnvironment();
    const [Papers, setPapers] = useState([]);
    const [completed,setCompleted] = useState([]);
    const toast = useToast();

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                const User = await fetch(`${apiUrl}/user/getuser`, {
                    method: "GET",
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
                const userdetails = await User.json();
                const id = userdetails.user._id;
                const response = await axios.get(`${apiUrl}/reviewmodule/paper/reviewer/${id}`);
                const Papers = response.data;
                let completedPaper = [];
                for (let i = 0; i < Papers.length; i++) {
                    if (Papers[i].status !== 'Under Review') {
                        completedPaper.push(Papers[i]);
                    }
                }

                setPapers(Papers);
                setCompleted(completedPaper);
            } catch (error) {
                console.error('Error fetching Papers:', error);
                toast({
                    title: "Error",
                    description: "Unable to fetch Papers",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        };
        fetchPapers();
    }, [apiUrl, toast]);

    return (
        <Container>
            <Header title="Completed Paper List" />

            <Box maxW="xl" mx="auto" mt={10}>
                <h1>Completed Papers</h1>
                <Table variant="simple" mt={8}>
                    <Thead>
                        <Tr>
                            <Th>Paper ID</Th>
                            <Th>Paper Title</Th>
                            <Th>Abstract</Th>
                            <Th>Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {completed.map((paper) => (
                            <Tr>
                                <Td>{paper.paperId}</Td>
                                <Td>{paper.title}</Td>
                                <Td>{paper.abstract}</Td>
                                <Td>{paper.status}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        </Container>
    );
}

export default CompletedAssignment;