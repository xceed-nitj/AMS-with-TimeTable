import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Flex, Text, chakra, Heading, IconButton, Box, FormControl, FormLabel,
  Checkbox, Radio, RadioGroup, Stack, Textarea, useToast, Alert, AlertIcon,
  AlertTitle, CloseButton,
} from '@chakra-ui/react';
import JoditEditor from 'jodit-react';
import getEnvironment from '../../getenvironment';

const AnswerFormPage = () => {
  const apiUrl = getEnvironment();
  const { eventId, userId, formId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTime, setSubmittedTime] = useState();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch questions from the backend and sort by order
    axios.get(`${apiUrl}/reviewmodule/forms/${eventId}`)
      .then(response => {
        const sortedQuestions = response.data.sort((a, b) => a.order - b.order);
        setQuestions(sortedQuestions);
      })
      .catch(error => console.error('Error fetching questions:', error));
  }, [apiUrl, eventId]);

  useEffect(() => {
    if (questions.length > 0) {
      // Check if form has been submitted for this user
      axios.get(`${apiUrl}/reviewmodule/formAnswers/get/${eventId}/${formId}/${userId}`)
        .then(response => {
          if (response.data && response.data.length > 0) {
            const QnA = response.data[0].formAnswers || [];
            const submittedAnswers = {};
            questions.forEach(question => {
              QnA.forEach(qna => {
                if (qna.questionId === question._id) {
                  submittedAnswers[question._id] = qna.answer;
                }
              });
            });
            const d = new Date(response.data[0].updatedAt).toLocaleString();
            setSubmittedTime(d);
            setAnswers(submittedAnswers);
            setIsSubmitted(true);
          } else {
            const initialAnswers = {};
            questions.forEach(question => {
              if (question.type.includes('Text')) {
                initialAnswers[question._id] = '';
              } else if (question.type.includes('Multiple Correct')) {
                initialAnswers[question._id] = [];
              } else if (question.type.includes('Single Correct')) {
                initialAnswers[question._id] = '';
              }
            });
            setAnswers(initialAnswers);
          }
        })
        .catch(error => console.error('Error fetching form status:', error));
    }
  }, [questions, apiUrl, eventId, formId, userId]);

  const handleAnswerChange = (questionId, newValue) => {
    if (!isSubmitted) {
      setAnswers({
        ...answers,
        [questionId]: newValue,
      });
    }
  };

  const handleSubmit = () => {
    const formData = {
      eventId,
      userId,
      formId,
      formAnswers: Object.entries(answers).map(([questionId, answer]) => {
        const question = questions.find(q => q._id === questionId);
        return {
          questionId,
          order: question.order[0],
          answer,
        };
      }),
    };

    axios.post(`${apiUrl}/reviewmodule/formAnswers/`, formData)
      .then(() => {
        setIsSubmitted(true);
        toast({
          title: 'Form submitted.',
          description: 'Your form has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Fetch the form status again to update the UI
        axios.get(`${apiUrl}/reviewmodule/formAnswers/get/${eventId}/${formId}/${userId}`)
          .then(response => {
            if (response.data && response.data.length > 0) {
              const QnA = response.data[0].formAnswers || [];
              const submittedAnswers = {};
              questions.forEach(question => {
                QnA.forEach(qna => {
                  if (qna.questionId === question._id) submittedAnswers[question._id] = qna.answer;
                });
              });
              const d = new Date(response.data[0].updatedAt).toLocaleString();
              setSubmittedTime(d);
              setAnswers(submittedAnswers);
              setIsSubmitted(true);
            }
          })
          .catch(error => console.error('Error fetching form status:', error));
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        toast({
          title: 'Error.',
          description: 'There was an error submitting your form.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
  };

  const HeaderFormPage = ({ title }) => (
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

  return (
    <Box p={5} width={'85%'} margin={'auto'}>
      <br />
      <Box bg="black" p={0.2} width='100%' margin="auto">
        <HeaderFormPage color="white" textAlign="center" title="Answer Form Page" />
      </Box>
      <br />
      {isSubmitted && (
        <>
          <Alert status="info" mb={4}>
            <AlertIcon />
            <AlertTitle>Your form has been submitted.</AlertTitle>
            <CloseButton position="absolute" right="8px" top="8px" style={{ display: "none" }} onClick={() => { }} />
          </Alert>
          <br />
          <p style={{ color: 'slategrey', textAlign: 'center' }}>Submitted on <span style={{ color: 'green', fontWeight: "bold" }}>{submittedTime}</span></p>
        </>
      )}
      {questions.map((question, index) => (
        <Box borderWidth="1px" borderRadius="lg" p={4} mb={4} bg="white" margin={'50px 0 50px 0 '} boxShadow="none" _hover={{ boxShadow: 'lg' }} key={question._id}>
          <Flex>
            <Flex style={{ boxSizing: 'border-box', width: '100%' }}>
              <Text color="white" fontSize="sm" ml={2} bg='yellow.400' p='1.5' borderRadius="md">
                Type: {question.type[0]}
              </Text>
            </Flex>
            <span style={{ fontWeight: 'bold', textWrap: 'nowrap' }}>Question {index + 1}</span>
            <Flex style={{ boxSizing: 'border-box', width: '100%' }}></Flex>
          </Flex>
          <span style={{ fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: question.question }} />
          <FormControl as="fieldset">
            {question.type.includes('Text') ? (
              <JoditEditor
                value={answers[question._id] || ''}
                tabIndex={1}
                onBlur={newContent => handleAnswerChange(question._id, newContent)}
                onChange={() => { }}
                disabled={isSubmitted}
              />
            ) : question.type.includes('Multiple Correct') ? (
              <Stack spacing={4} direction="column" mt={2}>
                {question.options.map((option, idx) => (
                  <Checkbox
                    key={idx}
                    value={option}
                    isChecked={answers[question._id] ? answers[question._id].includes(option) : false}
                    onChange={e => {
                      if (!isSubmitted) {
                        const updatedAnswers = answers[question._id] ? [...answers[question._id]] : [];
                        if (e.target.checked) {
                          updatedAnswers.push(option);
                        } else {
                          const index = updatedAnswers.indexOf(option);
                          if (index > -1) {
                            updatedAnswers.splice(index, 1);
                          }
                        }
                        handleAnswerChange(question._id, updatedAnswers);
                      }
                    }}
                    isDisabled={isSubmitted}
                  >
                    <span dangerouslySetInnerHTML={{ __html: option }} />
                  </Checkbox>
                ))}
              </Stack>
            ) : question.type.includes('Single Correct') ? (
              <RadioGroup
                mt={2}
                onChange={value => handleAnswerChange(question._id, value)}
                value={answers[question._id] || ''}
                isDisabled={isSubmitted}
              >
                <Stack spacing={4} direction="column">
                  {question.options.map((option, idx) => (
                    <Radio key={idx} value={option} isDisabled={isSubmitted}>
                      <span dangerouslySetInnerHTML={{ __html: option }} />
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            ) : null}
          </FormControl>
        </Box>
      ))}
      {!isSubmitted && (
        <Flex justifyContent="center">
          <button
            onClick={handleSubmit}
            style={{
              background: 'black',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Submit
          </button>
        </Flex>
      )}
    </Box>
  );
};

export default AnswerFormPage;
