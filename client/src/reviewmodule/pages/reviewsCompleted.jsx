import React, { useState, useEffect } from 'react';
import { Container, Box, Table, Thead, Tbody, Tr, Th, Td, Link } from '@chakra-ui/react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from "@chakra-ui/react";


function ReviewsCompleted() {
    const apiUrl = getEnvironment();
    const [Papers, setPapers] = useState([]);
    const [result, setResult] = useState([]);
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
                let result = [];
                for (let i = 0; i < Papers.length; i++) {
                    for(let j=0;j<Papers[i].reviewers.length;j++){
                        if(Papers[i].reviewers[j].userId === id && Papers[i].reviewers[j].completedDate){
                            Papers[i].reviewers = Papers[i].reviewers[j]
                            result.push(Papers[i]);
                        }
                    }
                }
                setPapers(Papers);
                setResult(result);
            }catch (error) {
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
            <Header title="Completed Review List" />

            <Box maxW="xl" mx="auto" mt={10}>
                <h1>Completed Reviews</h1>
                <Table variant="simple" mt={8}>
                    <Thead>
                        <Tr>
                            <Th>Paper ID</Th>
                            <Th>Paper Title</Th>
                            <Th>Abstract</Th>
                            <Th>Completed Date</Th> {/* New column for the link */}
                            <Th>Submitted Review</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {result.map((paper) => (
                            <Tr key={paper._id}>
                                <Td>{paper.paperId}</Td>
                                <Td>{paper.title}</Td>
                                <Td>{paper.abstract}</Td>
                                <Td>{new Date(paper.reviewers.completedDate).toLocaleDateString()}</Td>
                                <Td>
                                    <Link as={RouterLink} to={`/prm/${paper.eventId}/${paper._id}/${userId}/Review`} color="teal.500">
                                        Review
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

export default ReviewsCompleted;