import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  VStack,
  IconButton,
  HStack,
  Textarea,
  Flex,
  Box,
  Text,
  Container,
  Select,
  position,
  Checkbox
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from '@chakra-ui/react';
import CertificateContent from './certificatetemplates/basic01';
import SelectCertficate from './SelectCertficate';

const CertificateForm = () => {
  const apiUrl = getEnvironment();
  const toast = useToast();
  const [type, setType] = useState('');
  const [formData, setFormData] = useState({
    logos: [""],
    header: [
      {
        header: "",
        fontSize: "",
        fontFamily: "",
        bold: "normal",
        italic: "normal"
      }
    ],
    body: {
      body: "",
      fontSize: "",
      fontFamily: "",
      bold: "normal",
      italic: "normal"
    },
    footer: [
      {
        footer: "",
        fontSize: "",
        fontFamily: "",
        bold: "normal",
        italic: "normal"
      }
    ],
    signatures: [
      {
        name: {
          name: "",
          fontSize: "",
          fontFamily: "",
          bold: "normal",
          italic: "normal"
        },
        position: {
          position: "",
          fontSize: "",
          fontFamily: "",
          bold: "normal",
          italic: "normal"
        },
        url: "",
      },
    ],
    certiType: "",
    templateId: "", //Template Design Number
    title: [
      {
        name: "डॉ बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर",
        fontSize: 20,
        fontFamily: "sans-serif",
        bold: "normal",
        italic: "normal"
      },
      {
        name: "जी.टी. रोड, अमृतसर बाईपास, जालंधर, पंजाब, भारत-144008",
        fontSize: 14,
        fontFamily: "serif",
        bold: "normal",
        italic: "normal"
      },
      {
        name: "Dr B R Ambedkar National Institute of Technology Jalandhar",
        fontSize: 19,
        fontFamily: "serif",
        bold: "normal",
        italic: "normal"
      },
      {
        name: "G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008",
        fontSize: 14,
        fontFamily: "serif",
        bold: "normal",
        italic: "normal"
      }
    ],
    verifiableLink: false,
  });


  // console.log(formData.templateId);

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 1];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/certificatemodule/certificate/getcertificatedetails/${eventId}/${formData.certiType}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          console.log('response:', responseData);
          if (
            responseData &&
            Array.isArray(responseData) &&
            responseData.length > 0
          ) {
            let { title, signatures, header, footer, body, certiType, logos, templateId, verifiableLink } = responseData[0];
            //condition for signatures
            let Signatures = [];
            if (signatures[0].name.name) {
              Signatures = signatures
            } else {
              signatures.forEach(element => {
                let sign = {
                  name: { name: element.name, fontSize: "", fontFamily: "", bold: "normal", italic: "normal" },
                  position: { position: element.position, fontSize: "", fontFamily: "", bold: "normal", italic: "normal" },
                  url: element.url,
                }
                Signatures.push(sign)
              });
            }
            //for header
            let Header = []
            if (header[0].header) {
              Header = header
            } else {
              header.forEach(element => {
                let str = ""
                for (let key in element) { parseInt(key) || (key == "0") ? str = str + element[key] : "" }
                let head = { header: str, fontSize: "", fontFamily: "", bold: "normal", italic: "normal" }
                Header.push(head)
              });
            }
            // for footer
            let Footer = []
            if (footer[0].footer) {
              Footer = footer
            } else {
              footer.forEach(element => {
                let str = ""
                for (let key in element) { parseInt(key) || (key == "0") ? str = str + element[key] : "" }
                let foot = { footer: str, fontSize: "", fontFamily: "", bold: "normal", italic: "normal" }
                Footer.push(foot)
              });
            }
            // for body
            let Body = formData.body
            if (body.body) {
              Body = body
            } else {
              Body.body = body
            }
            console.log(title)
            //for title
            let Title = []
            if (title[0]) {
              if (title[0][0]) {
                title.forEach(element => {
                  let str = ""
                  for (let key in element) { parseInt(key) || (key == "0") ? str = str + element[key] : "" }
                  let obj = { name: str, fontSize: "", fontFamily: "", bold: "normal", italic: "normal" }
                  Title.push(obj)
                });
              }else if(title[0]["name"]){
                Title = title
              }
            }else {
              Title = [{name: "डॉ बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर",fontSize: 20,fontFamily: "sans-serif",bold: "normal",italic: "normal"},{name: "जी.टी. रोड, अमृतसर बाईपास, जालंधर, पंजाब, भारत-144008",fontSize: 14,fontFamily: "serif",bold: "normal",italic: "normal"},{name: "Dr B R Ambedkar National Institute of Technology Jalandhar",fontSize: 19,fontFamily: "serif",bold: "normal",italic: "normal"},{name: "G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008",fontSize: 14,fontFamily: "serif",bold: "normal",italic: "normal"}]
            }
            console.log(verifiableLink)
            //for verifiableLink
            if (verifiableLink === true) {
              verifiableLink = true
            }else{
              verifiableLink= false
            }

            // console.log(Title,Body,Footer,Header,Signatures)
            setFormData({ title: Title, body: Body, footer: Footer, header: Header, signatures: Signatures, certiType: certiType, logos: logos, templateId: templateId, verifiableLink: verifiableLink });
            console.log(formData)
          } else {
            console.error(
              'Error: Fetched data does not match the expected structure.'
            );
          }
        } else {
          console.error('Error fetching form data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    if (formData.certiType) {
      fetchData();
    }
  }, [apiUrl, eventId, formData.certiType]);


  const handleChangeStyle = (event, fieldName, index) => {
    if (event.target.checked) {
      const value = event.target.name.split(".").pop()
      if (fieldName === 'signatures') {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const signatureField = event.target.name.split('.')[1];
          if (signatureField == "name" || signatureField == "position") {
            const signField = event.target.name.split('.')[2];
            updatedField[index][signatureField] = {
              ...updatedField[index][signatureField],
              [signField]: value
            }
          }
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      } else if (fieldName === "body") {
        setFormData((prevData) => {
          const updatedField = prevData[fieldName];
          const objectField = event.target.name.split('.')[1];
          updatedField[objectField] = value;
          return {
            ...prevData,
            [fieldName]: updatedField
          }
        })
      } else {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const objectField = event.target.name.split('.')[1];
          updatedField[index] = {
            ...updatedField[index],
            [objectField]: value,
          }
          return {
            ...prevData,
            [fieldName]: updatedField,
          }
        })
      }
    } else {
      const value = "normal"
      if (fieldName === 'signatures') {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const signatureField = event.target.name.split('.')[1];
          if (signatureField == "name" || signatureField == "position") {
            const signField = event.target.name.split('.')[2];
            updatedField[index][signatureField] = {
              ...updatedField[index][signatureField],
              [signField]: value
            }
          }
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      } else if (fieldName === "body") {
        setFormData((prevData) => {
          const updatedField = prevData[fieldName];
          const objectField = event.target.name.split('.')[1];
          updatedField[objectField] = value;
          return {
            ...prevData,
            [fieldName]: updatedField
          }
        })
      } else {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const objectField = event.target.name.split('.')[1];
          updatedField[index] = {
            ...updatedField[index],
            [objectField]: value,
          }
          return {
            ...prevData,
            [fieldName]: updatedField,
          }
        })
      }

    }

  };
  const handleChange = (e, fieldName, index) => {
    const { value } = e.target;

    if (fieldName === 'templateId') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: value,
      }));
    }
    if (
      fieldName === 'logos' ||
      fieldName === 'header' ||
      fieldName === 'footer' ||
      fieldName === 'signatures' ||
      fieldName === 'title'
    ) {
      setFormData((prevData) => {
        const updatedField = [...prevData[fieldName]];
        if (index !== null) {
          // For signatures, update the specific property of the signature object
          if (fieldName === 'signatures') {
            const signatureField = e.target.name.split('.')[1]; // Extract the property name (name, position, url)
            if (signatureField == "name" || signatureField == "position") {
              const signField = e.target.name.split('.')[2];
              updatedField[index][signatureField] = {
                ...updatedField[index][signatureField],
                [signField]: value
              }
            }
            else {
              updatedField[index] = {
                ...updatedField[index],
                [signatureField]: value,
              };
            }
          }
          else if (fieldName === 'logos') {
            updatedField[index] = value;
          } else {
            const objectField = e.target.name.split('.')[1];
            updatedField[index] = {
              ...updatedField[index],
              [objectField]: (objectField == "fontSize") ? isNaN(parseInt(value)) ? 6 : parseInt(value) : value,
            }
          }
        }

        return {
          ...prevData,
          [fieldName]: updatedField,
        };
      });
    } else if (fieldName === "body") {
      setFormData((prevData) => {
        const updatedField = prevData[fieldName];
        const objectField = e.target.name.split('.')[1];
        updatedField[objectField] = value;
        return {
          ...prevData,
          [fieldName]: updatedField
        }

      })
    } else if (fieldName === 'certiType' || fieldName === 'verifiableLink') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: value,
      }));
    }
  };

  const addField = (fieldName) => {
    if (fieldName === 'signatures') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: [
          ...prevData[fieldName],
          { name: { name: "", fontSize: "", fontFamily: "", bold: "normal", italic: "normal" }, position: { position: "", fontSize: "", fontFamily: "", bold: "normal", italic: "normal" }, url: "" },
        ],
      }));
    } else if (fieldName === 'logos') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: [...prevData[fieldName], ""],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: [...prevData[fieldName], {}],
      }));
    }
  };

  const handleDelete = (fieldName, index) => {
    const updatedField = [...formData[fieldName]];
    updatedField.splice(index, 1);

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: updatedField,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/certificatemodule/certificate/content/${eventId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        // console.log(responseData);
        toast({
          title: 'Submission successfull',
          description: responseData.message,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        console.error('Error submitting form:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Flex
      style={{
        height: '89dvh',
        // overflowY: 'scroll',
        clipPath: 'content-box',
      }}
    >
      <Container
        maxW="lg"
        style={{
          height: '89dvh',
          overflowY: 'scroll',
          // clipPath: 'content-box',
        }}
      >
        <Header title="Enter Certificate Details"></Header>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="start">
            <Text>Select Certificate Type:</Text>
            <Select
              name="certiType"
              value={formData.certiType}
              onChange={(e) => handleChange(e, 'certiType', null)}
              placeholder="Select Certificate Type"
            >
              <option value="winner">Winner</option>
              <option value="participant">Participant</option>
              <option value="speaker">Speaker</option>
              <option value="organizer">Organizer</option>
            </Select>


            {/* Title Fields */}
            <Text>Enter the name of Institute</Text>

            {formData.title.length == 0 ? formData.title = [''] : formData.title.map((title, index) => (
              <VStack key={index} width="100%">
                <HStack width="100%">
                  <Input
                    name={`title[${index}].name`}
                    value={title.name}
                    onChange={(e) => handleChange(e, 'title', index)}
                    placeholder="Title"
                    width="100%"
                  />
                  {/* <input
                  style={{border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    width: "40px",
                    textAlign: "center",
                    height: "40px",}}
                  name={`title[${index}].fontSize`}
                  type="number"
                  value={title.fontSize}
                  onChange={(e) => handleChange(e, 'title', index)}
                  placeholder="Size"
                /> */}
                  {index > 0 && (
                    <IconButton
                      width="30px"
                      icon={<CloseIcon />}
                      onClick={() => handleDelete('title', index)}
                    />
                  )}
                  {index === formData.title.length - 1 && (
                    <IconButton
                      icon={<AddIcon />}
                      onClick={() => addField('title')}
                    />
                  )}</HStack>
                <HStack><Select
                  name={`title[${index}].fontSize`}
                  value={title.fontSize}
                  onChange={(e) => handleChange(e, 'title', index)}
                  placeholder="Size"
                  width="30%"
                >
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="17">17</option>
                  <option value="19">19</option>
                  <option value="20">20</option>
                  <option value="22">22</option>
                  <option value="24">24</option>
                  <option value="26">26</option>
                  <option value="28">28</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                  <option value="34">34</option>
                  <option value="36">36</option>

                </Select>
                  <Select
                    name={`title[${index}].fontFamily`}
                    value={title.fontFamily}
                    onChange={(e) => handleChange(e, 'title', index)}
                    placeholder="Style"
                    width="29%"
                  >
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Euphoria Script">Euphoria Script</option>
                    <option value="Cookie">Cookie</option>
                    <option value="UnifrakturCook">UnifrakturCook</option>
                    <option value="Allura">Allura</option>
                    <option value="Alex Brush">Alex Brush</option>
                    <option value="Libre Caslon Display">Libre Caslon Display</option>
                    <option value="Special Elite">Special Elite</option>
                    <option value="Monoton">Monoton</option>
                    <option value="Dancing Script">Dancing Script</option>
                    <option value="Playwrite DE Grund">Playwrite DE Grund</option>
                    <option value="Noto Serif Devanagari">Noto Serif Devanagari</option>
                  </Select>
                  <Checkbox name={`title[${index}].bold`} isChecked={title.bold == "bold" ? true : false} onChange={(e) => handleChangeStyle(e, 'title', index)}>
                    Bold
                  </Checkbox>
                  <Checkbox name={`title[${index}].italic`} isChecked={title.italic == "italic"} onChange={(e) => handleChangeStyle(e, 'title', index)}>
                    Italic
                  </Checkbox></HStack>
              </VStack>
            ))}



            <Text>Select Certificate Template Design:</Text>
            <Select
              name="templateId"
              value={formData.templateId}
              onChange={(e) => handleChange(e, 'templateId', null)}
              placeholder="Select Certificate Template Design"
            >
              <option value="0">Basic 1</option>
              <option value="1">Basic 2</option>
              <option value="2">Basic 3</option>
              <option value="3">Basic 4</option>
              <option value="4">Basic 5</option>
              <option value="5">Basic 6</option>
              <option value="6">Basic 7</option>
              <option value="7">Basic 8</option>
              <option value="8">Basic 9</option>
              <option value="13">Basic 10</option>
              <option value="16">Basic 11</option>
              <option value="17">Basic 12</option>
              <option value="18">Basic 13</option>
              <option value="19">Basic 14</option>
              <option value="20">Basic 15</option>
              <option value="21">Basic 16</option>
              <option value="9">Premium 1</option>
              <option value="10">Premium 2</option>
              <option value="11">Premium 3</option>
              <option value="12">Premium 4</option>
              <option value="14">Premium 5</option>
              <option value="15">Premium 6</option>
              <option value="22">Premium 7</option>
            </Select>



            {/* Logos Fields */}
            <Text>Enter the link for the logos:</Text>

            {formData.logos.map((logo, index) => (
              <HStack width='100%' key={index}>
                <Input
                  name="logos"
                  value={logo}
                  onChange={(e) => handleChange(e, 'logos', index)}
                  placeholder="Logo"
                  width="100%"
                />
                {index > 0 && (
                  <IconButton
                    icon={<CloseIcon />}
                    onClick={() => handleDelete('logos', index)}
                  />
                )}
                {index === formData.logos.length - 1 && (
                  <IconButton
                    icon={<AddIcon />}
                    onClick={() => addField('logos')}
                  />
                )}
              </HStack>
            ))}


            {/* Header Fields */}
            <Text>Enter Department or Club data:</Text>

            {formData.header.map((header, index) => (
              <VStack key={index}>
                <HStack width="100%" >
                  <Input
                    name={`header[${index}].header`}
                    value={header.header}
                    onChange={(e) => handleChange(e, 'header', index)}
                    placeholder="Header"
                    width="100%"
                  />


                  {index > 0 && (
                    <IconButton
                      icon={<CloseIcon />}
                      onClick={() => handleDelete('header', index)}
                    />
                  )}
                  {index === formData.header.length - 1 && (
                    <IconButton
                      icon={<AddIcon />}
                      onClick={() => addField('header')}
                    />
                  )}
                </HStack>
                <HStack width="100%"><Select
                  name={`header[${index}].fontSize`}
                  value={header.fontSize}
                  onChange={(e) => handleChange(e, 'header', index)}
                  placeholder="Size"
                  width="30%"
                >
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="17">17</option>
                  <option value="19">19</option>
                  <option value="20">20</option>
                  <option value="22">22</option>
                  <option value="24">24</option>
                  <option value="26">26</option>
                  <option value="28">28</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                  <option value="34">34</option>
                  <option value="36">36</option>

                </Select>
                  <Select
                    name={`header[${index}].fontFamily`}
                    value={header.fontFamily}
                    onChange={(e) => handleChange(e, 'header', index)}
                    placeholder="Style"
                    width="29%"
                  >
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Euphoria Script">Euphoria Script</option>
                    <option value="Cookie">Cookie</option>
                    <option value="UnifrakturCook">UnifrakturCook</option>
                    <option value="Allura">Allura</option>
                    <option value="Alex Brush">Alex Brush</option>
                    <option value="Libre Caslon Display">Libre Caslon Display</option>
                    <option value="Special Elite">Special Elite</option>
                    <option value="Monoton">Monoton</option>
                    <option value="Dancing Script">Dancing Script</option>
                    <option value="Playwrite DE Grund">Playwrite DE Grund</option>
                    <option value="Noto Serif Devanagari">Noto Serif Devanagari</option>
                  </Select>
                  <Checkbox name={`header[${index}].bold`} isChecked={header.bold == "bold"} onChange={(e) => handleChangeStyle(e, 'header', index)}>
                    Bold
                  </Checkbox>
                  <Checkbox name={`header[${index}].italic`} isChecked={header.italic == "italic"} onChange={(e) => handleChangeStyle(e, 'header', index)}>
                    Italic
                  </Checkbox>
                </HStack></VStack>
            ))}


            {/* Body of the certificate */}
            <Text>Enter the body of the certificate:</Text>
            <VStack width='100%'>
              <Textarea
                name="body.body"
                value={formData.body.body}
                onChange={(e) => handleChange(e, 'body', null)}
                placeholder="Body"
                width='100%'
              />
              <HStack><Select
                name={`body.fontSize`}
                value={formData.body.fontSize}
                onChange={(e) => handleChange(e, 'body', null)}
                placeholder="Size"
                width="30%"
              >
                <option value="6">6</option>
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="17">17</option>
                <option value="19">19</option>
                <option value="20">20</option>
                <option value="22">22</option>
                <option value="24">24</option>
                <option value="26">26</option>
                <option value="28">28</option>
                <option value="30">30</option>
                <option value="32">32</option>
                <option value="34">34</option>
                <option value="36">36</option>

              </Select>
                <Select
                  name={`body.fontFamily`}
                  value={formData.body.fontFamily}
                  onChange={(e) => handleChange(e, 'body', null)}
                  placeholder="Style"
                  width="29%"
                >
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Euphoria Script">Euphoria Script</option>
                  <option value="Cookie">Cookie</option>
                  <option value="UnifrakturCook">UnifrakturCook</option>
                  <option value="Allura">Allura</option>
                  <option value="Alex Brush">Alex Brush</option>
                  <option value="Libre Caslon Display">Libre Caslon Display</option>
                  <option value="Special Elite">Special Elite</option>
                  <option value="Monoton">Monoton</option>
                  <option value="Dancing Script">Dancing Script</option>
                  <option value="Playwrite DE Grund">Playwrite DE Grund</option>
                  <option value="Noto Serif Devanagari">Noto Serif Devanagari</option>
                </Select>
                <Checkbox name={`body.bold`} isChecked={formData.body.bold == "bold"} onChange={(e) => handleChangeStyle(e, 'body', null)}>
                  Bold
                </Checkbox>
                <Checkbox name={`body.italic`} isChecked={formData.body.italic == "italic"} onChange={(e) => handleChangeStyle(e, 'body', null)}>
                  Italic
                </Checkbox></HStack>

            </VStack>


            {/* Footer Fields */}

            <Text>Enter the link for signatures:</Text>

            {formData.signatures.map((signature, index) => (
              <VStack key={index}>
                <HStack width="100%"><Input
                  name={`signatures[${index}].name.name`}
                  value={signature.name.name}
                  onChange={(e) => handleChange(e, 'signatures', index)}
                  placeholder="Name"
                />
                </HStack>

                <HStack width="100%">
                  <Select
                    name={`signatures[${index}].name.fontSize`}
                    value={signature.name.fontSize}
                    onChange={(e) => handleChange(e, 'signatures', index)}
                    placeholder="Size"
                    width="30%"
                  >
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="17">17</option>
                    <option value="19">19</option>
                    <option value="20">20</option>
                    <option value="22">22</option>
                    <option value="24">24</option>
                    <option value="26">26</option>
                    <option value="28">28</option>
                    <option value="30">30</option>
                    <option value="32">32</option>
                    <option value="34">34</option>
                    <option value="36">36</option>

                  </Select>
                  <Select
                    name={`signatures[${index}].name.fontFamily`}
                    value={signature.fontFamily}
                    onChange={(e) => handleChange(e, 'signatures', index)}
                    placeholder="Style"
                    width="29%"
                  >
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Euphoria Script">Euphoria Script</option>
                    <option value="Cookie">Cookie</option>
                    <option value="UnifrakturCook">UnifrakturCook</option>
                    <option value="Allura">Allura</option>
                    <option value="Alex Brush">Alex Brush</option>
                    <option value="Libre Caslon Display">Libre Caslon Display</option>
                    <option value="Special Elite">Special Elite</option>
                    <option value="Monoton">Monoton</option>
                    <option value="Dancing Script">Dancing Script</option>
                    <option value="Playwrite DE Grund">Playwrite DE Grund</option>
                    <option value="Noto Serif Devanagari">Noto Serif Devanagari</option>
                  </Select>
                  <Checkbox name={`signatures[${index}].name.bold`} isChecked={signature.name.bold == "bold"} onChange={(e) => handleChangeStyle(e, 'signatures', index)}>
                    Bold
                  </Checkbox>
                  <Checkbox name={`signatures[${index}].name.italic`} isChecked={signature.name.italic == "italic"} onChange={(e) => handleChangeStyle(e, 'signatures', index)}>
                    Italic
                  </Checkbox>
                </HStack>
                <HStack width="100%">
                  <Input
                    name={`signatures[${index}].position.position`}
                    value={signature.position.position}
                    onChange={(e) => handleChange(e, 'signatures', index)}
                    placeholder="Position"
                  />
                </HStack>
                <HStack>
                  <Select
                    name={`signatues[${index}].position.fontSize`}
                    value={signature.position.fontSize}
                    onChange={(e) => handleChange(e, 'signatures', index)}
                    placeholder="Size"
                    width="30%"
                  >
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="17">17</option>
                    <option value="19">19</option>
                    <option value="20">20</option>
                    <option value="22">22</option>
                    <option value="24">24</option>
                    <option value="26">26</option>
                    <option value="28">28</option>
                    <option value="30">30</option>
                    <option value="32">32</option>
                    <option value="34">34</option>
                    <option value="36">36</option>

                  </Select>
                  <Select
                    name={`signatures[${index}].position.fontFamily`}
                    value={signature.position.fontFamily}
                    onChange={(e) => handleChange(e, 'signatures', index)}
                    placeholder="Style"
                    width="29%"
                  >
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Euphoria Script">Euphoria Script</option>
                    <option value="Cookie">Cookie</option>
                    <option value="UnifrakturCook">UnifrakturCook</option>
                    <option value="Allura">Allura</option>
                    <option value="Alex Brush">Alex Brush</option>
                    <option value="Libre Caslon Display">Libre Caslon Display</option>
                    <option value="Special Elite">Special Elite</option>
                    <option value="Monoton">Monoton</option>
                    <option value="Dancing Script">Dancing Script</option>
                    <option value="Playwrite DE Grund">Playwrite DE Grund</option>
                    <option value="Noto Serif Devanagari">Noto Serif Devanagari</option>
                  </Select>
                  <Checkbox name={`signatures[${index}].position.bold`} isChecked={signature.position.bold == "bold"} onChange={(e) => handleChangeStyle(e, 'signatures', index)}>
                    Bold
                  </Checkbox>
                  <Checkbox name={`signatures[${index}].position.italic`} isChecked={signature.position.italic == "italic"} onChange={(e) => handleChangeStyle(e, 'signatures', index)}>
                    Italic
                  </Checkbox>
                </HStack>

                <Input
                  name={`signatures[${index}].url`}
                  value={signature.url}
                  onChange={(e) => handleChange(e, 'signatures', index)}
                  placeholder="URL"
                />
                <HStack>{index > 0 && (
                  <IconButton
                    icon={<CloseIcon />}
                    onClick={() => handleDelete('signatures', index)}
                  />
                )}
                  {index === formData.signatures.length - 1 && (
                    <IconButton
                      icon={<AddIcon />}
                      onClick={() => addField('signatures')}
                    />
                  )}</HStack>
              </VStack>
            ))}

            {/* Verifible link */}
            <Text>QR code with verifiable link:</Text>
            <Select
              name="verifiableLink"
              value={formData.verifiableLink}
              onChange={(e) => handleChange(e, 'verifiableLink', null)}
            // placeholder="Select Required or not"
            >
              <option value={true}>Required</option>
              <option value={false}>Not Required</option>
            </Select>

            <Text>Any additoinal data:</Text>

            {formData.footer.map((footer, index) => (
              <HStack key={index}>
                <Input
                  name={`footer[${index}].footer`}
                  value={footer.footer}
                  onChange={(e) => handleChange(e, 'footer', index)}
                  placeholder="Footer"
                />
                <Select
                  name={`footer[${index}].fontSize`}
                  value={footer.fontSize}
                  onChange={(e) => handleChange(e, 'footer', index)}
                  placeholder="Size"
                  width="30%"
                >
                  <option value="6">6</option>
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="17">17</option>
                  <option value="19">19</option>
                  <option value="20">20</option>
                  <option value="22">22</option>
                  <option value="24">24</option>
                  <option value="26">26</option>
                  <option value="28">28</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                  <option value="34">34</option>
                  <option value="36">36</option>

                </Select>
                <Select
                  name={`footer[${index}].fontFamily`}
                  value={footer.fontFamily}
                  onChange={(e) => handleChange(e, 'footer', index)}
                  placeholder="Style"
                  width="29%"
                >
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Euphoria Script">Euphoria Script</option>
                  <option value="Cookie">Cookie</option>
                  <option value="UnifrakturCook">UnifrakturCook</option>
                  <option value="Allura">Allura</option>
                  <option value="Alex Brush">Alex Brush</option>
                  <option value="Libre Caslon Display">Libre Caslon Display</option>
                  <option value="Special Elite">Special Elite</option>
                  <option value="Monoton">Monoton</option>
                  <option value="Dancing Script">Dancing Script</option>
                  <option value="Playwrite DE Grund">Playwrite DE Grund</option>
                  <option value="Noto Serif Devanagari">Noto Serif Devanagari</option>
                </Select>
                {index > 0 && (
                  <IconButton
                    icon={<CloseIcon />}
                    onClick={() => handleDelete('footer', index)}
                  />
                )}
                {index === formData.footer.length - 1 && (
                  <IconButton
                    icon={<AddIcon />}
                    onClick={() => addField('footer')}
                  />
                )}
              </HStack>
            ))}

            <Button type="submit" colorScheme="blue">
              Submit
            </Button>
          </VStack>
        </form>
      </Container>
      <Box flex="1" p="4">
        <SelectCertficate
          eventId={eventId}
          templateId={formData.templateId}
          contentBody={formData.body}
          certiType={formData.certiType}
          title={formData.title}
          verifiableLink={formData.verifiableLink.toString()}
          logos={formData.logos}
          participantDetail={{}}
          signature={formData.signatures}
          header={formData.header}
          footer={formData.footer}
        />
      </Box>
    </Flex>
  );
};

export default CertificateForm;
