import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';

const PlatformLayout = () => {
  return (
    <Box minH="100vh">
      <Outlet />
    </Box>
  );
};

export default PlatformLayout;
