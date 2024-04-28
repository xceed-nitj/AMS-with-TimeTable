import React, { useEffect, useState } from 'react';
import { paperState } from './../state/atoms/paperState';
// import { Box, Button, Modal, Typography } from '@mui/material';
import AuthorForm from './AuthorForm';
import { useRecoilState, useRecoilValue } from 'recoil';

export default function AuthorDetails({ setNext }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(() => {
    setNext(paper.authors.length == 0);
  }, [paper.authors.length]);
  return (
    <>
      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-4 tw-py-10">
        <h1 className="tw-font-bold tw-text-xl">Author Details</h1>
        <table className="tw-border-2 tw-border-slate-400 tw-mx-auto tw-text-slate-600">
          <tr className=" tw-border-2 tw-border-slate-400 tw-mx-auto tw-text-slate-600">
            <th className='tw-border-2 tw-border-slate-400 '>Order</th>
            <th className='tw-border-2 tw-border-slate-400 '>Remove</th>
            <th className='tw-border-2 tw-border-slate-400 '>Name</th>
            <th className='tw-border-2 tw-border-slate-400 '>Email</th>
            <th className='tw-border-2 tw-border-slate-400 '>Designation</th>
            <th className='tw-border-2 tw-border-slate-400 '>Institute</th>
          </tr>
          {paper.authors &&
            paper.authors.map((author) => <Item author={author} />)}
        </table>
        <div className="tw-px-50">
          <AuthorForm />
        </div>
      </div>
    </>
  );
}

function Item({ author }) {
  return (
    <tr className="tw-border-2 tw-border-slate-400 tw-mx-auto tw-text-slate-600">
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">
        {author.order}
      </td>
      <td className="tw-border-2 tw-border-slate-400 tw-pl-2">
        <p className="tw-cursor-pointer">Remove</p>
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
