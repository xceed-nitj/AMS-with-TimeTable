import React, { useEffect, useState } from 'react';
import { paperState } from './../state/atoms/paperState';
import { Box, Button, Modal, Typography } from '@mui/material';
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
      <div className="flex flex-col justify-center gap-4 py-10">
        <h1 className="font-bold text-xl">Author Details</h1>
        <table>
          <tr className=" border-2 border-slate-400 mx-auto text-slate-600">
            <th>Order</th>
            <th>Remove</th>
            <th>Name</th>
            <th>Email</th>
            <th>Designation</th>
            <th>Institute</th>
          </tr>
          {paper.authors &&
            paper.authors.map((author) => <Item author={author} />)}
        </table>
        <div className="px-50">
          <AuthorForm />
        </div>
      </div>
    </>
  );
}

function Item({ author }) {
  return (
    <tr className=" border-2 border-slate-400 mx-auto text-slate-600 ">
      <td className="border-2 border-slate-400 pl-2">{author.order}</td>
      <td className="border-2 border-slate-400 pl-2">
        <p className="cursor-pointer">Remove</p>
      </td>
      <td className="border-2 border-slate-400 pl-2">{author.name}</td>
      <td className="border-2 border-slate-400 pl-2">{author.email}</td>
      <td className="border-2 border-slate-400 pl-2">{author.designation}</td>
      <td className="border-2 border-slate-400 pl-2">{author.institute}</td>
    </tr>
  );
}
