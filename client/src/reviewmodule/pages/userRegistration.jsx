import React, { useState } from 'react';
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
} from '@chakra-ui/react';

const UserRegistration = () => {
  const [formValues, setFormValues] = useState({
    name: '',
    designation: '',
    department: '',
    institute: '',
    city: '',
    state: '',
    pincode: '',
    alternateEmail: '',
    phone: ''
  });

  const [errors, setErrors] = useState({
    alternateEmail: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();

    let valid = true;
    let newErrors = { alternateEmail: '', phone: '' };

    if (!validateEmail(formValues.alternateEmail)) {
      valid = false;
      newErrors.alternateEmail = 'Invalid email format';
    }

    if (!validatePhone(formValues.phone)) {
      valid = false;
      newErrors.phone = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);

    if (valid) {
      // Handle form submission (e.g., send data to the server)
      console.log('Form submitted:', formValues);
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
          
          <FormControl id="alternateEmail" isRequired isInvalid={errors.alternateEmail}>
            <FormLabel>Alternate Email</FormLabel>
            <Input 
              type="email" 
              value={formValues.alternateEmail} 
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
        </SimpleGrid>
        <Button colorScheme="blue" type="submit">Register</Button>
      </VStack>
    </Box>
  );
};

export default UserRegistration;
