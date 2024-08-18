import React, { useState, useEffect } from 'react';
import { Container, Box, Table, Thead, Tbody, Tr, Th, Td, Link,  Button,Text, Heading,IconButton,chakra } from '@chakra-ui/react';
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
                // Sort the result by completedDate in descending order
                result.sort((a, b) => new Date(b.reviewers.completedDate) - new Date(a.reviewers.completedDate));
                setPapers(Papers);
                setResult(result);
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
    const HeaderInvitations = ({ title }) => (
        <Heading mr='1' ml='1' display='flex'>
          <IconButton
            mb='1'
            variant='ghost'
            onClick={() => navigate(-1)}
            _hover={{ bgColor: 'transparent' }}
          >
            <chakra.svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='white'
              className='w-6 h-6'
              _hover={{ stroke: '#00BFFF' }}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </chakra.svg>
          </IconButton>
          <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2'>
            {title}
          </chakra.div>
        </Heading>
    );

    return (
        <Container maxWidth="100%">
        <br />
        <Box display="flex" justifyContent="center" mt={4}>
            <Box bg="black" p={0.2} width="80%">
            <HeaderInvitations title="Completed Review List" />
            </Box>
        </Box>
        <br />

        <Box maxW="80%" mx="auto" mt={10}>
        
                <Table variant="simple" mt={8}>
                    <Thead>
                        <Tr>
                            <Th>Paper ID</Th>
                            <Th w="40%">Paper Title</Th>
                            <Th>Completed Date</Th> {/* New column for the link */}
                            <Th>Submitted Review</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {result.map((paper) => (
                            <Tr key={paper._id}>
                                <Td>{paper.paperId}</Td>
                                <Td>{paper.title}</Td>
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