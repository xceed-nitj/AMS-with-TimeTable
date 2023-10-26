// src/Login.js

import React, { useState, useEffect } from 'react';
import getEnvironment from "../getenvironment";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const apiUrl=getEnvironment();



  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = { email, password };
    console.log(userData)
    console.log(apiUrl)
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData.message);
        // Redirect to the dashboard page on successful login
        window.location.href = '/dashboard';
      } else {
        // Handle login errors, e.g., display an error message
        console.error('Login failed');
      }
    } catch (error) {
      console.error('An error occurred', error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
