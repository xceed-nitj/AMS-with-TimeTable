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
    logos: [''],
    header: [''],
    body: '',
    footer: [''],
    signatures: [''],
    certiType: '',
    templateId: '', /// Template Design Number
  });

  console.log(formData.templateId);

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
            setFormData(responseData[0]);
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
      fieldName === 'signatures'
    ) {
      setFormData((prevData) => {
        const updatedField = [...prevData[fieldName]];

        if (index !== null) {
          // For signatures, update the specific property of the signature object
          if (fieldName === 'signatures') {
            const signatureField = e.target.name.split('.')[1]; // Extract the property name (name, position, url)
            updatedField[index] = {
              ...updatedField[index],
              [signatureField]: value,
            };
          } else {
            updatedField[index] = value;
          }
        }

        return {
          ...prevData,
          [fieldName]: updatedField,
        };
      });
    } else if (fieldName === 'body' || fieldName === 'certiType') {
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
          { name: '', position: '', url: '' },
        ],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: [...prevData[fieldName], ''],
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
    <Flex>
      <Container
        maxW="lg"
        style={{
          height: '90dvh',
          overflowY: 'scroll',
          clipPath: 'content-box',
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
              <option value="9">Premium 1</option>
              <option value="10">Premium 2</option>
              <option value="11">Premium 3</option>
              <option value="12">Premium 4</option>
              <option value="13">Premium 5</option>
              <option value="14">Premium 6</option>
              <option value="15">Basic 11</option>
              <option value="16">Basic 12</option>              
              <option value="17">Basic 13</option>              
              <option value="18">Basic 14</option>              
              <option value="19">Basic 15</option>
              <option value="20">Basic 16</option>
            </Select>

            <Text>Enter the link for the logos:</Text>
            {/* Logos Fields */}

            {formData.logos.map((logo, index) => (
              <HStack key={index}>
                <Input
                  name="logos"
                  value={logo}
                  onChange={(e) => handleChange(e, 'logos', index)}
                  placeholder="Logo"
                  width="200%"
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
            <Text>Enter Department or Culb data:</Text>

            {formData.header.map((header, index) => (
              <HStack key={index}>
                <Input
                  name="header"
                  value={header}
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
            ))}

            <Text>Enter the body of the certificate:</Text>

            <Textarea
              name="body"
              value={formData.body}
              onChange={(e) => handleChange(e, 'body', null)}
              placeholder="Body"
            />
            {/* Footer Fields */}

            <Text>Enter the link for signatures:</Text>

            {formData.signatures.map((signature, index) => (
              <VStack key={index}>
                <Input
                  name={`signatures[${index}].name`}
                  value={signature.name}
                  onChange={(e) => handleChange(e, 'signatures', index)}
                  placeholder="Name"
                />
                <Input
                  name={`signatures[${index}].position`}
                  value={signature.position}
                  onChange={(e) => handleChange(e, 'signatures', index)}
                  placeholder="Position"
                />
                <Input
                  name={`signatures[${index}].url`}
                  value={signature.url}
                  onChange={(e) => handleChange(e, 'signatures', index)}
                  placeholder="URL"
                />
                {index > 0 && (
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
                )}
              </VStack>
            ))}

            <Text>Any additoinal data:</Text>

            {formData.footer.map((footer, index) => (
              <HStack key={index}>
                <Input
                  name="footer"
                  value={footer}
                  onChange={(e) => handleChange(e, 'footer', index)}
                  placeholder="Footer"
                />
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
