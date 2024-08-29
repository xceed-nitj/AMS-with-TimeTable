import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Input,
  Button,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  VStack,
  Stack,
  Alert,
  AlertIcon,
  Radio
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import getEnvironment from '../../getenvironment';

const apiUrl = getEnvironment();

const AnswerForm = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false); // State to track submission
  const { eventId, formId } = useParams();
  
  useEffect(() => {
    // Fetch form questions
    axios.get(`${apiUrl}/reviewmodule/forms/${eventId}/${formId}`)
      .then(response => {
        setQuestions(response.data.questions);
      })
      .catch(error => {
        console.error('Error fetching questions:', error);
      });
  }, [eventId, formId]);

  useEffect(() => {
    // Check if the form is already submitted and fetch answers
    const checkIfSubmitted = async () => {
      const User = await fetch(`${apiUrl}/user/getuser`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const userdetails = await User.json();
      const userId = userdetails.user._id;

      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/formanswers/get/${eventId}/${formId}/${userId}`);
        if (response.data.submitted) {
          setIsSubmitted(true);
          // Set the existing answers to the state
          const existingAnswers = {};
          response.data.formAnswers.forEach(answer => {
            existingAnswers[answer.questionId] = answer.answer;
          });
          setAnswers(existingAnswers);
        }
      } catch (error) {
        console.error('Error checking form submission:', error);
      }
    };

    checkIfSubmitted();
  }, [eventId, formId]);

  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const User = await fetch(`${apiUrl}/user/getuser`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const userdetails = await User.json();
    const userId = userdetails.user._id;

    const formAnswers = questions.map(q => ({
      questionId: q._id,
      answer: answers[q._id],
      order: q.order,
    }));

    const payload = {
      eventId,
      userId,
      formId,
      formAnswers,
    };

    try {
      await axios.post(`${apiUrl}/reviewmodule/formanswers`, payload);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  };

  return (
    <VStack spacing={4}>
      {isSubmitted && (
        <Alert status="info" variant="left-accent">
          <AlertIcon />
          Form already submitted.
        </Alert>
      )}
      {questions.map((q, index) => (
        <FormControl key={index}>
          <FormLabel>{q.question}</FormLabel>
          {q.type === 'text' && (
            <Input
              type="text"
              value={answers[q._id] || ''}
              onChange={(e) => handleInputChange(q._id, e.target.value)}
              isReadOnly={isSubmitted} // Disable editing if form is submitted
            />
          )}
          {q.type === 'single correct' && (
            <RadioGroup
              value={answers[q._id] || ''}
              onChange={(value) => handleInputChange(q._id, value)}
              isDisabled={isSubmitted} // Disable editing if form is submitted
            >
              <Stack>
                {q.options.map((option, idx) => (
                  <Radio key={idx} value={option}>{option}</Radio>
                ))}
              </Stack>
            </RadioGroup>
          )}
          {q.type === 'multiple correct' && (
            <CheckboxGroup
              value={answers[q._id] || []}
              onChange={(value) => handleInputChange(q._id, value)}
              isDisabled={isSubmitted} // Disable editing if form is submitted
            >
              <Stack>
                {q.options.map((option, idx) => (
                  <Checkbox key={idx} value={option}>{option}</Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          )}
        </FormControl>
      ))}
      <Button onClick={handleSubmit} isDisabled={isSubmitted}>Save Answers</Button>
    </VStack>
  );
};

export default AnswerForm;
