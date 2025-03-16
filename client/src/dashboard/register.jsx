import { useState } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  Checkbox,
  Text,
  Heading,
} from '@chakra-ui/react';
import getEnvironment from '../getenvironment';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    roles: [], // Set a default role or leave it empty
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiUrl = getEnvironment();

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If the input is a checkbox, handle it differently
    if (e.target.type === 'checkbox') {
      // If the checkbox is checked, add the role to the array; otherwise, remove it
      setFormData((prevData) => ({
        ...prevData,
        roles: e.target.checked
          ? [...prevData.roles, value]
          : prevData.roles.filter((role) => role !== value),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setSuccess(''); // Clear success message on error
      return;
    }

    // Validation: Check if password is at least 6 characters
    if (formData.password.length < 6) {
      setError('Password should be a minimum of 6 characters.');
      setSuccess(''); // Clear success message on error
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Network response was not ok');
        setSuccess(''); // Clear success message on error
        return;
      }

      setError(''); // Clear error on successful response
      setSuccess(data.message); // Set success message
    } catch (error) {
      setError('Error occurred while processing the request.');
      setSuccess(''); // Clear success message on error
      console.error('Error:', error);
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="lg" textAlign="center" mb={4}>
          Registration Form
        </Heading>
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <Input
          type="password"
          name="password"
          placeholder="Password (min. 6 characters)"
          value={formData.password}
          onChange={handleInputChange}
        />
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
        />
        <VStack align="start" spacing={2}>
          <Text>Select Role(s):</Text>
          <Checkbox
            name="ITTC"
            value="ITTC"
            isChecked={formData.roles.includes('ITTC')}
            onChange={handleInputChange}
          >
            Institute Time Table Coordinator
          </Checkbox>
          <Checkbox
            name="DTTI"
            value="DTTI"
            isChecked={formData.roles.includes('DTTI')}
            onChange={handleInputChange}
          >
            Department Time Table Coordinator
          </Checkbox>
          <Checkbox
            name="CM"
            value="CM"
            isChecked={formData.roles.includes('CM')}
            onChange={handleInputChange}
          >
            Event Certificate Manager
          </Checkbox>
          <Checkbox
            name="admin"
            value="admin"
            isChecked={formData.roles.includes('admin')}
            onChange={handleInputChange}
          >
            XCEED admin
          </Checkbox>
          <Checkbox
            name="EO"
            value="EO"
            isChecked={formData.roles.includes('EO')}
            onChange={handleInputChange}
          >
            Event Organiser
          </Checkbox>
          <Checkbox
            name="PRM"
            value="PRM"
            isChecked={formData.roles.includes('PRM')}
            onChange={handleInputChange}
          >
            Paper Review Manager
          </Checkbox>
          <Checkbox
            name="doctor"
            value="doctor"
            isChecked={formData.roles.includes('doctor')}
            onChange={handleInputChange}
          >
            Diabetics Module Doctor
          </Checkbox>
          <Checkbox
            name="patient"
            value="patient"
            isChecked={formData.roles.includes('patient')}
            onChange={handleInputChange}
          >
            Diabetics Module Patient
          </Checkbox>
          <Checkbox
            name="dm-admin"
            value="dm-admin"
            isChecked={formData.roles.includes('dm-admin')}
            onChange={handleInputChange}
          >
            Diabetics Module Admin
          </Checkbox>
        </VStack>
        <Button colorScheme="teal" onClick={handleSubmit}>
          Register
        </Button>
        {error && <Text color="red.500">{error}</Text>}
        {success && <Text color="green.500">{success}</Text>}
      </VStack>
    </Box>
  );
};

export default RegistrationForm;
