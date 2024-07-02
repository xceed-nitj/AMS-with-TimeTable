import React, { useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import axios from 'axios';
import getEnvironment from "../../getenvironment";
import { useToast } from "@chakra-ui/react";

const OTPVerification = () => {
  const apiUrl = getEnvironment();
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message,setMessage] = useState('');
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/auth/verify`, {
        email: location.state.email,
        otp
      });
      console.log(response.status)
      if (response.status === 200) {
        navigate('/prm/home'); 
      }
     }catch (error) {
      setError('Incorrect OTP. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f7f9fc' }}>
      <div style={{ background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
      {message && <p style={{ color: 'green' }}>{message}</p>} OTP has been set to email id : {location.state.email}
        <h2 style={{ marginBottom: '24px', color: '#333' }}>Verify OTP</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', transition: 'background 0.3s' }}>
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
