import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/clublogo.png";
import getEnvironment from '../getenvironment';
import {
  Box,
  Flex,
  Text,
  Button,
  ChakraProvider,
  extendTheme,
  Link,
  Image,
  Spacer,
  Spinner,
} from "@chakra-ui/react";
// import Cookies from "js-cookie";


const theme = extendTheme({
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
      },
    },
  },
});

const apiUrl = getEnvironment();

// ... (import statements)

// ... (import statements)

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        setUserDetails(userDetails);
        setIsAuthenticated(true);
      } catch (error) {
        // Handle error (e.g., display an error message or redirect to an error page)
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const getUserDetails = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/getuser/`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const userdetail = await response.json();
      return userdetail;
    } catch (error) {
      console.error("Error fetching user details:", error.message);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      // Send a request to the server's logout route
      const response = await fetch(`${apiUrl}/user/getuser/logout`, {
        method: "POST",
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      // deleteCookie("jwt");
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };
    // Define an array of routes where you want to exclude the Navbar
  const excludedRoutes = ["/"];

  // Check if the current route is in the excludedRoutes array
  const isExcluded = excludedRoutes.includes(location.pathname);

  if (isLoading || isExcluded) {
    return null; // Exclude Navbar in certain routes
  }

  return (
    <ChakraProvider theme={theme}>
      <Box bg="black" py={2} px={4}>
        <Flex justify="space-between" align="center">
          <Flex align="center">
            <Image src={logo} alt="Logo" h={10} w={40} mr={2} />
          </Flex>
          <Spacer />
          {isAuthenticated ? (
            <Text fontSize="xl" color="white">
              {userDetails && (
                <>
                  <span>{userDetails.user.email}</span>
                  <Button colorScheme="white" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              )}
            </Text>
          ) : (
            <Link color="white" href="/">
              Login
            </Link>
          )}
        </Flex>
      </Box>
    </ChakraProvider>
  );
};

export default Navbar;
