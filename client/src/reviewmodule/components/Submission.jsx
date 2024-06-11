import React from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button } from '@chakra-ui/react';

function Submission({ activeStep, setActiveStep, handlePrevious, handleSubmit }) {
  const [paper, setPaper] = useRecoilState(paperState);

  const handleEditClick = (step) => {
    setActiveStep(step);
  };

  return (
    <div>
      <hr className="tw-mt-10" />
      <p className="tw-pt-10 tw-text-2xl tw-font-bold">Review:</p>
      {/* Author Details */}
      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-4 tw-pt-10">
        <h1 className="tw-font-semibold tw-text-xl">Author Details</h1>
        <Button
          className="tw-max-w-20 tw-self-end"
          onClick={() => handleEditClick(0)}
        >
          Edit
        </Button>
        <table className="tw-text-slate-600">
          <thead>
            <tr className="tw-border-2 tw-border-slate-400 tw-mx-auto ">
              <th>Order</th>
              <th>Name</th>
              <th>Email</th>
              <th>Designation</th>
              <th>Institute</th>
            </tr>
          </thead>
          <tbody>
            {/* Render author items */}
            {paper.authors &&
              paper.authors.map((author) => (
                <Item key={author.email} author={author} />
              ))}
          </tbody>
        </table>
      </div>
      <hr className="tw-p-5" />
      {/* Paper Details */}
      <div className="tw-pt-0 tw-flex tw-flex-col">
        <h1 className="tw-font-semibold tw-text-xl">Paper Details</h1>
        <Button
          className="tw-max-w-20 tw-self-end"
          onClick={() => handleEditClick(1)}
        >
          Edit
        </Button>
        <form className="tw-flex tw-flex-col tw-gap-2 tw-p-5 tw-w-full">
        <label className="tw-font-semibold">Title:</label>
        <div>
    <textarea
      disabled
      value={paper.title || ''}
      className="tw-w-full tw-p-1"
      style={{ maxWidth: '100%', wordWrap: 'break-word' }}
      />
   
  </div>
  <label className="tw-font-semibold">Abstract:</label>
  <div>
    <textarea
      disabled
      value={paper.abstract || ''}
      className="tw-w-full tw-p-1"
      style={{ maxWidth: '100%', wordWrap: 'break-word' }}
      />
   
  </div>
</form>

      </div>
      <hr className="tw-p-5" />
      {/* Code Details */}
      <div className="tw-pt-0 tw-flex tw-flex-col">
        <h1 className="tw-font-semibold tw-text-xl">Code Uploads</h1>
        <Button
          className="tw-max-w-20 tw-self-end"
          onClick={() => handleEditClick(2)}
        >
          Edit
        </Button>
        <div className="tw-flex tw-flex-col tw-gap-5 tw-p-5 tw-container tw-mx-auto ">
          {paper.codeUploads && paper.codeUploads.map((code, index) => (
            <div key={index} className="tw-flex tw-gap-5">
              {code.name}
            </div>
          ))}
        </div>
      </div>
      <hr className="tw-p-5" />
      {/* Paper Uploads */}
      <div className="tw-pt-0 tw-flex tw-flex-col">
        <h1 className="tw-font-semibold tw-text-xl">Paper Uploads</h1>
        <Button
          className="tw-max-w-20 tw-self-end"
          onClick={() => handleEditClick(3)}
        >
          Edit
        </Button>
        <div className="tw-flex tw-flex-col tw-gap-5 tw-p-5 tw-container tw-mx-auto">
          {paper.paperUploads && paper.paperUploads.map((paperUpload, index) => (
            <div key={index} className="tw-flex tw-gap-5">
              {paperUpload.name}
            </div>
          ))}
        </div>
      </div>
      <div className="tw-flex tw-justify-between tw-mt-10">
        <Button onClick={handlePrevious}>Back</Button>
        <Button onClick={handleSubmit} colorScheme='blue'>Submit</Button>
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
