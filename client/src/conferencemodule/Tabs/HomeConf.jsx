
import React, { useState, useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import QuillBetterTable from "quill-better-table";
import "quill-better-table/dist/quill-better-table.css";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import formatDate from "../utils/formatDate";
import {  Flex, Box, FormControl, FormErrorMessage, FormLabel, Center, Heading, Input, Button, useBreakpointValue } from '@chakra-ui/react';
import { CustomTh, CustomLink, CustomBlueButton } from '../utils/customStyles'

const HomeConf = () => {
    const navigate = useNavigate();
    const editorRefs = useRef([]);
    const quillInstances = useRef([]);
    const isQuillRegistered = useRef(false);

    const params = useParams();
    const apiUrl = getEnvironment();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);

    const IdConf = params.confid;
    const initialData = {
        "confId": IdConf,
        "confName": "",
        "confStartDate": "",
        "confEndDate": "",
        "about": [{ title: "", description: "" }],
        "youtubeLink": "",
        "instaLink": "",
        "facebookLink": "",
        "twitterLink": "",
        "logo": "",
        "shortName": "",
        "abstractLink" : "",
        "paperLink" : "",
        "regLink" : "",
        "flyerLink" : "",
        "brochureLink" : "",
        "posterLink": "",
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const isMobile = useBreakpointValue({ base: true, md: false });
    const isTablet = useBreakpointValue({ base: false, md: true, lg: false });

    const { confName, confStartDate, confEndDate, aboutConf, about, youtubeLink, instaLink, facebookLink, twitterLink, logo, shortName,abstractLink,paperLink,
     regLink,flyerLink,brochureLink,posterLink } = formData;
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleArrayChange = (e, index) => {
        const { name, value } = e.target;
        const newAboutIns = [...about];
        newAboutIns[index][name] = value;
        setFormData({ ...formData, about: newAboutIns });
    };
    
    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const handleDescriptionChange = (value, index) => {
        const newAboutIns = [...about];
        newAboutIns[index].description = value;
        setFormData({ ...formData, about: newAboutIns });
    };

    const addNewAbout = () => {
        setFormData({ ...formData, about: [...about, { title: "", description: "" }] });
    };

    // Quill editor setup
    useEffect(() => {
        if (!isQuillRegistered.current) {
            try {
                Quill.register({
                    "modules/better-table": QuillBetterTable,
                }, true);
                isQuillRegistered.current = true;
            } catch (error) {
                console.log("Quill modules already registered");
                isQuillRegistered.current = true;
            }
        }

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

        about.forEach((_, index) => {
            if (editorRefs.current[index] && !quillInstances.current[index]) {
                quillInstances.current[index] = new Quill(editorRefs.current[index], {
                    theme: "snow",
                    modules,
                    placeholder: "Start writing here...",
                });

                quillInstances.current[index].root.innerHTML = about[index].description || "";

                quillInstances.current[index].on("text-change", () => {
                    handleDescriptionChange(quillInstances.current[index].root.innerHTML, index);
                });
            }
        });

        return () => {
            if (quillInstances.current.length > about.length) {
                quillInstances.current = quillInstances.current.slice(0, about.length);
                editorRefs.current = editorRefs.current.slice(0, about.length);
            }
        };
    }, [about.length]);

    useEffect(() => {
        about.forEach((item, index) => {
            if (quillInstances.current[index] && quillInstances.current[index].root.innerHTML !== item.description) {
                quillInstances.current[index].root.innerHTML = item.description || "";
            }
        });
    }, [formData]);

    const insertTable = (index) => {
        if (quillInstances.current[index]) {
            const tableModule = quillInstances.current[index].getModule("better-table");
            tableModule.insertTable(3, 3);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (data && !editID) {
            window.alert('You cannot Add multiple values of this for one conference');
            return;
        }

        if (editID) {
            handleUpdate();
        } else {
            axios.post(`${apiUrl}/conferencemodule/home`, formData, { withCredentials: true })
                .then(res => {
                    setData(res.data);
                    console.log(res.data);
                    setFormData(initialData);
                    setRefresh(refresh + 1);
                })
                .catch(err => {
                    console.log(err);
                    console.log(formData);
                });
        }
    };
    
    const handleEditorChange = (value, fieldName) => {
        setFormData({
            ...formData,
            [fieldName]: value,
        });
    };
    
    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/home/${editID}`, formData, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
                setFormData(initialData);
                setRefresh(refresh + 1);
                setEditID("");
            })
            .catch(err => console.log(err));
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/home/${deleteItemId}`, {
            withCredentials: true
        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setShowDeleteConfirmation(false);
                setRefresh(refresh + 1);
                setFormData(initialData);
                setData(null);
                setEditID("");
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        window.scrollTo(0, 0);
        setEditID(editIDNotState);
        axios.get(`${apiUrl}/conferencemodule/home/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData({
                    ...res.data,
                    confId: IdConf,
                    about: res.data.about && res.data.about.length > 0 ? res.data.about : [{ title: "", description: "" }]
                });
            })
            .catch(err => console.log(err));
    };

    const handleCancelEdit = () => {
        setEditID("");
        if (data) {
            setFormData({
                ...data,
                confId: IdConf,
                about: data.about && data.about.length > 0 ? data.about : [{ title: "", description: "" }]
            });
        } else {
            setFormData(initialData);
        }
    };

    // Live Preview Component
    const LivePreviewSection = () => (
        <Box 
            className="tw-rounded-lg" 
            p={4} 
            bg="gray.50" 
            mb={6}
        >
            <Container maxW='full'>
                <Center>
                    <Heading as="h1" size="xl" mt="2" mb="6" color="#3B82F6" textDecoration="underline">
                        Live Preview
                    </Heading>
                </Center>
                
                <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
                    <Heading as="h2" size="lg" mb={4} color="gray.700">
                        About Sections Preview
                    </Heading>
                    
                    {about.map((aboutItem, index) => (
                        <Box key={index} mb={6} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                            <Heading as="h3" size="md" mb={3} color="blue.600">
                                {aboutItem.title || `About Section ${index + 1}`}
                            </Heading>
                            <Box
                                className="tw-prose tw-max-w-none tw-min-h-[100px] tw-p-2 tw-border tw-rounded tw-bg-gray-50"
                                dangerouslySetInnerHTML={{ 
                                    __html: aboutItem.description || '<p class="tw-text-gray-400 tw-italic">Start typing in the description editor to see the live preview here...</p>' 
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );

    useEffect(() => {
        var currentURL = window.location.href;
        const IdConf = params.confid;
        if (!currentURL.includes("/cf/" + IdConf + "/home")) {
            navigate("/cf/" + IdConf + "/home")
        }

        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/home/conf/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                if (res.data) {
                    setData(res.data);
                    setEditID(res.data._id);
                    setFormData({
                        ...res.data,
                        confId: IdConf, 
                        about: res.data.about && res.data.about.length > 0 ? res.data.about : [{ title: "", description: "" }]
                    });
                } else {
                    setData(null);
                    setEditID("");
                    setFormData(initialData);
                }
            })
            .catch(err => {
                console.log(err);
                setData(null);
                setEditID("");
                setFormData(initialData);
            })
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <main className="tw-p-5 tw-min-h-screen">
            <Flex direction="column">
                <Flex direction={{ base: "column", md: "row" }}>
                    {/* Sidebar - Hidden on mobile, reduced width on desktop */}
                    {!isMobile && (
                        <Box
                            width="15%" 
                            minWidth="180px"
                            maxWidth="250px"
                            bg="gray.100"
                            p={4}
                            borderRadius="none"
                            boxShadow="md"
                            height="100vh" 
                            position="sticky"
                            top={0}
                            display="flex"
                            flexDirection="column"
                            alignItems="flex-start"
                        >
                            <Heading as="h2" size="md" mb={4}>
                                Add Items
                            </Heading>
                            <Button colorScheme="blue" onClick={addNewAbout} mb="4" width="100%" size="sm">
                                Add New About
                            </Button>
                        </Box>
                    )}

                    {/* Main Content */}
                    <Flex flex="1" width={{ base: "100%", md: "85%" }} direction={{ base: "column", lg: "row" }}>
                        {/* Form Section */}
                        <Box width={{ base: "100%", lg: "50%" }} p={4} overflowY="auto">
                            <Container maxW='full'>
                                <Center>
                                    <Heading as="h1" size="xl" mt="2" mb="6" color="#3B82F6" textDecoration="underline">
                                        About Conference
                                    </Heading>
                                </Center>

                                <form onSubmit={handleSubmit}>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Name of the Conference :</FormLabel>
                                        <Input
                                            type="text"
                                            name="confName"
                                            value={confName}
                                            onChange={handleChange}
                                            placeholder="Name"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Starting Date of the Conference :</FormLabel>
                                        <Input
                                            type="date"
                                            name="confStartDate"
                                            value={confStartDate}
                                            onChange={handleChange}
                                            placeholder="Starting Date of the Conference"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Ending Date of the Conference :</FormLabel>
                                        <Input
                                            type="date"
                                            name="confEndDate"
                                            value={confEndDate}
                                            onChange={handleChange}
                                            placeholder="Ending Date of the Conference "
                                            mb='2.5'
                                        />
                                    </FormControl>

                                    <FormLabel isRequired={true} >About:</FormLabel>

                                    {about.map((aboutItem, index) => (
                                        <div key={index}>
                                            <FormControl mb='3'>
                                                <p>Title:</p>
                                                <Input
                                                    type="text"
                                                    name="title"
                                                    value={aboutItem.title}
                                                    onChange={(e) => handleArrayChange(e, index)}
                                                    placeholder="Title"
                                                />
                                            </FormControl>
                                            <FormControl mb='3'>
                                                <p>Description:</p>
                                                <div style={{ marginBottom: "10px" }}>
                                                    <Button
                                                        colorScheme="blue"
                                                        size="sm"
                                                        onClick={() => insertTable(index)}
                                                        mr={2}
                                                    >
                                                        Insert Table
                                                    </Button>
                                                </div>
                                                <div
                                                    ref={(el) => (editorRefs.current[index] = el)}
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
                                        </div>
                                    ))}

                                    {/* Mobile Add New About Button */}
                                    {isMobile && (
                                        <Center mb="4">
                                            <Button colorScheme="blue" onClick={addNewAbout} width="100%">
                                                Add New About
                                            </Button>
                                        </Center>
                                    )}

                                    {(isMobile || isTablet) && <LivePreviewSection />}

                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >You Tube Link :</FormLabel>
                                        <Input
                                            type="text"
                                            name="youtubeLink"
                                            value={youtubeLink}
                                            onChange={handleChange}
                                            placeholder="YouTube Link"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Instagram Link :</FormLabel>
                                        <Input
                                            type="text"
                                            name="instaLink"
                                            value={instaLink}
                                            onChange={handleChange}
                                            placeholder="Instagram Link"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >FaceBook Link:</FormLabel>
                                        <Input
                                            type="text"
                                            name="facebookLink"
                                            value={facebookLink}
                                            onChange={handleChange}
                                            placeholder="FaceBook Link"
                                            mb='2.5'
                                        />
                                    </FormControl>

                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Twitter Link:</FormLabel>
                                        <Input
                                            type="text"
                                            name="twitterLink"
                                            value={twitterLink}
                                            onChange={handleChange}
                                            placeholder="Twitter Link"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Logo:</FormLabel>
                                        <Input
                                            type="text"
                                            name="logo"
                                            value={logo}
                                            onChange={handleChange}
                                            placeholder="Logo"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Short Name of Conference :</FormLabel>
                                        <Input
                                            type="text"
                                            name="shortName"
                                            value={shortName}
                                            onChange={handleChange}
                                            placeholder="Short Name"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Abstract Link :</FormLabel>
                                        <Input
                                            type="text"
                                            name="abstractLink"
                                            value={abstractLink}
                                            onChange={handleChange}
                                            placeholder="Abstract Link"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Registration Link :</FormLabel>
                                        <Input
                                            type="text"
                                            name="regLink"
                                            value={regLink}
                                            onChange={handleChange}
                                            placeholder="Registration Link"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Flyer Link of Conference :</FormLabel>
                                        <Input
                                            type="text"
                                            name="flyerLink"
                                            value={flyerLink}
                                            onChange={handleChange}
                                            placeholder="Flyer Link"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Brochure Link of Conference :</FormLabel>
                                        <Input
                                            type="text"
                                            name="brochureLink"
                                            value={brochureLink}
                                            onChange={handleChange}
                                            placeholder="Brochure Link"
                                            mb='2.5'
                                        />
                                    </FormControl>
                                    <FormControl isRequired={true} mb='3' >
                                        <FormLabel >Poster Link :</FormLabel>
                                        <Input
                                            type="text"
                                            name="posterLink"
                                            value={posterLink}
                                            onChange={handleChange}
                                            placeholder="Poster Link"
                                            mb='2.5'
                                        />
                                    </FormControl>

                                    {/* Mobile Edit/Delete buttons */}
                                    {isMobile && data && (
                                        <Center mb="4">
                                            <Flex gap={2} width="100%">
                                                <Button 
                                                    colorScheme="green" 
                                                    onClick={() => handleEdit(data._id)} 
                                                    flex="1"
                                                    isDisabled={editID === data._id}
                                                >
                                                    {editID === data._id ? 'Editing...' : 'Edit Data'}
                                                </Button>
                                                <Button 
                                                    colorScheme="red" 
                                                    onClick={() => handleDelete(data._id)} 
                                                    flex="1"
                                                >
                                                    Delete
                                                </Button>
                                            </Flex>
                                        </Center>
                                    )}

                                    {isMobile && editID && (
                                        <Center mb="4">
                                            <Button 
                                                colorScheme="gray" 
                                                onClick={handleCancelEdit} 
                                                width="100%"
                                            >
                                                Cancel Edit
                                            </Button>
                                        </Center>
                                    )}
                           
                                    <Center>
                                        <Button colorScheme="blue" type="submit">
                                            {editID ? 'Update' : 'Add'}
                                        </Button>
                                    </Center>
                                </form>
                            </Container>
                        </Box>

                        {/* Desktop Live Preview Section*/}
                        <Box 
                            width={{ base: "100%", lg: "50%" }} 
                            p={4} 
                            bg="gray.50" 
                            overflowY="auto" 
                            height={{ lg: "100vh" }} 
                            position={{ lg: "sticky" }} 
                            top={0}
                            display={{ base: "none", lg: "block" }}
                        >
                            <LivePreviewSection />
                        </Box>
                    </Flex>
                </Flex>
            </Flex>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
                    <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
                        <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
                            Are you sure you want to delete?
                        </p>
                        <div className="tw-flex tw-justify-center">
                            <Button
                                colorScheme="red"
                                onClick={confirmDelete}
                                mr={4}
                            >
                                Yes, Delete
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={() => setShowDeleteConfirmation(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}     
        </main>
    );
};

export default HomeConf;