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
    });
  }, []);

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
      <g clipPath="url(#clip0_29_136)">
        <path
          fill="#fff"
          d="M0 0H1122.5V798.222H0z"
          transform="translate(.75 .889)"
        ></path>
        <circle cx="0.75" cy="0.889" r="116.927" fill="#F5C658"></circle>
        <circle cx="1123.25" cy="799.111" r="116.927" fill="#F5C658"></circle>
        <circle cx="1123.25" cy="0.889" r="116.927" fill="#F5C658"></circle>
        <circle cx="0.75" cy="799.111" r="116.927" fill="#F5C658"></circle>
        <circle
          cx="0.75"
          cy="799.111"
          r="116.927"
          fill="#F5C658"
          transform="rotate(-90 .75 799.111)"
        ></circle>
        <circle
          cx="0.75"
          cy="799.111"
          r="116.927"
          fill="#F5C658"
          transform="rotate(-90 .75 799.111)"
        ></circle>
        <path
          stroke="#F5C658"
          strokeWidth="7.795"
          d="M44.402 758.576L44.402 38.306"
        ></path>
        <path
          stroke="#F5C658"
          strokeWidth="7.795"
          d="M1081.16 758.578L1081.16 46.101"
        ></path>
        <path
          stroke="#F5C658"
          strokeWidth="7.795"
          d="M48.3 42.203L1085.05 42.203"
        ></path>
        <path
          stroke="#F5C658"
          strokeWidth="7.795"
          d="M48.3 754.679L1085.05 754.679"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M1081.16 110.818L1081.16 43.762"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M1081.16 758.594L1081.16 691.538"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M1018.02 754.679L1085.07 754.679"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M42.844 754.679L109.9 754.679"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M44.403 758.594L44.403 691.538"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M44.403 110.818L44.403 43.762"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M40.505 42.203L110.661 42.203"
        ></path>
        <path
          stroke="#fff"
          strokeWidth="7.795"
          d="M1013.34 42.203L1085.05 42.203"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0_29_136">
          <path
            fill="#fff"
            d="M0 0H1122.5V798.222H0z"
            transform="translate(.75 .889)"
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
      </>
      );
    </svg>
  );
};

export default CertificateContent;

