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

      svg.appendChild(image);
      if (!verifiableLink) { document.querySelectorAll(".qrcode").forEach((elem) => { elem.remove() }) }
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
      <g clipPath="url(#clip0_137_135)">
        <path fill="#fff" d="M0 0H1122.5V798.222H0z"></path>
        <path
          fill="#D9D9D9"
          d="M95.152 753.841a38.974 38.974 0 00-27.56-66.535 38.977 38.977 0 00-27.56 11.415l2.56 2.559a35.36 35.36 0 0150.001 0 35.357 35.357 0 010 50.002l2.56 2.559zM94.373 40.032a38.975 38.975 0 01-55.12 55.12l2.558-2.559a35.357 35.357 0 0050.003-50.002l2.559-2.559zM1025.34 42.37a38.977 38.977 0 00-11.42 27.56c0 10.338 4.11 20.251 11.42 27.56a38.971 38.971 0 0027.56 11.416c10.33 0 20.25-4.106 27.56-11.415l-2.56-2.56a35.347 35.347 0 01-25 10.357 35.364 35.364 0 01-35.36-35.357c0-9.378 3.73-18.37 10.36-25.001l-2.56-2.56zM1023 752.282a38.977 38.977 0 01-11.42-27.56c0-10.337 4.11-20.25 11.42-27.559a38.97 38.97 0 0127.56-11.416 38.97 38.97 0 0127.56 11.416l-2.56 2.558a35.35 35.35 0 00-25-10.355 35.365 35.365 0 00-35.36 35.356c0 9.378 3.73 18.371 10.36 25.002l-2.56 2.558z"
        ></path>
        <path
          stroke="#000"
          strokeOpacity="0.21"
          strokeWidth="3.898"
          d="M92.762 42.483L1027.4 42.483"
        ></path>
        <path
          stroke="#000"
          strokeOpacity="0.21"
          strokeWidth="3.898"
          d="M92.762 751.841L1025.84 751.841"
        ></path>
        <path
          stroke="#000"
          strokeOpacity="0.21"
          strokeWidth="3.898"
          d="M41.704 92.762L41.704 698.445"
        ></path>
        <path
          stroke="#000"
          strokeOpacity="0.21"
          strokeWidth="3.898"
          d="M1079.63 95.088L1079.63 699.236"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="15.59"
          d="M0 -7.795L1122.5 -7.795"
          transform="translate(0 15.792)"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="15.59"
          d="M0.789 792.626L1108.39 792.626"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="15.59"
          d="M7.795 15.01L7.795 800.422"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="15.59"
          d="M1115.39 15.01L1115.39 800.422"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="3.898"
          d="M26 26.347L1097.05 26.347"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="3.898"
          d="M26.76 770.388L1093.6 770.388"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="3.898"
          d="M27.949 28.306L27.949 772.337"
        ></path>
        <path
          stroke="#8B5F1D"
          strokeWidth="3.898"
          d="M1094.78 28.306L1094.78 772.337"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0_137_135">
          <path fill="#fff" d="M0 0H1122.5V798.222H0z"></path>
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
                      <p className="tw-font-nunito-bold tw-text-xl tw-font-medium">
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
                      </p>
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

        <foreignObject x={'20%'} y={'90%'} width={'60%'} height={'100'}>
          <div className="tw-text-sm tw-text-center tw-text-gray-700 ">
            {window.location.href}
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

