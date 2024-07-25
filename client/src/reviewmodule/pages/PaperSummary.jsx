import { Heading, chakra, IconButton, Box, Container, Textarea, Text, 
    Button, RadioGroup, FormControl, Flex, Checkbox, Stack, Radio,
    useDisclosure, Modal, ModalOverlay, ModalBody, ModalContent, ModalHeader, ModalCloseButton,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react'

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import axios from 'axios';
import getEnvironment from '../../getenvironment';

async function fetchPaperInfo() {
    const apiUrl = getEnvironment();
    const currentURL = window.location.pathname;
    const parts = currentURL.split("/");
    const paperId = parts[3];
    
    try {
        const response = await fetch(
          `${apiUrl}/api/v1/reviewmodule/paper/getPaperDetail/${paperId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (response.status!=200) return false
        const data = await response.json();
        if(data) return data
        else return false
    } catch (error) {
        return false
    }
}

// async function fetchReviewerComments() {
//     const apiUrl = getEnvironment();
//     const currentURL = window.location.pathname;
//     const parts = currentURL.split("/");
//     const paperId = parts[3];

//     try {
//         const response = await fetch(
//             `${apiUrl}/api/v1/reviewmodule/review/get/${parts[2]}/${parts[3]}`,
//             {
//                 method:'GET',
//                 credentials: 'include'
//             }
//         )
//         if (response.status!=200) return false
//         const data = await response.json();
//         if(data) return data
//         else return false

//     } catch (e) { console.log(e) ;return false}
// }

const wrapper = async (setPaperData) => setPaperData(await fetchPaperInfo()) //wrapper functions help run async functions with useEffect

const getStatusColor = (status) => {
    switch (status) {
        case 'Completed':
        return 'green.400';
        case 'Under Review':
        return 'yellow.400';
        case 'Rejected':
        return 'red.400';
        default:
        return 'gray.200';
    }
};


// function QuestionCards(props) {

//     const [answers, setAnswers] = useState(props.answers)

//     return (
//         <>
//             {props.questions.map((question, index) => (
//                 <Box borderWidth="1px" width={'100%'} borderRadius="lg" p={4} mb={4} bg="white" margin={'50px 0 50px 0 '} boxShadow="none" _hover={{ boxShadow: 'lg' }} key={question._id}>

//                 <Flex>
//                     <Flex style={{boxSizing:'border-box', width: '100%'}}>
//                     <Text color="white" fontSize="sm" ml={2} bg='yellow.400' p='1.5' borderRadius="md">
//                     Type: {question.type[0]}
//                     </Text>
//                     </Flex>
//                     <span style={{ fontWeight: 'bold', textWrap:'nowrap' }}>Question {index + 1}</span>
//                     <Flex style={{boxSizing:'border-box', width: '100%'}}></Flex>
//                 </Flex>
//                 {/* <FormLabel><span dangerouslySetInnerHTML={{__html:question.question}} /></FormLabel> */}
//                 <span style={{ fontWeight: 'bold', padding:'5px' }} dangerouslySetInnerHTML={{ __html: question.question }} />

//                 <FormControl as="fieldset">
//                     {question.type.includes('Text') ? (
//                     <>
//                     <Textarea isDisabled>{(answers[question._id])?answers[question._id].replace(/<\/?p>/g, ''):''}</Textarea>
//                     </>
//                     ) : question.type.includes("Multiple Correct") ? (
//                     <Stack direction="column">
//                         {question.options.map((option, idx) => (
//                         <Checkbox
//                             key={idx}
//                             isChecked={answers[question._id]?.includes(option) || false}
//                             isDisabled={true}
//                         >
//                             {option}
//                         </Checkbox>
//                         ))}
//                     </Stack>
//                     ) : question.type.includes("Single Correct") ? (
//                     <RadioGroup
//                         value={answers[question._id] || ''}
//                         isDisabled={true}
//                     >
//                         <Stack direction="column">
//                         {question.options.map((option, idx) => (
//                             <Radio key={idx} value={option}>
//                             {option}
//                             </Radio>
//                         ))}
//                         </Stack>
//                     </RadioGroup>
//                     ) : null}
//                 </FormControl>
//                 </Box>
//             ))}
//         </>
//     )
// }

// function Questions(props){

//     const [questions, setQuestions] = useState()
//     const [answers, setAnswers] = useState()

//     let sortedQuestions = []
//     useEffect(()=>{
//         const apiUrl = getEnvironment();

//         axios.get(`${apiUrl}/reviewmodule/reviewQuestion/get/${window.location.pathname.split('/')[2]}`)
//         .then(response => {
//             sortedQuestions = response.data.sort((a, b) => a.order - b.order);
//             setQuestions(sortedQuestions); console.log('questions after sorting are', sortedQuestions)
//             if(props.answers && sortedQuestions){
//                 let submittedAnswers = {};
//                 sortedQuestions.forEach(question => {
//                     props.answers.forEach(qna=>{
//                     if(qna.questionId == question._id) submittedAnswers[question._id] = qna.answer
//                     })
//                 });
//                 console.log("final form of answers is", submittedAnswers)
//                 setAnswers(submittedAnswers)
//             }
//         })
//         .catch(error => console.error('Error fetching questions:', error));
//     },[])

//     return (
//         <>
//         <br />
//         <Heading textAlign={'center'}>QUESTIONS</Heading>
//         {!questions?'':
//         <QuestionCards questions={questions} answers={answers}/>
//         }
//         </>
//     )
// }

// function ReviewModal(props) {
//     const { isOpen, onOpen, onClose } = useDisclosure()

//     return (
//         <>
//             <Flex width='100%' flexDirection={'column'} alignContent='center' gap='10px'>
//                 <Button onClick={onOpen}>Reviewer {props.num+1}</Button>
//             </Flex>
//             <Modal isOpen={isOpen} onClose={onClose} isCentered>
//                 <ModalOverlay />
//                 <ModalContent minWidth='80vw' maxWidth='80vw' minHeight='75vh' maxHeight='75vh'>
//                 <ModalHeader textAlign={'center'}>Reviewer {props.num+1} Feedback</ModalHeader>
//                 <ModalCloseButton color={'black'} />
//                 <ModalBody overflowY={"auto"} >
//                     <Text><span style={{fontWeight:'500'}}>Decision : </span> {props.review.decision}</Text>
//                     <Text><span style={{fontWeight:'500'}}>Comment : </span> {props.review.commentsAuthor}</Text>
//                     <Text></Text>
//                     <Questions answers = {props.review.reviewAnswers} />
//                 </ModalBody>
//                 </ModalContent>
//             </Modal>
//         </>
//     )
// }

function PaperSummary() {
    const apiUrl = getEnvironment();

    let [paperData, setPaperData] = useState()
    let [dateSubmitted, setDateSubmitted] = useState()
    let [screenWidth, setScreenWidth] = useState(window.innerWidth)
    console.log(paperData)
    setInterval(()=>{if(screenWidth != window.innerWidth) setScreenWidth(window.innerWidth)},500)
        
    useEffect(()=> {wrapper(setPaperData)},[])

    useEffect(()=>{
        if(paperData){
            let d = new Date(paperData.updatedAt).toLocaleString()
            setDateSubmitted(d)
        }
    },[paperData])

    const HeaderPaperSummary = ({ title }) => {
        const navigate = useNavigate();
        
        return (
          <Heading mr='1' ml='1' display='flex' >
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
            <chakra.div marginInline='auto' color="white" fontSize='25px' mt='2' >
              {title}
            </chakra.div>
          </Heading>
        );
    };

    function AuthorName(props) {
        const [authorName, setAuthorName] = useState('loading...')
        useEffect(()=>{
            const fetchAuthorNames = async()=>{
                const response = await axios.get(`${apiUrl}/reviewmodule/user/getUser/${props.authorId}`)
                if(response.status===200 && response.data.name){
                    setAuthorName(response.data.name)
                }
            }
            fetchAuthorNames()
        },[props.authorId])
    
        return (
            <>{authorName}</>
        )
    }

    return (
        <>
        <Container maxWidth='100%' >
        <Box display="flex" justifyContent="center" mt={4} >
            <Box  bg="black" p={0.2} width='85%'>
                <HeaderPaperSummary  color="white" textAlign="center" title="Paper Summary"/>
            </Box>
        </Box>
        <br />
        <div style={{display:'flex', alignItems:'baseline', flexWrap:'wrap', maxWidth:"90%", margin: 'auto'}}>
            <div style={{width:'100%', display:'flex', height:'65vh', flexDirection:'column', margin:'10px', justifyContent:'space-between'}}>
                <h1 className="tw-font-bold tw-text-xl tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 tw-width tw-w-fit tw-mx-auto tw-p-4"
                style={{color:'transparent', backgroundClip: 'text', fontSize:'xx-large'}} //matched the styling on the heading with tailwind button styling
                >{paperData && paperData.title}</h1>

                <Accordion width={'100%'} allowToggle defaultIndex={0}>
                    <AccordionItem>
                        <AccordionButton>
                            <Box width='100%'>
                                <Text color='black' textAlign={'left'}>Authors</Text>
                            </Box>
                            <AccordionIcon color={'black'} />
                        </AccordionButton>
                        <AccordionPanel>
                            <Box height={'25vh'} overflowY={'auto'}>
                                {paperData && paperData.authors.map((author, i)=>(
                                    <p key={i} style={{color: 'slategrey'}}
                                ><AuthorName authorId={author} /></p>
                                ))}
                            </Box>
                        </AccordionPanel>
                    </AccordionItem>
                    <AccordionItem>
                        <AccordionButton>
                            <Box width='100%'>
                                <Text color='black' textAlign={'left'}>Abstract</Text>
                            </Box>
                            <AccordionIcon color={'black'} />
                        </AccordionButton>
                        <AccordionPanel>
                            <Box>
                                <Textarea height={'25vh'} value={paperData && paperData.abstract} isDisabled style={{border: 'gray 1px solid'}}></Textarea>
                            </Box>
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>

                <Text textAlign={'right'}>Submitted On : <span style={{color:'green', fontWeight:'500'}}>{dateSubmitted}</span></Text>
            <div style={{width:'100%', backgroundColor:'#f8f8f8', border:'1px solid #f4f4f4', padding: '10px 30px 10px 30px',margin: 'auto', 
                borderRadius:'10px', display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap'}}>
                
                <Text style={{textWrap:'nowrap'}}><span style={{fontWeight:'700',}}>Paper Id :</span> {!paperData?'':(paperData.paperId||'none')}</Text>
                <Text style={{textWrap:'nowrap'}}><span style={{fontWeight:'700',}}>Track :</span> {!paperData?'': paperData.tracks.join(', ')}</Text>
                <Flex alignItems={'center'} direction={'row'} justifyContent={'center'} gap='10px'>
                    <h2 style={{fontWeight:'700'}} >STATUS</h2>
                    <Box bg={getStatusColor(paperData && paperData.status)} p={2} borderRadius="md">
                        <Text style={{textAlign:'center'}} color="white">{paperData && paperData.status}</Text>
                    </Box>
                </Flex>
                {/* <Heading>Reviewers</Heading>
                <Box style={{border:'1px solid #f4f4f4', width:'95%', padding: '5px',margin: '10px', borderRadius:'10px',
                    backgroundColor:"white", height:'35vh', overflowY:'auto'}}>
                    <Flex flexDirection={'column'} alignContent={'center'}>
                        {reviewerComments?(reviewerComments.map((review, key)=>(
                            <>
                                <ReviewModal key={key} num={key} review={review} />
                                {console.log('key is',key)}
                            </>
                        ))):''}
                    </Flex>
                </Box> */}
            </div>
            <br />
            <Flex style={{flexDirection:'column', width:'100%'}}>
                <h2 style={{fontWeight:'700'}} >Files Uploaded</h2>
                {
                    paperData && [...paperData.codeLink.keys()].map((k,ey)=>(
                        <Flex justifyContent={'space-between'}
                        style={{width:'80%', margin:'auto', borderRadius:'10px', 
                        border:'1px solid rgba(0,0,0,0.1)', padding:'10px 20px 10px 20px'}} key={ey}>
                        <Text style={{fontWeight:'500'}}>Version {k+1}</Text>
                        <Flex alignItems={'center'} direction={'column'} justifyContent={'space-between'}>
                            {/* <h2 style={{fontWeight:'700'}} >ATTACHMENTS</h2> */}
                            <Flex direction={'row'}>
                                <Link to={paperData&&`${apiUrl}/api/v1/reviewmodule/`+paperData.codeLink[k]}>
                                    <Button style={{float:'right'}} colorScheme='blue'>View Code</Button>
                                </Link>
                                <Link to={paperData&&`${apiUrl}/api/v1/reviewmodule/`+paperData.uploadLink[k]}>
                                    <Button style={{float:'right'}} colorScheme='blue'>View Paper</Button>
                                </Link>
                            </Flex>
                        </Flex>
                        </Flex>
                    ))

                }
            </Flex>
            </div>
        </div>
        </Container>
        </>
    )
}

export default PaperSummary