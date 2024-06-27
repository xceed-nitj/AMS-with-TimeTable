import { useEffect, useRef } from 'react';
import downloadCertificatePdf from './certipdfdownload';
import QRCode from 'qrcode';
import CertificateContent from './certificatetemplates/template01';
import React, { useState } from "react";
import ReactHtmlParser from 'react-html-parser';
import getEnvironment from "../../getenvironment";
import SelectCertficate from './SelectCertficate';


const apiUrl = getEnvironment();

function ViewCertificate() {
  const [contentBody, setContentBody] = useState("");
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 2];
  const participantId = parts[parts.length - 1];
  console.log(participantId)
  const [certiType, setCertiType] = useState('');
  const [templateId, setTemplateId] = useState("0");

  const [title, setTitle] = useState([""]);
  const [verifiableLink, setVerifiableLink] = useState("");
  const [logos, setLogos] = useState([]);
  const [participantDetail, setParticipantDetail] = useState({});
  const [signature, setSignatures] = useState([]);
  const [header, setHeader] = useState([]);
  const [footer, setFooter] = useState([]);

  useEffect(() => {
    const fetchCertiType = async () => {
      try {
        const response = await fetch(`${apiUrl}/certificatemodule/participant/getoneparticipant/${participantId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Assuming the certiType is a property of the data object
          // setFormData((prevData) => ({ ...prevData, certiType: data.certiType }));
          setParticipantDetail(data);
          setCertiType(data.certiType);

          console.log('certiype', data.certiType)
        } else {
          console.error('Error fetching certiType data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching certiType data:', error);
      }
    };

    fetchCertiType();
  }, []);





  const fetchData = async () => {
    try {
      console.log('executing function');

      const response_one = await fetch(`${apiUrl}/certificatemodule/certificate/getcertificatedetails/${eventId}/${certiType}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response_one.ok) {
        const errorResponseOne = await response_one.text();
        console.error('Error fetching data from response_one:', errorResponseOne);
        return;
      }

      // Await the data_one promise
      const data_one = await response_one.json();
      // Await the data_one promise
      const data_two = participantDetail; // Await the data_two promise

      console.log('Data from response dataaaaaaaaa:', data_one);
      console.log('Data from response_two:', data_two);

      let content_body = data_one[0].body;
      setTitle(data_one[0].title);
      setVerifiableLink(data_one[0].verifiableLink);
      setLogos(data_one[0].logos);
      setSignatures(data_one[0].signatures);
      setHeader(data_one[0].header)
      setFooter(data_one[0].footer)
      setTemplateId(data_one[0].templateId);

      // Replace all placeholders with actual values from data_two
      Object.keys(data_two).forEach(variable => {
        const placeholder = new RegExp(`{{${variable}}}`, 'g');
        content_body = content_body.replace(placeholder, `<strong>${data_two[variable]}</strong>`);
        console.log('variable data', data_two[variable]);
      });

      // Now content_body has all the placeholders replaced with actual values from data_two
      const result = `${content_body}`;
      setContentBody(result);

      // Now content_body has all the placeholders replaced with actual values from data_two
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Call the fetch function when the component mounts
  useEffect(() => {
    fetchData();
  }, [participantId, certiType]); // Empty dependency array to execute the effect only once

  const svgRef = useRef();

  useEffect(() => {

    const url = window.location.href; // Replace with your URL
    const svg = svgRef.current;

    QRCode.toDataURL(url, (err, dataUrl) => {
      if (err) throw err;

      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('x', '100');
      image.setAttribute('y', '470');
      image.setAttribute('width', '100');
      image.setAttribute('height', '100');
      image.classList.add("qrcode");
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
      svg.appendChild(image)
      if (!verifiableLink) { document.querySelectorAll(".qrcode").forEach((elem) => { elem.remove() }) }
    });
  }, [verifiableLink]);

  return (
    <>
      <SelectCertficate
        eventId={eventId}
        templateId={templateId}
        title={title}
        verifiableLink={verifiableLink}
        contentBody={contentBody}
        certiType={certiType}
        logos={logos}
        participantDetail={participantDetail}
        signature={signature}
        header={header}
        footer={footer}
      />

      <button
        onClick={downloadCertificatePdf}
        style={{
          backgroundColor: 'blue',
          color: 'white',
          zIndex: '9999',
        }}
      >
        Download PDF
      </button>
    </>
  );
}

export default ViewCertificate;
