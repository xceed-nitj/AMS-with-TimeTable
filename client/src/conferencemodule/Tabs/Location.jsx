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
    Input, Button, Select, Box
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

    // --- Quill Editor Setup ---
    const editorRef = useRef(null);
    const quillInstance = useRef(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
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
        } else {
            setFormData(initialData);
            if (quillInstance.current) {
                quillInstance.current.root.innerHTML = "";
            }
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
            setFormData((prev) => ({
                ...prev,
                description: quillInstance.current.root.innerHTML
            }));
        });
    }, []);

    useEffect(() => {
        if (quillInstance.current && formData.description !== quillInstance.current.root.innerHTML) {
            quillInstance.current.root.innerHTML = formData.description || '';
        }
    }, [editID]);

    // --- Table Operation Buttons ---
    const insertTable = () => {
        const tableModule = quillInstance.current.getModule("better-table");
        tableModule.insertTable(3, 3);
    };
    const getTable = () => {
        const tableModule = quillInstance.current.getModule("better-table");
        console.log("Table details:", tableModule.getTable());
    };
    const getContents = () => {
        console.log("Editor contents:", quillInstance.current.getContents());
    };

    // --- Form Handlers ---
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
        if (data && Object.keys(data).length !== 0) {
            window.alert('You can Add only one Location for one conference');
            setFormData(initialData)
        }
        else {
            axios.post(`${apiUrl}/conferencemodule/location`, formData, { withCredentials: true })
                .then(res => {
                    setData(res.data);
                    setFormData(initialData);
                    setRefresh(refresh + 1);
                    if (quillInstance.current) quillInstance.current.root.innerHTML = '';
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
                setFormData(initialData);
                setRefresh(refresh + 1);
                setEditID(null);
                if (quillInstance.current) quillInstance.current.root.innerHTML = '';
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
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh, IdConf, apiUrl]);

    
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
                            <div style={{ marginBottom: "10px" }}>
                                <Button
                                    colorScheme="blue"
                                    size="sm"
                                    onClick={insertTable}
                                    mr={2}
                                >
                                    Insert Table
                                </Button>
                            </div>
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
                        </FormControl>

                        {/* Live Preview Section */}
                        <div className="tw-block lg:tw-hidden tw-mb-6">
                            <Box className="tw-bg-gray-50 tw-p-6 tw-rounded-lg tw-border">
                                <Heading as="h2" size="lg" mb="4" className="tw-text-center tw-text-gray-700">
                                    Description Preview
                                </Heading>

                                <div className="tw-bg-white tw-p-4 tw-rounded tw-shadow-sm tw-overflow-hidden">
                                    <div 
                                        className="tw-prose tw-max-w-none tw-min-h-[200px] tw-max-h-[300px] tw-p-4 tw-border tw-rounded tw-bg-gray-50 tw-overflow-auto"
                                        dangerouslySetInnerHTML={{ 
                                            __html: formData.description || '<p class="tw-text-gray-400 tw-italic">Start typing in the description editor to see the live preview here...</p>' 
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

                

                {/* Right Section - Preview (desktop only) */}
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
                                <div
                                    className="tw-prose tw-max-w-none tw-min-h-[200px] tw-p-2 tw-border tw-rounded"
                                    dangerouslySetInnerHTML={{ 
                                        __html: formData.description || '<p class="tw-text-gray-400">Description will appear here...</p>' 
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