import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChakraProvider,
  Container,
  Box,
  VStack,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Select,
  useToast,
  Flex,
  Text,
  Link,
  Center,
  Heading,
  chakra,
  IconButton,
  Modal,
  ModalOverlay,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users from:', `${apiUrl}/user/getuser/all`);
        const response = await fetch(`${apiUrl}/user/getuser/all`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!response.ok)
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        const data = await response.json();
        console.log('Fetched users data:', data);
        setUsers(data.user); // Assuming data structure is { user: [ {...}, {...}, ... ] }
      } catch (error) {
        console.error('Error fetching users:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAssignRole = async (userId) => {
    const selectedRole = selectedRoles[userId];
    if (!selectedRole) {
      toast({
        title: 'Select a role.',
        description: 'Please select a role before assigning.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const user = users.find((user) => user._id === userId);
    if (user.role.includes(selectedRole)) {
      toast({
        title: 'Role already assigned.',
        description: `The role "${selectedRole}" is already assigned to this user.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      console.log(`Assigning role ${selectedRole} to user ${userId}`);
      const response = await fetch(`${apiUrl}/user/getuser/assignrole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role: selectedRole }),
      });
      if (!response.ok)
        throw new Error(`Failed to assign role: ${response.statusText}`);
      const data = await response.json();
      console.log('Role assigned successfully:', data);
      setUsers(users.map((user) => (user._id === userId ? data.user : user)));
      setSelectedRoles({ ...selectedRoles, [userId]: '' }); // Clear the selected role after successful assignment
    } catch (error) {
      console.error('Error assigning role:', error.message);
    }
  };

  const handleDeleteRole = async (userId, role) => {
    try {
      console.log(`Deleting role ${role} from user ${userId}`);
      const response = await fetch(`${apiUrl}/user/getuser/deleterole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role }),
      });
      if (!response.ok)
        throw new Error(`Failed to delete role: ${response.statusText}`);
      const data = await response.json();
      console.log('Role deleted successfully:', data);
      setUsers(users.map((user) => (user._id === userId ? data.user : user)));
    } catch (error) {
      console.error('Error deleting role:', error.message);
    }
  };

  const handleRoleChange = (userId, role) => {
    setSelectedRoles({ ...selectedRoles, [userId]: role });
  };

  const HeaderUserMan = ({ title }) => {
    const navigate = useNavigate();

    return (
      <Heading mr="1" ml="1" display="flex">
        <IconButton
          mb="1"
          variant="ghost"
          onClick={() => navigate(-1)}
          _hover={{ bgColor: 'transparent' }}
        >
          <chakra.svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="white"
            className="w-6 h-6"
            _hover={{ stroke: '#00BFFF' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </chakra.svg>
        </IconButton>
        <chakra.div marginInline="auto" color="white" fontSize="25px" mt="2">
          {title}
        </chakra.div>
      </Heading>
    );
  };

  function ConfirmationModal(props) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
      <>
        <Center border="1px solid red" borderRadius={'50%'}>
          <CloseIcon
            color="red"
            fontSize={'medium'}
            padding="4px"
            onClick={onOpen}
          />
        </Center>
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          isCentered
          motionPreset="slideInBottom"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader
              backgroundColor={'black'}
              color="white"
              borderTopRadius={'5px'}
              textAlign={'center'}
            >
              Confirmation
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                Are you sure you want to delete the role {props.role} from this
                user?
              </Text>
            </ModalBody>
            <ModalFooter>
              <Flex
                width="100%"
                alignItems={'center'}
                justifyContent={'space-evenly'}
              >
                <Button colorScheme="blackAlpha" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    props.deleteFn();
                    onClose();
                  }}
                >
                  Delete
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

  if (isLoading)
    return (
      <Flex
        style={{
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <br />
        <br />
        <Spinner />
      </Flex>
    );

  return (
    <ChakraProvider>
      <Container maxW="container.lg">
        <Box p={4}>
          <VStack spacing={4} align="center">
            <Box bg="black" p={0.2} width="100%">
              <HeaderUserMan
                color="white"
                textAlign="center"
                title="User Management"
              />
            </Box>
            <Flex justify="space-between" w="full">
              {/* <Text fontSize="2xl" fontWeight="bold">User Management</Text> */}
              <Link href="/register">
                <Button colorScheme="teal" size="md">
                  Create New User
                </Button>
              </Link>
            </Flex>
            <Box maxW="95%" overflowX={'auto'}>
              <Table
                variant="simple"
                colorScheme="teal"
                size="md"
                borderColor="gray.200"
                borderWidth="1px"
              >
                <Thead bg="gray.100">
                  <Tr>
                    <Th>Email</Th>
                    <Th>Roles</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user, index) => (
                    <Tr
                      key={user._id}
                      bg={index % 2 === 0 ? 'gray.50' : 'white'}
                    >
                      <Td>{user.email.join(', ')}</Td>
                      <Td>
                        <Flex
                          direction="row"
                          align="center"
                          justifyContent={'space-between'}
                        >
                          <Select
                            width="50%"
                            minWidth="150px"
                            value={selectedRoles[user._id] || ''}
                            placeholder="Select role"
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            mb={2}
                          >
                            <option value="admin">Admin</option>
                            <option value="ITTC">
                              Institute Time Table Coordinator
                            </option>
                            <option value="DTTI">
                              Department Time Table Coordinator
                            </option>
                            <option value="CM">Certificate Manager</option>
                            <option value="EO">Event Organiser</option>
                            <option value="editor">Editor</option>
                            <option value="PRM">PRM</option>
                            <option value="FACULTY">Faculty</option>
                            <option value="doctor">Doctor</option>
                            <option value="patient">Patient</option>
                            <option value="dm-admin">
                              Diabetics Module Admin
                            </option>
                          </Select>
                          <Button
                            isDisabled={!selectedRoles[user._id]}
                            colorScheme="blue"
                            size="sm"
                            onClick={() => handleAssignRole(user._id)}
                          >
                            Assign Role
                          </Button>
                        </Flex>
                        {user.role.map((role, idx) => (
                          <Flex
                            key={idx}
                            mb={2}
                            justify="space-between"
                            align="center"
                          >
                            <Text>{role}</Text>
                            <ConfirmationModal
                              role={role}
                              deleteFn={() => handleDeleteRole(user._id, role)}
                            />
                          </Flex>
                        ))}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </Box>
      </Container>
    </ChakraProvider>
  );
};

export default UserManagementPage;
