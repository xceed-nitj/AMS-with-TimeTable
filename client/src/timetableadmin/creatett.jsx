import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../getenvironment";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormLabel, Heading, Input, Select ,useDisclosure} from '@chakra-ui/react';
import {CustomTh, CustomLink,CustomBlueButton} from '../styles/customStyles'
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,

  Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";
import { Center, Square, Circle } from '@chakra-ui/react'
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  IconButton,
  
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Box
} from "@chakra-ui/react";
import { FaGlobe } from "react-icons/fa";


function CreateTimetable() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    session: "",
    code: "",
  });
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [apiUrl] = useState(getEnvironment());
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currUser, setCurrUser] = useState(null);
  const [unReadCount,setUnreadCount] = useState(0);

  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  // const fetchMessages = async () => {
  //   try {
  //     const response = await fetch(`${apiUrl}/timetablemodule/message/myMessages`, {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include"
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log("Fetched messages data:", data); // Log the fetched data
  //       setMessages(data.data.messages || []);
  //       setCurrUser(data.user);
        
  //       console.log("Fetched messages:", messages); // Log the fetched messages
  //     } else {
  //       console.error("Failed to fetch messages");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching messages:", error);
  //   }
  // };
const fetchMessages = async () => {
  try {
    const res = await fetch(
      `${apiUrl}/timetablemodule/message/myMessages`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error("Failed to fetch messages");

    const json = await res.json();
    const msgs = Array.isArray(json.data.messages) ? json.data.messages : [];
    const user = json.user || {};

   
    const unread = msgs.filter(m => {
      if (!Array.isArray(m.readBy) || m.readBy.length === 0) {
        // nobody has read it yet
        return true;
      }
      
      const hasRead = m.readBy.some(entry => entry.user === user._id);
      return !hasRead;
    }).length;

    setMessages(msgs);
    setCurrUser(user);
    setUnreadCount(unread);

    console.log("Fetched", msgs.length, "messages for user", user._id);
    console.log("Computed unread count:", unread);
  } catch (err) {
    console.error("Error in fetchMessages:", err);
  }
};



  useEffect(() => {
    fetchMessages();
  }, []);
  
  // useEffect(() => {
  //   if (!currUser?._id) return;
  //   const userId = currUser?._id;
  //       console.log("userId",userId);
  //       console.log("messages",messages);
  //       const unRead = messages.filter(msg => !msg.readBy.includes(userId));
  //       setUnreadCount(unRead.length);
  //       console.log("unReadCount",unRead.length);
  // }, [messages]);





  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/timetablemodule/allotment/session`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          credentials: 'include',
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
          
        } else {
          console.error("Failed to fetch sessions");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/mastersem/dept`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          console.error("Failed to fetch departments");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    // fetchMessages();
    fetchSessions();
    fetchDepartments();
  }, [apiUrl]);

 

  const fetchTimetables = async () => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTable(data);
      } else {
        console.error("Failed to fetch timetables");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const generatedLink = data.code;
        setGeneratedLink(generatedLink);
        setSubmitted(true);

        const redirectTo = `/tt/${generatedLink}`;
        navigate(redirectTo);
      } else {
        console.error("Error submitting the form");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const currentUrl = window.location.href;
  const urlParts = currentUrl.split("/");
  const domainName = urlParts[2];

  
  // console.log("unReadCount",unReadCount);

  return (
    <Container maxW='5xl'>
      
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

       <Heading as="h1" size="xl" mt="6" mb="6">
        Create Time Table
      </Heading>

       
        {/* <Menu>
          
          <MenuButton
            as={IconButton}
            icon={<FaGlobe />}
            variant="outline"
            colorScheme="teal"
            aria-label="Messages"
          />
          <MenuList maxH="200px" overflowY="auto" position="relative" >
            <MenuGroup  position="sticky" top="0" zIndex="1" title="Notifications" fontWeight="bold"/>
            <MenuDivider  />
            {messages.length === 0 ? (
              <MenuItem>No messages</MenuItem>
            ) : (
              messages.map((msg, idx) => (
                <MenuItem  key={idx}  onClick={() => { setSelectedMessage(msg); onOpen(); }}>
                  {(messages.length - idx)+"."+" " +msg.title}
                </MenuItem>
              ))
            )}
          </MenuList>
        </Menu> */}
        {/* <Button colorScheme="teal" onClick={() => navigate("/tt/viewmessages")}>View Messages</Button> */}

        <Box position="relative" display="inline-block">
  <Button colorScheme="teal" onClick={() => navigate("/tt/viewmessages")}>
    View Messages
  </Button>
  {unReadCount > 0 && (
    <Box
      position="absolute"
      top="-1"
      right="-1"
      bg="red.500"
      color="white"
      borderRadius="full"
      px={2}
      fontSize="xs"
    >
      {unReadCount}
    </Box>
  )}
</Box>

      

      {/* Modal for selected message */}
      {/* <Modal  isOpen={isOpen} onClose={onClose} isCentered size={"xl"} >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedMessage?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text whiteSpace="pre-wrap">{selectedMessage?.content}</Text>
          </ModalBody>
        </ModalContent>
      </Modal> */}

      
       
       
       </div>


      <FormControl isRequired mb='3' >
      <FormLabel >Name of the Time Table Coordinator :</FormLabel>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Name"
            mb='2.5'
          />

          <FormLabel>Department:</FormLabel>
          <Select name="dept" value={formData.dept} onChange={handleInputChange} mb='2.5'>
            <option value="">Select a Department</option>
            {departments.map((department, index) => (
              <option key={index} value={department}>
                {department}
              </option>
            ))}
          </Select>

          <FormLabel>Session:</FormLabel>
          <Select
            name="session"
            value={formData.session}
            onChange={handleInputChange}
          >
            <option value="">Select a Session</option>
            {sessions.map((session, index) => (
              <option key={index} value={session}>
                {session}
              </option>
            ))}
          </Select>
          <CustomBlueButton type="submit" ml='0' width='200px' onClick={handleSubmit}>Submit</CustomBlueButton>
      
      </FormControl>


      <TableContainer>
        <p>Total Entries: {table.length}</p>
        <Table
        variant='striped'
        size="md" 
        mt="1"
        >
          <Thead>
            <Tr>
              <CustomTh>Timetable Name</CustomTh>
              <CustomTh>Session</CustomTh>
              <CustomTh>Department</CustomTh>
              <CustomTh>Link</CustomTh>
            </Tr>
          </Thead>
          <Tbody>
            {table.map((timetable) => (
              <Tr key={timetable._id}>
                <Td><Center>{timetable.name}</Center></Td>
                <Td><Center>{timetable.session}</Center></Td>
                <Td><Center>{timetable.dept}</Center></Td>
                <Td><Center>
                <CustomLink
                href={`http://${domainName}/tt/${timetable.code}`}
                target="_blank" // Optional: If you want to open the link in a new tab
              >
                {timetable.code}
              </CustomLink></Center>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {loading && <p>Loading...</p>}
    </Container>
  );
}

export default CreateTimetable;
