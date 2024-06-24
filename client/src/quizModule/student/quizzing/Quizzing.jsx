import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
// import logo from '../../../../assets/images/user/Logo enlarged-03.png';
// import './Quizzing.css';
// import CKEditorViewer from '../../../../components/ckeditor/ckeditorviewer';
import { formatMinutes } from '../../components/timer/formatMinutes';
import Error from "../../components/error/Error";
import Viewer from '../../components/quill/viewer';
import getEnvironment from '../../../getenvironment';
// import Notification from '../../../../components/notification';
// import TabVisibilityHandler from '../../../../components/tabchange/TabVisibilityHandler';

function Quizzing() {
  const navigate = useNavigate(); 
  const [questionData, setQuestionData] = useState(null); // State to store the fetched question data
  const [answer, setAnswer] = useState([]); // State to track the selected answer (if applicable)
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  // const [totalQuizTime, setTotalQuizTime] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeElapsed, setTimeElapsed]=useState(0);
  // const [isTabActive, setIsTabActive] = useState(true);
  const [progress, setProgress] = useState(0);
  const [dataFetched, setDataFetched] = useState(false);
  const [firstData, setFirstData] = useState(false);
  const [endQuiz,setEndQuiz]=useState(false);
  const apiurl=getEnvironment();
  // State to store the total time taken for the quiz
  // const [totalTimeTaken, setTotalTimeTaken] = useState(0);


  const token = localStorage.getItem('token');
  const code = window.location.pathname.split('/')[2];


  const fetchQuestionDetails = async () => {
    try {

      const response = await fetch(`${apiurl}/quizmodule/student/quiz/${code}`, {
        method: 'GET',
        credentials:'include',
        headers: {
          
        },
      });

      if (response.status === 404) {
        // Redirect to the result page when quiz data is not found (status code: 404)
        const targetURL = `/quiz/${code}/feedback`;
        navigate(targetURL);
      } else if (response.ok) {
        const responseData = await response.json();
        console.log('fetched data',responseData);

        // console.log('fetched data', responseData);

        // Ensure that this line is executed after a successful API response
        setDataFetched(true); // Mark data as fetched
        console.log('dataFetched', dataFetched);  
        setQuestionData(responseData.data.firstQuestion);
        setCurrentIndex(responseData.data.currentIndex);
        setTotalQuestions(responseData.data.totalQuestions);

        // Calculate the progress based on the current index and the total number of questions
        const totalQuestions = responseData.data.totalQuestions;
        setProgress((currentIndex + 1) / totalQuestions);

      } else {
        throw new Error(`Failed to fetch quiz details: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      // Handle error (e.g., show error message to the user)
    }
  };

  useEffect(() => {
    if (!dataFetched) {
      fetchQuestionDetails();      
  console.log('insideloop',dataFetched)
    }
  }, [dataFetched]);

  

  useEffect(() => {
    setSelectedOptions([]);
    setAnswer([]);

    if (questionData) {
      setTimeElapsed(questionData.questionTime);

      const timer = setInterval(() => {
        setTimeElapsed((prevTime) => {
          if (prevTime > 0) {
            return prevTime - 1;
          } else {
            // Time's up, auto-submit the question
            clearInterval(timer);
            handleSubmit(); // Call the handleSubmit function to submit the answer
            return 0;
          }
        });

        // Update the progress bar based on the current question index and total questions
        setProgress((currentIndex + 1) / totalQuestions);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [questionData]);


  // Render a loading message while waiting for data
  if (!questionData) {
    return <div>Loading...</div>;
  }

  
// Custom comparison function to check if two arrays are equal
const areArraysEqual = (array1, array2) => {
  if (array1.length !== array2.length) return false;

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) return false;
  }

  return true;
};

const handleAnswerSelect = (option) => {
  // event.preventDefault(); // Prevent default behavior of the click event

  if (questionData.questionType === 'single') {
    setAnswer([option]); // Store the single option answer as an array with a single element
    setSelectedOptions([option]);
    // setTimeElapsed(10);
  } else if (questionData.questionType === 'multiple') {
    setSelectedOptions((prevSelectedOptions) => {
      const isOptionSelected = prevSelectedOptions.some((selectedOption) => areArraysEqual(selectedOption, option));

      if (isOptionSelected) {
        return prevSelectedOptions.filter((selectedOption) => !areArraysEqual(selectedOption, option));
      } else {
        return [...prevSelectedOptions, option];
      }
    });

    setAnswer((prevAnswer) => {
      const isOptionSelected = prevAnswer.some((selectedOption) => areArraysEqual(selectedOption, option));

      if (isOptionSelected) {
        return prevAnswer.filter((selectedOption) => !areArraysEqual(selectedOption, option));
      } else {
        return [...prevAnswer, option];
      }
    });

    // setTimeElapsed(10);
  }
};


    
  
const handleSubmit = async () => {
  // event.preventDefault();
    // Reset the timer and clear the interval
   
  try {
    const token = localStorage.getItem('token');
    const code = window.location.pathname.split('/')[2];

    const response = await fetch(`${apiurl}/quizmodule/student/quiz/${code}/${currentIndex}`, {
      method: 'POST',
      credentials:'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer, timeElapsed }),
    });
   
    if (response.ok && !endQuiz ) {
      const responseData = await response.json();
      console.log(responseData.data)
      setQuestionData(responseData.data.nextQuestion); // Update the state with the next question's data
      setCurrentIndex(responseData.data.nextIndex); // Update the currentIndex state
      setAnswer([]); // Clear the selected answer for the next question
      setProgress((currentIndex + 1) / totalQuestions);
      // console.log('progress',((currentIndex + 1) / totalQuestions));
      window.scrollTo(0, 0);
    } else if (response.status === 410) {
      // Redirect to the result page when quiz data is not found (status code: 210)
      const targetURL = `/quiz/${code}/feedback`;
      navigate(targetURL); // Replace '/result' with the actual path of your result page
    } else {
      console.error('Failed to submit answer:', response.status);
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
  }
};


  return (
    <div>
      {!endQuiz ? (
      <div className="quizzing-box">
        <div className="quizzing-container" id="quiz">
          <div className="quizzing-wrapper">
            <div className="quizzing-logo">
              {/* <img src={logo} alt="logo" /> */}
            </div>
            <br />
            <h1 id="subject" className="designh1"></h1>
          </div>

          <section id="nav">
            {/* <div id="chance">
              <h5 className="whichtypeof">Relax Timer <span id="reltime">00:10</span></h5>
              <h5 className="whichtypeof1" align="left">Choose the Section :</h5>
            </div> */}

            <div id="quizzing-hide1">
              <div className="time maxwidth1 m_auto">
                {/* <h2>Time taken for this quiz: <span id="timeUsed">{formatMinutes(totalTimeTaken)}</span></h2> */}
                <h2>Question Time Left: <span id="timeLeft">{formatMinutes(timeElapsed)} </span></h2>
              </div>

              <div className="maxwidth1 m_auto">
               <h2>Total Number of questions: <span id="timeUsed">{totalQuestions}</span>  Current Question Number: <span id="timeUsed">{currentIndex+1}</span></h2>
              </div>
            </div>
            
          </section>

          <div className="quizzing-hide">
            <div id="progressBar" className="m_auto">
              <div id="progressBarFull" className="colorbar" style={{ width: `${progress * 100}%` }}></div>
            </div>

            
            {questionData.questionType === 'single' && (
            <div id="singleCorrect" className="colorbar">
              <h2><span id="quizType">Objective Type Question</span></h2>
              <div className="quizzing-header">
                {/* Render the question content */}
                <Viewer content={questionData.question}/>
                {/* Render the options */}
                <div className='quizzing-options-box'>
                <ul id="list">
  {questionData.options.map((option) => (
    <li
      key={option}
      onClick={() => handleAnswerSelect(option)}
      className= {selectedOptions == option ? 'selected-option' : 'quizzing-option'}
    >
      <div>{option}</div>
    </li>
  ))}
</ul>            </div>
              </div>
            </div>
          )}


                      
{questionData.questionType === 'numerical' && (
  <div className='colorbar'>
    <h2><span id="quizType">Numerical Type Question</span></h2>
    <div className="quizzing-header">
      {/* Render the question content */}
      <Viewer content={questionData.question} />
      {/* Render the input field for numerical answer */}
      <form autoComplete="off" onKeyDown={(event) => event.key !== 'Enter'}>
        <label htmlFor="numericalAns">Enter your numerical answer:</label>
        <input
          // id="numericalAns"
          type="number"
          min="0" // Add any constraints if applicable (minimum value, maximum value, etc.)
          max="100"
          onChange={(e) => setAnswer([e.target.value])} // Convert the numerical answer to an array
          placeholder="Type your answer here"
        />
      </form>
    </div>
  </div>
)}



{questionData.questionType === 'multiple' && (
  <div id="multiCorrect">
    <h2><span id="quizType">Multi Correct Question</span></h2>
    <div className="quizzing-header">
      {/* Render the question content */}
      <Viewer content={questionData.question} />
      {/* Render the options */}
      <ul id="listmul">
        {questionData.options.map((option) => (
          <li
            key={JSON.stringify(option)} // Ensure each option array has a unique key
            onClick={() => handleAnswerSelect(option)}
            className={selectedOptions.some((selectedOption) => areArraysEqual(selectedOption, option)) ? 'selected-option' : 'quizzing-option'}
          >
            <div>{option}</div>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}
               

          </div>
          <button id="quizzing-submit"  onClick={handleSubmit}>Next</button>

        </div>

        <form method="POST">
          <input type="hidden" />
          <textarea name="answer" className="quizzing-hide" id="ans" style={{ display: 'none' }}></textarea><br />
          <textarea name="questions" className="quizzing-hide" id="all_questions_in_string" style={{ display: 'none' }}></textarea>
          <input type="submit" className="quizzing-hide" style={{ display: 'none' }} id="quiz_submit_button" value="submit test" />
        </form>
      </div>
    
  ):(

<div>Error</div>
  )}
  </div>
  );
}

export default Quizzing