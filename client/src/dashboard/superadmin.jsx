import React from 'react';
import { Flex, Box, Heading, Link, Grid, GridItem } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

const SuperAdminPage = () => {
  return (
    <Flex direction="column" alignItems="center" justifyContent="center" minHeight="50vh" px={4}>
      <Heading as="h1" mb={8}>Super Admin Page</Heading>
      <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
        <GridItem>
          <Box bg="blue.200" p={6} borderRadius="md" textAlign="center">
            <Link as={RouterLink} to="/tt/admin" color="white" fontSize={{ base: "xl", md: "2xl" }}>Time Table Admin</Link>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="green.200" p={6} borderRadius="md" textAlign="center">
            <Link as={RouterLink} to="/cm/addevent" color="white" fontSize={{ base: "xl", md: "2xl" }}>Certificate Management Admin</Link>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="purple.200" p={6} borderRadius="md" textAlign="center">
            <Link as={RouterLink} to="/cf/addconf" color="white" fontSize={{ base: "xl", md: "2xl" }}>Conference Management Admin</Link>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="orange.200" p={6} borderRadius="md" textAlign="center">
            <Link as={RouterLink} to="/prm/assigneditor" color="white" fontSize={{ base: "xl", md: "2xl" }}>Review Management Admin</Link>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="teal.200" p={6} borderRadius="md" textAlign="center">
            <Link as={RouterLink} to="/usermanagement" color="white" fontSize={{ base: "xl", md: "2xl" }}>User Management</Link>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="pink.200" p={6} borderRadius="md" textAlign="center">
            <Link as={RouterLink} to="/platform" color="white" fontSize={{ base: "xl", md: "2xl" }}>Logs</Link>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="gray.200" p={6} borderRadius="md" textAlign="center">
            <Link as={RouterLink} to="/platform" color="white" fontSize={{ base: "xl", md: "2xl" }}>XCEED</Link>
          </Box>
        </GridItem>
      </Grid>
    </Flex>
  );
};

export default SuperAdminPage;
