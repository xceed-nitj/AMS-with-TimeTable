import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  useToast,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Textarea,
} from '@chakra-ui/react';
import getEnvironment from '../getenvironment';
import TreeForm from './treeForm';

const FormComponent = () => {
  const [roles, setRoles] = useState([
    'PRM',
    'Admin',
    'Editor',
    'SuperAdmin',
    'doctor',
    'patient',
    'dm-admin',
  ]); // Default values
  const [exemptedLinks, setExemptedLinks] = useState([
    'login',
    'register',
    'verify',
  ]); // Default values
  const [researchArea, setResearchArea] = useState(['ECE', 'IT', 'EE', 'ME']); // Default values
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedExemptedLinks, setSelectedExemptedLinks] = useState([]);
  const [selectedResearchArea, setSelectedResearchArea] = useState([]);
  const [data, setData] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [newExemptedLink, setNewExemptedLink] = useState('');
  const [newResearchArea, setNewResearchArea] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const toast = useToast();
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/platform/getplatform`);
      setData(response.data);
      console.log(response.data);
      if (response.data.length > 0) {
        setRoles((prevRoles) => [
          ...new Set([...prevRoles, ...(response.data[0].roles || [])]),
        ]);
        setExemptedLinks((prevLinks) => [
          ...new Set([...prevLinks, ...(response.data[0].exemptedLinks || [])]),
        ]);
        setResearchArea((prevAreas) => [
          ...new Set([...prevAreas, ...(response.data[0].researchArea || [])]),
        ]);
      }
    } catch (error) {
      toast({
        title: 'Failed to fetch data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleAddRole = () => {
    if (!newRole) {
      toast({
        title: 'Role cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setRoles((prevRoles) => [...new Set([...prevRoles, newRole])]);
    setNewRole('');
  };

  const handleAddExemptedLink = () => {
    if (!newExemptedLink) {
      toast({
        title: 'Exempted Link cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setExemptedLinks((prevLinks) => [
      ...new Set([...prevLinks, newExemptedLink]),
    ]);
    setNewExemptedLink('');
  };

  const handleAddResearchArea = () => {
    if (!newResearchArea) {
      toast({
        title: 'Research Area cannot be empty',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setResearchArea((prevAreas) => [
      ...new Set([...prevAreas, newResearchArea]),
    ]);
    setNewResearchArea('');
  };

  const handleCreatePlatform = async () => {
    if (
      !selectedRoles.length ||
      !selectedExemptedLinks.length ||
      !selectedResearchArea.length
    ) {
      toast({
        title: 'All fields are required',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/platform/add`, {
        roles: selectedRoles,
        exemptedLinks: selectedExemptedLinks,
        researchArea: selectedResearchArea,
      });
      setData((prevData) => [...prevData, response.data]);
      setSelectedRoles([]);
      setSelectedExemptedLinks([]);
      setSelectedResearchArea([]);
      toast({
        title: 'Platform created successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to create platform',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`${apiUrl}/platform/get/${id}`);
      const item = response.data;
      setSelectedRoles(item[0].roles || []);
      setSelectedExemptedLinks(item[0].exemptedLinks || []);
      setSelectedResearchArea(item[0].researchArea || []);
      setIsEditing(true);
      setCurrentId(id);
    } catch (error) {
      toast({
        title: 'Failed to fetch data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleUpdate = async () => {
    if (!currentId) return;

    try {
      const response = await axios.patch(
        `${apiUrl}/platform/update/${currentId}`,
        {
          roles: selectedRoles,
          exemptedLinks: selectedExemptedLinks,
          researchArea: selectedResearchArea,
        }
      );
      setData((prevData) =>
        prevData.map((item) => (item._id === currentId ? response.data : item))
      );
      setSelectedRoles([]);
      setSelectedExemptedLinks([]);
      setSelectedResearchArea([]);
      setIsEditing(false);
      setCurrentId(null);
      toast({
        title: 'Data updated successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to update data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${apiUrl}/platform/delete/${id}`);
      setData((prevData) => prevData.filter((item) => item._id !== id));
      toast({
        title: 'Data deleted successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to delete data',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Heading mb={4}>Platform Form</Heading>
      <FormControl id="roles" mb={4}>
        <FormLabel>Roles</FormLabel>
        <Stack spacing={2}>
          {roles.map((role) => (
            <Checkbox
              key={role}
              isChecked={selectedRoles.includes(role)}
              onChange={(e) => {
                const updatedRoles = e.target.checked
                  ? [...selectedRoles, role]
                  : selectedRoles.filter((r) => r !== role);
                setSelectedRoles(updatedRoles);
              }}
            >
              {role}
            </Checkbox>
          ))}
          <Textarea
            width="30%"
            placeholder="Add new role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />
          <Button onClick={handleAddRole} width="10%" colorScheme="green">
            Add Role
          </Button>
        </Stack>
      </FormControl>
      <FormControl id="exemptedLinks" mb={4}>
        <FormLabel>Exempted Links</FormLabel>
        <Stack spacing={2}>
          {exemptedLinks.map((link) => (
            <Checkbox
              key={link}
              isChecked={selectedExemptedLinks.includes(link)}
              onChange={(e) => {
                const updatedLinks = e.target.checked
                  ? [...selectedExemptedLinks, link]
                  : selectedExemptedLinks.filter((l) => l !== link);
                setSelectedExemptedLinks(updatedLinks);
              }}
            >
              {link}
            </Checkbox>
          ))}
          <Textarea
            width="30%"
            placeholder="Add new exempted link"
            value={newExemptedLink}
            onChange={(e) => setNewExemptedLink(e.target.value)}
          />
          <Button
            onClick={handleAddExemptedLink}
            width="20%"
            colorScheme="green"
          >
            Add Exempted Link
          </Button>
        </Stack>
      </FormControl>
      <FormControl id="researchArea" mb={4}>
        <FormLabel>Research Area</FormLabel>
        <Stack spacing={2}>
          {researchArea.map((area) => (
            <Checkbox
              key={area}
              isChecked={selectedResearchArea.includes(area)}
              onChange={(e) => {
                const updatedAreas = e.target.checked
                  ? [...selectedResearchArea, area]
                  : selectedResearchArea.filter((a) => a !== area);
                setSelectedResearchArea(updatedAreas);
              }}
            >
              {area}
            </Checkbox>
          ))}
          <Textarea
            width="30%"
            placeholder="Add new research area"
            value={newResearchArea}
            onChange={(e) => setNewResearchArea(e.target.value)}
          />
          <Button
            onClick={handleAddResearchArea}
            width="20%"
            colorScheme="green"
          >
            Add Research Area
          </Button>
        </Stack>
      </FormControl>

      <Button mt={4} colorScheme="green" onClick={handleCreatePlatform}>
        Create Platform
      </Button>
      {isEditing && (
        <Button mt={4} onClick={handleUpdate}>
          Update
        </Button>
      )}
      <Box mt={8}>
        <Heading size="md" mb={4}>
          Data
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Roles</Th>
              <Th>Exempted Links</Th>
              <Th>Research Area</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.length > 0 ? (
              data.map((item) => (
                <Tr key={item._id}>
                  <Td>{item.roles.join(', ')}</Td>
                  <Td>{item.exemptedLinks.join(', ')}</Td>
                  <Td>{item.researchArea.join(', ')}</Td>
                  <Td>
                    <Button onClick={() => handleEdit(item._id)}>Edit</Button>
                    <Button onClick={() => handleDelete(item._id)} ml={2}>
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan="4" style={{ textAlign: 'center' }}>
                  No data available
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
      <TreeForm />
    </Box>
  );
};

export default FormComponent;
