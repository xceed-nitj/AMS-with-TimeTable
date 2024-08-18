import React, { useState, useEffect } from 'react';
import { Container, Box, Table, Thead, Tbody, Tr, Th, Td, Link } from '@chakra-ui/react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from "@chakra-ui/react";


function PendingAssignment() {
    const apiUrl = getEnvironment();
    const [Papers, setPapers] = useState([]);
    const [pending, setPending] = useState([]);
    const [userId, setUserId] = useState('');
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
                setUserId(id); // Set the userId from logged-in user
                const response = await axios.get(`${apiUrl}/reviewmodule/paper/reviewer/${id}`);
                const Papers = response.data;
                let pendingPaper = [];
                for (let i = 0; i < Papers.length; i++) {
                    if(Papers[i].status==='Under Review'){
                        for(let j=0;j<Papers[i].reviewers.length;j++){
                            if(Papers[i].reviewers[j].userId === id && !Papers[i].reviewers[j].completedDate){
                                pendingPaper.push(Papers[i]);
                            }
                        }
                    }
                }

                setPapers(Papers);
                setPending(pendingPaper);
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
            <Header title="Pending Paper List" />

            <Box maxW="xl" mx="auto" mt={10}>
                
                <Table variant="simple" mt={8}>
                    <Thead>
                        <Tr>
                            <Th>Paper ID</Th>
                            <Th>Paper Title</Th>
                            <Th>Abstract</Th>
                            <Th>Action</Th> {/* New column for the link */}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {pending.map((paper) => (
                            <Tr key={paper._id}>
                                <Td>{paper.paperId}</Td>
                                <Td>{paper.title}</Td>
                                <Td>{paper.abstract}</Td>
                                <Td>
                                    <Link as={RouterLink} to={`/prm/${paper.eventId}/${paper._id}/${userId}/Review`} color="teal.500">
                                        Answer
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

export default PendingAssignment;