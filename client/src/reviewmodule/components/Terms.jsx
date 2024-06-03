import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import { Button } from '@chakra-ui/react';

export default function Terms({ setNext, handlePrevious, handleNext }) {
  const [paper, setPaper] = useRecoilState(paperState);
  console.log(paper);

  useEffect(() => {
    setNext(!paper.terms);
  }, [paper.terms]);

  function handleChange(e) {
    setPaper({ ...paper, terms: !paper.terms });
  }
  return (
    <>
      <div className="tw-font-bold tw-text-xl tw-pt-10">
        Terms and Conditions
      </div>
      <div className="tw-flex tw-flex-col tw-gap-5 tw-px-5 tw-py-5">
        {/* <p className="tw-text-xl tw-pt-10 tw-font-bold">Terms and Conditions:</p> */}
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
        <div className="tw-flex tw-gap-2">
          <input
            type="checkbox"
            className="tw-w-5"
            checked={paper.terms}
            onChange={handleChange}
          />
          <p>I have read and agree to the terms and conditions stated above</p>
        </div>
        <div className="tw-flex tw-justify-between">
          <Button onClick={handlePrevious}>Back</Button>
          <Button onClick={paper.terms ? () => handleNext() : ''}>Next</Button>
        </div>
      </div>
    </>
  );
}
