import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, Text, useColorModeValue, Collapse, IconButton } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import getEnvironment from '../../getenvironment';

const SideBarFinal = () => {
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [editorData, setEditorData] = useState([]);
  const [activeTab, setActiveTab] = useState('');

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
      submenu: []
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

  return (
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
                  {editorData.map((item, subIndex) => (
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
                  ))}
                </VStack>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </VStack>
    </Box>
  );
};

export default SideBarFinal;
