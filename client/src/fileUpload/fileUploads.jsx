import { useState, useEffect } from 'react'
import Header from '../components/header'
import {
  Input, Text, Button, useToast, Box, Flex, Center, SimpleGrid,
  Badge, Icon, HStack, Tooltip,
} from '@chakra-ui/react'
import {
  FaCloudUploadAlt, FaUpload, FaCopy, FaTrashAlt, FaExternalLinkAlt,
  FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileArchive,
  FaFileAlt, FaFileImage, FaFileVideo, FaFileAudio, FaFile,
} from 'react-icons/fa';
import getEnvironment from '../getenvironment';
import {
  PageHeader, DeleteModal, CardGridSkeleton,
} from '../conferencemodule/components/ui';

const ACCENT = "blue";

// Detect a friendly type + icon + color from the file extension.
const FILE_TYPES = [
  { re: /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i, label: "Image", icon: FaFileImage, color: "teal", isImage: true },
  { re: /\.pdf$/i, label: "PDF", icon: FaFilePdf, color: "red" },
  { re: /\.(docx?|odt|rtf)$/i, label: "Document", icon: FaFileWord, color: "blue" },
  { re: /\.(xlsx?|csv|ods)$/i, label: "Spreadsheet", icon: FaFileExcel, color: "green" },
  { re: /\.(pptx?|odp)$/i, label: "Presentation", icon: FaFilePowerpoint, color: "orange" },
  { re: /\.(zip|rar|7z|tar|gz)$/i, label: "Archive", icon: FaFileArchive, color: "yellow" },
  { re: /\.(mp4|mov|avi|mkv|webm)$/i, label: "Video", icon: FaFileVideo, color: "purple" },
  { re: /\.(mp3|wav|ogg|m4a)$/i, label: "Audio", icon: FaFileAudio, color: "pink" },
  { re: /\.(txt|md)$/i, label: "Text", icon: FaFileAlt, color: "gray" },
];

const fileTypeOf = (nameOrLink) => {
  const match = FILE_TYPES.find((t) => t.re.test(nameOrLink || ""));
  return match || { label: "File", icon: FaFile, color: "gray" };
};

const fileNameOf = (link) => decodeURIComponent((link || "").split("/").pop() || "").replace(/^\d+-/, "");

