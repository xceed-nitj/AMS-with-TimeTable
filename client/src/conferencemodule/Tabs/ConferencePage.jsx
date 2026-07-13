import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import {
    FormControl, FormLabel, Center, Input, Button,
    Table, Tbody, Td, Thead, Tr, Box,
} from '@chakra-ui/react';
import { CustomLink } from '../utils/customStyles'
import { FaCalendarAlt, FaPlus, FaSave } from "react-icons/fa";
import {
    PageHeader, FormCard, FieldGrid,
    TableCard, ThemedTh, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";
import getEnvironment from "../../getenvironment";

const ACCENT = "blue";

const ConferencePage = () => {
    const apiUrl = getEnvironment();

    const [formData, setFormData] = useState({
        "email": "",
        "name": ""
    });

    const [editID, setEditID] = useState();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);

    const { email, name } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        axios.post(`${apiUrl}/conferencemodule/conf`, formData, {
            withCredentials: true
        })
            .then(res => {
                setData([...data, res.data]);
                setFormData({
                    "email": "",
                    "name": ""
                });
                setRefresh(refresh - 1);
            })
            .catch(err => console.log(err));
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/conf/${editID}`, formData, { withCredentials: true })
            .then(res => {
                setFormData({
                    email: "",
                    name: "",
                });
                setEditID(null);
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(formData);
                console.log(err);
            });
    };

    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/conf/${deleteItemId}`, {
            withCredentials: true
        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setShowDeleteConfirmation(false);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/conf/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/conf`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <main className="tw-min-h-screen tw-bg-slate-100 tw-py-8">
            <Box px={{ base: 3, md: 5 }} maxW="1600px" mx="auto">
                <PageHeader
                    icon={FaCalendarAlt}
                    title="Conferences"
                    subtitle="Create a conference and assign an organiser by email."
                    accent={ACCENT}
                />

                <FormCard
                    title={editID ? 'Update Conference' : 'Create a New Conference'}
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
                            <FormLabel>Name of the Conference :</FormLabel>
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
                            <FormLabel>Email:</FormLabel>
                            <Input
                                type="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                placeholder="E-mail"
                                mb='2.5'
                            />
                        </FormControl>
                    </FieldGrid>
                </FormCard>

                {!loading ? (
                    <TableCard title="Existing Conferences" count={data.length} accent={ACCENT}>
                        <Table variant='striped' size="md">
                            <Thead>
                                <Tr>
                                    <ThemedTh accent={ACCENT}>Conference Name</ThemedTh>
                                    <ThemedTh accent={ACCENT}>Email</ThemedTh>
                                    <ThemedTh accent={ACCENT}>Link</ThemedTh>
                                    <ThemedTh accent={ACCENT}>Action</ThemedTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data
                                    .sort((a, b) => b._id.localeCompare(a._id))
                                    .map((item) => (
                                        <Tr key={item._id}>
                                            <Td><Center>{item.name}</Center></Td>
                                            <Td><Center>{item.email}</Center></Td>
                                            <Td><Center>
                                                <Link key={item._id} to={`/cf/${item._id}`}>
                                                    <CustomLink>
                                                        Click Here
                                                    </CustomLink>
                                                </Link>
                                            </Center>
                                            </Td>
                                            <Td>
                                                <RowActions
                                                    onEdit={() => { handleEdit(item._id); setEditID(item._id); }}
                                                    onDelete={() => handleDelete(item._id)}
                                                />
                                            </Td>
                                        </Tr>))) :
                                    <EmptyRow colSpan={4} message="No conferences yet — create your first conference above." />
                                }
                            </Tbody>
                        </Table>
                    </TableCard>
                ) : <Center py={10}><LoadingIcon /></Center>}

                <DeleteModal
                    isOpen={showDeleteConfirmation}
                    onCancel={() => setShowDeleteConfirmation(false)}
                    onConfirm={confirmDelete}
                    label="this conference"
                />
            </Box>
        </main>
    );
};

export default ConferencePage;
