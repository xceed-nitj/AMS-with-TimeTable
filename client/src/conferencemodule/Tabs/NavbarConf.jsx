import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button,
    Table, Tbody, Td, Thead, Tr, Center,
} from '@chakra-ui/react';
import { FaWindowMaximize, FaPlus, FaSave } from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "pink";

const NavbarConf = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const apiUrl = getEnvironment();

    const initialData = {
        "confId": IdConf,
        "heading": "",
        "subHeading": "",
        "url": "",
        "name": "",
    }

    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState({});
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { heading, subHeading, url, name, sequence } = formData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "feature") {
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
        if (data && Object.keys(data).length !== 0) {
            window.alert('You can Add only one Navbar for one conference');
            setFormData(initialData)
        }
        else {
            axios.post(`${apiUrl}/conferencemodule/navbar`, formData, {
                withCredentials: true
            })
                .then(res => {
                    setData(res.data);
                    setFormData(initialData);
                    setRefresh(refresh + 1);
                })
                .catch(err => {
                    console.log(err);
                    console.log(formData);
                });
        }
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/navbar/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/navbar/${deleteItemId}`, {
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
        axios.get(`${apiUrl}/conferencemodule/navbar/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/navbar/conf/${IdConf}`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <PageShell>
            <PageHeader
                icon={FaWindowMaximize}
                title="Navbar"
                subtitle="Brand heading, sub-heading and logo shown in the public site's navigation bar. Only one entry per conference."
                accent={ACCENT}
            />

            <FormCard
                title={editID ? 'Update Navbar' : 'Add Navbar'}
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
                        <FormLabel>Heading:</FormLabel>
                        <Input
                            type="text"
                            name="heading"
                            value={heading}
                            onChange={handleChange}
                            placeholder="Heading"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Sub Heading:</FormLabel>
                        <Input
                            type="text"
                            name="subHeading"
                            value={subHeading}
                            onChange={handleChange}
                            placeholder="Sub Heading"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Name:</FormLabel>
                        <Input
                            type="text"
                            name="name"
                            value={name}
                            onChange={handleChange}
                            placeholder="Name"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Url :</FormLabel>
                        <Input
                            type="text"
                            name="url"
                            value={url}
                            onChange={handleChange}
                            placeholder="Url"
                            mb='2.5'
                        />
                    </FormControl>
                </FieldGrid>
            </FormCard>

            {!loading ? (
                <TableCard title="Added Information" count={data && data._id ? 1 : 0} accent={ACCENT}>
                    <Table variant='striped' size="md">
                        <Thead>
                            <Tr>
                                <ThemedTh accent={ACCENT}>Heading</ThemedTh>
                                <ThemedTh accent={ACCENT}>Sub Heading</ThemedTh>
                                <ThemedTh accent={ACCENT}>Name</ThemedTh>
                                <ThemedTh accent={ACCENT}>Url</ThemedTh>
                                <ThemedTh accent={ACCENT} position={'sticky'} right={'0'}>Action</ThemedTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data ? (
                                <Tr key={data._id}>
                                    <WrapTd>{data.heading}</WrapTd>
                                    <WrapTd>{data.subHeading}</WrapTd>
                                    <WrapTd>{data.name}</WrapTd>
                                    <WrapTd>{data.url}</WrapTd>
                                    <Td position={'sticky'} right={'0'} bg="white">
                                        <RowActions
                                            onEdit={() => { handleEdit(data._id); setEditID(data._id); }}
                                            onDelete={() => handleDelete(data._id)}
                                        />
                                    </Td>
                                </Tr>) :
                                <EmptyRow colSpan={5} message="No navbar entry yet — add one above." />
                            }
                        </Tbody>
                    </Table>
                </TableCard>
            ) : <Center py={10}><LoadingIcon /></Center>}

            <DeleteModal
                isOpen={showDeleteConfirmation}
                onCancel={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                label="this navbar entry"
            />
        </PageShell>
    );
};

export default NavbarConf;
