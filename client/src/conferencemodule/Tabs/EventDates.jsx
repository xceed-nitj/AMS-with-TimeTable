import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button, Select, Badge, Center,
    Box, Flex, Text, SimpleGrid, HStack, Icon, Tooltip,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
} from '@chakra-ui/react';
import { FaCalendarAlt, FaPlus, FaSave, FaEdit, FaTrashAlt, FaCheckCircle, FaStar, FaHashtag } from "react-icons/fa";
import {
    PageShell, PageHeader, FieldGrid, DeleteModal, accentGradient,
} from "../components/ui";

const ACCENT = "orange";

const formatCardDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const EventDates = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const apiUrl = getEnvironment();

    const initialData = {
        "confId": IdConf,
        "title": "",
        "date": "",
        "sequence": "",
        "extended": false,
        "newDate": null,
        "completed": false,
        "featured": true
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { title, date, newDate, sequence } = formData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "featured") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        }
        else if (name === "completed") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        }
        else if (name === "extended") {
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

    const openAddModal = () => {
        setFormData(initialData);
        setEditID("");
        setIsFormOpen(true);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
        setFormData(initialData);
        setEditID("");
    };

    const handleSubmit = (e) => {
        axios.post(`${apiUrl}/conferencemodule/eventDates`, formData, {
            withCredentials: true
        })
            .then(() => {
                // The POST response is only a status message, so refetch the
                // list to show the newly created entry.
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
        axios.put(`${apiUrl}/conferencemodule/eventDates/${editID}`, formData, {
            withCredentials: true
        })
            .then(() => {
                setFormData(initialData);
                setEditID(null);
                setIsFormOpen(false);
                setRefresh(r => r + 1);
            })
            .catch(err => console.log(formData, err));
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/eventDates/${deleteItemId}`, {
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
        axios.get(`${apiUrl}/conferencemodule/eventDates/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                const parsedData = {
                    ...res.data,
                    date: new Date(res.data.date).toLocaleDateString('en-CA'),
                    newDate: res.data.newDate ? new Date(res.data.newDate).toLocaleDateString('en-CA') : "",
                    sequence: res.data.sequence ? res.data.sequence : "",
                }
                setFormData(parsedData);
                setEditID(editIDNotState);
                setIsFormOpen(true);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/eventDates/conference/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    // Cards are arranged by the order (sequence) value.
    const sortedData = [...data].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    return (
        <PageShell>
            <PageHeader
                icon={FaCalendarAlt}
                title="Event Dates"
                subtitle="Important dates and deadlines — submissions, notifications, registration."
                accent={ACCENT}
                variant="outline"
            >
                <Button
                    colorScheme={ACCENT}
                    leftIcon={<FaPlus />}
                    onClick={openAddModal}
                >
                    Add Event Date
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
                                opacity={item.completed ? 0.75 : 1}
                            >
                                <Box h="5px" style={{ background: accentGradient(ACCENT) }} />
                                <Box p={4}>
                                    <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
                                        <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                                            {item.title}
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

                                    {/* Dates — original struck through when extended */}
                                    <HStack spacing={2} mb={3} flexWrap="wrap">
                                        <Icon as={FaCalendarAlt} color={`${ACCENT}.500`} boxSize="14px" />
                                        <Text
                                            fontSize="sm"
                                            color={item.extended && item.newDate ? "gray.400" : "gray.700"}
                                            textDecoration={item.extended && item.newDate ? "line-through" : "none"}
                                            fontWeight="medium"
                                        >
                                            {formatCardDate(item.date)}
                                        </Text>
                                        {item.extended && item.newDate && (
                                            <Text fontSize="sm" fontWeight="bold" color={`${ACCENT}.600`}>
                                                → {formatCardDate(item.newDate)}
                                            </Text>
                                        )}
                                    </HStack>

                                    {/* Compact status row */}
                                    <HStack spacing={1.5} mb={4} flexWrap="wrap">
                                        {item.extended && <Badge colorScheme="orange" fontSize="0.65em">Extended</Badge>}
                                        {item.completed && (
                                            <Badge colorScheme="green" fontSize="0.65em" display="inline-flex" alignItems="center" gap={1}>
                                                <Icon as={FaCheckCircle} boxSize="9px" /> Completed
                                            </Badge>
                                        )}
                                        {item.featured && (
                                            <Badge colorScheme="purple" fontSize="0.65em" display="inline-flex" alignItems="center" gap={1}>
                                                <Icon as={FaStar} boxSize="9px" /> Featured
                                            </Badge>
                                        )}
                                        {!item.extended && !item.completed && !item.featured && (
                                            <Badge colorScheme="gray" fontSize="0.65em">Upcoming</Badge>
                                        )}
                                    </HStack>

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
                        <Icon as={FaCalendarAlt} fontSize="36px" />
                        <Text>No event dates yet.</Text>
                        <Button colorScheme={ACCENT} leftIcon={<FaPlus />} onClick={openAddModal}>
                            Add your first event date
                        </Button>
                    </Center>
                )
            ) : <Center py={10}><LoadingIcon /></Center>}

            {/* Add / Edit modal */}
            <Modal isOpen={isFormOpen} onClose={closeFormModal} size="2xl" isCentered scrollBehavior="inside">
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
                <ModalContent borderRadius="2xl" overflow="hidden">
                    <ModalHeader
                        color={`${ACCENT}.700`}
                        bg="white"
                        borderBottom="3px solid"
                        borderBottomColor={`${ACCENT}.400`}
                        display="flex"
                        alignItems="center"
                        gap={3}
                    >
                        <Icon as={FaCalendarAlt} color={`${ACCENT}.500`} />
                        {editID ? 'Edit Event-Date' : 'Add a New Event-Date'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={5}>
                        <FieldGrid>
                            <FormControl isRequired={true}>
                                <FormLabel>Title:</FormLabel>
                                <Input
                                    type="text"
                                    name="title"
                                    value={title}
                                    onChange={handleChange}
                                    placeholder="Title"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Date:</FormLabel>
                                <Input
                                    type="date"
                                    name="date"
                                    value={date}
                                    onChange={handleChange}
                                    placeholder="Date"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl isRequired={true}>
                                <FormLabel>Order (Sequence):</FormLabel>
                                <Input
                                    type="number"
                                    name="sequence"
                                    value={sequence}
                                    onChange={handleChange}
                                    placeholder="sequence"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl isRequired={true} mb='3'>
                                <FormLabel>Is Date Extended:</FormLabel>
                                <Select
                                    name="extended"
                                    value={formData.extended}
                                    onChange={handleChange}
                                >
                                    <option value={true}>Yes</option>
                                    <option value={false}>No</option>
                                </Select>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>New Date:</FormLabel>
                                <Input
                                    type="date"
                                    name="newDate"
                                    value={newDate}
                                    onChange={handleChange}
                                    placeholder="New Date if Extended"
                                    mb='2.5'
                                />
                            </FormControl>
                            <FormControl isRequired={true} mb='3'>
                                <FormLabel>Completed:</FormLabel>
                                <Select
                                    name="completed"
                                    value={formData.completed}
                                    onChange={handleChange}
                                >
                                    <option value={true}>Yes</option>
                                    <option value={false}>No</option>
                                </Select>
                            </FormControl>
                            <FormControl isRequired={true} mb='3'>
                                <FormLabel>Featured:</FormLabel>
                                <Select
                                    name="featured"
                                    value={formData.featured}
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
                label="this event date"
            />
        </PageShell>
    );
};

export default EventDates;
