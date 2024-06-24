import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  CloseButton,
} from '@chakra-ui/react';
import JoditEditor from 'jodit-react';
import getEnvironment from '../../getenvironment';

const ReviewPage = () => {
  const apiUrl = getEnvironment();
  const { eventId, paperId, userId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [commentsAuthor, setCommentsAuthor] = useState('');
  const [commentsEditor, setCommentsEditor] = useState('');
  const [decision, setDecision] = useState('Need Revision');
  const [isSubmitted, setIsSubmitted] = useState(false); // Local state to track submission
  const toast = useToast();

  useEffect(() => {
    // Fetch questions from the backend
    axios.get(`${apiUrl}/reviewmodule/reviewQuestion/get/${eventId}`)
      .then(response => {
        setQuestions(response.data);
        // Initialize answers object with empty values for each question
        const initialAnswers = {};
        response.data.forEach(question => {
          if (question.type.includes('Text')) {
            initialAnswers[question._id] = '';
          } else if (question.type.includes('Multiple Correct')) {
            initialAnswers[question._id] = [];
          } else if (question.type.includes('Single Correct')) {
            initialAnswers[question._id] = '';
          } else {
            // Handle other question types as needed
          }
        });
        setAnswers(initialAnswers);
      })
      .catch(error => console.error('Error fetching questions:', error));

    // Check if review has been submitted for this paper and reviewer
    axios.get(`${apiUrl}/reviewmodule/review/get/${eventId}/${paperId}/${userId}`)
      .then(response => {
        console.log(response.data);
        if (response.data) {
          setIsSubmitted(true); // If review exists, disable the form
        }
      })
      .catch(error => console.error('Error checking review status:', error));
  }, [apiUrl, eventId, paperId, userId]);

  const handleAnswerChange = (questionId, newValue) => {
    setAnswers({
      ...answers,
      [questionId]: newValue,
    });
  };

  const handleSubmit = () => {
    const reviewData = {
      eventId,
      paperId,
      reviewerId: userId,
      reviewAnswers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      })),
      commentsAuthor,
      commentsEditor,
      decision,
    };

    axios.post(`${apiUrl}/reviewmodule/review/save`, reviewData)
      .then(() => {
        setIsSubmitted(true);
        toast({
          title: 'Review submitted.',
          description: 'Your review has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      })
      .catch(error => {
        console.error('Error submitting review:', error);
        toast({
          title: 'Error.',
          description: 'There was an error submitting your review.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
  };

  return (
    <Box p={5}>
        {isSubmitted && (
        <Alert status="info" mb={4}>
          <AlertIcon />
          <AlertTitle>Your review has been submitted.</AlertTitle>
          <CloseButton position="absolute" right="8px" top="8px" onClick={() => setIsSubmitted(false)} />
        </Alert>
      )}
      {questions.map((question) => (
        <Box key={question._id} p={5} shadow="md" borderWidth="1px">
          <FormControl as="fieldset">
            <FormLabel as="legend">{question.question}</FormLabel>
            {question.type.includes('Text') ? (
              <JoditEditor
                value={answers[question._id] || ''}
                onChange={(value) => handleAnswerChange(question._id, value)}
                disabled={isSubmitted}
              />
            ) : question.type.includes("Multiple Correct") ? (
              <Stack direction="column">
                {question.options.map((option, idx) => (
                  <Checkbox
                    key={idx}
                    isChecked={answers[question._id]?.includes(option) || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      let newAnswers = [...(answers[question._id] || [])];
                      if (isChecked && !newAnswers.includes(option)) {
                        newAnswers.push(option);
                      } else {
                        newAnswers = newAnswers.filter((ans) => ans !== option);
                      }
                      handleAnswerChange(question._id, newAnswers);
                    }}
                    isDisabled={isSubmitted}
                  >
                    {option}
                  </Checkbox>
                ))}
              </Stack>
            ) : question.type.includes("Single Correct") ? (
              <RadioGroup
                value={answers[question._id] || ''}
                onChange={(newValue) => handleAnswerChange(question._id, newValue)}
                isDisabled={isSubmitted}
              >
                <Stack direction="column">
                  {question.options.map((option, idx) => (
                    <Radio key={idx} value={option}>
                      {option}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            ) : null}
          </FormControl>
        </Box>
      ))}
      <FormControl mt={4} isDisabled={isSubmitted}>
        <FormLabel>Comments (Author)</FormLabel>
        <Textarea
          value={commentsAuthor}
          onChange={(e) => setCommentsAuthor(e.target.value)}
        />
      </FormControl>
      <FormControl mt={4} isDisabled={isSubmitted}>
        <FormLabel>Comments (Editor)</FormLabel>
        <Textarea
          value={commentsEditor}
          onChange={(e) => setCommentsEditor(e.target.value)}
        />
      </FormControl>
      <FormControl mt={4} isDisabled={isSubmitted}>
        <FormLabel>Decision</FormLabel>
        <RadioGroup
          value={decision}
          onChange={(newValue) => setDecision(newValue)}
          isDisabled={isSubmitted}
        >
          <Stack direction="row">
            <Radio value="Accepted">Accepted</Radio>
            <Radio value="Rejected">Rejected</Radio>
            <Radio value="Need Revision">Need Revision</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>
      <Button
        mt={4}
        colorScheme="teal"
        onClick={handleSubmit}
        isDisabled={isSubmitted}
      >
        Save
      </Button>
    </Box>
  );
};

export default ReviewPage;
