// src/Login.js

import React, { useState } from 'react';
import getEnvironment from "../getenvironment";
import { Box, Button, Input, Text, VStack, Center, Image } from "@chakra-ui/react";
import logoImage from '../assets/logo.png'; 
import logoVideo from '../assets/video.mp4'; 
import { CustomBlueButton } from "../styles/customStyles";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const apiUrl = getEnvironment();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = { email, password };

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (response.ok) {
        const responseData = await response.json();
        setMessage(responseData.message);
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        setMessage(`Login failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('An error occurred', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <Box bg="black" color="white" minHeight="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <Box display="flex" flexWrap="wrap" justifyContent="center" textAlign="center">
        {/* Video Section */}
        <Box flex="1" width={{ base: '100%', md: '70%' }} mb={{ base: 4, md: 0 }}>
          <video className="video" autoPlay loop muted style={{ width: '100%' }}>
            <source src={logoVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>

        {/* Second Section (Login Form) */}
        <Center flex="1" display="flex" flexDirection="column" alignItems="center" width={{ base: '100%', md: '100%' }}>
          {/* Conditional Rendering of Logo */}
          <Image src={logoImage} alt="Your Logo" display={{ base: 'none', md: 'block' }} mb={4} />

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} mt={{ base: 10, md: 0 }} width="100%" maxW="700px">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
              />
              <CustomBlueButton type="submit" width="80%">
                Login
              </CustomBlueButton>
            </VStack>
          </form>

          {message && (
            <Text mt={4}>
              {message}
            </Text>
          )}
        </Center>
      </Box>
    </Box>
  );
}

export default Login;
