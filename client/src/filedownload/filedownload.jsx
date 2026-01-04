import React from 'react';
import { Button } from '@chakra-ui/react';

const FileDownloadButton = ({ fileUrl, fileName }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <Button
      colorScheme="teal"
      onClick={handleDownload}
      size="md"
      px="6"
      py="5"
      borderRadius="lg"
      fontWeight="600"
      boxShadow="sm"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-1px)',
      }}
      _active={{
        boxShadow: 'sm',
        transform: 'translateY(0)',
      }}
    >
      Download {fileName}
    </Button>
  );
};

export default FileDownloadButton;
