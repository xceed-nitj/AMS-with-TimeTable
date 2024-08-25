
import { useState, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';

import getEnvironment from "../../../../getenvironment";
import ProxifiedImage from "../../../components/ProxifiedImage";
import SelectCertficate from '../../SelectCertficate';

const apiUrl = getEnvironment();

function Content() {
  const [contentBody, setContentBody] = useState({
    body: "",
    fontSize: 16,
    fontFamily: "",
    bold: "normal",
    italic: "normal",
    fontColor: "black"

  });
  const date = new Date();
  const a = date.getMonth()>9?"":0
  const defaultDate = `${date.getFullYear()}-${a}${date.getMonth()+1}-${date.getDate()}`
  const currentURL = window.location.href;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 2];
  const participantId = parts[parts.length - 1];
  const [title, settitle] = useState([
    {
      name: "डॉ बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर",
      fontSize: 20,
      fontFamily: "Noto Serif Devanagari",
      bold: "bold",
      italic: "normal",
      fontColor: "black"
    },
    {
      name: "जी.टी. रोड, अमृतसर बाईपास, जालंधर, पंजाब, भारत-144008",
      fontSize: 14,
      fontFamily: "Noto Serif Devanagari",
      bold: "normal",
      italic: "normal",
      fontColor: "black"
    },
    {
      name: "Dr B R Ambedkar National Institute of Technology Jalandhar",
      fontSize: 19,
      fontFamily: "serif",
      bold: "bold",
      italic: "normal",
      fontColor: "black"
    },
    {
      name: "G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008",
      fontSize: 14,
      fontFamily: "serif",
      bold: "normal",
      italic: "normal",
      fontColor: "black"
    }
  ])
  const [verifiableLink, setVerifiableLink] = useState(false)
  const [certiType, setCertiType] = useState('');
  const [logos, setLogos] = useState([""]);
  const [participantDetail, setParticipantDetail] = useState({});
  const [signature, setSignatures] = useState([
    {
      name: {
        name: "",
        fontSize: 12,
        fontFamily: "",
        bold: "normal",
        italic: "normal",
        fontColor: "black"
      },
      position: {
        position: "",
        fontSize: 10,
        fontFamily: "",
        bold: "normal",
        italic: "normal",
        fontColor: "black"
      },
      url: "",
    },
  ]);
  const [header, setHeader] = useState([
    {
      header: "",
      fontSize: 20,
      fontFamily: "",
      bold: "bold",
      italic: "normal",
      fontColor: "black"
    }
  ]);
  const [templateId, setTemplateId] = useState("0")
  const [footer, setFooter] = useState({ footer: defaultDate })
  const [certificateOf, setCertificateOf] = useState({
    certificateOf: "CERTIFICATE OF APPRECIATION",
    fontSize: 30,
    fontFamily: "",
    bold: "bold",
    italic: "normal",
    fontColor: "black"
  })

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
        let { title, certificateOf, signatures, header, footer, body, logos, templateId, verifiableLink } = data_one[0];
        let Signatures = [];
        if (signatures[0].name.name || signatures[0].name.name=="") {
          Signatures = signatures
          if (!(signatures[0].url.url)) {
            signatures.forEach((elem, index) => {
              Signatures[index].url = { url: elem.url, size: 100 }
            })
          }
        } else {
          signatures.forEach(element => {
            let sign = {
              name: { name: element.name, fontSize: 12, fontFamily: "", bold: "normal", italic: "normal" },
              position: { position: element.position, fontSize: 10, fontFamily: "", bold: "normal", italic: "normal" },
              url: element.url,
            }
            Signatures.push(sign)
          });
        }
        for(let i=0; i<Signatures.length;i++){
          console.log(Signatures)
          Signatures[i].url.url=await fetchImageToDataURL(Signatures[i].url.url)
          console.log(Signatures[i].url.url)
        }
        setSignatures(Signatures)
        //for header
        let Header = []
        if (header[0].header || header[0].header=="") {
          Header = header
        } else {
          header.forEach(element => {
            let str = ""
            for (let key in element) { parseInt(key) || (key == "0") ? str = str + element[key] : "" }
            let head = { header: str, fontSize: 20, fontFamily: "", bold: "bold", italic: "normal" }
            Header.push(head)
          });
        }
        setHeader(Header)
        // for footer
        let Footer = {}
        if (Array.isArray(footer)) {
          Footer = { footer: defaultDate }
        } else {
          Footer = footer
        }
        setFooter(Footer)
        // for body
        let Body = contentBody;
        if (typeof (body) === "string") {
          Body.body = body
        } else {
          Body = body
        }
        console.log(Body)
        //for Title
        let Title = []
        if (title[0]) {
          if (title[0][0] || title[0][0]=="") {
            title.forEach(element => {
              let str = ""
              for (let key in element) { parseInt(key) || (key == "0") ? str = str + element[key] : "" }
              let obj = { name: str, fontSize: 18, fontFamily: "", bold: "normal", italic: "normal" }
              Title.push(obj)
            });
          } else if (title[0]["name"] || title[0]["name"]=="") {
            Title = title
          }
        } else {
          Title = [{ name: "डॉ बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर", fontSize: 20, fontFamily: "Noto Serif Devanagari", bold: "bold", italic: "normal" }, { name: "जी.टी. रोड, अमृतसर बाईपास, जालंधर, पंजाब, भारत-144008", fontSize: 14, fontFamily: "Noto Serif Devanagari", bold: "normal", italic: "normal" }, { name: "Dr B R Ambedkar National Institute of Technology Jalandhar", fontSize: 19, fontFamily: "serif", bold: "bold", italic: "normal" }, { name: "G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008", fontSize: 14, fontFamily: "serif", bold: "normal", italic: "normal" }]
        }
        //for certificateOf
        if (certificateOf) {
          setCertificateOf(certificateOf)
        }

        settitle(Title)

        //for logos
        let Logos = data_one[0].logos
        let logo = []
        if (Logos[0].url || Logos[0].url=="") {
          logo = Logos
        } else {

          logos.forEach(element => {
            let str = ""
            for (let key in element) { parseInt(key) || (key == "0") ? str = str + element[key] : "" }
            let logo1 = { url: str, width: 80, height: 80 }
            logo.push(logo1)
          });
        }
        console.log(logo)
          for(let i = 0; i<logo.length;i++){
            logo[i].url= await fetchImageToDataURL(logo[i].url)
            console.log(logo[i].url)
          }
        setLogos(logo);
        // if(data_one[0].title){settitle(data_one[0].title)};
        const verifiablelink = data_one[0].verifiableLink.toString()
        // console.log(verifiableLink)
        setVerifiableLink(verifiablelink);
        // setSignatures(data_one[0].signatures);
        // setHeader(data_one[0].header)
        setTemplateId(data_one[0]?.templateId || "0")
        // setFooter(data_one[0].footer)


        // Replace all placeholders with actual values from data_two
        Object.keys(data_two).forEach(variable => {
          const placeholder = new RegExp(`{{${variable}}}`, 'g');
          Body.body = Body.body.replace(placeholder, `<strong>${data_two[variable]}</strong>`);
          console.log('variable data', data_two[variable]);
        });

        // Now content_body has all the placeholders replaced with actual values from data_two
        const result = `${Body.body}`;
        setContentBody({ body: result, italic: Body.italic, fontFamily: Body.fontFamily, fontSize: Body.fontSize, bold: Body.bold, fontColor: body.fontColor });
        // console.log(eventId, contentBody, certiType, title, verifiableLink, logos, signature, header, templateId)
        // Now content_body has all the placeholders replaced with actual values from data_two
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      async function fetchImageToDataURL(imageUrl) {
        try {
          const response = await fetch(imageUrl);
          console.log(response)
          if (response.ok) {
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend
                = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            return ""
          }
        } catch (error) {
          return "error";
        }
      }
      // async function fetchImages() {
      //   const input = document.getElementById('id-card-class').firstElementChild;
      //   const images = input.getElementsByTagName("img")
      //   console.log(images)
      //   for (let i = 0; i < images.length; i++) {
      //     if (images[i].src) {
      //       const response = await fetchImageToDataURL(`${apiUrl}/proxy-image/?url=${images[i].src}`)
      //       // console.log(response);
      //       if (response && !(response == "error")) {
      //         console.log(images[i].src)
      //         const dataUrl = await response;
      //         images[i].src = dataUrl;
      //         // console.log(dataUrl);
      //       } else {
      //         images[i].remove()
      //       }
      //     } else {
      //       images[i].remove()
      //     }
      //   }  
      // }
      // await fetchImages();
    };
    fetchData();
    
    
  }, [participantId, certiType, participantDetail, eventId]); // Empty dependency array to execute the effect only once

  return (
    <SelectCertficate
      eventId={eventId}
      contentBody={contentBody}
      certiType={certiType}
      title={title}
      verifiableLink={verifiableLink}
      logos={logos}
      participantDetail={participantDetail}
      signature={signature}
      header={header}
      templateId={templateId}
      footer={footer}
      certificateOf={certificateOf}
    />
  );

}

export default Content
