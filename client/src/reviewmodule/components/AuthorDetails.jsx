import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from './../state/atoms/paperState';
import AuthorForm from './AuthorForm';
import { Button, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from '@chakra-ui/react';
import { FaTimes } from 'react-icons/fa'; // Import the close icon from FontAwesome

export default function AuthorDetails({ setNext, handleNext, handlePrevious }) {
  const [paper, setPaper] = useRecoilState(paperState);
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isTableEmptyDialogOpen, setIsTableEmptyDialogOpen] = useState(false);

  useEffect(() => {
    const areAtLeastTwoAuthorsFilled = paper.authors.length >= 2 && paper.authors.slice(1).every(author =>
      Object.values(author).every(value => value !== "")
    );
    setIsNextEnabled(areAtLeastTwoAuthorsFilled);
  }, [paper.authors]);

  useEffect(() => {
    setNext(isNextEnabled);
  }, [isNextEnabled, setNext]);

  function handleRemove(order) {
    setPaper(prevPaper => ({
      ...prevPaper,
      authors: prevPaper.authors.filter(author => author.order !== order),
    }));
  }

  function handleAddAuthor(newAuthor) {
    setPaper(prevPaper => ({
      ...prevPaper,
      authors: [...prevPaper.authors, newAuthor],
    }));
  }

  const handleNextClick = () => {
    if (paper.authors.length === 0) {
      setIsTableEmptyDialogOpen(true);
    } else {
      handleNext(paper);
    }
  };

  const handleCloseTableEmptyDialog = () => {
    setIsTableEmptyDialogOpen(false);
  };

  return (
    <>
      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-4 tw-py-10">
        <h1 className="tw-font-bold tw-text-xl">Author Details</h1>
        <table className="tw-border-0 tw-border-slate-400 tw-mx-auto tw-text-slate-600">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Email</th>
              <th>Designation</th>
              <th>Institute</th>
            </tr>
          </thead>
          <tbody>
            {paper.authors.map(author => (
              <Item
                author={author}
                key={author.order}
                handleRemove={handleRemove}
              />
            ))}
          </tbody>
        </table>
        <div className="tw-px-50">
          <AuthorForm onAddAuthor={handleAddAuthor} />
        </div>
        <div className="tw-flex tw-justify-end">
  {/* <Button onClick={handlePrevious}>Back</Button> */}
  <Button onClick={handleNextClick} disabled={!isNextEnabled} colorScheme='blue'>Next</Button>
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
  return (
    <tr>
      <td style={{ maxWidth: '100px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{author.order}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{author.name}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{author.email}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{author.designation}</td>
      <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{author.institute}</td>
      <td className="tw-border-0">
        <FaTimes
          className="tw-cursor-pointer tw-bg-gray-200 hover:tw-underline tw-border-0 tw-text-blue"
          onClick={() => handleRemove(author.order)}
        />
      </td>
    </tr>
  );
}
