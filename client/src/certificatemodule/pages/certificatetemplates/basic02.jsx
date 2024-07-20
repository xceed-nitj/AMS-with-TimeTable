import React from 'react';
import { useEffect, useRef } from 'react';

import ReactHtmlParser from 'react-html-parser';
// import getEnvironment from "../../../../getenvironment";
import ProxifiedImage from '../../components/ProxifiedImage';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button, Text } from '@chakra-ui/react';

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
  verifiableLink = verifiableLink == 'true';
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
      image.classList.add('qrcode');
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);

      svg.appendChild(image);
      if (!verifiableLink) {
        document.querySelectorAll('.qrcode').forEach((elem) => {
          elem.remove();
        });
      }
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
        <g clipPath="url(#clip0_53_2)">
          <rect
            width="1122.52"
            height="797.659"
            transform="translate(0.23999 0.170532)"
            fill="#FFFBF3"
          />
          <path
            d="M-16.5166 470.951L727.128 803.899L712.645 836.448L-31 503.5L-16.5166 470.951Z"
            fill="#E5BC62"
          />
          <path
            d="M-169.261 433L776.845 851.347L604.111 1242L-342 823.651L-169.261 433Z"
            fill="#283361"
          />
          <path
            d="M247.262 -120.087L1233.43 174.336L1203.18 285.659L217.006 -8.75647L247.262 -120.087Z"
            fill="#E5BC62"
          />
          <path
            d="M379.724 -428.193L1374.34 -143.804L1256.92 266.874L262.3 -17.5094L379.724 -428.193Z"
            fill="#283361"
          />
          <rect x="29" y="21" width="1065" height="756" rx="8" fill="white" />
          <rect
            x="37.5"
            y="29.5"
            width="1048"
            height="739"
            rx="5.5"
            stroke="#E5BC62"
            strokeWidth="5"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_53_2">
            <rect
              width="1122.52"
              height="797.659"
              fill="white"
              transform="translate(0.23999 0.170532)"
            />
          </clipPath>
        </defs>
      </>
      <>
        <foreignObject width={'90%'} height={'400'} y={'40'} x={'5%'}>
          <div
            style={{ height: '200px' }}
            className="tw-flex tw-items-center tw-justify-center tw-w-full"
          >
            {logos.map((item, key) => (
              <div
                key={key}
                className="tw-flex tw-items-center tw-justify-center "
              >
                <div
                  style={{
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                  }}
                  className="tw-w-20 tw-shrink-0 tw-mx-6"
                >
                  <img src={item.url == '[object File]' ? URL.createObjectURL(item.url) : item.url} alt="" />
                </div>
                <div className="tw-text-center">
                  {key === num_left && (
                    <>
                      {title.map((item, key) => (
                        <Text
                          fontSize={`${item.fontSize}px`}
                          fontFamily={item.fontFamily}
                          fontStyle={item.italic}
                          fontWeight={item.bold}
                          color={item.fontColor}
                          key={key}
                          className=" tw-text-center"
                        >
                          {item.name}
                        </Text>
                      ))}
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

        <foreignObject x="0%" y="190.473" width="100%" height="200">
          <div className="tw-mt-8 tw-text-center tw-flex-col tw-items-center tw-flex tw-gap-1 tw-justify-center">
            {header.map((item, ind) => (
              <Text
                width="70%"
                fontSize={`${item.fontSize}px`}
                fontFamily={item.fontFamily}
                fontStyle={item.italic}
                fontWeight={item.bold}
                color={item.fontColor}
                className="tw-uppercase"
                key={ind}
              >
                {item.header}
              </Text>
            ))}
          </div>
        </foreignObject>

        {/* certificateOf */}
        <foreignObject y="295.473" width="100%" height="200">
          <Text
            width="100%"
            fontSize={`${certificateOf.fontSize}px`}
            fontFamily={certificateOf.fontFamily}
            fontStyle={certificateOf.italic}
            fontWeight={certificateOf.bold}
            color={certificateOf.fontColor}
            className="tw-text-center tw-uppercase opacity-80"
          >
            <div width="90%" className="tw-text-center tw-uppercase">
              {certificateOf.certificateOf}
            </div>
          </Text>
        </foreignObject>

        <foreignObject width="100%" x="11%" y="375.473" height="160">
          <Text
            width="77%"
            fontSize={`${contentBody.fontSize}px`}
            fontFamily={contentBody.fontFamily}
            fontStyle={contentBody.italic}
            fontWeight={contentBody.bold}
            color={contentBody.fontColor}
            className="tw-text-center opacity-80"
          >
            {ReactHtmlParser(contentBody.body)}
          </Text>
        </foreignObject>

        <foreignObject x={'20%'} y={435} width={'62%'} height={400}>
          <div
            style={{ height: '250px' }}
            className="tw-flex-wrap tw-flex tw-items-center tw-justify-between tw-gap-6 tw-px-6 "
          >
            {signature.map((item, key) => (
              <div
                key={key}
                style={{ height: '250px' }}
                className="tw-flex tw-flex-col tw-items-center tw-justify-end tw-gap-2"
              >
                <div
                  style={{ width: `${item.url.size}px` }}
                  className="tw-flex tw-flex-col tw-justify-end"
                >
                  <img src={item.url.url == '[object File]' ? URL.createObjectURL(item.url.url) : item.url.url} alt="" />
                </div>
                <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
                <Text
                  fontSize={`${item.name.fontSize}px`}
                  fontFamily={item.name.fontFamily}
                  fontStyle={item.name.italic}
                  fontWeight={item.name.bold}
                  color={item.name.fontColor}
                >
                  {item.name.name}
                </Text>
                <Text
                  fontSize={`${item.position.fontSize}px`}
                  fontFamily={item.position.fontFamily}
                  fontStyle={item.position.italic}
                  fontWeight={item.position.bold}
                  color={item.position.fontColor}
                  className="-tw-mt-3"
                >
                  {item.position.position}
                </Text>
              </div>
            ))}
          </div>
        </foreignObject>
        {verifiableLink && (
          <foreignObject x={'0%'} y={'91%'} width={'100%'} height={'100'}>
            <div className="tw-text-sm tw-text-center tw-text-gray-700 ">
              {window.location.href}
            </div>
          </foreignObject>
        )}
        <foreignObject x={'0%'} y={'89%'} width={'100%'} height={'100'}>
          <Text className="tw-text-sm tw-text-center tw-text-gray-700 ">
            Issued On: {footer.footer}
          </Text>
        </foreignObject>
      </>
      );
    </svg>
  );
};

export default CertificateContent;
