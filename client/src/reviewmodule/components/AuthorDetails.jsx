import React, { useEffect, useState } from 'react';
import { paperState } from './../state/atoms/paperState';
// import { Box, Button, Modal, Typography } from '@mui/material';
import AuthorForm from './AuthorForm';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Button } from '@chakra-ui/react';

export default function AuthorDetails({ setNext, handleNext, handlePrevious }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(() => {
    setNext(paper.authors.length == 0);
  }, [paper.authors.length]);

  function handleRemove(order) {
    setPaper((prevPaper) => ({
      ...prevPaper,
      authors: prevPaper.authors.filter((author) => author.order !== order),
    }));
  }
  return (
    <>
      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-4 tw-py-10">
        <h1 className="tw-font-bold tw-text-xl">Author Details</h1>
        <table className="tw-border-2 tw-border-slate-400 tw-mx-auto tw-text-slate-600">
          <tr className=" tw-border-2 tw-border-slate-400 tw-mx-auto tw-text-slate-600">
            <th className="tw-border-2 tw-border-slate-400 ">Order</th>
            <th className="tw-border-2 tw-border-slate-400 ">Remove</th>
            <th className="tw-border-2 tw-border-slate-400 ">Name</th>
            <th className="tw-border-2 tw-border-slate-400 ">Email</th>
            <th className="tw-border-2 tw-border-slate-400 ">Designation</th>
            <th className="tw-border-2 tw-border-slate-400 ">Institute</th>
          </tr>
          {paper.authors &&
            paper.authors.map((author) => (
              <Item
                author={author}
                key={author.order}
                handleRemove={handleRemove}
              />
            ))}
        </table>
        <div className="tw-px-50">
          <AuthorForm />
        </div>
        <div className="tw-flex tw-justify-between">
          <Button onClick={handlePrevious}>Back</Button>
          <Button onClick={()=>handleNext(paper.authors)}>Next</Button>
        </div>
      </div>
    </>
  );
}

function Item({ author, handleRemove }) {
  return (
    <tr className="tw-border-2 tw-border-slate-400 tw-mx-auto tw-text-slate-600">
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">
        {author.order}
      </td>
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">
        <p
          className="tw-cursor-pointer tw-text-red-700 hover:tw-underline "
          onClick={() => handleRemove(author.order)}
        >
          Remove
        </p>
      </td>
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">{author.name}</td>
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">
        {author.email}
      </td>
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">
        {author.designation}
      </td>
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">
        {author.institute}
      </td>
    </tr>
  );
}
