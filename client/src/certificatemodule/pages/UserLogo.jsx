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

const UserLogos = () => {
  const { userId } = useParams();
  const apiUrl = getEnvironment();
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchLogos = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/certificatemodule/certificate/logos/${userId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch logos: ${response.statusText}`);
        }

        let data = await response.json();
        // Filter out invalid URLs
        data = data.filter(url => url && url.trim() !== '');

       

        setLogos(data);

        if (data.length === 0) {
          toast({
            title: "No Logos",
            description: "User has no logos.",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        }

      } catch (error) {
        // console.error('Error fetching logos:', error);
        toast({
          title: "Error",
          description: "Failed to fetch logos.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLogos();
  }, [apiUrl, userId, toast]);

  const handleDeleteLogo = async (logoUrl) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this logo?');
      if (!confirmed) {
        return;
      }

      // console.log('Deleting logo:', logoUrl);  
      const response = await fetch(`${apiUrl}/certificatemodule/certificate/logos/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ logoUrl }),
      });

      if (response.ok) {
        // console.log('Logo deleted successfully:', response);  
        toast({
          title: "Logo Deleted",
          description: "Logo deleted successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setLogos(logos.filter(logo => logo !== logoUrl));
      } else {
        // console.error('Error deleting logo:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to delete logo.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      // console.error('Error deleting logo:', error);
      toast({
        title: "Error",
        description: "Failed to delete logo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="7xl" p={4}>
      <Header title="User Logos" />
      {loading ? (
        <Center><Spinner size="xl" /></Center>
      ) : (
        <Box>
          {logos.length > 0 ? (
            <Grid templateColumns="repeat(4, 1fr)" gap={6}>
              {logos.map((logo, index) => (
                <GridItem key={index}>
                  <Box mb={4}>
                    <Image 
                      src={logo} 
                      alt={`Logo ${index}`} 
                      onError={(e) => e.target.style.display = 'none'} 
                    />
                    <Button colorScheme="red" onClick={() => handleDeleteLogo(logo)} mt={2}>
                      Delete
                    </Button>
                  </Box>
                </GridItem>
              ))}
            </Grid>
          ) : (
            <Center>No logos available.</Center>
          )}
        </Box>
      )}
    </Container>
  );
};

export default UserLogos;
