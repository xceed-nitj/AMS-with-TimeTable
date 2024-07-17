import React, { useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import getEnvironment from '../../getenvironment';
import axios from 'axios';

const ReviewLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const apiUrl = getEnvironment()
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    email:''
  });
  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setFormValues({ ...formValues, [event.target.id]: event.target.value });
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (e) => {
    setIsLoading(true)
    e.preventDefault()

    const userData = { email, password }

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      })

      const data = await response.json();
      console.log(data)
      if(!data.user.isEmailVerified){
        axios.post(`${apiUrl}/auth/verify`, {email : email});
        localStorage.setItem('formValues', JSON.stringify(formValues));
        window.location.href = '/prm/emailverification'
      }else if (response.ok) {
        window.location.href = '/prm/home'
      } else {
        const errorData = await response.json()
        setMessage(`Login failed: ${errorData.message}`)
      }
    } catch (error) {
      console.error('An error occurred', error)
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-h-screen">
      <div className="tw-bg-white tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-mb-4">
        <h2 className="tw-text-2xl tw-mb-4 tw-text-center">Sign In</h2>
        <form onSubmit={handleSubmit}>
          <div className="tw-mb-4">
            <label htmlFor="email" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
              required
            />
          </div>
          <div className="tw-mb-6">
            <label htmlFor="password" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
              required
            />
          </div>
          <div className="tw-flex tw-items-center tw-justify-center">
            <button
              type="submit"
              className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewLogin;