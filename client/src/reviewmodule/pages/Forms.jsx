import React, { useState, useRef, useEffect } from 'react';
import JoditEditor from 'jodit-react';
import axios from 'axios';
import { useToast, FormLabel, FormControl, Input, Button, chakra, Heading, IconButton, Box, Text, Checkbox, Select } from '@chakra-ui/react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import './ReviewQuestion.css'; // Import the CSS file
import getEnvironment from '../../getenvironment';

const apiUrl = getEnvironment();

const Forms = () => {
  const editor = useRef(null);
  const [question, setQuestion] = useState('');
  const [type, setType] = useState('');
  const [options, setOptions] = useState(['']);
  const [order, setOrder] = useState('');
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [accessRole, setAccessRole] = useState('');
  const [show, setShow] = useState(false);
  const [sharedWith, setSharedWith] = useState(['']);
  const [deadline, setDeadline] = useState('');
  const toast = useToast();
  const { eventId } = useParams(); // Removed paperId from useParams
  const [searchParams] = useSearchParams();
  const [edit, setEdit] = useState((searchParams.get('edit')) ? searchParams.get('edit') : false); // this stores the id of question or false(new question)

  if (edit) useEffect(() => { fetchSavedQuestion(edit) }, [edit])

  const fetchSavedQuestion = async (qId) => {
    try {
      const response = await axios.get(`${apiUrl}/reviewmodule/forms/${qId}`);
      setQuestions(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // setLoading(false);
      toast({
        title: 'Error fetching questions',
        description: 'An error occurred while fetching the questions.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  const setQuestions = (qData) => {
    setType(qData.type[0])
    setOrder(qData.order[0])
    setQuestion(qData.question[0])
    if (qData.options.length) setOptions(qData.options)
    setTitle(qData.title)
    setSection(qData.section)
    setAccessRole(qData.accessRole)
    setShow(qData.show)
  }

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setOptions(['']);
  };

  const handleOptionChange = (index, newValue) => {
    const updatedOptions = options.map((option, i) => (i === index ? newValue : option));
    setOptions(updatedOptions);
  };

  const handleSharedWithChange = (index, newValue) => {
    const updatedSharedWith = sharedWith.map((email, i) => (i === index ? newValue : email));
    setSharedWith(updatedSharedWith);
};

const handleAddSharedWith = () => {
    setSharedWith([...sharedWith, '']);
};

const handleRemoveSharedWith = (index) => {
    const updatedSharedWith = sharedWith.filter((_, i) => i !== index);
    setSharedWith(updatedSharedWith);
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

  const handleSubmit = async () => {
    const newQuestion = {
      eventId,
      question: [question],
      show,
      type: [type],
      options: options.filter(option => option.trim() !== ''),
      order: [parseInt(order, 10)],
      title,
      section,
      accessRole,
      sharedWith: sharedWith.filter(email => email.trim() !== ''),
      deadline,
  };
  
  const editQuestion = {
      question: [question],
      show,
      type: [type],
      options: options.filter(option => option.trim() !== ''),
      order: [parseInt(order, 10)],
      title,
      section,
      accessRole,
      sharedWith: sharedWith.filter(email => email.trim() !== ''),
      deadline,
  };
  

  try {
    if (edit) {
      const response = await axios.patch(`${apiUrl}/reviewmodule/reviewQuestion/${edit}`, editQuestion);
      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Question saved.',
          description: 'Your question has been saved successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to update question');
      }
    } else {
      const response = await axios.post(`${apiUrl}/reviewmodule/forms/`, newQuestion);
      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Question saved.',
          description: 'Your question has been saved successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to save new question');
      }
    }

    // Reset form fields
    setQuestion('');
    setType('');
    setOptions(['']);
    setOrder('');
    setTitle('');
    setSection('');
    setAccessRole('');
    setSharedWith(['']);
    setDeadline('');
    setShow(false);

  } catch (error) {
    console.error('Error saving question:', error);
    toast({
      title: 'Error saving question.',
      description: 'An error occurred while saving your question.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }
};

  const HeaderReviewQuestion = ({ title }) => {
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

  return (
    <div className="add-question-page">
      <Box bg="black" p={0.2} width='80%'>
        <HeaderReviewQuestion color="white" textAlign="center" title={'Fill the Form' + (type ? ' - ' + type : '')} />
      </Box>
      <br />
      <FormControl onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="question-form">

        <div className="form-group">
          <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
            <Text color="white" textAlign={'center'}>Question</Text>
          </Box>
          <JoditEditor
            ref={editor}
            value={question}
            onChange={(newContent) => setQuestion(newContent)}
          />
        </div>
        <div className="form-group">
          <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
            <Text color="white" textAlign={'center'}>Type</Text>
          </Box>
          <select value={type} onChange={handleTypeChange} id='typeSelector'>
            <option value="">Select Type</option>
            <option value="Single Correct">Single Correct</option>
            <option value="Multiple Correct">Multiple Correct</option>
            <option value="Text">Text</option>
          </select>
        </div>
        <div className="form-group">
          <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
            <Text color="white" textAlign={'center'}>Order</Text>
          </Box>
          <select value={order} onChange={(e) => setOrder(e.target.value)} id='orderSelector'>
            <option value="">Select Order</option>
            {Array.from({ length: 50 }, (_, i) => i + 1).map(number => (
              <option key={number} value={number}>{number}</option>
            ))}
          </select>
        </div>
        {(type === 'Single Correct' || type === 'Multiple Correct') && (
          <div className="form-group">
            <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
              <Text color="white" textAlign={'center'}>Options</Text>
            </Box>
            {options.map((option, index) => (
              <div key={index} className="option">
                <input
                  type={type === 'Single Correct' ? "radio" : "checkbox"}
                  name={type === 'Single Correct' ? "singleCorrectOption" : `multipleCorrectOption${index}`}
                  disabled
                />
                <Input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                {options.length > 1 && (
                  <Button type="button" onClick={() => handleRemoveOption(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" onClick={handleAddOption}>
              Add Option
            </Button>
          </div>
        )}
        <div className="form-group">
          <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
            <Text color="white" textAlign={'center'}>Title</Text>
          </Box>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="form-group">
          <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
            <Text color="white" textAlign={'center'}>Section</Text>
          </Box>
          <Input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="form-group">
          <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
            <Text color="white" textAlign={'center'}>Access Role</Text>
          </Box>
          <Select value={accessRole} onChange={(e) => setAccessRole(e.target.value)}>
            <option value="">Select Access Role</option>
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Reviewer">Reviewer</option>
            <option value="Author">Author</option>
          </Select>
        </div>
        <div className="form-group">
    <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
        <Text color="white" textAlign={'center'}>Share With (Emails)</Text>
    </Box>
    {sharedWith.map((email, index) => (
        <div key={index} className="shared-with">
            <Input
                type="email"
                value={email}
                onChange={(e) => handleSharedWithChange(index, e.target.value)}
                onKeyPress={handleKeyPress}
            />
            {sharedWith.length > 1 && (
                <Button type="button" onClick={() => handleRemoveSharedWith(index)}>
                    Remove
                </Button>
            )}
        </div>
    ))}
    <Button type="button" onClick={handleAddSharedWith}>
        Add Email
    </Button>
</div>
<div className="form-group">
    <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
        <Text color="white" textAlign={'center'}>Deadline</Text>
    </Box>
    <Input
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        onKeyPress={handleKeyPress}
    />
</div>

        <div className="form-group">
          <Checkbox isChecked={show} onChange={(e) => setShow(e.target.checked)}>Show</Checkbox>
        </div>
        <Button type="button" onClick={handleSubmit}>
          Submit
        </Button>
      </FormControl>
    </div>
  );
};

export default Forms;

