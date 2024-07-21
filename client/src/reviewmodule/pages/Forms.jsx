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
  const toast = useToast();
  const { eventId, paperId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
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
      paperId,
      question: [question],
      show,
      type: [type],
      options: options.filter(option => option.trim() !== ''),
      order: [parseInt(order, 10)],
      title,
      section,
      accessRole,
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
    }

    try {
      if (edit) {
        await axios.patch(`${apiUrl}/reviewmodule/reviewQuestion/${edit}`, editQuestion);
      } else {
        await axios.post(`${apiUrl}/reviewmodule/forms/`, newQuestion);
      }
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
      setOrder('');
      setTitle('');
      setSection('');
      setAccessRole('');
      setShow(false);
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
                  <Button type="button" colorScheme='red' onClick={() => handleRemoveOption(index)}>Remove</Button>
                )}
              </div>
            ))}
            <Button type="button" colorScheme='green' onClick={handleAddOption}>Add Option</Button>
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
          />
        </div>
        <div className="form-group">
          <Box bg={'#48835d'} style={{ fontWeight: '500', opacity: '100%', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }} p={2}>
            <Text color="white" textAlign={'center'}>Access Role</Text>
          </Box>
          <Input
            type="text"
            value={accessRole}
            onChange={(e) => setAccessRole(e.target.value)}
          />
        </div>
        <div className="form-group">
          <Checkbox
            isChecked={show}
            onChange={(e) => setShow(e.target.checked)}
          >
            Show
          </Checkbox>
        </div>
        {edit ? (
          <Button
            onClick={handleSubmit}
            colorScheme="cyan"
            className="tw-m-auto tw-px-8 tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
          >
            Update Question
          </Button>
        ) : (
          (!type) ? '' : (
            <Button
              onClick={handleSubmit}
              colorScheme="cyan"
              className="tw-m-auto tw-px-8 tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
            >
              Save Question
            </Button>
          )
        )}
      </FormControl>
    </div>
  );
};

export default Forms;
