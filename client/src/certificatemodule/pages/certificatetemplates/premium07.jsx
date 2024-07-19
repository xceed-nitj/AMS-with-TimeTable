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
  certificateOf,
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
      <g clipPath="url(#clip0_126_46)">
        <path
          fill="#F8EFEA"
          d="M0 0H1122.5V798.222H0z"
          transform="translate(.75 .889)"
        ></path>
        <path
          fill="#B22E43"
          d="M1425.23 609.044H2207.082V716.617H1425.23z"
          transform="rotate(135 1425.23 609.044)"
        ></path>
        <path
          fill="#B22E43"
          d="M1284.92 488.999L732.069 1041.85l-40.379-40.38 552.85-552.85 40.38 40.379zM1240.14 419.974L686.857 973.255l-40.379-40.379 553.282-553.281 40.38 40.379zM1240.49 278.594L615.984 903.099l-22.976-22.976 624.502-624.505 22.98 22.976zM1221 208.047L544.658 884.391l-5.264-5.264 676.346-676.344 5.26 5.264zM1340.27 538.888L787.414 1091.74l-49.638-49.64 552.854-552.85 49.64 49.638z"
        ></path>
        <path
          fill="#B22E43"
          d="M-323.528 215.433H458.32399999999996V323.006H-323.528z"
          transform="rotate(-45 -323.528 215.433)"
        ></path>
        <path
          fill="#B22E43"
          d="M-183.215 335.478l552.853-552.853 40.379 40.379-552.853 552.853-40.379-40.379zM-138.432 404.504L414.85-148.778l40.379 40.379-553.281 553.282-40.38-40.379zM-138.783 545.884L485.722-78.621l22.976 22.976-624.505 624.505-22.976-22.976zM-119.295 616.431L557.049-59.913l5.263 5.263-676.344 676.344-5.263-5.263zM-238.561 285.589l552.853-552.853 49.638 49.638-552.853 552.853-49.638-49.638z"
        ></path>
        <path
          fill="#F8EFEA"
          d="M0 0H1068.71V724.948H0z"
          transform="matrix(1 0 0 -1 29.592 762.474)"
        ></path>
        <path
          fill="#B22E43"
          d="M102.087 46.88c0 27.984-22.685 50.669-50.669 50.669C23.435 97.549.75 74.864.75 46.88c0-27.983 22.685-50.668 50.668-50.668 27.984 0 50.669 22.685 50.669 50.668zm-80.775 0c0 16.627 13.48 30.106 30.106 30.106 16.628 0 30.106-13.479 30.106-30.106 0-16.627-13.478-30.106-30.106-30.106-16.627 0-30.106 13.48-30.106 30.106zM1123.25 748.443c0 27.983-22.69 50.668-50.67 50.668s-50.67-22.685-50.67-50.668c0-27.984 22.69-50.669 50.67-50.669s50.67 22.685 50.67 50.669zm-80.77 0c0 16.627 13.47 30.106 30.1 30.106 16.63 0 30.11-13.479 30.11-30.106 0-16.627-13.48-30.106-30.11-30.106s-30.1 13.479-30.1 30.106zM998.528 736.75a62.434 62.434 0 014.742-23.865 62.476 62.476 0 0113.52-20.231 62.408 62.408 0 0120.23-13.518 62.4 62.4 0 0123.87-4.747v2.893c-7.81 0-15.54 1.538-22.76 4.526a59.496 59.496 0 00-19.29 12.891 59.532 59.532 0 00-12.89 19.293 59.449 59.449 0 00-4.53 22.758h-2.892zM119.236 736.75a62.364 62.364 0 00-62.361-62.361v2.893a59.479 59.479 0 0142.05 17.417 59.48 59.48 0 0112.892 19.293 59.482 59.482 0 014.526 22.758h2.893zM998.528 49.219a62.43 62.43 0 004.742 23.864 62.474 62.474 0 0013.52 20.232 62.412 62.412 0 0020.23 13.518 62.4 62.4 0 0023.87 4.747v-2.893a59.49 59.49 0 01-22.76-4.527 59.476 59.476 0 01-36.71-54.941h-2.892z"
        ></path>
        <path
          fill="#B22E43"
          d="M119.236 47.66a62.36 62.36 0 01-62.361 62.361v-2.893a59.46 59.46 0 0042.05-17.418 59.47 59.47 0 0017.418-42.05h2.893z"
        ></path>
        <path
          stroke="#B22E43"
          strokeWidth="3.118"
          d="M116.121 46.88L1000.87 48.449"
        ></path>
        <path
          stroke="#B22E43"
          strokeWidth="3.118"
          d="M58.434 110.021L58.434 674.389"
        ></path>
        <path
          stroke="#B22E43"
          strokeWidth="3.118"
          d="M119.236 735.191L998.528 735.191"
        ></path>
        <path
          stroke="#B22E43"
          strokeWidth="3.118"
          d="M1059.33 674.389L1059.33 111.579"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0_126_46">
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

