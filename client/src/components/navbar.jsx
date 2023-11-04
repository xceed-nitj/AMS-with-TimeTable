import React from "react";
import { useLocation } from "react-router-dom"; 
import logo from "../assets/clublogo.png"
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
  const location = useLocation(); // Get the current route location

  // Define an array of routes where you want to exclude the Navbar
  const excludedRoutes = ["/",];

  // Check if the current route is in the excludedRoutes array
  const isExcluded = excludedRoutes.includes(location.pathname);

  // Conditionally render the Navbar based on the route
  if (isExcluded) {
    return null; // Exclude Navbar in certain routes
  }

  return (
    <ChakraProvider theme={theme}>
      <Box bg="black" py={2} px={4}>
        <Flex justify="space-between" align="center">
          <Flex align="center">
            <Image src={logo} alt="Logo" h={10} w={40} mr={2} />
            <Text fontSize="xl" color="white">
              
            </Text>
          </Flex>
          <Flex align="center">
            <Link color="white" href=" " pr={4}>
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
              
            </Button>
          ) : (
            <Button colorScheme="white" size="sm">
              
            </Button>
          )}
        </Flex>
      </Box>
    </ChakraProvider>
  );
}

export default Navbar;
