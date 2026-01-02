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
  Heading,
  Center,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, EditIcon, InfoIcon } from '@chakra-ui/icons';
import getEnvironment from '../../getenvironment';
// import Header from '../../components/header';
import Header from '../components/Header';
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
  const a = date.getMonth() > 8 ? '' : 0;
  const defaultDate = `${date.getFullYear()}-${a}${
    date.getMonth() + 1
  }-${date.getDate()}`;
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

  {
    /* Purpose: Resets form when certificate type changes and fetches existing certificate data from the API*/
  }
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
            if (signatures[0].name.name || signatures[0].name.name == '') {
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
            if (logos[0].url || logos[0].url == '') {
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
            if (header[0].header || header[0].header == '') {
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
            if (!certificateOf || certificateOf == '') {
              console.log('hey');
              CertificateOf = formData.certificateOf;
            } else {
              CertificateOf = certificateOf;
            }
            console.log(CertificateOf);
            // for body
            let Body = formData.body;
            if (body.body || body.body == '') {
              Body = body;
            } else {
              Body.body = body;
            }
            // console.log(title)
            //for title
            let Title = [];
            if (title[0] || title[0] == '') {
              if (title[0][0] || title[0][0] == '') {
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
              } else if (title[0]['name'] || title[0]['name'] == '') {
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
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
    return navigator.clipboard.writeText(text);
  }

  const fontsizeopt = [];
  for (let i = 6; i <= 60; i = i + 2) {
    fontsizeopt.push(i);
  }
  // const fontStyleopt = [
  //   'fantasy',
  //   'monospace',
  //   'sans-serif',
  //   'serif',
  //   'cursive',
  // ];
  const fontStyleopt = [
    'fantasy',
    'monospace',
    'sans-serif',
    'serif',
    'cursive',
    'Playfair Display',
    'Euphoria Script',
    'Cookie',
    'UnifrakturCook',
    'Allura',
    'Alex Brush',
    'Libre Caslon Display',
    'Special Elite',
    'Monoton',
    'Dancing Script',
    'Playwrite DE Grund',
    'Noto Serif Devanagari',
    'Ingrid Darling',
    'Grey Qo',
    'Kings',
    'Ole',
    'Rubik Maze',
    'Rubik Burned',
    'Rubik Marker Hatch',
    'Rubik Microbe',
    'Blaka Ink',
    'Noto Serif Grantha',
    'Rubik Spray Paint',
    'Rubik Wet Paint',
    'Finger Paint',
    'Rubik Bubbles',
    'Oleo Script',
    'Neuton',
    'Merienda',
    'Concert One',
    'Permanent Marker',
    'Abril Fatface',
    'Rowdies',
    'Lobster',
    'Pacifico',
    'Anton SC',
    'Ga Maamli',
    'Libre Baskerville',
    'Libre Baskerville',
    'Merriweather',
    'Roboto Slab',
    'Roboto',
    'Oswald',
  ];
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
        width={'100%'}
      >
        <Header title="Enter Certificate Details"></Header>

        <Box
          as="form"
          id="form"
          onSubmit={handleSubmit}
          borderWidth="1px"
          borderRadius="15px"
          
          padding={4}
          marginBottom={7}
          borderColor="gray"
          boxShadow={'2xl'}
        >
          <VStack spacing={4} align="start" className="tw-mb-10">
            {/* Certificate Type Selection */}
            <Box
              width="100%"
              className="tw-flex tw-flex-row tw-gap-3 tw-items-center tw-justify-between tw-px-2"
            >
              <Text className="tw-font-bold tw-text-[17px] ">
                Certificate Type:
              </Text>
              <Select
                name="certiType"
                value={formData.certiType}
                onChange={(e) => handleChange(e, 'certiType', null)}
                placeholder="Select Certificate Type"
                maxWidth="220px"
                borderWidth="1px"
                borderColor="gray.300"
                textColor="gray.700"
                borderRadius="7px"
              >
                <option value="winner">Winner</option>
                <option value="participant">Participant</option>
                <option value="speaker">Speaker</option>
                <option value="organizer">Organizer</option>
              </Select>
            </Box>

            {/* Title Fields */}
            <Box
              width="100%"
              className="tw-flex tw-flex-col tw-gap-3 tw-my-5 tw-px-2 tw-align-center"
            >
              <Text className="tw-font-bold tw-mb-1">
                Name of the Institute:
              </Text>

              {formData.title.length == 0
                ? (formData.title = [''])
                : formData.title.map((title, index) => (
                    <HStack key={index} alignItems="flex-start" width="100%">
                      <Accordion width="100%" allowMultiple>
                        <AccordionItem
                          border="none"
                          alignItems="center"
                          width="100%"
                        >
                          <HStack alignItems="center" width="100%">
                            <Input
                              name={`title[${index}].name`}
                              value={title.name}
                              onChange={(e) => handleChange(e, 'title', index)}
                              placeholder="Title"
                              width="100%"
                              borderWidth="1px"
                              borderColor="gray.300"
                              textColor="gray.700"
                              borderRadius="7px"
                            />
                            <AccordionButton
                  height="34px"
                  width="34px"
                  justifyContent="center"
                  borderRadius="8px"
                  _hover={{ bg: 'blue.50' }}
                >
                  <EditIcon color="blue.500" boxSize="18px" />
                </AccordionButton>

                            {index > 1 && (
                              <IconButton
                                size="sm"
                              icon={<CloseIcon color="red" boxSize="14px" />}
                                onClick={() => handleDelete('title', index)}
                              />
                            )}

                            {/*Add Another button is added below, so no need of it */}
                            {/* {index === formData.title.length - 1 && (
                              <IconButton
                                icon={
                                  <AddIcon
                                    color="green"
                                    width="20px"
                                    height="20px"
                                  />
                                }
                                onClick={() => addField('title')}
                              />
                            )} */}
                          </HStack>

                          {/* ACCORDION PANEL FOR TEXT SETTINGS */}
                          <AccordionPanel
                            bg="gray.50"
                            borderRadius="md"
                            p={3}
                            mt={2}
                          >
                            <HStack spacing="6" align="flex-start">
                              {/* LEFT: Text / Font Settings */}
                              <VStack spacing="3" align="stretch" flex="1">
                                <Text fontSize="sm" color="gray.600">
                                  Text settings
                                </Text>

                                <Select
                                  name={`title[${index}].fontSize`}
                                  value={title.fontSize}
                                  onChange={(e) =>
                                    handleChange(e, 'title', index)
                                  }
                                  placeholder="Size"
                                >
                                  {fontsizeopt.map((item, key) => (
                                    <option key={key} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </Select>

                                <Select
                                  name={`title[${index}].fontFamily`}
                                  value={title.fontFamily}
                                  onChange={(e) =>
                                    handleChange(e, 'title', index)
                                  }
                                  placeholder="Style"
                                >
                                  {fontStyleopt.map((item, key) => (
                                    <option key={key} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </Select>

                                <Input
                                  name={`title[${index}].fontColor`}
                                  value={title.fontColor}
                                  onChange={(e) =>
                                    handleChange(e, 'title', index)
                                  }
                                  placeholder="Color eg. black"
                                />

                                <HStack spacing="4" pt="1">
                                  <Checkbox
                                    name={`title[${index}].bold`}
                                    value={title.bold}
                                    isChecked={title.bold === 'bold'}
                                    onChange={(e) =>
                                      handleChangeStyle(e, 'title', index)
                                    }
                                  >
                                    Bold
                                  </Checkbox>

                                  <Checkbox
                                    name={`title[${index}].italic`}
                                    value={title.italic}
                                    isChecked={title.italic === 'italic'}
                                    onChange={(e) =>
                                      handleChangeStyle(e, 'title', index)
                                    }
                                  >
                                    Italic
                                  </Checkbox>
                                </HStack>
                              </VStack>

                              {/* DIVIDER */}
                              <Box
                                width="1px"
                                bg="gray.200"
                                alignSelf="stretch"
                              />

                              {/* RIGHT: Color Picker */}
                              <VStack spacing="2">
                                <Text fontSize="sm" color="gray.600">
                                  Color
                                </Text>

                                <Box
                                  border="1px solid"
                                  borderColor="gray.200"
                                  borderRadius="md"
                                  p="2"
                                >
                                  <HexAlphaColorPicker
                                    value={title.fontColor || '#000000'}
                                    onChange={(e) =>
                                      handleChangec(
                                        e,
                                        'title',
                                        `title[${index}].fontColor`,
                                        index
                                      )
                                    }
                                    style={{ width: '180px', height: '180px' }}
                                  />
                                </Box>
                              </VStack>
                            </HStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </HStack>
                  ))}

              {/* Add Another button */}
              <Button
                onClick={() => addField('title')}
                width="100%"
                height="45px"
                border="2px dashed"
                borderColor="green.400"
                color="green.500"
                bg="transparent"
                leftIcon={<AddIcon />}
                _hover={{ bg: 'green.50' }}
              >
                Add another
              </Button>
            </Box>

            {/* Template Selection */}
            <Box
              width="100%"
              className="tw-px-2 tw-my-5 tw-flex tw-flex-col tw-gap-3"
            >
              <Text className="tw-font-bold">Select Certificate Template:</Text>
              <Box
                overflowX="auto"
                whiteSpace="nowrap"
                padding="10px 0"
                borderWidth={'2px'}
                borderRadius={'8px'}
                borderColor={'gray.300'}
              >
                <HStack maxW={450} spacing={4} overflowX={'scroll'}>
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
            <Box
              width="100%"
              className="tw-flex tw-flex-col tw-gap-2 tw-px-2 tw-my-2"
            >
              {/* Header */}
              <HStack align="center" spacing={1}>
                <Text fontWeight="bold">Logos: </Text>
                <Tooltip
                  label="Only JPG/PNG allowed. Maximum 4 logos."
                  placement="right"
                  hasArrow
                  fontSize="sm"
                >
                  <InfoIcon
                    color="gray.500"
                    cursor="pointer"
                    boxSize="14px"
                    _hover={{ color: 'gray.700' }}
                  />
                </Tooltip>
              </HStack>

              {formData.logos.map((logo, index) => (
                <Box
                  key={index}
                  width="100%"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="8px"
                  px={3}
                  py={1}
                  _hover={{ borderColor: 'blue.200' }}
                >
                  <Accordion allowMultiple>
                    <AccordionItem border="none">
                      {/* Top Row */}
                      <HStack
                        width="100%"
                        justify="space-between"
                        align="center"
                      >
                        <Input
                          name={`logos[${index}].url`}
                          value={logo.url}
                          onChange={(e) => handleChange(e, 'logos', index)}
                          display="none"
                        />

                        <Text fontSize="sm">
                          Upload Logo : <b>Logo {index + 1}</b>
                        </Text>

                        <HStack spacing={2}>
                          {/* Upload */}
                          <Box
                            as="label"
                            htmlFor={`logo${index}`}
                            p="5px"
                            borderRadius="md"
                            _hover={{ bg: 'purple.50' }}
                            cursor="pointer"
                          >
                            <FaUpload
                              style={{ height: 22, width: 22, color: 'purple' }}
                            />
                          </Box>

                          <Input
                            id={`logo${index}`}
                            name={`logos[${index}].url`}
                            onChange={(e) =>
                              handleFileChange(e, 'logos', index)
                            }
                            type="file"
                            accept="image/jpeg , image/png"
                            style={{
                              width: 0,
                              height: 0,
                              padding: 0,
                              margin: 0,
                            }}
                          />

                          {/* Edit */}
                          <AccordionButton
                            height="32px"
                            width="32px"
                            borderRadius="md"
                            _hover={{ bg: 'blue.50' }}
                            justifyContent="center"
                          >
                            <EditIcon color="blue.500" boxSize="20px" />
                          </AccordionButton>

                          {/* Delete */}
                          {index > 0 && (
                            <IconButton
                              size="sm"
                              icon={<CloseIcon color="red" boxSize="14px" />}
                              onClick={() => handleDelete('logos', index)}
                            />
                          )}
                        </HStack>
                      </HStack>

                      {/* Advanced Settings */}
                      <AccordionPanel pt={2}>
                        <Box bg="gray.50" borderRadius="md" px={3} py={2}>
                          <HStack width="100%" spacing={4}>
                            <HStack width="60%">
                              <Text fontSize="sm">Vertical Position:</Text>
                              <input
                                type="number"
                                name={`logos[${index}].height`}
                                value={logo.height}
                                onChange={(e) =>
                                  handleChange(e, 'logos', index)
                                }
                                style={{
                                  width: '55px',
                                  textAlign: 'center',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                }}
                              />
                            </HStack>

                            <HStack width="40%">
                              <Text fontSize="sm">Size:</Text>
                              <input
                                type="number"
                                name={`logos[${index}].width`}
                                value={logo.width}
                                onChange={(e) =>
                                  handleChange(e, 'logos', index)
                                }
                                style={{
                                  width: '55px',
                                  textAlign: 'center',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                }}
                              />
                            </HStack>
                          </HStack>
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              ))}

              {/* Add Button */}
              {formData.logos.length < 4 && (
                <Button
                  onClick={() => addField('logos')}
                  width="100%"
                  height="45px"
                  border="2px dashed"
                  borderColor="green.400"
                  color="green.500"
                  bg="transparent"
                  leftIcon={<AddIcon />}
                  _hover={{ bg: 'green.50', borderColor: 'green.500' }}
                >
                  Add another
                </Button>
              )}
            </Box>

            {/* Department and Club Fields */}
            <Box
              width="100%"
              className="tw-flex tw-flex-col tw-gap-2 tw-px-2 tw-my-3"
            >
              {/* Header */}
              <Text fontWeight="bold">Enter Department or Club</Text>

              {formData.header.map((header, index) => (
                <Box key={index} width="100%">
                  <Accordion allowMultiple>
                    <AccordionItem border="none">
                      {/* Top Row */}
                      <HStack
                        width="100%"
                        justify="space-between"
                        align="center"
                      >
                        <Input
                          name={`header[${index}].header`}
                          value={header.header}
                          onChange={(e) => handleChange(e, 'header', index)}
                          placeholder="Department or Club Name"
                          borderWidth="2px"
                          borderColor="gray.300"
                          textColor="gray.700"
                          borderRadius="7px"
                        />

                        <HStack spacing={2}>
                          {/* Edit */}
                          <AccordionButton
                            height="32px"
                            width="32px"
                            borderRadius="md"
                            _hover={{ bg: 'blue.50' }}
                            justifyContent="center"
                          >
                            <EditIcon color="blue.500" boxSize="20px" />
                          </AccordionButton>

                          {/* Delete */}
                          {index > 0 && (
                            <IconButton
                              size="sm"
                              icon={<CloseIcon color="red" boxSize="14px" />}
                              onClick={() => handleDelete('header', index)}
                            />
                          )}

                          {/* Add */}
                          {index === formData.header.length - 1 && (
                            <IconButton
                              size="sm"
                              icon={<AddIcon color="green" boxSize="14px" />}
                              onClick={() => addField('header')}
                            />
                          )}
                        </HStack>
                      </HStack>

                      {/* Advanced Settings */}
                      <AccordionPanel pt={3}>
                        <Box bg="gray.50" borderRadius="md" px={3} py={3}>
                          <HStack spacing={6} align="flex-start">
                            <VStack align="start" spacing={3}>
                              <Select
                                name={`header[${index}].fontSize`}
                                value={header.fontSize}
                                onChange={(e) =>
                                  handleChange(e, 'header', index)
                                }
                                placeholder="Font Size"
                              >
                                {fontsizeopt.map((item, key) => (
                                  <option key={key} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </Select>

                              <Select
                                name={`header[${index}].fontFamily`}
                                value={header.fontFamily}
                                onChange={(e) =>
                                  handleChange(e, 'header', index)
                                }
                                placeholder="Font Style"
                              >
                                {fontStyleopt.map((item, key) => (
                                  <option key={key} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </Select>

                              <Input
                                name={`header[${index}].fontColor`}
                                value={header.fontColor}
                                onChange={(e) =>
                                  handleChange(e, 'header', index)
                                }
                                placeholder="Color (eg. red / #000000)"
                              />

                              <HStack spacing={4}>
                                <Checkbox
                                  name={`header[${index}].bold`}
                                  value={header.bold}
                                  isChecked={header.bold === 'bold'}
                                  onChange={(e) =>
                                    handleChangeStyle(e, 'header', index)
                                  }
                                >
                                  Bold
                                </Checkbox>

                                <Checkbox
                                  name={`header[${index}].italic`}
                                  value={header.italic}
                                  isChecked={header.italic === 'italic'}
                                  onChange={(e) =>
                                    handleChangeStyle(e, 'header', index)
                                  }
                                >
                                  Italic
                                </Checkbox>
                              </HStack>
                            </VStack>

                            {/* Color Picker */}
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
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              ))}
            </Box>

            {/* CERTIFICATE DETAILS */}
            <Box
              width="100%"
              className="tw-px-2 tw-my-2 tw-mb-4 tw-flex tw-flex-col "
            >
              <Accordion width="100%" allowMultiple>
                <AccordionItem width="100%" border="none">
                  <HStack width="100%" justifyContent="space-between">
                    <Text className="tw-font-bold">Certificate:</Text>
                  </HStack>
                  <VStack width="100%">
                    <HStack width="100%">
                      <Input
                        name="certificateOf.certificateOf"
                        // value={formData.certificateOf.certificateOf}
                        onChange={(e) => handleChange(e, 'certificateOf', null)}
                        placeholder="Type of Certificate (e.g., Certificate of Participation)"
                        width="100%"
                        borderWidth="2px"
                        borderColor="gray.300"
                        textColor="gray.700"
                        borderRadius="7px"
                      />
                      <AccordionButton
                        height="32px"
                        width="32px"
                        borderRadius="md"
                        _hover={{ bg: 'blue.50' }}
                        justifyContent="center"
                      >
                        <EditIcon color="blue.500" boxSize="20px" />
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
                                isChecked={
                                  formData.certificateOf.bold == 'bold'
                                }
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
            </Box>

            {/* Body of the certificate */}
            <Box
              width="100%"
              className="tw-px-2 tw-my-2 tw-mb-4 tw-flex tw-flex-col"
            >
              <Accordion width="100%" allowMultiple>
                <AccordionItem width="100%" border="none">
                  {/* Header */}
                  <HStack width="100%" justifyContent="space-between" mb={2}>
                    <HStack spacing={2}>
                      <Text fontWeight="bold">Body of the certificate</Text>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const el = document.getElementById('bodyVariables');
                          el.style.display =
                            el.style.display === 'flex' ? 'none' : 'flex';
                        }}
                      >
                        See variables
                      </Button>
                    </HStack>

                    <AccordionButton
                      height="32px"
                      width="32px"
                      borderRadius="md"
                      _hover={{ bg: 'blue.50' }}
                      justifyContent="center"
                    >
                      <EditIcon color="blue.500" boxSize="20px" />
                    </AccordionButton>
                  </HStack>

                  {/* Variables Panel */}
                  <Box
                    id="bodyVariables"
                    display="none"
                    mb={3}
                    p={3}
                    bg="gray.50"
                    border="1px dashed"
                    borderColor="gray.300"
                    borderRadius="6px"
                  >
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Click to copy variable
                    </Text>

                    <HStack wrap="wrap" spacing={2}>
                      {[
                        'name',
                        'department',
                        'college',
                        'teamName',
                        'position',
                        'title1',
                        'title2',
                      ].map((item) => (
                        <Button
                          key={item}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) =>
                            copyVariable(`{{${e.target.innerText}}}`)
                          }
                        >
                          {item}
                        </Button>
                      ))}
                    </HStack>
                  </Box>

                  {/* Body Text */}
                  <VStack width="100%" spacing={3}>
                    <Textarea
                      name="body.body"
                      value={formData.body.body}
                      onChange={(e) => handleChange(e, 'body', null)}
                      placeholder="Drag from bottom right corner to increase the text area"
                      minH="120px"
                      resize="vertical"
                    />

                    {/* Advanced Settings */}
                    <AccordionPanel pt={2} width="100%">
                      <Box
                        bg="gray.50"
                        borderRadius="md"
                        px={3}
                        py={3}
                        width="100%"
                      >
                        <HStack align="flex-start" spacing={6}>
                          <VStack align="start" spacing={3}>
                            <Select
                              name="body.fontSize"
                              value={formData.body.fontSize}
                              onChange={(e) => handleChange(e, 'body', null)}
                              placeholder="Font Size"
                            >
                              {fontsizeopt.map((item, key) => (
                                <option key={key} value={item}>
                                  {item}
                                </option>
                              ))}
                            </Select>

                            <Select
                              name="body.fontFamily"
                              value={formData.body.fontFamily}
                              onChange={(e) => handleChange(e, 'body', null)}
                              placeholder="Font Style"
                            >
                              {fontStyleopt.map((item, key) => (
                                <option key={key} value={item}>
                                  {item}
                                </option>
                              ))}
                            </Select>

                            <Input
                              name="body.fontColor"
                              value={formData.body.fontColor}
                              onChange={(e) => handleChange(e, 'body', null)}
                              placeholder="Color (eg. red / #000000)"
                            />

                            <HStack spacing={4}>
                              <Checkbox
                                name="body.bold"
                                value={formData.body.bold}
                                isChecked={formData.body.bold === 'bold'}
                                onChange={(e) =>
                                  handleChangeStyle(e, 'body', null)
                                }
                              >
                                Bold
                              </Checkbox>

                              <Checkbox
                                name="body.italic"
                                value={formData.body.italic}
                                isChecked={formData.body.italic === 'italic'}
                                onChange={(e) =>
                                  handleChangeStyle(e, 'body', null)
                                }
                              >
                                Italic
                              </Checkbox>
                            </HStack>
                          </VStack>

                          {/* Color Picker */}
                          <HexAlphaColorPicker
                            name="body.fontColor"
                            value={formData.body.fontColor}
                            onChange={(e) =>
                              handleChangec(e, 'body', 'body.fontColor', null)
                            }
                          />
                        </HStack>
                      </Box>
                    </AccordionPanel>
                  </VStack>
                </AccordionItem>
              </Accordion>
            </Box>

            {/* Signatures Fields */}
            <Box
              width="100%"
              className="tw-px-2 tw-my-4 tw-flex tw-flex-col tw-gap-3"
            >
              {/* Section Header */}
              <Text fontWeight="bold">Signatures</Text>

              {formData.signatures.map((signature, index) => (
                <Box
                  key={index}
                  width="100%"
                  border="2px solid"
                  borderColor="gray.200"
                  borderRadius="8px"
                  px={3}
                  py={3}
                  _hover={{ borderColor: 'blue.300' }}
                >
                  <VStack width="100%" spacing={3}>
                    {/* Existing Signature */}
                    <HStack width="100%" justifyContent="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Use existing signature with details
                      </Text>

                      <Signaturemodal
                        eventId={eventId}
                        formData={formData}
                        setFormData={setFormData}
                        index={index}
                        handleFileChange={handleFileChange}
                        signatures={formData.signatures}
                        signature={signature}
                        handleChange={handleChange}
                        selectedFiles={selectedFiles}
                      />
                    </HStack>

                    {/* NAME */}
                    <Accordion allowMultiple>
                      <AccordionItem border="none">
                        <HStack justify="space-between">
                          <Input
                            name={`signatures[${index}].name.name`}
                            value={signature.name.name}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Name"
                          />

                          <AccordionButton
                            height="32px"
                            width="32px"
                            borderRadius="md"
                            _hover={{ bg: 'blue.50' }}
                          >
                            <EditIcon color="blue.500" boxSize="18px" />
                          </AccordionButton>
                        </HStack>

                        <AccordionPanel pt={2}>
                          <Box bg="gray.50" p={3} borderRadius="md">
                            <HStack spacing={6} align="flex-start">
                              <VStack align="start" spacing={3}>
                                <Select
                                  name={`signatures[${index}].name.fontSize`}
                                  value={signature.name.fontSize}
                                  onChange={(e) =>
                                    handleChange(e, 'signatures', index)
                                  }
                                  placeholder="Font Size"
                                >
                                  {fontsizeopt.map((item, key) => (
                                    <option key={key} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </Select>

                                <Select
                                  name={`signatures[${index}].name.fontFamily`}
                                  value={signature.name.fontFamily}
                                  onChange={(e) =>
                                    handleChange(e, 'signatures', index)
                                  }
                                  placeholder="Font Style"
                                >
                                  {fontStyleopt.map((item, key) => (
                                    <option key={key} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </Select>

                                <Input
                                  name={`signatures[${index}].name.fontColor`}
                                  value={signature.name.fontColor}
                                  onChange={(e) =>
                                    handleChange(e, 'signatures', index)
                                  }
                                  placeholder="Color"
                                />

                                <HStack spacing={4}>
                                  <Checkbox
                                    name={`signatures[${index}].name.bold`}
                                    isChecked={signature.name.bold === 'bold'}
                                    onChange={(e) =>
                                      handleChangeStyle(e, 'signatures', index)
                                    }
                                  >
                                    Bold
                                  </Checkbox>

                                  <Checkbox
                                    name={`signatures[${index}].name.italic`}
                                    isChecked={
                                      signature.name.italic === 'italic'
                                    }
                                    onChange={(e) =>
                                      handleChangeStyle(e, 'signatures', index)
                                    }
                                  >
                                    Italic
                                  </Checkbox>
                                </HStack>
                              </VStack>

                              <HexAlphaColorPicker
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
                          </Box>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>

                    {/* POSITION */}
                    <Accordion allowMultiple>
                      <AccordionItem border="none">
                        <HStack justify="space-between">
                          <Input
                            name={`signatures[${index}].position.position`}
                            value={signature.position.position}
                            onChange={(e) =>
                              handleChange(e, 'signatures', index)
                            }
                            placeholder="Position"
                          />

                          <AccordionButton
                            height="32px"
                            width="32px"
                            borderRadius="md"
                            _hover={{ bg: 'blue.50' }}
                          >
                            <EditIcon color="blue.500" boxSize="18px" />
                          </AccordionButton>
                        </HStack>

                        <AccordionPanel pt={2}>
                          <Box bg="gray.50" p={3} borderRadius="md">
                            <HStack spacing={6} align="flex-start">
                              <VStack align="start" spacing={3}>
                                <Select
                                  name={`signatures[${index}].position.fontSize`}
                                  value={signature.position.fontSize}
                                  onChange={(e) =>
                                    handleChange(e, 'signatures', index)
                                  }
                                  placeholder="Font Size"
                                >
                                  {fontsizeopt.map((item, key) => (
                                    <option key={key} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </Select>

                                <Select
                                  name={`signatures[${index}].position.fontFamily`}
                                  value={signature.position.fontFamily}
                                  onChange={(e) =>
                                    handleChange(e, 'signatures', index)
                                  }
                                  placeholder="Font Style"
                                >
                                  {fontStyleopt.map((item, key) => (
                                    <option key={key} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </Select>

                                <Input
                                  name={`signatures[${index}].position.fontColor`}
                                  value={signature.position.fontColor}
                                  onChange={(e) =>
                                    handleChange(e, 'signatures', index)
                                  }
                                  placeholder="Color"
                                />

                                <HStack spacing={4}>
                                  <Checkbox
                                    isChecked={
                                      signature.position.bold === 'bold'
                                    }
                                    onChange={(e) =>
                                      handleChangeStyle(e, 'signatures', index)
                                    }
                                  >
                                    Bold
                                  </Checkbox>

                                  <Checkbox
                                    isChecked={
                                      signature.position.italic === 'italic'
                                    }
                                    onChange={(e) =>
                                      handleChangeStyle(e, 'signatures', index)
                                    }
                                  >
                                    Italic
                                  </Checkbox>
                                </HStack>
                              </VStack>

                              <HexAlphaColorPicker
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
                          </Box>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>

                    {/* IMAGE UPLOAD */}
                    <Accordion allowMultiple>
                      <AccordionItem border="none">
                        <HStack justify="space-between">
                          <Text fontSize="sm">
                            Upload signature image (jpg/png)
                          </Text>

                          <HStack spacing={2}>
                            <Box
                              as="label"
                              htmlFor={`signatures-${index}`}
                              cursor="pointer"
                              p={1}
                              borderRadius="md"
                              _hover={{ bg: 'purple.50' }}
                            >
                              <FaUpload
                                style={{
                                  height: 22,
                                  width: 22,
                                  color: 'purple',
                                }}
                              />
                            </Box>

                            <input
                              id={`signatures-${index}`}
                              type="file"
                              accept="image/jpeg , image/png"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                handleFileChange(e, 'signatures', index);
                                toast({
                                  title: 'Image uploaded',
                                  status: 'success',
                                  duration: 2000,
                                  isClosable: true,
                                });
                              }}
                            />

                            <AccordionButton
                              height="32px"
                              width="32px"
                              borderRadius="md"
                            >
                              <EditIcon color="blue.500" boxSize="18px" />
                            </AccordionButton>
                          </HStack>
                        </HStack>

                        <AccordionPanel pt={2}>
                          <Box bg="gray.50" p={3} borderRadius="md">
                            <HStack spacing={4}>
                              <Text>Size</Text>
                              <Input
                                type="number"
                                value={signature.url.size}
                                onChange={(e) =>
                                  handleChange(e, 'signatures', index)
                                }
                              />

                              <Button
                                type="button"
                                onClick={(e) =>
                                  bgremove(e, 'signatures', index)
                                }
                              >
                                Remove Background
                              </Button>
                            </HStack>
                          </Box>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>

                    {/* Actions */}
                    <HStack justify="flex-end">
                      {index > 0 && (
                        <IconButton
                          icon={<CloseIcon color="red" />}
                          onClick={() => handleDelete('signatures', index)}
                        />
                      )}
                      {index === formData.signatures.length - 1 && (
                        <IconButton
                          icon={<AddIcon color="green" />}
                          onClick={() => addField('signatures')}
                        />
                      )}
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </Box>

            {/* Verifible link */}
            <Box
              width="100%"
              className="tw-my-4 tw-flex tw-flex-row tw-gap-2 tw-px-2 tw-items-center tw-justify-between"
            >
              {/* Label */}
              <Text className="tw-font-bold tw-text-[16px]">
                QR code with verifiable link:
              </Text>

              {/* Select box */}
              <Select
                name="verifiableLink"
                value={formData.verifiableLink}
                onChange={(e) => handleChange(e, 'verifiableLink', null)}
                height="42px"
                width="160px"
                borderRadius="8px"
                borderWidth="2px"
                borderColor="gray.300"
                className="tw-flex tw-items-center"
                _hover={{ borderColor: 'blue.400' }}
                _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
              >
                <option value={false}>Not Required</option>
                <option value={true}>Required</option>
              </Select>
            </Box>

            {/* Date of issue */}
            <Box
              width="100%"
              className="tw-my-2 tw-flex tw-flex-row tw-gap-2 tw-px-2 tw-items-center tw-justify-between"
            >
              <HStack width="100%">
                <Text className="tw-font-bold" width="40%">
                  Date of issue:
                </Text>
                <Input
                  type="date"
                  name="footer.footer"
                  width="180px"
                  borderWidth="2px"
                  value={formData.footer.footer}
                  onChange={(e) => handleChange(e, 'footer', null)}
                />
              </HStack>
            </Box>

            <Box width="100%" className="tw-px-2 tw-my-4">
              <Button
                type="submit"
                width="100%"
                height="44px"
                borderRadius="12px"
                colorScheme="blue"
                fontSize="md"
                fontWeight="semibold"
              >
                Save Changes
              </Button>
            </Box>
          </VStack>
        </Box>
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
