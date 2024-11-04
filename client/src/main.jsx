import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { HelmetProvider } from 'react-helmet-async';

import { ChakraProvider } from '@chakra-ui/react';
import './index.css';

import { RecoilRoot } from 'recoil';

const helmetContext = {};

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
