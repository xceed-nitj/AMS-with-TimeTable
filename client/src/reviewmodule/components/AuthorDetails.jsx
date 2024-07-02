import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from './../state/atoms/paperState';
import AuthorForm from './AuthorForm';
import { Button, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, 
  AlertDialogBody, AlertDialogFooter, Center, Text} from '@chakra-ui/react'
import  {Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer} from '@chakra-ui/table';
import { FaTimes } from 'react-icons/fa'; // Import the close icon from FontAwesome
import { Link } from 'react-router-dom';

export default function AuthorDetails({ setNext, handleNext, handlePrevious }) {
  const [paper, setPaper] = useRecoilState(paperState);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isTableEmptyDialogOpen, setIsTableEmptyDialogOpen] = useState(false);

  useEffect(() => {
    const areAtLeastTwoAuthorsFilled = paper.pseudo_authors.length >= 2 && paper.pseudo_authors.slice(1).every(author =>
      Object.values(author).every(value => value !== "")
    );
    setIsNextEnabled(areAtLeastTwoAuthorsFilled);
  }, [paper.pseudo_authors]);

  useEffect(() => {
    setNext(isNextEnabled);
  }, [isNextEnabled, setNext]);

  function handleRemove(order,id) {

    setPaper(prevPaper => ({
      ...prevPaper,
      pseudo_authors: prevPaper.pseudo_authors.filter(author => author.order !== order),
    }));
  }

  async function handleAddAuthor(newAuthor) { 
    //console.log(newAuthor);
    setPaper(prevPaper => ({
      ...prevPaper,
      pseudo_authors: [...prevPaper.pseudo_authors, newAuthor],
    }));
  }

  const handleNextClick = () => {
    if (paper.pseudo_authors.length === 0) {
      setIsTableEmptyDialogOpen(true);
    } else {
      handleNext(paper);
    }
  };

  const handleCloseTableEmptyDialog = () => {
    setIsTableEmptyDialogOpen(false);
  };

  function SortedAuthors(unsorted) {
    let keySet = []
    for (let j = 0; j<unsorted.length; j++) {
      keySet.push(parseInt(unsorted[j].order))
    }
    keySet.sort(function(a, b){return a - b})
    let sortedAuthors = []
    for (let k = 0; k < keySet.length; k++){
      for (let o =0; o<unsorted.length;o++){
        if(unsorted[o].order == keySet[k]) sortedAuthors.push(unsorted[o])
        }
    }
    return sortedAuthors
  }

  return (
    <>
      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-4 tw-py-10">
        <h1 className="tw-font-bold tw-text-xl tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 tw-width tw-w-fit tw-m-auto"
          style={{color:'transparent', backgroundClip: 'text', fontSize:'xx-large'}} //matched the styling on the heading with tailwind button styling
        >Author Details</h1>

        <div className="tw-px-50">
          <AuthorForm edit={false} onAddAuthor={handleAddAuthor} txt='Add Author +' colorScheme='green' />
        </div>
        <TableContainer>
          <Table
            variant='striped'
            maxWidth='100%'
            size='md'
            mt='1'
          >
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Designation</Th>
                <Th>Institute</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
            {/*console.log(paper)*/}
            {SortedAuthors(paper.pseudo_authors).map(author => (
              <ItemChakraUI
              author={author}
              key={author.order}
              handleRemove={handleRemove}
              />
            ))}
            </Tbody>
          </Table>
        </TableContainer>

          {(paper.pseudo_authors.length)?(''):(
            <p
              style={{color: 'slategrey', textAlign:'center'}}
            >Please Enter Author Details to continue...</p>
          )}
        <div className="tw-flex tw-justify-end">
  {/* <Button onClick={handlePrevious}>Back</Button> */}
  {/* <Button onClick={handleNextClick} disabled={!isNextEnabled} colorScheme='blue'>Next</Button> */}
  <Link
  onClick={handleNextClick}
  disabled={!isNextEnabled}
  className="tw-m-auto tw-px-8 tw-text-white tw-bg-gradient-to-r tw-from-cyan-600 tw-to-cyan-500 hover:tw-bg-gradient-to-bl focus:tw-ring-4 focus:tw-outline-none focus:tw-ring-cyan-300 dark:focus:tw-ring-cyan-800 tw-font-bold tw-rounded-lg tw-text-sm tw-px-5 tw-py-2.5 tw-text-center"
  >Next</Link>
</div>

      </div>
      <AlertDialog
        isOpen={isTableEmptyDialogOpen}
        onClose={handleCloseTableEmptyDialog}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>No Authors</AlertDialogHeader>
          <AlertDialogBody>Please add at least one author.</AlertDialogBody>
          <AlertDialogFooter>
            <Button colorScheme="blue" onClick={handleCloseTableEmptyDialog}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Item({ author, handleRemove }) {
  const [itemHover, SetItemHover] = useState(false)
  return (
    <tr>
      <td style={{ maxWidth: '100px', whiteSpace: 'normal', wordWrap: 'break-word', 
        backgroundColor: ((itemHover)?'#ff7a7a33':'white')    // this is to make the elements flash red if you hover on close button
        }}>{author.order}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' ,
        backgroundColor: ((itemHover)?'#ff7a7a33':'white') 
      }}>{author.name}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' ,
        backgroundColor: ((itemHover)?'#ff7a7a33':'white') 
      }}>{author.email}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' ,
        backgroundColor: ((itemHover)?'#ff7a7a33':'white') 
      }}>{author.designation}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' ,
        backgroundColor: ((itemHover)?'#ff7a7a33':'white') 
      }}>{author.institute}</td>
      <td className="tw-border-0">
        <FaTimes
          onMouseEnter={()=>{SetItemHover(true)}}
          onMouseLeave={()=>{SetItemHover(false)}}
          className="tw-cursor-pointer tw-bg-gray-200 hover:tw-underline tw-border-0 tw-text-blue"
          onClick={() => handleRemove(author.order)}
        />
      </td>
    </tr>
  );
}

function ItemChakraUI(props) {
  return (
    <>
      <Tr>
        <Td><Center>
          {props.author.order}
        </Center></Td>
        <Td><Center>
          {props.author.name}
        </Center></Td>
        <Td><Center>
          {props.author.email}
        </Center></Td>
        <Td><Center>
          {props.author.designation}
        </Center></Td>
        <Td><Center>
          {props.author.institute}
        </Center></Td>
        <Td>
          {/* <CustomDeleteButton
              onClick={()=>{props.handleRemove(props.author.order)}}
          >Delete</CustomDeleteButton> */}
          <AuthorForm txt='Edit' colorScheme='blue' 
            edit={props.author}
          />
          <Button colorScheme='red' onClick={()=>{props.handleRemove(props.author.order)}}>Delete</Button>
          </Td>
      </Tr>
    </>
  )
}