import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button,
    Select, Checkbox, Switch, Text, Box, HStack, VStack,
    Table, Tbody, Td, Thead, Tr, Badge, Center, Tooltip,
} from "@chakra-ui/react";
import { FaBars, FaPlus, FaSave, FaArrowUp, FaArrowDown } from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid, Span2,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "purple";

const emptyLink = { label: "", linkType: "custom", templateId: "", url: "", order: 0 };
const initialForm = {
    section: "left",
    label: "",
    linkType: "custom",
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
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [formData, setFormData] = useState(initialForm);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!confId) return;
        setLoading(true);

        Promise.all([
            axios.get(`${apiUrl}/conferencemodule/navitem/conf/${confId}`, { withCredentials: true }),
            axios.get(`${apiUrl}/conferencemodule/commontemplate/conference/${confId}`, { withCredentials: true }),
            axios.get(`${apiUrl}/conferencemodule/conf/${confId}`, { withCredentials: true }),
        ])
            .then(([navRes, tplRes, confRes]) => {
                setItems(navRes.data || []);
                setTemplates(tplRes.data || []);
                setNavbarMode(confRes.data?.navbarMode || "static");
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false));
    }, [confId, refresh, apiUrl]);

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
        const payload = { ...formData, confId };
        axios.post(`${apiUrl}/conferencemodule/navitem`, payload, { withCredentials: true })
            .then(() => {
                resetForm();
                setRefresh((r) => r + 1);
            })
            .catch((err) => console.log(err));
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/navitem/${editId}`, formData, { withCredentials: true })
            .then(() => {
                resetForm();
                setRefresh((r) => r + 1);
            })
            .catch((err) => console.log(err));
    };

    const handleEdit = (item) => {
        window.scrollTo(0, 0);
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
            <Td><Badge colorScheme={ACCENT}>{item.section}</Badge></Td>
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
                <ThemedTh accent={ACCENT}>Section</ThemedTh>
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
            />

            <Box
                bg="white"
                borderRadius="2xl"
                boxShadow="md"
                borderLeft="5px solid"
                borderLeftColor={navbarMode === "dynamic" ? "green.400" : "gray.300"}
                p={5}
                mb={6}
            >
                <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">Use backend-driven navbar on the public site</Text>
                        <Text fontSize="sm" color="gray.600">
                            When enabled, the public conference site fetches its navbar from this admin panel instead of using its hardcoded menu.
                        </Text>
                    </VStack>
                    <Switch size="lg" isChecked={navbarMode === "dynamic"} onChange={handleModeToggle} colorScheme="green" />
                </HStack>
                <Text fontSize="sm" mt="2">
                    Current mode: <Badge colorScheme={navbarMode === "dynamic" ? "green" : "gray"}>{navbarMode}</Badge>
                </Text>
            </Box>

            <FormCard
                title={editId ? "Edit Menu Item" : "Add Menu Item"}
                accent={ACCENT}
                isEditing={!!editId}
                actions={
                    <>
                        <Button
                            colorScheme={ACCENT}
                            size="lg"
                            px={10}
                            leftIcon={editId ? <FaSave /> : <FaPlus />}
                            onClick={editId ? handleUpdate : handleSubmit}
                        >
                            {editId ? "Update" : "Add"}
                        </Button>
                        {editId && <Button size="lg" onClick={resetForm}>Cancel</Button>}
                    </>
                }
            >
                <FieldGrid>
                    <FormControl isRequired mb="2">
                        <FormLabel>Label</FormLabel>
                        <Input name="label" value={formData.label} onChange={handleChange} placeholder="e.g. Tracks" />
                    </FormControl>

                    <FormControl mb="2">
                        <FormLabel>Section</FormLabel>
                        <Select name="section" value={formData.section} onChange={handleChange}>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                        </Select>
                    </FormControl>

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
            </FormCard>

            {!loading ? (
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
            ) : <Center py={10}><LoadingIcon /></Center>}

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
