import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button,
    Select, Checkbox, Switch, Text, Box, HStack, VStack,
    Table, Tbody, Td, Thead, Tr, Badge, Center, Tooltip, Flex, Icon, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
} from "@chakra-ui/react";
import {
    FaBars, FaPlus, FaSave, FaArrowUp, FaArrowDown,
    FaMobileAlt, FaChevronDown, FaExternalLinkAlt, FaTimes,
} from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid, Span2,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "purple";

// Mimics the public conference site's mobile navbar drawer so admins can see
// exactly how the configured menu will be arranged (left section first, then
// right, dropdowns expandable, button items as highlighted pills).
const MobileNavPreview = ({ items, templates, confName }) => {
    const [collapsed, setCollapsed] = useState({});

    const ordered = [
        ...items.filter((i) => i.section === "left").sort((a, b) => a.order - b.order),
        ...items.filter((i) => i.section === "right").sort((a, b) => a.order - b.order),
    ];
    const menuItems = ordered.filter((i) => !i.isButton);
    const buttonItems = ordered.filter((i) => i.isButton);

    const linkHint = (it) => {
        if (it.linkType === "template") {
            const t = templates.find((tpl) => tpl._id === it.templateId);
            return t ? `page: ${t.pageTitle}` : "page: (not selected)";
        }
        return it.url || "—";
    };

    const toggle = (id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
        <Box bg="white" borderRadius="2xl" boxShadow="md" overflow="hidden">
            <Flex px={5} py={3} align="center" gap={2} borderBottom="1px solid" borderColor="gray.100">
                <Icon as={FaMobileAlt} color={`${ACCENT}.500`} />
                <Text fontWeight="bold" color={`${ACCENT}.800`}>Mobile Preview</Text>
            </Flex>
            <Center px={4} py={5} bg="gray.50">
                {/* Phone frame */}
                <Box
                    w="300px"
                    borderRadius="28px"
                    border="10px solid"
                    borderColor="gray.800"
                    overflow="hidden"
                    boxShadow="xl"
                    bg="#0f172a"
                >
                    {/* Fake navbar top bar */}
                    <Flex
                        px={3} py={2.5}
                        align="center"
                        justify="space-between"
                        style={{ background: "linear-gradient(90deg, #0a0f1e 0%, #0f172a 30%, #1e3a8a 70%, #1d4ed8 100%)" }}
                    >
                        <Icon as={FaTimes} color="whiteAlpha.800" boxSize="12px" />
                        <Text color="white" fontWeight="bold" fontSize="xs" letterSpacing="widest" noOfLines={1}>
                            {confName || "CONFERENCE"}
                        </Text>
                        <Box w="12px" />
                    </Flex>

                    {/* Open mobile menu */}
                    <Box
                        px={2.5} py={3}
                        maxH="430px"
                        overflowY="auto"
                        style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)" }}
                    >
                        {menuItems.length === 0 && buttonItems.length === 0 && (
                            <Text color="whiteAlpha.600" fontSize="xs" textAlign="center" py={8}>
                                No menu items yet — add some above to see them here.
                            </Text>
                        )}

                        {menuItems.map((item) => {
                            const hasSubs = (item.subItems || []).length > 0;
                            const isOpen = !collapsed[item._id];
                            const subs = (item.subItems || []).slice().sort((a, b) => a.order - b.order);
                            return (
                                <Box key={item._id} mb={0.5} opacity={item.isActive === false ? 0.4 : 1}>
                                    <Flex
                                        align="center"
                                        justify="space-between"
                                        px={3} py={2}
                                        borderRadius="lg"
                                        color="whiteAlpha.900"
                                        cursor={hasSubs ? "pointer" : "default"}
                                        _hover={{ bg: "whiteAlpha.200" }}
                                        onClick={hasSubs ? () => toggle(item._id) : undefined}
                                    >
                                        <Box minW={0}>
                                            <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                                                {item.label}
                                                {item.linkType === "external" && (
                                                    <Icon as={FaExternalLinkAlt} boxSize="9px" ml={1.5} color="sky.300" />
                                                )}
                                            </Text>
                                            {!hasSubs && (
                                                <Text fontSize="10px" color="whiteAlpha.500" noOfLines={1}>{linkHint(item)}</Text>
                                            )}
                                        </Box>
                                        {hasSubs && (
                                            <Icon
                                                as={FaChevronDown}
                                                boxSize="10px"
                                                color="whiteAlpha.700"
                                                transform={isOpen ? "rotate(180deg)" : "none"}
                                                transition="transform 0.2s"
                                            />
                                        )}
                                    </Flex>
                                    {hasSubs && isOpen && (
                                        <Box ml={4} pl={3} borderLeft="2px solid" borderColor="whiteAlpha.300" mb={1.5}>
                                            {subs.map((sub, i) => (
                                                <Box key={sub._id || i} px={2} py={1.5} borderRadius="md" _hover={{ bg: "whiteAlpha.100" }}>
                                                    <Text fontSize="xs" color="whiteAlpha.800" noOfLines={1}>{sub.label}</Text>
                                                    <Text fontSize="9px" color="whiteAlpha.400" noOfLines={1}>{linkHint(sub)}</Text>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}

                        {/* Highlighted button items (e.g. Register) */}
                        {buttonItems.map((item) => (
                            <Box key={item._id} pt={3} pb={1} opacity={item.isActive === false ? 0.4 : 1}>
                                <Center>
                                    <Box
                                        bg="white"
                                        color="blue.900"
                                        textAlign="center"
                                        fontWeight="bold"
                                        fontSize="sm"
                                        px={7} py={2}
                                        borderRadius="full"
                                    >
                                        {item.label}
                                    </Box>
                                </Center>
                                <Text fontSize="9px" color="whiteAlpha.500" textAlign="center" mt={1} noOfLines={1}>
                                    {linkHint(item)}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Center>
            <Box px={5} py={3} borderTop="1px solid" borderColor="gray.100">
                <Text fontSize="xs" color="gray.500">
                    Items appear in this order on the site: <b>Left</b> section first, then <b>Right</b> — each sorted by its order value. Tap a menu with sub-items to collapse/expand it.
                </Text>
            </Box>
        </Box>
    );
};

const emptyLink = { label: "", linkType: "template", templateId: "", url: "", order: 0 };
const initialForm = {
    section: "left",
    label: "",
    linkType: "template",
    templateId: "",
    url: "",
    isButton: false,
    order: 0,
    subItems: [],
};

const NavMenu = () => {
    const { confid: confId } = useParams();
    const apiUrl = getEnvironment();

    const [items, setItems] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [navbarMode, setNavbarMode] = useState("static");
    const [confName, setConfName] = useState("");
    // Split navbar = separate left & right menu groups. Remembered per
    // conference; defaults to on only when right-section items already exist.
    const [splitNavbar, setSplitNavbar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!confId) return;
        setLoading(true);

        Promise.all([
            axios.get(`${apiUrl}/conferencemodule/navitem/conf/${confId}`, { withCredentials: true }),
            axios.get(`${apiUrl}/conferencemodule/commontemplate/conference/${confId}`, { withCredentials: true }),
            axios.get(`${apiUrl}/conferencemodule/conf/${confId}`, { withCredentials: true }),
        ])
            .then(([navRes, tplRes, confRes]) => {
                const navItems = navRes.data || [];
                setItems(navItems);
                setTemplates(tplRes.data || []);
                setNavbarMode(confRes.data?.navbarMode || "static");
                setConfName(confRes.data?.name || "");
                const stored = localStorage.getItem(`confNavSplit-${confId}`);
                if (stored !== null) {
                    setSplitNavbar(stored === "true");
                } else {
                    setSplitNavbar(navItems.some((i) => i.section === "right"));
                }
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false));
    }, [confId, refresh, apiUrl]);

    const handleSplitToggle = () => {
        const next = !splitNavbar;
        setSplitNavbar(next);
        localStorage.setItem(`confNavSplit-${confId}`, String(next));
        if (!next) setFormData((prev) => ({ ...prev, section: "left" }));
    };

    const handleModeToggle = () => {
        const nextMode = navbarMode === "dynamic" ? "static" : "dynamic";
        axios.put(`${apiUrl}/conferencemodule/navitem/mode/${confId}`, { navbarMode: nextMode }, { withCredentials: true })
            .then(() => setNavbarMode(nextMode))
            .catch((err) => console.log(err));
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditId(null);
    };

    const openAddModal = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
        resetForm();
    };

    // Two items are duplicates when every meaningful field matches
    // (label, section, link target, button flag and all sub-items).
    const normalizeItem = (it) => JSON.stringify({
        section: splitNavbar ? (it.section || "left") : "left",
        label: (it.label || "").trim().toLowerCase(),
        linkType: it.linkType || "custom",
        templateId: it.linkType === "template" ? (it.templateId || "") : "",
        url: it.linkType !== "template" ? (it.url || "").trim() : "",
        isButton: !!it.isButton,
        subItems: (it.subItems || []).map((s) => ({
            label: (s.label || "").trim().toLowerCase(),
            linkType: s.linkType || "custom",
            templateId: s.linkType === "template" ? (s.templateId || "") : "",
            url: s.linkType !== "template" ? (s.url || "").trim() : "",
        })),
    });

    const isDuplicate = (candidate, excludeId = null) =>
        items.some((i) => i._id !== excludeId && normalizeItem(i) === normalizeItem(candidate));

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : (name === "order" ? parseInt(value || 0, 10) : value),
        }));
    };

    const handleSubItemChange = (idx, field, value) => {
        setFormData((prev) => {
            const subItems = [...prev.subItems];
            subItems[idx] = { ...subItems[idx], [field]: field === "order" ? parseInt(value || 0, 10) : value };
            return { ...prev, subItems };
        });
    };

    const addSubItem = () => {
        setFormData((prev) => ({ ...prev, subItems: [...prev.subItems, { ...emptyLink, order: prev.subItems.length }] }));
    };

    const removeSubItem = (idx) => {
        setFormData((prev) => ({ ...prev, subItems: prev.subItems.filter((_, i) => i !== idx) }));
    };

    const handleSubmit = () => {
        if (!formData.label.trim()) {
            toast({ title: "Label is required", status: "warning", duration: 2500, isClosable: true });
            return;
        }
        if (isDuplicate(formData)) {
            toast({ title: "Duplicate entry", description: "An identical menu item already exists.", status: "error", duration: 3000, isClosable: true });
            return;
        }
        const payload = { ...formData, section: splitNavbar ? formData.section : "left", confId };
        axios.post(`${apiUrl}/conferencemodule/navitem`, payload, { withCredentials: true })
            .then(() => {
                closeFormModal();
                setRefresh((r) => r + 1);
                toast({ title: "Menu item added", status: "success", duration: 2000, isClosable: true });
            })
            .catch((err) => {
                console.log(err);
                toast({
                    title: "Failed to add menu item",
                    description: err?.response?.data?.error || err?.response?.data?.message || err.message,
                    status: "error", duration: 4000, isClosable: true,
                });
            });
    };

    const handleUpdate = () => {
        if (!formData.label.trim()) {
            toast({ title: "Label is required", status: "warning", duration: 2500, isClosable: true });
            return;
        }
        if (isDuplicate(formData, editId)) {
            toast({ title: "Duplicate entry", description: "An identical menu item already exists.", status: "error", duration: 3000, isClosable: true });
            return;
        }
        const payload = { ...formData, section: splitNavbar ? formData.section : "left" };
        axios.put(`${apiUrl}/conferencemodule/navitem/${editId}`, payload, { withCredentials: true })
            .then(() => {
                closeFormModal();
                setRefresh((r) => r + 1);
                toast({ title: "Menu item updated", status: "success", duration: 2000, isClosable: true });
            })
            .catch((err) => {
                console.log(err);
                toast({
                    title: "Failed to update menu item",
                    description: err?.response?.data?.error || err?.response?.data?.message || err.message,
                    status: "error", duration: 4000, isClosable: true,
                });
            });
    };

    const handleEdit = (item) => {
        setFormData({
            section: item.section || "left",
            label: item.label || "",
            linkType: item.linkType || "custom",
            templateId: item.templateId || "",
            url: item.url || "",
            isButton: !!item.isButton,
            order: item.order || 0,
            subItems: (item.subItems || []).map((s) => ({
                label: s.label || "",
                linkType: s.linkType || "custom",
                templateId: s.templateId || "",
                url: s.url || "",
                order: s.order || 0,
            })),
        });
        setEditId(item._id);
        setIsFormOpen(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/navitem/${deleteId}`, { withCredentials: true })
            .then(() => {
                setShowDeleteConfirm(false);
                setDeleteId(null);
                setRefresh((r) => r + 1);
            })
            .catch((err) => console.log(err));
    };

    const moveItem = (item, direction) => {
        const sectionItems = items.filter((i) => i.section === item.section).sort((a, b) => a.order - b.order);
        const idx = sectionItems.findIndex((i) => i._id === item._id);
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sectionItems.length) return;

        const other = sectionItems[swapIdx];
        axios.put(`${apiUrl}/conferencemodule/navitem/reorder`, {
            items: [
                { id: item._id, order: other.order },
                { id: other._id, order: item.order },
            ],
        }, { withCredentials: true })
            .then(() => setRefresh((r) => r + 1))
            .catch((err) => console.log(err));
    };

    const renderLinkFields = (data, onFieldChange) => (
        <>
            <FormControl mb="2">
                <FormLabel fontSize="sm">Link Type</FormLabel>
                <Select name="linkType" value={data.linkType} onChange={(e) => onFieldChange("linkType", e.target.value)}>
                    <option value="template">Existing page (Common Template)</option>
                    <option value="custom">Custom internal path</option>
                    <option value="external">External URL</option>
                </Select>
            </FormControl>
            {data.linkType === "template" ? (
                <FormControl mb="2">
                    <FormLabel fontSize="sm">Page</FormLabel>
                    <Select
                        placeholder="Select a page"
                        value={data.templateId}
                        onChange={(e) => onFieldChange("templateId", e.target.value)}
                    >
                        {templates.map((t) => (
                            <option key={t._id} value={t._id}>{t.pageTitle}</option>
                        ))}
                    </Select>
                </FormControl>
            ) : (
                <FormControl mb="2">
                    <FormLabel fontSize="sm">{data.linkType === "external" ? "External URL" : "Path"}</FormLabel>
                    <Input
                        value={data.url}
                        onChange={(e) => onFieldChange("url", e.target.value)}
                        placeholder={data.linkType === "external" ? "https://example.com" : "/location"}
                    />
                </FormControl>
            )}
        </>
    );

    const sortedLeft = items.filter((i) => i.section === "left").sort((a, b) => a.order - b.order);
    const sortedRight = items.filter((i) => i.section === "right").sort((a, b) => a.order - b.order);

    const renderRow = (item) => (
        <Tr key={item._id}>
            <WrapTd>{item.label}</WrapTd>
            {splitNavbar && <Td><Badge colorScheme={ACCENT}>{item.section}</Badge></Td>}
            <WrapTd>{item.linkType === "template"
                ? (templates.find((t) => t._id === item.templateId)?.pageTitle || "(page)")
                : item.url}</WrapTd>
            <Td>{item.subItems?.length || 0}</Td>
            <Td>{item.isButton ? <Badge colorScheme="green">Yes</Badge> : ""}</Td>
            <Td>{item.order}</Td>
            <Td position="sticky" right="0" bg="white">
                <HStack spacing={1} justify="center">
                    <Tooltip label="Move up" hasArrow>
                        <Button size="sm" variant="outline" onClick={() => moveItem(item, "up")}><FaArrowUp /></Button>
                    </Tooltip>
                    <Tooltip label="Move down" hasArrow>
                        <Button size="sm" variant="outline" onClick={() => moveItem(item, "down")}><FaArrowDown /></Button>
                    </Tooltip>
                    <RowActions
                        onEdit={() => handleEdit(item)}
                        onDelete={() => { setDeleteId(item._id); setShowDeleteConfirm(true); }}
                    />
                </HStack>
            </Td>
        </Tr>
    );

    const tableHead = (
        <Thead>
            <Tr>
                <ThemedTh accent={ACCENT}>Label</ThemedTh>
                {splitNavbar && <ThemedTh accent={ACCENT}>Section</ThemedTh>}
                <ThemedTh accent={ACCENT}>Link</ThemedTh>
                <ThemedTh accent={ACCENT}>Sub-items</ThemedTh>
                <ThemedTh accent={ACCENT}>Button</ThemedTh>
                <ThemedTh accent={ACCENT}>Order</ThemedTh>
                <ThemedTh accent={ACCENT} position="sticky" right="0">Action</ThemedTh>
            </Tr>
        </Thead>
    );

    return (
        <PageShell>
            <PageHeader
                icon={FaBars}
                title="Navigation Menu"
                subtitle="Control the public site's menu items, dropdowns and links from here."
                accent={ACCENT}
                variant="outline"
            >
                <HStack spacing={6} wrap="wrap" justify="flex-end">
                    <Tooltip
                        hasArrow
                        label="When enabled, the public conference site fetches its navbar from this admin panel instead of using its hardcoded menu."
                    >
                        <HStack spacing={3}>
                            <VStack align="end" spacing={0.5}>
                                <Text fontSize="md" fontWeight="bold" color="gray.700">Backend-driven</Text>
                                <Badge colorScheme={navbarMode === "dynamic" ? "green" : "gray"} fontSize="0.75em" px={2}>
                                    {navbarMode}
                                </Badge>
                            </VStack>
                            <Switch size="lg" isChecked={navbarMode === "dynamic"} onChange={handleModeToggle} colorScheme="green" />
                        </HStack>
                    </Tooltip>
                    <Tooltip
                        hasArrow
                        label="Turn on only if the site places some menus on the left of the bar and others on the right. Otherwise all items go into one menu."
                    >
                        <HStack spacing={3}>
                            <Text fontSize="md" fontWeight="bold" color="gray.700">Split left/right</Text>
                            <Switch size="lg" isChecked={splitNavbar} onChange={handleSplitToggle} colorScheme={ACCENT} />
                        </HStack>
                    </Tooltip>
                    <Button size="lg" colorScheme={ACCENT} leftIcon={<FaPlus />} onClick={openAddModal}>
                        Add Menu Item
                    </Button>
                </HStack>
            </PageHeader>

            <Flex gap={6} align="flex-start" direction={{ base: "column", xl: "row" }}>
            <Box flex="1" minW={0} w="100%">

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
                        <Icon as={FaBars} color={`${ACCENT}.500`} />
                        {editId ? "Edit Menu Item" : "Add a New Menu Item"}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={5}>
                <FieldGrid>
                    <FormControl isRequired mb="2">
                        <FormLabel>Label</FormLabel>
                        <Input name="label" value={formData.label} onChange={handleChange} placeholder="e.g. Tracks" />
                    </FormControl>

                    {splitNavbar && (
                        <FormControl mb="2">
                            <FormLabel>Section</FormLabel>
                            <Select name="section" value={formData.section} onChange={handleChange}>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                            </Select>
                        </FormControl>
                    )}

                    {renderLinkFields(formData, (field, value) => setFormData((prev) => ({ ...prev, [field]: value })))}

                    <FormControl mb="2">
                        <FormLabel>Order</FormLabel>
                        <Input type="number" name="order" value={formData.order} onChange={handleChange} />
                    </FormControl>

                    <FormControl mb="2" display="flex" alignItems="flex-end">
                        <Checkbox name="isButton" isChecked={formData.isButton} onChange={handleChange}>
                            Show as a highlighted button (e.g. "Register")
                        </Checkbox>
                    </FormControl>

                    <Span2>
                        <Box borderWidth="1px" borderColor={`${ACCENT}.100`} borderRadius="xl" p={4} mb={2} bg={`${ACCENT}.50`}>
                            <HStack justify="space-between" mb="2">
                                <Text fontWeight="bold" color={`${ACCENT}.800`}>Dropdown Sub-items</Text>
                                <Button size="sm" colorScheme={ACCENT} variant="outline" leftIcon={<FaPlus />} onClick={addSubItem}>
                                    Add sub-item
                                </Button>
                            </HStack>
                            {formData.subItems.length === 0 &&
                                <Text fontSize="sm" color="gray.500">No sub-items — this will render as a single link.</Text>}
                            {formData.subItems.map((sub, idx) => (
                                <Box key={idx} borderWidth="1px" borderRadius="lg" p="3" mb="2" bg="white">
                                    <HStack justify="space-between" mb="2">
                                        <Badge colorScheme={ACCENT}>Sub-item {idx + 1}</Badge>
                                        <Button size="xs" colorScheme="red" variant="outline" onClick={() => removeSubItem(idx)}>Remove</Button>
                                    </HStack>
                                    <FieldGrid>
                                        <FormControl mb="2">
                                            <FormLabel fontSize="sm">Label</FormLabel>
                                            <Input value={sub.label} onChange={(e) => handleSubItemChange(idx, "label", e.target.value)} />
                                        </FormControl>
                                        {renderLinkFields(sub, (field, value) => handleSubItemChange(idx, field, value))}
                                    </FieldGrid>
                                </Box>
                            ))}
                        </Box>
                    </Span2>
                </FieldGrid>
                    </ModalBody>
                    <ModalFooter bg="gray.50" gap={3}>
                        <Button variant="ghost" onClick={closeFormModal}>Cancel</Button>
                        <Button
                            colorScheme={ACCENT}
                            px={8}
                            leftIcon={editId ? <FaSave /> : <FaPlus />}
                            onClick={editId ? handleUpdate : handleSubmit}
                        >
                            {editId ? "Update" : "Add"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {!loading ? (
                splitNavbar ? (
                    <>
                        <TableCard title="Left Menu" count={sortedLeft.length} accent={ACCENT}>
                            <Table variant="striped" size="sm">
                                {tableHead}
                                <Tbody>
                                    {sortedLeft.length ? sortedLeft.map(renderRow) :
                                        <EmptyRow colSpan={7} message="No items in the left menu yet." />}
                                </Tbody>
                            </Table>
                        </TableCard>

                        <TableCard title="Right Menu" count={sortedRight.length} accent={ACCENT}>
                            <Table variant="striped" size="sm">
                                {tableHead}
                                <Tbody>
                                    {sortedRight.length ? sortedRight.map(renderRow) :
                                        <EmptyRow colSpan={7} message="No items in the right menu yet." />}
                                </Tbody>
                            </Table>
                        </TableCard>
                    </>
                ) : (
                    <TableCard title="Menu Items" count={sortedLeft.length + sortedRight.length} accent={ACCENT}>
                        <Table variant="striped" size="sm">
                            {tableHead}
                            <Tbody>
                                {(sortedLeft.length + sortedRight.length) ? [...sortedLeft, ...sortedRight].map(renderRow) :
                                    <EmptyRow colSpan={6} message="No menu items yet." />}
                            </Tbody>
                        </Table>
                    </TableCard>
                )
            ) : <Center py={10}><LoadingIcon /></Center>}
            </Box>

            {/* Live mobile preview in the side panel */}
            <Box
                w={{ base: "100%", xl: "360px" }}
                flexShrink={0}
                position={{ xl: "sticky" }}
                top={{ xl: "90px" }}
            >
                <MobileNavPreview items={items} templates={templates} confName={confName} />
            </Box>
            </Flex>

            <DeleteModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                label="this menu item"
            />
        </PageShell>
    );
};

export default NavMenu;
