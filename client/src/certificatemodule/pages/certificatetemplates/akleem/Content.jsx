import React, { useState, useEffect } from "react";
import getEnvironment from "../../../../getenvironment";

const apiUrl = getEnvironment();

const signature = [
  {
    name: 'Kiana Kutch ',
    position: 'sequi',
    url: 'https://placehold.co/400x200',
  },
  {
    name: 'Kiana Kutch',
    position: 'sequi',
    url: 'https://placehold.co/400x200',
  },

  {
    name: 'Carleton Wehner',
    position: 'nisi',
    url: 'https://placehold.co/400x200',
  },
  {
    name: 'Lora Runolfsson',
    position: 'ut',
    url: 'https://placehold.co/400x200',
  },
  {
    name: 'Orville Bosco',
    position: 'quia',
    url: 'https://placehold.co/400x200',
  },
  {
    name: 'Prof. Easton Breitenberg',
    position: 'voluptatem',
    url: 'https://placehold.co/400x200',
  },
]
function Content() {
  const [contentBody, setContentBody] = useState("");
  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 2];
  const participantId = parts[parts.length - 1];
  console.log(participantId)
  const [certiType, setCertiType] = useState('');


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





  async function fetchData() {
    try {
      console.log('executing function');
      const [response_one, response_two] = await Promise.all([
        fetch(`${apiUrl}/certificatemodule/certificate/getcertificatedetails/${eventId}/${certiType}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),

        fetch(`${apiUrl}/certificatemodule/participant/getoneparticipant/${participantId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })
        ,
      ]);

      //   console.log('Data from response_one:', response_one.json());
      //   console.log('Data from response_two:', response_two.json());

      const data_one = await response_one.json(); // Await the data_one promise
      const data_two = await response_two.json(); // Await the data_two promise

      console.log('Data from response dataaaaaaaaa:', data_one);
      console.log('Data from response_two:', data_two);

      let content_body = data_one[0].body;

      // Replace all placeholders with actual values from data_two
      Object.keys(data_two).forEach(variable => {
        const placeholder = new RegExp(`{{${variable}}}`, 'g');
        content_body = content_body.replace(placeholder, data_two[variable]);
        console.log('vriable data', data_two[variable])
      });

      // Now content_body has all the placeholders replaced with actual values from data_two
      const result = `${content_body}`;
      setContentBody(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Call the fetch function when the component mounts
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array to execute the effect only once

  const logos = [
    {
      name: 'Kiana Kutch',
      position: 'sequi',
      url: 'https://placehold.co/200x200',
    },
    {
      name: 'Carleton Wehner',
      position: 'nisi',
      url: 'https://placehold.co/200x200',
    },
    {
      name: 'Lora Runolfsson',
      position: 'ut',
      url: 'https://placehold.co/200x200',
    },

    {
      name: 'Orville Bosco',
      position: 'quia',
      url: 'https://placehold.co/200x200',
    }
  ]

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
      <foreignObject width={"90%"} height={"200"} y={"80"} x={"5%"}>

        <div className="tw-flex tw-items-center tw-justify-center tw-w-full">

          {logos.map((item, key) => (
            <div
              key={key}
              className="tw-flex tw-items-center tw-justify-center "
            >
              <div className="tw-w-20 tw-shrink-0 tw-mx-6">
                <img src={item.url} alt="" />
              </div>
              <div className="tw-text-center">
                {key === num_left && (
                  <>
                    <p className="tw-font-nunito-bold tw-text-lg">
                      डॉ. बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर
                    </p>
                    <p className="tw-font-nunito-bold tw-text-[10px]">
                      जी.टी. रोड, अमृतसर बाईपास, जालंधर (पंजाब), भारत-144008
                    </p>
                    <p className="tw-font-nunito-bold tw-text-lg">
                      Dr. B R Ambedkar National Institute of Technology Jalandhar
                    </p>
                    <p className="tw-font-nunito-bold tw-text-[10px]">
                      G.T. Road, Amritsar Byepass, Jalandhar (Punjab), India- 144008
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </foreignObject>


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

      <foreignObject x="10%" y="350.473" width="85%" height="160">

        <p className="font-serif text-xl opacity-80">
          This is to certify that <strong>Akleem Khan </strong>
          has been awarded this certificate in recognition of their outstanding contributions and dedication to the success of the

          <strong> Pixel Perfect </strong>
          held on <strong> 12-02-2023.</strong>

          {contentBody}

        </p>
      </foreignObject>

      <foreignObject x={212.5} y={490} width={700} height={400}>
        <div className="tw-flex-wrap tw-flex tw-items-center tw-justify-center tw-gap-6">
          {signature.map((item, key) => (
            <div
              key={key}
              className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2"
            >
              <div className="tw-w-[100px]" ><img src={item.url} alt="" /></div>
              <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
              <p className="tw-text-black tw-text-[15px] tw-font-semibold">{item.name}</p>
              <p className="tw-text-[13px] -tw-mt-3
              tw-text-gray-900">{item.position}</p>
            </div>
          ))}
        </div>
      </foreignObject>

    </>
  )
}

export default Content
