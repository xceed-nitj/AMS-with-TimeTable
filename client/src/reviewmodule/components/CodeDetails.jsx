import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button } from '@chakra-ui/react';

function CodeDetails({ setNext ,handleNext, handlePrevious}) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(() => {
    setNext(false);
  }, []);

  const [selectedFiles, setSelectedFiles] = useState(
    Array.from({ length: 5 }, () => null)
  );

  useEffect(() => {
    if (paper.codeUploads && paper.codeUploads.length > 0) {
      setSelectedFiles(paper.codeUploads);
    }
  }, [paper.codeUploads]);

  function handleChange(index, e) {
    const selectedFile = e.target.files[0];
    const updatedFiles = [...selectedFiles];
    updatedFiles[index] = selectedFile;
    setSelectedFiles(updatedFiles);

    setPaper({
      ...paper,
      codeUploads: updatedFiles.filter((file) => file !== null),
    });
  }
  return (
    <div>
      <div className="tw-font-bold tw-text-xl tw-pt-10">CodeDetails</div>
      <div className="tw-flex  tw-gap-5 tw-p-20 tw-container tw-mx-auto tw-py-10">
        <label>{`Upload Files: `}</label>
        <input type="file" name="file" multiple onChange={handleChange} />
      </div>
      <div className="tw-flex tw-justify-between">
        <Button onClick={handlePrevious}>Back</Button>
        <Button onClick={()=>handleNext(paper.codeUploads)}>Next</Button>
      </div>
      {/* <div>
    {paper && paper.paperUploads && paper.paperUploads.length>0 && paper.paperUploads.map((index, file) => <p key={index}>hi</p>)}
  </div> */}
    </div>
  );
}

export default CodeDetails;
