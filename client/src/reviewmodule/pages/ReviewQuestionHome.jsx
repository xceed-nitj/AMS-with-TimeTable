import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Box, Heading, Text, VStack, IconButton, chakra, Spinner, useToast, Button, Flex } from '@chakra-ui/react'
import {  AlertDialog,
  useDisclosure,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton } from '@chakra-ui/react'
import getEnvironment from '../../getenvironment'

const apiUrl = getEnvironment()



const ViewQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  console.log(questions)

  useEffect(() => {
    fetchQuestions();
  }, []);

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

  function DeleteQuestion(props) {
    const toast = useToast()
  
    const handleSubmit = async () =>{
      try {
        await axios.delete(`${apiUrl}/reviewmodule/reviewQuestion/${props.id}`)
        toast({
          title: 'Question deleted.',
          description: 'Your question has been deleted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchQuestions()
      } catch (error) {
        toast({
          title: 'Error deleting question.',
          description: 'An error occurred while deleting your question.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = React.useRef()
  
    return (
      <>
      <Button style={{width: '80px'}} colorScheme='red' onClick={onOpen}>
        Delete
      </Button>
      <AlertDialog
          motionPreset='slideInBottom'
          isCentered
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader>
                <Text textAlign={'center'}>
                  Delete Question
                </Text>
              </AlertDialogHeader>
              <AlertDialogCloseButton/>
              <AlertDialogBody>
                <Text textAlign={'center'}>
                  Are you sure ?<br/>You cannot undo this action afterwards...
                </Text>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button margin={"auto"} onClick={onClose} ref={cancelRef}>
                  Cancel
                </Button>
                <Button colorScheme='red' margin={"auto"} onClick={()=>{onClose();handleSubmit()}}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </>
    )
  }

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

      <Flex alignItems={'center'} width={'100%'}>
        <Flex style={{boxSizing:'border-box', width: '100%'}}>
          <Text color="white" fontSize="sm" ml={2} bg='yellow.400' p='1.5' borderRadius="md">
            Type: {question.type[0]}
          </Text>
        </Flex>
        {/* <div style={{flexGrow: '1'}}></div> */}
        <Flex alignItems={'center'} justifyContent={'center'} gap={'8px'}>
        <span style={{ fontWeight: 'bold', textWrap:'nowrap' }}>Question {index + 1}</span>
        </Flex>
        {/* <div style={{flexGrow: '1'}}></div> */}
        <Flex style={{boxSizing:'border-box', width: '100%', justifyContent:'flex-end', flexGrow:'1', alignItems:'center'}}>
          <Button
            as={Link}
            style={{width: '80px'}}
            to={`/prm/${eventId}/ReviewQuestion?edit=${question._id}`} colorScheme='green'>
            Edit
          </Button>
          <DeleteQuestion id={question._id}/>
        </Flex>
      </Flex>

      </Flex>
      <span style={{ fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: question.question[0] }} />
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

 function sortQuestions(qArgs) {
  let keyset = []
  let sortedQuestions = []
  for(let i = 0; i < qArgs.length; i++) keyset.push(qArgs[i].order[0])
  keyset.sort((a,b)=>a-b)
  for(let i = 0; i < keyset.length; i++) for (let j = 0; j < qArgs.length; j++) if (qArgs[j].order[0] == keyset[i]) sortedQuestions.push(qArgs[j])
  return sortedQuestions
 }

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
          {sortQuestions(questions).map((question, index) => (
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