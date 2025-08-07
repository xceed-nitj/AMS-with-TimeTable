
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "quill-better-table/dist/quill-better-table.css";
import QuillBetterTable from "quill-better-table";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import { Copy } from "lucide-react";
import {
    FormControl, FormLabel, Center, Heading,
    Input, Button, Select, Box, VStack, HStack, Text, useToast, useBreakpointValue, Flex, Textarea
} from '@chakra-ui/react';

const LivePreviewSection = ({ title, html }) => {
  return (
    <Box p={4}>
      <Heading
        as="h1"
        size="xl"
        textAlign="center"
        mb={6}
        color="#8b5cf6"
        textDecoration="underline"
      >
        Live Preview
      </Heading>

      {/* About Section Preview */}
      <Heading as="h3" size="lg" mb={4} color="gray.800">
        Announcement Preview
      </Heading>

      {/* Content Card */}
      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
        bg="white"
        boxShadow="sm"
      >
        <VStack align="start" spacing={3}>
          {/* Title */}
          <Text fontWeight="bold" color="blue.600" fontSize="lg">
            {title || "Untitled"}
          </Text>

          {/* Description Box */}
          <Box
            bg="gray.50"
            p={4}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
            w="100%"
            minH="100px"
            className="preview-content"
            sx={{
              '& h1': {
                fontSize: '2xl',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: 'gray.800'
              },
              '& h2': {
                fontSize: 'xl',
                fontWeight: 'bold',
                marginBottom: '14px',
                color: 'gray.800'
              },
              '& h3': {
                fontSize: 'lg',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: 'gray.800'
              },
              '& h4': {
                fontSize: 'md',
                fontWeight: 'bold',
                marginBottom: '10px',
                color: 'gray.800'
              },
              '& h5': {
                fontSize: 'sm',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: 'gray.800'
              },
              '& h6': {
                fontSize: 'xs',
                fontWeight: 'bold',
                marginBottom: '6px',
                color: 'gray.800'
              },
              '& p': {
                marginBottom: '12px',
                lineHeight: '1.6',
                color: 'gray.700'
              },
              '& ul, & ol': {
                marginLeft: '20px',
                marginBottom: '12px',
                color: 'gray.700'
              },
              '& li': {
                marginBottom: '4px'
              },
              '& strong, & b': {
                fontWeight: 'bold'
              },
              '& em, & i': {
                fontStyle: 'italic'
              },
              '& u': {
                textDecoration: 'underline'
              },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'gray.300',
                paddingLeft: '16px',
                margin: '16px 0',
                fontStyle: 'italic',
                color: 'gray.600'
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '16px',
                border: '1px solid',
                borderColor: 'gray.300'
              },
              '& th': {
                padding: '8px 12px',
                backgroundColor: 'gray.100',
                border: '1px solid',
                borderColor: 'gray.300',
                fontWeight: 'bold',
                textAlign: 'left'
              },
              '& td': {
                padding: '8px 12px',
                border: '1px solid',
                borderColor: 'gray.300'
              },
              '& a': {
                color: 'blue.500',
                textDecoration: 'underline'
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                marginBottom: '12px'
              },
              '& code': {
                backgroundColor: 'gray.100',
                padding: '2px 4px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: 'sm'
              },
              '& pre': {
                backgroundColor: 'gray.100',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                marginBottom: '12px'
              },
              '& pre code': {
                backgroundColor: 'transparent',
                padding: '0'
              }
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: html || '<p>No content available</p>' }} />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

const Announcement = () => {
    const isMobile = useBreakpointValue({ base: true, md: false });
    
    const params = useParams();
    const apiUrl = getEnvironment();
    const toast = useToast();
    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [showHtml, setShowHtml] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [editableHtmlContent, setEditableHtmlContent] = useState('');
    
    // Quill editor ref
    const quillRef = useRef(null);
    const editorRef = useRef(null);
    
    const initialData = {
        "confId": IdConf,
        "title": "",
        "metaDescription": "",
        "description": "",
        "sequence": "",
        "feature": true,
        "new": true,
        "hidden": true,
        "link": ""
    };
    
    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState(null);
    const [data, setData] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, metaDescription, description, link, sequence } = formData;

    const parseHtmlTablesToQuillFormat = (htmlString) => {
        console.log('Original HTML:', htmlString);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        
        const tables = tempDiv.querySelectorAll('table');
        
        tables.forEach((table, tableIndex) => {
          const tableId = `table-${Date.now()}-${tableIndex}`;
          
          const rows = [];
          let maxCols = 0;
          
          const theadRows = table.querySelectorAll('thead tr');
          theadRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            const rowData = [];
            cells.forEach(cell => {
              const colspan = parseInt(cell.getAttribute('colspan') || '1');
              const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
              rowData.push({
                content: cell.textContent.trim(),
                colspan: colspan,
                rowspan: rowspan
              });
            });
            rows.push(rowData);
            maxCols = Math.max(maxCols, rowData.reduce((sum, cell) => sum + cell.colspan, 0));
          });
          
          const tbodyRows = table.querySelectorAll('tbody tr');
          tbodyRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            const rowData = [];
            cells.forEach(cell => {
              const colspan = parseInt(cell.getAttribute('colspan') || '1');
              const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
              rowData.push({
                content: cell.textContent.trim(),
                colspan: colspan,
                rowspan: rowspan
              });
            });
            rows.push(rowData);
            maxCols = Math.max(maxCols, rowData.reduce((sum, cell) => sum + cell.colspan, 0));
          });
          
          if (theadRows.length === 0 && tbodyRows.length === 0) {
            const allRows = table.querySelectorAll('tr');
            allRows.forEach(tr => {
              const cells = tr.querySelectorAll('th, td');
              const rowData = [];
              cells.forEach(cell => {
                const colspan = parseInt(cell.getAttribute('colspan') || '1');
                const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
                rowData.push({
                  content: cell.textContent.trim(),
                  colspan: colspan,
                  rowspan: rowspan
                });
              });
              rows.push(rowData);
              maxCols = Math.max(maxCols, rowData.reduce((sum, cell) => sum + cell.colspan, 0));
            });
          }
          
          if (rows.length === 0 || maxCols === 0) return;
          
          const colWidth = Math.floor(600 / maxCols); 
          const colgroup = Array(maxCols).fill(0).map(() => `<col width="${colWidth}">`).join('');
          
          let quillTableHtml = `<div class="quill-better-table-wrapper"><table class="quill-better-table"><colgroup>${colgroup}</colgroup><tbody>`;
          
          rows.forEach((row, rowIndex) => {
            const rowId = `row-${Date.now()}-${rowIndex}`;
            quillTableHtml += `<tr data-row="${rowId}">`;
            
            row.forEach((cell, cellIndex) => {
              const cellId = `cell-${Date.now()}-${rowIndex}-${cellIndex}`;
              quillTableHtml += `<td data-row="${rowId}" rowspan="${cell.rowspan}" colspan="${cell.colspan}">`;
              quillTableHtml += `<p class="qlbt-cell-line" data-row="${rowId}" data-cell="${cellId}" data-rowspan="${cell.rowspan}" data-colspan="${cell.colspan}">`;
              quillTableHtml += cell.content || '';
              quillTableHtml += `</p></td>`;
            });
            
            quillTableHtml += `</tr>`;
          });
          
          quillTableHtml += `</tbody></table></div>`;
          
          table.outerHTML = quillTableHtml;
        });
        
        const result = tempDiv.innerHTML;
        console.log('Converted HTML:', result);
        return result;
    };

    // Initialize Quill editor
    useEffect(() => {
        if (quillRef.current) return;
        Quill.register({ "modules/better-table": QuillBetterTable }, true);

        quillRef.current = new Quill(editorRef.current, {
            theme: "snow",
            placeholder: "Write description here...",
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
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
                keyboard: {
                    bindings: QuillBetterTable.keyboardBindings
                }
            }
        });

        quillRef.current.on("text-change", () => {
            const html = quillRef.current.root.innerHTML;
            setFormData(prev => ({
                ...prev,
                description: html
            }));
            setHtmlContent(html);
            setEditableHtmlContent(html);
        });
    }, []);

    // Update editor content when selected announcement changes
    useEffect(() => {
        if (quillRef.current && selectedAnnouncement) {
            const html = selectedAnnouncement.description || "";
            quillRef.current.root.innerHTML = html;
            setHtmlContent(html);
            setEditableHtmlContent(html);
        }
    }, [selectedAnnouncement]);

    // Function to insert table
    const insertTable = () => {
        if (quillRef.current) {
            const tableModule = quillRef.current.getModule("better-table");
            tableModule.insertTable(3, 3);
        }
    };

    const toggleHtmlView = () => {
        if (quillRef.current) {
            const html = quillRef.current.root.innerHTML;
            setHtmlContent(html);
            setEditableHtmlContent(html);
        }
        setShowHtml(!showHtml);
    };

    const copyHtmlToClipboard = () => {
        if (quillRef.current) {
            const html = quillRef.current.root.innerHTML;
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

    const handleHtmlContentChange = (e) => {
        const newHtmlContent = e.target.value;
        setEditableHtmlContent(newHtmlContent);
    };

    const applyHtmlChanges = () => {
        if (quillRef.current) {
            try {
                const convertedHtml = parseHtmlTablesToQuillFormat(editableHtmlContent);
                
                quillRef.current.root.innerHTML = convertedHtml;
                
                setFormData(prev => ({
                    ...prev,
                    description: convertedHtml
                }));
                
                setHtmlContent(convertedHtml);
                setEditableHtmlContent(convertedHtml);
                
                toast({
                    title: "HTML Applied & Tables Converted!",
                    description: "The HTML content has been applied and tables have been converted to editable format.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } catch (error) {
                console.error('Error applying HTML:', error);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData(prevFormData => ({
                ...prevFormData,
                [name]: parseInt(value) || "",
            }));
        }
        else if (name === "feature") {
            setFormData(prevFormData => ({
                ...prevFormData,
                [name]: value === "true",
            }));
        }
        else if (name === "new") {
            setFormData(prevFormData => ({
                ...prevFormData,
                [name]: value === "true",
            }));
        } else if (name === "hidden") {
            setFormData(prevFormData => ({
                ...prevFormData,
                [name]: value === "true",
            }));
        }
        else {
            setFormData(prevFormData => ({
                ...prevFormData,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(`${apiUrl}/conferencemodule/announcements`, formData, {
            withCredentials: true
        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData);
                if (quillRef.current) {
                    quillRef.current.setContents([]);
                }
                setRefresh(refresh + 1);
                toast({
                    title: "Success",
                    description: "Announcement created successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .catch(err => {
                console.log(err);
                toast({
                    title: "Error",
                    description: "Failed to create announcement",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/announcements/${editID}`, formData, {
            withCredentials: true
        })
            .then(res => {
                setFormData(initialData);
                if (quillRef.current) {
                    quillRef.current.setContents([]);
                }
                setRefresh(refresh + 1);
                setEditID(null);
                setSelectedAnnouncement(null);
                setHtmlContent('');
                setEditableHtmlContent('');
                toast({
                    title: "Success",
                    description: "Announcement updated successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .catch(err => {
                console.log(err);
                toast({
                    title: "Error",
                    description: "Failed to update announcement",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            });
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        setLoading(true);
        axios.delete(`${apiUrl}/conferencemodule/announcements/${deleteItemId}`, {
            withCredentials: true
        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setShowDeleteConfirmation(false);
                setRefresh(refresh + 1);
                setFormData(initialData);
                if (quillRef.current) {
                    quillRef.current.setContents([]);
                }
                if (selectedAnnouncement && selectedAnnouncement._id === deleteItemId) {
                    setSelectedAnnouncement(null);
                }
                setHtmlContent('');
                setEditableHtmlContent('');
                toast({
                    title: "Success",
                    description: "Announcement deleted successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .catch(err => {
                console.log(err);
                toast({
                    title: "Error",
                    description: "Failed to delete announcement",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            })
            .finally(() => setLoading(false));
    };

    const populateFormWithAnnouncement = (announcement) => {
        console.log('Populating form with announcement:', announcement);
        setFormData({
            confId: announcement.confId || IdConf,
            title: announcement.title || "",
            metaDescription: announcement.metaDescription || "",
            description: announcement.description || "",
            sequence: announcement.sequence || "",
            feature: announcement.feature !== undefined ? announcement.feature : true,
            new: announcement.new !== undefined ? announcement.new : true,
            hidden: announcement.hidden !== undefined ? announcement.hidden : true,
            link: announcement.link || ""
        });
        setHtmlContent(announcement.description || "");
        setEditableHtmlContent(announcement.description || "");
        if (quillRef.current) {
            quillRef.current.root.innerHTML = announcement.description || "";
        }
        setEditID(announcement._id);
        setSelectedAnnouncement(announcement);
    };

    const handleEdit = (announcement) => {
        window.scrollTo(0, 0);
        populateFormWithAnnouncement(announcement);
    };

    const handleAnnouncementSelect = (announcement) => {
        console.log('Selecting announcement:', announcement);
        populateFormWithAnnouncement(announcement);
    };

    const handleCreateNew = () => {
        setFormData(initialData);
        if (quillRef.current) {
            quillRef.current.setContents([]);
        }
        setEditID(null);
        setSelectedAnnouncement(null);
        setHtmlContent('');
        setEditableHtmlContent('');
        setShowHtml(false);
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/announcements/conf/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                console.log('Fetched announcements:', res.data);
                setData(res.data);
                
                if (res.data && res.data.length > 0) {
                    setTimeout(() => {
                        populateFormWithAnnouncement(res.data[0]);
                    }, 100);
                }
            })
            .catch(err => {
                console.log('Error fetching announcements:', err);
            })
            .finally(() => setLoading(false));
    }, [refresh, IdConf]);

    const AnnouncementTabs = () => (
    <Box width="100%" mb={4}>
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
            <Heading as="h3" size="sm" color="gray.600">
                Announcements:
            </Heading>
            {isMobile && (
                <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={handleCreateNew}
                >
                    Add Announcement
                </Button>
            )}
        </HStack>
        <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            overflow="hidden"
            maxH={isMobile ? "200px" : "none"}
            overflowY={isMobile ? "auto" : "visible"}
        >
            {loading ? (
                <Box p={4}>
                    <LoadingIcon />
                </Box>
            ) : data.length > 0 ? (
                data.map((announcement, idx) => (
                    <Box
                        key={announcement._id}
                        bg={selectedAnnouncement?._id === announcement._id ? "blue.500" : "white"}
                        color={selectedAnnouncement?._id === announcement._id ? "white" : "gray.700"}
                        p={3}
                        cursor="pointer"
                        onClick={() => handleAnnouncementSelect(announcement)}
                        borderBottom={idx < data.length - 1 ? "1px solid" : "none"}
                        borderBottomColor="gray.200"
                        _hover={{
                            bg: selectedAnnouncement?._id === announcement._id ? "blue.600" : "gray.50"
                        }}
                        transition="all 0.2s"
                    >
                        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                            {announcement.title}
                        </Text>
                        <Text
                            fontSize="xs"
                            color={selectedAnnouncement?._id === announcement._id ? "whiteAlpha.800" : "gray.600"}
                            noOfLines={2}
                        >
                            {announcement.metaDescription}
                        </Text>
                    </Box>
                ))
            ) : (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                    No announcements available
                </Text>
            )}
        </Box>
    </Box>
);


    return (
        <main className="tw-p-5 tw-min-h-screen">
            <Flex direction="column">
                {/* Mobile top section */}
                {isMobile && (
                    <AnnouncementTabs />
                    
                )}

                <Flex direction={{ base: "column", md: "row" }}>
                    {/* Desktop Sidebar */}
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
                            <Button
                                colorScheme="blue"
                                size="sm"
                                mb={4}
                                onClick={handleCreateNew}
                                width="100%"
                            >
                                New Announcement
                            </Button>

                            <AnnouncementTabs />
                        </Box>
                    )}

                    <Flex flex="1" width={{ base: "100%", md: "85%" }} direction={{ base: "column", lg: "row" }}>
                        {/* Form Section */}
                        <Box width={{ base: "100%", lg: "50%" }} p={4} overflowY="auto">
                            <Container maxW="full">
                                <Center>
                                    <Heading as="h1" size="xl" mt="2" mb="6" color="#8b5cf6" textDecoration="underline">
                                        {editID ? 'Edit Announcement' : 'Create New Announcement'}
                                    </Heading>
                                </Center>

                                <form onSubmit={handleSubmit}>
                                    <VStack spacing={4} align="stretch">
                                        <FormControl isRequired>
                                            <FormLabel>Title:</FormLabel>
                                            <Input
                                                type="text"
                                                name="title"
                                                value={title}
                                                onChange={handleChange}
                                                placeholder="Title"
                                            />
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel>Meta Description:</FormLabel>
                                            <Input
                                                type="text"
                                                name="metaDescription"
                                                value={metaDescription}
                                                onChange={handleChange}
                                                placeholder="Meta Description"
                                            />
                                        </FormControl>

                                        <FormControl isRequired>
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
                                                    height: "250px",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "5px",
                                                    backgroundColor: "#fff"
                                                }}
                                            />

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

                                        <FormControl isRequired>
                                            <FormLabel>Link:</FormLabel>
                                            <Input
                                                type="text"
                                                name="link"
                                                value={link}
                                                onChange={handleChange}
                                                placeholder="Link"
                                            />
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel>Sequence:</FormLabel>
                                            <Input
                                                type="number"
                                                name="sequence"
                                                value={sequence}
                                                onChange={handleChange}
                                                placeholder="Sequence"
                                            />
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel>Featured:</FormLabel>
                                            <Select name="feature" value={formData.feature.toString()} onChange={handleChange}>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </Select>
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel>Hidden:</FormLabel>
                                            <Select name="hidden" value={formData.hidden.toString()} onChange={handleChange}>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </Select>
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel>New:</FormLabel>
                                            <Select name="new" value={formData.new.toString()} onChange={handleChange}>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </Select>
                                        </FormControl>

                                        <HStack spacing={4} justify="center" mt={6}>
                                            {!editID ? (
                                                <Button colorScheme="blue" type="submit" size="lg">
                                                    Add Announcement
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button colorScheme="blue" onClick={handleUpdate} size="lg">
                                                        Update
                                                    </Button>
                                                    <Button colorScheme="red" onClick={() => handleDelete(editID)} size="lg">
                                                        Delete
                                                    </Button>
                                                </>
                                            )}
                                        </HStack>
                                    </VStack>
                                </form>
                            </Container>
                        </Box>

                        {/* Preview */}
                        {!isMobile && (
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
                                <LivePreviewSection
                                    title={formData.title}
                                    html={formData.description}
                                />
                            </Box>
                        )}
                    </Flex>
                </Flex>
            </Flex>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
                    <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
                        <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
                            Are you sure you want to delete this announcement?
                        </p>
                        <div className="tw-flex tw-justify-center tw-gap-4">
                            <Button colorScheme="red" onClick={confirmDelete} isLoading={loading}>
                                Yes, Delete
                            </Button>
                            <Button colorScheme="blue" onClick={() => setShowDeleteConfirmation(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Announcement;