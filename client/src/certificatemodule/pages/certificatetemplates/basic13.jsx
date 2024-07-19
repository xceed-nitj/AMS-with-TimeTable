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
  certificateOf,
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

