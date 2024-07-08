import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import getEnvironment from "../../getenvironment";
import Header from "../../components/header";
import { useToast } from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Flex,
  Text,
  Select,
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
  Textarea,
} from "@chakra-ui/react";

function EventPaper() {
  const [reviewers, setReviewers] = useState([]);
  const [papers, setPapers] = useState([]); // State to store papers
  const [editorComments, setEditorComments] = useState({});
const [selectedDecisions, setSelectedDecisions] = useState({});
  const apiUrl = getEnvironment();
  const toast = useToast();
  const navigate = useNavigate();
  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const eventId = parts[parts.length - 3];
  const [selectedDate, setSelectedDate] = useState(null);
  const day_count = Array.from({ length: 30 }, (_, i) => i + 1);

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

  const handleSelection = async (value,paperId,reviewerId) => {
    try {
      const daysToAdd = parseInt(value, 10);
      const currentDate = new Date();
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + daysToAdd);
      await axios.patch(`${apiUrl}/reviewmodule/reviewer/updateReviewer/${paperId}/${reviewerId}`, { newDate,rating:false,comment_author:false,comment_editor:false,status:false,reviewerStatus:false });
      toast({
        title: 'Reviewer due date updated successfully',
        status: 'success',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
      window.location.href = `${window.location.origin}/prm/${eventId}/editor/papers`;
    } catch (error) {
      console.error('Error updating reviewer due date:', error);
      toast({
        title: 'Error updating reviewer due date',
        description: error.response ? error.response.data : 'Unknown error occurred',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

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
        title: 'Error removing reviewer',
        description: error.response && error.response.data ? error.response.data.error : 'Unknown error occurred',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  }
  const handlesubmit = async (paper_id,reviewer_email)=>{
    console.log("function is called: ",paper_id,reviewer_email);
    const baseUrl = window.location.origin;
    try {
      // Adding reviewer to the paper
      const addReviewerResponse = await axios.post(`${apiUrl}/reviewmodule/paper/addReviewer/${paper_id}`, { email: reviewer_email, baseUrl });
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
        title: error.response && error.response.data ? error.response.data : 'Unknown error occurred',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
      
    }
  }
  const handleEditorCommentsChange = (paperId, value) => {
    setEditorComments((prevComments) => ({
      ...prevComments,
      [paperId]: value,
    }));
  };
  const fetchReviewComments = async (eventId, paperId) => {
    try {
      const response = await axios.get(`${apiUrl}/reviewmodule/review/get/${eventId}/${paperId}`);
      if (response.data && response.data.length > 0) {
        return response.data[0].commentsAuthor;
      }
    } catch (error) {
      console.error('Error fetching review comments:', error);
      return null;
    }
  };
  const fetchReviewDecision = async (eventId, paperId) => {
    try {
      const response = await axios.get(`${apiUrl}/reviewmodule/review/get/${eventId}/${paperId}`);
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching review comments:', error);
      return null;
    }
  };
  
  const handleFinalDecisionChange = (paperId, value) => {
    setSelectedDecisions((prevDecisions) => ({
      ...prevDecisions,
      [paperId]: value,
    }));
  };
  
  const handleFinalDecisionSubmit = async (paperId) => {
    const decision = selectedDecisions[paperId];
    const commentsEditor = editorComments[paperId] || "";
    
    // Fetch the commentsAuthor from the review data for the specific paper
    const reviews = await fetchReviewComments(eventId, paperId);
    const commentsAuthor = reviews ? reviews : "";
    console.log(decision, commentsEditor, commentsAuthor);
       
    const url = `${apiUrl}/reviewmodule/paper/updateDecision/${eventId}/${paperId}`;
  
    try {
      const response = await axios.patch(url, { decision, commentsEditor, commentsAuthor });
      if (response.status === 200) {
        toast({
          title: 'Final decision updated successfully',
          status: 'success',
          duration: 6000,
          isClosable: true,
          position: 'bottom',
        });
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      console.error('Error updating final decision:', error);
      toast({
        title: 'Error updating final decision',
        description: error.response && error.response.data ? error.response.data.error : 'Unknown error occurred',
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  function ReviewerDecision(props) {
    const [rf, setRF] = useState('Pending...')
    useEffect(()=>{
      const fn = async()=>{
        const res = await fetchReviewDecision(eventId, props.paperId)
        if(res) res.forEach(r=>{
          if(r.reviewerId == props.reviewerId) setRF(r.decision)
        })
      }
      fn()
    })
    return (
      <span>{rf}</span>
    )
  }

  return (
    <Container maxW="container.xl" p={4}>
      <Header title="Paper Details"></Header>
      
      <Box boxShadow="md" p={6} rounded="md" bg="white">
      {/* <Button width="230px" height="50px" colorScheme="red" onClick={() => navigate(`${location.pathname}/addpaper`)}>Add papers</Button> */}
        <Box overflowX={'auto'}>
        <Table variant="Strip">
          <TableCaption>Papers for Event ID: {eventId}</TableCaption>
          <Thead>
            <Tr>
              <Th textAlign={'center'}>ID</Th>
              <Th textAlign={'center'}>Title</Th>
              <Th textAlign={'center'}>Authors</Th>
              <Th textAlign={'center'}>Paper</Th>
              <Th textAlign={'center'}>Version</Th>
              <Th textAlign={'center'}>Status</Th>
              {/* <Th textAlign={'center'}>Review</Th> */}
              <Th textAlign={'center'}>Reviewers</Th>
              {/* <Th textAlign={'center'}>Editor Comments</Th> */}
              <Th textAlign={'center'}>Final Decision and Comments</Th>
            </Tr>
          </Thead>
          <Tbody>
            {papers.map((paper) => (
              <Tr key={paper._id}>
                <Td>{paper._id}</Td>
                <Td>{paper.title}</Td>
                <Td>{paper.authors.map((author, k)=>(<Text key={k}>{author}</Text>))}</Td>
                <Td>
                  <Link style={{textDecoration:'underline', color: '#00acc1', textWrap:"nowrap"}} 
                  to={window.location.pathname.split('editor/papers')[0]+paper._id+'/summary'}>
                    paper link
                  </Link>
                </Td>
                <Td>{paper.version}</Td>
                <Td>{paper.status}</Td>
                {/* <Td>
                </Td> */}
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
                    <Table>
                      <Tr>
                        <Th>Username</Th>
                        <Th>Decision</Th>
                        <Th>Due Date</Th>
                        <Th>Completed On</Th>
                        <Th>Comments</Th>
                        {/* <Th>Actions</Th> */}
                      </Tr>
                    {paper.reviewers.map((r,kk)=>(
                      <Tr key={kk}>
                        <Td>
                          <Text>{r.username}</Text>
                          <Flex justifyContent={'center'}>
                          <Button colorScheme="red" onClick={()=>handledelete(paper._id,r.userId)}>Delete</Button>
                          </Flex>
                        </Td>
                        <Td>
                          <Text mt={4}>
                            <ReviewerDecision reviewerId={r.userId} paperId={paper._id} />
                          </Text>
                        </Td>
                        <Td>
                          <Select
                            placeholder="Assign Due Date"
                            onChange={(e) => handleSelection(e.target.value,paper._id,r.userId)}
                            width='100px'
                          >
                            {day_count.map((day,k) => (
                              <option key={k} value={day}>
                                {day} {day === 1 ? 'day' : 'days'}
                              </option>
                            ))}
                          </Select>
                          {r.dueDate && (
                            <Text mt={4}>
                                Due Date : {new Date(r.dueDate).toLocaleDateString()}
                            </Text>
                          )}
                          {!r.dueDate && (
                            <Text mt={4}>
                              {"NO DUE DATE"}
                            </Text>
                          )}
                        </Td>
                        <Td>
                          {r.completedDate && (
                            <Text mt={4}>
                                {new Date(r.completedDate).toLocaleDateString()}
                            </Text>
                          )}
                        </Td>
                        <Td> 
                        <Link style={{textDecoration:'underline', color: '#00acc1', textWrap:"nowrap"}} 
                        // "/prm/:eventId/:paperId/:userId/Review"
                        to={window.location.pathname.split('editor/papers')[0]+paper._id+'/'+r.userId+'/Review'}>
                          Comments
                        </Link>
                        </Td>
                      </Tr>
                    ))}
                    </Table>
                </Td>
                <Td>
                  <Textarea
                    value={editorComments[paper._id] || ""}
                    onChange={(e) => handleEditorCommentsChange(paper._id, e.target.value)}
                    placeholder="Enter editor comments"
                  /><br /><br />
                  <Select
                    placeholder="Select decision"
                    onChange={(e) => handleFinalDecisionChange(paper._id, e.target.value)}
                  >
                    <option value="Reject">Reject</option>
                    <option value="Accept">Accept</option>
                    <option value="Major Revision">Major Revision</option>
                    <option value="Minor Revision">Minor Revision</option>
                    <option value="Reject and Invited Resubmission">Reject and Invited Resubmission</option>
                  </Select>
                  <Button mt={2} colorScheme="blue" onClick={() => handleFinalDecisionSubmit(paper._id)}>
                    Make Decision
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table></Box>
      </Box>
    </Container>
  );
}

export default EventPaper;
