import React, { useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import FormHeader from './FormHeader'
import getEnvironment from '../../getenvironment'
import axios from 'axios'
import {
  Button,
  Input,
  Text,
  VStack,
  Flex,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const apiUrl = getEnvironment()
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    email:''
  });

  const handleForgotPassword = () => {
    // Navigate to the current URL with an additional path segment
    navigate(`/forgot-password`);
  };

  const handleSubmit = async (e) => {
    setIsLoading(true)
    e.preventDefault()
    formValues.email = email;
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

      const responseData = await response.json()
      console.log(responseData);

      if (typeof responseData.user.isEmailVerified !== 'undefined') {
        if (!responseData.user.isEmailVerified && responseData.user.role.includes('PRM')) {
          localStorage.setItem('formValues', JSON.stringify(formValues));
          await axios.post(`${apiUrl}/auth/otp`, { email });
          navigate('/prm/emailverification');
          return;
        }
      }

      if (typeof responseData.user.isFirstLogin !== 'undefined') {
        if (responseData.user.isFirstLogin && responseData.user.role.includes('PRM')) {
          navigate('/prm/userdetails');
          return;
        }
      }

      if (response.ok) {
        setMessage(responseData.message);
        window.location.href = '/userroles';
      } else {
        const errorData = await response.json();
        setMessage(`Login failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('An error occurred', error)
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Flex
      flex={{
        base: '50%',
        lg: '30%',
      }}
      marginBlock={{ base: 10, md: 0 }}
      display='flex'
      flexDirection='column'
      paddingInline={{
        base: '1rem',
        md: '2rem',
      }}>
      <FormHeader />
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} width='100%'>
          <FormControl>
            <FormLabel>Email</FormLabel>

            <Input
              type='email'
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
            />
          </FormControl>
          <Text mt={2} textAlign="center" color="blue.500" cursor="pointer" onClick={handleForgotPassword}>
        Forgot Password ?
      </Text>
          <Button
            isLoading={isLoading}
            type='submit'
            colorScheme='blackAlpha'
            bg={'blackAlpha.900 !important'}
            width={'100%'}>
            Login
          </Button>
        </VStack>
      </form>

      {message && <Text mt={4}>{message}</Text>}
    </Flex>
  )
}

export default LoginForm
