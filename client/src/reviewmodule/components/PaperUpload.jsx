import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';

function PaperUpload({ setNext }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(() => {
    setNext(paper.paperUploads.length == 0);
  }, [paper.paperUploads]);

  const [selectedFiles, setSelectedFiles] = useState(null);
  console.log(selectedFiles);
  console.log(selectedFiles);
  useEffect(() => {
    if (paper.paperUploads && paper.paperUploads.length > 0) {
      setSelectedFiles(paper.paperUploads);
    }
  }, [paper.paperUploads]);

  function handleChange(e) {
    const selectedFile = selectedFiles + e.target.files;

    setPaper({
      ...paper,
      paperUploads: selectedFile,
    });
  }
  return (
    <div>
  <div className="tw-font-bold tw-text-xl tw-pt-10">PaperUpload</div>
  <div className="tw-flex  tw-gap-5 tw-p-20 tw-container tw-mx-auto tw-py-10">
    <label>{`Upload Files: `}</label>
    <input type="file" name="file" multiple onChange={handleChange} />
  </div>
  {/* <div>
    {paper && paper.paperUploads && paper.paperUploads.length>0 && paper.paperUploads.map((index, file) => <p key={index}>hi</p>)}
  </div> */}
</div>

  );
}

// function File({file}){
//   return <div>{file}</div>
// }

export default PaperUpload;
