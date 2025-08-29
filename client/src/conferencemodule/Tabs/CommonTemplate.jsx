import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import { Copy } from "lucide-react";
import QuillEditor from "../components/QuillEditor";
import {
  Container, Spacer, Box, VStack, HStack, Flex, Heading, Button, Input, FormControl,
  FormLabel, Select, Center, Text, useBreakpointValue, useToast, Textarea,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, useDisclosure
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

      <Heading as="h3" size="lg" mb={4} color="gray.800">
        Page Preview
      </Heading>

      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
        bg="white"
        boxShadow="sm"
      >
        <VStack align="start" spacing={3} w="100%">
          <Text fontWeight="bold" color="blue.600" fontSize="lg">
            {title || "Untitled"}
          </Text>

          {/* Render HTML inside a .ql-editor wrapper so lists/tables look correct */}
          <Box
            bg="gray.50"
            p={4}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
            w="100%"
            minH="100px"
            className="ql-editor"
          >
            <Box as="div" dangerouslySetInnerHTML={{ __html: html }} />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

const CommonTemplate = () => {
  const params = useParams();
  const apiUrl = getEnvironment();
  const toast = useToast();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const IdConf = params.confid;
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [showHtml, setShowHtml] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [editableHtmlContent, setEditableHtmlContent] = useState("");

  const [conferences, setConferences] = useState([]);
  const [selectedImportConf, setSelectedImportConf] = useState("");
  const [importTemplates, setImportTemplates] = useState([]);
  const [loadingImport, setLoadingImport] = useState(false);
  const [conferenceNames, setConferenceNames] = useState({});

  const [showPreview, setShowPreview] = useState(() => {
    const saved = localStorage.getItem("ct_showPreview");
    return saved ? JSON.parse(saved) : true; // default = true
  });
  useEffect(() => {
    localStorage.setItem("ct_showPreview", JSON.stringify(showPreview));
  }, [showPreview]);

  const initialData = {
    confId: IdConf,
    pageTitle: "",
    description: "", // HTML for backward compatibility
    descriptionDelta: null, // ✅ NEW: Delta format for round-trip editing
    feature: true,
  };
  const [formData, setFormData] = useState(initialData);
  const [editID, setEditID] = useState();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const editorApiRef = useRef(null);

  // HTML -> quill-better-table converter
  const parseHtmlTablesToQuillFormat = (htmlString) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    const tables = tempDiv.querySelectorAll("table");

    tables.forEach((table) => {
      const rows = [];
      let maxCols = 0;

      const collect = (nodeList) => {
        nodeList.forEach((tr) => {
          const cells = tr.querySelectorAll("th, td");
          const rowData = [];
          cells.forEach((cell) => {
            const colspan = parseInt(cell.getAttribute("colspan") || "1");
            const rowspan = parseInt(cell.getAttribute("rowspan") || "1");
            rowData.push({ content: cell.textContent.trim(), colspan, rowspan });
          });
          rows.push(rowData);
          maxCols = Math.max(maxCols, rowData.reduce((sum, cell) => sum + cell.colspan, 0));
        });
      };

      collect(table.querySelectorAll("thead tr"));
      collect(table.querySelectorAll("tbody tr"));
      if (rows.length === 0) collect(table.querySelectorAll("tr"));

      if (rows.length === 0 || maxCols === 0) return;

      const colWidth = Math.floor(600 / maxCols);
      const colgroup = Array(maxCols).fill(0).map(() => `<col width="${colWidth}">`).join("");

      let quillTableHtml = `<div class="quill-better-table-wrapper"><table class="quill-better-table"><colgroup>${colgroup}</colgroup><tbody>`;
      rows.forEach((row, rowIndex) => {
        const rowId = `row-${Date.now()}-${rowIndex}`;
        quillTableHtml += `<tr data-row="${rowId}">`;
        row.forEach((cell, cellIndex) => {
          const cellId = `cell-${Date.now()}-${rowIndex}-${cellIndex}`;
          quillTableHtml += `<td data-row="${rowId}" rowspan="${cell.rowspan}" colspan="${cell.colspan}">`;
          quillTableHtml += `<p class="qlbt-cell-line" data-row="${rowId}" data-cell="${cellId}" data-rowspan="${cell.rowspan}" data-colspan="${cell.colspan}">`;
          quillTableHtml += cell.content || "";
          quillTableHtml += `</p></td>`;
        });
        quillTableHtml += `</tr>`;
      });
      quillTableHtml += `</tbody></table></div>`;
      table.outerHTML = quillTableHtml;
    });

    return tempDiv.innerHTML;
  };

  const fetchConferences = async () => {
    try {
      const res = await axios.get(`${apiUrl}/conferencemodule/conf`, { withCredentials: true });
      const conferenceList = res.data.filter((conf) => conf._id !== IdConf);
      setConferences(conferenceList);

      const names = await Promise.all(
        conferenceList.map(async (conf) => {
          try {
            const nameRes = await axios.get(`${apiUrl}/conferencemodule/home/conf/${conf._id}`, { withCredentials: true });
            return { confId: conf._id, confName: nameRes.data.confName };
          } catch {
            return { confId: conf._id, confName: `Conference ${conf._id}` };
          }
        })
      );
      const map = {};
      names.forEach(({ confId, confName }) => (map[confId] = confName));
      setConferenceNames(map);
    } catch (error) {
      console.error("Error fetching conferences:", error);
      toast({
        title: "Error",
        description: "Failed to fetch conferences for import.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchImportTemplates = async (confId) => {
    if (!confId) return;
    setLoadingImport(true);
    try {
      const res = await axios.get(`${apiUrl}/conferencemodule/commontemplate/conference/${confId}`, { withCredentials: true });
      setImportTemplates(res.data);
    } catch (error) {
      console.error("Error fetching import templates:", error);
      toast({
        title: "Error",
        description: "Failed to fetch templates from selected conference.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingImport(false);
    }
  };

  const handleImportTemplate = async (template) => {
    try {
      // ✅ Import both HTML and Delta if available
      const newTemplateData = {
        confId: IdConf,
        pageTitle: template.pageTitle,
        description: template.description,
        descriptionDelta: template.descriptionDelta || null, // Import delta if available
        feature: template.feature,
      };

      const res = await axios.post(`${apiUrl}/conferencemodule/commontemplate`, newTemplateData, {
        withCredentials: true,
      });
      const saved = res.data;

      setSelectedTemplate(saved);
      setEditID(saved._id);

      if (editorApiRef.current) {
        // ✅ Prefer Delta over HTML for import
        if (saved.descriptionDelta) {
          editorApiRef.current.setDelta(saved.descriptionDelta);
        } else {
          const convertedHtml = parseHtmlTablesToQuillFormat(template.description || "");
          editorApiRef.current.setHTML(convertedHtml);
        }
        
        setFormData(prev => ({ 
          ...prev, 
          description: template.description,
          descriptionDelta: saved.descriptionDelta,
          pageTitle: template.pageTitle, 
          feature: template.feature 
        }));
        setHtmlContent(template.description);
        setEditableHtmlContent(template.description);
      }

      onImportClose();
      setRefresh((p) => p + 1);

      toast({
        title: "Page Imported!",
        description: "The page has been successfully imported and added to your pages.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error importing template:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import the selected template.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOpenImport = () => {
    fetchConferences();
    onImportOpen();
  };

  const handleImportConfChange = (e) => {
    const confId = e.target.value;
    setSelectedImportConf(confId);
    if (confId) fetchImportTemplates(confId);
    else setImportTemplates([]);
  };

  useEffect(() => {
    if (selectedTemplate) {
      setFormData({
        confId: selectedTemplate.confId,
        pageTitle: selectedTemplate.pageTitle || "",
        description: selectedTemplate.description || "",
        descriptionDelta: selectedTemplate.descriptionDelta || null, // ✅ Load delta
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
    axios
      .get(`${apiUrl}/conferencemodule/commontemplate/conference/${IdConf}`, { withCredentials: true })
      .then((res) => {
        setData(res.data);
        
        // ✅ DEBUG: Check what we're loading
        if (res.data.length > 0) {
          const firstTemplate = res.data[0];
          console.log("Loaded template:", firstTemplate);
          console.log("Has descriptionDelta?", !!firstTemplate.descriptionDelta);
          if (firstTemplate.descriptionDelta) {
            console.log("Delta content:", firstTemplate.descriptionDelta);
            const deltaStr = JSON.stringify(firstTemplate.descriptionDelta);
            console.log("Has newline in cell?", deltaStr.includes("\\n"));
            console.log("Has image embed?", deltaStr.includes('"image"'));
          }
        }

        if (!selectedTemplate && res.data.length > 0) {
          setSelectedTemplate(res.data[0]);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [refresh, IdConf]);

  // ✅ Load selected template into the editor with proper Delta support
  useEffect(() => {
    if (!editorApiRef.current || !selectedTemplate) return;

    // ✅ Prefer Delta over HTML for loading
    if (selectedTemplate.descriptionDelta) {
      console.log("Loading from Delta:", selectedTemplate.descriptionDelta);
      editorApiRef.current.setDelta(selectedTemplate.descriptionDelta);
      setFormData(prev => ({ ...prev, description: selectedTemplate.description || "" }));
      setHtmlContent(selectedTemplate.description || "");
      setEditableHtmlContent(selectedTemplate.description || "");
    } else {
      // Fallback to HTML conversion for legacy data
      console.log("Loading from HTML (legacy):", selectedTemplate.description);
      const raw = selectedTemplate.description || "";
      const converted = parseHtmlTablesToQuillFormat(raw);
      editorApiRef.current.setHTML(converted);
      setFormData(prev => ({ ...prev, description: converted }));
      setHtmlContent(converted);
      setEditableHtmlContent(converted);
    }
  }, [selectedTemplate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "feature" ? value === "true" : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ✅ Get both HTML and Delta before saving
    const currentDelta = editorApiRef.current?.getDelta();
    const currentHtml = editorApiRef.current?.getHTML();
    
    const submitData = {
      ...formData,
      description: currentHtml || formData.description,
      descriptionDelta: currentDelta, // ✅ Save Delta for round-trip editing
    };

    console.log("Submitting:", submitData);

    axios
      .post(`${apiUrl}/conferencemodule/commontemplate`, submitData, {
        withCredentials: true,
      })
      .then((res) => {
        const saved = res.data;
        setSelectedTemplate(saved);
        setEditID(saved._id);
        setRefresh((p) => p + 1);
        toast({ title: "Page added", status: "success", duration: 2000, isClosable: true });
      })
      .catch((err) => console.log(err));
  };

  const handleUpdate = () => {
    // ✅ Get both HTML and Delta before updating
    const currentDelta = editorApiRef.current?.getDelta();
    const currentHtml = editorApiRef.current?.getHTML();
    
    const updateData = {
      ...formData,
      description: currentHtml || formData.description,
      descriptionDelta: currentDelta, // ✅ Save Delta for round-trip editing
    };

    console.log("Updating:", updateData);

    axios
      .put(`${apiUrl}/conferencemodule/commontemplate/${editID}`, updateData, {
        withCredentials: true,
      })
      .then((res) => {
        const updated = res.data || { ...selectedTemplate, ...updateData };
        setData((prev) => prev.map((tpl) => (tpl._id === editID ? updated : tpl)));
        setSelectedTemplate(updated);
        toast({ title: "Page updated", status: "success", duration: 2000, isClosable: true });
      })
      .catch((err) => console.log(err));
  };

  const handleDelete = (deleteID) => {
    setDeleteItemId(deleteID);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`${apiUrl}/conferencemodule/commontemplate/${deleteItemId}`, {
        withCredentials: true,
      })
      .then(() => {
        setShowDeleteConfirmation(false);
        setFormData(initialData);
        setSelectedTemplate(null);
        setEditID(null);
        setRefresh((p) => p + 1);
        if (editorApiRef.current) {
          editorApiRef.current.setHTML("");
          setHtmlContent("");
          setEditableHtmlContent("");
        }
      })
      .catch((err) => console.log(err));
  };

  const handleTemplateSelect = (template) => setSelectedTemplate(template);

  const handleAddNewTemplate = () => {
    setSelectedTemplate(null);
    setFormData(initialData);
    setEditID(null);
    if (editorApiRef.current) {
      editorApiRef.current.setHTML("");
      setHtmlContent("");
      setEditableHtmlContent("");
    }
  };

  const toggleHtmlView = () => {
    if (editorApiRef.current) {
      const html = editorApiRef.current.getHTML();
      setHtmlContent(html);
      setEditableHtmlContent(html);
    }
    setShowHtml(!showHtml);
  };

  const copyHtmlToClipboard = () => {
    const html = editorApiRef.current?.getHTML() || "";
    navigator.clipboard
      .writeText(html)
      .then(() =>
        toast({
          title: "HTML Copied!",
          description: "The HTML content has been copied to your clipboard.",
          status: "success",
          duration: 2000,
          isClosable: true,
        })
      )
      .catch(() =>
        toast({
          title: "Copy Failed",
          description: "Failed to copy HTML content to clipboard.",
          status: "error",
          duration: 2000,
          isClosable: true,
        })
      );
  };

  const copyObjectIdToClipboard = () => {
    if (selectedTemplate && selectedTemplate._id) {
      navigator.clipboard
        .writeText(selectedTemplate._id)
        .then(() =>
          toast({
            title: "Object ID Copied!",
            description: "The Object ID has been copied to your clipboard.",
            status: "success",
            duration: 2000,
            isClosable: true,
          })
        )
        .catch(() =>
          toast({
            title: "Copy Failed",
            description: "Failed to copy Object ID to your clipboard.",
            status: "error",
            duration: 2000,
            isClosable: true,
          })
        );
    }
  };

  const handleHtmlContentChange = (e) => setEditableHtmlContent(e.target.value);

  const applyHtmlChanges = () => {
    if (!editorApiRef.current) return;
    try {
      const convertedHtml = parseHtmlTablesToQuillFormat(editableHtmlContent);
      editorApiRef.current.setHTML(convertedHtml);
      setFormData((prev) => ({ ...prev, description: convertedHtml }));
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
      console.error("Error applying HTML:", error);
      toast({
        title: "Invalid HTML",
        description: "The HTML content contains errors and could not be applied.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const TemplateTabs = () => (
    <Box width="100%" mb={4}>
      <HStack justifyContent="space-between" alignItems="center" mb={2}>
        <Heading as="h3" size="sm" color="gray.600">
          Pages:
        </Heading>
        {isMobile && (
          <Button colorScheme="blue" size="sm" onClick={handleAddNewTemplate}>
            Add Page
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
          data.map((template, idx) => (
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
                bg: selectedTemplate?._id === template._id ? "blue.600" : "gray.50",
              }}
              transition="all 0.2s"
            >
              <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                {template.pageTitle || `Template ${idx + 1}`}
              </Text>
              <Text
                fontSize="xs"
                color={selectedTemplate?._id === template._id ? "whiteAlpha.800" : "gray.600"}
                noOfLines={2}
              >
                {template.metaDescription || "No description"}
              </Text>
              {/* ✅ DEBUG: Show if template has Delta */}
              <Text fontSize="xs" color={selectedTemplate?._id === template._id ? "whiteAlpha.600" : "gray.400"}>
                {template.descriptionDelta ? "📄 Delta" : "🌐 HTML"}
              </Text>
            </Box>
          ))
        ) : (
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
        {/* Top bar: Import + Preview toggle */}
        <Box mb={4}>
          <HStack w="full" align="center">
            {/* Left group */}
            <HStack spacing={3}>
              <Button colorScheme="orange" onClick={handleAddNewTemplate} mb="4" size="md">
                Add New Page
              </Button>
              <Button colorScheme="green" onClick={handleOpenImport} mb="4" size="md">
                Import data
              </Button>
            </HStack>

            {/* Push the preview button to the right */}
            <Spacer />

            {/* Right-aligned Preview toggle */}
            <Button
              variant="outline"
              colorScheme={showPreview ? "purple" : "blue"}
              onClick={() => setShowPreview(v => !v)}
              size="md"
              aria-pressed={showPreview}
              isDisabled={isMobile}
              title={isMobile ? "Preview panel is desktop-only" : ""}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </HStack>
        </Box>

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
              <TemplateTabs />
            </Box>
          )}

          <Flex flex="1" width={{ base: "100%", md: "85%" }} direction={{ base: "column", lg: "row" }}>
            {/* Form / Editor Section */}
            <Box
              width={showPreview ? { base: "100%", lg: "50%" } : "100%"}
              p={4}
              overflowY="auto"
              height={showPreview ? "auto" : { base: "auto", lg: "100vh" }}
              position={showPreview ? "static" : { lg: "sticky" }}
              top={0}
            >
              <Container maxW="full">
                <Center>
                  <Heading as="h1" size="xl" mt="2" mb="6" color="tw-bg-slate-100" textDecoration="underline">
                    {selectedTemplate ? `Edit Page Content` : "Create New Page"}
                  </Heading>
                </Center>

                {selectedTemplate && (
                  <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={4} mb={6}>
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
                      <Button size="sm" colorScheme="blue" leftIcon={<Copy size={16} />} onClick={copyObjectIdToClipboard}>
                        Copy ID
                      </Button>
                    </HStack>
                  </Box>
                )}

                <form onSubmit={handleSubmit}>
                  {isMobile && <TemplateTabs />}

                  <FormControl isRequired mb="3">
                    <FormLabel>Page Title:</FormLabel>
                    <Input type="text" name="pageTitle" value={formData.pageTitle} onChange={handleChange} placeholder="Page Title" mb="2.5" />
                  </FormControl>

                  <FormControl isRequired mb="3">
                    <FormLabel>Description:</FormLabel>
                    <HStack spacing={2} mb={3}>
                      <Button colorScheme="purple" size="sm" onClick={toggleHtmlView}>
                        {showHtml ? "Hide HTML" : "Show HTML"}
                      </Button>
                      {!isMobile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview((v) => !v)}
                          aria-pressed={showPreview}
                        >
                          {showPreview ? "Hide Preview" : "Show Preview"}
                        </Button>
                      )}
                    </HStack>

                    {/* ✅ Updated QuillEditor with Delta support */}
                    <QuillEditor
                      ref={editorApiRef}
                      // ✅ Use Delta as source of truth
                      valueDelta={formData.descriptionDelta}
                      onChangeDelta={(delta) => {
                        setFormData((prev) => ({ ...prev, descriptionDelta: delta }));
                      }}
                      // Optional HTML for preview
                      value={formData.description}
                      onChange={(html) => {
                        setFormData((prev) => ({ ...prev, description: html }));
                      }}
                      onToggleHtml={toggleHtmlView}
                      height={showPreview ? 250 : 650}
                    />

                    {showHtml && (
                      <Box bg="white" border="1px solid" borderColor="gray.300" borderRadius="md" p={4} mb={4} mt={4}>
                        <HStack justifyContent="space-between" alignItems="center" mb={3}>
                          <Heading as="h4" size="sm" color="gray.700">
                            HTML Content (Editable)
                          </Heading>
                          <HStack spacing={2}>
                            <Button colorScheme="orange" size="sm" onClick={applyHtmlChanges}>
                              Apply Changes
                            </Button>
                            <Button colorScheme="green" size="sm" onClick={copyHtmlToClipboard}>
                              Copy HTML
                            </Button>
                          </HStack>
                        </HStack>
                        <Textarea
                          value={editableHtmlContent || "<p>No content yet...</p>"}
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

                  <FormControl isRequired mb="3">
                    <FormLabel>Featured:</FormLabel>
                    <Select name="feature" value={formData.feature} onChange={handleChange}>
                      <option value={true}>Yes</option>
                      <option value={false}>No</option>
                    </Select>
                  </FormControl>

                  <HStack spacing={4} justify="center" mt={6}>
                    <Button colorScheme="blue" onClick={editID ? handleUpdate : handleSubmit} size="lg" type={editID ? "button" : "submit"}>
                      {editID ? "Update Page" : "Add Page"}
                    </Button>
                    {selectedTemplate && (
                      <Button colorScheme="red" onClick={() => handleDelete(selectedTemplate._id)} size="lg">
                        Delete Page
                      </Button>
                    )}
                  </HStack>
                </form>
              </Container>
            </Box>

            {/* Live Preview panel (desktop only, toggled) */}
            {!isMobile && showPreview && (
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
                <LivePreviewSection title={formData.pageTitle} html={formData.description} />
              </Box>
            )}
          </Flex>
        </Flex>
      </Flex>

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Page from Another Conference</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Select Conference:</FormLabel>
                <Select placeholder="Choose a conference..." value={selectedImportConf} onChange={handleImportConfChange}>
                  {conferences.map((conf) => (
                    <option key={conf._id} value={conf._id}>
                      {conferenceNames[conf._id] || `Conference ${conf._id}`}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {selectedImportConf && (
                <Box>
                  <Heading as="h4" size="md" mb={3}>
                    Available Pages:
                  </Heading>
                  {loadingImport ? (
                    <Center p={4}>
                      <LoadingIcon />
                    </Center>
                  ) : importTemplates.length > 0 ? (
                    <VStack spacing={3} align="stretch">
                      {importTemplates.map((template) => (
                        <Box
                          key={template._id}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          p={4}
                          bg="white"
                          _hover={{ bg: "gray.50" }}
                        >
                          <HStack justifyContent="space-between" alignItems="start">
                            <VStack align="start" spacing={2} flex={1}>
                              <Text fontWeight="bold" fontSize="lg" color="blue.600">
                                {template.pageTitle || "Untitled Template"}
                              </Text>
                              <Text fontSize="sm" color="gray.600">Featured: {template.feature ? "Yes" : "No"}</Text>
                              <Text fontSize="sm" color="gray.700" noOfLines={3}>
                                <span dangerouslySetInnerHTML={{ __html: template.description?.substring(0, 150) + "..." || "No description" }} />
                              </Text>
                            </VStack>
                            <Button colorScheme="green" size="sm" onClick={() => handleImportTemplate(template)}>
                              Import
                            </Button>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No pages found in selected conference
                    </Text>
                  )}
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onImportClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
          <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
            <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
              Are you sure you want to delete this page?
            </p>
            <div className="tw-flex tw-justify-center">
              <Button colorScheme="red" onClick={confirmDelete} mr={4}>
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

export default CommonTemplate;