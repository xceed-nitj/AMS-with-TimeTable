import React, { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
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
          method: "GET",
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
        const data = await response.json();
        console.log('Fetched users data:', data);
        setUsers(data.user); // Assuming data structure is { user: [ {...}, {...}, ... ] }
      } catch (error) {
        console.error("Error fetching users:", error.message);
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
        title: "Select a role.",
        description: "Please select a role before assigning.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const user = users.find(user => user._id === userId);
    if (user.role.includes(selectedRole)) {
      toast({
        title: "Role already assigned.",
        description: `The role "${selectedRole}" is already assigned to this user.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      console.log(`Assigning role ${selectedRole} to user ${userId}`);
      const response = await fetch(`${apiUrl}/user/getuser/assignrole`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role: selectedRole }),
      });
      if (!response.ok) throw new Error(`Failed to assign role: ${response.statusText}`);
      const data = await response.json();
      console.log('Role assigned successfully:', data);
      setUsers(users.map(user => user._id === userId ? data.user : user));
      setSelectedRoles({ ...selectedRoles, [userId]: '' });  // Clear the selected role after successful assignment
    } catch (error) {
      console.error("Error assigning role:", error.message);
    }
  };

  const handleDeleteRole = async (userId, role) => {
    const confirmed = window.confirm(`Are you sure you want to delete the role "${role}" from this user?`);
    if (!confirmed) return;

    try {
      console.log(`Deleting role ${role} from user ${userId}`);
      const response = await fetch(`${apiUrl}/user/getuser/deleterole`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role }),
      });
      if (!response.ok) throw new Error(`Failed to delete role: ${response.statusText}`);
      const data = await response.json();
      console.log('Role deleted successfully:', data);
      setUsers(users.map(user => user._id === userId ? data.user : user));
    } catch (error) {
      console.error("Error deleting role:", error.message);
    }
  };

  const handleRoleChange = (userId, role) => {
    setSelectedRoles({ ...selectedRoles, [userId]: role });
  };

  if (isLoading) return <Spinner />;

  return (
    <ChakraProvider>
      <Container maxW="container.lg">
        <Box p={4}>
          <VStack spacing={4} align="center">
            <Flex justify="space-between" w="full">
              <Text fontSize="2xl" fontWeight="bold">User Management</Text>
              <Link href="/register">
                <Button colorScheme="teal" size="md">Create New User</Button>
              </Link>
            </Flex>
            <Table variant="simple" colorScheme="teal" size="md" borderColor="gray.200" borderWidth="1px">
              <Thead bg="gray.100">
                <Tr>
                  <Th>Email</Th>
                  <Th>Roles</Th>
                  <Th>Manage Roles</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user, index) => (
                  <Tr key={user._id} bg={index % 2 === 0 ? 'gray.50' : 'white'}>
                    <Td>{user.email.join(", ")}</Td>
                    <Td>
                      {user.role.map((role, idx) => (
                        <Flex key={idx} mb={2} justify="space-between" align="center">
                          <Text>{role}</Text>
                          <Button ml={2} colorScheme="red" size="xs" onClick={() => handleDeleteRole(user._id, role)}>Delete</Button>
                        </Flex>
                      ))}
                    </Td>
                    <Td>
                      <Flex direction="column" align="flex-start">
                        <Select 
                          value={selectedRoles[user._id] || ''} 
                          placeholder="Select role" 
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          mb={2}
                        >
                          <option value="admin">Admin</option>
                          <option value="ITTC">Institute Time Table Coordinator</option>
                          <option value="DTTI">Department Time Table Coordinator</option>
                          <option value="CM">Certificate Manager</option>
                          <option value="EO">Event Organiser</option>
                          <option value="editor">Editor</option>
                          <option value="PRM">PRM</option>
                          <option value="FACULTY">Faculty</option>
                        </Select>
                        <Button colorScheme="teal" size="sm" onClick={() => handleAssignRole(user._id)}>Assign Role</Button>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </VStack>
        </Box>
      </Container>
    </ChakraProvider>
  );
};

export default UserManagementPage;
