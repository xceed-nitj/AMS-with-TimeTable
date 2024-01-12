// import { useParams } from "react-router-dom"

import { Link } from 'react-router-dom';
// import CertificateTemplate from "./CertificateTemplates"
import EditCertificate from './EditCertificate';
import { useState } from 'react';
import CertificateTemplate from './CertificateTemplates';
// import mySvg from "../assets/temp1.svg"
import Template03 from './03_sarthak';

const maxWordsPerRow = 10;
// console.log(mySvg)
function Certificate() {
  // const params = useParams();
  // const IdConf = params.confid;
  // const data = {
  //   name: 'Sarthak',
  // };

  const [certificateData, setCertificateData] = useState({
    Description:
      'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy lorem20nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Utwisi enim ad minim veniam, quis nos trud exerci tation ullamcorpersuscipit lobortis nisl ut aliquip ex ea commodo consequat',
    Date: '21-Feb-23',
    Signature: 'John',
    Certificate: 'CERTIFICATE',
    SubText: 'OF APPRECIATION',
    PresentedTo: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
    BottomText1: 'DATE',
    BottomText2: 'SIGNATURE',
  });

  // let {
  //   Description,
  //   Date,
  //   Signature,
  //   Certificate,
  //   SubText,
  //   PresentedTo,
  //   BottomText1,
  //   BottomText2,
  // } = certificateData;

  function handleSubmit(e) {
    e.preventDefault();
    const SVG = document.getElementById('svg');
    console.log(SVG);
  }

  const certificate = document.querySelector('.text');
  console.log(certificate);
  return (
    <div>
      <div className="tw-p-2 tw-bg-blue-200 tw-flex tw-items-center tw-justify-between">
        <p className="tw-text-2xl tw-font-bold tw-text-blue-900">Certificate</p>
        <Link
          to={-1}
          className="tw-text-blue-900 tw-bg-white tw-rounded-md tw-p-2 tw-font-bold"
        >
          Go to Home
        </Link>
      </div>
      <div className="tw-flex md:tw-flex-row tw-flex-col">
        <div className="md:tw-basis-[70%] tw-w-[100vw]">
          <Template03 />
        </div>
        <div className="">
          <EditCertificate
            certificateData={certificateData}
            setCertificateData={setCertificateData}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

export default Certificate;
