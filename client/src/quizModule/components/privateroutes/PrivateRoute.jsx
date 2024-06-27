// components/privateroutes/PrivateRoute.jsx

import React from "react";
import { Route, Navigate } from "react-router-dom";

const PrivateRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem('token');

  // Check if the token exists (you can customize this logic based on your authentication mechanism)
  const isAuthenticated = !!token;

  return isAuthenticated ? <Component {...rest} /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
