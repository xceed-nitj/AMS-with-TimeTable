// src/App.js

import React, { useState } from 'react';
import SideBarFinal from '../components/PRMSidebar';
import { Box } from '@chakra-ui/react';
// import Home from './Home';
// import Profile from './Profile';
// import Settings from './Settings';
// import About from './About';
// import Author1 from './Author1';
import MultiStepForm from './MultiStepForm';
import EventForm from './editorevent';
import AddReviewer from './AddReviewer';
import PrmEditorDashboard from './PrmEditorDashboard';
import PRMDashboard from './prmdashboard';

function HomePage() {
  const tabs = [
    { label: 'Home' },
    
    {
      label: 'Author',
      submenu: ['Submitted Papers', 'New Submission']
    },
    {
        label: 'Reviewer',
        submenu: ['Pending asssignment', 'Completed']
      },
    {
        label: 'Editor',
        submenu: ['Event Dashboard']
      }
  ];
  const [activeTab, setActiveTab] = useState('Home');

  let content;
  switch (activeTab) {
    case 'Home':
    //   content = <Home />;
      break;
    case 'Author':
    //   content = <About />;
      break;
    case 'New Submission':
      content = <MultiStepForm />;
      break;
    case 'Papers Submitted':
    //   content = <Author2 />;
      break;
      case 'Event Dashboard':
        content = <PRMDashboard/>;
        break;
        
    // default:
    //   content = <Home />;
  }

  return (
    <Box display="flex">
      <SideBarFinal tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <Box ml="250px" p={4} flex="1">
        {content}
      </Box>
    </Box>
  );
}

export default HomePage;
