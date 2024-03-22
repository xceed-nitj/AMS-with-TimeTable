
import { useState, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';

import getEnvironment from "../../../../getenvironment";
import ProxifiedImage from "../../../components/ProxifiedImage";
import SelectCertficate from '../../SelectCertficate';

const apiUrl = getEnvironment();

function Content() {
  const [contentBody, setContentBody] = useState("");
  const currentURL = window.location.href;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 2];
  const participantId = parts[parts.length - 1];
  const [certiType, setCertiType] = useState('');
  const [logos, setLogos] = useState([]);
  const [participantDetail, setParticipantDetail] = useState({});
  const [signature, setSignatures] = useState([]);
  const [header, setHeader] = useState([]);
  const [templateId, setTemplateId] = useState("0")

  // const [footer, setFooter] = useState([]);


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
        } else {
          console.error('Error fetching certiType data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching certiType data:', error);
      }
    };

    fetchCertiType();
  }, [participantId]);

  // Call the fetch function when the component mounts
  useEffect(() => {
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

        let content_body = data_one[0].body;
        setLogos(data_one[0].logos);
        setSignatures(data_one[0].signatures);
        setHeader(data_one[0].header)
        setTemplateId(data_one[0]?.templateId || "0")
        // setFooter(data_one[0].footer)


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
    };
    fetchData();
  }, [participantId, certiType, participantDetail, eventId]); // Empty dependency array to execute the effect only once

  return (
    <SelectCertficate eventId={eventId} contentBody={contentBody} certiType={certiType} logos={logos} participantDetail={participantDetail} signature={signature} header={header} templateId={templateId} />
  );

}

export default Content
