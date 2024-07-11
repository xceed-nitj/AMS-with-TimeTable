import React, { useState, useEffect } from "react";
import { ChakraProvider, Container, Box, Text, VStack, Spinner, Table, Thead, Tbody, Tr, Th, Td, Button, Select } from "@chakra-ui/react";
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');

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
    } catch (error) {
      console.error("Error assigning role:", error.message);
    }
  };

  const handleDeleteRole = async (userId, role) => {
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

  if (isLoading) return <Spinner />;

  return (
    <ChakraProvider>
      <Container maxW="container.lg">
        <Box p={4}>
          <VStack spacing={4} align="center">
            <Table variant="striped" colorScheme="teal" size="md">
              <Thead>
                <Tr>
                  <Th>User ID</Th>
                  <Th>Email</Th>
                  <Th>Roles</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user, index) => (
                  <Tr key={user._id}>
                    <Td>{user._id}</Td>
                    <Td>{user.email.join(", ")}</Td>
                    <Td>
                      {user.role.map((role, idx) => (
                        <Box key={idx} mb={2}>
                          {role}
                          <Button ml={2} colorScheme="red" size="xs" onClick={() => handleDeleteRole(user._id, role)}>Delete</Button>
                        </Box>
                      ))}
                    </Td>
                    <Td>
                      <Select placeholder="Select role" onChange={(e) => setSelectedRole(e.target.value)}>
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
