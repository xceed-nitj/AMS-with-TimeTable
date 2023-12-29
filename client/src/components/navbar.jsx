import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import getEnvironment from '../getenvironment';
import {
  Box,
  Flex,
  Text,
  ChakraProvider,
  extendTheme,
  Link,
  Image,
  Spacer,
  Button,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
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

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

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
      const response = await fetch(`${apiUrl}/user/getuser/logout`, {
        method: "POST",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      // console.log("logoout message", response.message)
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };

  const handleHover = () => {
    setHovered(true);
  };

  const handleLeave = () => {
    setHovered(false);
  };

  const excludedRoutes = ["/login","/"];

  const isExcluded = excludedRoutes.includes(location.pathname);

  if (isLoading || isExcluded) {
    return null;
  }

  return (
    <ChakraProvider theme={theme}>
      <Box bg="black" py={2} px={4}>
        <Flex justify="space-between" align="center">
          <Flex align="center">
            <RouterLink to='/'>
              <Image src='/clublogo.png' alt="Logo" h={10} w={40} mr={2} />
            </RouterLink>
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
            <Link 
              href="/"
              color="white"
              fontWeight="bold"
              p="2"
              borderRadius="md"
              transition="all 0.2s ease-in-out"
              _hover={{
                // transform: 'translateY(-2px)',
                boxShadow: 'lg',
                bg: 'red.500',
                text: hovered ? 'For Faculty Only' : 'Login',
              }}
              _focus={{
                boxShadow: 'outline',
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '160px',
                bg: 'red.500',
              }}
              onMouseOver={handleHover}
              onMouseLeave={handleLeave}
            >
              {hovered ? 'For Members only! ' : 'Login To XCEED'}
            </Link>
          )}
        </Flex>
      </Box>
    </ChakraProvider>
  );
};

export default Navbar;
