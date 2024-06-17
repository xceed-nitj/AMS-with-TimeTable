import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, Text, Collapse, IconButton, Flex, Icon, Center } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, HamburgerIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { FaHome, FaFileAlt, FaTasks, FaPaperPlane, FaPlus, FaClock, FaCheckCircle } from 'react-icons/fa';
import getEnvironment from '../../getenvironment';
import PRMDashboard from '../pages/prmdashboard';
import SearchEvent from '../pages/searchEvent';

const SideBarFinal = () => {
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [editorData, setEditorData] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tabs = [
    { label: 'Home', icon: FaHome },
    {
      label: 'Author',
      icon: FaFileAlt,
      submenu: [
        { label: 'Submitted Papers', icon: FaPaperPlane },
        { label: 'New Submission', icon: FaPlus }
      ]
    },
    {
      label: 'Reviewer',
      icon: FaTasks,
      submenu: [
        { label: 'Pending assignment', icon: FaClock },
        { label: 'Completed', icon: FaCheckCircle }
      ]
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
    <Box display="flex" position="relative">
      <Box
        w={isSidebarOpen ? { base: "60vw", md: "35vw", lg:"25vw" } : { base: "10vw", md: "8vw",lg:"5vw" }}
        h="100vh"
        bg={bg}
        p={isSidebarOpen ? 4 : 2}
        position="absolute"
        top={0}
        left={0}
        transition="width 0.3s ease"
        overflow="hidden"
        zIndex="9999"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <IconButton
            icon={isSidebarOpen ? <CloseIcon color={textColor} /> : <HamburgerIcon color={textColor} />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Sidebar"
            variant={isSidebarOpen ? 'unstyled' : 'outline.0'}
            outlineColor={activeBg}
            left={-1}
            _hover={{ bg: hoverBg }}
          />
          {isSidebarOpen && <Text fontSize="1xl" color={textColor}>Menu</Text>}
        </Flex>
        {isSidebarOpen && (
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
                            color={activeTab === item.name ? activeColor : textColor}
                            _hover={{ bg: hoverBg, color: hoverColor }}
                            onClick={() => handleSubmenuClick(tab.label, item.name)}
                            display="flex"
                            alignItems="center"
                          >
                            <Icon as={EditIcon} />
                            <Text ml={2}>{item.name}</Text>
                          </Box>
                        ))
                      ) : (
                        tab.submenu.map((subTab, subIndex) => (
                          <Box
                            key={subIndex}
                            p={2}
                            borderRadius="md"
                            cursor="pointer"
                            bg={activeTab === subTab.label ? activeBg : 'transparent'}
                            color={activeTab === subTab.label ? activeColor : textColor}
                            _hover={{ bg: hoverBg, color: hoverColor }}
                            onClick={() => setActiveTab(subTab.label)}
                            display="flex"
                            alignItems="center"
                          >
                            <Icon as={subTab.icon} />
                            <Text ml={2}>{subTab.label}</Text>
                          </Box>
                        ))
                      )}
                    </VStack>
                  </Collapse>
                )}
              </React.Fragment>
            ))}
          </VStack>
        )}
      </Box>
      <Box p={4} flex="1" ml={{ base: "10vw", md: isSidebarOpen ? "10vw" : "10vw",lg: isSidebarOpen ? "7vw" : "7vw" }} transition="margin-left 0.3s ease">
        {content}
      </Box>
    </Box>
  );
};

export default SideBarFinal;
