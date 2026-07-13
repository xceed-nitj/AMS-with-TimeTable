import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import JoditEditor from 'jodit-react';
import {
    FormControl, FormLabel, Input, Button, Select,
    Table, Tbody, Td, Thead, Tr, Badge, Center,
} from '@chakra-ui/react';
import { FaTrophy, FaPlus, FaSave } from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid, Span2,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "yellow";

const Awards = () => {
    const params = useParams();
    const apiUrl = getEnvironment();
    const ref = useRef(null);

    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const initialData = {
        confId: IdConf,
        title1: "",
        title2: "",
        description: "",
        sequence: 0,
        featured: true,
        new: true,
        hidden: true,
        link: ""
    };
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState();
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);

    const { title1, title2, description, link, sequence } = formData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "featured" || name === "new" || name === "hidden") {
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
    const handleEditorChange = (value) => {
        setFormData({
            ...formData,
            description: value,
        });
    };
    const handleSubmit = (e) => {
        axios.post(`${apiUrl}/conferencemodule/awards`, formData, {
            withCredentials: true
        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/awards/${editID}`, formData, {
            withCredentials: true
        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
                setEditID(null)
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/awards/${deleteItemId}`, { withCredentials: true })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setShowDeleteConfirmation(false);
                setRefresh(refresh + 1);
                setFormData(initialData);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        window.scrollTo(0, 0);

        axios.get(`${apiUrl}/conferencemodule/awards/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/awards/conference/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => setLoading(false));

        console.log(data);
    }, [refresh]);

    return (
        <PageShell>
            <PageHeader
                icon={FaTrophy}
                title="Awards"
                subtitle="Conference awards, prizes and recognitions."
                accent={ACCENT}
            />

            <FormCard
                title={editID ? 'Update Award' : 'Add a New Award'}
                accent={ACCENT}
                isEditing={!!editID}
                actions={
                    <Button
                        colorScheme={ACCENT}
                        size="lg"
                        px={10}
                        leftIcon={editID ? <FaSave /> : <FaPlus />}
                        type={editID ? "button" : "submit"}
                        onClick={() => { editID ? handleUpdate() : handleSubmit() }}
                    >
                        {editID ? 'Update' : 'Add'}
                    </Button>
                }
            >
                <FieldGrid>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Title-1 :</FormLabel>
                        <Input
                            type="text"
                            name="title1"
                            value={title1}
                            onChange={handleChange}
                            placeholder="Title-1"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Title-2:</FormLabel>
                        <Input
                            type="text"
                            name="title2"
                            value={title2}
                            onChange={handleChange}
                            placeholder="Title-2"
                            mb='2.5'
                        />
                    </FormControl>
                    <Span2>
                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Description :</FormLabel>
                            <JoditEditor
                                ref={ref}
                                value={description}
                                name="description"
                                onBlur={handleEditorChange}
                                classname='tw-mb-5'
                            />
                        </FormControl>
                    </Span2>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Link :</FormLabel>
                        <Input
                            type="text"
                            name="link"
                            value={link}
                            onChange={handleChange}
                            placeholder="Link"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true}>
                        <FormLabel>Sequence :</FormLabel>
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
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Hidden:</FormLabel>
                        <Select
                            name="hidden"
                            value={formData.hidden}
                            onChange={handleChange}
                        >
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                        </Select>
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>New:</FormLabel>
                        <Select
                            name="new"
                            value={formData.new}
                            onChange={handleChange}
                        >
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                        </Select>
                    </FormControl>
                </FieldGrid>
            </FormCard>

            {!loading ? (
                <TableCard title="Existing Awards" count={data.length} accent={ACCENT}>
                    <Table variant='striped' size="md">
                        <Thead>
                            <Tr>
                                <ThemedTh accent={ACCENT}>Title-1</ThemedTh>
                                <ThemedTh accent={ACCENT}>Title-2</ThemedTh>
                                <ThemedTh accent={ACCENT}>Description</ThemedTh>
                                <ThemedTh accent={ACCENT}>Link</ThemedTh>
                                <ThemedTh accent={ACCENT}>Sequence</ThemedTh>
                                <ThemedTh accent={ACCENT}>Featured</ThemedTh>
                                <ThemedTh accent={ACCENT}>New</ThemedTh>
                                <ThemedTh accent={ACCENT}>Hidden</ThemedTh>
                                <ThemedTh accent={ACCENT} position={'sticky'} right={'0'}>Action</ThemedTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data.length > 0 ? (data.map((item) => (
                                <Tr key={item._id}>
                                    <WrapTd>{item.title1}</WrapTd>
                                    <WrapTd>{item.title2}</WrapTd>
                                    <WrapTd>{item.description}</WrapTd>
                                    <WrapTd>{item.link}</WrapTd>
                                    <WrapTd><Center>{item.sequence}</Center></WrapTd>
                                    <WrapTd><Center><Badge colorScheme={item.featured ? "green" : "gray"}>{item.featured ? "Yes" : "No"}</Badge></Center></WrapTd>
                                    <WrapTd><Center><Badge colorScheme={item.new ? "blue" : "gray"}>{item.new ? "Yes" : "No"}</Badge></Center></WrapTd>
                                    <WrapTd><Center><Badge colorScheme={item.hidden ? "red" : "gray"}>{item.hidden ? "Yes" : "No"}</Badge></Center></WrapTd>
                                    <Td position={'sticky'} right={'0'} bg="white">
                                        <RowActions
                                            onEdit={() => { handleEdit(item._id); setEditID(item._id); }}
                                            onDelete={() => handleDelete(item._id)}
                                        />
                                    </Td>
                                </Tr>))) :
                                <EmptyRow colSpan={9} message="No awards yet — add your first award above." />
                            }
                        </Tbody>
                    </Table>
                </TableCard>
            ) : <Center py={10}><LoadingIcon /></Center>}

            <DeleteModal
                isOpen={showDeleteConfirmation}
                onCancel={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                label="this award"
            />
        </PageShell>
    );
};

export default Awards;
