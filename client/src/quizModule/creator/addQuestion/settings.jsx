import React, { useState, useEffect } from 'react';
import moment from 'moment-timezone';
import { useNavigate } from 'react-router-dom';
// import './settings.css'
import getEnvironment from '../../../getenvironment';

const Settings = () => {
  const [quizData, setQuizData] = useState({
    startTime: '',
    marginTime: '',
    resultTime: '',
    quizName: '',
    negativeMarking: 0,
    preventMobile: false,
    allowTabchange: false,
  });
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const apiurl = getEnvironment();


  useEffect(() => {
    // Fetch quiz details from the backend
    fetchQuizDetails();
  }, []);

  const fetchQuizDetails = async () => {
    try {
      // Make an API call to fetch quiz details
      const token = localStorage.getItem('token');
      const code = window.location.pathname.split('/').filter((path) => path !== 'settings').pop();
      console.log(token);
      const response = await fetch(`${apiurl}/quizmodule/faculty/quiz/${code}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
          // Include any other headers required by your API
        },
      });

      if (response.ok) {
        const quizDetail = await response.json();
        // console.log(quizDetail)
        // Update the form state with the fetched quiz details
        const quizDetails = quizDetail.data;
        setQuizData({
          startTime: convertToIST(quizDetails.startTime),
          marginTime: convertToIST(quizDetails.marginTime),
          resultTime: convertToIST(quizDetails.resultTime),
          quizName: quizDetails.quizName,
          negativeMarking: quizDetails.negativeMarking,
          preventMobile: quizDetails.preventMobile,
          allowTabchange: quizDetails.allowTabchange,
        });
        
      } else {
        console.error('Failed to fetch quiz details');
      }
    } catch (error) {
      console.error('Error occurred while fetching quiz details:', error);
    }
  };

  const convertToIST = (utcDateTime) => {
    return moment.utc(utcDateTime).tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setQuizData({
        ...quizData,
        [name]: checked,
      });
    } else {
      setQuizData({
        ...quizData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const code = window.location.pathname.split('/').filter((path) => path !== 'settings').pop();
      console.log(code);
      const response = await fetch(`${apiurl}/quizmodule/faculty/quiz/${code}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
          // Include any other headers required by your API
        },
        body: JSON.stringify({
          ...quizData,
          startTime: moment.tz(quizData.startTime, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          marginTime: moment.tz(quizData.marginTime, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          resultTime: moment.tz(quizData.resultTime, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        }),
      });

      if (response.ok) {
        // Quiz details updated successfully
        console.log('Quiz details updated successfully');
        setMessage('Quiz details updated successfully');
      } else {
        console.error('Failed to update quiz details');
        setMessage('Failed to update quiz details');
        
      }
    } catch (error) {
      console.error('Error occurred while updating quiz details:', error);
    }
  };

  const handleGoBack = () => {
    const code = window.location.pathname.split('/').filter((path) => path !== 'settings').pop();
    const targetURL = `/quiz/${code}`;
    navigate(targetURL);
  };

  return (
    <div>
      <div className='container'>
      <h1>Settings</h1>
      {message && (
                <div className='success'>
                  {message}
                </div>
            )}
         
      <form onSubmit={handleSubmit}>
        <table className="form-table">
          <tbody>
            <tr>
              <td className="form-label">Quiz Name:</td>
              <td><input type="text" className="form-input" name="quizName" value={quizData.quizName} onChange={handleInputChange} /></td>
            </tr>
            <tr>
              <td className="form-label">Start Time:</td>
              <td><input type="datetime-local" className="form-input" name="startTime" value={quizData.startTime} onChange={handleInputChange} /></td>
            </tr>
            <tr>
              <td className="form-label">Margin Time:</td>
              <td><input type="datetime-local" className="form-input" name="marginTime" value={quizData.marginTime} onChange={handleInputChange} /></td>
            </tr>
            <tr>
              <td className="form-label">Result Time:</td>
              <td><input type="datetime-local" className="form-input" name="resultTime" value={quizData.resultTime} onChange={handleInputChange} /></td>
            </tr>
            <tr>
              <td className="form-label">Negative Marking:</td>
              <td><input type="number" className="form-input" name="negativeMarking" value={quizData.negativeMarking} onChange={handleInputChange} /></td>
            </tr>
            <tr>
              <td className="form-label">Prevent Mobile:</td>
              <td><input type="checkbox" className="form-checkbox" name="preventMobile" checked={quizData.preventMobile} onChange={handleInputChange} /></td>
            </tr>
            <tr>
              <td className="form-label">Allow Tab Change:</td>
              <td><input type="checkbox" className="form-checkbox" name="allowTabchange" checked={quizData.allowTabchange} onChange={handleInputChange} /></td>
            </tr>
          </tbody>
        </table>

      </form>
      <div className="button-group-settings">
          <button type="submit" className="btn_save" onClick={handleSubmit}>Submit</button>

          <button type="button" className="btn_back" onClick={handleGoBack}>Back</button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
