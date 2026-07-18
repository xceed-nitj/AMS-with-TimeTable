import React, { useState, useEffect } from "react";
import axios from 'axios';
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import {
    FormControl, FormLabel, Input, Button,
    Table, Tbody, Td, Thead, Tr, Center,
} from '@chakra-ui/react';
import { useParams } from "react-router-dom";
import { FaUserFriends, FaPlus, FaSave } from "react-icons/fa";
import {
    PageShell, PageHeader, FormCard, FieldGrid, Span2,
    TableCard, ThemedTh, WrapTd, RowActions, EmptyRow, DeleteModal,
} from "../components/ui";

const ACCENT = "orange";

const Participants = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const apiUrl = getEnvironment();

    const initialData = {
        "confId": IdConf,
        "authorName": "",
        "authorDesignation": "",
        "authorInstitute": "",
        "paperTitle": "",
        "paperId": "",
    };
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState();
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);

    const { authorName, authorDesignation, authorInstitute, paperTitle, paperId } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        axios.post(`${apiUrl}/conferencemodule/participant`, formData, {
            withCredentials: true
        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData)
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/participant/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/participant/${deleteItemId}`, {
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
        axios.get(`${apiUrl}/conferencemodule/participant/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/participant/conf/${IdConf}`, {
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
                icon={FaUserFriends}
                title="Participants"
                subtitle="Authors and accepted papers registered for the conference."
                accent={ACCENT}
            />

            <FormCard
                title={editID ? 'Update Participant' : 'Add a New Participant'}
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
                        <FormLabel>Author Name:</FormLabel>
                        <Input
                            type="text"
                            name="authorName"
                            value={authorName}
                            onChange={handleChange}
                            placeholder="Author Name"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Designation of Author:</FormLabel>
                        <Input
                            type="text"
                            name="authorDesignation"
                            value={authorDesignation}
                            onChange={handleChange}
                            placeholder="Designation"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Institute of Author:</FormLabel>
                        <Input
                            type="text"
                            name="authorInstitute"
                            value={authorInstitute}
                            onChange={handleChange}
                            placeholder="Instuitute"
                            mb='2.5'
                        />
                    </FormControl>
                    <FormControl isRequired={true} mb='3'>
                        <FormLabel>Paper Id:</FormLabel>
                        <Input
                            type="text"
                            name="paperId"
                            value={paperId}
                            onChange={handleChange}
                            placeholder="Paper Id"
                            mb='2.5'
                        />
                    </FormControl>
                    <Span2>
                        <FormControl isRequired={true} mb='3'>
                            <FormLabel>Title of Paper:</FormLabel>
                            <Input
                                type="text"
                                name="paperTitle"
                                value={paperTitle}
                                onChange={handleChange}
                                placeholder="Paper Title"
                                mb='2.5'
                            />
                        </FormControl>
                    </Span2>
                </FieldGrid>
            </FormCard>

            {!loading ? (
                <TableCard title="Existing Participants" count={data.length} accent={ACCENT}>
                    <Table variant='striped' size="md">
                        <Thead>
                            <Tr>
                                <ThemedTh accent={ACCENT}>Name of Author</ThemedTh>
                                <ThemedTh accent={ACCENT}>Designation</ThemedTh>
                                <ThemedTh accent={ACCENT}>Institute</ThemedTh>
                                <ThemedTh accent={ACCENT}>Paper Id</ThemedTh>
                                <ThemedTh accent={ACCENT}>Paper Title</ThemedTh>
                                <ThemedTh accent={ACCENT} position={'sticky'} right={'0'}>Action</ThemedTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data.length > 0 ? (data.map((item) => (
                                <Tr key={item._id}>
                                    <WrapTd>{item.authorName}</WrapTd>
                                    <WrapTd>{item.authorDesignation}</WrapTd>
                                    <WrapTd>{item.authorInstitute}</WrapTd>
                                    <WrapTd>{item.paperId}</WrapTd>
                                    <WrapTd>{item.paperTitle}</WrapTd>
                                    <Td position={'sticky'} right={'0'} bg="white">
                                        <RowActions
                                            onEdit={() => { handleEdit(item._id); setEditID(item._id); }}
                                            onDelete={() => handleDelete(item._id)}
                                        />
                                    </Td>
                                </Tr>))) :
                                <EmptyRow colSpan={6} message="No participants yet — add your first participant above." />
                            }
                        </Tbody>
                    </Table>
                </TableCard>
            ) : <Center py={10}><LoadingIcon /></Center>}

            <DeleteModal
                isOpen={showDeleteConfirmation}
                onCancel={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                label="this participant"
            />
        </PageShell>
    );
};

export default Participants;
