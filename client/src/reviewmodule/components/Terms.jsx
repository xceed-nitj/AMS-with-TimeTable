import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { paperState } from "./../state/atoms/paperState";

export default function Terms({ setNext }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(()=>{
    setNext(!paper.terms);
  },[paper.terms]);

  function handleChange(e) {
    setPaper({ ...paper, terms: !paper.terms });
  }
  return (
    <>
      <div className="font-bold text-xl">Terms and Conditions</div>
      <div className="flex flex-col gap-5 px-5 py-10">
        {/* <p className="text-xl pt-10 font-bold">Terms and Conditions:</p> */}
        <ol>
          <li>
            Accuracy of Materials: The materials appearing on the website could
            include technical, typographical, or photographic errors. The
            website does not warrant that any of the materials on its website
            are accurate, complete, or current.
          </li>
          <li>
            Accuracy of Materials: The materials appearing on the website could
            include technical, typographical, or photographic errors. The
            website does not warrant that any of the materials on its website
            are accurate, complete, or current.
          </li>
          <li>
            Modifications: The website may revise these terms of service for its
            website at any time without notice. By using this website, you are
            agreeing to be bound by the then-current version of these terms of
            service.
          </li>
          <li>
            Governing Law: These terms and conditions are governed by and
            construed in accordance with the laws of the jurisdiction.
          </li>
          <li>
            Contact Information: If you have any questions about these terms and
            conditions, please contact us at [contact@email.com].
          </li>
        </ol>
        <div className="flex gap-2 ">
          <input
            type="checkbox"
            className="w-5"
            checked={paper.terms}
            onChange={handleChange}
          />
          <p>I have read and agree to the terms and conditions stated above</p>
        </div>
      </div>
    </>
  );
}
