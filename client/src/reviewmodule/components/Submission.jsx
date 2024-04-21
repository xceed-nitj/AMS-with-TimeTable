import React from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';

function Submission({ setNext }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);
  return (
    <div>
      <hr className= "tw-mt-10"/>
      <p className="tw-text-xl tw-pt-10">Review:</p>
      {/* Author Details */}
      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-4 tw-pt-10">
        <h1 className="tw-font-bold tw-text-xl">Author Details</h1>
        <table className="tw-text-slate-600">
          <tr className="tw-border-2 tw-border-slate-400 tw-mx-auto ">
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
      </div>
      <hr className= "tw-p-10" />
      {/* Paper Details */}
      <div className="tw-pt-20">
        <h1 className="tw-font-bold tw-text-xl">Paper Details</h1>
        <form className="tw-flex tw-flex-col tw-gap-2 tw-p-20 tw-pt-10 tw-w-full">
          <label className="tw-font-semibold">Title:</label>
          <div>
            <input
              disabled
              value={paper.paperDetails.title || ''}
              className="tw-w-full tw-p-1"
            />
          </div>
          <label className="tw-font-semibold">Abstract:</label>
          <div>
            <textarea
              disabled
              value={paper.paperDetails.abstract || ''}
              className="tw-w-full tw-p-1"
            />
          </div>
        </form>
      </div>
      <hr className= "tw-p-10" />
      {/* Code Details */}
      <h1 className="tw-font-bold tw-text-xl">CodeUploads</h1>
      <div className="tw-flex tw-flex-col tw-gap-5 tw-p-20 tw-container tw-mx-auto tw-py-10">
        {/* {paper.codeUploads.map((_, index) => (
          <div key={index} className="tw-flex tw-gap-5">
            {paper.codeUploads[index].name}
          </div>
        ))} */}
      </div>
      <hr className= "tw-p-10"/> 
      <h1 className="tw-font-bold tw-text-xl">PaperUploads</h1>
      <div
        className="tw-flex tw-flex-col tw-gap-5 tw-p-20 
      tw-py-10 tw-container tw-mx-auto"
      >
        {/* {paper.paperUploads.map((_, index) => (
          <div key={index} className="tw-flex tw-gap-5">
            {paper.paperUploads[index].name}
          </div>
        ))} */}
      </div>
    </div>
  );
}
function Item({ author }) {
  return (
    <tr className="tw-border-2 tw-border-slate-400 tw-mx-auto">
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

export default Submission;
