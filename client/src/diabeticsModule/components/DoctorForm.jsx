import React, { useState, useEffect } from 'react';
import getEnvironment from '../../getenvironment';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  chakra,
  Button,
} from "@chakra-ui/react";

function DoctorForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '12345', // Default password
    name: '',
    age: '',
    contactNumber: '',
    address: '',
    hospital: '',
  });

  const [hospitals, setHospitals] = useState([]);
  const apiUrl = getEnvironment();

  // Fetch hospital data
  useEffect(() => {
    fetch(`${apiUrl}/diabeticsModule/hospital/all`, { credentials: 'include' })
      .then(handleResponse)
      .then((data) => {
        setHospitals(data);
      })
      .catch(handleError);
  }, [apiUrl]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`${apiUrl}/diabeticsModule/doctor/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    .then(handleResponse)
    .catch(handleError)
    .finally((result) => {
      console.log(result);

      // Reset form after successful submission
      setFormData({
        email: '',
        password: '12345',
        name: '',
        age: '',
        contactNumber: '',
        address: '',
        hospital: '',
      });
    })
    
  };

  const handleResponse = (response) => {
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  };

  const handleError = (error) => {
    console.error('Error:', error);
  };

  return (
    <chakra.form onSubmit={handleSubmit} mt="4">
      <FormControl isRequired mt="2">
        <FormLabel>Email:</FormLabel>
        <Input
          type="email"
          name="email"
          placeholder="Doctor's email"
          value={formData.email}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl mt="2">
        <FormLabel>Password (default is 12345):</FormLabel>
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl isRequired mt="2">
        <FormLabel>Name:</FormLabel>
        <Input
          type="text"
          name="name"
          placeholder="Doctor's name"
          value={formData.name}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl isRequired mt="2">
        <FormLabel>Age:</FormLabel>
        <Input
          type="number"
          name="age"
          placeholder="Doctor's age"
          value={formData.age}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl isRequired mt="2">
        <FormLabel>Contact Number:</FormLabel>
        <Input
          type="tel"
          name="contactNumber"
          placeholder="Doctor's contact number"
          value={formData.contactNumber}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl isRequired mt="2">
        <FormLabel>Address:</FormLabel>
        <Input
          type="text"
          name="address"
          placeholder="Doctor's address"
          value={formData.address}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl isRequired mt="2">
        <FormLabel>Hospital:</FormLabel>
        <Select
          name="hospital"
          placeholder="Select a hospital"
          value={formData.hospital}
          onChange={handleChange}
        >
          {hospitals.map((hospital) => (
            <option key={hospital._id} value={hospital._id}>
              {hospital.name} - {hospital.location}
            </option>
          ))}
        </Select>
      </FormControl>

      <Button type="submit" colorScheme="blue" mt="4">
        Register Doctor
      </Button>
    </chakra.form>
  );
}

export default DoctorForm;
