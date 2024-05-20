// src/Sidebar.js

import React, { useState } from 'react';
import { Box, VStack, Text, useColorModeValue, Collapse, IconButton } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';

const SideBar = ({ tabs, activeTab, setActiveTab }) => {
  const [openSubmenu, setOpenSubmenu] = useState(null);
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
              <Text>{tab.label}
              {tab.submenu && (
                <IconButton
                  icon={openSubmenu === tab.label ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  variant="unstyled"
                  size="xs"
                  onClick={() => handleSubmenuToggle(tab.label)}
                  aria-label="Toggle Submenu"
                />
              )}
              </Text>
            </Box>
            {tab.submenu && (
              <Collapse in={openSubmenu === tab.label} animateOpacity>
                <VStack pl={4} align="stretch">
                  {tab.submenu.map((subTab, subIndex) => (
                    <Box
                      key={subIndex}
                      p={2}
                      borderRadius="md"
                      cursor="pointer"
                      bg={activeTab === subTab ? activeBg : 'transparent'}
                      color={activeTab === subTab ? activeColor : 'inherit'}
                      _hover={{ bg: activeBg, color: activeColor }}
                      onClick={() => setActiveTab(subTab)}
                    >
                      <Text>{subTab}</Text>
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

export default SideBar;
