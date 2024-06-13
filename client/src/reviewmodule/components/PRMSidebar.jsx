import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, Text, Collapse, IconButton, Flex, Icon } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, HamburgerIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { FaHome, FaFileAlt, FaTasks, FaTimes } from 'react-icons/fa';
import getEnvironment from '../../getenvironment';
//import MultiStepForm from '../pages/MultiStepForm';
import PRMDashboard from '../pages/prmdashboard';
import SearchEvent from '../pages/searchEvent';

const SideBarFinal = () => {
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [editorData, setEditorData] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tabs = [
    { label: 'Home', icon: FaHome },
    {
      label: 'Author',
      icon: FaFileAlt,
      submenu: ['Submitted Papers', 'New Submission']
    },
    {
      label: 'Reviewer',
      icon: FaTasks,
      submenu: ['Pending assignment', 'Completed']
    },
    {
      label: 'Editor',
      icon: EditIcon,
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

  const bg = 'gray.900';
  const activeBg = 'cyan.300';
  const activeColor = 'black';
  const textColor = 'white';
  const hoverBg = 'cyan.500';
  const hoverColor = 'black';

  const handleSubmenuToggle = (tab) => {
    setOpenSubmenu(openSubmenu === tab ? null : tab);
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
          content = <SearchEvent />;
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
      content = <Text>Page Not Found</Text>;
      break;
  }

  return (
    <Box display="flex" >
      <Box
        w={isSidebarOpen ? "18vw" : "5vw"}
        h="100vh"
        bg={bg}
        p={isSidebarOpen ? 4 : 2}
        position="fixed"
        transition="width 0.3s ease"
        overflow="hidden"
        z-index="9999"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <IconButton
            icon={isSidebarOpen ? <CloseIcon color={textColor} /> : <HamburgerIcon color={textColor} />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Sidebar"
            variant="unstyled"
          />
          {isSidebarOpen && <Text fontSize="1xl" color={textColor}>Menu</Text>}
        </Flex>
        <VStack spacing={4} align="stretch">
          {tabs.map((tab, index) => (
            <React.Fragment key={index}>
              <Box
                p={2}
                borderRadius="md"
                cursor="pointer"
                bg={activeTab === tab.label ? activeBg : 'transparent'}
                color={activeTab === tab.label ? activeColor : textColor}
                _hover={{ bg: hoverBg, color: hoverColor }}
                onClick={() => {
                  if (tab.submenu) {
                    handleSubmenuToggle(tab.label);
                  } else {
                    setActiveTab(tab.label);
                  }
                }}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Icon as={tab.icon} />
                {isSidebarOpen && (
                  <Text ml={2}>
                    {tab.label}
                    {tab.submenu && (
                      <IconButton
                        icon={openSubmenu === tab.label ? <ChevronDownIcon color={textColor} /> : <ChevronRightIcon color={textColor} />}
                        variant="unstyled"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmenuToggle(tab.label);
                        }}
                        aria-label="Toggle Submenu"
                      />
                    )}
                  </Text>
                )}
              </Box>
              {tab.submenu && isSidebarOpen && (
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
                          color={activeTab === item.name ? activeColor : textColor}
                          _hover={{ bg: hoverBg, color: hoverColor }}
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
                          color={activeTab === subTabName ? activeColor : textColor}
                          _hover={{ bg: hoverBg, color: hoverColor }}
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
      <Box ml={isSidebarOpen ? "18vw" : "5vw"} p={4} flex="1" transition="margin-left 0.3s ease">
        {content}
      </Box>
    </Box>
  );
};

export default SideBarFinal;
