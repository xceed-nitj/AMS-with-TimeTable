// import { useParams } from "react-router-dom"

import { Link } from 'react-router-dom';
// import CertificateTemplate from "./CertificateTemplates"
import EditCertificate from './EditCertificate';
import { useState } from 'react';
// import CertificateTemplate from './CertificateTemplates';
// import mySvg from "../assets/temp1.svg"
import Template03 from './Templates/03_sarthak';

// const maxWordsPerRow = 10;
// console.log(mySvg)
const data = {
  name: 'Sarthak',
};

function Certificate() {
  const [certificateData, setCertificateData] = useState();

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
          <Template03 data={data} />
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
