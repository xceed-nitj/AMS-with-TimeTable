  import React, { useState, useEffect } from "react";
  import axios from 'axios';
import { useNavigate, Link, useLinkClickHandler } from "react-router-dom";// Import Link for navigation
import getEnvironment from "../../getenvironment";
import Header from "../../components/header";
import { Container, useToast } from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
} from '@chakra-ui/react';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const apiUrl = getEnvironment();
  const toast = useToast();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const eventId = parts[parts.length - 4];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleAbstractChange = (e) => {
    setAbstract(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    console.log("pdffile is:",pdfFile.files[0].name);
    console.log("title is:",title);
    console.log("abstract is:",abstract);
    const formData = new FormData();
    formData.append('pdfFile', pdfFile.files[0],pdfFile.files[0].name);
    formData.append('title', title);
    formData.append('abstract', abstract);
    console.log("this is the form data: ",formData);

    try {
      const response = await axios.post(`${apiUrl}/reviewmodule/paper/addpaper/${eventId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response);
      toast({
        title: 'Upload successful.',
        description: response.data.message || 'Your file has been uploaded.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFile(null);
      setTitle('');
      setAbstract('');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed.',
        description: error.response?.data?.message || 'An error occurred during upload.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <Container maxW="container.xl" p={4}>
  <Header title="Paper Upload"></Header>
    <Box maxWidth="600px" margin="auto" mt={10}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel htmlFor="file">File</FormLabel>
            <Input type="file" id="pdfFile" name="pdfFile" onChange={handleFileChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="title">Title</FormLabel>
            <Input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter the title"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="abstract">Abstract</FormLabel>
            <Textarea
              id="abstract"
              name="abstract"
              value={abstract}
              onChange={handleAbstractChange}
              placeholder="Enter the abstract"
              resize="vertical"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Uploading"
            width="full"
          >
            Upload
          </Button>
        </VStack>
      </form>
    </Box>
  </Container>
  );
};

export default UploadForm;