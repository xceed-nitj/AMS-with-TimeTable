import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Flex, Text, chakra, Heading, IconButton,
  Box,
  Button,
  FormControl,
  FormLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  CloseButton,
} from '@chakra-ui/react';
import JoditEditor from 'jodit-react';
import getEnvironment from '../../getenvironment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReviewPage = () => {
  const apiUrl = getEnvironment();
  const { eventId, paperId, userId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [commentsAuthor, setCommentsAuthor] = useState('');
  const [commentsEditor, setCommentsEditor] = useState('');
  const [decision, setDecision] = useState('Need Revision');
  const [isSubmitted, setIsSubmitted] = useState(false); // Local state to track submission
  const [submittedTime, setSubmittedTime] = useState()
  const toast = useToast();

  let sortedQuestions = []
  useEffect(() => {
    // Fetch questions from the backend and sort by order
    axios.get(`${apiUrl}/reviewmodule/reviewQuestion/get/${eventId}`)
      .then(response => {
        sortedQuestions = response.data.sort((a, b) => a.order - b.order);
        setQuestions(sortedQuestions);
      })
      .catch(error => console.error('Error fetching questions:', error));

    // Check if review has been submitted for this paper and reviewer
    axios.get(`${apiUrl}/reviewmodule/review/get/${eventId}/${paperId}/${userId}`)
      .then(response => {
        if (response.data) {
          console.log(response.data)
          const QnA = response.data[0].reviewAnswers
          let submittedAnswers = {};
          sortedQuestions.forEach(question => {
            QnA.forEach(qna=>{
              if(qna.questionId == question._id) submittedAnswers[question._id] = qna.answer
            })
          });
          const d = new Date(response.data[0].updatedAt).toLocaleString()
          setSubmittedTime(d)
          setAnswers(submittedAnswers)
          setCommentsAuthor(response.data[0].commentsAuthor)
          setCommentsEditor(response.data[0].commentsEditor)
          setIsSubmitted(true); // If review exists, disable the form
        }
        else {
          let initialAnswers = {};
          sortedQuestions.forEach(question => {
            if (question.type.includes('Text')) {
              initialAnswers[question._id] = '';
            } else if (question.type.includes('Multiple Correct')) {
              initialAnswers[question._id] = [];
            } else if (question.type.includes('Single Correct')) {
              initialAnswers[question._id] = '';
            } else {
              // Handle other question types as needed
            }
          });
          setAnswers(initialAnswers);
        }
      })
      .catch(error => console.error('Error checking review status:', error));
  }, [apiUrl, eventId, paperId, userId]);

  const navigate = useNavigate()

  const handleAnswerChange = (questionId, newValue) => {
    setAnswers({
      ...answers,
      [questionId]: newValue,
    });
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
  
    // Fetch necessary details
    const eventResponse = await axios.get(
      `${apiUrl}/reviewmodule/event/${eventId}`
    );
    const paperResponse = await axios.get(
      `${apiUrl}/reviewmodule/paper/getPaperDetail/${paperId}`
    );
    const reviewerResponse = await axios.get(
      `${apiUrl}/reviewmodule/user/getUser/${userId}`
    );
  
    const eventName = eventResponse.data.name;
    const paperTitle = paperResponse.data.title;
    const reviewerName = reviewerResponse.data.name;
    const paperid = paperResponse.data.paperId;
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const maxTextWidth = pageWidth - 2 * margin;
  
    const checkAddPage = () => {
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
    };
  
    const eventNameLines = doc.splitTextToSize(
      `Event name: ${eventName}`,
      maxTextWidth
    );
    const paperTitleLines = doc.splitTextToSize(
      `Paper title: ${paperTitle}`,
      maxTextWidth
    );
    const reviewerNameLines = doc.splitTextToSize(
      `Reviewer Name: ${reviewerName}`,
      maxTextWidth
    );
  
    let currentY = margin;
    eventNameLines.forEach((line) => {
      checkAddPage();
      doc.text(line, margin, currentY);
      currentY += 10;
    });
  
    paperTitleLines.forEach((line) => {
      checkAddPage();
      doc.text(line, margin, currentY);
      currentY += 10;
    });
  
    checkAddPage();
    doc.text(`Paper ID: ${paperid}`, margin, currentY);
    currentY += 10;
  
    reviewerNameLines.forEach((line) => {
      checkAddPage();
      doc.text(line, margin, currentY);
      currentY += 10;
    });
  
    const stripHTMLTags = (str) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = str;
      return tmp.textContent || tmp.innerText || '';
    };
  
    // Add review questions and answers
    const reviewData = questions.map((question, index) => [
      `Question ${index + 1}: ${stripHTMLTags(question.question)}`,
      `Answer: ${stripHTMLTags(answers[question._id]) || ''}`,
    ]);
  
    doc.autoTable({
      head: [['Question', 'Answer']],
      body: reviewData,
      startY: currentY + 10,
      margin: { left: margin, right: margin },
      styles: { cellPadding: 2, fontSize: 10 },
      columnStyles: { 0: { cellWidth: 'wrap' }, 1: { cellWidth: 'auto' } },
      didDrawPage: (data) => {
        currentY = data.cursor.y;
      }
    });
  
    currentY = doc.autoTable.previous.finalY + 10; // Update currentY after autoTable
    checkAddPage();
  
    // Split author and editor comments to fit within the page width
    const authorCommentsLines = doc.splitTextToSize(
      `Author comments: ${commentsAuthor}`,
      maxTextWidth
    );
    const editorCommentsLines = doc.splitTextToSize(
      `Editor comments: ${commentsEditor}`,
      maxTextWidth
    );
  
    authorCommentsLines.forEach((line) => {
      checkAddPage();
      doc.text(line, margin, currentY);
      currentY += 10;
    });
  
    editorCommentsLines.forEach((line) => {
      checkAddPage();
      doc.text(line, margin, currentY);
      currentY += 10;
    });
  
    checkAddPage();
    doc.text(`Submitted time: ${submittedTime}`, margin, currentY);
  
    // Save the PDF
    doc.save('review.pdf');
  };
  
  
  const handleSubmit = () => {
    const reviewData = {
      eventId,
      paperId,
      reviewerId: userId,
      reviewAnswers: Object.entries(answers).map(([questionId, answer]) => {
        const question = questions.find(q => q._id === questionId);
        return {
          questionId,
          order: question.order[0],
          answer,
        };
      }),
      commentsAuthor,
      commentsEditor,
      decision,
    };

    axios.post(`${apiUrl}/reviewmodule/review/save`, reviewData)
      .then(() => {
        setIsSubmitted(true);
        toast({
          title: 'Review submitted.',
          description: 'Your review has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        generatePDF();
      })
      .catch(error => {
        console.error('Error submitting review:', error);
        toast({
          title: 'Error.',
          description: 'There was an error submitting your review.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });

      window.location.reload()
  };

  const HeaderReviewPage = ({ title }) => (
    <Heading mr='1' ml='1' display='flex'>
      <IconButton
        mb='1'
        variant='ghost'
        onClick={() => navigate(-1)}
        _hover={{ bgColor: 'transparent' }}
        icon={
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
        }
      />
      <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2'>
        {title}
      </chakra.div>
    </Heading>
  );

  return (
    <Box p={5} width={'85%'} margin={'auto'}>
      <br/>
      <Box bg="black" p={0.2} width='100%' margin="auto">
        <HeaderReviewPage color="white" textAlign="center" title="Review Page" />
      </Box>
      <Button
  mt={4}
  colorScheme="teal"
  onClick={generatePDF}
  isDisabled={!isSubmitted}>
  Download PDF
</Button>
      <br/>
      {isSubmitted && (
        <>
          <Alert status="info" mb={4}>
            <AlertIcon />
            <AlertTitle>Your review has been submitted.</AlertTitle>
            <CloseButton position="absolute" right="8px" top="8px" style={{display:"none"}} onClick={() => {}} />
          </Alert>
          <br/>
          <p style={{color: 'slategrey', textAlign:'center'}}>Submitted on <span style={{color:'green', fontWeight:"bold"}}>{submittedTime}</span></p>
        </>
      )}
      {questions.map((question, index) => (
        <Box borderWidth="1px" borderRadius="lg" p={4} mb={4} bg="white" margin={'50px 0 50px 0 '} boxShadow="none" _hover={{ boxShadow: 'lg' }} key={question._id}>

          <Flex>
            <Flex style={{boxSizing:'border-box', width: '100%'}}>
            <Text color="white" fontSize="sm" ml={2} bg='yellow.400' p='1.5' borderRadius="md">
              Type: {question.type[0]}
            </Text>
            </Flex>
            <span style={{ fontWeight: 'bold', textWrap:'nowrap' }}>Question {index + 1}</span>
            <Flex style={{boxSizing:'border-box', width: '100%'}}></Flex>
          </Flex>
          {/* <FormLabel><span dangerouslySetInnerHTML={{__html:question.question}} /></FormLabel> */}
          <span style={{ fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: question.question }} />

          <FormControl as="fieldset">
            {question.type.includes('Text') ? (
              <JoditEditor
                value={answers[question._id] || ''}
                onChange={(value) =>{ if (!isSubmitted) {handleAnswerChange(question._id, value)}}}
              />
            ) : question.type.includes("Multiple Correct") ? (
              <Stack direction="column">
                {question.options.map((option, idx) => (
                  <Checkbox
                    key={idx}
                    isChecked={answers[question._id]?.includes(option) || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      let newAnswers = [...(answers[question._id] || [])];
                      if (isChecked && !newAnswers.includes(option)) {
                        newAnswers.push(option);
                      } else {
                        newAnswers = newAnswers.filter((ans) => ans !== option);
                      }
                      handleAnswerChange(question._id, newAnswers);
                    }}
                    isDisabled={isSubmitted}
                  >
                    {option}
                  </Checkbox>
                ))}
              </Stack>
            ) : question.type.includes("Single Correct") ? (
              <RadioGroup
                value={answers[question._id] || ''}
                onChange={(newValue) => handleAnswerChange(question._id, newValue)}
                isDisabled={isSubmitted}
              >
                <Stack direction="column">
                  {question.options.map((option, idx) => (
                    <Radio key={idx} value={option}>
                      {option}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            ) : null}
          </FormControl>
        </Box>
      ))}
      <FormControl mt={4} isDisabled={isSubmitted}>
        <FormLabel fontWeight={'bolder'}>Comments (Author)</FormLabel>
        <Textarea
          value={commentsAuthor}
          onChange={(e) => setCommentsAuthor(e.target.value)}
        />
      </FormControl>
      <FormControl mt={4} isDisabled={isSubmitted}>
        <FormLabel fontWeight={'bolder'}>Comments (Editor)</FormLabel>
        <Textarea
          value={commentsEditor}
          onChange={(e) => setCommentsEditor(e.target.value)}
        />
      </FormControl>
      <FormControl mt={4} isDisabled={isSubmitted}>
        <FormLabel fontWeight={'bolder'}>Decision</FormLabel>
        <RadioGroup
          value={decision}
          onChange={(newValue) => setDecision(newValue)}
          isDisabled={isSubmitted}
        >
          <Stack direction="row">
            <Radio value="Accepted">Accepted</Radio>
            <Radio value="Rejected">Rejected</Radio>
            <Radio value="Need Revision">Need Revision</Radio>
          </Stack>
        </RadioGroup>
      </FormControl>
      {/* <Button
        mt={4}
        colorScheme="teal"
        onClick={handleSubmit}
        isDisabled={isSubmitted}>
        Save
      </Button> */}
      <Flex padding={'40px'} alignItems={'center'} justifyContent={'center'}>
        <Link
          onClick={handleSubmit}
          style={{display:(isSubmitted)?'none':'block'}}
          className=" tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
        >
          Save
        </Link>
      </Flex>
    </Box>
  );
};

export default ReviewPage;
