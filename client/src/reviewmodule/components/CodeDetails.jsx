import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { paperState } from "./../state/atoms/paperState";

function CodeDetails({setNext}) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(()=>{
    setNext(false);
  },[])

  const [selectedFiles, setSelectedFiles] = useState(
    Array.from({ length: 5 }, () => null),
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
      <div className="font-bold text-xl">CodeDetails</div>
      <div className="flex flex-col gap-5 p-20 py-10 container mx-auto">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex gap-5">
            <label>{`Upload File ${index + 1}: `}</label>
            <input
              type="file" name="file"
              onChange={(e) => handleChange(index, e)}
              // value={selectedFiles[index] || ""}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CodeDetails;
