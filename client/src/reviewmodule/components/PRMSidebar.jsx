import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, Text, useColorModeValue, Collapse, IconButton } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import getEnvironment from '../../getenvironment';
import MultiStepForm from '../pages/MultiStepForm';
import PRMDashboard from '../pages/prmdashboard';
import PrmEditorDashboard from '../pages/PrmEditorDashboard';

const SideBarFinal = () => {
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [editorData, setEditorData] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');

  const tabs = [
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
      submenu: [] // Editor submenu will be populated dynamically
    }
  ];

  useEffect(() => {
    const fetchEditorData = async () => {
      try {
        const response = await fetch(`${apiUrl}/reviewmodule/event/geteventsbyuser`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        const data = await response.json();
        setEditorData(data);
      } catch (error) {
        console.error('Error fetching editor data:', error);
      }
    };

    fetchEditorData();
  }, [apiUrl]);

  const bg = useColorModeValue('gray.100', 'gray.900');
  const activeBg = useColorModeValue('blue.500', 'blue.300');
  const activeColor = useColorModeValue('white', 'black');

  const handleSubmenuToggle = (tab) => {
    if (openSubmenu === tab) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(tab);
    }
  };

  const handleSubmenuClick = (tabLabel, subTabName) => {
    setActiveTab(subTabName);

    if (tabLabel === 'Editor') {
      const editor = editorData.find(item => item.name === subTabName);
      if (editor) {
        const { _id } = editor;
        navigate(`/prm/${_id}/editor`);
      }
    }
  };

  let content;
  switch (activeTab) {
    case 'Home':
      content = <Text>Welcome to the Home Page</Text>;
      break;
    case 'Author':
      content = <Text>Author Page</Text>;
      break;
    case 'New Submission':
      content = <MultiStepForm />;
      break;
    case 'Submitted Papers':
      content = <Text>Submitted Papers Page</Text>;
      break;
    case 'Pending assignment':
      content = <Text>Pending Assignment Page</Text>;
      break;
    case 'Completed':
      content = <Text>Completed Reviews Page</Text>;
      break;
    case 'Event Dashboard':
      content = <PRMDashboard />;
      break;
    default:
      content = [];
      break;
  }

  return (
    <Box display="flex">
      <Box w="250px" h="100vh" bg={bg} p={4} position="fixed">
        <VStack spacing={4} align="stretch">
          {tabs.map((tab, index) => (
            <React.Fragment key={index}>
              <Box
                p={2}
                borderRadius="md"
                cursor="pointer"
                bg={activeTab === tab.label ? activeBg : 'transparent'}
                color={activeTab === tab.label ? activeColor : 'inherit'}
                _hover={{ bg: activeBg, color: activeColor }}
                onClick={() => {
                  if (tab.submenu) {
                    handleSubmenuToggle(tab.label);
                  } else {
                    setActiveTab(tab.label);
                  }
                }}
              >
                <Text>{tab.label}</Text>
                {tab.submenu && (
                  <IconButton
                    icon={openSubmenu === tab.label ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    variant="unstyled"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmenuToggle(tab.label);
                    }}
                    aria-label="Toggle Submenu"
                  />
                )}
              </Box>
              {tab.submenu && (
                <Collapse in={openSubmenu === tab.label} animateOpacity>
                  <VStack pl={4} align="stretch">
                    {tab.label === 'Editor' ? (
                      editorData.map((item, subIndex) => (
                        <Box
                          key={subIndex}
                          p={2}
                          borderRadius="md"
                          cursor="pointer"
                          bg={activeTab === item.name ? activeBg : 'transparent'}
                          color={activeTab === item.name ? activeColor : 'inherit'}
                          _hover={{ bg: activeBg, color: activeColor }}
                          onClick={() => handleSubmenuClick(tab.label, item.name)}
                        >
                          <Text>{item.name}</Text>
                        </Box>
                      ))
                    ) : (
                      tab.submenu.map((subTabName, subIndex) => (
                        <Box
                          key={subIndex}
                          p={2}
                          borderRadius="md"
                          cursor="pointer"
                          bg={activeTab === subTabName ? activeBg : 'transparent'}
                          color={activeTab === subTabName ? activeColor : 'inherit'}
                          _hover={{ bg: activeBg, color: activeColor }}
                          onClick={() => setActiveTab(subTabName)}
                        >
                          <Text>{subTabName}</Text>
                        </Box>
                      ))
                    )}
                  </VStack>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </VStack>
      </Box>
      <Box ml="250px" p={4} flex="1">
        {content}
      </Box>
    </Box>
  );
};

export default SideBarFinal;
