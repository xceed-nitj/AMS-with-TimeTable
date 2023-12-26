// Create a new component named ForgotPassword.js
import React, { useState } from 'react';
import { Text, Input, Button, VStack, FormControl, FormLabel, Flex } from '@chakra-ui/react';
import getEnvironment from '../getenvironment';
import Header from "../components/header";
import {
  Box,
  Center,
  Container,
  Heading,
  Select,
  chakra,
  Checkbox,
} from "@chakra-ui/react";


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP]=useState(false);
  const [passwordError, setPasswordError] = useState('');

  const apiUrl = getEnvironment();

  const handleForgotPassword = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const responseData = await response.json();
        setShowOTP(true);
        setMessage(responseData.message);
      } else {
        const errorData = await response.json();
        setMessage(`Forgot password failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('An error occurred', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }

      const passwordRuleRegex = /^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{6,}$/;
      if (!passwordRuleRegex.test(password)) {
        setPasswordError('Password must contain at least one special character and be at least 6 characters long');
        return;
      }

      setPasswordError('');
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, password }),
      });

      if (response.ok) {
        const responseData = await response.json();
        // setShowOTP(true);
        setMessage(responseData.message);
      }
      // setMessage('OTP verified successfully. You can now reset your password.');
    } catch (error) {
      console.error('An error occurred during OTP verification', error);
      setMessage('OTP verification failed. Please try again.');
    }
  };

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
      }}
    >
      {showOTP ? (
<Container maxW="3xl">
          <form>
          <VStack spacing={4} width='100%'>
            <Header title="Verify OTP & Reset Password"> </Header>
            <FormControl>
              {/* <FormLabel>OTP</FormLabel> */}
              <FormLabel>Email</FormLabel>
              <Input
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FormLabel>Enter Received OTP</FormLabel>

              <Input
                type='text'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <FormLabel>Password</FormLabel>
              <Input
                type='password'
                placeholder='Enter Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type='password'
                placeholder='Confirm Password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormControl>
            {passwordError && <Text color="red.500">{passwordError}</Text>}
            <Button
              isLoading={isLoading}
              type='button'
              colorScheme='blackAlpha'
              bg={'blackAlpha.900 !important'}
              width={'100%'}
              onClick={handleVerifyOTP}
            >
              Verify OTP & Reset Password
            </Button>
          </VStack>
        </form>
        </Container>

      ) : (
<Container maxW="3xl">
        <form>
          <VStack spacing={4} width='100%'>
          <Header title="Email Verification"> </Header>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <Button
              isLoading={isLoading}
              type='button'
              colorScheme='blackAlpha'
              bg={'blackAlpha.900 !important'}
              width={'100%'}
              onClick={handleForgotPassword}
            >
              Reset Password
            </Button>
          </VStack>
        </form>
        </Container>
      )}

      {message && <Text mt={4}>{message}</Text>}
    </Flex>
  );
};

export default ForgotPassword;
