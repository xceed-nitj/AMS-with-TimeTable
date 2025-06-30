import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Select,
  Button,
  VStack,
  HStack,
  Container,
  useToast,
  Spinner,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
} from '@chakra-ui/react';
import { WarningIcon} from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

function ImportTT() {
  const [fromSession, setFromSession] = useState('');
  const [toSession, setToSession] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = getEnvironment();
  const toast = useToast();

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const currentCode = parts[parts.length - 2];

  useEffect(() => {
    fetchSessions();
    fetchTTData(currentCode);
  }, []);

  const fetchTTData = async (code) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/timetable/alldetails/${code}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      const data = await response.json();
      console.log('data', data);

      setSelectedDept(data.dept); // dept is a string
      setToSession(data.session); // session is a string

      console.log('data', selectedDept);
    } catch (error) {
      console.error('Error fetching timetable data:', error);
      toast({
        title: 'Failed to load data.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/allotment/session`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDept || !fromSession || !toSession) {
      toast({
        title: 'All fields are required.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/import/ttdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dept: selectedDept, fromSession, toSession }),
      });

      if (response.ok) {
        toast({
          title: 'Time Table Imported',
          description: 'Go back to the allotment page.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'bottom',
        });
        onClose();
      } else {
        const errData = await response.json();
        toast({
          title: 'Import failed',
          description: errData.message || 'Something went wrong.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: 'Server error',
        description: 'Could not complete the request.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    setSubmitting(false);
  };

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleImportClick = (e) => {
    e.preventDefault();
    if (!selectedDept || !fromSession || !toSession) {
      toast({
        title: 'All fields are required.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    // Open confirmation modal
    onOpen();
  };

  const confirmImport = () => {
    handleSubmit({ preventDefault: () => {} });
  };

  const cancelImport = () => {
    // Show info toast when cancelled
    toast({
      title: 'Import Cancelled',
      description: 'Your existing timetable remains unchanged.',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'bottom',
    });

    onClose();
  };

  return (
    <Container maxW="5xl">
      <Header title="Import Time Table from Previous Sessions" />
      {loading ? (
        <VStack py={10}>
          <Spinner size="xl" />
          <Text>Loading timetable data...</Text>
        </VStack>
      ) : (
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isDisabled>
              <FormLabel>Department</FormLabel>
              <Select value={selectedDept} isReadOnly>
                <option value={selectedDept}>{selectedDept}</option>
              </Select>
            </FormControl>

            <FormControl id="fromSession" isRequired>
              <FormLabel>From Session</FormLabel>
              <Select
                value={fromSession}
                onChange={(e) => setFromSession(e.target.value)}
                placeholder="Select a Session"
              >
                {sessions.map((session, index) => (
                  <option key={index} value={session}>
                    {session}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="toSession" isDisabled>
              <FormLabel>To Session</FormLabel>
              <Select
                value={toSession}
                onChange={(e) => setToSession(e.target.value)}
                placeholder="Select a Session"
              >
                {sessions.map((session, index) => (
                  <option key={index} value={session}>
                    {session}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              onClick={handleImportClick}
              isLoading={submitting}
            >
              Submit
            </Button>
            <Modal isOpen={isOpen} onClose={cancelImport} isCentered size="md">
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>
                  <HStack spacing={3}>
                    <Icon as={WarningIcon} color="orange.500" boxSize={6} />
                    <Text>Confirm Timetable Import</Text>
                  </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  Existing Timetable will be deleted and selected session
                  Timetable will be imported.
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={confirmImport}>
                    Yes, Import Timetable
                  </Button>
                  <Button variant="ghost" onClick={cancelImport}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </VStack>
        </form>
      )}
    </Container>
  );
}

export default ImportTT;
