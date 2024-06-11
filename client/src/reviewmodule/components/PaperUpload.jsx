import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button, Stack, Text, HStack, VStack, Box, Input, Icon, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogCloseButton } from '@chakra-ui/react';
import { FaUpload, FaTimes } from 'react-icons/fa';

function PaperUpload({ setNext, handleNext, handlePrevious }) {
  const [paper, setPaper] = useRecoilState(paperState);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setNext(selectedFiles.length === 0);
  }, [selectedFiles, setNext]);

  useEffect(() => {
    if (paper.paperUploads && paper.paperUploads.length > 0) {
      setSelectedFiles(paper.paperUploads);
    }
  }, [paper.paperUploads]);

  function handleChange(e) {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
    setPaper({
      ...paper,
      paperUploads: [...selectedFiles, ...files],
    });
  }

  function handleRemove(index) {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
    setPaper({
      ...paper,
      paperUploads: updatedFiles,
    });
  }

  const handleNextClick = () => {
    if (selectedFiles.length === 0) {
      setIsDialogOpen(true); // Show the dialog if no file is chosen
    } else {
      handleNext(selectedFiles);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <VStack spacing={6} align="flex-start" width="100%">
      <Text fontSize="2xl" fontWeight="bold" mb={4}>Paper Upload</Text>
      <Box borderWidth="1px" borderRadius="md" p={4} width="100%" bg="gray.50">
        <VStack spacing={4} align="flex-start" width="100%">
          <Button as="label" htmlFor="file-upload" colorScheme="blue" leftIcon={<Icon as={FaUpload} />} width="fit-content" cursor="pointer">
            Upload Files
          </Button>
          <Input
            id="file-upload"
            type="file"
            multiple
            onChange={handleChange}
            display="none"
          />
          <Stack spacing={3} mt={4} width="100%">
            {selectedFiles.map((file, index) => (
              <HStack key={index} justifyContent="space-between" width="100%" p={2} bg="white" borderWidth="1px" borderRadius="md">
                <Text>{file.name}</Text>
                <Icon
                  as={FaTimes}
                  cursor="pointer"
                  onClick={() => handleRemove(index)}
                  color="red.500"
                  _hover={{ color: 'red.700' }}
                />
              </HStack>
            ))}
          </Stack>
        </VStack>
      </Box>
      <HStack justifyContent="space-between" width="100%">
        <Button onClick={handlePrevious}>Back</Button>
        <Button onClick={handleNextClick} colorScheme="blue">Next</Button>
      </HStack>

      <AlertDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>No File Uploaded</AlertDialogHeader>
          <AlertDialogBody>Please upload a file before proceeding.</AlertDialogBody>
          <AlertDialogFooter>
            <Button colorScheme="blue" onClick={handleCloseDialog}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VStack>
  );
}

export default PaperUpload;