const fileUploads = () => {
  const [file, setFile] = useState(undefined);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const toast = useToast();
  const apiURL = getEnvironment();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${apiURL}/user/getUser`, { credentials: "include" })
        const data = await response.json();
        if (data.user.uploads) setUploads(data.user.uploads)
        console.log(data);
      } catch (err) {
        console.error("Error fetching uploads:", err);
      } finally {
        setLoading(false);
      }
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
    setUploading(true);
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
        setFile(undefined);
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
    } finally {
      setUploading(false);
    }
  };

  const requestDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const index = deleteIndex;
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
    } finally {
      setShowDeleteConfirm(false);
      setDeleteIndex(null);
    }
  }

  function copyVariable(text) {
    if (!navigator.clipboard) {
      return Promise.reject('Clipboard API not supported');
    }
    toast({
      title: 'Link copied',
      status: "success",
      duration: 1000,
      isClosable: true,
    });
    return navigator.clipboard.writeText(text);
  }

  const chosenType = file ? fileTypeOf(file.name) : null;

  return (
    <div className='tw-h-full tw-w-full tw-bg-slate-100 tw-min-h-screen'>
      <Header title="Upload your file"></Header>
      <Box px={{ base: 3, md: 5 }} py={6} maxW="1600px" mx="auto">
        <PageHeader
          icon={FaCloudUploadAlt}
          title="File Uploads"
          subtitle="Upload files and copy their links to use anywhere on your sites."
          accent={ACCENT}
          variant="outline"
        />

        {/* Upload card */}
        <Box bg="white" borderRadius="2xl" boxShadow="md" borderTop="5px solid" borderTopColor={`${ACCENT}.400`} p={5} mb={8}>
          <Flex gap={3} align="center" wrap="wrap">
            <Input
              name='uploadedFile'
              type='file'
              onChange={(e) => { console.log(e.target.files[0]); setFile(e.target.files[0]) }}
              maxW="360px"
              pt="4px"
            />
            {file && chosenType && (
              <HStack spacing={2} bg={`${chosenType.color}.50`} px={3} py={1.5} borderRadius="lg">
                <Icon as={chosenType.icon} color={`${chosenType.color}.500`} />
                <Text fontSize="sm" noOfLines={1} maxW="220px">{file.name}</Text>
                <Badge colorScheme={chosenType.color}>{chosenType.label}</Badge>
              </HStack>
            )}
            <Button
              colorScheme={ACCENT}
              leftIcon={<FaUpload />}
              onClick={uploadFile}
              isLoading={uploading}
              loadingText="Uploading"
            >
              Upload
            </Button>
          </Flex>
        </Box>

        {/* Uploads grid */}
        <Text fontSize="lg" fontWeight="bold" color="gray.700" mb={4}>
          Your Uploads {!loading && <Badge colorScheme={ACCENT} ml={2} borderRadius="full" px={2}>{uploads.length}</Badge>}
        </Text>

        {loading ? (
          <CardGridSkeleton withImage count={3} />
        ) : uploads.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
            {uploads.map((upload, index) => {
              const type = fileTypeOf(upload);
              return (
                <Box
                  key={index}
                  bg="white"
                  borderRadius="2xl"
                  boxShadow="md"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{ transform: "translateY(-3px)", boxShadow: "lg" }}
                  border="1px solid"
                  borderColor={`${type.color}.100`}
                  borderTop="4px solid"
                  borderTopColor={`${type.color}.400`}
                >
                  {/* Preview */}
                  <Box position="relative" h="150px" bg={`${type.color}.50`}>
                    <Center h="150px" color={`${type.color}.400`} flexDirection="column" gap={2}>
                      <Icon as={type.icon} fontSize="40px" />
                      <Badge colorScheme={type.color}>{type.label}</Badge>
                    </Center>
                    {type.isImage && (
                      <img
                        src={upload}
                        alt={fileNameOf(upload)}
                        style={{
                          position: "absolute", top: 0, left: 0,
                          width: "100%", height: "150px",
                          objectFit: "cover", zIndex: 1,
                        }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                  </Box>

                  <Box p={4}>
                    <Flex justify="space-between" align="flex-start" gap={2} mb={3}>
                      <Text fontWeight="bold" fontSize="sm" noOfLines={2} title={fileNameOf(upload)}>
                        {fileNameOf(upload) || "Untitled file"}
                      </Text>
                      <Badge colorScheme={type.color} flexShrink={0}>{type.label}</Badge>
                    </Flex>

                    <Flex gap={2}>
                      <Tooltip label="Copy link" hasArrow>
                        <Button size="sm" colorScheme={ACCENT} flex="1" leftIcon={<FaCopy />} onClick={() => copyVariable(upload)}>
                          Copy
                        </Button>
                      </Tooltip>
                      <Tooltip label="Open in new tab" hasArrow>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme={ACCENT}
                          onClick={() => window.open(upload, "_blank", "noopener,noreferrer")}
                        >
                          <FaExternalLinkAlt />
                        </Button>
                      </Tooltip>
                      <Tooltip label="Delete" hasArrow>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => requestDelete(index)}>
                          <FaTrashAlt />
                        </Button>
                      </Tooltip>
                    </Flex>
                  </Box>
                </Box>
              );
            })}
          </SimpleGrid>
        ) : (
          <Center py={16} flexDirection="column" gap={3} bg="white" borderRadius="2xl" boxShadow="md" color="gray.400">
            <Icon as={FaCloudUploadAlt} fontSize="40px" />
            <Text>No uploads yet — choose a file above to get started.</Text>
          </Center>
        )}

        <DeleteModal
          isOpen={showDeleteConfirm}
          onCancel={() => { setShowDeleteConfirm(false); setDeleteIndex(null); }}
          onConfirm={confirmDelete}
          label="this file"
        />
      </Box>
    </div>
  )
}

export default fileUploads;
