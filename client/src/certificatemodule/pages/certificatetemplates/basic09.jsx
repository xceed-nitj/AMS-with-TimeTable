import React from 'react';
import { useState, useEffect, useRef } from 'react';
import ReactHtmlParser from 'react-html-parser';

import getEnvironment from "../../../getenvironment";
import ProxifiedImage from "../../components/ProxifiedImage";

import QRCode from 'qrcode';
import { Button,Text } from '@chakra-ui/react';
import jsPDF from 'jspdf';


// const apiUrl = getEnvironment();

const Template09 = ({
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
            image.setAttribute('x', '30');
            image.setAttribute('y', '420');
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
            width="841.92"
            height="595.499987"
            viewBox="0 0 841.92 595.499987"
            id="svg"
            className="svg-img tw-object-contain"
            ref={svgRef}
        >
            <>
                <g clip-path="url(#clip0_14_4)">
                    <g mask="url(#mask0_14_4)">
                        <path d="M16.02 577.374V17.9062H825.869V577.374H16.02ZM16.735 18.6213V576.659H825.154V18.6213H16.735Z" fill="#ECBA33"></path>
                        <path d="M47.8 88.1026V48.9343H85.673V49.6493H48.515V88.1026H47.8Z" fill="#ECBA33"></path>
                        <path d="M48.1571 47.2373C49.2921 47.2373 50.2121 48.1573 50.2121 49.2923C50.2121 50.4273 49.2921 51.3473 48.1571 51.3473C47.0221 51.3473 46.1021 50.4273 46.1021 49.2923C46.1021 48.1573 47.0221 47.2373 48.1571 47.2373Z" fill="#ECBA33"></path>
                        <path d="M25.045 525.192V70.7685H55.066V58.8554H38.387V39.8213H57.925V55.9974H71.763V29.9382H765.888V32.7973H74.622V58.8554H57.925V73.6275H27.904V525.191L25.045 525.192ZM41.246 42.6803V55.9964H55.066V42.6803H41.246Z" fill="#ECBA33"></path>
                        <path d="M753.448 49.6493V48.9343H791.32V88.1026H790.606V49.6493H753.448Z" fill="#ECBA33"></path>
                        <path d="M790.963 47.2373C789.828 47.2373 788.908 48.1573 788.908 49.2923C788.908 50.4273 789.828 51.3473 790.963 51.3473C792.098 51.3473 793.018 50.4273 793.018 49.2923C793.018 48.1573 792.098 47.2373 790.963 47.2373Z" fill="#ECBA33"></path>
                        <path d="M70.3311 32.7973V29.9382H767.358V55.9964H781.195V39.8213H800.733V58.8564H784.054V70.7695H814.075V525.192H811.216V73.6285H781.195V58.8554H764.499V32.7973H70.3311ZM784.055 42.6803V55.9964H797.875V42.6803H784.055Z" fill="#ECBA33"></path>
                        <path d="M47.8 548.454V509.288H48.515V547.739H85.673V548.454H47.8Z" fill="#ECBA33"></path>
                        <path d="M48.1571 550.152C49.2921 550.152 50.2121 549.232 50.2121 548.097C50.2121 546.962 49.2921 546.042 48.1571 546.042C47.0221 546.042 46.1021 546.962 46.1021 548.097C46.1021 549.232 47.0221 550.152 48.1571 550.152Z" fill="#ECBA33"></path>
                        <path d="M25.0741 526.621V523.762H57.9251V538.534H74.6221V564.592H768.79V567.451H71.7621V541.393H57.9251V557.568H38.3871V538.534H55.0661V526.621H25.0741ZM41.2461 541.393V554.709H55.0661V541.393H41.2461Z" fill="#ECBA33"></path>
                        <path d="M756.309 548.454V547.739H793.466V509.288H794.181V548.454H756.309Z" fill="#ECBA33"></path>
                        <path d="M793.824 550.152C792.689 550.152 791.769 549.232 791.769 548.097C791.769 546.962 792.689 546.042 793.824 546.042C794.959 546.042 795.879 546.962 795.879 548.097C795.879 549.232 794.959 550.152 793.824 550.152Z" fill="#ECBA33"></path>
                        <path d="M73.192 567.45V564.591H767.36V538.534H784.056V523.762H814.042V526.621H786.915V538.534H803.594V557.568H784.056V541.393H770.219V567.451H73.192V567.45ZM786.915 541.393V554.709H800.735V541.393H786.915Z" fill="#ECBA33"></path>
                    </g>
                </g>
            </>
            <>
                <foreignObject width={"90%"} height={"400"} y={"70"} x={"5%"}>
                    <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-px-4">
                        {logos.map((item, key) => (
                            <div key={key} className="tw-flex tw-items-center tw-justify-center ">
                                <div className="tw-shrink-0 tw-mx-1">
                                    <img src={item} hieght="60px" width="60px" alt="" />
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
                                                जी.टी. रोड, अमृतसर बाईपास, जालंधर (पंजाब), भारत- 144011
                                            </p>
                                            <p className="tw-font-nunito-bold tw-text-xl tw-font-semibold">
                                                Dr. B R Ambedkar National Institute of Technology Jalandhar
                                            </p>
                                            <p className="tw-font-nunito-bold tw-text-[12px] ">
                                                G.T. Road, Amritsar Byepass, Jalandhar (Punjab), India-  144011
                                            </p> */}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </foreignObject>

                <foreignObject x="5%" y="170" width="85%" height="160">
                    <div className="tw-mt-8 tw-text-center tw-flex-col tw-flex tw-gap-1">
                        {header.map((item, ind) => (
                            <Text fontSize={item.fontSize} fontFamily={item.fontFamily} fontStyle={item.italic} fontWeight={item.bold} className="tw-text-gray-700 tw-uppercase" key={ind}>{item.header}</Text>
                        ))}
                    </div>
                </foreignObject>

                <text
                    x="425"
                    y="275"
                    fill="#424847"
                    fontFamily="AbhayaLibre-Regular"
                    fontSize="40.707"
                    textAnchor="middle"
                    fontWeight="550"
                >
                    CERTIFICATE OF APPRECIATION
                </text>

                <foreignObject x="10%" y="300" width="85%" height="160">
                <Text fontSize={contentBody.fontSize} fontFamily={contentBody.fontFamily} fontStyle={contentBody.italic} fontWeight={contentBody.bold} className="opacity-80">
                        <div>{ReactHtmlParser(contentBody.body)}</div>
                    </Text>
                </foreignObject>

                <foreignObject x={"13%"} y={425} width={"75%"} height={100}>
                    <div className="tw-flex-wrap tw-flex tw-items-center tw-justify-between tw-gap-6 tw-px-6 ">
                        {signature.map((item, key) => (
                            <div key={key} className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2">
                                <div className="tw-w-[100px]">
                                    <ProxifiedImage src={item.url} alt="" />
                                </div>
                                <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
                                <Text fontSize={item.name.fontSize} fontFamily={item.name.fontFamily} fontStyle={item.name.italic} fontWeight={item.name.bold} className="tw-text-black">{item.name.name}</Text>
                                <Text fontSize={item.position.fontSize} fontFamily={item.position.fontFamily} fontStyle={item.position.italic} fontWeight={item.position.bold} className="-tw-mt-3 tw-text-gray-900">{item.position.position}</Text>
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
        </svg>
    );
};

export default Template09;