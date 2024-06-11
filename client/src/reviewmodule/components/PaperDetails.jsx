import React, { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button, Box, Heading, Table, Tbody, Tr, Td, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogCloseButton } from '@chakra-ui/react';

function PaperDetails({ handleNext, handlePrevious }) {
  const [paper, setPaper] = useRecoilState(paperState);
  const [isSaved, setIsSaved] = useState(false);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDetailDialogOpen, setIsSaveDetailDialogOpen] = useState(false);

  useEffect(() => {
    setIsNextEnabled(paper.title && paper.title.trim() !== '');
  }, [paper.title]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setPaper((prevPaper) => ({
      ...prevPaper,
      [id]: value,
    }));

    setIsNextEnabled(value.trim() !== '');
  };

  const handleSave = () => {
    if (!isNextEnabled) {
      setIsOpen(true);
      return;
    }

    setIsSaved(true);
    setTimeout(() => {
      console.log('Paper details saved:', paper);
      setIsSaved(false);
      setIsNextEnabled(true);
    }, 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSaveDetailDialogOpen(false);
  };

  const handleNextClick = () => {
    if (!isNextEnabled && !paper.title) {
      setIsSaveDetailDialogOpen(true);
      return;
    }

    if (!isNextEnabled) {
      setIsOpen(true);
      return;
    }
  

    handleNext(paper);
  };

  return (
    <div className="paper-details-container">
      <Box p={8} bg="gray.100" borderRadius="md" shadow="md" maxWidth="600px" mx="auto" mt={10}>
        <Heading as="h2" size="lg" mb={6}>Paper Details</Heading>
        <form>
          <Box mb={4}>
            <label htmlFor="title" className="tw-font-semibold">Title:</label>
            <input
              id="title"
              
              value={paper.title || ''}
              className="tw-w-full tw-p-1"
              style={{ maxWidth: '100%', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
              onChange={handleChange}
              placeholder="Enter paper title"
            />
          </Box>
          <Box mb={4}>
            <label htmlFor="abstract" className="tw-font-semibold">Abstract:</label>
            <textarea
              id="abstract"
              
              value={paper.abstract || ''}
              className="tw-w-full tw-p-1"
              style={{ maxWidth: '100%', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
              onChange={handleChange}
              placeholder="Enter paper abstract"
            />
          </Box>
        </form>
        <Button onClick={handleSave} colorScheme="blue" zIndex={9996}>Save</Button>
        {isSaved && (
          <Box mt={4}>
            <p className="tw-text-green-500">Paper details saved successfully!</p>
          </Box>
        )}
      </Box>
      <Box p={8} bg="gray.100" borderRadius="md" shadow="md" maxWidth="600px" mx="auto" mt={6}>
        <Heading as="h2" size="lg" mb={6}>Saved Paper Details</Heading>
        <Table>
          <Tbody>
            <SavedPaperDetails paper={paper} />
          </Tbody>
        </Table>
      </Box>
      <div className="tw-flex tw-justify-between tw-mt-6">
        <Button onClick={handlePrevious}>Back</Button>
        <Button onClick={handleNextClick} disabled={!isNextEnabled} colorScheme="blue">Next</Button>
      </div>
      <AlertDialog
        isOpen={isOpen || isSaveDetailDialogOpen}
        onClose={handleClose}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>{isSaveDetailDialogOpen ? "Save Details First" : "Title is Empty"}</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            {isSaveDetailDialogOpen ? "Please save the details first." : "Please enter a title before saving."}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button colorScheme="blue" onClick={handleClose}>
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SavedPaperDetails({ paper }) {
  return (
    <>
      <Tr>
        <Td>Title</Td>
        <Td>{paper.title || ''}</Td>
      </Tr>
      <Tr>
        <Td>Abstract</Td>
        <Td>{paper.abstract || ''}</Td>
      </Tr>
    </>
  );
}

export default PaperDetails;
