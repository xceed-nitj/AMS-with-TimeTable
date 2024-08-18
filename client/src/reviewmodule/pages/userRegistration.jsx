import React, { useState } from 'react';
import getEnvironment from "../../getenvironment";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  Input,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useToast,
  Select,
  Flex,
  useBreakpointValue,
} from '@chakra-ui/react';

const UserRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    designation: '',
    department: '',
    institute: '',
    city: '',
    state: '',
    pincode: '',
    email: '',
    phone: '',
    password: '',
    researchArea: '',
  });
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const toast = useToast();
  const apiUrl = getEnvironment();
  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.id]: e.target.value });
  };

  const handleReenteredPasswordChange = (e) => {
    setReenteredPassword(e.target.value);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError('');

    if (formValues.password !== reenteredPassword) {
      setPasswordError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log(formValues);
      const response = await fetch(
        `${apiUrl}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ ...formValues, roles: "PRM" }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        axios.post(`${apiUrl}/auth/verify`, { email: formValues.email });
        localStorage.setItem('formValues', JSON.stringify(formValues));
        window.location.href = `/prm/emailverification`;
      } else {
        toast({
          title: data.message,
          status: "error",
          duration: 6000,
          isClosable: true,
          position: "bottom"
        });
      }
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error updating User data",
        description: "Please try again later",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "bottom"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showWelcomeSection = useBreakpointValue({ base: false, md: true });

  return (
    <Flex direction={{ base: 'column', md: 'row' }} minH="100vh">
      {showWelcomeSection && (
        <Box
          flex="1"
          bgGradient="linear(to-r, purple.900, blue.500)"
          color="white"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          p={6}
        >
          <Heading as="h1" color="white" fontSize="7xl" mb={4}>
            Welcome to XCEED
          </Heading>
        </Box>
      )}
      <Box flex={showWelcomeSection ? "1" : "1 0 100%"} display="flex" alignItems="center" justifyContent="center" bg="white" p={6} overflowY="auto">
        <Box maxW="400px" width="100%">
          <Heading color="purple.600" textAlign="center" mb={6}>
            User Registration
          </Heading>
          <VStack as="form" spacing={4} onSubmit={handleSubmit}>
            <SimpleGrid columns={1} spacing={4} width="100%">

              <FormControl id="email" isRequired isInvalid={errors.email}>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formValues.email}
                  onChange={handleChange}
                  errorBorderColor="red.500"
                  bg="gray.100"
                />
                {errors.email && <Text color="red.500">{errors.email}</Text>}
              </FormControl>

              <FormControl id="password" isRequired>
                <Input
                  type="password"
                  placeholder="Password"
                  value={formValues.password}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="reenteredPassword" isRequired isInvalid={passwordError}>
                <Input
                  type="password"
                  placeholder="Re-enter Password"
                  value={reenteredPassword}
                  onChange={handleReenteredPasswordChange}
                  errorBorderColor="red.500"
                  bg="gray.100"
                />
                {passwordError && <Text color="red.500">{passwordError}</Text>}
              </FormControl>

              <FormControl id="name" isRequired>
                <Input
                  type="text"
                  placeholder="Name"
                  value={formValues.name}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="designation" isRequired>
                <Input
                  type="text"
                  placeholder="Designation"
                  value={formValues.designation}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="department" isRequired>
                <Input
                  type="text"
                  placeholder="Department"
                  value={formValues.department}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="researchArea" isRequired>
                <Select placeholder="Select research area" value={formValues.researchArea} onChange={handleChange} bg="gray.100">
                  <option value="ECE">ECE</option>
                  <option value="CSE">CSE</option>
                  <option value="EE">EE</option>
                  <option value="ME">ME</option>
                </Select>
              </FormControl>

              <FormControl id="institute" isRequired>
                <Input
                  type="text"
                  placeholder="Institute"
                  value={formValues.institute}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="city" isRequired>
                <Input
                  type="text"
                  placeholder="City"
                  value={formValues.city}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="state" isRequired>
                <Input
                  type="text"
                  placeholder="State"
                  value={formValues.state}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="pincode" isRequired>
                <Input
                  type="text"
                  placeholder="Pincode"
                  value={formValues.pincode}
                  onChange={handleChange}
                  bg="gray.100"
                />
              </FormControl>

              <FormControl id="phone" isRequired isInvalid={errors.phone}>
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={formValues.phone}
                  onChange={handleChange}
                  errorBorderColor="red.500"
                  bg="gray.100"
                />
                {errors.phone && <Text color="red.500">{errors.phone}</Text>}
              </FormControl>
            </SimpleGrid>

            <Button colorScheme="purple" type="submit" isLoading={isLoading} width="100%" mt='2'>
              Register
            </Button>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
};

export default UserRegistration;