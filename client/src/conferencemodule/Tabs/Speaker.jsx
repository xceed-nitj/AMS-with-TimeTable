import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button, Select, Badge, Center,
    Box, Flex, Text, SimpleGrid, HStack, Icon, Tooltip, Image, Link, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import JoditEditor from "../components/RichTextEditor";
import {
    FaMicrophone, FaPlus, FaSave, FaEdit, FaTrashAlt, FaStar, FaHashtag,
    FaUniversity, FaUserTie, FaExternalLinkAlt, FaUser, FaUpload,
} from "react-icons/fa";
import {
    PageShell, PageHeader, FieldGrid, Span2, DeleteModal, CardGridSkeleton,
} from "../components/ui";

const ACCENT = "green";

const Speaker = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const apiUrl = getEnvironment();
    const bioRef = useRef(null);
    const abstractRef = useRef(null);

    const initialData = {
        "ConfId": IdConf,
        "Name": "",
        "Designation": "",
        "Institute": "",
        "ProfileLink": "",
        "ImgLink": "",
        "TalkType": "",
        "TalkTitle": "",
        "Abstract": "",
        "Bio": "",
        "sequence": "",
        "feature": true
    };

    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    // Jodit editors are mounted only after the modal has finished opening —
    // initializing them mid-transition inside the portal can crash the modal.
    const [editorsReady, setEditorsReady] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (isFormOpen) {
            const timer = setTimeout(() => setEditorsReady(true), 200);
            return () => clearTimeout(timer);
        }
        setEditorsReady(false);
    }, [isFormOpen]);

    const { ConfId, Name, Designation, Institute, ProfileLink, ImgLink, TalkType, TalkTitle, Abstract, Bio, sequence, feature } = formData;

    // Older records may store a server-relative path (e.g. /uploads/...):
    // resolve those against the API server, not the frontend origin.
    const resolveImgSrc = (link) => {
        if (!link) return "";
        if (/^https?:\/\//i.test(link)) return link;
        return `${apiUrl}${link.startsWith("/") ? "" : "/"}${link}`;
    };

    // Uploads the chosen image via the shared file-upload backend and stores
    // the returned link in the existing ImgLink field — no new backend fields.
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
                setFormData((prev) => ({ ...prev, ImgLink: result.link }));
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "feature") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        }
        else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleEditorChange = (value, fieldName) => {
        setFormData({
            ...formData,
            [fieldName]: value,
        });
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

    const handleSubmit = (e) => {
        axios.post(`${apiUrl}/conferencemodule/speakers`, formData, {
            withCredentials: true
        })
            .then(() => {
                // Refetch the list so the new speaker card appears immediately.
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
        axios.put(`${apiUrl}/conferencemodule/speakers/${editID}`, formData, {
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

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/speakers/${deleteItemId}`, {
            withCredentials: true
        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setShowDeleteConfirmation(false);
                setFormData(initialData);
                setRefresh(r => r + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/speakers/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
                setEditID(editIDNotState);
                setIsFormOpen(true);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true)
        axios.get(`${apiUrl}/conferencemodule/speakers/conference/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    }, [refresh]);

    // Cards are arranged by the order (sequence) value.
    const sortedData = [...data].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    return (
        <PageShell>
            <PageHeader
                icon={FaMicrophone}
                title="Speakers"
                subtitle="Manage keynote and invited speakers shown on the conference site."
                accent={ACCENT}
                variant="outline"
            >
                <Button
                    colorScheme={ACCENT}
                    leftIcon={<FaPlus />}
                    onClick={openAddModal}
                >
                    Add Speaker
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
                                <Box p={4}>
                                    <Flex gap={3} mb={3} align="flex-start">
                                        {/* Photo preview when available */}
                                        <Box position="relative" boxSize="64px" flexShrink={0}>
                                            {item.ImgLink && (
                                                <img
                                                    src={resolveImgSrc(item.ImgLink)}
                                                    alt={item.Name}
                                                    style={{
                                                        width: "64px", height: "64px",
                                                        objectFit: "cover", borderRadius: "12px",
                                                        position: "relative", zIndex: 1,
                                                    }}
                                                    onError={(e) => { e.target.style.display = "none"; }}
                                                />
                                            )}
                                            <Center
                                                boxSize="64px"
                                                borderRadius="xl"
                                                bg={`${ACCENT}.50`}
                                                color={`${ACCENT}.400`}
                                                position="absolute"
                                                top={0} left={0}
                                            >
                                                <Icon as={FaUser} fontSize="24px" />
                                            </Center>
                                        </Box>

                                        <Box flex="1" minW={0}>
                                            <Flex justify="space-between" align="flex-start" gap={2}>
                                                <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                                                    {item.Name}
                                                    {item.ProfileLink && (
                                                        <Link href={item.ProfileLink} isExternal ml={2} color={`${ACCENT}.500`}>
                                                            <Icon as={FaExternalLinkAlt} boxSize="11px" />
                                                        </Link>
                                                    )}
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
                                            {item.Designation && (
                                                <HStack spacing={1.5} mt={1}>
                                                    <Icon as={FaUserTie} color="gray.400" boxSize="11px" />
                                                    <Text fontSize="xs" color="gray.600" noOfLines={1}>{item.Designation}</Text>
                                                </HStack>
                                            )}
                                            {item.Institute && (
                                                <HStack spacing={1.5} mt={0.5}>
                                                    <Icon as={FaUniversity} color="gray.400" boxSize="11px" />
                                                    <Text fontSize="xs" color="gray.600" noOfLines={1}>{item.Institute}</Text>
                                                </HStack>
                                            )}
                                        </Box>
                                    </Flex>

                                    {/* Talk info + status badges, compact */}
                                    <HStack spacing={1.5} mb={item.TalkTitle ? 1.5 : 4} flexWrap="wrap">
                                        {item.TalkType && <Badge colorScheme="blue" fontSize="0.65em">{item.TalkType}</Badge>}
                                        {item.feature && (
                                            <Badge colorScheme="purple" fontSize="0.65em" display="inline-flex" alignItems="center" gap={1}>
                                                <Icon as={FaStar} boxSize="9px" /> Featured
                                            </Badge>
                                        )}
                                    </HStack>
                                    {item.TalkTitle && (
                                        <Text fontSize="xs" color="gray.500" fontStyle="italic" noOfLines={2} mb={4}>
                                            "{item.TalkTitle}"
                                        </Text>
                                    )}

                                    <Flex gap={2}>
                                        <Button
                                            size="sm"
                                            colorScheme="teal"
                                            flex="1"
                                            leftIcon={<FaEdit />}
                                            onClick={() => handleEdit(item._id)}
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
                        <Icon as={FaMicrophone} fontSize="36px" />
                        <Text>No speakers yet.</Text>
                        <Button colorScheme={ACCENT} leftIcon={<FaPlus />} onClick={openAddModal}>
                            Add your first speaker
                        </Button>
                    </Center>
                )
            ) : <CardGridSkeleton />}

            {/* Add / Edit modal */}
            {/* trapFocus must stay off — Chakra's focus trap fights the Jodit editors. */}
            <Modal
                isOpen={isFormOpen}
                onClose={closeFormModal}
                size="3xl"
                scrollBehavior="inside"
                trapFocus={false}
                returnFocusOnClose={false}
            >
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
                        <Icon as={FaMicrophone} color={`${ACCENT}.500`} />
                        {editID ? 'Update Speaker' : 'Add a New Speaker'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={5}>
                        <FieldGrid>
                            <FormControl isRequired={true} mb='3'>
                                <FormLabel>Name of the Speaker :</FormLabel>
                                <Input
                                    type="text"
                                    name="Name"
                                    value={Name}
                                    onChange={handleChange}
                                    placeholder="Name"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Designation:</FormLabel>
                                <Input
                                    type="text"
                                    name="Designation"
                                    value={Designation}
                                    onChange={handleChange}
                                    placeholder="Designation"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl isRequired={true} mb='3'>
                                <FormLabel>Institute of the Speaker :</FormLabel>
                                <Input
                                    type="text"
                                    name="Institute"
                                    value={Institute}
                                    onChange={handleChange}
                                    placeholder="Institute"
                                    mb='2.5'
                                />
                            </FormControl>
                            <Span2>
                                <FormControl isRequired={true} mb='3'>
                                    <FormLabel>Speaker Image :</FormLabel>
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
                                                name="ImgLink"
                                                value={ImgLink}
                                                onChange={handleChange}
                                                placeholder="…or paste an image link directly"
                                            />
                                        </Box>
                                        {ImgLink && (
                                            <Image
                                                src={resolveImgSrc(ImgLink)}
                                                alt="Speaker preview"
                                                boxSize="84px"
                                                borderRadius="xl"
                                                objectFit="cover"
                                                border="1px solid"
                                                borderColor="gray.200"
                                                fallback={
                                                    <Center boxSize="84px" borderRadius="xl" bg="gray.50" color="gray.400" border="1px solid" borderColor="gray.200">
                                                        <Icon as={FaUser} fontSize="28px" />
                                                    </Center>
                                                }
                                            />
                                        )}
                                    </Flex>
                                </FormControl>
                            </Span2>
                            <FormControl isRequired={true}>
                                <FormLabel>Order (Sequence) :</FormLabel>
                                <Input
                                    type="number"
                                    name="sequence"
                                    value={sequence}
                                    onChange={handleChange}
                                    placeholder="sequence"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl mb='3'>
                                <FormLabel>Profile Link of the Speaker :</FormLabel>
                                <Input
                                    type="text"
                                    name="ProfileLink"
                                    value={ProfileLink}
                                    onChange={handleChange}
                                    placeholder="Profile Link"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Talk Type:</FormLabel>
                                <Input
                                    type="text"
                                    name="TalkType"
                                    value={TalkType}
                                    onChange={handleChange}
                                    placeholder="TalkType"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Talk Title :</FormLabel>
                                <Input
                                    type="text"
                                    name="TalkTitle"
                                    value={TalkTitle}
                                    onChange={handleChange}
                                    placeholder="Talk Title"
                                    mb='2.5'
                                />
                            </FormControl>
                            <Span2>
                                <FormControl>
                                    <FormLabel>Bio of the Speaker :</FormLabel>
                                    {editorsReady ? (
                                        <JoditEditor
                                            ref={bioRef}
                                            value={Bio}
                                            name="Bio"
                                            onBlur={(value) => handleEditorChange(value, "Bio")}
                                            classname='tw-mb-5'
                                        />
                                    ) : (
                                        <Center h="120px" bg="gray.50" borderRadius="md" color="gray.400" fontSize="sm">
                                            Loading editor…
                                        </Center>
                                    )}
                                </FormControl>
                            </Span2>
                            <Span2>
                                <FormControl>
                                    <FormLabel>Abstract :</FormLabel>
                                    {editorsReady ? (
                                        <JoditEditor
                                            ref={abstractRef}
                                            value={Abstract}
                                            name="Abstract"
                                            onBlur={(value) => handleEditorChange(value, "Abstract")}
                                            classname='tw-mb-5'
                                        />
                                    ) : (
                                        <Center h="120px" bg="gray.50" borderRadius="md" color="gray.400" fontSize="sm">
                                            Loading editor…
                                        </Center>
                                    )}
                                </FormControl>
                            </Span2>
                            <FormControl isRequired={true} mb='3'>
                                <FormLabel>Feature:</FormLabel>
                                <Select
                                    name="feature"
                                    value={formData.feature}
                                    onChange={handleChange}
                                >
                                    <option value={true}>Yes</option>
                                    <option value={false}>No</option>
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
                label="this speaker"
            />
        </PageShell>
    );
};

export default Speaker;
