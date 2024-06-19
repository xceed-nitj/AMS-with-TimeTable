import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button, Stack, Text, HStack, VStack, Box, Input, Icon, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogCloseButton } from '@chakra-ui/react';
import { FaUpload, FaTimes } from 'react-icons/fa';
import {Link} from 'react-router-dom'

function CodeDetails({ setNext, handleNext, handlePrevious }) {
  const [paper, setPaper] = useRecoilState(paperState);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setNext(!selectedFile);
  }, [selectedFile, setNext]);

  useEffect(() => {
    if (paper.codeUploads && paper.codeUploads.length > 0) {
      setSelectedFile(paper.codeUploads[0]);
    }
  }, [paper.codeUploads]);

  function handleChange(e) {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPaper({
      ...paper,
      codeUploads: file ? [file] : [],
    });
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setPaper({
      ...paper,
      codeUploads: [],
    });
  }

  const handleNextClick = () => {
    if (!selectedFile) {
      setIsDialogOpen(true); // Show the dialog if no file is chosen
    } else {
      handleNext(paper.codeUploads);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <VStack spacing={6} align="flex-start" width="100%">
      {/* <Text fontSize="2xl" fontWeight="bold" mb={4}>Code Upload</Text> */}
      <h1 className="tw-font-bold tw-text-xl tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 tw-width tw-w-fit tw-m-auto"
          style={{color:'transparent', backgroundClip: 'text', fontSize:'xx-large', paddingBottom:'10px'}} //matched the styling on the heading with tailwind button styling
        >Code Upload</h1>
      <Box borderWidth="1px" borderRadius="md" p={4} width="100%" bg="gray.50">
        <VStack spacing={4} align="flex-start" width="100%">
          <Button as="label" htmlFor="file-upload" colorScheme="blue" leftIcon={<Icon as={FaUpload} />} width="fit-content" cursor="pointer">
            Upload Code
          </Button>
          <Input
            id="file-upload"
            type="file"
            onChange={handleChange}
            display="none"
          />
          {selectedFile && (
            <HStack justifyContent="space-between" width="100%" p={2} bg="white" borderWidth="1px" borderRadius="md">
              <Text>{selectedFile.name}</Text>
              <Icon
                as={FaTimes}
                cursor="pointer"
                onClick={handleRemoveFile}
                color="red.500"
                _hover={{ color: 'red.700' }}
              />
            </HStack>
          )}
        </VStack>
      </Box>
      <HStack justifyContent="space-between" width="100%">
        {/* <Button onClick={handlePrevious}>Back</Button> */}
        {/* <Button onClick={handleNextClick} disabled={!selectedFile} colorScheme="blue">Next</Button> */}
        <Link
          onClick={handlePrevious}
          className="tw-m-auto tw-px-8 tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
        >Back</Link>
        <Link
          onClick={handleNextClick}
          disabled={!selectedFile}
          className="tw-m-auto tw-px-8 tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
        >Next</Link>
      </HStack>

      <AlertDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>No Code Uploaded</AlertDialogHeader>
          <AlertDialogBody>Please upload a code file before proceeding.</AlertDialogBody>
          <AlertDialogFooter>
            <Button colorScheme="blue" onClick={handleCloseDialog}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  );
}

export default CodeDetails;
