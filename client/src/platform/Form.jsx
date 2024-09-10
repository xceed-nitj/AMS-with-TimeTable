import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast, Box, Button, Checkbox, FormControl, FormLabel, Heading, Stack, Textarea } from "@chakra-ui/react";
import { Input, FormHelperText, FormErrorMessage, Select, InputGroup, InputLeftElement } from "@chakra-ui/react";
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from '@chakra-ui/react'
import getEnvironment from "../getenvironment";
import { FaLinkedinIn } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";

const FormComponent = () => {
  const [roles, setRoles] = useState(['PRM', 'Admin', 'Editor', 'SuperAdmin']); // Default values
  const [services, setServices] = useState([]); // Default values
  const [students, setStudents] = useState([]); // Default values
  const [exemptedLinks, setExemptedLinks] = useState(['login', 'register', 'verify']); // Default values
  const [researchArea, setResearchArea] = useState(['ECE', 'IT', 'EE', 'ME']); // Default values
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedExemptedLinks, setSelectedExemptedLinks] = useState([]);
  const [selectedResearchArea, setSelectedResearchArea] = useState([]);
  const [data, setData] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [newServices, setNewServices] = useState({
    serviceName: '', 
    description: '',
    type: '',
    cost: '',
  });
  const [newStudents, setNewStudents] = useState({
    studentName: '', 
    department: '',
    batch: '',
    linkedin: '',
    github: '',
  });
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [cost, setCost] = useState('');
  const [studentName, setStudentName] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [newStudent, setNewStudent] = useState('');
  const [newExemptedLink, setNewExemptedLink] = useState('');
  const [newResearchArea, setNewResearchArea] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [isErr, setIsErr] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const toast = useToast();
  const apiUrl = getEnvironment();

  useEffect(() => {
    fetchData();
  }, []);

  const isError ="";

  const fetchData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/platform/getplatform`);
      setData(response.data);
      console.log(response.data);
      if (response.data.length > 0) {
        setRoles((prevRoles) => [...new Set([...prevRoles, ...(response.data[0].roles || [])])]);
        setServices((prevServices) => [...new Set([...prevServices, ...(response.data[0].services || [])])])
        setStudents((prevStudents) => [...new Set([...prevStudents, ...(response.data[0].students || [])])])
        setExemptedLinks((prevLinks) => [...new Set([...prevLinks, ...(response.data[0].exemptedLinks || [])])]);
        setResearchArea((prevAreas) => [...new Set([...prevAreas, ...(response.data[0].researchArea || [])])]);
      }
    } catch (error) {
      toast({
        title: "Failed to fetch data",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleAddRole = () => {
    if (!newRole) {
      toast({
        title: "Role cannot be empty",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setRoles((prevRoles) => [...new Set([...prevRoles, newRole])]);
    setNewRole('');
  };

  const handleAddService = () => {
    // Validate fields
    if (!serviceName || !description || !type || !cost) {
      setIsErr(true);
      toast({
        title: "All fields are required",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
  
    // Reset error state
    setIsErr(false);
  
    // Construct the service data object
    const newService = {
      serviceName,
      description,
      type,
      cost,
    };
  
      
    setServices([...services, newService]); // Update state with the new service
    toast({
      title: "Service added successfully",
      status: "success",
      duration: 2000,
      isClosable: true,
    });

    // Simulate service addition (you can replace this with an API call)
    console.log("New Service Added:", newService);
    
    // Reset form fields after submission
    setServiceName('');
    setDescription('');
    setType('');
    setCost('');
  };
  
const handleAddStudents = () => {
    // Validate fields
    console.log("studentName:",studentName);
    console.log("department:",department);
    console.log("batch:",batch);
    console.log("linkedin:",linkedin);
    console.log("github:",github);
    if (!studentName || !department || !batch || !linkedin || !github) {
      setIsErr(true);
      toast({
        title: "All fields are required",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
  
    // Reset error state
    setIsErr(false);
  
    // Construct the service data object
    const newStudent = {
      studentName,
      department,
      batch,
      linkedin,
      github
    };
  
      
    setStudents([...students, newStudent]); // Update state with the new service
    toast({
      title: "Service added successfully",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
    
    // Simulate service addition (you can replace this with an API call)
    console.log("New Student Added:", newStudent);
    
    // Reset form fields after submission
    setStudentName('');
    setDepartment('');
    setBatch('');
    setLinkedin('');
    setGithub('');
  };

  const handleAddExemptedLink = () => {
    if (!newExemptedLink) {
      toast({
        title: "Exempted Link cannot be empty",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setExemptedLinks((prevLinks) => [...new Set([...prevLinks, newExemptedLink])]);
    setNewExemptedLink('');
  };

  const handleAddResearchArea = () => {
    if (!newResearchArea) {
      toast({
        title: "Research Area cannot be empty",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setResearchArea((prevAreas) => [...new Set([...prevAreas, newResearchArea])]);
    setNewResearchArea('');
  };

  
  const handleCreatePlatform = async () => {
    if (!selectedRoles.length || !newServices.length|| !selectedExemptedLinks.length || !selectedResearchArea.length) {
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
        roles: selectedRoles,
        services: newServices,
        students:selectedStudents,
        exemptedLinks: selectedExemptedLinks,
        researchArea: selectedResearchArea,
      });
      setData((prevData) => [...prevData, response.data]);
      setSelectedRoles([]);
      setSelectedServices([]);
      setSelectedStudents([]);
      setSelectedExemptedLinks([]);
      setSelectedResearchArea([]);
      toast({
        title: "Platform created successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to create platform",
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
      setSelectedRoles(item[0].roles || []);
      setSelectedServices(item[0].services || []);
      setSelectedStudents(item[0].students || []);
      setSelectedExemptedLinks(item[0].exemptedLinks || []);
      setSelectedResearchArea(item[0].researchArea || []);
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
        roles: selectedRoles,
        services: selectedServices,
        students: selectedStudents,
        exemptedLinks: selectedExemptedLinks,
        researchArea: selectedResearchArea,
      });
      setData((prevData) =>
        prevData.map((item) =>
          item._id === currentId ? response.data : item
        )
      );
      setSelectedRoles([]);
      setSelectedServices([]);
      setSelectedStudents([]);
      setSelectedExemptedLinks([]);
      setSelectedResearchArea([]);
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
  
  const handleSortByType = () => {
    console.log(Array.isArray(services)); // Check if services is an array
    console.log(services); // Log the current state of services

    const sortedServices = [...services].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.type.localeCompare(b.type);
      } else {
        return b.type.localeCompare(a.type);
      }
    });

    setServices(sortedServices);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
          <Button onClick={handleAddRole} width="10%" colorScheme="green">Add Role</Button>
        </Stack>
      </FormControl>
      <FormControl id="services" mb={4}>
      <FormLabel>Services</FormLabel>
        <Stack spacing={2}>
          <FormLabel>Name</FormLabel>
          <Input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            w="400px"
          />
          <FormLabel>Description</FormLabel>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            w="400px"
          />
          <FormLabel>Type</FormLabel>
          <Select
            placeholder="Select type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            w="400px"
          >
            <option value="institute">Institute</option>
            <option value="premium">Premium</option>
          </Select>
          <FormLabel>Cost</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="gray.300" fontSize="1.2em">
              $
            </InputLeftElement>
            <Input
              placeholder="Enter cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              w="400px"
            />
          </InputGroup>
          <Button onClick={handleAddService} width="10%" colorScheme="green">
            Add Service
          </Button>
          <TableContainer>
            <Table size='sm'>
              <Thead>
                <Tr>
                  <Th>Service No.</Th>
                  <Th>Name</Th>
                  <Th>Description</Th>
                  <Th>
                    Type
                    <Button size="xs" ml={2} onClick={handleSortByType}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </Button>
                  </Th>
                  <Th isNumeric>Cost</Th>
                </Tr>
              </Thead>
              <Tbody>
              {services.reduce((uniqueServices, currentService) => {
                  // Check if the service is already in the uniqueServices array
                  if (!uniqueServices.some(service => service.serviceName === currentService.serviceName)) {
                    // If it's not, add it to the array
                    uniqueServices.push(currentService);
                  }
                  return uniqueServices;
                }, []) // Initial empty array for accumulating unique services
                .map((service, index) => (
                  <Tr key={index}>
                    <Td>{index + 1}</Td>
                    <Td>{service.serviceName}</Td>
                    <Td>
                      {service.description.length > 50 
                        ? `${service.description.slice(0, 50)}...` 
                        : service.description}
                    </Td>
                    <Td>{service.type}</Td>
                    <Td isNumeric>{service.cost}</Td>
                  </Tr>
                ))}
            </Tbody>
            </Table>
          </TableContainer>
        </Stack>
      </FormControl>
      <FormControl id="roles" mb={4}>
        <FormLabel>Students</FormLabel>
        <Stack spacing={2}>
          
          <FormLabel>Name</FormLabel>
          <Input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            w="400px"
          />
            <FormLabel>Department</FormLabel>
            <Select placeholder='Select Department'
            w="400px"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}>
              <option>CSE</option>
              <option>DS</option>
              <option>IT</option>
              <option>ECE</option>
              <option>EE</option>
              <option>VLSI</option>
              <option>ICE</option>
              <option>ME</option>
              <option>CHE</option>
              <option>CE</option>
              <option>BT</option>
              <option>TT</option>
            </Select>
            <FormLabel>Batch</FormLabel>
            <Select 
            placeholder='Enter batch' 
            w="400px"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            >
              <option>2025</option>
              <option>2026</option>
              <option>2027</option>
              <option>2028</option>
            </Select>
            <FormLabel>Linkedin</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents='none' color='gray.300' fontSize='1.2em'>
                <FaLinkedinIn />
              </InputLeftElement>
              <Input placeholder='Enter profile link' w="400px"  type="text"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            />
            </InputGroup>
            <FormLabel>Github</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents='none' color='gray.300' fontSize='1.2em'>
                <FaGithub />
              </InputLeftElement>
              <Input placeholder='Enter profile link' w="400px"
               type="text"
               value={github}
               onChange={(e) => setGithub(e.target.value)}
              />
            </InputGroup>
          <Button onClick={handleAddStudents} width="10%" colorScheme="green">Add Student</Button>
          <TableContainer>
            <Table size='sm'>
              <Thead>
                <Tr>
                  <Th>Student No.</Th>
                  <Th>Name</Th>
                  <Th>Department</Th>
                  <Th>Batch</Th>
                  <Th>Linkedin</Th>
                  <Th>Github</Th>
                </Tr>
              </Thead>
              <Tbody>
              {students.reduce((uniqueStudents, currentStudents) => {
                  if (!uniqueStudents.some(student => student.studentName === currentStudents.studentName)) {
                    uniqueStudents.push(currentStudents);
                  }
                  return uniqueStudents;
                }, [])
                .map((student, index) => (
                  <Tr key={index}>
                    <Td>{index + 1}</Td>
                    <Td>{student.studentName}</Td>
                    <Td>{student.department}</Td>
                    <Td>{student.batch}</Td>
                    <Td>{student.linkedin}</Td>
                    <Td>{student.github}</Td>
                  </Tr>
                ))}
            </Tbody>
            </Table>
          </TableContainer>
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
          <Button onClick={handleAddExemptedLink} width='20%' colorScheme="green">Add Exempted Link</Button>
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
          <Button onClick={handleAddResearchArea} width="20%" colorScheme="green">Add Research Area</Button>
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
        <Heading size="md" mb={4}>Data</Heading>
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
                  <Td>{item.roles.join(", ")}</Td>
                  <Td>{item.exemptedLinks.join(", ")}</Td>
                  <Td>{item.researchArea.join(", ")}</Td>
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
                <Td colSpan="4" style={{ textAlign: "center" }}>No data available</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default FormComponent;
