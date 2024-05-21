import React, { useState, useEffect } from 'react';
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
import getEnvironment from "../../getenvironment";


function HomePage() {
  const apiUrl = getEnvironment();
  const [events, setEvents]=useState([]);
  const [tabs, setTabs] = useState([
    { label: 'Home' },
    {
      label: 'Author',
      submenu: ['Submitted Papers', 'New Submission']
    },
    {
      label: 'Reviewer',
      submenu: ['Pending assignment', 'Completed']
    },
    {
      label: 'Editor',
      submenu: []
    }
  ]);

  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    // Simulate fetching submenu items from an API
    const fetchEditorSubmenu = async () => {
      try {
        const response = await fetch(`${apiUrl}/reviewmodule/event/geteventsbyuser`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });  
        const data = await response.json();
        console.log(data);
        setEvents(data);
        const editorSubmenu = data.map(item => item.name);
        setTabs((prevTabs) => {
          const updatedTabs = prevTabs.map((tab) =>
            tab.label === 'Editor' ? { ...tab, submenu: editorSubmenu } : tab
          );
          console.log(updatedTabs); // Add this line to see the updated tabs
          return updatedTabs;
        });
      } catch (error) {
        console.error('Error fetching editor submenu:', error);
      }
    };

    fetchEditorSubmenu();
  }, []);

  return (
    <Box display="flex">
      <SideBarFinal/>
      <Box ml="250px" p={4} flex="1">
        {content}
      </Box>
    </Box>
  );
}

export default HomePage;
