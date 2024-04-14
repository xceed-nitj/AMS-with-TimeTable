import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { paperState } from "./../state/atoms/paperState";

function PaperUpload({setNext}) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(()=>{
    setNext(paper.paperUploads.length==0);
  },[paper.paperUploads])

  const [selectedFiles, setSelectedFiles] = useState(
    Array.from({ length: 5 }, () => null),
  );

  useEffect(() => {
    if (paper.paperUploads && paper.paperUploads.length > 0) {
      setSelectedFiles(paper.paperUploads);
    }
  }, [paper.paperUploads]);

  function handleChange(index, e) {
    const selectedFile = e.target.files[0];
    const updatedFiles = [...selectedFiles];
    updatedFiles[index] = selectedFile;
    setSelectedFiles(updatedFiles);

    setPaper({
      ...paper,
      paperUploads: updatedFiles.filter((file) => file !== null),
    });
  }
  return (
    <div>
      <div className="font-bold text-xl">PaperUpload</div>
      <div className="flex flex-col gap-5 p-20 container mx-auto py-10">
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

export default PaperUpload;
