import { Heading, chakra, IconButton, Box, Container, Textarea, Text, 
    Button, RadioGroup, FormControl, Flex, Checkbox, Stack, Radio,
    useDisclosure, Modal, ModalOverlay, ModalBody, ModalContent, ModalHeader, ModalCloseButton,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, useToast,Center
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

function PaperSummary() {
    const apiUrl = getEnvironment();
    const toast = useToast();
    let [paperData, setPaperData] = useState()
    let [dateSubmitted, setDateSubmitted] = useState()
    let [screenWidth, setScreenWidth] = useState(window.innerWidth)
    setInterval(()=>{if(screenWidth != window.innerWidth) setScreenWidth(window.innerWidth)},500)
        
    useEffect(()=> {wrapper(setPaperData)},[])

    useEffect(()=>{
        if(paperData){
            let d = new Date(paperData.updatedAt).toLocaleString()
            setDateSubmitted(d)
        }
    },[paperData])
    const deleteFile = async (version) => {
        console.log(`Deleting ${version}`);
            try {
                const response = await fetch(
                `${apiUrl}/api/v1/reviewmodule/uploads/delete/`+version,
                {
                    method: "GET",
                    credentials: "include",
                }
                );
                const toastStatus = response.ok ? 'success' : 'error';
                const toastDescription = response.ok ? 'File Deleted Successfully.' : 'Unable to delete the file.';
        
                toast({
                    title: toastStatus === 'success' ? 'File Deleted.' : 'Error.',
                    description: toastDescription,
                    status: toastStatus,
                    duration: 5000,
                    isClosable: true,
                });
            } catch (error) {
                toast({
                    title: 'Error.',
                    description: error.message || 'An unexpected error occurred.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
    };
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

    const reviewLinkMaker = (currlink)=>{
        let newLink = JSON.parse(JSON.stringify(currlink.split('/')))
        newLink.pop(); newLink.push('reviews')
        return newLink.join('/')
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
            </div>
            <br />
            {
                !paperData?'':
                (paperData.status==='Completed'?(
                    <Center>
                        <Text style={{fontWeight:'700',}}>
                            View Paper Reviews :
                        </Text>
                        <Link to = {reviewLinkMaker(location.pathname)}>
                            <Button colorScheme='blue' >Reviews</Button>
                        </Link>
                    </Center>
                ):'')
            }
            <Flex style={{flexDirection:'column', width:'100%', padding:'15px'}}>
                <h2 style={{fontWeight:'700', padding:'15px'}} >Files Uploaded</h2>
                {
                    paperData && [...paperData.codeLink.keys()].map((k,ey)=>(
                        <Flex justifyContent={'space-between'}
                        style={{width:'80%', margin:'auto', borderRadius:'10px', 
                        border:'1px solid rgba(0,0,0,0.1)', padding:'10px 20px 10px 20px'}} key={ey}>
                        <Text style={{fontWeight:'500'}}>Version {k+1}</Text>
                        <Flex alignItems={'center'} direction={'column'} justifyContent={'space-between'}>
                            {/* <h2 style={{fontWeight:'700'}} >ATTACHMENTS</h2> */}
                            <Flex direction={'row'}>
                                <Link target="_blank" to={paperData&&`${apiUrl}/api/v1/reviewmodule/uploads/`+paperData.codeLink[k]}>
                                    <Button style={{float:'right'}} colorScheme='blue'>View Code</Button>
                                </Link>
                                <Link target="_blank" to={paperData&&`${apiUrl}/api/v1/reviewmodule/uploads/`+paperData.uploadLink[k]}>
                                    <Button style={{float:'right'}} colorScheme='blue'>View Paper</Button>
                                </Link>
                            </Flex>
                            {/* Added Delete Buttons */}
                            <Flex direction={'row'} mt={2}>
                                <Button colorScheme='red' onClick={() => deleteFile(paperData.codeLink[k])}>Delete Code</Button>
                                <Button colorScheme='red' onClick={() => deleteFile(paperData.uploadLink[k])}>Delete Paper</Button>
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