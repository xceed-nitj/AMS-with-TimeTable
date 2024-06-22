import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Heading, Text, VStack, IconButton, chakra, Spinner, useToast, Button, Flex } from '@chakra-ui/react';
import getEnvironment from '../../getenvironment';

const apiUrl = getEnvironment();

const ViewQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [eventId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${apiUrl}/reviewmodule/reviewQuestion/get/${eventId}`);
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
      toast({
        title: 'Error fetching questions',
        description: 'An error occurred while fetching the questions.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const HeaderReviewQuestion = ({ title }) => (
    <Heading mr='1' ml='1' display='flex'>
      <IconButton
        mb='1'
        variant='ghost'
        onClick={() => navigate(-1)}
        _hover={{ bgColor: 'transparent' }}
        icon={
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
        }
      />
      <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2'>
        {title}
      </chakra.div>
    </Heading>
  );

  const QuestionCard = ({ question, index }) => (
   <Box borderWidth="1px" borderRadius="lg" p={4} mb={4} bg="white" boxShadow="none" _hover={{ boxShadow: 'lg' }}>
     <Flex justifyContent="space-between" alignItems="flex-start">
         <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>Question {index + 1} :</span>
            <span dangerouslySetInnerHTML={{ __html: question.question[0] }} />
         </div>
       <Text color="white" fontSize="sm" ml={2} flexShrink={0} bg='yellow.400' p='1.5' borderRadius="md">
         Type: {question.type[0]}
       </Text>
     </Flex>
     {question.options && question.options.length > 0 && (
       <VStack align="start" spacing={1} mt={2}>
         <Text fontWeight="semibold">Options:</Text>
         {question.options.map((option, optionIndex) => (
           <Text key={optionIndex}>{option}</Text>
         ))}
       </VStack>
     )}
   </Box>
 );

  return (
    <div className="view-questions-page">
      <br />
      <Box bg="black" p={0.2} width='80%' margin="auto">
        <HeaderReviewQuestion color="white" textAlign="center" title="Review Questions" />
      </Box>
      <br />
      <Box display='flex' justifyContent='center'>
        <Button
          as={Link}
          to={`/prm/${eventId}/ReviewQuestion`}
          colorScheme="blue"
          size="lg"
        >
          Add New Question
        </Button>
      </Box>
      <br />
      {loading ? (
        <Spinner size="xl" />
      ) : questions.length > 0 ? (
        <VStack spacing={4} align="stretch" width="80%" margin="auto">
          {questions.map((question, index) => (
            <QuestionCard key={index} question={question} index={index} />
          ))}
        </VStack>
      ) : (
        <Text textAlign="center">No questions found for this event.</Text>
      )}
    </div>
  );
};

export default ViewQuestions;