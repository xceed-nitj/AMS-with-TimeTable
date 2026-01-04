import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import PlatformSidebar from './PlatformSidebar';

const PlatformLayout = () => {
  return (
    <Flex minH="100vh">
      <PlatformSidebar />
      <Box flex="1" overflowY="auto">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default PlatformLayout;
