import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Image, Button } from '@chakra-ui/react';

const UserSignatures = () => {
  const { userId } = useParams();
  const [signatures, setSignatures] = useState([]);

  useEffect(() => {
    // Fetch user signatures based on userId
    const fetchSignatures = async () => {
      try {
        const response = await fetch(`/api/path/to/get/signatures/${userId}`);
        const data = await response.json();
        setSignatures(data.signatures);
      } catch (error) {
        console.error('Error fetching signatures:', error);
      }
    };

    fetchSignatures();
  }, [userId]);

  return (
    <Container>
      <Box>
        {signatures.map((signature, index) => (
          <Box key={index} mb={4}>
            <Image src={signature.url} alt={`Signature ${index}`} />
            <Button colorScheme="red" onClick={() => {/* Handle delete signature */}}>Delete</Button>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default UserSignatures;
