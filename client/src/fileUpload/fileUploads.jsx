import { useState, useEffect } from 'react'
import Header from '../components/header'
import { Input, Text, Button, useToast, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { CopyIcon , DeleteIcon } from '@chakra-ui/icons';
import getEnvironment from '../getenvironment';


const fileUploads = () => {
  const [file, setFile] = useState(undefined);
  const [uploads, setUploads] = useState([]);
  const toast = useToast();
  const apiURL = getEnvironment();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const response = await fetch(`${apiURL}/user/getUser`, { credentials: "include" })
      const data = await response.json();
      if (data.user.uploads) setUploads(data.user.uploads)
      console.log(data);
    }
    fetchUserDetails();
  }, [])

  const uploadFile = async () => {
    console.log("File to upload:", file);
    if (!file) {
      console.error("No file selected");
      toast({
        title: "No file selected",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("url", window.location.origin);
    try {
      const response = await fetch(`${apiURL}/user/getUser/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (response.ok) {
        console.log("File uploaded successfully");
        const data = await response.json();
        setUploads([data.link, ...uploads]);
        toast({
          title: "File uploaded successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        console.error("File upload failed", response.error);
        toast({
          title: "File upload failed",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const deleteFile = async (index) => {
    const fileToDelete = uploads[index];
    console.log("Deleting file:", fileToDelete);
    try {
      const response = await fetch(`${apiURL}/user/getUser/deleteUpload`, {
        method: "DELETE",
        body: JSON.stringify({ link: fileToDelete }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (response.ok) {
        console.log("File deleted successfully");
        setUploads(uploads.filter((_, i) => i !== index));
        toast({
          title: "File deleted successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        console.error("File deletion failed", response.error);
        toast({
          title: "File deletion failed",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

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
  
  return (
    <div className='tw-h-full tw-w-full'>
      <div>
        <Header title="Upload your file"></Header>
        <div className='tw-flex tw-justify-center tw-items-center tw-h-[20dvh] tw-gap-4'>
          <Text>Upload your file here</Text>
          <Input
            name='uploadedFile'
            type='file'
            onChange={(e) => { console.log(e.target.files[0]); setFile(e.target.files[0]) }}
            className='tw-max-w-fit'>
          </Input>
          <Button type='button' onClick={uploadFile}>
            Upload
          </Button>
        </div>
        <Text className='tw-text-center tw-text-4xl tw-font-bold tw-mb-2' style={{color:"#333"}}>Your Uploads</Text>
        <center>
          {uploads.length > 0 ? <TableContainer maxW="7xl" >
            <Table variant="striped" size="md" mt="1" >
              <Thead>
                <Tr>
                  <Th>S no</Th>
                  <Th>File Name</Th>
                  <Th>Copy Link</Th>
                  <Th>Delete</Th>
                </Tr>
              </Thead>
              <Tbody>
                {uploads.map((upload, index) => {
                  return (
                    <Tr key={index}>
                      <Td>{index + 1}</Td>
                      <Td>{upload.split("-").pop()}</Td>
                      <Td><Button
                      onClick={(e)=>{copyVariable(upload)}}
                      ><CopyIcon height="20px" width = "20px"/></Button></Td>
                      <Td><Button
                      onClick={(e) => { deleteFile(index) }}
                      ><DeleteIcon height="20px" width = "20px"/></Button></Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </TableContainer>
            : <Text className='tw-mt-8'>No uploads yet</Text>}
        </center>
      </div>
    </div>
  )
}

export default fileUploads;