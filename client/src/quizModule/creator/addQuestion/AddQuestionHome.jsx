  import React, { useState, useEffect } from 'react';
  import { useParams, Link } from 'react-router-dom';
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
  import { faCircleArrowLeft, faPenToSquare, faCopy, faGear, faCalendar } from '@fortawesome/free-solid-svg-icons';
  import './AddQuestionHome.css';
  import AddQuestion from './AddQuestion';
  import Viewer from '../../components/quill/viewer';
import getEnvironment from '../../../getenvironment';

  const QuestionGet = ({ questionGet, handleEditQuestion, handleDeleteQuestion, handleEditorChange }) => {
    const { question, answer, explanation, options, mark, questionLevel, questionType } = questionGet;

    return (
      <div >
        Question:<Viewer content={question}/>
        <p>Answer: {answer}</p>
        Explanation: <Viewer content={explanation} />
        <p>Marks: {mark}</p>
        <p>Level: {questionLevel}</p>
        <p>Type: {questionType}</p>
        {questionType === "single" && (
          <div>
            <p>Options:</p>
            {options.map((option, index) => {
              return (
                <div key={index}>
                  <input
                    type="radio"
                    name={`answer-${index}`} // Use a unique name for each question
                    value={option.value}
                    checked={option.isCorrect} // Only the correct answer will be checked
                    disabled // Disable the radio button
                  />
                  <label>{option.value}</label>
                </div>
              );
            })}
          </div>
        )}
        {questionType === "multiple" && (
          <div>
            <p>Options:</p>
            {options.map((option, index) => {
              return (
                <div key={index}>
                  <input
                    type="checkbox"
                    name={`answer-${index}`}
                    value={option.value}
                    checked={option.isCorrect}
                    readOnly
                  />
                  <label>{option.value}</label>
                </div>
              );
            })}
          </div>
        )}
        {questionType === "numerical" && (
          <div>
            <p>Answer: </p>
            {/* <input type="text" name="answer" /> */}
          </div>
        )}
        <button onClick={() => handleEditQuestion(questionGet)}>Edit</button>
        <button onClick={() => handleDeleteQuestion(questionGet)}>Delete</button>
      </div>
    );
  };

  export const AddQuestionHome = () => {
    const [addQuestion, setAddQuestion] = useState(false);
    const [quiz, setQuiz] = useState();
    const { code } = useParams();
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [showAddQuestionButton, setShowAddQuestionButton] = useState(true);
    const [editQuestionData, setEditQuestionData] = useState(null);
    const [content, setContent] = useState('');
    const apiurl = getEnvironment();

    const handleEditorChange = (value) => {
      setContent(value);
    };
    const token = localStorage.getItem('token');
    // Fetching individual quiz questions
    useEffect(() => {
      const fetchQuizQuestions = async () => {
        try {
          console.log(token);
          const response = await fetch(`${apiurl}/quizmodule/faculty/quiz/${code}/questions`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
          });

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
          const response = await fetch(`${apiurl}/quizmodule/faculty/quiz/${code}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
          });

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
        await navigator.clipboard.writeText(currentURL+'/test');
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
        const response = await fetch(`${apiurl}/api/quiz/quizquestion/${code}/${question.id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const updatedQuestions = quizQuestions.filter((q) => q.id !== question.id);
          setQuizQuestions(updatedQuestions);
        } else {
          console.error('Failed to delete question:', response.status);
        }
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    };

    return (
      <div>
        <div className="left-button-center">
          <Link to="/summary" className="go_back">
            <FontAwesomeIcon icon={faCircleArrowLeft} />
          </Link>
        </div>
        <div className="bottom-left-button">
          <Link to={'/quiz/' + `${code}` + '/addinstruction'} className="instructions">
            <FontAwesomeIcon icon={faPenToSquare} />
            <p> Add Instruction</p>
            <p className="instructive_text2">These instructions will be shown to the student before the start of the exam.</p>
          </Link>
        </div>
        <div className="center-area">
          <div className="topic-box">
            <h1 className="topic">{quiz?.quizName}</h1>
          </div>
          {!addQuestion ? (
            <div className="question_box">
              {showAddQuestionButton && (
                <div onClick={addQuestionHandler} className="add-question">
                  Add Question
                </div>
              )}
            </div>
          ) : (
            <AddQuestion editQuestionData={editQuestionData} onClose={handleCloseAddQuestion} />

          )}
          <div>
        {quizQuestions.map((questionGet) => (
          <QuestionGet
            key={questionGet.id}
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
          <Link to={'/quiz/' + `${code}` + '/settings'} className="icon-bar-menu icon-2">
            <FontAwesomeIcon icon={faGear} />
          </Link>
          <div id="settings">Setting</div>
          <Link to={'/quiz/' + `${code}` + '/result'} className="icon-bar-menu icon-3">
            <FontAwesomeIcon icon={faCalendar} />
          </Link>
          <div id="result">Result</div>
          <Link to={'/quiz/' + `${code}` + '/addinstruction'} className="icon-bar-menu icon-4">
            <FontAwesomeIcon icon={faPenToSquare} />
            {/* <p> Add Instruction</p> */}
            <div id="instructions"></div>
            {/* /<p className="instructive_text2">These instructions will be shown to the student before the start of the exam.</p> */}
          </Link>
        </div>
      </div>
    );
  };

  export default AddQuestionHome;
