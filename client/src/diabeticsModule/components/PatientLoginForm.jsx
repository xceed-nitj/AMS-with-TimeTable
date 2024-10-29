import React, { useState } from 'react';
import getEnvironment from '../../getenvironment';
import { TextField, Button, Container, Typography, Grid } from '@mui/material';
import axios from 'axios';

const PatientLoginForm = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const apiUrl = getEnvironment();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
    });
  };

  // Submit the login form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8010/api/v1/diabeticsModule/patient/login',
        loginData
      );
      console.log('Login successful:', response.data);
      alert('Login successful');
      // Here you could redirect the user or perform another action
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Error logging in');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom align="center">
        Patient Login
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Email"
              type="email"
              name="email"
              fullWidth
              required
              value={loginData.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Password"
              type="password"
              name="password"
              fullWidth
              required
              value={loginData.password}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Login
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default PatientLoginForm;
