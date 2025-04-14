import axios from 'axios';
import getEnvironment from '../../getenvironment';

// Base configuration for axios instance
export const axiosInstance = axios.create({
  baseURL: `${getEnvironment()}/api/v1`,
  withCredentials: true,
});

// Base path for diabetics module
export const DIABETICS_MODULE_PATH = '/diabeticsModule';

// Generic error handler
export const handleApiError = (error) => {
  console.error('API Error:', error);
  const errorMessage = error.response?.data?.message || 'An error occurred';
  throw new Error(errorMessage);
};

// Generic success response handler
export const handleApiResponse = (response) => response.data;

// Utility to create API endpoints
export const createEndpoint = (path) => `${DIABETICS_MODULE_PATH}${path}`;
