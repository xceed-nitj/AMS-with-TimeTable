import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import axios from 'axios';
import JoditEditor from 'jodit-react';

import {
  Container,
  Box,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { CheckIcon } from '@chakra-ui/icons';
import Header from "../../components/header";

function AddTemplate() {
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [templates, setTemplates] = useState({
    paperSubmission: 'Default paper submission template',
    reviewerInvitation: 'Default reviewer invitation template',
    paperAssignment: 'Default paper assignment template',
    reviewSubmission: 'Default review submission template',
    paperRevision: 'Default paper revision template',
    paperDecision: 'Default paper decision template',
  });
  const toast = useToast();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reviewmodule/event/getEvents/${eventId}`);
       if (response.data.templates)
        {
        setTemplates(response.data.templates);
        }
        console.log(response.data.templates)
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates({
          paperSubmission: '',
          reviewerInvitation: '',
          paperAssignment: '',
          reviewSubmission: '',
          paperRevision: '',
          paperDecision: '',
        });
      }
    };

    fetchTemplates();
  }, [apiUrl, eventId]);

  const handleTemplateChange = (field, value) => {
    setTemplates(prevTemplates => ({
      ...prevTemplates,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const eventData = {
        templates: templates,
      };

      const response = await axios.patch(`${apiUrl}/reviewmodule/event/${eventId}`, eventData);

      if (response.status) {
        toast({
          title: 'Event saved successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      } else {
        toast({
          title: 'Error saving event',
          description: 'Please try again later',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error saving event',
        description: error.response?.data || 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  return (
    <Container>
      <Header title="Add Template Details"></Header>
      <Box maxW="xl" mx="auto" mt={10}>
        <Tabs>
        <TabList>
  {Object.keys(templates).map((key) => (
    <Tab key={key}>{key}</Tab>
  ))}
</TabList>

          <TabPanels>
            {Object.keys(templates).map((key) => (
              <TabPanel key={key}>
                <Box mb={20}>
                  <JoditEditor
                    value={templates[key]}
                    onChange={(newContent) => handleTemplateChange(key, newContent)}
                  />
                </Box>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
        <Button colorScheme="teal" leftIcon={<CheckIcon />} onClick={handleSave}>
          Save Event
        </Button>
      </Box>
    </Container>
  );
}

export default AddTemplate;
