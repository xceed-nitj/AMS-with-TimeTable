import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from "../../getenvironment";
import {
  Container,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Flex,
} from '@chakra-ui/react';
import { Button } from "@chakra-ui/button";
import { useToast } from "@chakra-ui/react";
import Header from "../../components/header";

const EventRegistration = () => {
  const toast = useToast();
  const apiUrl = getEnvironment();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [cmUsers, setCmUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ExpiryDate: '',
    plan: 'basic', // default plan
    user: '', // manually entered user
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/user/getuser/all`, { credentials: 'include' });
        const data = await response.json();
        setUsers(data.user); // Set all users to the state
        const cmUsers = data.user.filter(user => user.role.includes('CM'));
        setCmUsers(cmUsers); // Set CM users to the state
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [apiUrl]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = selectedUser || formData.user;
    try {
      const response = await fetch(`${apiUrl}/certificatemodule/addevent/assignEvent/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const responseData = await response.json();
        toast({
          title: "Event Assigned",
          description: "Event successfully assigned to the user",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setIsModalOpen(false);
        setFormData({
          name: '',
          ExpiryDate: '',
          plan: 'basic',
          user: '',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Error assigning event",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
        console.error('Error submitting form:', response.statusText);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error submitting form",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      console.error('Error submitting form:', error);
    }
  };

  const handleOpenModal = (userId) => {
    setSelectedUser(userId);
    setIsModalOpen(true);
  };

  const handleOpenModalForNewUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleViewEvents = (userId) => {
    navigate(`/cm/userevents/${userId}`);
  };

  const handleViewUserLogos = (userId) => {
    navigate(`/cm/userimages/logos/${userId}`);
  };

  const handleViewUserSignatures = (userId) => {
    navigate(`/cm/userimages/signatures/${userId}`);
  };

  return (
    <Container maxW="lg">
      <Header title="Add Event for Certificate Module" />

      <Flex justify="flex-end" mb="4">
        <Button onClick={handleOpenModalForNewUser} colorScheme="teal">
          Assign Event
        </Button>
      </Flex>

      <Flex justify="center">
        <Table variant="simple" mt="6">
          <Thead>
            <Tr>
              <Th>Email</Th>
              <Th>View Logos</Th>
              <Th>View Signatures</Th>
              <Th>All Events</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {cmUsers.map((user) => (
              <Tr key={user._id}>
                <Td>{user.email}</Td>
                <Td>
                  <Button onClick={() => handleViewUserLogos(user._id)}>View Logos</Button>
                </Td>
                <Td>
                  <Button onClick={() => handleViewUserSignatures(user._id)}>View Signatures</Button>
                </Td>
                <Td>
                  <Button onClick={() => handleViewEvents(user._id)}>All Events</Button>
                </Td>
                <Td>
                  <Button onClick={() => handleOpenModal(user._id)}>Assign Event</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Flex>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Event</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              {!selectedUser && (
                <FormControl mb="4">
                  <FormLabel>User</FormLabel>
                  <Select
                    name="user"
                    value={formData.user}
                    onChange={handleChange}
                    placeholder="Select user email"
                  >
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.email}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl mb="4">
                <FormLabel>Event Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl mb="4">
                <FormLabel>Event Date</FormLabel>
                <Input
                  type="date"
                  name="ExpiryDate"
                  value={formData.ExpiryDate}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl mb="4">
                <FormLabel>Plan</FormLabel>
                <Select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </Select>
              </FormControl>
            </form>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSubmit}>Submit</Button>
            <Button onClick={handleCloseModal} ml={3}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default EventRegistration;
