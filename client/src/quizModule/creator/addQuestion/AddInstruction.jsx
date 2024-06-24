import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowLeft } from '@fortawesome/free-solid-svg-icons';
// import './AddInstruction.css';
// import logo from '../../../../assets/images/quiz/logo.png';
import getEnvironment from '../../../getenvironment';

export default function AddInstruction() {
  const [inputValue, setInputValue] = useState('');
  const [storedValues, setStoredValues] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [updatedInstructions, setUpdatedInstructions] = useState('');


  const navigate = useNavigate();
  const apiurl = getEnvironment();

  const handleGoBack = () => {
    const code = window.location.pathname.split('/').filter((path) => path !== 'addinstruction').pop();
    const targetURL = `/quiz/${code}`;
    navigate(targetURL);
  };

  const handlePreview = () => {
    // const code = window.location.pathname.split('/').filter((path) => path !== 'addinstruction').pop();
    const code = window.location.pathname.split('/').filter((path) => path !== 'addinstruction').pop();
    const targetURL2 = `/quiz/${code}/addinstruction/preview`;
    navigate(targetURL2);
  };

  useEffect(() => {
    // Fetch instructions from the backend
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    try {
      const token = localStorage.getItem('token');
      const code = window.location.pathname.split('/').filter((path) => path !== 'addinstruction').pop();

      const response = await fetch(`${apiurl}/quizmodule/faculty/quiz/${code}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        const instructions = data.data.instructions || [];
        setUpdatedInstructions(instructions.join('\n')); // Join instructions into a single string
        setInputValue(instructions.join('\n')); // Set the input value to the updated instructions
      } else {
        console.error('Error fetching instructions:', response);
      }
    } catch (error) {
      console.error('Error fetching instructions:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const code = window.location.pathname.split('/').filter((path) => path !== 'addinstruction').pop();
      const lines = inputValue.split('\n').filter((line) => line.trim() !== '');

      if (lines.length > 0) {
        const instructions = lines.map((line) => line.trim());
        const values = {
          instructions: instructions,
        };

        const response = await fetch(`${apiurl}/quizmodule/faculty/quiz/${code}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values),
        });

        if (response.status === 200) {
          setSubmitted(true);
          setMessage('Instructions updated successfully');
          fetchInstructions(); // Fetch updated instructions from the backend
        } else {
          console.error('Error submitting instructions:', response);
        }
      }
    } catch (error) {
      console.error('Error submitting instructions:', error);
    }

    setSubmitting(false);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div className="quiz-container">
      <div className="left-button-center">
        <button className="go_back" onClick={handleGoBack}>
          <FontAwesomeIcon icon={faCircleArrowLeft} />
        </button>
      </div>
      {/* <img src={logo} alt="" /> */}
      <h2>ADD Instructions</h2>
      <form className="form-some">
        <textarea
          id="inst"
          cols="30"
          rows="10"
          placeholder="Write instructions here ..."
          value={inputValue}
          onChange={handleInputChange}
        />
      </form>
      <button className="submitb" onClick={handleSubmit}>
        Update Instructions
      </button>
      {message && <p>{message}</p>}
      <button  className="submitb" onClick={handlePreview}>Preview</button>
    </div>
  );
}
