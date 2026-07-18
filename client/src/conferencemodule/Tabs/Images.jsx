import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import LoadingIcon from "../components/LoadingIcon";
import {
    FormControl, FormLabel, Input, Button, Select, Badge, Center,
    Box, Flex, Text, SimpleGrid, HStack, Icon, Tooltip, Image, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import {
    FaImages, FaPlus, FaSave, FaEdit, FaTrashAlt, FaStar, FaHashtag, FaUpload, FaImage,
} from "react-icons/fa";
import {
    PageShell, PageHeader, FieldGrid, Span2, DeleteModal, CardGridSkeleton,
} from "../components/ui";

const ACCENT = "teal";

const Images = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();
    const toast = useToast();

    const initialData = {
        confId: IdConf,
        name: "",
        imgLink: "",
        feature: true,
        sequence: "",
    };

    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState(null);
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const { name, imgLink, sequence } = formData;

    // Older records may store a server-relative path (e.g. /uploads/...):
    // resolve those against the API server, not the frontend origin.
    const resolveImgSrc = (link) => {
        if (!link) return "";
        if (/^https?:\/\//i.test(link)) return link;
        return `${apiUrl}${link.startsWith("/") ? "" : "/"}${link}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({ ...formData, [name]: parseInt(value) });
        } else if (name === "feature") {
            setFormData({ ...formData, [name]: value === "true" });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Uploads the chosen image via the shared file-upload backend and stores
    // the returned link in the existing imgLink field — no new backend fields.
    const handleImageUpload = async () => {
        if (!imageFile) {
            toast({ title: "No image selected", status: "error", duration: 2000, isClosable: true });
            return;
        }
        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        uploadData.append("url", window.location.origin);
        try {
            const response = await fetch(`${apiUrl}/user/getUser/upload`, {
                method: "POST",
                body: uploadData,
                credentials: "include",
            });
            if (response.ok) {
                const result = await response.json();
                setFormData((prev) => ({ ...prev, imgLink: result.link }));
                setImageFile(null);
                toast({ title: "Image uploaded", description: "The image link has been filled in.", status: "success", duration: 2000, isClosable: true });
            } else {
                toast({ title: "Image upload failed", status: "error", duration: 2000, isClosable: true });
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({ title: "Image upload failed", status: "error", duration: 2000, isClosable: true });
        } finally {
            setUploadingImage(false);
        }
    };

    const openAddModal = () => {
        setFormData(initialData);
        setEditID(null);
        setImageFile(null);
        setIsFormOpen(true);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
        setFormData(initialData);
        setEditID(null);
        setImageFile(null);
    };

    const handleSubmit = () => {
        axios.post(`${apiUrl}/conferencemodule/images`, formData, {
            withCredentials: true
        })
            .then(() => {
                setFormData(initialData);
                setIsFormOpen(false);
                setRefresh(r => r + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/images/${editID}`, formData, {
            withCredentials: true
        })
            .then(() => {
                setFormData(initialData);
                setEditID(null);
                setIsFormOpen(false);
                setRefresh(r => r + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (item) => {
        setFormData({
            confId: item.confId || IdConf,
            name: item.name || "",
            imgLink: item.imgLink || "",
            feature: item.feature !== undefined ? item.feature : true,
            sequence: item.sequence ?? "",
        });
        setEditID(item._id);
        setIsFormOpen(true);
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/images/${deleteItemId}`, {
            withCredentials: true
        })
            .then(() => {
                setShowDeleteConfirmation(false);
                setRefresh(r => r + 1);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/images/conference/${IdConf}`, {
            withCredentials: true
        })
            .then(res => setData(res.data))
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh, IdConf, apiUrl]);

    // Cards are arranged by the order (sequence) value.
    const sortedData = [...data].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    return (
        <PageShell>
            <PageHeader
                icon={FaImages}
                title="Images"
                subtitle="Gallery and banner images shown on the conference site."
                accent={ACCENT}
                variant="outline"
            >
                <Button colorScheme={ACCENT} leftIcon={<FaPlus />} onClick={openAddModal}>
                    Add Image
                </Button>
            </PageHeader>

            {!loading ? (
                sortedData.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
                        {sortedData.map((item) => (
                            <Box
                                key={item._id}
                                bg="white"
                                borderRadius="2xl"
                                boxShadow="md"
                                overflow="hidden"
                                transition="all 0.2s"
                                _hover={{ transform: "translateY(-3px)", boxShadow: "lg" }}
                                border="1px solid"
                                borderColor={`${ACCENT}.100`}
                                borderTop="4px solid"
                                borderTopColor={`${ACCENT}.400`}
                            >
                                {/* Image preview */}
                                <Box position="relative" h="170px" bg={`${ACCENT}.50`}>
                                    <Center h="170px" color={`${ACCENT}.300`} flexDirection="column" gap={2}>
                                        <Icon as={FaImage} fontSize="34px" />
                                        <Text fontSize="xs">No preview</Text>
                                    </Center>
                                    {item.imgLink && (
                                        <img
                                            src={resolveImgSrc(item.imgLink)}
                                            alt={item.name}
                                            style={{
                                                position: "absolute", top: 0, left: 0,
                                                width: "100%", height: "170px",
                                                objectFit: "cover", zIndex: 1,
                                            }}
                                            onError={(e) => { e.target.style.display = "none"; }}
                                        />
                                    )}
                                </Box>

                                <Box p={4}>
                                    <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
                                        <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                                            {item.name || "Untitled image"}
                                        </Text>
                                        <Tooltip label="Order value" hasArrow>
                                            <Badge
                                                colorScheme={ACCENT}
                                                borderRadius="full"
                                                px={2.5} py={1}
                                                display="inline-flex"
                                                alignItems="center"
                                                gap={1}
                                                flexShrink={0}
                                            >
                                                <Icon as={FaHashtag} boxSize="9px" />{item.sequence ?? "—"}
                                            </Badge>
                                        </Tooltip>
                                    </Flex>

                                    <HStack spacing={1.5} mb={4} flexWrap="wrap">
                                        {item.feature ? (
                                            <Badge colorScheme="purple" fontSize="0.65em" display="inline-flex" alignItems="center" gap={1}>
                                                <Icon as={FaStar} boxSize="9px" /> Featured
                                            </Badge>
                                        ) : (
                                            <Badge colorScheme="gray" fontSize="0.65em">Not featured</Badge>
                                        )}
                                    </HStack>

                                    <Flex gap={2}>
                                        <Button
                                            size="sm"
                                            colorScheme="teal"
                                            flex="1"
                                            leftIcon={<FaEdit />}
                                            onClick={() => handleEdit(item)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            colorScheme="red"
                                            variant="outline"
                                            flex="1"
                                            leftIcon={<FaTrashAlt />}
                                            onClick={() => handleDelete(item._id)}
                                        >
                                            Delete
                                        </Button>
                                    </Flex>
                                </Box>
                            </Box>
                        ))}
                    </SimpleGrid>
                ) : (
                    <Center py={16} flexDirection="column" gap={3} bg="white" borderRadius="2xl" boxShadow="md" color="gray.400">
                        <Icon as={FaImages} fontSize="36px" />
                        <Text>No images yet.</Text>
                        <Button colorScheme={ACCENT} leftIcon={<FaPlus />} onClick={openAddModal}>
                            Add your first image
                        </Button>
                    </Center>
                )
            ) : <CardGridSkeleton withImage />}

            {/* Add / Edit modal */}
            <Modal isOpen={isFormOpen} onClose={closeFormModal} size="2xl" scrollBehavior="inside">
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
                <ModalContent borderRadius="2xl" overflow="hidden" mt="90px" mb="6" maxH="calc(100vh - 120px)">
                    <ModalHeader
                        color={`${ACCENT}.700`}
                        bg="white"
                        borderBottom="3px solid"
                        borderBottomColor={`${ACCENT}.400`}
                        display="flex"
                        alignItems="center"
                        gap={3}
                    >
                        <Icon as={FaImages} color={`${ACCENT}.500`} />
                        {editID ? 'Update Image' : 'Add a New Image'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={5}>
                        <FieldGrid>
                            <FormControl isRequired>
                                <FormLabel>Name:</FormLabel>
                                <Input
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={handleChange}
                                    placeholder="Enter image name"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Order (Sequence):</FormLabel>
                                <Input
                                    type="number"
                                    name="sequence"
                                    value={sequence}
                                    onChange={handleChange}
                                    placeholder="Display order"
                                    mb='2.5'
                                />
                            </FormControl>
                            <Span2>
                                <FormControl isRequired>
                                    <FormLabel>Image :</FormLabel>
                                    <Flex gap={3} align="flex-start" wrap="wrap">
                                        <Box flex="1" minW="240px">
                                            <HStack mb={2}>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setImageFile(e.target.files[0])}
                                                    pt="4px"
                                                />
                                                <Button
                                                    colorScheme={ACCENT}
                                                    leftIcon={<FaUpload />}
                                                    onClick={handleImageUpload}
                                                    isLoading={uploadingImage}
                                                    loadingText="Uploading"
                                                    flexShrink={0}
                                                >
                                                    Upload
                                                </Button>
                                            </HStack>
                                            <Input
                                                type="text"
                                                name="imgLink"
                                                value={imgLink}
                                                onChange={handleChange}
                                                placeholder="…or paste an image link directly"
                                            />
                                        </Box>
                                        {imgLink && (
                                            <Image
                                                src={resolveImgSrc(imgLink)}
                                                alt="Image preview"
                                                boxSize="84px"
                                                borderRadius="xl"
                                                objectFit="cover"
                                                border="1px solid"
                                                borderColor="gray.200"
                                                fallback={
                                                    <Center boxSize="84px" borderRadius="xl" bg="gray.50" color="gray.400" border="1px solid" borderColor="gray.200">
                                                        <Icon as={FaImage} fontSize="28px" />
                                                    </Center>
                                                }
                                            />
                                        )}
                                    </Flex>
                                </FormControl>
                            </Span2>
                            <FormControl>
                                <FormLabel>Featured:</FormLabel>
                                <Select
                                    name="feature"
                                    value={formData.feature?.toString()}
                                    onChange={handleChange}
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </Select>
                            </FormControl>
                        </FieldGrid>
                    </ModalBody>
                    <ModalFooter bg="gray.50" gap={3}>
                        <Button variant="ghost" onClick={closeFormModal}>Cancel</Button>
                        <Button
                            colorScheme={ACCENT}
                            px={8}
                            leftIcon={editID ? <FaSave /> : <FaPlus />}
                            onClick={() => { editID ? handleUpdate() : handleSubmit() }}
                        >
                            {editID ? 'Update' : 'Add'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <DeleteModal
                isOpen={showDeleteConfirmation}
                onCancel={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                label="this image"
            />
        </PageShell>
    );
};

export default Images;
