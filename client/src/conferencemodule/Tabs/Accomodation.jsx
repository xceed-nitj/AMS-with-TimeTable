import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import JoditEditor from "../components/RichTextEditor";
import {
    FormControl, FormLabel, Input, Button, Select,
    Table, Tbody, Td, Thead, Tr, Center,
} from '@chakra-ui/react';
import { FaBed, FaPlus, FaSave } from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid, Span2,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "teal";

const Accomodation = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const apiUrl = getEnvironment();
    const ref = useRef(null);

    const initialData = {
        "confId": IdConf,
        "title": "",
        "description": "",
        "sequence": "",
        "featured": true
    };

    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { confId, title, description, sequence, featured } = formData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "featured") {
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

    const handleEditorChange = (value, fieldName) => {
        setFormData({
            ...formData,
            [fieldName]: value,
        });
    };

    const handleSubmit = (e) => {
        axios.post(`${apiUrl}/conferencemodule/accomodation`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/accomodation/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/accomodation/${deleteItemId}`, {
            withCredentials: true
        })
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
        axios.get(`${apiUrl}/conferencemodule/accomodation/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true)
        axios.get(`${apiUrl}/conferencemodule/accomodation/conf/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    }, [refresh]);

    return (
        <PageShell>
            <PageHeader
                icon={FaBed}
                title="Accommodation"
                subtitle="Accommodation options and details for conference attendees."
                accent={ACCENT}
            />

            <FormCard
                title={editID ? 'Update Accomodation' : 'Add Accomodation'}
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
                        <FormLabel>Title :</FormLabel>
                        <Input
                            type="text"
                            name="title"
                            value={title}
                            onChange={handleChange}
                            placeholder="Title"
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
                    <Span2>
                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Description :</FormLabel>
                            <JoditEditor
                                ref={ref}
                                value={description}
                                name="description"
                                onBlur={(value) => handleEditorChange(value, "description")}
                                classname='tw-mb-5'
                            />
                        </FormControl>
                    </Span2>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Feature:</FormLabel>
                        <Select
                            name="feature"
                            value={formData.featured}
                            onChange={handleChange}
                        >
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                        </Select>
                    </FormControl>
                </FieldGrid>
            </FormCard>

            {!loading ? (
                <TableCard title="Added Accomodations" count={data.length} accent={ACCENT}>
                    <Table variant='striped' size="md">
                        <Thead>
                            <Tr>
                                <ThemedTh accent={ACCENT}>Title</ThemedTh>
                                <ThemedTh accent={ACCENT}>Description</ThemedTh>
                                <ThemedTh accent={ACCENT}>Sequence</ThemedTh>
                                <ThemedTh accent={ACCENT} position={'sticky'} right={'0'}>Action</ThemedTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data.length > 0 ? (data.map((item) => (
                                <Tr key={item._id}>
                                    <WrapTd>{item.title}</WrapTd>
                                    <WrapTd>{item.description}</WrapTd>
                                    <WrapTd>{item.sequence}</WrapTd>
                                    <Td position={'sticky'} right={'0'} bg="white">
                                        <RowActions
                                            onEdit={() => { handleEdit(item._id); setEditID(item._id); }}
                                            onDelete={() => handleDelete(item._id)}
                                        />
                                    </Td>
                                </Tr>))) :
                                <EmptyRow colSpan={4} message="No accommodation entries yet — add your first one above." />
                            }
                        </Tbody>
                    </Table>
                </TableCard>
            ) : <Center py={10}><LoadingIcon /></Center>}

            <DeleteModal
                isOpen={showDeleteConfirmation}
                onCancel={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                label="this accommodation"
            />
        </PageShell>
    );
};

export default Accomodation;
