import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiArrowLeft, FiMail, FiUserPlus } from 'react-icons/fi';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

const ROLE_GROUPS = [
  {
    group: 'Platform',
    roles: [
      { value: 'admin', label: 'XCEED Admin' },
      { value: 'EO', label: 'Event Organiser' },
      { value: 'CM', label: 'Event Certificate Manager' },
      { value: 'PRM', label: 'Paper Review Manager' },
    ],
  },
  {
    group: 'Time Table',
    roles: [
      { value: 'ITTC', label: 'Institute Time Table Coordinator' },
      { value: 'DTTI', label: 'Department Time Table Coordinator' },
    ],
  },
  {
    group: 'Attendance (iLEED)',
    roles: [
      { value: 'iams-admin', label: 'iLEED Admin' },
      { value: 'iams-dept-admin', label: 'iLEED Department Admin' },
    ],
  },
  {
    group: 'Diabetics Module',
    roles: [
      { value: 'dm-admin', label: 'Admin' },
      { value: 'doctor', label: 'Doctor' },
      { value: 'patient', label: 'Patient' },
    ],
  },
];

const initialForm = {
  email: '',
  password: '',
  confirmPassword: '',
  dept: '',
  roles: [],
};

const RegistrationForm = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentError, setDepartmentError] = useState('');

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const subColor = useColorModeValue('gray.600', 'gray.400');
  const groupColor = useColorModeValue('gray.500', 'gray.400');
  const iconBg = useColorModeValue('teal.50', 'teal.900');
  const iconColor = useColorModeValue('teal.600', 'teal.300');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`,
          { credentials: 'include' },
        );
        if (!response.ok) throw new Error('Failed to load departments');
        const data = await response.json();
        const unique = Array.from(
          new Set((data.uniqueDept || []).map((d) => d?.trim()).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));
        if (!cancelled) {
          setDepartments(unique);
          setDepartmentError(unique.length ? '' : 'No departments found in the timetable.');
        }
      } catch (err) {
        if (!cancelled) setDepartmentError(err.message);
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const toggleRole = (role, checked) =>
    setFormData((prev) => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter((r) => r !== role),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password should be a minimum of 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.roles.length === 0) {
      setError('Select at least one role.');
      return;
    }
    if (formData.roles.includes('iams-dept-admin') && !formData.dept) {
      setError('Department is required for an iLEED Department Admin.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email: formData.email.trim() }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      setCreatedEmail(formData.email.trim());
      toast({ title: 'User created', status: 'success', duration: 4000, isClosable: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setCreatedEmail('');
    setError('');
  };

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 10 }}>
      <Container maxW="2xl">
        {/* Header */}
        <Flex align="center" gap={4} mb={8}>
          <IconButton
            aria-label="Go back"
            icon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => navigate(-1)}
          />
          <Flex align="center" justify="center" boxSize={12} borderRadius="lg" bg={iconBg} color={iconColor}>
            <Icon as={FiUserPlus} boxSize={6} />
          </Flex>
          <Box>
            <Heading as="h1" size="lg">
              Create New User
            </Heading>
            <Text color={subColor} fontSize="sm">
              The user receives a welcome email with a link to set their own password.
            </Text>
          </Box>
        </Flex>

        {createdEmail ? (
          /* Success state */
          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={8} textAlign="center">
            <Flex align="center" justify="center" boxSize={14} borderRadius="full" bg={iconBg} color={iconColor} mx="auto" mb={4}>
              <Icon as={FiMail} boxSize={7} />
            </Flex>
            <Heading as="h2" size="md" mb={2}>
              User created
            </Heading>
            <Text color={subColor} mb={6}>
              An account for <strong>{createdEmail}</strong> has been created. A welcome
              email with a password-setup link is on its way to them.
            </Text>
            <Flex justify="center" gap={3} wrap="wrap">
              <Button colorScheme="teal" onClick={resetForm}>
                Create Another User
              </Button>
              <Button variant="outline" onClick={() => navigate('/usermanagement')}>
                Go to User Management
              </Button>
            </Flex>
          </Box>
        ) : (
          /* Form */
          <Box
            as="form"
            onSubmit={handleSubmit}
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="xl"
            p={{ base: 5, md: 8 }}
          >
            {error && (
              <Alert status="error" borderRadius="md" fontSize="sm" mb={5}>
                <AlertIcon />
                {error}
              </Alert>
            )}

            <FormControl isRequired mb={4}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                placeholder="user@nitj.ac.in"
                value={formData.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setField('password', e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl mb={6} isRequired={formData.roles.includes('iams-dept-admin')}>
              <FormLabel>Department</FormLabel>
              <Select
                value={formData.dept}
                onChange={(e) => setField('dept', e.target.value)}
                placeholder={departmentsLoading ? 'Loading departments…' : 'No department selected'}
                isDisabled={departmentsLoading || Boolean(departmentError)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                {departmentError ||
                  'Optional — required only for the iLEED Department Admin role.'}
              </FormHelperText>
            </FormControl>

            <Divider mb={5} />

            <FormLabel mb={3}>Roles</FormLabel>
            {ROLE_GROUPS.map(({ group, roles }) => (
              <Box key={group} mb={4}>
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  color={groupColor}
                  mb={2}
                >
                  {group}
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={4} spacingY={2}>
                  {roles.map(({ value, label }) => (
                    <Checkbox
                      key={value}
                      colorScheme="teal"
                      isChecked={formData.roles.includes(value)}
                      onChange={(e) => toggleRole(value, e.target.checked)}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </Box>
            ))}

            <Button
              type="submit"
              colorScheme="teal"
              width="100%"
              mt={4}
              size="lg"
              leftIcon={<FiUserPlus />}
              isLoading={submitting}
            >
              Create User
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default RegistrationForm;
