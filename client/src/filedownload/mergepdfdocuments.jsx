import React, { useState, useEffect } from 'react';
import { ChakraProvider, Container, Box, Button, Input, Text, VStack, HStack, Select } from '@chakra-ui/react';
import { FaTrash, FaGripVertical } from 'react-icons/fa';
import { PDFDocument } from 'pdf-lib';
import Header from "../components/header";
import getEnvironment from "../getenvironment";



const MergePDFComponent = () => {
  const [files, setFiles] = useState([]);
  const [mergeOrder, setMergeOrder] = useState('original'); // 'original' or 'reverse'
  const [filename, setFilename] = useState(' ');
  const [dept, setDept]=useState('NITJ');
  const apiUrl = getEnvironment();

  const currentURL = window.location.pathname;
  const parts = currentURL.split("/");
  const currentCode = parts[parts.length - 3];

  useEffect(()=>{
  const fetchTTData = async (currentCode) => {
    try {
      const response = await fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('ttdata', data)
      setDept(data[0].dept);
      return data;
    } catch (error) {
      console.error('Error fetching TTdata:', error);
    }
  };
  fetchTTData(currentCode)
},[currentCode]);



  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleMergeOrderChange = (e) => {
    setMergeOrder(e.target.value);
  };

  const handleDeleteFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((file, i) => i !== index));
  };

  const handleMoveFile = (dragIndex, hoverIndex) => {
    const draggedFile = files[dragIndex];
    const updatedFiles = [...files];
    updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(hoverIndex, 0, draggedFile);
    setFiles(updatedFiles);
  };

  const mergePDFs = async () => {
    try {
      if (files.length < 2) {
        console.error('Please select at least two PDF files for merging.');
        return;
      }

      // Load PDFs
      const pdfDocs = await Promise.all(files.map((file) => loadPdf(file)));

      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();

      // Determine the order of merging
      const mergeIndices =
        mergeOrder === 'original'
          ? Array.from({ length: pdfDocs.length }, (_, index) => index)
          : Array.from({ length: pdfDocs.length }, (_, index) => pdfDocs.length - 1 - index);

      // Add pages from each PDF according to the merge order
      for (const index of mergeIndices) {
        const pdfDoc = pdfDocs[index];
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => {
          // Add the modified page to the merged PDF
          mergedPdf.addPage(page);
        });
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

    //   const currentDate = new Date();
      const dynamicFilename = `${dept}_TT.pdf`;
      setFilename(dynamicFilename);

      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(mergedPdfBlob);
      downloadLink.download = filename;
      // Append the link to the body
      document.body.appendChild(downloadLink);

      // Trigger a click event on the link to initiate the download
      downloadLink.click();

      // Remove the link from the body
      document.body.removeChild(downloadLink);

      console.log('Merged PDF:', mergedPdfBlob);
    } catch (error) {
      console.error('Error merging PDFs:', error);
    }
  };

  const loadPdf = async (file) => {
    return PDFDocument.load(await file.arrayBuffer());
  };

  return (
    <ChakraProvider>
         <Container maxW='4xl'>
      <Header title="Merge PDF Documents"></Header>

      <Box p={4}>
        <Text mb={4}>Select All PDF files to merge:</Text>
        <Input type="file" mb={2} onChange={handleFileChange} multiple accept=".pdf" />
        {files.length > 0 && (
            
          <VStack align="flex-start" spacing={4} width="100%">
        <Text mb={2}>Selected files are shown below:</Text>
        <Text color="Blue">
    Drag and Drop to change the order; Use delete button if required!
    </Text>
            {/* <HStack>

              <Text>Choose Merge Order:</Text>
              <Select value={mergeOrder} onChange={handleMergeOrderChange}>
                <option value="original">Original</option>
                <option value="reverse">Reverse</option>
              </Select>
            </HStack> */}
            <Box width="100%" borderWidth="1px" borderRadius="md" padding={4}>
              {files.map((file, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  padding={2}
                  borderWidth="1px"
                  borderRadius="md"
                  marginBottom={2}
                  cursor="grab"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    const hoverIndex = index;
                    handleMoveFile(dragIndex, hoverIndex);
                  }}
                >
                  <Text>{file.name}</Text>
                  <HStack>
                    <Button
                      variant="outline"
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteFile(index)}
                    >
                      Delete
                    </Button>
                    <Box as="button" fontSize="20px" {...(index === 0 ? {} : { cursor: 'grab' })}>
                      <FaGripVertical />
                    </Box>
                  </HStack>
                </Box>
              ))}
            </Box>
            {/* <Link to="/tt/viewmrooms"> */}
            <Button colorScheme="teal" onClick={mergePDFs}>
              Merge PDFs
            </Button>
         
                {/* </Link> */}
            </VStack>
        )}
      </Box>
      </Container>
    </ChakraProvider>
  );
};


export default MergePDFComponent;
