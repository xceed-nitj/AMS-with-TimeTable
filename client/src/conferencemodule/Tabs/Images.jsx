
import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import {
  FormControl, FormLabel, Input, Button, Select, Box,
  Heading, Center, Container, Flex, useBreakpointValue
} from '@chakra-ui/react';

const LoadingIcon = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
);

const Images = () => {
  const params = useParams();
  const IdConf = params.confid;
  const apiUrl = getEnvironment();

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState(null);

  const initialData = {
    confId: IdConf,
    name: "",
    imgLink: "",
    feature: true,
    sequence: "",
  };

  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`${apiUrl}/conferencemodule/images/conference/${IdConf}`, {
      withCredentials: true
    })
      .then(res => setExistingImages(res.data))
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, [IdConf, apiUrl]);

  const handleAddNewImage = () => {
    const newImage = { ...initialData, isNew: true, tempId: Date.now() };
    setExistingImages([newImage, ...existingImages]);
  };

  const handleImageChange = (index, field, value) => {
    const updatedImages = [...existingImages];
    if (field === "sequence") {
      updatedImages[index][field] = parseInt(value);
    } else if (field === "feature") {
      updatedImages[index][field] = value === "true";
    } else {
      updatedImages[index][field] = value;
    }
    setExistingImages(updatedImages);
  };

  const handleSaveImage = (index) => {
    const imageData = existingImages[index];
    if (imageData.isNew) {
      const { isNew, tempId, ...dataToSend } = imageData;
      axios.post(`${apiUrl}/conferencemodule/images`, dataToSend, {
        withCredentials: true
      })
        .then(res => {
          const updatedImages = [...existingImages];
          updatedImages[index] = res.data;
          setExistingImages(updatedImages);
        })
        .catch(err => console.log(err));
    } else {
      axios.put(`${apiUrl}/conferencemodule/images/${imageData._id}`, imageData, {
        withCredentials: true
      }).catch(err => console.log(err));
    }
  };

  const handleDeleteClick = (index) => {
    setDeleteItemIndex(index);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    if (deleteItemIndex !== null) {
      const imageData = existingImages[deleteItemIndex];
      if (imageData.isNew) {
        const updatedImages = existingImages.filter((_, i) => i !== deleteItemIndex);
        setExistingImages(updatedImages);
      } else {
        axios.delete(`${apiUrl}/conferencemodule/images/${imageData._id}`, {
          withCredentials: true
        })
          .then(() => {
            const updatedImages = existingImages.filter((_, i) => i !== deleteItemIndex);
            setExistingImages(updatedImages);
          })
          .catch(err => console.log(err));
      }
    }
    setShowDeleteConfirmation(false);
    setDeleteItemIndex(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteItemIndex(null);
  };

  if (loading) {
    return (
      <main className='py-10 min-h-screen flex justify-center items-center'>
        <LoadingIcon />
      </main>
    );
  }

  return (
    <Flex direction="column" py={10} minH="100vh">
      <Flex direction={{ base: "column", md: "row" }}>
        {/* Sidebar */}
        {!isMobile && (
          <Box
            ml={4}
            mt={-4}
            width="15%"
            minWidth="180px"
            maxWidth="250px"
            bg="gray.100"
            p={4}
            borderRadius="none"
            boxShadow="md"
            height="70vh"
            position="sticky"
            top={0}
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            overflowY="auto"
          >
            <Heading as="h2" size="md" mb={4}>
              Add Items
            </Heading>
            <Button colorScheme="blue" onClick={handleAddNewImage} mb="4" width="100%" size="sm">
              Add New Image
            </Button>
            
            {/* Image Previews Section */}
            <Box width="100%" mt={4}>
              <Heading
                as="h3"
                size="sm"
                mb={4}
                textAlign="left"
                color="black"
                borderBottom="1px solid #CBD5E0"
                pb={2}
              >
                Image Previews
              </Heading>

              {existingImages.length === 0 ? (
                <Box p={4} textAlign="center" bg="gray.50" rounded="lg">
                  <Box mb={2} fontSize="2xl">🖼️</Box>
                  <Box fontSize="xs" color="gray.500">
                    Previews will appear here
                  </Box>
                </Box>
              ) : (
                existingImages.map((image, index) => (
                  <Box
                    key={`preview-${image._id || image.tempId}`}
                    mb={4}
                    p={3}
                    borderWidth="1px"
                    rounded="lg"
                    bg="white"
                    boxShadow="sm"
                  >
                    <Heading as="h4" size="xs" color="blue.600" mb={2}>
                      {image.name || `Image ${index + 1}`}
                    </Heading>

                    {image.imgLink ? (
                      <Box>
                        <Box
                          mb={2}
                          textAlign="center"
                          bg="gray.100"
                          rounded="lg"
                          p={2}
                          minH="100px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <img
                            src={image.imgLink}
                            alt={image.name || "Preview"}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "120px",
                              objectFit: "contain",
                              borderRadius: "4px",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            color="gray.400"
                            minH="100px"
                            display="none"
                          >
                            <Box mb={1} fontSize="lg">❌</Box>
                            <Box fontSize="xs">Failed to load</Box>
                          </Flex>
                        </Box>
                      </Box>
                    ) : (
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        py={4}
                        color="gray.400"
                        bg="gray.50"
                        rounded="lg"
                      >
                        <Box mb={1} fontSize="lg">🖼️</Box>
                        <Box fontSize="xs">No URL</Box>
                      </Flex>
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        )}

        {/* Main Content*/}
        <Box flex="1" px={4}>
          <Container maxW="full">
            <Box maxH="calc(100vh - 300px)" overflowY="auto" pr={4}>
              <Heading as="h1" size="xl" mb={4} color="gray.800" textAlign="center" style={{
                              color: "#14B8A6", 
                              textDecoration: "underline"
                          }}>
                Images
              </Heading>
              
              {existingImages.length === 0 ? (
                <Box p={12} textAlign="center" bg="gray.50" rounded="lg">
                  <Heading as="h3" size="md" color="gray.500" mb={4}>
                    No images yet
                  </Heading>
                  <Button colorScheme="blue" onClick={handleAddNewImage}>
                    Add Your First Image
                  </Button>
                </Box>
              ) : (
                existingImages.map((image, index) => (
                  <Box key={image._id || image.tempId} mb={6} p={6} borderWidth="1px" rounded="lg" bg="gray.50" boxShadow="md">
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading as="h3" size="md" color="blue.600">
                        Image {index + 1}
                      </Heading>
                      <Flex gap={2}>
                        <Button 
                          colorScheme="blue" 
                          size="sm"
                          onClick={() => handleSaveImage(index)}
                        >
                          {image.isNew ? "Save" : "Update"}
                        </Button>
                        <Button 
                          colorScheme="red" 
                          size="sm"
                          onClick={() => handleDeleteClick(index)}
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Flex>

                    <FormControl isRequired mb={3}>
                      <FormLabel fontSize="sm" fontWeight="medium">Name *</FormLabel>
                      <Input
                        type="text"
                        value={image.name || ""}
                        onChange={(e) => handleImageChange(index, 'name', e.target.value)}
                        placeholder="Enter image name"
                      />
                    </FormControl>

                    <FormControl isRequired mb={3}>
                      <FormLabel fontSize="sm" fontWeight="medium">Image Link *</FormLabel>
                      <Input
                        type="url"
                        value={image.imgLink || ""}
                        onChange={(e) => handleImageChange(index, 'imgLink', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </FormControl>

                    <FormControl mb={3}>
                      <FormLabel fontSize="sm" fontWeight="medium">Sequence</FormLabel>
                      <Input
                        type="number"
                        value={image.sequence || ""}
                        onChange={(e) => handleImageChange(index, 'sequence', e.target.value)}
                        placeholder="Display order"
                      />
                    </FormControl>

                    <FormControl mb={4}>
                      <FormLabel fontSize="sm" fontWeight="medium">Featured</FormLabel>
                      <Select
                        value={image.feature?.toString()}
                        onChange={(e) => handleImageChange(index, 'feature', e.target.value)}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </Select>
                    </FormControl>

                    {/* Mobile Image Preview */}
                    {isMobile && (
                      <Box mt={4} p={4} bg="gray.100" rounded="lg">
                        <Heading as="h4" size="sm" mb={3} color="gray.700">
                          Preview
                        </Heading>
                        {image.imgLink ? (
                          <Box>
                            <Box mb={3} textAlign="center" bg="white" rounded="lg" p={3} minH="150px" display="flex" alignItems="center" justifyContent="center">
                              <img
                                src={image.imgLink}
                                alt={image.name || "Preview"}
                                style={{ 
                                  maxWidth: "100%", 
                                  maxHeight: "200px", 
                                  objectFit: "contain", 
                                  borderRadius: "6px",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)" 
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <Flex 
                                direction="column" 
                                align="center" 
                                justify="center" 
                                color="gray.400" 
                                minH="150px"
                                display="none"
                              >
                                <Box mb={2} fontSize="2xl">❌</Box>
                                <Box fontSize="xs">Failed to load</Box>
                              </Flex>
                            </Box>
                          </Box>
                        ) : (
                          <Flex direction="column" align="center" justify="center" py={8} color="gray.400" bg="white" rounded="lg">
                            <Box mb={2} fontSize="2xl">🖼️</Box>
                            <Box fontSize="xs">No image URL provided</Box>
                          </Flex>
                        )}
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Box>

            {isMobile && (
              <Center mt={8}>
                <Button colorScheme="blue" onClick={handleAddNewImage}>
                  Add New Image
                </Button>
              </Center>
            )}
          </Container>
        </Box>
      </Flex>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
            <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
              Are you sure you want to delete this image?
            </p>
            <div className="tw-flex tw-justify-center tw-gap-4">
              <Button
                colorScheme="red"
                onClick={confirmDelete}
              >
                Yes, Delete
              </Button>
              <Button
                colorScheme="blue"
                onClick={cancelDelete}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Flex>
  );
};

export default Images;