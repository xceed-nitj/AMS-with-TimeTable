import React from 'react';
import { Button } from "@chakra-ui/react";

const FileDownloadButton = ({ fileUrl, fileName }) => {
  const handleDownload = () => {
    console.log("hi")
    const link = document.createElement('a');
    console.log(link)
    link.href = fileUrl;
    console.log(link.href)
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
