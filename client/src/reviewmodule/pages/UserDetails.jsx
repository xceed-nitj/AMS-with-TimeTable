import React, { useState } from 'react';
import getEnvironment from "../../getenvironment";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useToast,
  Select
} from '@chakra-ui/react';

const UserRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false)
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
    password:'',
    isFirstLogin : false,
    researchArea: '',
  });

  const toast = useToast();
  const apiUrl = getEnvironment();
  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.id]: e.target.value });
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
    setIsLoading(true)
    try {
      console.log(formValues)
      const response = await fetch(
        `${apiUrl}/auth/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({...formValues,roles:"PRM"}),
        }
      );
      const data = await response.json();
      if (response.ok) {
        window.location.href = `/prm/home`;
      } else {
        toast({
          title: data.message,
          description: "Please try again later",
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
    }finally {
      setIsLoading(false)
    }
  };

  return (
    <Box maxW="80vw" mx="auto" p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <Heading bg="black" color="white" p={4} borderRadius="md" mb={6} textAlign="center">
        Register
      </Heading>
      <VStack as="form" spacing={4} onSubmit={handleSubmit}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
          <FormControl id="name" isRequired>
            <FormLabel>Name</FormLabel>
            <Input 
              type="text" 
              value={formValues.name} 
              onChange={handleChange} 
            />
          </FormControl>
          
          <FormControl id="designation" isRequired>
            <FormLabel>Designation</FormLabel>
            <Input 
              type="text" 
              value={formValues.designation} 
              onChange={handleChange} 
            />
          </FormControl>
          
          <FormControl id="department" isRequired>
            <FormLabel>Department</FormLabel>
            <Input 
              type="text" 
              value={formValues.department} 
              onChange={handleChange} 
            />
          </FormControl>
          
          <FormControl id="researchArea" isRequired>
            <FormLabel>Research Area</FormLabel>
            <Select placeholder="Select research area" value={formValues.researchArea} onChange={handleChange}>
              <option value="ECE">ECE</option>
              <option value="CSE">CSE</option>
              <option value="EE">EE</option>
              <option value="ME">ME</option>
            </Select>
          </FormControl>

          <FormControl id="institute" isRequired>
            <FormLabel>Institute</FormLabel>
            <Input 
              type="text" 
              value={formValues.institute} 
              onChange={handleChange} 
            />
          </FormControl>
          
          <FormControl id="city" isRequired>
            <FormLabel>City</FormLabel>
            <Input 
              type="text" 
              value={formValues.city} 
              onChange={handleChange} 
            />
          </FormControl>
          
          <FormControl id="state" isRequired>
            <FormLabel>State</FormLabel>
            <Input 
              type="text" 
              value={formValues.state} 
              onChange={handleChange} 
            />
          </FormControl>
          
          <FormControl id="pincode" isRequired>
            <FormLabel>Pincode</FormLabel>
            <Input 
              type="text" 
              value={formValues.pincode} 
              onChange={handleChange} 
            />
          </FormControl>
          
          <FormControl id="email" isRequired isInvalid={errors.email}>
            <FormLabel>Alternate Email</FormLabel>
            <Input 
              type="email" 
              value={formValues.email} 
              onChange={handleChange} 
              errorBorderColor="red.500"
            />
            {errors.alternateEmail && <Text color="red.500">{errors.alternateEmail}</Text>}
          </FormControl>
          
          <FormControl id="phone" isRequired isInvalid={errors.phone}>
            <FormLabel>Phone</FormLabel>
            <Input 
              type="tel" 
              value={formValues.phone} 
              onChange={handleChange} 
              errorBorderColor="red.500"
            />
            {errors.phone && <Text color="red.500">{errors.phone}</Text>}
          </FormControl>
          <FormControl id="password" isRequired>
            <FormLabel>Password</FormLabel>
            <Input 
              type='password'
              value={formValues.password} 
              onChange={handleChange} 
            />
          </FormControl>
        </SimpleGrid>
        <Button colorScheme="blue" type="submit" isLoading={isLoading}>Register</Button>
      </VStack>
    </Box>
  );
};

export default UserRegistration;
