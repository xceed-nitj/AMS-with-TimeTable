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
  Checkbox,
  Image,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, EditIcon, InfoIcon } from '@chakra-ui/icons';
import getEnvironment from '../../getenvironment';
import Header from '../../components/header';
import { useToast } from '@chakra-ui/react';
import CertificateContent from './certificatetemplates/basic01';
import SelectCertficate from './SelectCertficate';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { HexAlphaColorPicker } from 'react-colorful';
import { FaUpload } from 'react-icons/fa';
import Signaturemodal from './signaturemodal';

const CertificateForm = () => {
  const apiUrl = getEnvironment();
  const toast = useToast();
  const [type, setType] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const date = new Date();
  const a = date.getMonth() > 8 ? "" : 0
  const defaultDate = `${date.getFullYear()}-${a}${date.getMonth() + 1}-${date.getDate()}`
  const [formData, setFormData] = useState({
    logos: [{ url: '', height: 80, width: 80 }],
    header: [
      {
        header: '',
        fontSize: 22,
        fontFamily: '',
        bold: 'bold',
        italic: 'normal',
        fontColor: 'black',
      },
    ],
    body: {
      body: '',
      fontSize: 16,
      fontFamily: '',
      bold: 'normal',
      italic: 'normal',
      fontColor: 'black',
    },
    footer: { footer: defaultDate },
    signatures: [
      {
        name: {
          name: '',
          fontSize: 14,
          fontFamily: '',
          bold: 'normal',
          italic: 'normal',
          fontColor: 'black',
        },
        position: {
          position: '',
          fontSize: 12,
          fontFamily: '',
          bold: 'normal',
          italic: 'normal',
          fontColor: 'black',
        },
        url: { url: '', size: 100 },
      },
    ],
    certiType: '',
    templateId: '0', //Template Design Number
    title: [
      {
        name: 'डॉ बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर',
        fontSize: 20,
        fontFamily: 'Noto Serif Devanagari',
        bold: 'bold',
        italic: 'normal',
        fontColor: 'black',
      },
      {
        name: 'जी.टी. रोड, अमृतसर बाईपास, जालंधर, पंजाब, भारत-144008',
        fontSize: 16,
        fontFamily: 'Noto Serif Devanagari',
        bold: 'normal',
        italic: 'normal',
        fontColor: 'black',
      },
      {
        name: 'Dr B R Ambedkar National Institute of Technology Jalandhar',
        fontSize: 20,
        fontFamily: 'serif',
        bold: 'bold',
        italic: 'normal',
        fontColor: 'black',
      },
      {
        name: 'G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008',
        fontSize: 16,
        fontFamily: 'serif',
        bold: 'normal',
        italic: 'normal',
        fontColor: 'black',
      },
    ],
    verifiableLink: false,
    certificateOf: {
      certificateOf: 'CERTIFICATE OF APPRECIATION',
      fontSize: 32,
      fontFamily: '',
      bold: 'bold',
      italic: 'normal',
      fontColor: 'black',
    },
  });

  // console.log(formData.templateId);

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 1];

  useEffect(() => {
    const certType = formData.certiType;
    setSelectedFiles([]);
    setFormData({
      logos: [{ url: '', height: 80, width: 80 }],
      header: [
        {
          header: '',
          fontSize: 22,
          fontFamily: '',
          bold: 'bold',
          italic: 'normal',
          fontColor: 'black',
        },
      ],
      body: {
        body: '',
        fontSize: 16,
        fontFamily: '',
        bold: 'normal',
        italic: 'normal',
        fontColor: 'black',
      },
      footer: { footer: defaultDate },
      signatures: [
        {
          name: {
            name: '',
            fontSize: 12,
            fontFamily: '',
            bold: 'normal',
            italic: 'normal',
            fontColor: 'black',
          },
          position: {
            position: '',
            fontSize: 10,
            fontFamily: '',
            bold: 'normal',
            italic: 'normal',
            fontColor: 'black',
          },
          url: { url: '', size: 100 },
        },
      ],
      certiType: certType,
      templateId: '0', //Template Design Number
      title: [
        {
          name: 'डॉ बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर',
          fontSize: 20,
          fontFamily: 'Noto Serif Devanagari',
          bold: 'bold',
          italic: 'normal',
          fontColor: 'black',
        },
        {
          name: 'जी.टी. रोड, अमृतसर बाईपास, जालंधर, पंजाब, भारत-144008',
          fontSize: 14,
          fontFamily: 'Noto Serif Devanagari',
          bold: 'normal',
          italic: 'normal',
          fontColor: 'black',
        },
        {
          name: 'Dr B R Ambedkar National Institute of Technology Jalandhar',
          fontSize: 19,
          fontFamily: 'serif',
          bold: 'bold',
          italic: 'normal',
          fontColor: 'black',
        },
        {
          name: 'G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008',
          fontSize: 14,
          fontFamily: 'serif',
          bold: 'normal',
          italic: 'normal',
          fontColor: 'black',
        },
      ],
      verifiableLink: false,
      certificateOf: {
        certificateOf: 'CERTIFICATE OF APPRECIATION',
        fontSize: 32,
        fontFamily: '',
        bold: 'bold',
        italic: 'normal',
        fontColor: 'black',
      },
    });
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
            let {
              certificateOf,
              title,
              signatures,
              header,
              footer,
              body,
              certiType,
              logos,
              templateId,
              verifiableLink,
            } = responseData[0];
            let Signatures = [];
            if (signatures[0].name.name || signatures[0].name.name == "") {
              Signatures = signatures;
              if (!signatures[0].url.url) {
                signatures.forEach((elem, index) => {
                  Signatures[index].url = { url: elem.url, size: 100 };
                });
              }
            } else {
              signatures.forEach((element) => {
                let sign = {
                  name: {
                    name: element.name,
                    fontSize: '',
                    fontFamily: '',
                    bold: 'normal',
                    italic: 'normal',
                    fontColor: 'black',
                  },
                  position: {
                    position: element.position,
                    fontSize: '',
                    fontFamily: '',
                    bold: 'normal',
                    italic: 'normal',
                    fontColor: 'black',
                  },
                  url: { url: element.url, size: 100 },
                };
                Signatures.push(sign);
              });
            }
            //for logos
            let Logos = [];
            if (logos[0].url || logos[0].url == "") {
              Logos = logos;
            } else {
              logos.forEach((element) => {
                let str = '';
                for (let key in element) {
                  parseInt(key) || key == '0' ? (str = str + element[key]) : '';
                }
                let logo = { url: str, width: 80, height: 80 };
                Logos.push(logo);
              });
            }
            //for header
            let Header = [];
            if (header[0].header || header[0].header == "") {
              Header = header;
            } else {
              header.forEach((element) => {
                let str = '';
                for (let key in element) {
                  parseInt(key) || key == '0' ? (str = str + element[key]) : '';
                }
                let head = {
                  header: str,
                  fontSize: '',
                  fontFamily: '',
                  bold: 'bold',
                  italic: 'normal',
                  fontColor: 'black',
                };
                Header.push(head);
              });
            }
            // for footer
            let Footer = {};
            if (Array.isArray(footer)) {
              Footer = formData.footer;
            } else {
              Footer = footer;
            }
            //for certificateOf
            let CertificateOf = {};
            console.log(!certificateOf);
            if (!certificateOf || certificateOf == "") {
              console.log("hey");
              CertificateOf = formData.certificateOf;
            } else {
              CertificateOf = certificateOf;
            }
            console.log(CertificateOf);
            // for body
            let Body = formData.body;
            if (body.body || body.body == "") {
              Body = body;
            } else {
              Body.body = body;
            }
            // console.log(title)
            //for title
            let Title = [];
            if (title[0] || title[0] == "") {
              if (title[0][0] || title[0][0] == "") {
                title.forEach((element) => {
                  let str = '';
                  for (let key in element) {
                    parseInt(key) || key == '0'
                      ? (str = str + element[key])
                      : '';
                  }
                  let obj = {
                    name: str,
                    fontSize: '',
                    fontFamily: '',
                    bold: 'normal',
                    italic: 'normal',
                    fontColor: 'black',
                  };
                  Title.push(obj);
                });
              } else if (title[0]['name'] || title[0]['name'] == "") {
                Title = title;
              }
            } else {
              Title = [
                {
                  name: 'डॉ बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर',
                  fontSize: 20,
                  fontFamily: 'Noto Serif Devanagari',
                  bold: 'bold',
                  italic: 'normal',
                  fontColor: 'black',
                },
                {
                  name: 'जी.टी. रोड, अमृतसर बाईपास, जालंधर, पंजाब, भारत-144008',
                  fontSize: 14,
                  fontFamily: 'Noto Serif Devanagari',
                  bold: 'normal',
                  italic: 'normal',
                  fontColor: 'black',
                },
                {
                  name: 'Dr B R Ambedkar National Institute of Technology Jalandhar',
                  fontSize: 19,
                  fontFamily: 'serif',
                  bold: 'bold',
                  italic: 'normal',
                  fontColor: 'black',
                },
                {
                  name: 'G.T Road, Amritsar Bypass, Jalandhar, Punjab, India-144008',
                  fontSize: 14,
                  fontFamily: 'serif',
                  bold: 'normal',
                  italic: 'normal',
                  fontColor: 'black',
                },
              ];
            }
            // console.log(verifiableLink)
            //for verifiableLink
            if (verifiableLink === true) {
              verifiableLink = true;
            } else {
              verifiableLink = false;
            }

            // console.log(Title,Body,Footer,Header,Signatures)
            setFormData({
              title: Title,
              body: Body,
              certificateOf: CertificateOf,
              footer: Footer,
              header: Header,
              signatures: Signatures,
              certiType: certiType,
              logos: Logos,
              templateId: templateId,
              verifiableLink: verifiableLink,
            });
            console.log(formData.logos);
          } else {
            console.error(
              'Error: Fetched data does not match the expected structure.'
            );
          }
        } else {
          const responseData = await response.json();
          console.error('Error fetching form data:', responseData.error);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    if (formData.certiType) {
      fetchData();
    }
  }, [apiUrl, eventId, formData.certiType]);

  const handleFileChange = (e, fieldName, index) => {
    const file = e.target.files[0];
    setFormData((prevData) => {
      const updatedField = [...prevData[fieldName]];
      // For signatures, update the specific property of the signature object
      const signatureField = 'url';
      if (fieldName === 'signatures') {
        setSelectedFiles((prevFiles) => {
          const s = `signatures[${index}].url.url`;
          const obj = { [s]: file };
          let alreadyExists = 0;
          prevFiles.forEach((file, index) => {
            for (const key in file) {
              if (key == s) {
                alreadyExists = index;
              }
            }
          });
          if (alreadyExists !== 0) {
            const updated = [...prevFiles];
            updated[alreadyExists] = obj;
            return updated;
          }
          return [...prevFiles, obj];
        });
        console.log(selectedFiles);
        const signField = 'url';
        updatedField[index][signatureField] = {
          ...updatedField[index][signatureField],
          [signField]: URL.createObjectURL(file),
        };
      } else {
        updatedField[index] = {
          ...updatedField[index],
          [signatureField]: URL.createObjectURL(file),
        };
      }
      return {
        ...prevData,
        [fieldName]: updatedField,
      };
    });
  };
  const handleChangeStyle = (event, fieldName, index) => {
    if (event.target.checked) {
      const value = event.target.name.split('.').pop();
      if (fieldName === 'signatures') {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const signatureField = event.target.name.split('.')[1];
          if (signatureField == 'name' || signatureField == 'position') {
            const signField = event.target.name.split('.')[2];
            updatedField[index][signatureField] = {
              ...updatedField[index][signatureField],
              [signField]: value,
            };
          }
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      } else if (fieldName === 'body' || fieldName === 'certificateOf') {
        setFormData((prevData) => {
          const updatedField = prevData[fieldName];
          const objectField = event.target.name.split('.')[1];
          updatedField[objectField] = value;
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      } else {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const objectField = event.target.name.split('.')[1];
          updatedField[index] = {
            ...updatedField[index],
            [objectField]: value,
          };
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      }
    } else {
      const value = 'normal';
      if (fieldName === 'signatures') {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const signatureField = event.target.name.split('.')[1];
          if (signatureField == 'name' || signatureField == 'position') {
            const signField = event.target.name.split('.')[2];
            updatedField[index][signatureField] = {
              ...updatedField[index][signatureField],
              [signField]: value,
            };
          }
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      } else if (fieldName === 'body' || fieldName === 'certificateOf') {
        setFormData((prevData) => {
          const updatedField = prevData[fieldName];
          const objectField = event.target.name.split('.')[1];
          updatedField[objectField] = value;
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      } else {
        setFormData((prevData) => {
          const updatedField = [...prevData[fieldName]];
          const objectField = event.target.name.split('.')[1];
          updatedField[index] = {
            ...updatedField[index],
            [objectField]: value,
          };
          return {
            ...prevData,
            [fieldName]: updatedField,
          };
        });
      }
    }
  };
  const templateOptions = [
    { id: 0, label: 'Basic 1', imageUrl: '/templatebg/basic01.png' },
    { id: 1, label: 'Basic 2', imageUrl: '/templatebg/basic02.png' },
    { id: 2, label: 'Basic 3', imageUrl: '/templatebg/basic03.png' },
    { id: 3, label: 'Basic 4', imageUrl: '/templatebg/basic04.png' },
    { id: 4, label: 'Basic 5', imageUrl: '/templatebg/basic05.png' },
    { id: 5, label: 'Basic 6', imageUrl: '/templatebg/basic06.png' },
    { id: 6, label: 'Basic 7', imageUrl: '/templatebg/basic07.png' },
    { id: 7, label: 'Basic 8', imageUrl: '/templatebg/basic08.png' },
    { id: 8, label: 'Basic 9', imageUrl: '/templatebg/basic09.png' },
    { id: 16, label: 'Basic 10', imageUrl: '/templatebg/basic11.png' },
    { id: 18, label: 'Basic 11', imageUrl: '/templatebg/basic13.png' },
    { id: 19, label: 'Basic 12', imageUrl: '/templatebg/basic14.png' },
    { id: 20, label: 'Basic 13', imageUrl: '/templatebg/basic15.png' },
    { id: 9, label: 'Premium 1', imageUrl: '/templatebg/premium01.png' },
    { id: 10, label: 'Premium 2', imageUrl: '/templatebg/premium02.png' },
    { id: 11, label: 'Premium 3', imageUrl: '/templatebg/premium03.png' },
    { id: 12, label: 'Premium 4', imageUrl: '/templatebg/premium04.png' },
    { id: 14, label: 'Premium 5', imageUrl: '/templatebg/premium05.png' },
    { id: 15, label: 'Premium 6', imageUrl: '/templatebg/premium06.png' },
    { id: 22, label: 'Premium 7', imageUrl: '/templatebg/premium07.png' },
    { id: 13, label: 'Premium 8', imageUrl: '/templatebg/basic10.png' },
    { id: 17, label: 'Premium 9', imageUrl: '/templatebg/basic12.png' },
    { id: 21, label: 'Premium 10', imageUrl: '/templatebg/basic16.png' },
  ];
  const handleTemplateSelect = (id) => {
    setFormData((prevState) => ({
      ...prevState,
      templateId: id,
    }));
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
      fieldName === 'signatures' ||
      fieldName === 'title'
    ) {
      setFormData((prevData) => {
        const updatedField = [...prevData[fieldName]];
        if (index !== null) {
          // For signatures, update the specific property of the signature object
          if (fieldName === 'signatures') {
            const signatureField = e.target.name.split('.')[1]; // Extract the property name (name, position, url)
            if (
              signatureField == 'name' ||
              signatureField == 'position' ||
              signatureField == 'url'
            ) {
              const signField = e.target.name.split('.')[2];
              updatedField[index][signatureField] = {
                ...updatedField[index][signatureField],
                [signField]: value,
              };
            } else {
              updatedField[index] = {
                ...updatedField[index],
                [signatureField]: value,
              };
            }
          } else {
            const objectField = e.target.name.split('.')[1];
            updatedField[index] = {
              ...updatedField[index],
              [objectField]:
                objectField == 'fontSize'
                  ? isNaN(parseInt(value))
                    ? 6
                    : parseInt(value)
                  : value,
            };
          }
        }

        return {
          ...prevData,
          [fieldName]: updatedField,
        };
      });
    } else if (
      fieldName === 'body' ||
      fieldName === 'footer' ||
      fieldName === 'certificateOf'
    ) {
      setFormData((prevData) => {
        const updatedField = prevData[fieldName];
        const objectField = e.target.name.split('.')[1];
        updatedField[objectField] = value;
        return {
          ...prevData,
          [fieldName]: updatedField,
        };
      });
    } else if (fieldName === 'certiType' || fieldName === 'verifiableLink') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: value,
      }));
    }
  };

  const handleChangec = (e, fieldName, name, index) => {
    const target = { name: name, value: e };
    const event = { target };
    handleChange(event, fieldName, index);
  };

  const removeBackground = (image, e, fieldName, index) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple background removal by setting white pixels to transparent
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      if (red > 200 && green > 200 && blue > 200) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    context.putImageData(imageData, 0, 0);

    const processedImage = new window.Image();
    processedImage.src = canvas.toDataURL();
    processedImage.onload = () => {
      console.log('Image processed');
    };

    // Convert canvas content to Blob
    canvas.toBlob(function (blob) {
      // Create a File object from Blob
      const result = new File([blob], 'processed-image.png', {
        type: 'image/png',
      });
      const event = { target: { files: [result], name: e.target.name } };
      handleFileChange(event, fieldName, index);
    });
  };

  const bgremove = async (e, fieldName, index) => {
    let file;
    if (e.target.value.includes('blob:')) {
      const response = await fetch(`${e.target.value}`);
      const b = await response.blob();
      file = new File([b], 'image/png');
      console.log(file);
    } else if (!(e.target.value == '[object File]')) {
      const response = await fetch(
        `${apiUrl}/proxy-image?url=${e.target.value}`
      );
      const b = await response.blob();
      file = new File([b], 'image/png');
    } else {
      file = formData.signatures[index].url.url;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        removeBackground(img, e, fieldName, index);
      };
    };
  };

  const addField = (fieldName) => {
    if (fieldName === 'signatures') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: [
          ...prevData[fieldName],
          {
            name: {
              name: '',
              fontSize: '',
              fontFamily: '',
              bold: 'normal',
              italic: 'normal',
            },
            position: {
              position: '',
              fontSize: '',
              fontFamily: '',
              bold: 'normal',
              italic: 'normal',
            },
            url: { url: '', size: 100 },
          },
        ],
      }));
    } else if (fieldName === 'logos') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: [
          ...prevData[fieldName],
          { url: '', height: 80, width: 80 },
        ],
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
      const form = document.getElementById('form');
      const formdata = new FormData(form);
      selectedFiles.forEach((file) => {
        for (const key in file) {
          formdata.append(key, file[key]);
        }
      });
      formdata.append('url', window.location.origin);
      const response = await fetch(
        `${apiUrl}/certificatemodule/certificate/content/${eventId}`,
        {
          method: 'POST',
          // headers: {
          //   'Content-Type': 'multipart/form-data'
          // },

          credentials: 'include',
          body: formdata,
        }
      );

      if (response.ok) {
        console.log('resoponse okay');
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
        toast({
          title: 'Submission Failed',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Submission Failed',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  function copyVariable(text) {

    if (!navigator.clipboard) {
      return Promise.reject('Clipboard API not supported');
    }
    toast({
      title: 'Variable copied',
      status: "success",
      duration: 1000,
      isClosable: true,
    });
    return navigator.clipboard.writeText(text);
  }

  const fontsizeopt = [];
  for (let i = 6; i <= 60; i = i + 2) {
    fontsizeopt.push(i);
  }
  const fontStyleopt = [
    'fantasy',
    "monospace",
    "sans-serif",
    'serif',
    'cursive',
  ];
  // const fontStyleopt = [
  //   'Playfair Display',
  //   'Euphoria Script',
  //   'Cookie',
  //   'UnifrakturCook',
  //   'Allura',
  //   'Alex Brush',
  //   'Libre Caslon Display',
  //   'Special Elite',
  //   'Monoton',
  //   'Dancing Script',
  //   'Playwrite DE Grund',
  //   'Noto Serif Devanagari',
  //   'Ingrid Darling',
  //   'Grey Qo',
  //   'Kings',
  //   'Ole',
  //   'Rubik Maze',
  //   'Rubik Burned',
  //   'Rubik Marker Hatch',
  //   'Rubik Microbe',
  //   'Blaka Ink',
  //   'Noto Serif Grantha',
  //   'Rubik Spray Paint',
  //   'Rubik Wet Paint',
  //   'Finger Paint',
  //   'Rubik Bubbles',
  //   'Oleo Script',
  //   'Neuton',
  //   'Merienda',
  //   'Concert One',
  //   'Permanent Marker',
  //   'Abril Fatface',
  //   'Rowdies',
  //   'Lobster',
  //   'Pacifico',
  //   'Anton SC',
  //   'Ga Maamli',
  //   'Libre Baskerville',
  //   'Libre Baskerville',
  //   'Merriweather',
  //   'Roboto Slab',
  //   'Roboto',
  //   'Oswald',
  // ];
  return (
    <Flex
      style={{
        height: '89dvh',
        // overflowY: 'scroll',
        clipPath: 'content-box',
      }}
      className="tw-flex tw-flex-col md:tw-flex-row"
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

        <form id="form" onSubmit={handleSubmit}>
          <VStack spacing={4} align="start">
            <Text className='tw-font-bold'>Select Certificate Type:</Text>
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
            <Text className='tw-font-bold'>Enter the name of Institute</Text>

            {formData.title.length == 0
              ? (formData.title = [''])
              : formData.title.map((title, index) => (
                <HStack key={index} alignItems="flex-start" width="100%">
                  <Accordion width="100%" allowMultiple>
                    <AccordionItem
                      border="none"
                      alignItems="center"
                      width="96%"
                    >
                      <HStack alignItems="center" width="100%">
                        <Input
                          name={`title[${index}].name`}
                          value={title.name}
                          onChange={(e) => handleChange(e, 'title', index)}
                          placeholder="Title"
                          width="100%"
                        />
                        <AccordionButton
                          height="30px"
                          width="30px"
                          justifyContent="center"
                        >
                          <EditIcon
                            color="blue"
                            height="25px"
                            width="25px"
                            justifyContent="center"
                          />
                        </AccordionButton>
                        {index > 0 && (
                          <IconButton
                            width="30px"
                            icon={<CloseIcon color="red" width="20px" height="20px" />}
                            onClick={() => handleDelete('title', index)}
                          />
                        )}
                        {index === formData.title.length - 1 && (
                          <IconButton
                            icon={<AddIcon color="green" width="20px" height="20px" />}
                            onClick={() => addField('title')}
                          />
                        )}
                      </HStack>
                      <AccordionPanel width="100%" position="relative">
                        <HStack spacing={'8'}>
                          <VStack>
                            <Select
                              name={`title[${index}].fontSize`}
                              value={title.fontSize}
                              onChange={(e) =>
                                handleChange(e, 'title', index)
                              }
                              placeholder="Size"
                            // width="30%"
                            >
                              {fontsizeopt.map((item, key) => {
                                return (
                                  <option key={key} value={`${item}`}>
                                    {item}
                                  </option>
                                );
                              })}
                            </Select>
                            <Select
                              name={`title[${index}].fontFamily`}
                              value={title.fontFamily}
                              onChange={(e) =>
                                handleChange(e, 'title', index)
                              }
                              placeholder="Style"
                            // width="29%"
                            >
                              {fontStyleopt.map((item, key) => {
                                return (
                                  <option key={key} value={`${item}`}>
                                    {item}
                                  </option>
                                );
                              })}
                            </Select>
                            <Input
                              name={`title[${index}].fontColor`}
                              value={title.fontColor}
                              onChange={(e) =>
                                handleChange(e, 'title', index)
                              }
                              placeholder="Color eg. red"
                            ></Input>
                            <HStack>
                              <Checkbox
                                name={`title[${index}].bold`}
                                value={title.bold}
                                isChecked={
                                  title.bold == 'bold' ? true : false
                                }
                                onChange={(e) =>
                                  handleChangeStyle(e, 'title', index)
                                }
                              >
                                Bold
                              </Checkbox>
                              <Checkbox
                                name={`title[${index}].italic`}
                                value={title.italic}
                                isChecked={title.italic == 'italic'}
                                onChange={(e) =>
                                  handleChangeStyle(e, 'title', index)
                                }
                              >
                                Italic
                              </Checkbox>
                            </HStack>
                          </VStack>
                          <HexAlphaColorPicker
                            name={`title[${index}].fontColor`}
                            value={title.fontColor}
                            onChange={(e) =>
                              handleChangec(
                                e,
                                'title',
                                `title[${index}].fontColor`,
                                index
                              )
                            }
                          />
                        </HStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </HStack>
              ))}

            {/* Template Selection */}
            <Box>
              <Text className='tw-font-bold'>Select Certificate Template Design:</Text>
              <Box overflowX="auto" whiteSpace="nowrap" padding="10px 0">
                <HStack maxW={450} spacing={4} overflow={'scroll'}>
                  {templateOptions.map((template) => (
                    <Box
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      border={
                        formData.templateId === template.id
                          ? '2px solid blue'
                          : '2px solid transparent'
                      }
                      borderRadius="md"
                      cursor="pointer"
                      padding="2px"
                    >
                      <Image src={template.imageUrl} alt={template.label} />
                      <Text w={150} fontSize="sm" textAlign="center">
                        {template.label}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              </Box>
            </Box>
            <Input
              name={`templateId`}
              value={formData.templateId}
              // width="0px"
              display="none"
            />


            {/* Logos Fields */}
            <Text className='tw-font-bold'>Logos:</Text>

            {formData.logos.map((logo, index) => (
              <HStack width='100%' key={index}>
                <Accordion width='100%' allowMultiple><AccordionItem border="none" width='100%'><HStack width='100%'>

                  <Input
                    name={`logos[${index}].url`}
                    value={logo.url}
                    onChange={(e) => handleChange(e, 'logos', index)}
                    placeholder="Logo"
                    display="none"
                  />
                  <Text
                    width="100%">
                    Upload Logo image (jpg/png):
                  </Text>
                  <label style={{ height: "30px", width: "30px" }} className="tw-flex tw-flex-col tw-justify-center tw-ml-2 hover:tw-cursor-pointer" htmlFor={`logo${index}`}><FaUpload style={{ height: "25px", width: "25px", color: "purple" }} /></label>
                  <Input
                    id={`logo${index}`}
                    name={`logos[${index}].url`}
                    onChange={(e) => handleFileChange(e, 'logos', index)}
                    type='file'
                    accept='image/jpeg , image/png'
                    style={{ width: "0px", height: "0px", margin: "0px", padding: "0px" }}
                  />
                  <AccordionButton height="30px" width="30px" justifyContent="center"><EditIcon color="blue" height="25px" width="25px" justifyContent="center" /></AccordionButton>


                  {index > 0 && (
                    <IconButton
                      icon={<CloseIcon color="red" width="20px" height="20px" />}
                      onClick={() => handleDelete('logos', index)}
                    />
                  )}
                  {index === formData.logos.length - 1 && (
                    <IconButton
                      icon={<AddIcon color="green" width="20px" height="20px" />}
                      onClick={() => addField('logos')}
                    />
                  )}</HStack>
                  <AccordionPanel> <HStack border="none" width="100%">
                    <HStack width="60%"><Text>Vertical Position:</Text><input
                      type="number"
                      name={`logos[${index}].height`}
                      value={logo.height}
                      onChange={(e) => handleChange(e, 'logos', index)}
                      placeholder="height"
                      style={{ width: "55px", textAlign: "center", border: "1px solid #e2e8f0", borderRadius: "2px" }}
                    /></HStack>
                    <HStack width="40%"><Text>Size:</Text><input
                      type="number"
                      name={`logos[${index}].width`}
                      value={logo.width}
                      onChange={(e) => handleChange(e, 'logos', index)}
                      placeholder="width"
                      style={{ width: "55px", textAlign: "center" }}
                    /></HStack>
                  </HStack>

                  </AccordionPanel></AccordionItem></Accordion>


              </HStack>
            ))}

            {/* Header Fields */}
            <Text className='tw-font-bold'>Enter Department or Club data:</Text>

            {formData.header.map((header, index) => (
              <HStack width="100%" key={index}>
                <Accordion width="100%" allowMultiple>
                  <AccordionItem border="none" alignItems="center" width="96%">
                    <HStack alignItems="center" width="100%">
                      <Input
                        name={`header[${index}].header`}
                        value={header.header}
                        onChange={(e) => handleChange(e, 'header', index)}
                        placeholder="Header"
                        width="100%"
                      />
                      <AccordionButton
                        height="30px"
                        width="30px"
                        justifyContent="center"
                      >
                        <EditIcon
                          color="blue"
                          height="25px"
                          width="25px"
                          justifyContent="center"
                        />
                      </AccordionButton>
                      {index > 0 && (
                        <IconButton
                          icon={<CloseIcon color="red" width="20px" height="20px" />}
                          onClick={() => handleDelete('header', index)}
                        />
                      )}
                      {index === formData.header.length - 1 && (
                        <IconButton
                          icon={<AddIcon color="green" height="20px" width="20px" />}
                          onClick={() => addField('header')}
                        />
                      )}
                    </HStack>
                    <AccordionPanel width="100%">
                      <HStack spacing={'8'}>
                        <VStack>
                          <Select
                            name={`header[${index}].fontSize`}
                            value={header.fontSize}
                            onChange={(e) => handleChange(e, 'header', index)}
                            placeholder="Size"
                          // width="30%"
                          >
                            {fontsizeopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Select
                            name={`header[${index}].fontFamily`}
                            value={header.fontFamily}
                            onChange={(e) => handleChange(e, 'header', index)}
                            placeholder="Style"
                          // width="29%"
                          >
                            {fontStyleopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Input
                            name={`header[${index}].fontColor`}
                            value={header.fontColor}
                            onChange={(e) => handleChange(e, 'header', index)}
                            placeholder="Color eg. red"
                          ></Input>
                          <HStack>
                            <Checkbox
                              name={`header[${index}].bold`}
                              value={header.bold}
                              isChecked={header.bold == 'bold'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'header', index)
                              }
                            >
                              Bold
                            </Checkbox>
                            <Checkbox
                              name={`header[${index}].italic`}
                              value={header.italic}
                              isChecked={header.italic == 'italic'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'header', index)
                              }
                            >
                              Italic
                            </Checkbox>
                          </HStack>
                        </VStack>
                        <HexAlphaColorPicker
                          name={`header[${index}].fontColor`}
                          value={header.fontColor}
                          onChange={(e) =>
                            handleChangec(
                              e,
                              'header',
                              `header.fontColor`,
                              index
                            )
                          }
                        />
                      </HStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </HStack>
            ))}

            {/* certificateOf */}
            <Accordion width="100%" allowMultiple>
              <AccordionItem width="100%" border="none">
                <HStack width="100%" justifyContent="space-between">
                  <Text className='tw-font-bold'>Certificate:</Text>
                </HStack>
                <VStack width="100%">
                  <HStack width="100%">
                    <Input
                      name="certificateOf.certificateOf"
                      value={formData.certificateOf.certificateOf}
                      onChange={(e) => handleChange(e, 'certificateOf', null)}
                      placeholder="Certificate Of Appreciation"
                      width="100%"
                    />
                    <AccordionButton
                      height="30px"
                      width="30px"
                      justifyContent="center"
                    >
                      <EditIcon
                        color="blue"
                        height="25px"
                        width="25px"
                        justifyContent="center"
                      />
                    </AccordionButton>
                  </HStack>
                  <AccordionPanel>
                    <VStack width="100%">
                      <HStack>
                        <VStack>
                          <Select
                            name={`certificateOf.fontSize`}
                            value={formData.certificateOf.fontSize}
                            onChange={(e) =>
                              handleChange(e, 'certificateOf', null)
                            }
                            placeholder="Size"
                          >
                            {fontsizeopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Select
                            name={`certificateOf.fontFamily`}
                            value={formData.certificateOf.fontFamily}
                            onChange={(e) =>
                              handleChange(e, 'certificateOf', null)
                            }
                            placeholder="Style"
                          >
                            {fontStyleopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Input
                            name={`certificateOf.fontColor`}
                            value={formData.certificateOf.fontColor}
                            onChange={(e) =>
                              handleChange(e, 'certificateOf', null)
                            }
                            placeholder="Color eg. red"
                          ></Input>
                          <HStack>
                            <Checkbox
                              name={`certificateOf.bold`}
                              value={formData.certificateOf.bold}
                              isChecked={formData.certificateOf.bold == 'bold'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'certificateOf', null)
                              }
                            >
                              Bold
                            </Checkbox>
                            <Checkbox
                              name={`certificateOf.italic`}
                              value={formData.certificateOf.italic}
                              isChecked={
                                formData.certificateOf.italic == 'italic'
                              }
                              onChange={(e) =>
                                handleChangeStyle(e, 'certificateOf', null)
                              }
                            >
                              Italic
                            </Checkbox>
                          </HStack>
                        </VStack>
                        <HexAlphaColorPicker
                          name={`certificateOf.fontColor`}
                          value={formData.certificateOf.fontColor}
                          onChange={(e) =>
                            handleChangec(
                              e,
                              'certificateOf',
                              `certificateOf.fontColor`,
                              null
                            )
                          }
                        />
                      </HStack>
                    </VStack>
                  </AccordionPanel>
                </VStack>
              </AccordionItem>
            </Accordion>

            {/* Body of the certificate */}
            <Accordion width="100%" allowMultiple>
              <AccordionItem width="100%" border="none">
                <HStack width="100%" justifyContent="space-between"><Text className='tw-font-bold'>Body of the certificate <Button type='button' onClick={e => { document.getElementById("bodyVariables").style.display = document.getElementById("bodyVariables").style.display == "flex" ? "none" : "flex" }} className='tw-text-black tw-text-sm'>See variables </Button>{window.outerWidth > 768 && <InfoIcon color="brown" height={"18px"} width={"18px"} onMouseLeave={(e) => document.getElementById('bodyinfo').style.display = "none"} onMouseEnter={(e) => document.getElementById('bodyinfo').style.display = "block"} />}</Text>
                  <AccordionButton height="30px" width="30px" justifyContent="center">
                    <EditIcon height="25px" width="25px" justifyContent="center" color="blue" />
                  </AccordionButton></HStack>
                <div id="bodyVariables" className=' tw-flex-col tw-justify-center tw-items-center tw-hidden'>
                  <div id="bodyinfo" className='tw-hidden tw-p-2 m-3 tw-max-w-fit tw-bg-orange-100 tw-rounded-md'>click to copy variable</div>
                  <ul className='tw-list-none tw-gap-1 tw-flex-wrap tw-flex'>
                    <Button type='button' onClick={(e) => { copyVariable(`{{${e.target.innerText}}}`) }} className='tw-bg-slate-50 tw-border-2 tw-rounded tw-p-1'>name</Button>
                    <Button type='button' onClick={(e) => { copyVariable(`{{${e.target.innerText}}}`) }} className='tw-bg-slate-50 tw-border-2 tw-rounded tw-p-1'>department</Button>
                    <Button type='button' onClick={(e) => { copyVariable(`{{${e.target.innerText}}}`) }} className='tw-bg-slate-50 tw-border-2 tw-rounded tw-p-1'>college</Button>
                    <Button type='button' onClick={(e) => { copyVariable(`{{${e.target.innerText}}}`) }} className='tw-bg-slate-50 tw-border-2 tw-rounded tw-p-1'>teamName</Button>
                    <Button type='button' onClick={(e) => { copyVariable(`{{${e.target.innerText}}}`) }} className='tw-bg-slate-50 tw-border-2 tw-rounded tw-p-1'>position</Button>
                    <Button type='button' onClick={(e) => { copyVariable(`{{${e.target.innerText}}}`) }} className='tw-bg-slate-50 tw-border-2 tw-rounded tw-p-1'>title1</Button>
                    <Button type='button' onClick={(e) => { copyVariable(`{{${e.target.innerText}}}`) }} className='tw-bg-slate-50 tw-border-2 tw-rounded tw-p-1'>title2</Button>
                  </ul>
                </div>

                <VStack width="100%">
                  <Textarea
                    name="body.body"
                    value={formData.body.body}
                    onChange={(e) => handleChange(e, 'body', null)}
                    placeholder="Drag from bottom right corner to increase the text area"
                    width="100%"
                  />
                  <AccordionPanel>
                    <VStack width="100%">
                      <HStack>
                        <VStack>
                          <Select
                            name={`body.fontSize`}
                            value={formData.body.fontSize}
                            onChange={(e) => handleChange(e, 'body', null)}
                            placeholder="Size"
                          >
                            {fontsizeopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Select
                            name={`body.fontFamily`}
                            value={formData.body.fontFamily}
                            onChange={(e) => handleChange(e, 'body', null)}
                            placeholder="Style"
                          >
                            {fontStyleopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Input
                            name={`body.fontColor`}
                            value={formData.body.fontColor}
                            onChange={(e) => handleChange(e, 'body', null)}
                            placeholder="Color eg. red"
                          ></Input>
                          <HStack>
                            <Checkbox
                              name={`body.bold`}
                              value={formData.body.bold}
                              isChecked={formData.body.bold == 'bold'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'body', null)
                              }
                            >
                              Bold
                            </Checkbox>
                            <Checkbox
                              name={`body.italic`}
                              value={formData.body.italic}
                              isChecked={formData.body.italic == 'italic'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'body', null)
                              }
                            >
                              Italic
                            </Checkbox>
                          </HStack>
                        </VStack>
                        <HexAlphaColorPicker
                          name={`body.fontColor`}
                          value={formData.body.fontColor}
                          onChange={(e) =>
                            handleChangec(e, 'body', `body.fontColor`, null)
                          }
                        />
                      </HStack>
                    </VStack>
                  </AccordionPanel>
                </VStack>
              </AccordionItem>
            </Accordion>

            <Text className='tw-font-bold'>Signatures:</Text>

            {formData.signatures.map((signature, index) => (
              <VStack width="100%" key={index}>
                <HStack width="100%" justifyContent="space-between"><Text>Use existing signature with details </Text>
                  <Signaturemodal
                    eventId={eventId}
                    formData={formData}
                    setFormData={setFormData}
                    index={index}
                    handleFileChange={handleFileChange}
                    signatures={formData.signatures}
                    signature={signature}
                    handleChange={handleChange}
                    selectedFiles={selectedFiles} />
                </HStack>
                <Accordion width="100%" allowMultiple>
                  <AccordionItem width="100%" border="none">
                    <HStack width="100%">
                      <Input
                        name={`signatures[${index}].name.name`}
                        value={signature.name.name}
                        onChange={(e) => handleChange(e, 'signatures', index)}
                        placeholder="Name"
                      />

                      <AccordionButton
                        height="30px"
                        width="30px"
                        justifyContent="center"
                      >
                        <EditIcon
                          color="blue"
                          height="25px"
                          width="25px"
                          justifyContent="center"
                        />
                      </AccordionButton>
                    </HStack>
                    <AccordionPanel>
                      <HStack width="100%">
                        <VStack>
                          <Select
                            name={`signatures[${index}].name.fontSize`}
                            value={signature.name.fontSize}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Size"
                          >
                            {fontsizeopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Select
                            name={`signatures[${index}].name.fontFamily`}
                            value={signature.name.fontFamily}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Style"
                          >
                            {fontStyleopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Input
                            name={`signatures[${index}].name.fontColor`}
                            value={signature.name.fontColor}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Color eg. red"
                          ></Input>
                          <HStack>
                            <Checkbox
                              name={`signatures[${index}].name.bold`}
                              value={signature.name.bold}
                              isChecked={signature.name.bold == 'bold'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'signatures', index)
                              }
                            >
                              Bold
                            </Checkbox>
                            <Checkbox
                              name={`signatures[${index}].name.italic`}
                              value={signature.name.italic}
                              isChecked={signature.name.italic == 'italic'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'signatures', index)
                              }
                            >
                              Italic
                            </Checkbox>
                          </HStack>
                        </VStack>
                        <HexAlphaColorPicker
                          name={`signatures[${index}].name.fontColor`}
                          value={signature.name.fontColor}
                          onChange={(e) =>
                            handleChangec(
                              e,
                              'signatures',
                              `signatures[${index}].name.fontColor`,
                              index
                            )
                          }
                        />
                      </HStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>

                <Accordion width="100%" allowMultiple>
                  <AccordionItem width="100%" border="none">
                    <HStack width="100%">
                      <Input
                        name={`signatures[${index}].position.position`}
                        value={signature.position.position}
                        onChange={(e) => handleChange(e, 'signatures', index)}
                        placeholder="Position"
                      />

                      <AccordionButton
                        height="30px"
                        width="30px"
                        justifyContent="center"
                      >
                        <EditIcon
                          color="blue"
                          height="25px"
                          width="25px"
                          justifyContent="center"
                        />
                      </AccordionButton>
                    </HStack>
                    <AccordionPanel>
                      <HStack width="100%">
                        <VStack>
                          <Select
                            name={`signatures[${index}].position.fontSize`}
                            value={signature.position.fontSize}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Size"
                          >
                            {fontsizeopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Select
                            name={`signatures[${index}].position.fontFamily`}
                            value={signature.position.fontFamily}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Style"
                          >
                            {fontStyleopt.map((item, key) => {
                              return (
                                <option key={key} value={`${item}`}>
                                  {item}
                                </option>
                              );
                            })}
                          </Select>
                          <Input
                            name={`signatures[${index}].position.fontColor`}
                            value={signature.position.fontColor}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Color eg. red"
                          ></Input>
                          <HStack>
                            <Checkbox
                              name={`signatures[${index}].position.bold`}
                              value={signature.position.bold}
                              isChecked={signature.position.bold == 'bold'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'signatures', index)
                              }
                            >
                              Bold
                            </Checkbox>
                            <Checkbox
                              name={`signatures[${index}].position.italic`}
                              value={signature.position.italic}
                              isChecked={signature.position.italic == 'italic'}
                              onChange={(e) =>
                                handleChangeStyle(e, 'signatures', index)
                              }
                            >
                              Italic
                            </Checkbox>
                          </HStack>
                        </VStack>
                        <HexAlphaColorPicker
                          name={`signatures[${index}].position.fontColor`}
                          value={signature.position.fontColor}
                          onChange={(e) =>
                            handleChangec(
                              e,
                              'signatures',
                              `signatures[${index}].position.fontColor`,
                              index
                            )
                          }
                        />
                      </HStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
                <Accordion width="100%" allowMultiple>
                  <AccordionItem width="100%" border="none" ><HStack width="100%">
                    <Input
                      name={`signatures[${index}].url.url`}
                      value={signature.url.url}
                      onChange={(e) => handleChange(e, 'signatures', index)}
                      placeholder="URL"
                      display="none"
                    />
                    <Text
                    width="100%">Upload Signature image (jpg/png): </Text>
                    <label className='tw-flex tw-justify-center tw-items-center tw-ml-2 hover:tw-cursor-pointer' htmlFor={`signatures[${index}].url.url`}  ><FaUpload style={{ height: "25px", width: "25px", color: 'purple' }} /></label>
                    <input
                      id={`signatures[${index}].url.url`}
                      name={`signatures[${index}].url.url`}
                      onChange={(e) => { handleFileChange(e, 'signatures', index); toast({ title: "Image uploaded", status: "success", duration: 2000, isClosable: true }) }}
                      type='file'
                      accept='image/jpeg , image/png'
                      style={{ height: "0px", width: "0px" }}
                    />
                    <AccordionButton height="30px" width="30px" justifyContent="center"><EditIcon height="25px" width="25px" justifyContent="center" color="blue" /></AccordionButton></HStack>

                    <AccordionPanel>
                      <HStack width="100%">
                        <Text>Size:</Text>
                        <Input
                          name={`signatures[${index}].url.size`}
                          value={signature.url.size}
                          onChange={(e) => handleChange(e, 'signatures', index)}
                          placeholder="Size"
                          type="number"
                        ></Input>
                        <Button
                          type="button"
                          name={`signatures[${index}].url.url`}
                          onClick={(e) => bgremove(e, 'signatures', index)}
                          value={signature.url.url}
                          style={{ color: 'black', width: '500px' }}
                        >
                          Remove Backgound {window.outerWidth > 768 && <InfoIcon marginX="4px" color="brown" height={"18px"} width={"18px"} onMouseLeave={(e) => document.getElementById('signInfo').style.display = "none"} onMouseEnter={(e) => document.getElementById('signInfo').style.display = "block"} />}
                        </Button>
                        
                      </HStack>
                      <Text background="lightcyan" borderRadius="10%" display="none" id='signInfo'>Use white background only</Text>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>

                <HStack>
                  {index > 0 && (
                    <IconButton
                      icon={<CloseIcon color="red" width="20px" height="20px" />}
                      onClick={() => handleDelete('signatures', index)}
                    />
                  )}
                  {index === formData.signatures.length - 1 && (
                    <IconButton
                      icon={<AddIcon color="green" height="20px" width="20px" />}
                      onClick={() => addField('signatures')}
                    />
                  )}
                </HStack>
              </VStack>
            ))}

            {/* Verifible link */}
            <Text className='tw-font-bold'>QR code with verifiable link:</Text>
            <Select
              name="verifiableLink"
              value={formData.verifiableLink}
              onChange={(e) => handleChange(e, 'verifiableLink', null)}
            // placeholder="Select Required or not"
            >
              <option value={true}>Required</option>
              <option value={false}>Not Required</option>
            </Select>
            <HStack width="100%">
              <Text className='tw-font-bold' width="40%">Date of issue:</Text>
              <Input
                type="date"
                name="footer.footer"
                value={formData.footer.footer}
                onChange={(e) => handleChange(e, 'footer', null)}
              />
            </HStack>

            <Button type="submit" colorScheme="blue">
              Submit
            </Button>
          </VStack>
        </form>
      </Container>
      <Box flex="1" p="4" style={{ margin: '0px', padding: '0px' }}>
        <SelectCertficate
          eventId={eventId}
          templateId={formData.templateId}
          contentBody={formData.body}
          certiType={formData.certiType}
          title={formData.title}
          certificateOf={formData.certificateOf}
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
