import React from 'react';
import { Button } from "@chakra-ui/react";

const FileDownloadButton = ({ fileUrl, fileName }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <Button
      colorScheme="teal"  // Choose your preferred color scheme
      onClick={handleDownload}
    >
      Download {fileName}
    </Button>
  );
};

export default FileDownloadButton;
