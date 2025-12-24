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
import { Flex, Box, FormControl, FormErrorMessage, FormLabel, Center, Heading, Input, Button, useBreakpointValue, Textarea } from '@chakra-ui/react';
import { CustomTh, CustomLink, CustomBlueButton } from '../utils/customStyles'

const HomeConf = () => {
    const navigate = useNavigate();
    const editorRefs = useRef([]);
    const quillInstances = useRef([]);
    const isQuillRegistered = useRef(false);
    const isUpdatingDescription = useRef(false);
    const initializedTabs = useRef(new Set());

    const params = useParams();
    const apiUrl = getEnvironment();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showAboutDeleteConfirmation, setShowAboutDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [deleteAboutIndex, setDeleteAboutIndex] = useState(null);
    const [activeAboutTab, setActiveAboutTab] = useState(null);
    const [showAboutSection, setShowAboutSection] = useState(false);
    const [showHtml, setShowHtml] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [editableHtmlContent, setEditableHtmlContent] = useState('');

    const IdConf = params.confid;
    const initialData = {
        "confId": IdConf,
        "confName": "",
        "confStartDate": "",
        "confEndDate": "",
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
    const [about, setAbout] = useState([{ title: "", description: "" }]);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);
    const [aboutLoading, setAboutLoading] = useState(false);

    const isMobile = useBreakpointValue({ base: true, md: false });
    const isTablet = useBreakpointValue({ base: false, md: true, lg: false });

    const { confName, youtubeLink, instaLink, facebookLink, twitterLink, logo, shortName,abstractLink,paperLink,
     regLink,flyerLink,brochureLink,posterLink } = formData;
    
     const confStartDate = new Date(formData.confStartDate).toLocaleDateString('en-CA');
     const confEndDate = new Date(formData.confEndDate).toLocaleDateString('en-CA');

    const parseHtmlTables = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tables = doc.querySelectorAll('table:not(.quill-better-table)');
        
        tables.forEach(table => {
            const generateId = () => Math.random().toString(36).substr(2, 4);
            
            const rows = table.querySelectorAll('tr');
            if (rows.length === 0) return;
            
            let maxCols = 0;
            rows.forEach(row => {
                let colCount = 0;
                const cells = row.querySelectorAll('td, th');
                cells.forEach(cell => {
                    const colspan = parseInt(cell.getAttribute('colspan') || '1');
                    colCount += colspan;
                });
                maxCols = Math.max(maxCols, colCount);
            });
            
            const wrapper = doc.createElement('div');
            wrapper.className = 'quill-better-table-wrapper';
            
            const newTable = doc.createElement('table');
            newTable.className = 'quill-better-table';
            
            const colgroup = doc.createElement('colgroup');
            for (let i = 0; i < maxCols; i++) {
                const col = doc.createElement('col');
                col.setAttribute('width', '100');
                colgroup.appendChild(col);
            }
            newTable.appendChild(colgroup);
            
            const tbody = doc.createElement('tbody');
            
            rows.forEach(row => {
                const newRow = doc.createElement('tr');
                const rowId = `row-${generateId()}`;
                newRow.setAttribute('data-row', rowId);
                
                const cells = row.querySelectorAll('td, th');
                cells.forEach(cell => {
                    const newCell = doc.createElement('td');
                    const cellId = `cell-${generateId()}`;
                    
                    const colspan = cell.getAttribute('colspan') || '1';
                    const rowspan = cell.getAttribute('rowspan') || '1';
                    
                    newCell.setAttribute('data-row', rowId);
                    newCell.setAttribute('rowspan', rowspan);
                    newCell.setAttribute('colspan', colspan);
                    
                    const cellContent = cell.innerHTML.trim();
                    if (cellContent) {
                        const p = doc.createElement('p');
                        p.className = 'qlbt-cell-line';
                        p.setAttribute('data-row', rowId);
                        p.setAttribute('data-cell', cellId);
                        p.setAttribute('data-rowspan', rowspan);
                        p.setAttribute('data-colspan', colspan);
                        
                        p.innerHTML = cellContent;
                        newCell.appendChild(p);
                    } else {
                        const p = doc.createElement('p');
                        p.className = 'qlbt-cell-line';
                        p.setAttribute('data-row', rowId);
                        p.setAttribute('data-cell', cellId);
                        p.setAttribute('data-rowspan', rowspan);
                        p.setAttribute('data-colspan', colspan);
                        p.innerHTML = '<br>';
                        newCell.appendChild(p);
                    }
                    
                    newRow.appendChild(newCell);
                });
                
                tbody.appendChild(newRow);
            });
            
            newTable.appendChild(tbody);
            wrapper.appendChild(newTable);
            
            table.parentNode.replaceChild(wrapper, table);
        });
        
        return doc.body.innerHTML;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleArrayChange = (e, index) => {
        const { name, value } = e.target;
        const newAboutIns = [...about];
        newAboutIns[index][name] = value;
        setAbout(newAboutIns);
    };
    
    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const handleAboutTabClick = (index) => {
        setActiveAboutTab(index);
        setShowAboutSection(true);
        setShowHtml(false); 
    };

    const handleBackToForm = () => {
        setShowAboutSection(false);
        setActiveAboutTab(null);
        setShowHtml(false); 
    };

    const handleDeleteAbout = (indexToRemove) => {
        setDeleteAboutIndex(indexToRemove);
        setShowAboutDeleteConfirmation(true);
    };

    const handleShowHtml = () => {
        if (activeAboutTab !== null && quillInstances.current[activeAboutTab]) {
            const html = quillInstances.current[activeAboutTab].getHTML();
            setHtmlContent(html);
            setEditableHtmlContent(html);
            setShowHtml(!showHtml);
        }
    };

    const handleHtmlContentChange = (e) => {
        setEditableHtmlContent(e.target.value);
    };

    const applyHtmlChanges = () => {
        if (activeAboutTab !== null && quillInstances.current[activeAboutTab]) {
            try {
                const parsedHtml = parseHtmlTables(editableHtmlContent);
                
                quillInstances.current[activeAboutTab].setHTML(parsedHtml);
                
                const newAbout = [...about];
                newAbout[activeAboutTab].description = parsedHtml;
                setAbout(newAbout);
                
                setHtmlContent(parsedHtml);
                setEditableHtmlContent(parsedHtml);
                
                console.log('HTML content applied successfully with table parsing');
            } catch (error) {
                console.error('Error applying HTML content:', error);
                alert('Error applying HTML content. Please check the HTML format.');
            }
        }
    };

    const handleCopyHtml = async () => {
        try {
            await navigator.clipboard.writeText(editableHtmlContent);
            alert('HTML copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy HTML: ', err);
            const textArea = document.createElement('textarea');
            textArea.value = editableHtmlContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    };

    const confirmDeleteAbout = async () => {
        const indexToRemove = deleteAboutIndex;
        if (about.length > 1) {
            const aboutToDelete = about[indexToRemove];
            
            if (aboutToDelete._id) {
                try {
                    await axios.delete(`${apiUrl}/conferencemodule/home/about/${IdConf}/${aboutToDelete._id}`, {
                        withCredentials: true
                    });
                    console.log('About item deleted from backend');
                } catch (err) {
                    console.error('Error deleting about item from backend:', err);
                    window.alert('Error deleting about item from server');
                    setShowAboutDeleteConfirmation(false);
                    setDeleteAboutIndex(null);
                    return;
                }
            }
            
            const newAbout = about.filter((_, index) => index !== indexToRemove);
            setAbout(newAbout);
            
            if (quillInstances.current[indexToRemove]) {
                quillInstances.current[indexToRemove] = null;
            }
            quillInstances.current = quillInstances.current.filter((_, index) => index !== indexToRemove);
            editorRefs.current = editorRefs.current.filter((_, index) => index !== indexToRemove);
            initializedTabs.current.delete(indexToRemove);
            
            if (activeAboutTab >= newAbout.length) {
                setActiveAboutTab(newAbout.length - 1);
            } else if (activeAboutTab > indexToRemove) {
                setActiveAboutTab(activeAboutTab - 1);
            }

            if (activeAboutTab === indexToRemove) {
                handleBackToForm();
            }
        }
        setShowAboutDeleteConfirmation(false);
        setDeleteAboutIndex(null);
    };

    const handleDescriptionChange = (value, index) => {
        if (isUpdatingDescription.current) return;
        
        isUpdatingDescription.current = true;
        const newAboutIns = [...about];
        newAboutIns[index].description = value;
        console.log('Description updated for index:', index, 'Value:', value);
        setAbout(newAboutIns);
        
        if (showHtml && activeAboutTab === index) {
            setHtmlContent(value);
            setEditableHtmlContent(value);
        }
        
        setTimeout(() => {
            isUpdatingDescription.current = false;
        }, 100);
    };

    const fetchAboutSections = async () => {
        setAboutLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/conferencemodule/home/about/${IdConf}`, {
                withCredentials: true
            });
            
            if (response.data && response.data.length > 0) {
                console.log('Fetched about sections:', response.data);
                setAbout(response.data);
            } else {
                console.log('No about sections found, using default');
                setAbout([{ title: "", description: "" }]);
            }
        } catch (err) {
            console.log('Error fetching about sections:', err);
            setAbout([{ title: "", description: "" }]);
        } finally {
            setAboutLoading(false);
        }
    };

    const addNewAbout = () => {
        const newAbout = [...about, { title: "", description: "" }];
        setAbout(newAbout);
        setActiveAboutTab(newAbout.length - 1);
        setShowAboutSection(true);
    };

    const handleAboutUpdate = async () => {
        try {
            const aboutData = { about: about };
            
            try {
                await axios.put(`${apiUrl}/conferencemodule/home/about/${IdConf}`, aboutData, {
                    withCredentials: true
                });
                console.log('About sections updated successfully');
            } catch (updateErr) {
                await axios.post(`${apiUrl}/conferencemodule/home/about/${IdConf}`, aboutData, {
                    withCredentials: true
                });
                console.log('About sections created successfully');
            }
            
            fetchAboutSections(); 
        } catch (err) {
            console.error('Error updating about sections:', err);
            window.alert('Error updating about sections');
        }
    };

    useEffect(() => {
    if (!isQuillRegistered.current) {
        try {
            Quill.register(
                {
                    "modules/better-table": QuillBetterTable,
                },
                true
            );
            isQuillRegistered.current = true;
        } catch (error) {
            console.log("Quill modules already registered");
        }
    }

    const initializeQuill = (index) => {
        if (!editorRefs.current[index] || !about[index] || aboutLoading) {
            return;
        }

        console.log("Initializing Quill for index:", index);
        console.log("About data for index:", about[index]);
        console.log("Description:", about[index]?.description);

        editorRefs.current[index].innerHTML = "";

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
            clipboard: { matchVisual: false },
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
            keyboard: { bindings: QuillBetterTable.keyboardBindings },
        };

        quillInstances.current[index] = new Quill(editorRefs.current[index], {
            theme: "snow",
            modules,
            placeholder: "Start writing here...",
        });

        quillInstances.current[index].setHTML = (html) => {
            quillInstances.current[index].root.innerHTML = html;
        };

        quillInstances.current[index].getHTML = () => {
            return quillInstances.current[index].root.innerHTML;
        };

        const description = about[index]?.description || "";
        console.log("Setting description:", description);
        quillInstances.current[index].setHTML(description);

        quillInstances.current[index].on("text-change", () => {
            console.log("Current HTML content:", quillInstances.current[index].getHTML());
            if (!isUpdatingDescription.current) {
                handleDescriptionChange(quillInstances.current[index].getHTML(), index);
            }
        });

        console.log("Quill initialized for index:", index);
    };

    const reinitializeQuillIfNeeded = (index) => {
        if (!quillInstances.current[index]) {
            console.log("Reinitializing Quill for index:", index);
            initializeQuill(index);
        }
    };

    const timeoutId = setTimeout(() => {
        if (!aboutLoading && about && about[activeAboutTab] && showAboutSection) {
            reinitializeQuillIfNeeded(activeAboutTab);
        }
    }, 300);

    return () => {
        clearTimeout(timeoutId);

        if (quillInstances.current[activeAboutTab]) {
            quillInstances.current[activeAboutTab].off("text-change");
            quillInstances.current[activeAboutTab] = null;
        }
    };
}, [activeAboutTab, aboutLoading, showAboutSection]);

    const insertTable = (index) => {
        if (quillInstances.current[index]) {
            const tableModule = quillInstances.current[index].getModule("better-table");
            tableModule.insertTable(3, 3);
        }
    };

    const updateConferenceAndAbout = async () => {
        try {
            const conferenceResponse = await axios.put(`${apiUrl}/conferencemodule/home/${editID}`, formData, {
                withCredentials: true
            });
            
            await handleAboutUpdate();
            
            setData(conferenceResponse.data);
            setRefresh(refresh + 1);
            console.log('Both conference and about data updated successfully');
            
        } catch (err) {
            console.error('Error updating conference and about data:', err);
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (data && !editID) {
            window.alert('You cannot Add multiple values of this for one conference');
            return;
        }

        if (editID) {
            updateConferenceAndAbout();
        } else {
            axios.post(`${apiUrl}/conferencemodule/home`, formData, { withCredentials: true })
                .then(res => {
                    setData(res.data);
                    console.log(res.data);
                    setEditID(res.data._id);
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
                setRefresh(refresh + 1);
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
                    confId: IdConf
                });
            })
            .catch(err => console.log(err));
    };

    const handleCancelEdit = () => {
        setEditID("");
        if (data) {
            setFormData({
                ...data,
                confId: IdConf
            });
        } else {
            setFormData(initialData);
        }
    };

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
                        About Section Preview
                    </Heading>
                    
                    {showAboutSection && activeAboutTab !== null && about[activeAboutTab] && (
                        <Box mb={6} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                            <Heading as="h3" size="md" mb={3} color="blue.600">
                                {about[activeAboutTab].title || `About Section ${activeAboutTab + 1}`}
                            </Heading>
                            <Box
                                className="tw-prose tw-max-w-none tw-min-h-[100px] tw-p-2 tw-border tw-rounded tw-bg-gray-50"
                                dangerouslySetInnerHTML={{ 
                                    __html: about[activeAboutTab].description || '<p class="tw-text-gray-400 tw-italic">Start typing in the description editor to see the live preview here...</p>' 
                                }}
                            />
                        </Box>
                    )}
                    
                    {!showAboutSection && (
                        <Box textAlign="center" py={8} color="gray.500">
                            <p>Select an about tab to see the live preview</p>
                        </Box>
                    )}
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
                        confId: IdConf
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

        fetchAboutSections();
    }, [refresh]);

    if (loading) {
        return <LoadingIcon />;
    }

    return (
        <main className="tw-p-5 tw-min-h-screen">
            <Flex direction="column">
                <Flex direction={{ base: "column", md: "row" }}>
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
                            overflowY="auto"
                        >
                            <Heading as="h2" size="md" mb={4}>
                                Add Items
                            </Heading>
                            <Button colorScheme="blue" onClick={addNewAbout} mb="4" width="100%" size="sm">
                                Add New About
                            </Button>
                            
                            {/* Back to Form Button */}
                            {showAboutSection && (
                                <Button colorScheme="gray" onClick={handleBackToForm} mb="4" width="100%" size="sm">
                                    Conference Details
                                </Button>
                            )}
                            
                            {/* About Tabs */}
                            <Box width="100%" mb={4}>
                                <Heading as="h3" size="sm" mb={2} color="gray.600">
                                    About Sections:
                                </Heading>
                                <Box
                                    bg="white"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    overflow="hidden"
                                >
                                    {about.map((aboutItem, index) => (
                                        <Box
                                            key={index}
                                            bg={activeAboutTab === index && showAboutSection ? "blue.500" : "white"}
                                            color={activeAboutTab === index && showAboutSection ? "white" : "gray.700"}
                                            p={3}
                                            cursor="pointer"
                                            onClick={() => handleAboutTabClick(index)}
                                            borderBottom={index < about.length - 1 ? "1px solid" : "none"}
                                            borderBottomColor="gray.200"
                                            _hover={{
                                                bg: activeAboutTab === index && showAboutSection ? "blue.600" : "gray.50"
                                            }}
                                            transition="all 0.2s"
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
                                            <Box>
                                                <Box fontSize="sm" fontWeight="semibold">
                                                    {aboutItem.title || `About ${index + 1}`}
                                                </Box>
                                                {activeAboutTab === index && showAboutSection && (
                                                    <Box fontSize="xs" opacity={0.8}>
                                                        Currently editing
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
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
                                    
                                    {!showAboutSection && (
                                        <>
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

                                            {/* Mobile About Tabs */}
                                            {isMobile && (
                                                <Box mb={6}>
                                                    <FormLabel mb={3}>About Sections:</FormLabel>
                                                    <Box
                                                        bg="white"
                                                        border="1px solid"
                                                        borderColor="gray.200"
                                                        borderRadius="md"
                                                        overflow="hidden"
                                                        mb={4}
                                                    >
                                                        {about.map((aboutItem, index) => (
                                                            <Box
                                                                key={index}
                                                                bg="white"
                                                                color="gray.700"
                                                                p={3}
                                                                cursor="pointer"
                                                                onClick={() => handleAboutTabClick(index)}
                                                                borderBottom={index < about.length - 1 ? "1px solid" : "none"}
                                                                borderBottomColor="gray.200"
                                                                _hover={{
                                                                    bg: "gray.50"
                                                                }}
                                                                transition="all 0.2s"
                                                                display="flex"
                                                                justifyContent="space-between"
                                                                alignItems="center"
                                                            >
                                                                <Box fontSize="sm" fontWeight="semibold">
                                                                    {aboutItem.title || `About ${index + 1}`}
                                                                </Box>
                                                                <Box fontSize="xs" color="blue.500">
                                                                    Edit →
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    <Button colorScheme="blue" onClick={addNewAbout} size="sm" width="100%">
                                                        Add New About
                                                    </Button>
                                                </Box>
                                            )}

                                            
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
                                        
                                   
                                            <Center>
                                                <Button colorScheme="blue" type="submit">
                                                    {editID ? 'Update Conference Info' : 'Add Conference Info'}
                                                </Button>
                                            </Center>
                                        </>
                                    )}

                                    {/* Show about editor when in about section */}
                                    {showAboutSection && activeAboutTab !== null && !aboutLoading && about[activeAboutTab] && (
                                        <div key={`about-${activeAboutTab}`}>
                                            {isMobile && (
                                                <Center mb="4">
                                                    <Button 
                                                        colorScheme="gray" 
                                                        onClick={handleBackToForm} 
                                                        width="100%"
                                                        size="sm"
                                                    >
                                                        Conference Details
                                                    </Button>
                                                </Center>
                                            )}
                                            
                                            <FormControl mb='3'>
                                                <p>Title:</p>
                                                <Input
                                                    type="text"
                                                    name="title"
                                                    value={about[activeAboutTab]?.title || ""}
                                                    onChange={(e) => handleArrayChange(e, activeAboutTab)}
                                                    placeholder="Title"
                                                />
                                            </FormControl>
                                            <FormControl mb='3'>
                                                <p>Description:</p>
                                                <div style={{ marginBottom: "10px" }}>
                                                    <Button
                                                        colorScheme="blue"
                                                        size="sm"
                                                        onClick={() => insertTable(activeAboutTab)}
                                                        mr={2}
                                                    >
                                                        Insert Table
                                                    </Button>
                                                    <Button
                                                        colorScheme="purple"
                                                        size="sm"
                                                        onClick={handleShowHtml}
                                                        mr={2}
                                                    >
                                                        {showHtml ? 'Hide HTML' : 'Show HTML'}
                                                    </Button>
                                                </div>
                                                <div
                                                    ref={(el) => (editorRefs.current[activeAboutTab] = el)}
                                                    style={{
                                                        height: "200px",
                                                        width: "100%",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "5px",
                                                        marginBottom: "20px",
                                                        background: "#fff"
                                                    }}
                                                ></div>
                                                
                                                {/* HTML Display Area */}
                                                {showHtml && (
                                                    <Box
                                                        bg="gray.50"
                                                        border="1px solid"
                                                        borderColor="gray.300"
                                                        borderRadius="md"
                                                        p={4}
                                                        mb={4}
                                                    >
                                                        <Flex justifyContent="space-between" alignItems="center" mb={3}>
                                                            <Heading as="h4" size="sm" color="gray.700">
                                                                HTML Content (Editable)
                                                            </Heading>
                                                            <Flex gap={2}>
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
                                                                    onClick={handleCopyHtml}
                                                                >
                                                                    Copy HTML
                                                                </Button>
                                                            </Flex>
                                                        </Flex>
                                                        <Textarea
                                                            value={editableHtmlContent}
                                                            onChange={handleHtmlContentChange}
                                                            placeholder="Edit HTML content here..."
                                                            minHeight="200px"
                                                            maxHeight="400px"
                                                            fontFamily="monospace"
                                                            fontSize="sm"
                                                            bg="white"
                                                            border="1px solid"
                                                            borderColor="gray.200"
                                                            borderRadius="md"
                                                            resize="vertical"
                                                        />
                                                    </Box>
                                                )}
                                            </FormControl>
                                            
                                            {/* About Section Update Button */}
                                            <Center mb="4">
                                                <Button 
                                                    colorScheme="green" 
                                                    onClick={handleAboutUpdate}
                                                    size="md"
                                                    isLoading={aboutLoading}
                                                    mr={4}
                                                >
                                                    Update About Section
                                                </Button>
                                                {about.length > 1 && (
                                                    <Button 
                                                        colorScheme="red" 
                                                        onClick={() => handleDeleteAbout(activeAboutTab)}
                                                        size="md"
                                                    >
                                                        Delete This About
                                                    </Button>
                                                )}
                                            </Center>
                                        </div>
                                    )}

                                    {aboutLoading && (
                                        <Box textAlign="center" py={4}>
                                            <LoadingIcon />
                                        </Box>
                                    )}
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

            {/* About Delete Confirmation Modal */}
            {showAboutDeleteConfirmation && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
                    <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
                        <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
                            Are you sure you want to delete this about section?
                        </p>
                        <div className="tw-flex tw-justify-center">
                            <Button
                                colorScheme="red"
                                onClick={confirmDeleteAbout}
                                mr={4}
                            >
                                Yes, Delete
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={() => {
                                    setShowAboutDeleteConfirmation(false);
                                    setDeleteAboutIndex(null);
                                }}
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
