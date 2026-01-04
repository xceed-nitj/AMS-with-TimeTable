import React from 'react';
import { Box, Heading, Text, Container, Badge, VStack, useColorModeValue } from '@chakra-ui/react';
import FormComponent from './Form';

const PlatformConfig = () => {
  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50, pink.50)', 'gray.900');
  
  return (
    <Box bgGradient={bgGradient} minH="100vh" pb={16}>
      <Box 
        bgGradient="linear(to-r, blue.600, purple.600, pink.500)"
        pt={8}
        pb={20}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.1"
          bgImage="radial-gradient(circle, white 1px, transparent 1px)"
          bgSize="30px 30px"
        />
        <Container maxW="7xl" position="relative">
          <VStack spacing={3} align="start">
            <Badge colorScheme="whiteAlpha" fontSize="sm" px={3} py={1} borderRadius="full">
              Platform Configuration
            </Badge>
            <Heading size="2xl" color="white" fontWeight="bold">
              Configuration Management
            </Heading>
            <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
              Manage roles and exempted links
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1}>
        <FormComponent />
      </Container>
    </Box>
  );
};

export default PlatformConfig;
