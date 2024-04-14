import React from "react";
import { useRecoilState } from "recoil";
import { paperState } from "./../state/atoms/paperState";

function Submission({ setNext }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);
  return (
    <div>
      <p className="text-xl pt-10">Review:</p>
      {/* Author Details */}
      <div className="flex flex-col justify-center gap-4 pt-10">
        <h1 className="font-bold text-xl">Author Details</h1>
        <table className="text-slate-600">
          <tr className=" border-2 border-slate-400 mx-auto ">
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
      {/* Paper Details */}
      <div className="pt-20">
        <h1 className="font-bold text-xl">Paper Details</h1>
        <form className="flex flex-col gap-2 p-20 pt-10 w-[800px]">
          <label className="font-semibold">Title:</label>
          <div>
            <input disabled value={paper.paperDetails.title || ""} />
          </div>
          <label className="font-semibold">Abstract:</label>
          <div>
            <textarea disabled value={paper.paperDetails.abstract || ""} />
          </div>
        </form>
      </div>

      {/* Code Details */}
      <h1 className="font-bold text-xl">CodeUploads</h1>
      <div className="flex flex-col gap-5 p-20 container mx-auto py-10">
        {paper.codeUploads.map((_, index) => (
          <div key={index} className="flex gap-5">
            {paper.codeUploads[index].name}
          </div>
        ))}
      </div>
      <h1 className="font-bold text-xl">PaperUploads</h1>
      <div
        className="flex flex-col gap-5 p-20 
      py-10 container mx-auto"
      >
        {paper.paperUploads.map((_, index) => (
          <div key={index} className="flex gap-5">
            {paper.paperUploads[index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
function Item({ author }) {
  return (
    <tr className=" border-2 border-slate-400 mx-auto">
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

export default Submission;
