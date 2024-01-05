import React, { useState, useEffect } from "react";
import getEnvironment from "../../../../getenvironment";

const apiUrl = getEnvironment();

function Content() {
  const [contentBody, setContentBody] = useState("");
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 2];
  const participantId = parts[parts.length - 1];

    async function fetchData() {
        try {
          console.log('executing function');
          const [response_one, response_two] = await Promise.all([
            fetch(`${apiUrl}/certificatemodule/certificate/getcertificatedetails/${eventId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Error fetching data_one: ${response.status} ${response.statusText}`);
                }
                return response.json(); // Await the response.json() to get the actual data
              })
              .catch(error => {
                console.error('Error fetching data_one:', error.message);
                throw error;
              }),
      
            fetch(`${apiUrl}/certificatemodule/participant/addparticipant/${participantId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Error fetching data_two: ${response.status} ${response.statusText}`);
                }
                return response.json(); // Await the response.json() to get the actual data
              })
              .catch(error => {
                console.error('Error fetching data_two:', error.message);
                throw error;
              }),
          ]);
      
          const data_one = await response_one; // Await the data_one promise
          const data_two = await response_two; // Await the data_two promise

          console.log('Data from response_one:', data_one);
          console.log('Data from response_two:', data_two);
      
          const content_body = data_one.body;
          const name = data_two.name;
          const designation = data_two.designation;
      
          const result = `${content_body} ${name} ${designation}`;
          setContentBody(result);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
      
      // Call the fetch function when the component mounts
      useEffect(() => {
        fetchData();
      }, []); // Empty dependency array to execute the effect only once
      
   
    return (
        <>

            <text
                x="561.26"
                y="120.473"
                fill="#424847"
                fontFamily="AbhayaLibre-Regular"
                fontSize="25.707"
                textAnchor="middle"
                fontWeight="400"
            >
                Dr BR Ambedkar National Institute of Technology Jalandhar
            </text>

            <text
                x="561.26"
                y="145.473"
                fill="#424847"
                fontFamily="AbhayaLibre-Regular"
                fontSize="18.707"
                textAnchor="middle"
                opacity="0.9"
            >
                G.T. Road, Amritsar Bypass, Jalandhar (Punjab), India - 144008
            </text >

            <text
                x="561.26"
                y="300.473"
                fill="#424847"
                fontFamily="AbhayaLibre-Regular"
                fontSize="40.707"
                textAnchor="middle"
                fontWeight="550"
            >
                CERTIFICATE OF APPRECIATION
            </text>

            <foreignObject x="10%" y="400.473" width="85%" height="160">

                <p className="text-xl font-serif opacity-80">
                    {/* This is to certify that <strong>Akleem Khan </strong>
                    has been awarded this certificate in recognition of their outstanding contributions and dedication to the success of the

                    <strong> Pixel Perfect </strong>
                    held on <strong> 12-02-2023.</strong> */}

{contentBody}

                </p>
            </foreignObject>

            <foreignObject
                x="0"
                y="603.689"
                width="100%"
                height="2000">
                <div className="justify-center flex flex-wrap gap-20 w-full px-20">
                    <div className="w-[9rem] flex flex-col text-center">
                        <hr className="w-full h-[1.2px] bg-black mb-1" />
                        <p className=" font-serif opacity-80 font-normal">
                            Dr. Prem Singh
                        </p>
                    </div>
                    <div className="w-[9rem] flex flex-col text-center">
                        <hr className="w-full h-[1.2px] bg-black mb-1" />
                        <p className=" font-serif opacity-80 font-normal">
                            Dr. Prem Singh
                        </p>
                    </div>
                    <div className="w-[9rem] flex flex-col text-center">
                        <hr className="w-full h-[1.2px] bg-black mb-1" />
                        <p className=" font-serif opacity-80 font-normal">
                            Dr. Prem Singh
                        </p>
                    </div>
                    <div className="w-[9rem] flex flex-col text-center">
                        <hr className="w-full h-[1.2px] bg-black mb-1" />
                        <p className=" font-serif opacity-80 font-normal">
                            Dr. Prem Singh
                        </p>
                    </div>
                </div>
            </foreignObject>

        </>
    )
}

export default Content
