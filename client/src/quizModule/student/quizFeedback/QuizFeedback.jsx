import React, { useState, useEffect } from 'react';
// import './QuizFeedback.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faCircle, faStar } from '@fortawesome/free-solid-svg-icons'
// import smileyFace from '../../../../assets/images/student/undraw_Smiley_face_re_9uid.svg'
// import logo from '../../../../assets/images/user/Logo enlarged-03.png'
import getEnvironment from '../../../getenvironment';
// import { useState } from 'react';

const QuizFeedback = () => {

    // const [rating1, setRating1] = useState(0);
    // const [rating2, setRating2] = useState(0);
    const [submitted, setSubmitted] = useState(false);
const [quizDetails,setQuizDetails]=useState(0);
const apiurl = getEnvironment();
useEffect(() => {
        const fetchResultDetails = async () => {
          try {
            const token = localStorage.getItem('token');
            const code = window.location.pathname.split('/')[2];
    
            const response = await fetch(`${apiurl}/quizmodule/student/quiz/${code}/result`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                
              },
            });
    
            if (response.ok) {
              const data = await response.json();
            //   console.log(data.data);
              setQuizDetails(data.data); // Update the state with fetched quiz details
            } else {
              console.error('Failed to fetch quiz details:', response.status);
            }
          } catch (error) {
            console.error('Error fetching quiz details:', error);
          }
        };
    
        fetchResultDetails();
      }, []);
      
      return (
        <div>
            {submitted ? (
                <>
                    <div>
                        {/* <img src= {logo} className="logo_head" /> */}
                    </div>
                    <div className="quizFeedback-main_box">
                        <div className="quizFeedback-heading">
                            <h2>Thank you for your valuable feedback.</h2>
                        </div>
                    </div>
                </>
            ) : (
                <>
            <a href="/summary" className="quizFeedback-home">
                <FontAwesomeIcon icon={faHome} />
            </a>
            <div className="news">
                <div className="score">
                    {/* <img src={smileyFace} alt="" /> */}
                    <div className="your">
                        <h2>{quizDetails.totalScore}/{quizDetails.totalCorrect + quizDetails.totalWrong }</h2>
                    </div>
                </div>
                <div className="report">
                    <h2>Summary</h2>
                    <div className="right_arrow">
                        <FontAwesomeIcon className='summary-dot' icon={faCircle} />
                        <p>Total number of questions: {quizDetails.totalCorrect + quizDetails.totalWrong }</p>
                    </div>
                    <div className="right_arrow">
                        <FontAwesomeIcon className='summary-dot' icon={faCircle} />
                        <p>Attempted questions:  {quizDetails.totalCorrect + quizDetails.totalWrong -quizDetails.totalUnattempt}/ {quizDetails.totalCorrect + quizDetails.totalWrong } </p>
                    </div>
                    <div className="right_arrow">
                        <FontAwesomeIcon className='summary-dot' icon={faCircle} />
                        <p>Questions not attempted: {quizDetails.totalUnattempt}/ {quizDetails.totalCorrect + quizDetails.totalWrong } </p>
                    </div>
                    <div className="right_arrow">
                        <FontAwesomeIcon className='summary-dot' icon={faCircle} />
                        <p>correctly answered questions: {quizDetails.totalCorrect }/ {quizDetails.totalCorrect + quizDetails.totalWrong } </p>
                    </div>
                    <div className="right_arrow" style={{ justifyContent: 'center' }}>
                        <a href="/summary" className="quizFeedback-btn">
                            View Result
                        </a>
                    </div>
                </div>
            </div>

            {/* <div className="videos">
                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/UCZIJI5HVeM"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>

                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/SKmkFOs6a4A"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>

                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/3klNnH13t4U"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div> */}
            {/* 
            <div className="quizFeedback-container">
                <form method="POST" onSubmit={handleSubmit}>
                    <input
                        type="hidden"
                        name="csrfmiddlewaretoken"
                        value="bUIN4NhASn6qJIBGgEwpGRqo4THpgxsmvBQ07w9CN422gzmQXqZdRvHzKOnHtxeI"
                    />

                    <h1 className="shadow">Feedback</h1>
                    <h2 className="centre" style={{ fontWeight: 'bold' }}>
                        Your feedback is valuable to us!!
                    </h2>

                    <h2></h2>

                    <div className="question-list">
                        <h3 className="centre">Mark the difficulty level of the quiz.</h3>
                        <div
                            className="quizFeedback-question"
                        >
                            {[1, 2, 3, 4, 5].map((starIndex) => (
                                <FontAwesomeIcon
                                    key={starIndex}
                                    icon={faStar}
                                    className={`star ${starIndex <= rating1 ? 'active1' : ''}`}
                                    onClick={() => handleStarClick1(starIndex)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="question-list">
                        <h3 className="centre">How sufficient the time of the quiz was?</h3>
                        <div
                            className="quizFeedback-question"
                        >
                            {[1, 2, 3, 4, 5].map((starIndex) => (
                                <FontAwesomeIcon
                                    key={starIndex}
                                    icon={faStar}
                                    className={`star ${starIndex <= rating2 ? 'active2' : ''}`}
                                    onClick={() => handleStarClick2(starIndex)}
                                />
                            ))}
                        </div>
                    </div>

                    <input type="submit" className="quizFeedback-submit s" value="Submit" />

                </form>
            </div> */}
            </>
            )}
        </div>
    );
};

export default QuizFeedback;
