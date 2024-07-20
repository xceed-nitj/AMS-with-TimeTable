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
        <g clipPath="url(#clip0_104_397)">
          <rect width="1122.52" height="798.24" fill="white" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1110.43 277.4L1140.96 379.49L1172.42 253.644L1163.66 245.779L1139.29 223.91L1110.43 277.4Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1110.43 277.4L1172.42 253.644L1163.66 245.779L1139.29 223.91L1110.43 277.4Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1195.09 560.418L1011.48 461.35L1140.97 379.495L1166.17 463.733L1195.09 560.418Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1011.48 461.35L1011.26 461.231L1110.44 277.405L1140.97 379.495L1011.48 461.35Z"
            fill="#FF165D"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M843.91 816.855L946.723 714.053L1036.3 624.483L1082.51 443.404L1098.98 439.42L1144.85 428.361V816.855H843.91Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1144.85 515.933L1036.3 624.483L1082.51 443.404L1098.98 439.42L1144.85 428.361V515.933Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1144.85 515.933L1082.51 443.404L1098.98 439.42L1144.85 428.361V515.933Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1144.47 816.855H1144.84V515.933L1036.29 624.483L1144.47 816.855Z"
            fill="#FF165D"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M953.465 989.845L826.349 919.278L715.593 857.793L528.787 863.193L520.422 848.44L497.176 807.388L870.678 700.518L953.465 989.845Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M581.366 783.299L715.593 857.793L528.787 863.193L520.422 848.44L497.176 807.388L581.366 783.299Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M870.788 700.882L870.684 700.528L581.371 783.309L715.598 857.814L870.788 700.882Z"
            fill="#FF165D"
          />
          <path
            d="M945.329 619.089L980.077 659.216L893.176 691.966L945.329 619.089Z"
            fill="#3EC1D3"
          />
          <path
            d="M1060.48 224.248L1019.68 308.34L1081.66 315.285L1060.48 224.248Z"
            fill="#FF9A00"
          />
          <path
            d="M1032.74 543.315L956.721 512.442L956.596 512.39L987.469 436.377L1032.74 543.315Z"
            fill="#FF165D"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.668 516.427L-18.8612 414.337L-50.3215 540.183L-41.5669 548.048L-17.1914 569.917L11.668 516.427Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.668 516.427L-50.3215 540.183L-41.5669 548.048L-17.1914 569.917L11.668 516.427Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-72.9857 233.409L110.621 332.477L-18.8717 414.332L-44.0691 330.094L-72.9857 233.409Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M110.621 332.477L110.845 332.596L11.6627 516.422L-18.8717 414.332L110.621 332.477Z"
            fill="#FF165D"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M278.191 -23.0283L175.378 79.7744L85.7984 169.344L39.5963 350.423L23.1118 354.407L-22.7522 365.466V-23.0283H278.191Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-22.7522 277.894L85.7984 169.344L39.5963 350.423L23.1118 354.407L-22.7522 365.466V277.894Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-22.7522 277.894L39.5963 350.423L23.1118 354.407L-22.7522 365.466V277.894Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M278.202 -23.0283H-22.3726L85.8139 169.344L175.388 79.7692L278.202 -23.0283Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-22.3724 -23.0283H-22.7366V277.894L85.814 169.344L-22.3724 -23.0283Z"
            fill="#FF165D"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M168.637 -196.018L295.752 -125.451L406.509 -63.9662L593.315 -69.3656L601.674 -54.6134L624.926 -13.561L251.418 93.3094L168.637 -196.018Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M540.735 10.5284L406.509 -63.9662L593.315 -69.3657L601.674 -54.6134L624.926 -13.561L540.735 10.5284Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M540.735 10.5284L593.315 -69.3657L601.674 -54.6134L624.926 -13.561L540.735 10.5284Z"
            fill="#3EC1D3"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M168.631 -196.029L251.314 92.9453L406.503 -63.987L295.747 -125.467L168.631 -196.029Z"
            fill="#FF9A00"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M251.314 92.9453L251.418 93.299L540.73 10.518L406.503 -63.987L251.314 92.9453Z"
            fill="#FF165D"
          />
          <path
            d="M168.803 171.185L134.055 131.059L220.956 98.3083L168.803 171.185Z"
            fill="#3EC1D3"
          />
          <path
            d="M61.6257 569.584L102.418 485.487L40.4388 478.548L61.6257 569.584Z"
            fill="#FF9A00"
          />
          <path
            d="M79.7748 233.404L155.794 264.276L155.913 264.323L125.046 340.342L79.7748 233.404Z"
            fill="#FF165D"
          />
        </g>
        <defs>
          <clipPath id="clip0_104_397">
            <rect width="1122.52" height="798.24" fill="white" />
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
