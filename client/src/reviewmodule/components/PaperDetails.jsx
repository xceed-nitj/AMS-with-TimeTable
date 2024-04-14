import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { paperState } from "./../state/atoms/paperState";

function PaperDetails({setNext}) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);
  
  useEffect(() => {
    // Check if both title and abstract fields have values
    setNext(!(paper.paperDetails.title && paper.paperDetails.abstract));
  }, [paper.paperDetails.title, paper.paperDetails.abstract]);

  function handleChange(e) {
    setPaper({
      ...paper,
      paperDetails: { ...paper.paperDetails, [e.target.id]: e.target.value },
    });
  }

  return (
    <>
      <div className="font-bold text-xl">PaperDetails</div>
      <form className="flex flex-col gap-2 p-20 mx-auto w-[600px] py-10">
        <div className="flex justify-between">
          <label>Title:</label>
          <p>{(paper.paperDetails.title || "").length}/300</p>
        </div>
        <div>
          <input
            id="title"
            value={paper.paperDetails.title || ""}
            maxLength={300}
            onChange={handleChange}
            className="w-full p-1"
          />
        </div>
        <div className="flex justify-between pt-5">
          <label>Abstract:</label>
          <p>{(paper.paperDetails.abstract || "").length}/1500</p>
        </div>
        <textarea
          id="abstract"
          value={paper.paperDetails.abstract || ""}
          maxLength={1500}
          onChange={handleChange}
          className="p-1"
        />
      </form>
    </>
  );
}

export default PaperDetails;
