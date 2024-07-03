import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { chakra, Text, IconButton, Heading, Container, Box, Button, Spinner, useToast, extendTheme, ChakraProvider, Flex, Icon, Grid } from "@chakra-ui/react";
import { FaInfoCircle, FaFileAlt, FaUserFriends, FaChartPie, FaEnvelope } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi'
import getEnvironment from "../../getenvironment";
import axios from "axios";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from 'react-router-dom';

async function updateStartSubmission(toast) { 
    const apiUrl = getEnvironment()
    const parts = window.location.pathname.split('/')
    try {
        const response = await fetch(
          `${apiUrl}/api/v1/reviewmodule/event/updateStartSubmission/${parts[2]}`,
          {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({startSubmission : true}),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          window.history.back()
        }
    } catch (error) {
        console.error("Error starting submission :", error);
        toast({
            title: 'Error starting submission',
            description: 'An error occurred while starting the questions.',
            status: 'error',
            duration: 5000,
            isClosable: true,
        });
    }

} 

function StartSubmission() {
    //status 0 for loading, 1 for complete, 2 for pending
    const [reviewQuestionsStatus, setReviewQuestionsStatus] = useState(0)
    const [tracksStatus, setTracksStatus] = useState(0)
    const [confDetailsStatus, setconfDetailsStatus] = useState(0)
    const apiUrl = getEnvironment()
    const { eventId } = useParams();
    const toast = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchEventById = async () => {
          try {
            const response = await fetch(
              `${apiUrl}/api/v1/reviewmodule/event/${eventId}`,
              {
                method: "GET",
                credentials: "include"
              }
            );
            if (response.ok) {
              const data = await response.json();
              if(data) setconfDetailsStatus(1)
                else setReviewQuestionsStatus(2)
            }
          } catch (error) {
            console.error("Error fetching users:", error);
          }
        };
        fetchEventById();
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const response = await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
                if(response.data.tracks.length) setTracksStatus(1);
                else setTracksStatus(2)
            } catch (error) {
                console.error('Error fetching tracks:', error);
                setTracks([]);
            }
        };

        fetchTracks();
    }, [apiUrl, eventId]);

    const fetchQuestions = async () => {
        try {
            const response = await axios.get(`${apiUrl}/reviewmodule/reviewQuestion/get/${eventId}`);
            if(response.data.length) setReviewQuestionsStatus(1)
                else setReviewQuestionsStatus(2)
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast({
            title: 'Error fetching questions',
            description: 'An error occurred while fetching the questions.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            });
        } 
    };

    const HeaderStartSubmission = ({ title }) => {
        const navigate = useNavigate();
        
        return (
          <Heading mr='1' ml='1' display='flex' >
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
            <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2' >
              {title}
            </chakra.div>
          </Heading>
        );
    };

    function returnDashboardURL(url) {
        const a = url.split('/')
        a.pop()
        const b = a.join('/')
        return b
    }

    function StatusIcon(props) {
        return (
            <>
            {
                !props.data? 
                <Flex gap='5px' alignItems={'center'}>
                    <Spinner/>
                    <Text color='gray' >Verifying...</Text>
                </Flex>
                :(
                    props.data==1?
                    <Flex gap='5px' alignItems={'center'}>
                        <CheckIcon color={'green'} />
                        <Text color='gray' >Completed</Text>
                    </Flex>
                    :
                    <Flex gap='5px' alignItems={'center'}>
                        <CloseIcon color={'red'} />
                        <Text color='gray' >Pending...</Text>
                    </Flex>
                )
            }
            </>
        )
    }

    return (
        <>
        <Container
            style={{ display: 'flex', minWidth:'85vw',flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly' }}
        >
            <br />
            <Box  bg="black" p={0.2} width='100%'>
                <HeaderStartSubmission  color="white" textAlign="center" title="Start Submission"/>
            </Box>
            <br /><br />
            <Flex justifyContent='space-evenly' width={'100%'} flexWrap={'wrap'}>
                <Flex flexDirection='column' alignItems={'center'} gap={'5px'}>
                    <Button
                        width="250px"
                        height="50px"
                        bgGradient="linear(to-r, cyan.600, cyan.500)"
                        color="white"
                        _hover={{ bgGradient: "linear(to-r, cyan.500, cyan.400)" }}
                        onClick={() => navigate(`${returnDashboardURL(location.pathname)}/confdetails`)}
                        leftIcon={<Icon as={FaInfoCircle} color="white" />}
                        whiteSpace="normal" // Ensure text wraps within the button
                    >
                        Conference Details
                    </Button>
                    <StatusIcon data={confDetailsStatus} />
                </Flex>
                <Flex flexDirection='column' alignItems={'center'} gap={'5px'}>
                    <Button
                        width="250px"
                        height="50px"
                        bgGradient="linear(to-r, orange.600, orange.500)"
                        color="white"
                        _hover={{ bgGradient: "linear(to-r, orange.500, orange.400)" }}
                        onClick={() => navigate(`${returnDashboardURL(location.pathname)}/addtrack`)}
                        leftIcon={<Icon as={FaChartPie} color="white" />}
                        whiteSpace="normal" // Ensure text wraps within the button
                    >
                        Add Tracks
                    </Button>
                    <StatusIcon data={tracksStatus} />
                </Flex>
                <Flex flexDirection='column' alignItems={'center'} gap={'5px'}>
                    <Button
                        width='250px'
                        height="50px"
                        bgGradient="linear(to-r, purple.600, purple.500)"
                        color="white"
                        _hover={{ bgGradient: "linear(to-r, purple.500, purple.400)" }}
                        onClick={() => navigate(`/prm/${eventId}/ReviewQuestionHome`)}
                        leftIcon={<Icon as={FiCheckCircle} color="white" />}
                        whiteSpace="normal" // Ensure text wraps within the button
                    >
                        Review Questions
                    </Button>
                    <StatusIcon data={reviewQuestionsStatus} />
                </Flex>
            </Flex>
            <br /><br />
            {
                (confDetailsStatus==1&&(tracksStatus==1&&reviewQuestionsStatus==1)) ?
                <Link
                    onClick={()=>updateStartSubmission(toast)}
                    className="tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center tw-m-auto"
                    style={{gap: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content'}}
                    >
                    Start Submission
                </Link>:<Text color='gray' >Complete the above steps to continue...</Text>
            }
        </Container>
        </>
    )
}

export default StartSubmission