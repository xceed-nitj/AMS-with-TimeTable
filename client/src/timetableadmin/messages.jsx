// import { Container, VStack } from '@chakra-ui/react';
// import React from 'react';/
import React, { useState, useEffect } from 'react';
import {
  Button,
  VStack,
  Input,
  Heading,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Textarea,
  Tr,
  Th,
  Td,
  Container,
  Select,
  Box,
  Text,
} from '@chakra-ui/react';
// import { Flex, Link as ChakraLink } from '@chakra-ui/react';
// import { Link } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import Header from '../components/header';
// import { CKEditor } from '@ckeditor/ckeditor5-react';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// import {
//   CustomTh,
//   CustomLink,
//   CustomBlueButton,
//   CustomDeleteButton,
//   CustomTealButton,
// } from "../styles/customStyles";

const Messages = () => {
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const apiUrl = getEnvironment();
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);

  const deleteNotification = async (messageId) => {
    try {
      const condirmDeleteNotify = window.confirm(
        'Are you sure you want to delete this message?'
      );
      if (!condirmDeleteNotify) {
        return; // Exit if the user cancels the confirmation
      }
      const response = await fetch(
        `${apiUrl}/timetablemodule/message/delete/${messageId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched messages data:', data); // Log the fetched data
        setMessages(messages.filter((message) => message._id !== messageId));
        console.log('Fetched messages:', messages); // Log the fetched messages
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/timetablemodule/message/myMessages`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched messages data:', data); // Log the fetched data
        setMessages(data.data.messages || []);
        console.log('Fetched messages:', messages);
        setUser(data.user); // Log the fetched messages
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageTitle.trim() || !messageContent.trim()) {
      alert('Title and content cannot be empty.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/timetablemodule/message/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: messageTitle,
          content: messageContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      alert('Message sent successfully.');
      setMessageTitle('');
      setMessageContent('');
      fetchMessages(); // Refresh the messages list
    } catch (error) {
      console.error('Error sending message:', error.message);
      alert('Something went wrong.');
    }
  };

  return (
    <div>
      <VStack>
        <Container maxW="5xl">
          <Header title="Messages" />
          <Heading textAlign="center" mt={10} mb={4}>
            Send Message to Dept. TT Coordinators
          </Heading>
          {(user?.role?.includes('ITTC')|| user?.role?.includes('admin')) ? (<form onSubmit={handleSendMessage}>
            <VStack spacing={3} align="start">
              <Input
                type="text"
                placeholder="Enter message title"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
              />

              <Box
                width="100%"
                border="1px solid #CBD5E0"
                borderRadius="md"
                p={2}
              >
                <ReactQuill
                  theme="snow"
                  value={messageContent}
                  onChange={setMessageContent}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['clean'],
                      [{ align: [] }],
                      [{ color: [] }, { background: [] }],
                      [{ font: [] }, { size: [] }],
                    ],
                  }}
                  formats={[
                    'bold',
                    'italic',
                    'underline',
                    'list',
                    'bullet',
                    'align',
                    'color',
                    'background',
                    'font',
                    'size',
                  ]}
                />
                <Text fontSize="sm" color="red.500" mt={2}>
                  *Editing the message is not possible once sent
                </Text>
              </Box>

              <Button type="submit" colorScheme="blue">
                Send Message
              </Button>

              
            </VStack>
          </form>):(<Text fontSize="lg" color="red.500" mt={2}>
            *Only ITTC can send messages to DTTI
          </Text>)}
          
          {user?.role?.includes('admin') && (
                <VStack>
                  <Heading textAlign="center" mt={10} mb={4}>
                    Delete Messages
                  </Heading>

                  <TableContainer>
                    <Table variant="simple" size="md">
                      <Thead>
                        <Tr>
                          <Th>Message</Th>
                          <Th>Time</Th>
                          <Th>Delete message</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {messages.map((message, index) => (
                          <Tr
                            key={index}
                            _hover={{ backgroundColor: 'gray.100' }}
                          >
                            <Td
                              whiteSpace="normal"
                              wordBreak="break-word"
                              maxW="400px"
                            >
                              {message.title}
                            </Td>
                            <Td whiteSpace="nowrap">
                              {new Date(message.createdAt).toLocaleString()}
                            </Td>
                            <Td>
                              <Button
                                colorScheme="red"
                                size="sm"
                                onClick={() => deleteNotification(message._id)}
                              >
                                Delete
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </VStack>
              )}
        </Container>
      </VStack>
    </div>
  );
};

export default Messages;
