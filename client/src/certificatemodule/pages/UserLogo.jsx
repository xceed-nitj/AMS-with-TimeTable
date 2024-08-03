import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Image, Button } from '@chakra-ui/react';

const UserLogos = () => {
  const { userId } = useParams();
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    // Fetch user logos based on userId
    const fetchLogos = async () => {
      try {
        const response = await fetch(`/api/path/to/get/logos/${userId}`);
        const data = await response.json();
        setLogos(data.logos);
      } catch (error) {
        console.error('Error fetching logos:', error);
      }
    };

    fetchLogos();
  }, [userId]);

  return (
    <Container>
      <Box>
        {logos.map((logo, index) => (
          <Box key={index} mb={4}>
            <Image src={logo.url} alt={`Logo ${index}`} />
            <Button colorScheme="red" onClick={() => {/* Handle delete logo */}}>Delete</Button>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default UserLogos;
