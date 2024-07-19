import React from 'react';
import { useEffect, useRef } from 'react';

import ReactHtmlParser from 'react-html-parser';
// import getEnvironment from "../../../../getenvironment";
import ProxifiedImage from '../../components/ProxifiedImage';
import QRCode from 'qrcode';
import { Button, Text } from '@chakra-ui/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// const apiUrl = getEnvironment();

const CertificateContent = ({
  eventId,
  contentBody,
  certiType,
  title,
  certificateOf,
  verifiableLink,
  logos,
  participantDetail,
  signature,
  header,
  footer,
}) => {
  verifiableLink = (verifiableLink == "true")
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
        <foreignObject width={'90%'} height={'400'} y={'40'} x={'5%'}>
          <div style={{ height: "200px" }} className="tw-flex tw-items-center tw-justify-center tw-w-full">
            {logos.map((item, key) => (
              <div
                key={key}
                className="tw-flex tw-items-center tw-justify-center "
              >
                <div style={{ width: `${item.width}px`, height: `${item.height}px` }} className="tw-w-20 tw-shrink-0 tw-mx-6">
                  <img src={item.url == '[object File]' ? URL.createObjectURL(item.url) : item.url} alt="" />
                </div>
                <div className="tw-text-center">
                  {key === num_left && (
                    <>
                      {title.map((item, key) => (
                        <Text fontSize={`${item.fontSize}px`} fontFamily={item.fontFamily} fontStyle={item.italic} fontWeight={item.bold} color={item.fontColor} key={key} className=" tw-text-center">
                          {item.name}
                        </Text>
                      ))
                      }
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </foreignObject>

        <foreignObject x="0%" y="190.473" width="100%" height="200">
          <div className="tw-mt-8 tw-text-center tw-flex-col tw-items-center tw-flex tw-gap-1 tw-justify-center">
            {header.map((item, ind) => (
              <Text width="70%" fontSize={`${item.fontSize}px`} fontFamily={item.fontFamily} fontStyle={item.italic} fontWeight={item.bold} color={item.fontColor} className="tw-uppercase" key={ind}>{item.header}</Text>
            ))}
          </div>
        </foreignObject>

        {/* certificateOf */}
        <foreignObject y="295.473" width="100%" height="200">
          <Text width="100%" fontSize={`${certificateOf.fontSize}px`} fontFamily={certificateOf.fontFamily} fontStyle={certificateOf.italic} fontWeight={certificateOf.bold} color={certificateOf.fontColor} className="tw-text-center tw-uppercase opacity-80">
            <div width="90%" className="tw-text-center tw-uppercase">{certificateOf.certificateOf}</div>
          </Text>
        </foreignObject>


        <foreignObject width="100%" x="11%" y="375.473" height="160">
          <Text width="77%" fontSize={`${contentBody.fontSize}px`} fontFamily={contentBody.fontFamily} fontStyle={contentBody.italic} fontWeight={contentBody.bold} color={contentBody.fontColor} className="tw-text-center opacity-80">
            {ReactHtmlParser(contentBody.body)}
          </Text>
        </foreignObject>

        <foreignObject x={'20%'} y={435} width={'62%'} height={400}>
          <div style={{ height: "250px" }} className="tw-flex-wrap tw-flex tw-items-center tw-justify-between tw-gap-6 tw-px-6 ">
            {signature.map((item, key) => (
              <div
                key={key}
                style={{ height: "250px" }}
                className="tw-flex tw-flex-col tw-items-center tw-justify-end tw-gap-2"
              >
                <div style={{ width: `${item.url.size}px` }} className='tw-flex tw-flex-col tw-justify-end'>
                  <img src={item.url.url == '[object File]' ? URL.createObjectURL(item.url.url) : item.url.url} alt="" />
                </div>
                <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
                <Text fontSize={`${item.name.fontSize}px`} fontFamily={item.name.fontFamily} fontStyle={item.name.italic} fontWeight={item.name.bold} color={item.name.fontColor} >{item.name.name}</Text>
                <Text fontSize={`${item.position.fontSize}px`} fontFamily={item.position.fontFamily} fontStyle={item.position.italic} fontWeight={item.position.bold} color={item.position.fontColor} className="-tw-mt-3">{item.position.position}</Text>
              </div>
            ))}
          </div>
        </foreignObject>
        {verifiableLink &&
          <foreignObject x={'0%'} y={'91%'} width={'100%'} height={'100'}>
            <div className="tw-text-sm tw-text-center tw-text-gray-700 ">
              {window.location.href}
            </div>
          </foreignObject>}
        <foreignObject x={"0%"} y={'89%'} width={'100%'} height={'100'}><Text className="tw-text-sm tw-text-center tw-text-gray-700 ">Issued On: {footer.footer}</Text></foreignObject>
      </>
      );
    </svg>
  );
};

export default CertificateContent;

