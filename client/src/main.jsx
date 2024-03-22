import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { HelmetProvider } from 'react-helmet-async';

import {ChakraProvider} from '@chakra-ui/react'
import './index.css'

const helmetContext = {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider context={helmetContext}>
    <ChakraProvider>
      <App />
    </ChakraProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
