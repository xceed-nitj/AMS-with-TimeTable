import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import './PreviewInstructions.css';
import PropTypes from 'prop-types';
import logo from '../../../assets/images/quiz/logo.png';
import {formatTime} from '../../../components/timer/formatTime.js';
import getEnvironment from '../../../getenvironment';
// import NoRightClickPage from '../../../components/security/noRightClick';

export default function PreviewInstructions() {
  const [instructions, setInstructions] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timer, setTimer] = useState(); // Remaining time in seconds
  const [isTimerComplete, setIsTimerComplete] = useState(false); // Indicates whether the start timer has completed
  const [marginTimer, setMarginTimer] = useState();
  const [isMarginTimerComplete, setIsMarginTimerComplete] = useState(false);
  const [isStartButtonVisible, setIsStartButtonVisible] = useState(true); // Indicates whether the start button should be visible
  const code = window.location.pathname.split('/')[2];
  const navigate = useNavigate();
  const apiurl = getEnvironment();

  const [facultyDetails, setFacultyDetails] = useState({});

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const code = window.location.pathname.split('/')[2];
  
        const response = await fetch(`${apiurl}/api/quiz/quizzes/${code}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log(data)
          setInstructions(data.data.instructions);
  
          // Calculate remaining start time based on the start time and current time
          const startTime = new Date(data.data.startTime).getTime();
          const currentTime = new Date().getTime();
          const remainingTime = Math.floor((startTime - currentTime) / 1000);
          setTimer(remainingTime);
          console.log(remainingTime);
          const marginTime = new Date(data.data.marginTime).getTime();
          const remainingMarginTime = Math.floor((marginTime - currentTime) / 1000);
          setMarginTimer(remainingMarginTime);
          console.log(remainingMarginTime);
          // Fetch user details
          const response2 = await fetch(`${apiurl}/api/users/${data.data.userId}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
          if (response2.ok) {
            const facultyData = await response2.json();
            console.log(facultyData);
            setFacultyDetails(facultyData);
          } else {
            console.error('Failed to fetch faculty details:', response2.status);
          }
  
        } else {
          console.error('Failed to fetch quiz details:', response.status);
        }
      } catch (error) {
        console.error('Error fetching quiz details:', error);
      }
    };
  
    fetchQuizDetails();
  }, []);
  

  useEffect(() => {
      const updateTimer = () => {
        setTimer(prevTimer => {
          if (prevTimer <= 0) {
            setIsTimerComplete(true);
            setIsStartButtonVisible(true);
            return 0;
          }
          return prevTimer - 1;
        });
      };

    const timerInterval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, []);


  useEffect(() => {
    const updateMarginTimer = () => {
      setMarginTimer(prevTimer2 => {
        if (prevTimer2 < 0) {
          setIsMarginTimerComplete(true);
          // setIsStartButtonVisible(false);
          return 0;
        }
        return prevTimer2 - 1;
      });  
    };
      const timerInterval2 = setInterval(updateMarginTimer, 1000);

  return () => {
    clearInterval(timerInterval2);
  };
}, []);
  

  const handleGoBack = () => {
    if (isFullscreen) {
      navigate(-1);
    }
  };


  const formattedTime = formatTime(timer);
  const marginformattedTime=formatTime(marginTimer);
  

  const handleEnterFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
    setIsFullscreen(true);
  };

  const handleExitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  };


  useEffect(() => {
    const exitFullScreenHandler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', exitFullScreenHandler);
    document.addEventListener('mozfullscreenchange', exitFullScreenHandler);
    document.addEventListener('webkitfullscreenchange', exitFullScreenHandler);
    document.addEventListener('msfullscreenchange', exitFullScreenHandler);

    return () => {
      document.removeEventListener('fullscreenchange', exitFullScreenHandler);
      document.removeEventListener('mozfullscreenchange', exitFullScreenHandler);
      document.removeEventListener('webkitfullscreenchange', exitFullScreenHandler);
      document.removeEventListener('msfullscreenchange', exitFullScreenHandler);
    };
  }, []);


  const handleStartQuiz = () => {
    // Add your logic to start the quiz here
    // Add your logic to start the quiz here
  if (isTimerComplete && !isMarginTimerComplete) {
    const code = window.location.pathname.split('/')[2];
    console.log('Quiz started!');
    const targetURL = `/quiz/${code}/live`;
    navigate(targetURL);
  }
  };

  return (
<>    <body>
    <div className="instructions_student">
      <img src={facultyDetails.brandLogo?facultyDetails.brandLogo:logo} className="logo2" alt="" />
      <h2>Instructions to the candidates</h2>

      <div className="lines_s">
        <i className="bx bxs-right-arrow"></i>
        Do not try to refresh your tab while taking the exam! Test will be submitted automatically!
      </div>

      <div className="lines_s">
        <i className="bx bxs-right-arrow"></i>
        Do not attempt to change the tab while taking the exam! Test will be submitted automatically!
      </div>
      <div className="lines_s">
        <i className="bx bxs-right-arrow"></i>
        Individual questions are timed, you don't have any chance to answer it later!
      </div>
      <div className="lines_s">
        <i className="bx bxs-right-arrow"></i>
        Do not attempt to google search on a secondary device, the timer has been set appropriately!
      </div>



      {instructions.length > 0 && (
        <ul className="instruction-list">
          {instructions.map((item, index) => (
            <li className="lines_s" key={index}>
              <i className="bx bxs-right-arrow"></i>
              {item}
            </li>
          ))}
        </ul>
      )}
      {!isFullscreen && <div className="lines_s">
        <i className="bx bxs-right-arrow"></i>
        Quiz will start in: <span id="the_timer">{formattedTime}</span>
      </div>
}
{isFullscreen && isTimerComplete && (
  <div className="lines_s">
    <i className="bx bxs-right-arrow timer"></i>
    {isMarginTimerComplete ? (
      <span className="red-text">Timeup! You cannot take this Quiz! Contact faculty!</span>
    ) : (
      <>
        <span className="red-text"> Your chance to take the quiz will end in: {marginformattedTime}</span>
      </>
    )}
  </div>
)}



      {/* {isFullscreen && (
        <button className="btn-back" onClick={handleGoBack}>
          Go Back
        </button>
      )} */}




      {!isFullscreen && (
        <button className="btn_start" onClick={handleEnterFullScreen}>
          Enter Fullscreen
        </button>
      )}
  
   
{isFullscreen && !isMarginTimerComplete && (
  <button onClick={handleStartQuiz}>
    {isTimerComplete ? `Start Quiz` : `${formattedTime}`}
  </button>
)}

</div>
</body>
</>



  );
}

// PreviewInstructions.propTypes = {
//   // code: PropTypes.string.isRequired,
// };
