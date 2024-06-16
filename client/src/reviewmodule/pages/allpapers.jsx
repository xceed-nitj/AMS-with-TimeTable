import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import getEnvironment from "../../getenvironment";
import Header from "../../components/header";
import { useToast } from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Container,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  Heading,
} from "@chakra-ui/react";

function EventPaper() {
  const [reviewers, setReviewers] = useState([]);
  const [papers, setPapers] = useState([]); // State to store papers
  const apiUrl = getEnvironment();
  const toast = useToast();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const eventId = parts[parts.length - 3];

  useEffect(() => {
    const fetchPapersById = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/reviewmodule/paper/${eventId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched papers data:", data);
          setPapers(data); // Set the fetched data to state
        } else {
          console.error("Error fetching papers:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching papers:", error);
      }
    };
    const fetchReviewersById = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/reviewmodule/event/getReviewerInEvent/${eventId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (response.ok) {
          const data2 = await response.json();
          console.log("Fetched reviewer data:", data2);
          setReviewers(data2); // Set the fetched data to state
        } else {
          console.error("Error fetching reviewers:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching reviewers:", error);
      }
    };

    fetchPapersById();
    fetchReviewersById();
  }, [apiUrl, eventId]);
  const handledelete = async (paper_id,user_id)=>{
    console.log("function is called: ",paper_id,user_id);
    try{
      const removeResponse = await axios.post(`${apiUrl}/reviewmodule/paper/removeReviewer/${paper_id}`, {userId: user_id });
      if(removeResponse){
        console.log("removed successfully");
        toast({
          title: 'Reviewer Removed successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
        window.location.reload();
        // setReviewers(prevReviewers => [...prevReviewers, { email: reviewerEmail }]); // Assuming you're only adding the email here
      } else {
        toast({
          title: 'Error removing Reviewer as api path is wrong',
          description: 'Please try again later',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: error.response.data,
        description: 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      }); 
    }
  }
  const handlesubmit = async (paper_id,reviewer_email)=>{
    console.log("function is called: ",paper_id,reviewer_email);
    try {
      // Adding reviewer to the paper
      const addReviewerResponse = await axios.post(`${apiUrl}/reviewmodule/paper/addReviewer/${paper_id}`, { email: reviewer_email });
      if (addReviewerResponse) {
        console.log("added successfully");
        toast({
          title: 'Reviewer Added successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
        window.location.reload();
        // setReviewers(prevReviewers => [...prevReviewers, { email: reviewerEmail }]); // Assuming you're only adding the email here
      } else {
        toast({
          title: 'Error adding Reviewer as api path is wrong',
          description: 'Please try again later',
          status: 'error',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: error.response.data,
        description: 'Check again',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      }); 
    }
  }
  return (
    <Container maxW="container.xl" p={4}>
      <Header title="Paper Details"></Header>
      
      <Box boxShadow="md" p={6} rounded="md" bg="white">
      <Button width="230px" height="50px" colorScheme="red" onClick={() => navigate(`${location.pathname}/addpaper`)}>Add papers</Button>
        
        <Table variant="Strip">
          <TableCaption>Papers for Event ID: {eventId}</TableCaption>
          <Thead>
            <Tr>
            <Th>ID</Th>
              <Th>Title</Th>
              <Th>Authors</Th>
              <Th>Paper</Th>
              <Th>Version</Th>
              <Th>Status</Th>
              <Th>Review</Th>
              <Th>Reviewers</Th>

            </Tr>
          </Thead>
          <Tbody>
            {papers.map((paper) => (
              <Tr key={paper._id}>
                <Td>{paper._id}</Td>
                <Td>{paper.title}</Td>
                <Td>{paper.authors}</Td>
                <Td>
                  <Link to={`/paper/details/${paper._id}`}>
                    paper link
                  </Link>
                </Td>
                <Td>{paper.version}</Td>
                <Td>{paper.status}</Td>
                <Td>
                  <Menu>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                      Assign Reviewer
                    </MenuButton>
                    <MenuList>
                      {reviewers.map((reviewer)=>(
                        //fixed the assign reviewer button for those users, not having a name value
                        <MenuItem  onClick={()=>handlesubmit(paper._id,reviewer.email[0])} minH='48px'>
                          <span>{reviewer.email[0]}</span>
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </Td>
                <Td>
                  <ol>
                    {paper.reviewers.map((r)=>(
                        <li>
                          <span>username:{r.username},</span><Button  onClick={()=>handledelete(paper._id,r.userId)}>Delete</Button><br></br>
                          <span>userId:{r.userId}</span>
                        </li>
                    ))}
                  </ol>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}

export default EventPaper;
