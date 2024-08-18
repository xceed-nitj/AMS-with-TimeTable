import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  useToast,
  Checkbox,
  FormLabel,
  FormControl,
  Input,
  Button,
  chakra,
  Heading,
  Box,
  Select,
  IconButton
} from '@chakra-ui/react';
import { useParams, useSearchParams } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import './ReviewQuestion.css'; // Import the CSS file

const apiUrl = getEnvironment();

const Forms = () => {
  const [questions, setQuestions] = useState([{ question: '', type: '', options: [''], order: 0 }]);
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [accessRole, setAccessRole] = useState('');
  const [show, setShow] = useState(false);
  const [sharedWith, setSharedWith] = useState(['']);
  const [deadline, setDeadline] = useState('');
  const toast = useToast();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const [edit, setEdit] = useState(searchParams.get('edit') || false);

  useEffect(() => {
    if (edit) fetchSavedForm(edit);
  }, [edit]);

  const fetchSavedForm = async (formId) => {
    try {
      const response = await axios.get(`${apiUrl}/reviewmodule/forms/${formId}`);
      setForm(response.data);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast({
        title: 'Error fetching form',
        description: 'An error occurred while fetching the form.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const setForm = (formData) => {
    setQuestions(formData.questions);
    setTitle(formData.title);
    setSection(formData.section);
    setAccessRole(formData.accessRole);
    setShow(formData.show);
    setSharedWith(formData.sharedWith);
    setDeadline(formData.deadline);
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = questions.map((q, i) => i === index ? { ...q, [field]: value } : q);
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, newValue) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === qIndex) {
        const updatedOptions = q.options.map((option, j) => j === oIndex ? newValue : option);
        return { ...q, options: updatedOptions };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', type: '', options: [''], order: questions.length }]);
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === qIndex) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === qIndex) {
        const updatedOptions = q.options.filter((_, j) => j !== oIndex);
        return { ...q, options: updatedOptions };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleSharedWithChange = (index, newValue) => {
    const updatedSharedWith = sharedWith.map((email, i) => i === index ? newValue : email);
    setSharedWith(updatedSharedWith);
  };

  const handleAddSharedWith = () => {
    setSharedWith([...sharedWith, '']);
  };

  const handleRemoveSharedWith = (index) => {
    const updatedSharedWith = sharedWith.filter((_, i) => i !== index);
    setSharedWith(updatedSharedWith);
  };

  const handleSubmit = async () => {
    const newForm = {
      eventId: eventId,
      title: title,
      section: section,
      accessRole: accessRole,
      show: show,
      questions: questions,
      sharedWith: sharedWith,
      deadline: deadline,
    };

    try {
      if (edit) {
        await axios.put(`${apiUrl}/reviewmodule/forms/${edit}`, newForm);
      } else {
        await axios.post(`${apiUrl}/reviewmodule/forms`, newForm);
      }
      toast({
        title: "Form saved",
        description: "The form has been saved successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error saving form",
        description: "An error occurred while saving the form.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <chakra.form>
      <Heading as="h1" mb={4}>
        {edit ? "Edit Form" : "Create Form"}
      </Heading>

      <FormControl mb={4}>
        <FormLabel>Title</FormLabel>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Section</FormLabel>
        <Input
          type="text"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Access Role</FormLabel>
        <Select
          value={accessRole}
          onChange={(e) => setAccessRole(e.target.value)}
        >
          <option value="">Select Access Role</option>
          <option value="Author">Author</option>
          <option value="Editor">Editor</option>
          <option value="Reviewer">Reviewer</option>
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <Checkbox
          isChecked={show}
          onChange={(e) => setShow(e.target.checked)}
        >
          Show Form
        </Checkbox>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Deadline</FormLabel>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </FormControl>

      <Heading as="h2" size="lg" mb={4}>
        Questions
      </Heading>
      {questions.map((q, qIndex) => (
        <Box key={qIndex} mb={6}>
          <FormControl mb={4}>
            <FormLabel>Question {qIndex + 1}</FormLabel>
            <Input
              type="text"
              value={q.question}
              onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Type</FormLabel>
            <Select
              value={q.type}
              onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
            >
              <option value="">Select Question Type</option>
              <option value="text">Text</option>
              <option value="multiple correct">Multiple Correct</option>
              <option value="single correct">Single Correct</option>
            </Select>
          </FormControl>

          {['multiple correct', 'single correct'].includes(q.type) && (
            <>
              <FormLabel>Options</FormLabel>
              {q.options.map((option, oIndex) => (
                <Box key={oIndex} mb={2} display="flex" alignItems="center">
                  <Input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    mr={2}
                  />
                  <IconButton
                    aria-label="Remove option"
                    icon={<span>&times;</span>}
                    onClick={() => handleRemoveOption(qIndex, oIndex)}
                  />
                </Box>
              ))}
              <Button onClick={() => handleAddOption(qIndex)}>Add Option</Button>
            </>
          )}

          <Button colorScheme="red" onClick={() => handleRemoveQuestion(qIndex)}>
            Remove Question
          </Button>
        </Box>
      ))}

      <Button onClick={handleAddQuestion}>Add Question</Button>

      <Heading as="h2" size="lg" mb={4} mt={6}>
        Shared With
      </Heading>
      {sharedWith.map((email, index) => (
        <Box key={index} mb={4} display="flex" alignItems="center">
          <Input
            type="email"
            value={email}
            onChange={(e) => handleSharedWithChange(index, e.target.value)}
            mr={2}
          />
          <IconButton
            aria-label="Remove email"
            icon={<span>&times;</span>}
            onClick={() => handleRemoveSharedWith(index)}
          />
        </Box>
      ))}

      <Button onClick={handleAddSharedWith}>Add Email</Button>

      <Button colorScheme="blue" mt={4} onClick={handleSubmit}>
        {edit ? "Update Form" : "Create Form"}
      </Button>
    </chakra.form>
  );
};

export default Forms;
