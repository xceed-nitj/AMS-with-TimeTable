import React, { useState } from 'react';
import { Input, Button, VStack, IconButton, HStack, Textarea } from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import getEnvironment from '../../getenvironment';

const CertificateForm = () => {
  const apiUrl = getEnvironment();

  const [formData, setFormData] = useState({
    logos: [''],
    header: [''],
    body: '',
    footer: [''],
    signatures: [''],
  });

  const currentURL = window.location.pathname;
  const parts = currentURL.split('/');
  const eventId = parts[parts.length - 1];

  const handleChange = (e, fieldName, index) => {
    const { value } = e.target;

    if (fieldName === 'logos' || fieldName === 'header' || fieldName === 'footer' || fieldName === 'signatures') {
      setFormData((prevData) => {
        const updatedField = [...prevData[fieldName]];

        if (index !== null) {
          updatedField[index] = value;
        }

        return {
          ...prevData,
          [fieldName]: updatedField,
        };
      });
    } else if (fieldName === 'body') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: value,
      }));
    }
  };

  const addField = (fieldName) => {
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: [...prevData[fieldName], ''],
    }));
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
      const response = await fetch(`${apiUrl}/certificatemodule/certificate/content/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData);
      } else {
        console.error('Error submitting form:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="start">
        {/* Logos Fields */}
        {formData.logos.map((logo, index) => (
          <HStack key={index}>
            <Input
              name="logos"
              value={logo}
              onChange={(e) => handleChange(e, 'logos', index)}
              placeholder="Logo"
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
        {formData.header.map((header, index) => (
          <HStack key={index}>
            <Input
              name="header"
              value={header}
              onChange={(e) => handleChange(e, 'header', index)}
              placeholder="Header"
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
        <Textarea
          name="body"
          value={formData.body}
          onChange={(e) => handleChange(e, 'body', null)}
          placeholder="Body"
        />
        {/* Footer Fields */}
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

        {/* Signatures Fields */}
        {formData.signatures.map((signature, index) => (
          <HStack key={index}>
            <Input
              name="signatures"
              value={signature}
              onChange={(e) => handleChange(e, 'signatures', index)}
              placeholder="Signature"
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
          </HStack>
        ))}

        <Button type="submit" colorScheme="blue">
          Submit
        </Button>
      </VStack>
    </form>
  );
};

export default CertificateForm;
