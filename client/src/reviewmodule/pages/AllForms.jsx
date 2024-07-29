import React, { useState, useEffect } from 'react';
import { Container, Box, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text, IconButton, chakra, Button } from '@chakra-ui/react';
import getEnvironment from '../../getenvironment';
import { useParams, useNavigate } from 'react-router-dom';

function ManageForms() {
  const apiUrl = getEnvironment();
  const { eventId } = useParams();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`${apiUrl}/reviewmodule/event/forms/${eventId}`);
        if(response.status===200){
          const data = await response.json();
          setForms(data.forms);
        }
      } catch (error) {
        console.error('Error fetching forms:', error);
        setError('Failed to load forms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [apiUrl, eventId]);

  return (
    <Container maxWidth='100%'>
      <Box display="flex" justifyContent="center" mt={4}>
        <Box bg="black" p={0.2} width='80%'>
          <Box display="flex" alignItems="center">
            <IconButton
              mb='1'
              variant='ghost'
              onClick={() => navigate(-1)}
              _hover={{ bgColor: 'transparent' }}
            >
              <chakra.svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='white'
                className='w-6 h-6'
                _hover={{ stroke: '#00BFFF' }}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </chakra.svg>
            </IconButton>
            <Text color="white" fontSize='25px' marginInline='auto'>
              Forms
            </Text>
          </Box>
        </Box>
      </Box>
      <br />
      <br />

      <Button width="230px" height="50px" marginLeft="120px"colorScheme="red" onClick={() => navigate(`/prm/${eventId}/forms`)}>Add Form</Button>
      {loading ? (
        <Box mt={8} textAlign="center" fontSize="lg" fontWeight="bold">
          <Spinner />
        </Box>
      ) : error ? (
        <Box mt={8} textAlign="center" fontSize="lg" fontWeight="bold">
          {error}
        </Box>
      ) : forms.length > 0 ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <Box width="80%" overflowX="auto">
            <Table variant="striped" maxWidth="100%">
              <Thead>
                <Tr>
                  <Th fontSize="sm" textAlign="center">Title</Th>
                  <Th fontSize="sm" textAlign="center">Section</Th>
                  <Th fontSize="sm" textAlign="center">Type</Th>
                  <Th fontSize="sm" textAlign="center">Questions</Th>
                  <Th fontSize="sm" textAlign="center">Options</Th>
                  <Th fontSize="sm" textAlign="center">Order</Th>
                  <Th fontSize="sm" textAlign="center">Show</Th>
                  <Th fontSize="sm" textAlign="center">Access Role</Th>
                </Tr>
              </Thead>
              <Tbody>
                {forms.map((form, index) => (
                  <Tr key={index}>
                    <Td textAlign="center">{form.title}</Td>
                    <Td textAlign="center">{form.section}</Td>
                    <Td textAlign="center">{form.type.join(', ')}</Td>
                    <Td textAlign="center">{form.question.join(', ')}</Td>
                    <Td textAlign="center">{form.options.join(', ')}</Td>
                    <Td textAlign="center">{form.order.join(', ')}</Td>
                    <Td textAlign="center">{form.show ? 'Yes' : 'No'}</Td>
                    <Td textAlign="center">{form.accessRole}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      ) : (
        <Box mt={8} textAlign="center" fontSize="lg" fontWeight="bold">
          No forms found...
        </Box>
      )}
    </Container>
  );
}

export default ManageForms;
