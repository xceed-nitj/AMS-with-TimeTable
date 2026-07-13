import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button, Select,
    Table, Tbody, Td, Thead, Tr, Badge, Center,
} from '@chakra-ui/react';
import { FaHandshake, FaPlus, FaSave } from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "green";

const Sponsors = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();

    const initialData = {
        confId: IdConf,
        name: "",
        type: "",
        logo: "",
        sequence: "",
        featured: true,
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);

    const { name, type, logo, sequence } = formData;

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

    const handleSubmit = (e) => {
        axios.post(`${apiUrl}/conferencemodule/sponsor`, formData, {
            withCredentials: true
        })
            .then((res) => {
                setData([...data, res.data]);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch((err) => {
                console.log(err);
                console.log(formData);
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/sponsor/${editID}`, formData, {
            withCredentials: true
        })
            .then((res) => {
                setFormData(initialData);
                setRefresh(refresh + 1);
                setEditID(null)
            })
            .catch((err) => {
                console.log(formData);
                console.log(err);
            });
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/sponsor/${deleteItemId}`, {
            withCredentials: true
        })
            .then((res) => {
                console.log('DELETED RECORD::::', res);
                setShowDeleteConfirmation(false);
                setRefresh(refresh + 1);
            })
            .catch((err) => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        window.scrollTo(0, 0);
        axios.get(`${apiUrl}/conferencemodule/sponsor/${editIDNotState}`, {
            withCredentials: true
        })
            .then((res) => {
                setFormData(res.data);
            })
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/sponsor/conference/${IdConf}`, {
            withCredentials: true
        })
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <PageShell>
            <PageHeader
                icon={FaHandshake}
                title="Sponsors"
                subtitle="Manage sponsor names, logos and display order for the conference site."
                accent={ACCENT}
            />

            <FormCard
                title={editID ? 'Update Sponsor' : 'Add a New Sponsor'}
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
                        <FormLabel>Name of the Sponsor :</FormLabel>
                        <Input
                            type="text"
                            name="name"
                            value={name}
                            onChange={handleChange}
                            placeholder="Name"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Type:</FormLabel>
                        <Input
                            type="text"
                            name="type"
                            value={type}
                            onChange={handleChange}
                            placeholder="Type"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Logo:</FormLabel>
                        <Input
                            type="text"
                            name="logo"
                            value={logo}
                            onChange={handleChange}
                            placeholder="Logo"
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
                        <FormLabel>Feature:</FormLabel>
                        <Select
                            name="featured"
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
                <TableCard title="Existing Sponsors" count={data.length} accent={ACCENT}>
                    <Table variant='striped' size="md">
                        <Thead>
                            <Tr>
                                <ThemedTh accent={ACCENT}>Name</ThemedTh>
                                <ThemedTh accent={ACCENT}>Type</ThemedTh>
                                <ThemedTh accent={ACCENT}>Logo</ThemedTh>
                                <ThemedTh accent={ACCENT}>Sequence</ThemedTh>
                                <ThemedTh accent={ACCENT}>Featured</ThemedTh>
                                <ThemedTh accent={ACCENT} position={'sticky'} right={'0'}>Action</ThemedTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data.length > 0 ? (data.map((item) => (
                                <Tr key={item._id}>
                                    <WrapTd>{item.name}</WrapTd>
                                    <WrapTd>{item.type}</WrapTd>
                                    <WrapTd>{item.logo}</WrapTd>
                                    <WrapTd>{item.sequence}</WrapTd>
                                    <WrapTd>
                                        <Badge colorScheme={item.featured ? "green" : "gray"}>{item.featured ? "Yes" : "No"}</Badge>
                                    </WrapTd>
                                    <Td position={'sticky'} right={'0'} bg="white">
                                        <RowActions
                                            onEdit={() => { handleEdit(item._id); setEditID(item._id); }}
                                            onDelete={() => handleDelete(item._id)}
                                        />
                                    </Td>
                                </Tr>))) :
                                <EmptyRow colSpan={6} message="No sponsors yet — add your first sponsor above." />
                            }
                        </Tbody>
                    </Table>
                </TableCard>
            ) : <Center py={10}><LoadingIcon /></Center>}

            <DeleteModal
                isOpen={showDeleteConfirmation}
                onCancel={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                label="this sponsor"
            />
        </PageShell>
    );
};

export default Sponsors;
