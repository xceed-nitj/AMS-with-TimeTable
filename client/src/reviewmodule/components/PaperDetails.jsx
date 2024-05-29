import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button } from '@chakra-ui/react';

function PaperDetails({ setNext, handleNext, handlePrevious }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(() => {
    // Check if both title and abstract fields have values
    setNext(!(paper.title && paper.abstract));
  }, [paper.title, paper.abstract]);

  function handleChange(e) {
    const { id, value } = e.target;
    setPaper((prevPaper) => ({
      ...prevPaper,
      [id]: value,
    }));
  }

  return (
    <>
      <div className="tw-font-bold tw-text-xl tw-pt-10">PaperDetails</div>
      <form className="tw-flex tw-flex-col tw-gap-2 tw-p-20 tw-mx-auto tw-w-[600px] tw-py-10">
        <div className="tw-flex tw-justify-between">
          <label>Title:</label>
          <p>{(paper.title || '').length}/300</p>
        </div>
        <div>
          <input
            id="title"
            value={paper.title || ''}
            maxLength={300}
            onChange={handleChange}
            className="tw-w-full tw-p-1 tw-bg-slate-100 tw-rounded-md"
          />
        </div>
        <div className="tw-flex tw-justify-between tw-pt-5 ">
          <label>Abstract:</label>
          <p>{(paper.abstract || '').length}/1500</p>
        </div>
        <textarea
          id="abstract"
          value={paper.abstract || ''}
          maxLength={1500}
          onChange={handleChange}
          className="tw-p-1 tw-bg-slate-100 tw-rounded-md"
        />
      </form>
      <div className="tw-flex tw-justify-between">
        <Button onClick={handlePrevious}>Back</Button>
        <Button onClick={() => handleNext(paper)}>Next</Button>
      </div>
    </>
  );
}

export default PaperDetails;
