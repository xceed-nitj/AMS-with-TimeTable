import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { ChakraProvider } from '@chakra-ui/react';
import './index.css';
import { RecoilRoot } from 'recoil';
import axios from 'axios';

const helmetContext = {};

const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  const token = localStorage.getItem('token');
  const isOwnServer = typeof url === 'string' && 
    (url.includes('xceed.nitj.ac.in') || url.includes('localhost:8010'));
  
  if (isOwnServer) {
    options.credentials = 'include';
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }
  
  return originalFetch(url, options);
};

axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider context={helmetContext}>
      <ChakraProvider>
        <RecoilRoot>
          <App />
        </RecoilRoot>
      </ChakraProvider>
    </HelmetProvider>
  </React.StrictMode>
);