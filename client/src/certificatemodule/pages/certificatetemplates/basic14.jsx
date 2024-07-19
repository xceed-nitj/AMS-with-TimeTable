import React from 'react';
import { useEffect, useRef } from 'react';

import ReactHtmlParser from 'react-html-parser';
// import getEnvironment from "../../../../getenvironment";
import ProxifiedImage from '../../components/ProxifiedImage';
import QRCode from 'qrcode';
import { Button,Text } from '@chakra-ui/react';
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
  verifiableLink=(verifiableLink=="true")
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
      style={{
        width: window.outerWidth >= 768 ? "841.9" : window.outerWidth,
        height: window.outerWidth >= 768 ? "595.5" : "auto"
    }}
      viewBox="0 0 1122.52 793.7"
      id="svg"
      className="svg-img tw-object-contain"
      ref={svgRef}
    >
      <>
        <g clipPath="url(#clip0_137_3)">
            <path fill="#fff" d="M0 0H1122.5V798.222H0z"></path>
            <path fill="#6C6B70" d="M0 0H898V31.929H0z"></path>
            <path
            fill="#6C6B70"
            d="M224.5 766.262H1122.5V798.1909999999999H224.5z"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M81.849 58.074L1039.87 58.074"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M79.9 742.409L79.9 56.125"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M1039.87 740.46L81.849 740.46"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M1041.82 56.125L1041.82 742.409"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M89.644 65L1032.08 65"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M87.695 733.577L87.695 63.141"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M1032.08 731.718L89.644 731.718"
            ></path>
            <path
            stroke="#6C6B70"
            strokeWidth="3.898"
            d="M1034.03 63.141L1034.03 733.577"
            ></path>
        </g>
        <defs>
            <clipPath id="clip0_137_3">
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
                <img src={item.url == '[object File]' ? URL.createObjectURL(item.url) : item.url} alt="" />
                </div>
                <div className="tw-text-center">
                  {key === num_left && (
                    <>

                      {title.map((item, key) => (
                          <Text fontSize={item.fontSize} fontFamily={item.fontFamily} fontStyle={item.italic} fontWeight={item.bold} key={key} className="tw-text-center">
                          {item.name}
                          </Text>
                      ))
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
                            <Text fontSize={item.fontSize} fontFamily={item.fontFamily} fontStyle={item.italic} fontWeight={item.bold} className="tw-text-gray-700 tw-uppercase" key={ind}>{item.header}</Text>
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
                    <Text fontSize={contentBody.fontSize} fontFamily={contentBody.fontFamily} fontStyle={contentBody.italic} fontWeight={contentBody.bold} className="opacity-80">
                        <div>{ReactHtmlParser(contentBody.body)}</div>
                    </Text>
        </foreignObject>

        <foreignObject x={'20%'} y={515} width={'60%'} height={400}>
          <div className="tw-flex-wrap tw-flex tw-items-center tw-justify-between tw-gap-6 tw-px-6 ">
            {signature.map((item, key) => (
              <div
                key={key}
                className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2"
              >
                <div className="tw-w-[100px]">
                <img src={item.url == '[object File]' ? URL.createObjectURL(item.url) : item.url} alt="" />
                </div>
                <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
                <Text fontSize={item.name.fontSize} fontFamily={item.name.fontFamily} fontStyle={item.name.italic} fontWeight={item.name.bold} className="tw-text-black">{item.name.name}</Text>
                <Text fontSize={item.position.fontSize} fontFamily={item.position.fontFamily} fontStyle={item.position.italic} fontWeight={item.position.bold} className="-tw-mt-3 tw-text-gray-900">{item.position.position}</Text>
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
