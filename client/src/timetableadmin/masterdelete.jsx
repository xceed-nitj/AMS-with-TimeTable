import React, { useState } from "react";
import getEnvironment from "../getenvironment";
import { Box, Button, Center, Container, Input, Table, TableContainer, Td, Text, Tr } from "@chakra-ui/react";
import Header from '../components/header';
import { CustomDeleteButton } from "../styles/customStyles";

function Del() {
  const [code, setCode] = useState('');
  const apiUrl = getEnvironment();
  const [isInputValid, setIsInputValid] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  const handleInputChange = (e) => {
    const input = e.target.value;
    setCode(input);
    setIsInputValid(input.trim().length > 0); // Check if input is not empty
  };

  const deleteEntry = (tableName) => {
    if (!isInputValid) {
      alert("Please provide a valid code.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete entries with code '${code}' from ${tableName}?`);
    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/${tableName}/deletebycode/${code}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      })
      .then(response => {
        if (response.ok) {
            setDeleteMessage(`Deleted entries with code '${code}' from ${tableName}`);
            setTimeout(() => {
                setDeleteMessage('');
              }, 3000); 
          console.log(`Deleted entries with code '${code}' from ${tableName}`);
        } else {
          throw new Error('Delete request failed');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert("Failed to delete entries");
      });
    }
  };

  return (
    <Container maxW='6xl'>
      <Header title='Delete Entries'></Header>
      <Box mb='3'  >
        <Text as='b' mb='2'>Code:</Text>
        <Input type="text" id="codeInput" value={code} onChange={handleInputChange} />
      </Box>


      {deleteMessage && <Text color="green">{deleteMessage}</Text>}
<TableContainer>
  
        <Table
        variant='striped'
        size="md" 
        mt="1"
        >
          <Tr>
            <Td fontWeight='bold'><Center>Delete Subject data for this code:</Center></Td>
            <Td><Center>
              <CustomDeleteButton onClick={() => deleteEntry('subject')} disabled={!isInputValid}>Delete</CustomDeleteButton>
            </Center></Td>
          </Tr>
          <Tr>
            <Td fontWeight='bold'><Center>Delete Semester data for this code:</Center></Td>
            <Td><Center>
              <CustomDeleteButton onClick={() => deleteEntry('addsem')} disabled={!isInputValid}>Delete</CustomDeleteButton>
            </Center></Td>
          </Tr>
          <Tr>
            <Td fontWeight='bold'><Center>Delete Faculty data for this code:</Center></Td>
            <Td><Center>
              <CustomDeleteButton onClick={() => deleteEntry('addfaculty')} disabled={!isInputValid}>Delete</CustomDeleteButton>
            </Center></Td>
          </Tr>
          <Tr>
            <Td fontWeight='bold'><Center>Delete Room data for this code:</Center></Td>
            <Td><Center>
              <CustomDeleteButton onClick={() => deleteEntry('addroom')} disabled={!isInputValid}>Delete</CustomDeleteButton>
            </Center></Td>
          </Tr>
          <Tr>
            <Td  fontWeight='bold'><Center>Delete Class Table for this code:</Center></Td>
            <Td><Center>
              <CustomDeleteButton onClick={() => deleteEntry('tt')} disabled={!isInputValid}>Delete</CustomDeleteButton>
            </Center></Td>
          </Tr>
          <Tr>
            <Td fontWeight='bold'><Center>Delete Locked Time Table for this code:</Center></Td>
            <Td><Center>
              <CustomDeleteButton onClick={() => deleteEntry('lock')} disabled={!isInputValid}>Delete</CustomDeleteButton>
            </Center></Td>
          </Tr>
          <Tr>
            <Td fontWeight='bold'><Center>Delete Session for this code:</Center></Td>
            <Td><Center>
              <CustomDeleteButton onClick={() => deleteEntry('timetable')} disabled={!isInputValid}>Delete</CustomDeleteButton>
            </Center></Td>
          </Tr>
        </Table>
</TableContainer>
    </Container>
  );
}

export default Del;
