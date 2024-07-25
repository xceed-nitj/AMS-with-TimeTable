import { Container, Box, Input, Table, Thead, Tbody, Tr, Th, Td, Button, Text, Spinner, Center } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Header from '../../components/header';
import getEnvironment from '../../getenvironment';


async function getData(setPaperData){
    const apiUrl = getEnvironment();
    
    try {
        const User = await fetch(`${apiUrl}/user/getuser`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        const userdetails = await User.json();
        const id = userdetails.user._id;

        const response = await fetch(
            `${apiUrl}/api/v1/reviewmodule/paper/author/${id}`,
            {
                method:'GET',
                credentials: 'include'
            }
        )
        if (response.ok) {
            const data = await response.json();
            if(data){
                setPaperData(data)
            }
            else return false
        } else {
            console.error("Error fetching papers:", response.statusText);
        }
    }
    catch(e) {return false}
}

function DynamicTable(props) {
    let [pageNo, setPageNo] = useState(1)
    const pageItems = 4 // max number of items in a page
    const numberOfPages = Math.floor(props.papers.length/pageItems) + (props.papers.length%pageItems ? 1 : 0) // it gives total number of possible pages

    let itemsInPage = (pageno) => (pageno === numberOfPages)? (props.papers.length+1 % pageItems) : pageItems // it gives number of items in current page

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

    function pageFilter(papers) {
        let pageEvents = []
        for(let i = 0; i < props.papers.length; i++)
            if((i+1 > (pageItems*(pageNo-1))) && (i+1 <= ((pageItems*(pageNo-1)) + itemsInPage(pageNo))))
                pageEvents.push(papers[i])
        return pageEvents
    }

    return(
        <>
        <div>
            <div style={{overflow:'auto', display:'block'}}>
                <Table variant="striped" mt={8}>
                    <Thead>
                        <Tr>
                            <Th>TITLE</Th>
                            <Th>STATUS</Th>
                            <Th>LINK</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {pageFilter(props.papers).map((paper, i)=>(
                            <Tr key={i}>
                                <Td style={{textWrap:'nowrap'}}>{paper.title}</Td>   
                                <Td>
                                    <Box bg={getStatusColor(paper.status)} p={2} borderRadius="md">
                                    <Text color="white" style={{textWrap:'nowrap', textAlign:"center"}}>{paper.status}</Text>
                                    </Box>
                                </Td>
                                <Td>
                                    <Link style={{textDecoration:'underline', color:'#009688'}} to={`/prm/${paper.eventId}/${paper._id}/summary`}>
                                        View Paper
                                    </Link><br/>
                                    <Link style={{textDecoration:'underline', color:'#009688'}} to={`/prm/${paper.eventId}/author/newpaper?pid=${paper._id}`}>
                                        Modify Paper
                                    </Link>
                                </Td>   
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>
            <br/>
            {numberOfPages > 1 ? (
                <div
                    style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}
                >
                    <Button colorScheme='blue' isDisabled={(pageNo === 1)} onClick={() => setPageNo(pageNo - 1)}>Previous</Button>
                    <p style={{color: 'slategrey'}}>Page {pageNo} out of {numberOfPages}</p>
                    <Button colorScheme='blue' isDisabled={(pageNo === numberOfPages)} onClick={() => setPageNo(pageNo + 1)}>Next</Button>
                </div>
            ) : ''}
        </div>
        </>
    )
}

function SubmittedPapers() {

    let [searchQuery, setSearchQuery] = useState('')
    let [paperData, setPaperData] = useState()

    const handleChange = (e)=> setSearchQuery(e.target.value)

    useEffect(()=>{
        getData(setPaperData)
    },[])

    function PaperFilter(papers) {
        if (!searchQuery) return papers
        return papers.filter(paper => paper.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return(
        <>
            <Container
        style={{maxWidth:'80vw'}}
        >
            <Header title="Submitted Papers" />
            <Box maxW="xl" mx="auto" mt={10}>
                <Input
                    type='text'
                    placeholder='Search Papers'
                    id='searchQuery'
                    value={searchQuery}
                    onChange={handleChange}
                />
                {
                    paperData ? (
                        (PaperFilter(paperData).length)?(
                            <DynamicTable papers={PaperFilter(paperData)}/>
                        ):(
                            <p style={{color: 'slategrey', textAlign:'center'}}><br/>No papers found...</p>
                        )
                    ): (
                        <>
                        <br /><br /><Center><Spinner/></Center>
                        </>
                    )
                }
            </Box>
        </Container>
        </>
    )
}

export default SubmittedPapers