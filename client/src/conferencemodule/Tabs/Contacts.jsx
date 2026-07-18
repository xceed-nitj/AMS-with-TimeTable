import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button, Select,
    Table, Tbody, Td, Thead, Tr, Badge, Center,
} from '@chakra-ui/react';
import { FaAddressBook, FaPlus, FaSave } from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "red";

const Contacts = () => {
    const params = useParams();
    const apiUrl = getEnvironment();

    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const initialData = {
        "confId": IdConf,
        "title": "",
        "name": "",
        "designation": "",
        "imgLink": "",
        "institute": "",
        "profileLink": "",
        "phone": "",
        "email": "",
        "fax": "",
        "feature": true,
        "sequence": ""
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, name, designation, imgLink, institute, profileLink, phone, email, fax, sequence } = formData;

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
        axios.post(`${apiUrl}/conferencemodule/contactUs`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/contactUs/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/contactUs/${deleteItemId}`, {
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
        axios.get(`${apiUrl}/conferencemodule/contactUs/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/contactUs/conference/${IdConf}`, {
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
                icon={FaAddressBook}
                title="Contacts"
                subtitle="Contact persons shown on the conference site's Contact page."
                accent={ACCENT}
            />

            <FormCard
                title={editID ? 'Update Contact Details' : 'Add New Contact Details'}
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
                            placeholder="title"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Name :</FormLabel>
                        <Input
                            type="text"
                            name="name"
                            value={name}
                            onChange={handleChange}
                            placeholder="name"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Designation:</FormLabel>
                        <Input
                            type="text"
                            name="designation"
                            value={designation}
                            onChange={handleChange}
                            placeholder="Designation"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Institute:</FormLabel>
                        <Input
                            type="text"
                            name="institute"
                            value={institute}
                            onChange={handleChange}
                            placeholder="Institute"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Profile Link:</FormLabel>
                        <Input
                            type="text"
                            name="profileLink"
                            value={profileLink}
                            onChange={handleChange}
                            placeholder="Profile Link"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Image Link :</FormLabel>
                        <Input
                            type="text"
                            name="imgLink"
                            value={imgLink}
                            onChange={handleChange}
                            placeholder="ImageLink"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Phone:</FormLabel>
                        <Input
                            type="text"
                            name="phone"
                            value={phone}
                            onChange={handleChange}
                            placeholder="Phone No."
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>E-mail:</FormLabel>
                        <Input
                            type="text"
                            name="email"
                            value={email}
                            onChange={handleChange}
                            placeholder="E-mail"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Fax :</FormLabel>
                        <Input
                            type="text"
                            name="fax"
                            value={fax}
                            onChange={handleChange}
                            placeholder="Fax"
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
                            name="feature"
                            value={formData.feature}
                            onChange={handleChange}
                        >
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                        </Select>
                    </FormControl>
                </FieldGrid>
            </FormCard>

            {!loading ? (
                <TableCard title="Existing Contacts" count={data.length} accent={ACCENT}>
                    <Table variant='striped' size="md">
                        <Thead>
                            <Tr>
                                <ThemedTh accent={ACCENT}>Title</ThemedTh>
                                <ThemedTh accent={ACCENT}>Name</ThemedTh>
                                <ThemedTh accent={ACCENT}>Designation</ThemedTh>
                                <ThemedTh accent={ACCENT}>Institute</ThemedTh>
                                <ThemedTh accent={ACCENT}>Phone</ThemedTh>
                                <ThemedTh accent={ACCENT}>E-Mail</ThemedTh>
                                <ThemedTh accent={ACCENT}>Fax</ThemedTh>
                                <ThemedTh accent={ACCENT}>Featured</ThemedTh>
                                <ThemedTh accent={ACCENT}>Sequence</ThemedTh>
                                <ThemedTh accent={ACCENT} position={'sticky'} right={'0'}>Action</ThemedTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data.length > 0 ? (data.map((item) => (
                                <Tr key={item._id}>
                                    <WrapTd>{item.title}</WrapTd>
                                    <WrapTd>{item.name}</WrapTd>
                                    <WrapTd>{item.designation}</WrapTd>
                                    <WrapTd>{item.institute}</WrapTd>
                                    <WrapTd>{item.phone}</WrapTd>
                                    <WrapTd>{item.email}</WrapTd>
                                    <WrapTd>{item.fax}</WrapTd>
                                    <WrapTd maxW="100px">
                                        <Badge colorScheme={item.feature ? "green" : "gray"}>{item.feature ? "Yes" : "No"}</Badge>
                                    </WrapTd>
                                    <WrapTd maxW="100px">{item.sequence}</WrapTd>
                                    <Td position={'sticky'} right={'0'} bg="white">
                                        <RowActions
                                            onEdit={() => { handleEdit(item._id); setEditID(item._id); }}
                                            onDelete={() => handleDelete(item._id)}
                                        />
                                    </Td>
                                </Tr>))) :
                                <EmptyRow colSpan={10} message="No contacts yet — add your first contact above." />
                            }
                        </Tbody>
                    </Table>
                </TableCard>
            ) : <Center py={10}><LoadingIcon /></Center>}

            <DeleteModal
                isOpen={showDeleteConfirmation}
                onCancel={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                label="this contact"
            />
        </PageShell>
    );
};

export default Contacts;
