
import { useState, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';

import getEnvironment from "../../../../getenvironment";
import ProxifiedImage from "../../../components/ProxifiedImage";

const apiUrl = getEnvironment();

function Content() {
  const [contentBody, setContentBody] = useState("");
  const currentURL = window.location.href;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 2];
  const participantId = parts[parts.length - 1];
  const [certiType, setCertiType] = useState('');
  const [logos, setLogos] = useState([]);
  const [participantDetail,setParticipantDetail]=useState({});
  const [signature, setSignatures] = useState([]);
  const [header, setHeader] = useState([]);
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

  var num_logos = logos.length;
  var num_left = 0;
  if (num_logos % 2 == 0) {
    num_left = num_logos / 2 - 1;
  }
  else {
    num_left = Math.floor(num_logos / 2);
  }

  
    return (
      <>
        <foreignObject width={"90%"} height={"400"} y={"80"} x={"5%"}>
          <div className="tw-flex tw-items-center tw-justify-center tw-w-full">
            {logos.map((item, key) => (
              <div key={key} className="tw-flex tw-items-center tw-justify-center ">
                <div className="tw-w-20 tw-shrink-0 tw-mx-6">
                  <img src={item.url} alt="" />
                </div>
                <div className="tw-text-center">
                  {key === num_left && (
                    <>
                      <p className="tw-font-nunito-bold tw-text-xl tw-font-medium">
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
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div className="tw-mt-8 tw-text-center tw-flex-col tw-flex tw-gap-1">
              {header.map((item, ind) => (
                <h1 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-uppercase" key={ind}>{item}</h1>
              ))}
            </div>
          </div>
        </foreignObject>
    
        <foreignObject x="10%" y="200.473" width="85%" height="160">
          {/* Assuming header is a string, otherwise, adjust accordingly */}
          {header.map((item, ind) => (
            <div key={ind}>{item}</div>
          ))}
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
    
        <foreignObject x={"20%"} y={515} width={"60%"} height={400}>
          <div className="tw-flex-wrap tw-flex tw-items-center tw-justify-between tw-gap-6 tw-px-6 ">
            {signature.map((item, key) => (
              <div key={key} className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2">
                <div className="tw-w-[100px]">
                  <ProxifiedImage src={item.url} alt="" />
                </div>
                <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
                <p className="tw-text-black tw-text-[15px] tw-font-semibold">{item.name}</p>
                <p className="tw-text-[13px] -tw-mt-3 tw-text-gray-900">{item.position}</p>
              </div>
            ))}
          </div>
        </foreignObject>
    
        <foreignObject x={"25%"} y={"90%"} width={"50%"} height={"100"}>
          <div className="tw-text-sm tw-text-center tw-text-gray-700 tw-underline">
            <a href={currentURL}>{currentURL}</a>
          </div>
        </foreignObject>
      </>
    );
    
}

export default Content
