import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button, Checkbox, Text, VStack, HStack, Spacer, ListItem, OrderedList, Alert, AlertIcon, AlertDescription } from '@chakra-ui/react';

export default function Terms({ setNext, handlePrevious, handleNext }) {
  const [paper, setPaper] = useRecoilState(paperState);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setNext(paper.terms);
  }, [paper.terms, setNext]);

  function handleChange() {
    setPaper({ ...paper, terms: !paper.terms });
    setShowMessage(false); // Hide the message when terms are checked
  }

  const handleNextClick = () => {
    if (!paper.terms) {
      setShowMessage(true); // Show the message if terms are not checked
    } else {
      handleNext();
    }
  };

  return (
    <VStack spacing={6} alignItems="flex-start">
      <Text fontSize="2xl" fontWeight="bold">Terms and Conditions</Text>
      <VStack spacing={2} align="start">
        <OrderedList pl={0}>
          <ListItem>
            Accuracy of Materials: The materials appearing on the website could
              include technical, typographical, or photographic errors. The
              website does not warrant that any of the materials on its website
              are accurate, complete, or current.
          </ListItem>
          <ListItem>
            Modifications: The website may revise these terms of service for its
            website at any time without notice. By using this website, you are
            agreeing to be bound by the then-current version of these terms of
            service.
          </ListItem>
          <ListItem>
            Governing Law: These terms and conditions are governed by and
            construed in accordance with the laws of the jurisdiction.
          </ListItem>
          <ListItem>
            Contact Information: If you have any questions about these terms and
            conditions, please contact us at [contact@email.com].
          </ListItem>
        </OrderedList>
        <br />
        <Checkbox
          isChecked={paper.terms}
          onChange={handleChange}
          colorScheme="blue"
          variant="outline"
          borderColor="blue.500" // Blue border color
        >
          I have read and agree to the terms and conditions stated above
        </Checkbox>
        {showMessage && (
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>Please agree to the terms and conditions before proceeding.</AlertDescription>
          </Alert>
        )}
      </VStack>
      <HStack spacing={4} width="100%">
        <Button onClick={handlePrevious}>Back</Button>
        <Spacer />
        <Button onClick={handleNextClick} colorScheme="blue" disabled={!paper.terms}>Next</Button>
      </HStack>
    </VStack>
  );
}
