import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Input,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiArrowLeft, FiShield, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

const DeptAdminAssignPage = () => {
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [departments, setDepartments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/attendance');
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const subColor = useColorModeValue('gray.600', 'gray.400');
  const iconBg = useColorModeValue('cyan.50', 'cyan.900');
  const iconColor = useColorModeValue('cyan.600', 'cyan.300');

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch(`${apiUrl}/user/getuser/dept-admins`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load department admins');
      setAdmins(data.users || []);
    } catch (err) {
      toast({ title: 'Could not load department admins', description: err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load departments');
        const data = await res.json();
        const unique = Array.from(
          new Set((data.uniqueDept || []).map((d) => d?.trim()).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));
        setDepartments(unique);
      } catch (err) {
        toast({ title: 'Could not load departments', description: err.message, status: 'error', duration: 5000, isClosable: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/user/getuser/assign-dept-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), dept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to assign role');
      toast({
        title: data.created ? 'User created and role assigned' : 'Role assigned',
        description: `${email.trim()} is now iLEED Department Admin for ${data.user?.dept || dept}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setEmail('');
      setDept('');
      fetchAdmins();
    } catch (err) {
      toast({ title: 'Assignment failed', description: err.message, status: 'error', duration: 6000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (user) => {
    setRemoving(user._id);
    try {
      const res = await fetch(`${apiUrl}/user/getuser/remove-dept-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove role');
      toast({ title: 'Role removed', status: 'success', duration: 4000, isClosable: true });
      fetchAdmins();
    } catch (err) {
      toast({ title: 'Could not remove role', description: err.message, status: 'error', duration: 6000, isClosable: true });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 8, md: 14 }}>
      <Container maxW="4xl">
        <Flex align="center" gap={4} mb={{ base: 6, md: 10 }} flexWrap="wrap">
          <Flex align="center" justify="center" boxSize={12} borderRadius="lg" bg={iconBg} color={iconColor}>
            <Icon as={FiShield} boxSize={6} />
          </Flex>
          <Box>
            <Heading as="h1" size="lg">
              iLEED Department Admins
            </Heading>
            <Text color={subColor}>
              Assign the department admin role by email — the account is created automatically if it doesn't exist.
            </Text>
          </Box>
          <Button
            leftIcon={<FiArrowLeft />}
            variant="outline"
            size="sm"
            ml="auto"
            onClick={goBack}
          >
            Back
          </Button>
        </Flex>

        <Box as="form" onSubmit={handleAssign} bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={6} mb={8}>
          <Flex gap={4} direction={{ base: 'column', md: 'row' }} align={{ md: 'flex-end' }}>
            <FormControl isRequired>
              <FormLabel>Email ID</FormLabel>
              <Input
                type="email"
                placeholder="faculty@nitj.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Department</FormLabel>
              <Select value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Select department">
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button
              type="submit"
              colorScheme="cyan"
              leftIcon={<FiUserPlus />}
              isLoading={submitting}
              px={8}
              flexShrink={0}
            >
              Assign
            </Button>
          </Flex>
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={6}>
          <Heading as="h2" size="md" mb={4}>
            Current Department Admins
          </Heading>
          {loadingAdmins ? (
            <Flex justify="center" py={8}>
              <Spinner />
            </Flex>
          ) : admins.length === 0 ? (
            <Text color={subColor}>No iLEED Department Admins assigned yet.</Text>
          ) : (
            <Box overflowX="auto">
              <Table size="md" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Email</Th>
                    <Th>Department</Th>
                    <Th width="1%">Remove</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {admins.map((user) => (
                    <Tr key={user._id}>
                      <Td>{Array.isArray(user.email) ? user.email.join(', ') : user.email}</Td>
                      <Td>{user.dept || '—'}</Td>
                      <Td>
                        <IconButton
                          aria-label="Remove department admin role"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          isLoading={removing === user._id}
                          onClick={() => handleRemove(user)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default DeptAdminAssignPage;
