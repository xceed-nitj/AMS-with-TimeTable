import React, { useState } from "react";
import { Container, Box, Input, Button } from "@chakra-ui/react";
import axios from "axios";
import getEnvironment from "../../getenvironment";
import { useToast } from "@chakra-ui/react";
import Header from "../../components/header";


function MultiEditorEvent() {
  const apiUrl = getEnvironment();
  const [eventName, setEventName] = useState("");
  const [editorEmail, setEditorEmail] = useState("");
  const [editorPassword, setEditorPassword] = useState("");
  const toast = useToast();

  const handleEditorPasswordChange = (e) => {
    setEditorPassword(e.target.value);
  };

  const handleEditorEmailChange = (e) => {
    setEditorEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Fetching event ID using event name
      // const eventResponse = await axios.get(
      //   `${apiUrl}/reviewmodule/event/name/${eventName}`
      // );
      // const eventId = eventResponse.data.eventId;
      const currentURL = window.location.pathname;
      const parts = currentURL.split("/");
      const eventId = parts[parts.length - 3];

      // // Fetching editor ID using editor email
      // const editorResponse = await axios.get(
      //   `${apiUrl}/reviewmodule/event/getEditorId/${editorEmail}`
      // );
      // const editorId = editorResponse.data.editorId;

      // Adding editor to the event
      const addEditorResponse = await axios.post(
        `${apiUrl}/reviewmodule/event/addEditor/${eventId}`,
        { email: editorEmail, password: editorPassword}
      );

      if (addEditorResponse.status === 200) {
        toast({
          title: "Editor added successfully",
          status: "success",
          duration: 6000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Error adding Editor",
          description: "Please try again later",
          status: "error",
          duration: 6000,
          isClosable: true,
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error adding Editor",
        description: "Please try again later",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <Container>
        <Header title="Add Additional Editor to the event"></Header>

      <Box maxW="md" mx="auto" mt={10}>
        <form onSubmit={handleSubmit}>
          {/* <Input
            mb={4}
            type="text"
            placeholder="Enter event name"
            value={eventName}
            onChange={handleEventNameChange}
          /> */}
          <Input
            mb={4}
            type="email"
            placeholder="Enter editor email to add to event "
            value={editorEmail}
            onChange={handleEditorEmailChange}
          />
          <Input
            mb={4}
            type="password"
            placeholder="Enter editor password to add to event "
            value={editorPassword}
            onChange={handleEditorPasswordChange}
          />
          <Button type="submit" colorScheme="teal">
            Save
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default MultiEditorEvent;
