import React, { useEffect, useState } from "react";
import {
  Container,
  Heading,
  Box,
  VStack,
  Text,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Badge,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/hooks";
import { useNavigate } from "react-router-dom";
import { ArrowBackIcon, EmailIcon } from "@chakra-ui/icons";
import Header from "../components/header";
import getEnvironment from "../getenvironment";

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = getEnvironment();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const messageRead = async (messageId) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/message/readMessage/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Message marked as read:", data);
        // Refresh messages to update read status
        fetchMessages();
      } else {
        console.error("Failed to mark message as read");
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleMessageClick = (index) => {
    console.log("Message clicked:", messages[index]);
    setSelectedMessage(messages[index]);
    onOpen();
    messageRead(messages[index]._id);
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/message/myMessages`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched messages data:", data);
        setMessages(data.data.messages || []);
        setUser(data.user);
        setLoading(false);
      } else {
        console.error("Failed to fetch messages");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
    }
  };

  const isMessageRead = (msg) => {
    if (!user || !msg.readBy) return false;
    return msg.readBy.some((read) => read.user === user._id);
  };

  const unreadCount = messages.filter(msg => !isMessageRead(msg)).length;

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

        {/* Header/Navbar integrated into hero */}
        <Box
          position="relative"
          zIndex={2}
          sx={{
            '& button[aria-label="Go back"]': { display: "none" },
            '& .chakra-button:first-of-type': { display: "none" },
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
                Message Center
              </Badge>
              <Heading size="2xl" color="white" fontWeight="bold" lineHeight="1.2">
                Messages from Institute Coordinator
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                View all notifications and messages from the timetable coordinator.
              </Text>
            </VStack>

            {/* Back Button */}
            <IconButton
              icon={<ArrowBackIcon />}
              aria-label="Go back"
              onClick={() => window.history.back()}
              size="lg"
              bg="rgba(255, 255, 255, 0.2)"
              color="white"
              fontSize="2xl"
              _hover={{ bg: "rgba(255, 255, 255, 0.3)" }}
              _active={{ bg: "rgba(255, 255, 255, 0.4)" }}
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
        {/* Messages Card */}
        <Card
          bg="white"
          borderRadius="2xl"
          shadow="2xl"
          border="1px"
          borderColor="gray.300"
          overflow="hidden"
        >
          <CardHeader bg="purple.600" color="white" p={4}>
            <Flex justify="space-between" align="center">
              <Heading size="md">All Messages</Heading>
              <Flex gap={2}>
                {unreadCount > 0 && (
                  <Badge colorScheme="red" fontSize="md" px={3} py={1}>
                    {unreadCount} Unread
                  </Badge>
                )}
                <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                  {messages.length} Total
                </Badge>
              </Flex>
            </Flex>
          </CardHeader>
          <CardBody p={6}>
            {loading ? (
              <Flex justify="center" align="center" minH="300px">
                <VStack spacing={4}>
                  <Spinner
                    size="xl"
                    thickness="4px"
                    color="purple.500"
                    speed="0.65s"
                  />
                  <Text color="gray.600">Loading messages...</Text>
                </VStack>
              </Flex>
            ) : messages.length === 0 ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  No messages available at the moment.
                </AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={3} align="stretch">
                {messages.map((msg, index) => {
                  const isRead = isMessageRead(msg);
                  return (
                    <Box
                      key={index}
                      borderWidth={isRead ? "1px" : "2px"}
                      borderRadius="lg"
                      borderColor={isRead ? "gray.200" : "purple.400"}
                      bg={isRead ? "white" : "purple.50"}
                      p={4}
                      cursor="pointer"
                      onClick={() => handleMessageClick(index)}
                      _hover={{
                        bg: isRead ? "gray.50" : "purple.100",
                        transform: "translateY(-2px)",
                        boxShadow: "md",
                      }}
                      transition="all 0.2s"
                      position="relative"
                    >
                      <Flex justify="space-between" align="start" gap={4}>
                        <Flex gap={3} align="start" flex="1">
                          {/* Unread indicator icon */}
                          <Box
                            mt={1}
                            color={isRead ? "gray.400" : "purple.500"}
                            fontSize="xl"
                          >
                            <EmailIcon />
                          </Box>

                          <VStack align="start" spacing={1} flex="1">
                            <Flex align="center" gap={2} flexWrap="wrap">
                              <Text
                                fontSize="lg"
                                fontWeight={isRead ? "medium" : "bold"}
                                color={isRead ? "gray.700" : "purple.700"}
                                noOfLines={2}
                              >
                                {msg.title}
                              </Text>
                              {!isRead && (
                                <Badge colorScheme="purple" fontSize="xs">
                                  NEW
                                </Badge>
                              )}
                            </Flex>

                            {/* Message preview */}
                            <Text
                              fontSize="sm"
                              color="gray.600"
                              noOfLines={2}
                              dangerouslySetInnerHTML={{
                                __html: msg.content?.substring(0, 100) || ""
                              }}
                            />
                          </VStack>
                        </Flex>

                        {/* Date */}
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          whiteSpace="nowrap"
                          mt={1}
                        >
                          {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Message Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent maxH="70vh" maxW="900px">
          <ModalHeader
            bg="purple.600"
            color="white"
            borderTopRadius="md"
            pr={12}
          >
            {selectedMessage?.title}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={2} overflowY="auto">
            <VStack align="stretch" spacing={4}>
              {/* Message metadata */}
              <Flex justify="space-between" align="center" pb={3} borderBottom="1px" borderColor="gray.200">
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  Official Message
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  {selectedMessage?.createdAt &&
                    new Date(selectedMessage.createdAt).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                </Text>
              </Flex>

              {/* Message content */}
              <Box
                dangerouslySetInnerHTML={{ __html: selectedMessage?.content }}
                sx={{
                  '& p': { mb: 3 },
                  '& ul, & ol': { ml: 6, mb: 3 },
                  '& li': { mb: 1 },
                  '& h1, & h2, & h3': { fontWeight: 'bold', mb: 2 },
                  '& a': { color: 'purple.600', textDecoration: 'underline' },
                }}
              />
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MessagesPage;