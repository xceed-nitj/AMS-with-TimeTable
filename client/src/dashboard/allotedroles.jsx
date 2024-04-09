// AllocatedRolesPage.jsx

import React, { useState, useEffect } from "react";
import { ChakraProvider,Container, Box, Text, VStack, Spinner, Table, Thead, Tbody, Tr, Th, Td, Link as ChakraLink } from "@chakra-ui/react";
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

const AllocatedRolesPage = () => {
  const [allocatedRoles, setAllocatedRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState('');

  useEffect(() => {
    const fetchAllocatedRoles = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/getuser`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error("Failed to fetch allocated roles");
        }

        const userdetails = await response.json();
        setAllocatedRoles(userdetails.user.role);
        setUser(userdetails.user);
      } catch (error) {
        console.error("Error fetching allocated roles:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllocatedRoles();
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <ChakraProvider>
          <Container maxW="container.lg">
      <Box p={4}>
        {isLoading ? (
          <Spinner />
        ) : (
          <VStack spacing={4} align="center">
            {user && (
              <>
                <Text fontSize="xl">Welcome, {user.email}!</Text>
              </>
            )}
                <Table variant="striped" colorScheme="teal" size="md">
                  <Thead>
                    <Tr>
                      <Th>S.No</Th>
                      <Th>Role Alloted</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {/* Map through roles to create table rows */}
                    {allocatedRoles.map((role, index) => (
                      <Tr key={index}>
                        <Td>{index + 1}</Td>
                        <Td>{role === "ITTC" ? (<Text>Institute Time Table Coordinator</Text>):null}
                        {role === "DTTI" ? (<Text>Department Time Table Coordinator</Text>):null}
                        {role === "CM" ? (<Text>Event Certificate Manager</Text>):null}
                        {role === "admin" ? (<Text>XCEED Super User</Text>):null}
                        {role === "EO" ? (<Text>Event Organiser</Text>):null}
                        {role === "PRM" ? (<Text>Paper Review Management</Text>):null}

                        </Td>
                        <Td>
                          {role === "ITTC" ? (
                            <ChakraLink href="/tt/admin" color="teal.500">
                              ITTC Admin Page
                            </ChakraLink>
                          ) : null}
                          {role === "DTTI" ? (
                            <ChakraLink href="/tt/dashboard" color="teal.500">
                              Time Table Dashboard
                            </ChakraLink>
                          ) : null}
                          {role === "CM" ? (
                            <ChakraLink href="/cm/dashboard" color="teal.500">
                              Certificate Management Dashboard
                            </ChakraLink>
                          ) : null}
                           {role === "admin" ? (
                            <ChakraLink href="/admin/dashboard" color="teal.500">
                              XCEED admin Dashboard
                            </ChakraLink>
                          ) : null}

{role === "EO" ? (
                            <ChakraLink href="/cf/dashboard" color="teal.500">
                              Event Manager
                            </ChakraLink>
                          ) : null}

{role === "PRM" ? (
                            <ChakraLink href="/prm/dashboard" color="teal.500">
                              Review Manager
                            </ChakraLink>
                          ) : null}

                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
          </VStack>
        )}
      </Box>
      </Container>
    </ChakraProvider>
  );
};

export default AllocatedRolesPage;
