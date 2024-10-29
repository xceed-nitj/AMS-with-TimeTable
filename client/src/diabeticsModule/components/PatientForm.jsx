import React, { useState, useEffect } from 'react';
import getEnvironment from '../../getenvironment';
import {
  TextField,
  Button,
  Container,
  Typography,
  MenuItem,
  Box,
  Grid,
} from '@mui/material';
import axios from 'axios';

function PatientForm() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    DOB: '',
    gender: '',
    father_name: '',
    mother_name: '',
    weight: '',
    height: '',
    DOD_of_T1D: '',
    family_history: '',
    economic_status: '',
    family_tree: '',
    immunization_history: '',
    treatment_history: '',
    referring_physician: '',
    age: '',
    contactNumber: '',
    address: '',
    medicalHistory: '',
    hospital: '',
    doctorIds: '',
  });

  const apiUrl = getEnvironment();
  // Handle patient input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  // Submit the patient form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8010/api/v1/diabeticsModule/patient/add',
        formData
      );
      console.log('Patient added successfully:', response.data);
      alert('Patient registered successfully');
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Error registering patient');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom align="center">
        Patient Registration
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
              label="Date of Birth"
              type="date"
              name="DOB"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={formData.DOB}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Gender"
              name="gender"
              fullWidth
              required
              value={formData.gender}
              onChange={handleChange}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Father's Name"
              name="father_name"
              fullWidth
              required
              value={formData.father_name}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Mother's Name"
              name="mother_name"
              fullWidth
              required
              value={formData.mother_name}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Weight (kg)"
              type="number"
              name="weight"
              fullWidth
              required
              value={formData.weight}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Height (cm)"
              type="number"
              name="height"
              fullWidth
              required
              value={formData.height}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Date of Diagnosis (T1D)"
              type="date"
              name="DOD_of_T1D"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={formData.DOD_of_T1D}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Family History"
              name="family_history"
              fullWidth
              multiline
              rows={4}
              value={formData.family_history}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Economic Status"
              name="economic_status"
              fullWidth
              required
              value={formData.economic_status}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Family Tree"
              name="family_tree"
              fullWidth
              multiline
              rows={4}
              value={formData.family_tree}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Immunization History"
              name="immunization_history"
              fullWidth
              multiline
              rows={4}
              value={formData.immunization_history}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Treatment History"
              name="treatment_history"
              fullWidth
              multiline
              rows={4}
              value={formData.treatment_history}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Referring Physician"
              name="referring_physician"
              fullWidth
              value={formData.referring_physician}
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
              multiline
              rows={4}
              required
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Medical History"
              name="medicalHistory"
              fullWidth
              multiline
              rows={4}
              required
              value={formData.medicalHistory}
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
              Register Patient
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}

export default PatientForm;
