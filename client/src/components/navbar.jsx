import React from "react";
import logo from "../assets/logo.png"
import {
  Box,
  Flex,
  Text,
  Button,
  ChakraProvider,
  extendTheme,
  Link,
  Image,
} from "@chakra-ui/react";

const theme = extendTheme({
  components: {
    Button: {
      // Style the Button component
      baseStyle: {
        fontWeight: "bold",
      },
    },
  },
});

function Navbar({ isAuthenticated }) {
  return (
    <ChakraProvider theme={theme}>
      <Box bg="black" py={2} px={4}>
        <Flex justify="space-between" align="center">
          <Flex align="center">
            <Image src={logo} alt="Logo" h={8} w={8} mr={2} />
            <Text fontSize="xl" color="white">
              My Website
            </Text>
          </Flex>
          <Flex align="center">
            <Link color="white" href="#dashboard" pr={4}>
              Dashboard
            </Link>
            <Link color="white" href="#services" pr={4}>
              Our Services
            </Link>
            <Link color="white" href="#feedback" pr={4}>
              Feedback
            </Link>
            <Link color="white" href="#resources">
              Resources
            </Link>
          </Flex>
          {isAuthenticated ? (
            <Button colorScheme="white" size="sm">
              Logout
            </Button>
          ) : (
            <Button colorScheme="white" size="sm">
              Login
            </Button>
          )}
        </Flex>
      </Box>
    </ChakraProvider>
  );
}

export default Navbar;
