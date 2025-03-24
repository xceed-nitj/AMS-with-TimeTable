import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiMenu,
  FiX,
  FiHome,
  FiUser,
  FiUsers,
  FiActivity,
  FiLogOut,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import getEnvironment from '../../getenvironment';
import { axiosInstance } from '../api/config';

const DMNavbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userRole, setUserRole] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const apiUrl = getEnvironment();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  useEffect(() => {
    const getUserDetails = async () => {
      try {
        const response = await axiosInstance.get('/user/getuser/');

        const userdetail = response.data;
        setUserDetails(userdetail);
        // Assuming the role is stored in userdetail.role
        setUserRole(userdetail.role);
      } catch (error) {
        console.error('Error fetching user details:', error.message);
      }
    };

    getUserDetails();
  }, [apiUrl]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiUrl}/user/getuser/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error.message);
    }
  };

  const getNavLinks = () => {
    if (!userDetails?.user?.role) return [];

    const roles = userDetails.user.role;

    // Admin has access to all links
    if (roles.includes('dm-admin')) {
      return [
        { name: 'Dashboard', path: '/dm/admin/dashboard', icon: FiHome },
        { name: 'Add Hospital', path: '/dm/addHospital', icon: FiUsers },
        { name: 'Add Doctor', path: '/dm/addDoctor', icon: FiUser },
        { name: 'Add Patient', path: '/dm/addPatient', icon: FiUser },
      ];
    }

    // Doctor links
    if (roles.includes('doctor')) {
      return [
        { name: 'Dashboard', path: '/dm/doctor/dashboard', icon: FiHome },
        // {
        //   name: 'Add Daily Dosage',
        //   path: '/dm/addDailyDosage',
        //   icon: FiActivity,
        // },
        // { name: 'Add Sick Day', path: '/dm/addSickDay', icon: FiActivity },
      ];
    }

    // Patient links
    if (roles.includes('patient')) {
      return [
        { name: 'Dashboard', path: '/dm/patient/dashboard', icon: FiHome },
        // {
        //   name: 'History',
        //   path: `/dm/patient/${userDetails?.user._id}/history`,
        //   icon: FiActivity,
        // },
      ];
    }

    return [];
  };

  const NavLink = ({ name, path, icon }) => {
    const isActive = location.pathname === path;
    return (
      <Link to={path}>
        <Flex
          align="center"
          px={2}
          py={1}
          mx={1}
          role="group"
          cursor="pointer"
          fontSize="sm"
          _hover={{
            color: 'blue.500',
          }}
          color={isActive ? 'blue.700' : textColor}
          borderBottom={isActive ? '1px solid' : 'none'}
          borderColor="blue.700"
        >
          <Icon as={icon} mr={2} boxSize={4} />
          {name}
        </Flex>
      </Link>
    );
  };

  return (
    <Box
      bg={bgColor}
      px={2}
      boxShadow="sm"
      position="sticky"
      top={0}
      w="100%"
      zIndex="sticky"
      borderBottom="1px"
      borderColor={borderColor}
    >
      <Flex h={14} alignItems="center" justifyContent="space-between" px={2}>
        <Flex alignItems="center">
          <Link to="/dm/login">
            <Flex alignItems="center">
              <img
                src="/dm/it1d-logo.jpeg"
                alt="DM Logo"
                style={{ height: '36px' }}
              />
            </Flex>
          </Link>
        </Flex>

        {/* Desktop Navigation */}
        <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
          {getNavLinks().map((link) => (
            <NavLink key={link.path} {...link} />
          ))}
          {userDetails && (
            <Flex align="center" gap={3} ml={2}>
              <Text fontSize="sm" color="cyan.500">
                {userDetails.user.email}
              </Text>
              <Button
                colorScheme="teal"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                leftIcon={<FiLogOut />}
                px={3}
              >
                Logout
              </Button>
            </Flex>
          )}
        </HStack>

        {/* Mobile menu button */}
        <Box display={{ base: 'flex', md: 'none' }}>
          <Icon
            as={isOpen ? FiX : FiMenu}
            onClick={isOpen ? onClose : onOpen}
            cursor="pointer"
            w={5}
            h={5}
          />
        </Box>
      </Flex>

      {/* Mobile Navigation */}
      {isOpen && (
        <Box pb={3} display={{ md: 'none' }}>
          <VStack spacing={1}>
            {getNavLinks().map((link) => (
              <NavLink key={link.path} {...link} />
            ))}
            {userDetails && (
              <Flex align="center" gap={3} w="100%" px={3} py={2}>
                <Text fontSize="sm" color="cyan.500">
                  {userDetails.user.email}
                </Text>
                <Button
                  colorScheme="teal"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<FiLogOut />}
                  px={3}
                >
                  Logout
                </Button>
              </Flex>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default DMNavbar;
