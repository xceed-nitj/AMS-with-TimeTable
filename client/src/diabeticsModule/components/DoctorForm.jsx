import React, { useState } from 'react';
import getEnvironment from '../../getenvironment';
import { TextField, Button, Container, Typography, Grid } from '@mui/material';
import axios from 'axios';

function DoctorForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '12345', // default password
    name: '',
    age: '',
    contactNumber: '',
    address: '',
    hospital: '',
  });

  const apiUrl = getEnvironment();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit the doctor registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiUrl}/api/v1/diabeticsModule/doctor/add`,
        formData
      );
      console.log('Doctor registered successfully:', response.data);
      alert('Doctor registered successfully');
    } catch (error) {
      console.error('Error registering doctor:', error);
      alert('Error registering doctor');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom align="center">
        Doctor Registration
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
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Name"
              name="name"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Age"
              type="number"
              name="age"
              fullWidth
              required
              value={formData.age}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Number"
              type="tel"
              name="contactNumber"
              fullWidth
              required
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Address"
              name="address"
              fullWidth
              required
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Hospital"
              name="hospital"
              fullWidth
              required
              value={formData.hospital}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Register Doctor
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}

export default DoctorForm;
