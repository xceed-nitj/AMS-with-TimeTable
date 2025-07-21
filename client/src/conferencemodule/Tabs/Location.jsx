
import React, { useState, useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import QuillBetterTable from "quill-better-table";
import "quill-better-table/dist/quill-better-table.css";

import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import {
    FormControl, FormLabel, Center, Heading,
    Input, Button, Select, Box, HStack, VStack, Text, Textarea, useToast
} from '@chakra-ui/react';
import { CustomTh } from '../utils/customStyles'
import {
    Table,
    TableContainer,
    Tbody,
    Td,
    Thead,
    Tr,
} from "@chakra-ui/table";

const Location = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const apiUrl = getEnvironment();
    const toast = useToast();

    const [showHtml, setShowHtml] = useState(false);
    const [htmlContent, setHtmlContent] = useState("");
    const [editableHtmlContent, setEditableHtmlContent] = useState("");

    const initialData = {
        confId: IdConf,
        description: "",
        address: "",
        latitude: "",
        longitude: "",
        feature: true,
        sequence: ""
    }
    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState(null);
    const [data, setData] = useState({});
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const editorRef = useRef(null);
    const quillInstance = useRef(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
                if (res.data && Object.keys(res.data).length > 0) {
                    setEditID(res.data._id);
                }
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh, IdConf, apiUrl]);

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            setFormData({
                confId: IdConf,
                description: data.description || "",
                address: data.address || "",
                latitude: data.latitude || "",
                longitude: data.longitude || "",
                feature: typeof data.feature === 'boolean' ? data.feature : true,
                sequence: data.sequence || ""
            });
            if (quillInstance.current) {
                quillInstance.current.root.innerHTML = data.description || "";
            }
            setHtmlContent(data.description || "");
            setEditableHtmlContent(data.description || "");
            setEditID(data._id);
        } else {
            setFormData(initialData);
            if (quillInstance.current) {
                quillInstance.current.root.innerHTML = "";
            }
            setHtmlContent("");
            setEditableHtmlContent("");
            setEditID(null);
        }
    }, [data, IdConf]);

    useEffect(() => {
        if (quillInstance.current) return; 

        Quill.register({
            "modules/better-table": QuillBetterTable,
        });

        const modules = {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ script: "sub" }, { script: "super" }],
                ["blockquote", "code-block"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ indent: "-1" }, { indent: "+1" }],
                [{ align: [] }],
                ["link", "image", "video"],
                ["clean"],
            ],
            clipboard: {
                matchVisual: false,
            },
            "better-table": {
                operationMenu: {
                    items: {
                        insertColumnRight: { text: "Insert Column Right" },
                        insertColumnLeft: { text: "Insert Column Left" },
                        insertRowUp: { text: "Insert Row Above" },
                        insertRowDown: { text: "Insert Row Below" },
                        mergeCells: { text: "Merge Cells" },
                        unmergeCells: { text: "Unmerge Cells" },
                        deleteColumn: { text: "Delete Column" },
                        deleteRow: { text: "Delete Row" },
                        deleteTable: { text: "Delete Table" },
                    },
                },
            },
            keyboard: {
                bindings: QuillBetterTable.keyboardBindings,
            },
        };

        quillInstance.current = new Quill(editorRef.current, {
            theme: "snow",
            modules,
            placeholder: "Start writing here...",
        });

        if (formData.description) {
            quillInstance.current.root.innerHTML = formData.description;
        }

        quillInstance.current.on("text-change", () => {
            const html = quillInstance.current.root.innerHTML;
            setFormData((prev) => ({
                ...prev,
                description: html
            }));
            setHtmlContent(html);
            setEditableHtmlContent(html);
        });
    }, []);

    useEffect(() => {
        if (quillInstance.current && formData.description !== quillInstance.current.root.innerHTML) {
            quillInstance.current.root.innerHTML = formData.description || '';
        }
    }, [editID]);

    const insertTable = () => {
        const tableModule = quillInstance.current.getModule("better-table");
        tableModule.insertTable(3, 3);
    };

    const toggleHtmlView = () => {
        if (quillInstance.current) {
            const html = quillInstance.current.root.innerHTML;
            setHtmlContent(html);
            setEditableHtmlContent(html);
        }
        setShowHtml(!showHtml);
    };

    const handleHtmlContentChange = (e) => {
        const newHtmlContent = e.target.value;
        setEditableHtmlContent(newHtmlContent);
    };

    const applyHtmlChanges = () => {
        if (quillInstance.current) {
            try {
                quillInstance.current.root.innerHTML = editableHtmlContent;
                
                setFormData(prev => ({
                    ...prev,
                    description: editableHtmlContent
                }));
                
                setHtmlContent(editableHtmlContent);
                
                toast({
                    title: "HTML Applied!",
                    description: "The HTML content has been applied to the editor.",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
            } catch (error) {
                toast({
                    title: "Invalid HTML",
                    description: "The HTML content contains errors and could not be applied.",
                    status: "error",
                    duration: 2000,
                    isClosable: true,
                });
            }
        }
    };

    const copyHtmlToClipboard = () => {
        if (quillInstance.current) {
            const html = quillInstance.current.root.innerHTML;
            navigator.clipboard.writeText(html).then(() => {
                toast({
                    title: "HTML Copied!",
                    description: "The HTML content has been copied to your clipboard.",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
            }).catch(() => {
                toast({
                    title: "Copy Failed",
                    description: "Failed to copy HTML content to clipboard.",
                    status: "error",
                    duration: 2000,
                    isClosable: true,
                });
            });
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
                [name]: value === "true" || value === true,
            });
        }
        else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = () => {
        if (data && Object.keys(data).length !== 0 && !editID) {
            window.alert('You can Add only one Location for one conference');
            setFormData(initialData)
        }
        else {
            axios.post(`${apiUrl}/conferencemodule/location`, formData, { withCredentials: true })
                .then(res => {
                    setData(res.data);
                    setEditID(res.data._id);
                    setRefresh(refresh + 1);
                    toast({
                        title: "Location Added!",
                        description: "Location has been successfully added.",
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                    });
                })
                .catch(err => {
                    console.log(err);
                    console.log(formData);
                });
        }
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/location/${editID}`, formData, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
                setRefresh(refresh + 1);
                toast({
                    title: "Location Updated!",
                    description: "Location has been successfully updated.",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/location/${deleteItemId}`, {
            withCredentials: true
        })
            .then(res => {
                setShowDeleteConfirmation(false);
                setRefresh(refresh + 1);
                setFormData(initialData);
                setEditID(null);
                if (quillInstance.current) quillInstance.current.root.innerHTML = '';
                setHtmlContent('');
                setEditableHtmlContent('');
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        window.scrollTo(0, 0);
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
                setEditID(res.data._id);
                if (quillInstance.current) quillInstance.current.root.innerHTML = res.data.description || '';
                setHtmlContent(res.data.description || '');
                setEditableHtmlContent(res.data.description || '');
            })
            .catch(err => console.log(err));
    };

    const htmlPreviewStyles = {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#374151'
    };

    const htmlContentStyles = `
        h1 { font-size: 2rem; font-weight: bold; margin: 1rem 0; }
        h2 { font-size: 1.5rem; font-weight: bold; margin: 0.875rem 0; }
        h3 { font-size: 1.25rem; font-weight: bold; margin: 0.75rem 0; }
        h4 { font-size: 1.125rem; font-weight: bold; margin: 0.625rem 0; }
        h5 { font-size: 1rem; font-weight: bold; margin: 0.5rem 0; }
        h6 { font-size: 0.875rem; font-weight: bold; margin: 0.5rem 0; }
        p { margin: 0.75rem 0; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        u { text-decoration: underline; }
        s { text-decoration: line-through; }
        ul { list-style-type: disc; margin: 1rem 0; padding-left: 2rem; }
        ol { list-style-type: decimal; margin: 1rem 0; padding-left: 2rem; }
        li { margin: 0.25rem 0; }
        blockquote { border-left: 4px solid #e5e7eb; margin: 1rem 0; padding-left: 1rem; font-style: italic; }
        code { background-color: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #d1d5db; padding: 0.5rem; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; }
        img { max-width: 100%; height: auto; }
    `;

    
    return (
    <main className='tw-py-10 tw-min-h-screen tw-flex tw-justify-center'>
        <div className="tw-w-full tw-max-w-full tw-px-2">
            <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-8">
                <div className="tw-w-full lg:tw-w-1/2">
                    <Container maxW='full'>
                        <Center>
                            <Heading as="h1"
                            size="xl"
                            style={{
                                color: "#10B981", 
                                textDecoration: "underline"
                            }}>
                                Location
                            </Heading>
                        </Center>

                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Description:</FormLabel>
                            <HStack spacing={2} mb={3}>
                                <Button
                                    colorScheme="blue"
                                    size="sm"
                                    onClick={insertTable}
                                >
                                    Insert Table
                                </Button>
                                <Button
                                    colorScheme="purple"
                                    size="sm"
                                    onClick={toggleHtmlView}
                                >
                                    {showHtml ? 'Hide HTML' : 'Show HTML'}
                                </Button>
                            </HStack>
                            <div
                                ref={editorRef}
                                style={{
                                    height: "200px",
                                    width: "100%",
                                    border: "1px solid #ccc",
                                    borderRadius: "5px",
                                    marginBottom: "20px",
                                    background: "#fff"
                                }}
                            ></div>
                            {showHtml && (
                                <Box
                                    bg="white"
                                    border="1px solid"
                                    borderColor="gray.300"
                                    borderRadius="md"
                                    p={4}
                                    mb={4}
                                    mt={4}
                                >
                                    <HStack justifyContent="space-between" alignItems="center" mb={3}>
                                        <Heading as="h4" size="sm" color="gray.700">
                                            HTML Content (Editable)
                                        </Heading>
                                        <HStack spacing={2}>
                                            <Button
                                                colorScheme="orange"
                                                size="sm"
                                                onClick={applyHtmlChanges}
                                            >
                                                Apply Changes
                                            </Button>
                                            <Button
                                                colorScheme="green"
                                                size="sm"
                                                onClick={copyHtmlToClipboard}
                                            >
                                                Copy HTML
                                            </Button>
                                        </HStack>
                                    </HStack>
                                    <Textarea
                                        value={editableHtmlContent || '<p>No content yet...</p>'}
                                        onChange={handleHtmlContentChange}
                                        placeholder="Paste or edit HTML content here..."
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        fontFamily="monospace"
                                        fontSize="sm"
                                        minHeight="300px"
                                        resize="vertical"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={2}>
                                        Edit the HTML above and click "Apply Changes" to update the editor content.
                                    </Text>
                                </Box>
                            )}
                        </FormControl>

                        {/* Live Preview Section for Mobile */}
                        <div className="tw-block lg:tw-hidden tw-mb-6">
                            <Box className="tw-bg-gray-50 tw-p-6 tw-rounded-lg tw-border">
                                <Heading as="h2" size="lg" mb="4" className="tw-text-center tw-text-gray-700">
                                    Description Preview
                                </Heading>

                                <div className="tw-bg-white tw-p-4 tw-rounded tw-shadow-sm tw-overflow-hidden">
                                    <style>{htmlContentStyles}</style>
                                    <div 
                                        className="tw-min-h-[200px] tw-max-h-[300px] tw-p-4 tw-border tw-rounded tw-bg-gray-50 tw-overflow-auto"
                                        style={htmlPreviewStyles}
                                        dangerouslySetInnerHTML={{ 
                                            __html: formData.description || '<p style="color: #9CA3AF; font-style: italic;">Start typing in the description editor to see the live preview here...</p>' 
                                        }}
                                    />
                                </div>
                            </Box>
                        </div>

                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Address:</FormLabel>
                            <Input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Address"
                                mb='2.5'
                            />
                        </FormControl>

                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Latitude:</FormLabel>
                            <Input
                                type="text"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="Latitude"
                                mb='2.5'
                            />
                        </FormControl>

                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Longitude:</FormLabel>
                            <Input
                                type="text"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="Longitude"
                                mb='2.5'
                            />
                        </FormControl>

                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Sequence:</FormLabel>
                            <Input
                                type="number"
                                name="sequence"
                                value={formData.sequence}
                                onChange={handleChange}
                                placeholder="sequence"
                                mb='2.5'
                            />
                        </FormControl>

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

                            <Center>
                                <Button colorScheme="blue" type={editID ? "button" : "submit"} onClick={() => { editID ? handleUpdate() : handleSubmit() }}>
                                    {editID ? 'Update' : 'Add'}
                                </Button>
                            </Center>
                    </Container>
                </div>

                <div className="tw-hidden lg:tw-block tw-w-1/2 tw-sticky tw-top-0 tw-h-screen tw-overflow-auto">
                    <Box className="tw-bg-gray-50 tw-p-6 tw-rounded-lg tw-h-full">
                        <Heading as="h1"
                                size="xl"
                                className="tw-text-[#10B981] tw-underline" style={{
                                color: "#10B981", 
                                textDecoration: "underline"
                            }}>
                            Live Preview
                        </Heading>
                        <div className="tw-bg-white tw-p-4 tw-rounded tw-shadow-sm tw-min-h-full">
                            <div className="tw-mb-4">
                                <h3 className="tw-font-semibold tw-text-lg tw-mb-2">Description:</h3>
                                <style>{htmlContentStyles}</style>
                                <div
                                    className="tw-min-h-[200px] tw-p-4 tw-border tw-rounded tw-bg-gray-50"
                                    style={htmlPreviewStyles}
                                    dangerouslySetInnerHTML={{ 
                                        __html: formData.description || '<p style="color: #9CA3AF; font-style: italic;">Description will appear here...</p>' 
                                    }}
                                />
                            </div>
                        </div>
                    </Box>
                </div>
            </div>
        </div>
    </main>
);

};

export default Location;
