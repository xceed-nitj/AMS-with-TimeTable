
import React, { useState, useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import QuillBetterTable from "quill-better-table";
import "quill-better-table/dist/quill-better-table.css";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import { Copy } from "lucide-react";
import {
  Container, Box, VStack, HStack, Flex, Heading, Button, Input, FormControl,
  FormLabel, Select, Center, Text, useBreakpointValue, useToast, Textarea
} from "@chakra-ui/react";

const LivePreviewSection = ({ title, html }) => {
  return (
    <Box p={4}>
      <Heading
        as="h1"
        size="xl"
        textAlign="center"
        mb={6}
        color="tw-bg-slate-100"
        textDecoration="underline"
      >
        Live Preview
      </Heading>

      {/* About Section Preview */}
      <Heading as="h3" size="lg" mb={4} color="gray.800">
        Template Page Preview
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
          >
            <Text
              fontSize="md"
              color="gray.800"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
            >
              {/* Rendered HTML */}
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

const CommonTemplate = () => {
  const params = useParams();
  const apiUrl = getEnvironment();
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const toast = useToast();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const IdConf = params.confid;
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [editableHtmlContent, setEditableHtmlContent] = useState("");

  const initialData = {
    confId: IdConf,
    pageTitle: "",
    description: "",
    feature: true,
  };
  const [formData, setFormData] = useState(initialData);
  const [editID, setEditID] = useState();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (selectedTemplate) {
      setFormData({
        confId: selectedTemplate.confId,
        pageTitle: selectedTemplate.pageTitle || "",
        description: selectedTemplate.description || "",
        feature: selectedTemplate.feature ?? true,
      });
      setEditID(selectedTemplate._id);
    } else {
      setFormData(initialData);
      setEditID(null);
    }
  }, [selectedTemplate, IdConf]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${apiUrl}/conferencemodule/commontemplate/conference/${IdConf}`, {
      withCredentials: true
    })
      .then(res => {
        setData(res.data);
        if (!selectedTemplate && res.data.length > 0) {
          setSelectedTemplate(res.data[0]);
        }
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, [refresh, IdConf]);

  useEffect(() => {
    if (quillInstance.current) return;
    Quill.register({ "modules/better-table": QuillBetterTable }, true);

    quillInstance.current = new Quill(editorRef.current, {
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

    quillInstance.current.on("text-change", () => {
      const html = quillInstance.current.root.innerHTML;
      setFormData(prev => ({
        ...prev,
        description: html
      }));
      setHtmlContent(html);
      setEditableHtmlContent(html);
    });
  }, []);

  useEffect(() => {
    if (quillInstance.current && selectedTemplate) {
      const html = selectedTemplate.description || "";
      quillInstance.current.root.innerHTML = html;
      setHtmlContent(html);
      setEditableHtmlContent(html);
    }
  }, [selectedTemplate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "feature" ? value === "true" : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${apiUrl}/conferencemodule/commontemplate`, formData, {
      withCredentials: true
    })
      .then(res => {
        const newTemplate = res.data;
        setData(prevData => [...prevData, newTemplate]);
        setSelectedTemplate(newTemplate);
        setEditID(newTemplate._id);
        setRefresh(prev => prev + 1);
      })
      .catch(err => console.log(err));
  };

  const handleUpdate = () => {
    axios.put(`${apiUrl}/conferencemodule/commontemplate/${editID}`, formData, {
      withCredentials: true
    })
      .then(res => {
        setData(prev =>
          prev.map(tpl => tpl._id === editID ? { ...tpl, ...formData } : tpl)
        );
        setSelectedTemplate(prev => prev ? { ...prev, ...formData } : null);
        setRefresh(prev => prev + 1);
      })
      .catch(err => console.log(err));
  };

  const handleDelete = (deleteID) => {
    setDeleteItemId(deleteID);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    axios.delete(`${apiUrl}/conferencemodule/commontemplate/${deleteItemId}`, {
      withCredentials: true
    })
      .then(() => {
        setShowDeleteConfirmation(false);
        setFormData(initialData);
        setSelectedTemplate(null);
        setEditID(null);
        setRefresh(prev => prev + 1);
        if (quillInstance.current) {
          quillInstance.current.root.innerHTML = '';
          setHtmlContent('');
          setEditableHtmlContent('');
        }
      })
      .catch(err => console.log(err));
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleAddNewTemplate = () => {
    setSelectedTemplate(null);
    setFormData(initialData);
    setEditID(null);
    if (quillInstance.current) {
      quillInstance.current.root.innerHTML = '';
      setHtmlContent('');
      setEditableHtmlContent('');
    }
  };

  const insertTable = () => {
    if (quillInstance.current) {
      const tableModule = quillInstance.current.getModule("better-table");
      tableModule.insertTable(3, 3);
    }
  };

  const toggleHtmlView = () => {
    if (quillInstance.current) {
      const html = quillInstance.current.root.innerHTML;
      setHtmlContent(html);
      setEditableHtmlContent(html);
    }
    setShowHtml(!showHtml);
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

  const copyObjectIdToClipboard = () => {
    if (selectedTemplate && selectedTemplate._id) {
      navigator.clipboard.writeText(selectedTemplate._id).then(() => {
        toast({
          title: "Object ID Copied!",
          description: "The Object ID has been copied to your clipboard.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }).catch(() => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy Object ID to clipboard.",
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

  const TemplateTabs = () => (
    <Box width="100%" mb={4}>
      <Heading as="h3" size="sm" mb={2} color="gray.600">
        Template Pages:
      </Heading>
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
      >
        {data.length > 0 ? data.map((template, idx) => (
          <Box
            key={template._id}
            bg={selectedTemplate?._id === template._id ? "blue.500" : "white"}
            color={selectedTemplate?._id === template._id ? "white" : "gray.700"}
            p={3}
            cursor="pointer"
            onClick={() => handleTemplateSelect(template)}
            borderBottom={idx < data.length - 1 ? "1px solid" : "none"}
            borderBottomColor="gray.200"
            _hover={{
              bg: selectedTemplate?._id === template._id ? "blue.600" : "gray.50"
            }}
            transition="all 0.2s"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box fontSize="sm" fontWeight="semibold">
              {template.pageTitle || `Template ${idx + 1}`}
            </Box>
            {selectedTemplate?._id === template._id && (
              <Box fontSize="xs" opacity={0.8}>
                Currently editing
              </Box>
            )}
          </Box>
        )) : (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            No templates available
          </Text>
        )}
      </Box>
    </Box>
  );

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
            >
              <Heading as="h2" size="md" mb={4}>
                Add Items
              </Heading>
              <Button colorScheme="blue" onClick={handleAddNewTemplate} mb="4" width="100%" size="sm">
                Add New Template
              </Button>
              <TemplateTabs />
            </Box>
          )}

          <Flex flex="1" width={{ base: "100%", md: "85%" }} direction={{ base: "column", lg: "row" }}>
            {/* Form Section */}
            <Box width={{ base: "100%", lg: "50%" }} p={4} overflowY="auto">
              <Container maxW='full'>
                <Center>
                  <Heading as="h1" size="xl" mt="2" mb="6" color="tw-bg-slate-100" textDecoration="underline">
                    {selectedTemplate ? `Edit Template` : 'Create New Template'}
                  </Heading>
                </Center>

                {selectedTemplate && (
                  <Box
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={4}
                    mb={6}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">
                          Object ID:
                        </Text>
                        <Text
                          fontSize="sm"
                          fontFamily="monospace"
                          color="gray.800"
                          bg="white"
                          px={2}
                          py={1}
                          borderRadius="sm"
                          border="1px solid"
                          borderColor="gray.300"
                        >
                          {selectedTemplate._id}
                        </Text>
                      </VStack>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<Copy size={16} />}
                        onClick={copyObjectIdToClipboard}
                      >
                        Copy ID
                      </Button>
                    </HStack>
                  </Box>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Mobile Template Tabs */}
                  {isMobile && <TemplateTabs />}
                  
                  <FormControl isRequired mb='3' >
                    <FormLabel>Page Title:</FormLabel>
                    <Input
                      type="text"
                      name="pageTitle"
                      value={formData.pageTitle}
                      onChange={handleChange}
                      placeholder="Page Title"
                      mb='2.5'
                    />
                  </FormControl>
                  <FormControl isRequired mb='3'>
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
                  <FormControl isRequired mb='3'>
                    <FormLabel>Featured:</FormLabel>
                    <Select
                      name="feature"
                      value={formData.feature}
                      onChange={handleChange}
                    >
                      <option value={true}>Yes</option>
                      <option value={false}>No</option>
                    </Select>
                  </FormControl>
                  <HStack spacing={4} justify="center" mt={6}>
                    <Button
                      colorScheme="blue"
                      onClick={editID ? handleUpdate : handleSubmit}
                      size="lg"
                      type={editID ? "button" : "submit"}
                    >
                      {editID ? 'Update Template' : 'Add Template'}
                    </Button>
                    {selectedTemplate && (
                      <Button
                        colorScheme="red"
                        onClick={() => handleDelete(selectedTemplate._id)}
                        size="lg"
                      >
                        Delete Template
                      </Button>
                    )}
                  </HStack>
                </form>
              </Container>
            </Box>

            {/* Desktop Live Preview Section */}
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
                  title={formData.pageTitle}
                  html={formData.description}
                />
              </Box>
            )}
          </Flex>
        </Flex>
      </Flex>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
          <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
            <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
              Are you sure you want to delete this template?
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

export default CommonTemplate;
