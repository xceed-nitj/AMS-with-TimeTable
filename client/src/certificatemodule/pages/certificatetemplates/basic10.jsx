import React from 'react';
import { useEffect, useRef } from 'react';

import ReactHtmlParser from 'react-html-parser';
// import getEnvironment from "../../../../getenvironment";
import ProxifiedImage from '../../components/ProxifiedImage';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// const apiUrl = getEnvironment();

const CertificateContent = ({
  eventId,
  contentBody,
  certiType,
  title,
  verifiableLink,
  logos,
  participantDetail,
  signature,
  header,
  footer,
}) => {
  var num_logos = logos.length;
  var num_left = 0;
  if (num_logos % 2 === 0) {
    num_left = num_logos / 2 - 1;
  } else {
    num_left = Math.floor(num_logos / 2);
  }
  const svgRef = useRef();

  useEffect(() => {
    const url = window.location.href; // Replace with your URL
    const svg = svgRef.current;

    QRCode.toDataURL(url, (err, dataUrl) => {
      if (err) throw err;

      const image = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'image'
      );
      image.setAttribute('x', '100');
      image.setAttribute('y', '500');
      image.setAttribute('width', '100');
      image.setAttribute('height', '100');
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
      image.classList.add("qrcode");
      
      svg.appendChild(image);
      if(!verifiableLink){document.querySelectorAll(".qrcode").forEach((elem)=>{elem.remove()})}
    });
  }, [verifiableLink]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="841.92"
      height="595.499987"
      viewBox="0 0 1122.52 793.7"
      id="svg"
      className="svg-img tw-object-contain"
      ref={svgRef}
    >
      <>
      <g clipPath="url(#clip0_120_3)">
        <path
          fill="#fff"
          d="M0 0H1122.52V798.236H0z"
          transform="translate(.74 .882)"
        ></path>
        <path
          fill="#265E6A"
          d="M-116.969 -147.535H-105.276V242.229H-116.969z"
          transform="rotate(-45 -116.969 -147.535)"
        ></path>
        <path
          fill="#265E6A"
          d="M426.015 -155.803H437.70799999999997V233.961H426.015z"
          transform="rotate(45 426.015 -155.803)"
        ></path>
        <path
          fill="#F2C32E"
          d="M-26.543 -123.37H-14.85V266.394H-26.543z"
          transform="rotate(-45 -26.543 -123.37)"
        ></path>
        <path
          fill="#F2C32E"
          d="M516.44 -131.638H528.133V258.126H516.44z"
          transform="rotate(45 516.44 -131.638)"
        ></path>
        <path
          fill="#265E6A"
          d="M1152.23 992.873H1163.923V1382.6370000000002H1152.23z"
          transform="rotate(135 1152.23 992.873)"
        ></path>
        <path
          fill="#265E6A"
          d="M609.244 1001.14H620.937V1390.904H609.244z"
          transform="rotate(-135 609.244 1001.14)"
        ></path>
        <path
          fill="#F2C32E"
          d="M1061.8 968.707H1073.493V1358.471H1061.8z"
          transform="rotate(135 1061.8 968.707)"
        ></path>
        <path
          fill="#F2C32E"
          d="M518.818 976.975H530.511V1366.739H518.818z"
          transform="rotate(-135 518.818 976.975)"
        ></path>
        <path
          fill="#F2C32E"
          d="M915.905 -61.134H1348.543V318.039H915.905z"
          transform="rotate(-45 915.905 -61.134)"
        ></path>
        <path
          fill="#F2C32E"
          d="M-362.52 947.575H70.118V1326.748H-362.52z"
          transform="rotate(-45 -362.52 947.575)"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0_120_3">
          <path
            fill="#fff"
            d="M0 0H1122.52V798.236H0z"
            transform="translate(.74 .882)"
          ></path>
        </clipPath>
      </defs>
      </>
      <>
        <foreignObject width={'90%'} height={'400'} y={'80'} x={'5%'}>
          <div className="tw-flex tw-items-center tw-justify-center tw-w-full">
            {logos.map((item, key) => (
              <div
                key={key}
                className="tw-flex tw-items-center tw-justify-center "
              >
                <div className="tw-w-20 tw-shrink-0 tw-mx-6">
                  <img src={item} alt="" />
                </div>
                <div className="tw-text-center">
                  {key === num_left && (
                    <>
                     {title.map((item, key) => (
                                    <p key={key} className="tw-font-nunito-bold tw-text-xl tw-font-medium tw-text-center">
                                        {item}
                                    </p>
                                )
                              )
                     }
                      {/* <p className="tw-font-nunito-bold tw-text-xl tw-font-medium">
                        डॉ. बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर
                      </p>
                      <p className="tw-font-nunito-bold tw-text-[12px]">
                        जी.टी. रोड, अमृतसर बाईपास, जालंधर (पंजाब), भारत- 144008
                      </p>
                      <p className="tw-font-nunito-bold tw-text-xl tw-font-semibold">
                        Dr. B R Ambedkar National Institute of Technology
                        Jalandhar
                      </p>
                      <p className="tw-font-nunito-bold tw-text-[12px] ">
                        G.T. Road, Amritsar Byepass, Jalandhar (Punjab), India-
                        144008
                      </p> */}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </foreignObject>

        <foreignObject x="10%" y="200.473" width="85%" height="160">
          <div className="tw-mt-8 tw-text-center tw-flex-col tw-flex tw-gap-1">
            {header.map((item, ind) => (
              <h1
                className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-uppercase"
                key={ind}
              >
                {item}
              </h1>
            ))}
          </div>
        </foreignObject>

        <text
          x="561.26"
          y="340.473"
          fill="#424847"
          fontFamily="AbhayaLibre-Regular"
          fontSize="40.707"
          textAnchor="middle"
          fontWeight="550"
        >
          CERTIFICATE OF APPRECIATION
        </text>

        <foreignObject x="12.5%" y="370.473" width="75%" height="160">
          <p className="font-serif text-xl opacity-80">
            <div>{ReactHtmlParser(contentBody)}</div>
          </p>
        </foreignObject>

        <foreignObject x={'20%'} y={515} width={'60%'} height={400}>
          <div className="tw-flex-wrap tw-flex tw-items-center tw-justify-between tw-gap-6 tw-px-6 ">
            {signature.map((item, key) => (
              <div
                key={key}
                className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2"
              >
                <div className="tw-w-[100px]">
                  <ProxifiedImage src={item.url} alt="" />
                </div>
                <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
                <p className="tw-text-black tw-text-[15px] tw-font-semibold">
                  {item.name}
                </p>
                <p className="tw-text-[13px] -tw-mt-3 tw-text-gray-900">
                  {item.position}
                </p>
              </div>
            ))}
          </div>
        </foreignObject>

        {verifiableLink &&
          <foreignObject x={'20%'} y={'90%'} width={'60%'} height={'100'}>
            <div className="tw-text-sm tw-text-center tw-text-gray-700 ">
              {window.location.href}
            </div>
          </foreignObject>}
      </>
      );
    </svg>
  );
};

export default CertificateContent;
