import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast, Box, Button, Checkbox, FormControl, FormLabel, Heading, Stack, Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import getEnvironment from "../getenvironment"; 

const FormComponent = () => {
  const [roles, setRoles] = useState([]);
  const [exemptedLinks, setExemptedLinks] = useState([]);
  const [researchArea, setResearchArea] = useState([]);
  const [data, setData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const toast = useToast();
  const apiUrl = getEnvironment();

  const rolesOptions = ["PRM", "Admin", "Editor", "SuperAdmin"];
  const exemptedLinksOptions = ["login", "register", "verify"];
  const researchAreaOptions = ["ECE", "IT", "EE", "ME"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/platform/getplatform`);
      setData(response.data);
    } catch (error) {
      toast({
        title: "Failed to fetch data",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleAdd = async () => {
    if (!roles.length || !exemptedLinks.length || !researchArea.length) {
      toast({
        title: "All fields are required",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/platform/add`, {
        roles,
        exemptedLinks,
        researchArea,
      });
      console.log(response);
      setData((prevData) => [...prevData, response.data]);
      setRoles([]);
      setExemptedLinks([]);
      setResearchArea([]);
      toast({
        title: "Data added successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to add data",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`${apiUrl}/platform/get/${id}`);
      const item = response.data;
      console.log(item[0]);
      setRoles(item[0].roles || []);
      setExemptedLinks(item[0].exemptedLinks || []);
      setResearchArea(item[0].researchArea || []);
      setIsEditing(true);
      setCurrentId(id);
    } catch (error) {
      toast({
        title: "Failed to fetch data",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleUpdate = async () => {
    if (!currentId) return;

    try {
      const response = await axios.patch(`${apiUrl}/platform/update/${currentId}`, {
        roles,
        exemptedLinks,
        researchArea,
      });
      setData((prevData) =>
        prevData.map((item) =>
          item._id === currentId ? response.data : item
        )
      );
      setRoles([]);
      setExemptedLinks([]);
      setResearchArea([]);
      setIsEditing(false);
      setCurrentId(null);
      toast({
        title: "Data updated successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to update data",
        status: "error",
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
        title: "Data deleted successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to delete data",
        status: "error",
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
          {rolesOptions.map((role) => (
            <Checkbox
              key={role}
              isChecked={roles.includes(role)}
              onChange={(e) => {
                const updatedRoles = e.target.checked
                  ? [...roles, role]
                  : roles.filter((r) => r !== role);
                setRoles(updatedRoles);
              }}
            >
              {role}
            </Checkbox>
          ))}
        </Stack>
      </FormControl>
      <FormControl id="exemptedLinks" mb={4}>
        <FormLabel>Exempted Links</FormLabel>
        <Stack spacing={2}>
          {exemptedLinksOptions.map((link) => (
            <Checkbox
              key={link}
              isChecked={exemptedLinks.includes(link)}
              onChange={(e) => {
                const updatedLinks = e.target.checked
                  ? [...exemptedLinks, link]
                  : exemptedLinks.filter((l) => l !== link);
                setExemptedLinks(updatedLinks);
              }}
            >
              {link}
            </Checkbox>
          ))}
        </Stack>
      </FormControl>
      <FormControl id="researchArea" mb={4}>
        <FormLabel>Research Area</FormLabel>
        <Stack spacing={2}>
          {researchAreaOptions.map((area) => (
            <Checkbox
              key={area}
              isChecked={researchArea.includes(area)}
              onChange={(e) => {
                const updatedAreas = e.target.checked
                  ? [...researchArea, area]
                  : researchArea.filter((a) => a !== area);
                setResearchArea(updatedAreas);
              }}
            >
              {area}
            </Checkbox>
          ))}
        </Stack>
      </FormControl>
      {isEditing ? (
        <Button colorScheme="blue" onClick={handleUpdate}>
          Update
        </Button>
      ) : (
        <Button colorScheme="green" onClick={handleAdd}>
          Add
        </Button>
      )}
      <Box mt={8}>
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
            {data.map((item) => (
              <Tr key={item._id}>
                <Td>{item.roles.join(",")}</Td>
                <Td>{item.exemptedLinks.join(",")}</Td>
                <Td>{item.researchArea.join(",")}</Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleEdit(item._id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(item._id)}
                    ml={2}
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default FormComponent;
