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
  const [type, setType] = useState('');
  const [options, setOptions] = useState(['']);
  const toast = useToast();
  const { eventId ,paperId} = useParams(); 

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setOptions(['']); 
  };

  const handleOptionChange = (index, newValue) => {
    const updatedOptions = options.map((option, i) => (i === index ? newValue : option));
    setOptions(updatedOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newQuestion = {
      eventId,
      paperId,
      question: [question],
      show: true,
      type: [type],
      options: options.filter(option => option.trim() !== '') 
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
      setType('');
      setOptions(['']);
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
        <div className="form-group">
          <label>Type:</label>
          <select value={type} onChange={handleTypeChange}>
            <option value="">Select Type</option>
            <option value="Single Correct">Single Correct</option>
            <option value="Multiple Correct">Multiple Correct</option>
            <option value="Text">Text</option>
          </select>
        </div>
        {(type === 'Single Correct' || type === 'Multiple Correct') && (
          <div className="form-group">
            <label>Options:</label>
            {options.map((option, index) => (
              <div key={index} className="option">
                <input
                  type={type === 'Single Correct' ? "radio" : "checkbox"}
                  name={type === 'Single Correct' ? "singleCorrectOption" : `multipleCorrectOption${index}`}
                  disabled
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                {options.length > 1 && (
                  <button type="button" className="remove-button" onClick={() => handleRemoveOption(index)}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" className="add-button" onClick={handleAddOption}>Add Option</button>
          </div>
        )}
        <button type="submit" className="submit-button">Save Question</button>
      </form>
    </div>
  );
};

export default AddQuestion;
