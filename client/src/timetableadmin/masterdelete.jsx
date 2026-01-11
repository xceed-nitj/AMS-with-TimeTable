import React, { useState } from "react";
import {
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Container,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Box,
  Heading,
  Badge,
  IconButton,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  List,
  ListItem,
  ListIcon,
  Divider,
  Table,
  Tbody,
  Tr,
  Td,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { 
  WarningIcon, 
  ArrowBackIcon,
  DeleteIcon,
} from '@chakra-ui/icons';
import getEnvironment from "../getenvironment";
import Header from '../components/header';

function Del() {
  const [code, setCode] = useState('');
  const [isInputValid, setIsInputValid] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedTableLabel, setSelectedTableLabel] = useState('');
  
  const apiUrl = getEnvironment();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleInputChange = (e) => {
    const input = e.target.value;
    setCode(input);
    setIsInputValid(input.trim().length > 0);
  };

  const handleDeleteClick = (tableName, tableLabel) => {
    if (!isInputValid) {
      toast({
        title: 'Code required',
        description: 'Please enter a valid code.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }
    setSelectedTable(tableName);
    setSelectedTableLabel(tableLabel);
    onOpen();
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/${selectedTable}/deletebycode/${code}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast({
          title: 'Delete Successful',
          description: `Deleted entries with code '${code}' from ${selectedTableLabel}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
        });
        onClose();
        setCode('');
        setIsInputValid(false);
      } else {
        throw new Error('Delete request failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete entries. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  const cancelDelete = () => {
    toast({
      title: 'Delete Cancelled',
      description: 'No changes have been made.',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'bottom',
    });
    onClose();
  };

  const deleteOptions = [
    { table: 'subject', label: 'Subject Data', description: 'All subject entries for this code' },
    { table: 'addsem', label: 'Semester Data', description: 'All semester entries for this code' },
    { table: 'addfaculty', label: 'Faculty Data', description: 'All faculty entries for this code' },
    { table: 'addroom', label: 'Room Data', description: 'All room entries for this code' },
    { table: 'tt', label: 'Class Table', description: 'Complete timetable for this code' },
    { table: 'lock', label: 'Locked Time Table', description: 'Locked timetable entries for this code' },
    { table: 'timetable', label: 'Session', description: 'Entire session for this code' },
  ];

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header Section */}
      <Box
        bgGradient="linear(to-r, cyan.400, teal.500, green.500)"
        pt={0}
        pb={24}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.1"
          bgImage="radial-gradient(circle, white 1px, transparent 1px)"
          bgSize="30px 30px"
        />

        <Box
          position="relative"
          zIndex={2}
          sx={{
            '& button[aria-label="Go back"]': { display: 'none' },
            '& .chakra-button:first-of-type': { display: 'none' },
          }}
        >
          <Header />
        </Box>

        <Container maxW="7xl" position="relative" mt={8}>
          <Flex justify="space-between" align="center" w="full" gap={4}>
            <VStack spacing={4} align="start" flex="1">
              <Badge
                colorScheme="whiteAlpha"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                Delete Entries
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Delete Data by Code
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Remove specific entries from the database using their unique code identifier.
              </Text>
            </VStack>

            <IconButton
              icon={<ArrowBackIcon />}
              aria-label="Go back"
              onClick={() => window.history.back()}
              size="lg"
              bg="rgba(255, 255, 255, 0.2)"
              color="white"
              fontSize="2xl"
              _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
              _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
              borderRadius="full"
              boxShadow="lg"
              border="2px solid"
              borderColor="whiteAlpha.400"
              flexShrink={0}
            />
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16}>
        <VStack spacing={6} align="stretch">
          {/* Important Information Alert */}
          <Alert status="error" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="md" mb={1}>⚠️ Dangerous Operation</AlertTitle>
              <AlertDescription fontSize="sm">
                Deleting entries is <strong>IRREVERSIBLE</strong>. All data associated with the code will be permanently removed. 
                Please ensure you have backups before proceeding.
              </AlertDescription>
            </Box>
          </Alert>

          {/* Code Input Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="red.600" color="white" p={4}>
              <Heading size="md">Enter Code</Heading>
            </CardHeader>
            <CardBody p={6}>
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" color="gray.700">
                  Code *
                </FormLabel>
                <Input
                  type="text"
                  value={code}
                  onChange={handleInputChange}
                  placeholder="Enter the code to delete"
                  size="lg"
                  borderColor={isInputValid ? 'green.300' : 'red.300'}
                  _hover={{ borderColor: isInputValid ? 'green.400' : 'red.400' }}
                  _focus={{ 
                    borderColor: isInputValid ? 'green.500' : 'red.500', 
                    boxShadow: isInputValid ? '0 0 0 1px #38A169' : '0 0 0 1px #E53E3E' 
                  }}
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {isInputValid 
                    ? '✓ Code is valid - you can now delete entries' 
                    : 'Enter a code to enable delete operations'}
                </Text>
              </FormControl>
            </CardBody>
          </Card>

          {/* Delete Options Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="1px"
            borderColor="gray.300"
            overflow="hidden"
          >
            <CardHeader bg="purple.600" color="white" p={4}>
              <Heading size="md">Select Data to Delete</Heading>
            </CardHeader>
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box fontSize="sm">
                    <Text fontWeight="bold">Choose which data type to delete for code: {code || '(not entered)'}</Text>
                  </Box>
                </Alert>

                <Table variant="simple">
                  <Tbody>
                    {deleteOptions.map((option, index) => (
                      <Tr key={index} _hover={{ bg: 'gray.50' }}>
                        <Td borderColor="gray.200">
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold" color="gray.700">
                              Delete {option.label}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {option.description}
                            </Text>
                          </VStack>
                        </Td>
                        <Td borderColor="gray.200" textAlign="right">
                          <Button
                            leftIcon={<DeleteIcon />}
                            colorScheme="red"
                            variant="solid"
                            size="md"
                            onClick={() => handleDeleteClick(option.table, option.label)}
                            isDisabled={!isInputValid}
                            _disabled={{
                              opacity: 0.4,
                              cursor: 'not-allowed',
                            }}
                          >
                            Delete
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                <Divider />

                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box fontSize="sm">
                    <AlertTitle fontSize="sm" mb={1}>Important Notes:</AlertTitle>
                    <AlertDescription>
                      • All delete operations are permanent and cannot be undone
                      <br />
                      • Deleting session data may affect related timetables
                      <br />
                      • Locked timetables should be deleted with caution
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Enhanced Warning Modal */}
      <Modal isOpen={isOpen} onClose={cancelDelete} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" zIndex={1400} />
        <ModalContent zIndex={1400}>
          <ModalHeader bg="red.600" color="white" borderTopRadius="md">
            <HStack spacing={3}>
              <Icon as={WarningIcon} boxSize={6} />
              <Text>⚠️ Confirm Deletion</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6}>
            <VStack spacing={4} align="stretch">
              {/* Critical Warning */}
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="md">Critical Action - Data Loss Warning!</AlertTitle>
                  <AlertDescription fontSize="sm">
                    This action is <strong>PERMANENT</strong> and cannot be undone!
                  </AlertDescription>
                </Box>
              </Alert>

              {/* What Will Happen */}
              <Box p={4} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
                <Text fontWeight="bold" color="red.800" mb={2}>
                  ❌ What will be DELETED:
                </Text>
                <List spacing={2} ml={4} color="red.700" fontSize="sm">
                  <ListItem>
                    <ListIcon as={WarningIcon} color="red.500" />
                    All {selectedTableLabel.toLowerCase()} entries for code: <strong>{code}</strong>
                  </ListItem>
                  <ListItem>
                    <ListIcon as={WarningIcon} color="red.500" />
                    Related associations and dependencies
                  </ListItem>
                  <ListItem>
                    <ListIcon as={WarningIcon} color="red.500" />
                    This data cannot be recovered
                  </ListItem>
                </List>
              </Box>

              {/* Confirmation Summary */}
              <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                <Text fontWeight="bold" color="blue.800" mb={2}>
                  📋 Delete Summary:
                </Text>
                <VStack align="stretch" spacing={1} fontSize="sm" color="blue.700">
                  <HStack justify="space-between">
                    <Text>Code:</Text>
                    <Text fontWeight="bold">{code}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Data Type:</Text>
                    <Text fontWeight="bold">{selectedTableLabel}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Table:</Text>
                    <Text fontWeight="bold">{selectedTable}</Text>
                  </HStack>
                </VStack>
              </Box>

              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box fontSize="sm">
                  <AlertDescription>
                    Type "DELETE" in uppercase to confirm this action, or click "Cancel" to abort.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={cancelDelete}>
                Cancel - Keep Data
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDelete}
                leftIcon={<DeleteIcon />}
              >
                Yes, Delete Permanently
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Del;