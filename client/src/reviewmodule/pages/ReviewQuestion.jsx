import React, { useState, useRef } from 'react';
import JoditEditor from 'jodit-react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
 import './ReviewQuestion.css'; // Import the CSS file
import getEnvironment from '../../getenvironment';

const apiUrl = getEnvironment();

const AddQuestion = () => {
  const editor = useRef(null);
  const [question, setQuestion] = useState('');
  const toast = useToast();
  const { eventId } = useParams(); // Extract eventId from URL parameters

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newQuestion = {
      eventId,
      question: [question],
      show: true,
      type: [],
      options: []
    };

    try {
      await axios.post(`${apiUrl}/reviewmodule/reviewQuestion/add`, newQuestion);
      toast({
        title: 'Question saved.',
        description: 'Your question has been saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setQuestion('');
    } catch (error) {
      toast({
        title: 'Error saving question.',
        description: 'An error occurred while saving your question.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <div className="add-question-page">
      <h1>Add Review Question</h1>
      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label>Question:</label>
          <JoditEditor
            ref={editor}
            value={question}
            onChange={(newContent) => setQuestion(newContent)}
          />
        </div>
        <button type="submit" className="submit-button">Save Question</button>
      </form>
    </div>
  );
};

export default AddQuestion;
