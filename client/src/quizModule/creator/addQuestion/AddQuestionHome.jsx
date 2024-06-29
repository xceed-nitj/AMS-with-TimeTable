import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleArrowLeft,
  faArrowLeft,
  faPenToSquare,
  faCopy,
  faGear,
  faCalendar,
  faTrash,
  faPlus,
  faAngleUp,
  faAngleDown,
} from '@fortawesome/free-solid-svg-icons';
// import './AddQuestionHome.css';
import AddQuestion from './AddQuestion';
import Viewer from '../../components/quill/viewer';
import getEnvironment from '../../../getenvironment';

import {
  Box,
  Stack,
  Tooltip,
  Center,
  Checkbox,
  Heading,
  Button,
  ButtonGroup,
  Input,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useDisclosure,
} from '@chakra-ui/react';

const QuestionGet = ({
  questionGet,
  handleEditQuestion,
  handleDeleteQuestion,
  index,
  handleEditorChange,
}) => {
  const {
    question,
    answer,
    explanation,
    options,
    mark,
    questionLevel,
    questionType,
  } = questionGet;
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Box className="question">
      <Stack spacing={2}>
        <Heading fontWeight="500" as="h4" size="sm">
          {index + 1}. Question:{' '}
        </Heading>
        <Viewer content={question} />
        {questionType === 'single' && (
          <Box>
            <Heading fontWeight="500" as="h4" size="sm">
              Options:{' '}
            </Heading>
            <Box className="option_holder">
              {options.map((option, index) => {
                return (
                  <Box key={index}>
                    <Checkbox
                      isDisabled
                      defaultChecked={option.isCorrect}
                      value={option.value}
                      name={`answer-${index}`}
                    >
                      {option.value}
                    </Checkbox>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
        {questionType === 'multiple' && (
          <Box>
            <Heading fontWeight="500" as="h4" size="sm">
              Options:{' '}
            </Heading>
            <Box className="option_holder">
              {options.map((option, index) => {
                return (
                  <span className="option" key={index}>
                    <Checkbox
                      isDisabled
                      defaultChecked={option.isCorrect}
                      value={option.value}
                      name={`answer-${index}`}
                    >
                      {option.value}
                    </Checkbox>
                  </span>
                );
              })}
            </Box>
          </Box>
        )}
        <Box className="explanation-container">
          <Box className="toggle-button-container">
            <Heading fontWeight="500" as="h4" size="sm">
              Explanation:
            </Heading>
            <Button
              onClick={onToggle}
              mb={4}
              className="toggle-button"
              sx={{ backgroundColor: 'white' }}
            >
              {isOpen ? (
                <FontAwesomeIcon icon={faAngleUp} />
              ) : (
                <FontAwesomeIcon icon={faAngleDown} />
              )}
            </Button>
          </Box>
          <Accordion allowMultiple index={isOpen ? [0] : []}>
            <AccordionItem className="accordion-item" sx={{ border: 'none' }}>
              {({ isExpanded }) => (
                <>
                  <h2 style={{ height: '0px' }}>
                    <AccordionButton sx={{ height: '0px' }}></AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Viewer content={explanation} />
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
          </Accordion>
        </Box>
        {questionType === 'numerical' && (
          <Stack>
            <Heading fontWeight="500" as="h4" size="sm">
              Answer: {answer}{' '}
            </Heading>
          </Stack>
        )}
        <Box className="question_info" mb={2}>
          <Heading fontWeight="500" as="h4" size="sm">
            Marks: {mark}
          </Heading>
          <Heading fontWeight="500" as="h4" size="sm">
            Level: {questionLevel}
          </Heading>
          <Heading fontWeight="500" as="h4" size="sm">
            Type: {questionType}
          </Heading>
        </Box>
      </Stack>
      <Center>
        <ButtonGroup gap="4">
          <Tooltip
            bg="#3182CE"
            color="white"
            label="Edit Question"
            placement="left"
            hasArrow
          >
            <Button
              onClick={() => handleEditQuestion(questionGet)}
              colorScheme="blue"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </Button>
          </Tooltip>
          <Tooltip
            bg="#C53030"
            color="white"
            label="Delete Question"
            placement="right"
            hasArrow
          >
            <Button
              onClick={() => handleDeleteQuestion(questionGet)}
              colorScheme="red"
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Center>
    </Box>
  );
};

export const AddQuestionHome = () => {
  const [addQuestion, setAddQuestion] = useState(false);
  const [quiz, setQuiz] = useState();
  const { code } = useParams();
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showAddQuestionButton, setShowAddQuestionButton] = useState(true);
  const [addQuestionButton, setAddQuestionButton] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState(null);
  const [content, setContent] = useState('');
  const apiurl = getEnvironment();

  const observer = new window.IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setAddQuestionButton(false);
      } else {
        setAddQuestionButton(true);
      }
    },
    {
      root: null,
      threshold: 0.1,
    }
  );

  setTimeout(() => {
    if (document.readyState === 'complete') {
      let element = document.getElementById('add_question_box');
      observer.observe(element);
    }
    // else {
    //   let element = document.getElementById('add_question_box');
    //   observer.observe(element);
    // }
  }, 1000);

  const handleEditorChange = (value) => {
    setContent(value);
  };
  const token = localStorage.getItem('token');
  // Fetching individual quiz questions
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        // console.log(token);
        const response = await fetch(
          `${apiurl}/quizmodule/faculty/quiz/${code}/questions`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setQuizQuestions(data.data);
        } else {
          console.error('Failed to fetch quiz questions:', response.status);
        }
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
      }
    };

    fetchQuizQuestions();
  }, [code]);

  const handleCloseAddQuestion = () => {
    setAddQuestion(false);
  };

  /// Fetching quiz name
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await fetch(
          `${apiurl}/quizmodule/faculty/quiz/${code}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setQuiz(data.data);
        } else {
          console.error('Failed to fetch quiz details:', response.status);
        }
      } catch (error) {
        console.error('Error fetching quiz details:', error);
      }
    };

    fetchQuizDetails();
  }, [code]);

  const addQuestionHandler = () => {
    setEditQuestionData(null);
    setAddQuestion(true);
  };

  const handleCopyLink = async () => {
    const currentURL = window.location.href;

    try {
      await navigator.clipboard.writeText(currentURL + '/test');
      console.log('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleEditQuestion = (question) => {
    setEditQuestionData(question);
    setAddQuestion(true);
  };

  const handleDeleteQuestion = async (question) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiurl}/api/quiz/quizquestion/${code}/${question._id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const updatedQuestions = quizQuestions.filter(
          (q) => q._id !== question._id
        );
        setQuizQuestions(updatedQuestions);
      } else {
        console.error('Failed to delete question:', response.status);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  return (
    <>
      {/* {addQuestionButton && !addQuestion && (
        <Tooltip
          bg="#3E9595"
          hasArrow
          color="white"
          label="Add Question"
          placement="left"
        >
          <div onClick={addQuestionHandler} className="extra-add-question">
            <FontAwesomeIcon icon={faPlus} />
          </div>
        </Tooltip>
      )} */}
      <div className="whole_container">
        <div className="center-area">
          <Box className="left-button-center-container">
            <div className="left-button-center">
              <Link to="/summary" className="go_back">
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
            </div>
          </Box>
          <Box className="topic-box">
            <Heading as="h2" size="xl">
              {quiz?.quizName}
            </Heading>
          </Box>
          {!addQuestion ? (
            <div className="question_box" id="add_question_box">
              {showAddQuestionButton && (
                <div onClick={addQuestionHandler} className="add-question">
                  Add Question
                </div>
              )}
            </div>
          ) : (
            <AddQuestion
              editQuestionData={editQuestionData}
              onClose={handleCloseAddQuestion}
            />
          )}

          <Tooltip
            bg="#D2D2D2"
            hasArrow
            color="black"
            label="These instructions will be shown to the student before the start of the exam."
          >
            <div className="instruction-section-container">
              <Link
                to={'/quiz/' + `${code}` + '/addinstruction'}
                className="instruction-section"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <p> Add Instruction</p>
              </Link>
            </div>
          </Tooltip>
          <div className="question_get">
            {quizQuestions.map((questionGet, index) => (
              <QuestionGet
                key={questionGet._id}
                index={index}
                questionGet={questionGet}
                handleEditQuestion={handleEditQuestion}
                handleDeleteQuestion={handleDeleteQuestion}
              />
            ))}
          </div>
        </div>
        <div className="icon-bar">
          <button className="icon-bar-menu icon-1" onClick={handleCopyLink}>
            <FontAwesomeIcon icon={faCopy} />
          </button>
          <div className="copy_link">Copy Link</div>
          <Link
            to={'/quiz/' + `${code}` + '/settings'}
            className="icon-bar-menu icon-2"
          >
            <FontAwesomeIcon icon={faGear} />
          </Link>
          <div id="settings">Setting</div>
          <Link
            to={'/quiz/' + `${code}` + '/result'}
            className="icon-bar-menu icon-3"
          >
            <FontAwesomeIcon icon={faCalendar} />
          </Link>
          <div id="result">Result</div>
          <Link
            to={'/quiz/' + `${code}` + '/addinstruction'}
            className="icon-bar-menu icon-4"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            <div id="instructions"></div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AddQuestionHome;
