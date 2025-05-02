import React, { useEffect, useState } from "react";
import {
  Container,
  Heading,
  Box,
  VStack,
  Text,
  Spinner,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/hooks";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import getEnvironment from "../getenvironment";

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = getEnvironment();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();


  useEffect(() => {
    fetchMessages();
  }, []); // Fetch messages when the component mounts or when selectedMessage changes

const messageRead = async (messageId) => {
  try {
    const response = await fetch(`${apiUrl}/timetablemodule/message/readMessage/${messageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    if (response.ok) {
      const data = await response.json();
      console.log("Fetched messages data:", data); 
    //  
      setLoading(false); 
      
    } else {
      console.error("Failed to fetch messages");
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
};
const handleMessageClick = (index) => {
    // Handle the message click event here
    console.log("Message clicked:", messages[index]);
    setSelectedMessage(messages[index]);
    onOpen(); 
    messageRead(messages[index]._id); // Mark the message as read


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
        console.log("Fetched messages data:", data); // Log the fetched data
        setMessages(data.data || []);
        setLoading(false); // Set loading to false after fetching messages
        // console.log("Fetched messages:", messages); // Log the fetched messages
      } else {
        console.error("Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  return (
    <VStack spacing={6} align="stretch">
      <Container maxW="5xl">
        <Header title="Messages from Institute Timetable Coordinator" />

        <Heading size="lg" my={4} textAlign="center">
          All Messages
        </Heading>

        {loading ? (
          <Spinner size="xl" thickness="4px" color="teal.500" speed="0.65s" />
        ) : (
          messages?.map((msg, index) => (
            <Box
              key={index}
              borderWidth="1px"
              borderRadius="lg"
              boxShadow="md"
              p={4}
              mb={4}
              display={"flex "}
              justifyContent={"space-between"}
              onClick={()=>handleMessageClick(index)}
              cursor="pointer"
              overflowX={"auto"}
              _hover={{ bg: "gray.100" }}
              transition="background-color 0.3s ease" // Change background color on hover
            >
              <Text display={"flex"} flexWrap={"wrap"}  alignItems={"center"} fontSize="xl" fontWeight="bold" color="teal.600">
                {`${msg.title.substring(0, 50)}${msg.title.length > 50 ? "..." : ""}`}
                
                
              </Text>
              {/* <Divider my={2} /> */}
             
              
              <Text mt={2} fontSize="sm" color="gray.500" textAlign="right">
                {new Date(msg.createdAt).toLocaleString()}
              </Text>
            </Box>
            
            
          ))
        )}
        <Modal  isOpen={isOpen} onClose={onClose} isCentered size={"xl"} >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedMessage?.title}</ModalHeader>
          <ModalCloseButton color={'black'} />
          <ModalBody overscrollY={"auto"} maxH="70vh" overflowY="auto">
            <Text dangerouslySetInnerHTML={{ __html: selectedMessage?.content }} whiteSpace="pre-wrap"></Text>
          </ModalBody>
        </ModalContent>
      </Modal>
      </Container>
    </VStack>
  );
};

export default MessagesPage;
