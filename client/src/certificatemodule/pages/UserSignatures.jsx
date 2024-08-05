import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import getEnvironment from "../../getenvironment";
import {
  Container,
  Box,
  Image,
  Button,
  useToast,
  Spinner,
  Center,
  Grid,
  GridItem
} from '@chakra-ui/react';
import Header from "../../components/header";

const UserSignatures = () => {
  const { userId } = useParams();
  const apiUrl = getEnvironment();
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchSignatures = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/certificatemodule/certificate/signatures/${userId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch signatures: ${response.statusText}`);
        }

        let data = await response.json();
        // Filter out invalid URLs
        data = data.filter(url => url && url.trim !== '');

        

        setSignatures(data);

        if (data.length === 0) {
          toast({
            title: "No Signatures",
            description: "User has no signatures.",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        }

      } catch (error) {
        console.error('Error fetching signatures:', error);
        toast({
          title: "Error",
          description: "Failed to fetch signatures.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, [apiUrl, userId, toast]);

  const handleDeleteSignature = async (signatureUrl) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this signature?');
      if (!confirmed) {
        return;
      }

      // console.log('Deleting signature:', signatureUrl); 
      const response = await fetch(`${apiUrl}/certificatemodule/certificate/signatures/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ signatureUrl: signatureUrl }), // Ensure the body contains signatureUrl as a string
      });

      if (response.ok) {
        // console.log('Signature deleted successfully:', response);  
        toast({
          title: "Signature Deleted",
          description: "Signature deleted successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setSignatures(signatures.filter(signature => signature !== signatureUrl));
      } else {
        const errorText = await response.text(); // Get error details
        // console.error('Error deleting signature:', errorText); // Log error details
        toast({
          title: "Error",
          description: `Failed to delete signature: ${response.statusText}`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      toast({
        title: "Error",
        description: "Failed to delete signature.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };



  return (
    <Container maxW="7xl" p={4}>
      <Header title="User Signatures" />
      {loading ? (
        <Center><Spinner size="xl" /></Center>
      ) : (
        <Box>
          {signatures.length > 0 ? (
            <Grid templateColumns="repeat(4, 1fr)" gap={6}>
              {signatures.map((signature, index) => (
                <GridItem key={index}>
                  <Box mb={4}>
                    <Image 
                      src={signature} 
                      alt={`Signature ${index}`} 
                      onError={(e) => e.target.style.display = 'none'} 
                    />
                    <Button colorScheme="red" onClick={() => handleDeleteSignature(signature)} mt={2}>
                      Delete
                    </Button>
                  </Box>
                </GridItem>
              ))}
            </Grid>
          ) : (
            <Center>No signatures available.</Center>
          )}
        </Box>
      )}
    </Container>
  );
};

export default UserSignatures;
