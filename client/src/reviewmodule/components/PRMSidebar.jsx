import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, Text, Collapse, IconButton, Flex, Icon, useBreakpointValue } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, HamburgerIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { FaHome, FaFileAlt, FaTasks, FaPaperPlane, FaPlus, FaClock, FaCheckCircle, FaMailBulk } from 'react-icons/fa';
import { MdEvent, MdEventAvailable, MdEventNote, MdDeblur, MdAssignment, MdAssessment, MdGrade, MdTrackChanges } from 'react-icons/md';
import { HiOutlineDocumentMagnifyingGlass } from "react-icons/hi2";
import { RxBarChart } from "react-icons/rx";
import getEnvironment from '../../getenvironment';
import PRMDashboard from '../pages/prmdashboard';
import SubmittedPapers from '../pages/SubmittedPapers';
import SearchEvent from '../pages/searchEvent';
import CompletedAssignment from '../pages/completedPaper'
import PendingAssignment from '../pages/pendingAssignment'
import Invitations from '../pages/Invitations'
import ReviewsCompleted from '../pages/reviewsCompleted';

const SideBarFinal = () => {
  const navigate = useNavigate();
  const apiUrl = getEnvironment();

  const isLargeScreen = useBreakpointValue({ base: false, md: true });
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [editorData, setEditorData] = useState([]);
  const [editorIconsMap, setEditorIconsMap] = useState({});
  const [activeTab, setActiveTab] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(isLargeScreen);

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
        { label: 'Invitation', icon: FaMailBulk },
        { label: 'Pending assignment', icon: FaClock },
        { label: 'Completed Reviews', icon: FaCheckCircle }
      ]
    },
    {
      label: 'Editor',
      icon: EditIcon,
      submenu: [] // Editor submenu will be populated dynamically
    }
  ];

  const editorIcons = [
    MdEvent, MdEventAvailable, MdEventNote, MdDeblur, MdAssignment, MdAssessment, MdGrade, MdTrackChanges, RxBarChart, HiOutlineDocumentMagnifyingGlass
  ];

  const getRandomIcon = () => {
    const randomIndex = Math.floor(Math.random() * editorIcons.length);
    return editorIcons[randomIndex];
  };

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

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        setEditorData(data);

        const newIconsMap = {};
        data.forEach(item => {
          newIconsMap[item.name] = getRandomIcon();
        });
        setEditorIconsMap(newIconsMap);
      } catch (error) {
        console.error('Error fetching editor data:', error);
        setEditorData([]);
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
      content = <SubmittedPapers />;
      break;
    case 'Invitation':
      content = <Invitations />;
      break;
    case 'Pending assignment':
      content = <PendingAssignment />;
      break;
    case 'Completed Reviews':
      content = <ReviewsCompleted />;
      break;
    case 'Event Dashboard':
      content = <PRMDashboard />;
      break;
    default:
      content = <Text>Page Not Found</Text>;
      break;
  }

  useEffect(() => {
    setIsSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  return (
    <Box display="flex">
      <Box
        w={isSidebarOpen ? { base: "50vw", md: "25vw", lg: "20vw" } : { base: "14vw", md: "11vw", lg: "6vw" }}
        h={{ base: 'calc(100vh - 80px)', md: 'calc(100vh - 60px)', lg: 'calc(100vh - 60px)' }} 
        bg={bg}
        p={isSidebarOpen ? 4 : 2}
        position="fixed"
        top={{ base: '80px', md: '60px', lg: '60px' }} 
        left={0}
        transition="width 0.3s ease"
        overflowY="auto"
        zIndex="9999"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <IconButton
            icon={isSidebarOpen ? <CloseIcon color={textColor} /> : <HamburgerIcon color={textColor} />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Sidebar"
            variant={isSidebarOpen ? 'unstyled' : 'outline.1'}
            _hover={isSidebarOpen ? { bg: hoverBg, outlineColor:'' } : { bg: 'gray.800',outlineColor:hoverBg }}
            left={0}
            
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
                        editorData.map((item, subIndex) => {
                          const IconComponent = editorIconsMap[item.name] || getRandomIcon();
                          return (
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
                              <Icon as={IconComponent} />
                              <Text ml={2}>{item.name}</Text>
                            </Box>
                          );
                        })
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
      <Box p={4} flex="1" ml={{ base: "12vw", md: isSidebarOpen ? "26vw" : "7vw", lg: isSidebarOpen ? "21vw" : "6vw" }} transition="margin-left 0.3s ease">
        {content}
      </Box>
    </Box>
  );
};

export default SideBarFinal;
