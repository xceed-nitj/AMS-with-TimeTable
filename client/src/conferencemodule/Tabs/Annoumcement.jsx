import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import {
    FormControl, FormErrorMessage, FormLabel, Center, Heading,
    Input, Button, Select
} from '@chakra-ui/react';
import { CustomTh, CustomLink, CustomBlueButton } from '../utils/customStyles'
import {Table,TableContainer,Tbody,Td,Th,Thead,Tr,} from "@chakra-ui/table";
import JoditEditor from 'jodit-react';

const Announcement = () => {
    const params = useParams();
    const apiUrl = getEnvironment();
    const ref = useRef(null);
    const IdConf = params.confid;
    const initialData = {
        "confId": IdConf,
        "title": "",
        "metaDescription": "",
        "description": "",
        "sequence": "",
        "feature": true,
        "new": true,
        "hidden": true,
        "link": ""
    };
    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, metaDescription, description, link, sequence } = formData;

    const handleEditorChange = (value) => {
        setFormData({
            ...formData,
            description: value,
        });
    };
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
        else if (name === "new") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        } else if (name === "hidden") {
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
        // e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/announcements`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/announcements/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
                setEditID(null);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        setLoading(true)
        axios.delete(`${apiUrl}/conferencemodule/announcements/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/announcements/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/announcements/conf/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
                console.log(res.data);

            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <main className='tw-py-10  lg:tw-pl-72 tw-min-h-screen'>

            <Container maxW='5xl'>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Create a New Announcement
                </Heading>


                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Title:</FormLabel>
                    <Input
                        type="text"
                        name="title"
                        value={title}
                        onChange={handleChange}
                        placeholder="Title"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired>

                    <FormLabel>Meta Description:</FormLabel>
                    <Input

                        type="text"
                        name="metaDescription"
                        value={metaDescription}
                        onChange={handleChange}
                        placeholder="Meta Description"
                        mb='2.5'
                    />

                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Description :</FormLabel>
                    {/* <Input
                        type="text"
                        name="description"
                        value={description}
                        onChange={handleChange}
                        placeholder="Description"
                        mb='2.5'
                    /> */}

                    <JoditEditor
                        ref={ref}
                        value={description}
                        name="description"
                        onChange={handleEditorChange}
                        classname='tw-mb-5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel > Link  :</FormLabel>
                    <Input
                        type="text"
                        name="link"
                        value={link}
                        onChange={handleChange}
                        placeholder="Link"
                        mb='2.5'
                    />
                </FormControl>

                <FormControl isRequired={true}  >

                    <FormLabel >Sequence :</FormLabel>
                    <Input

                        type="number"
                        name="sequence"
                        value={sequence}
                        onChange={handleChange}
                        placeholder="sequence"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Featured:</FormLabel>
                    <Select
                        name="featured"
                        value={formData.feature}
                        onChange={handleChange}
                    >
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </Select>
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Hidden:</FormLabel>
                    <Select
                        name="hidden"
                        value={formData.hidden}
                        onChange={handleChange}
                    >
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </Select>
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >New:</FormLabel>
                    <Select
                        name="new"
                        value={formData.new}
                        onChange={handleChange}
                    >
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </Select>
                </FormControl>

                <Center>
                    <Button colorScheme="blue" type={editID ? "button" : "submit"} onClick={() => { editID ? handleUpdate() : handleSubmit() }}>
                        {editID ? 'Update' : 'Add'}
                    </Button>
                </Center>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Added Announcements </Heading>
                {!loading ? (

                    <TableContainer>
                        <Table
                            variant='striped'
                            size="md"
                            mt="1"
                        >
                            <Thead>
                                <Tr>
                                    <CustomTh> Title</CustomTh>
                                    <CustomTh>Meta Description</CustomTh>
                                    <CustomTh>Link</CustomTh>
                                    <CustomTh>Sequence</CustomTh>


                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>
                                        <Td><Center>{item.title}</Center></Td>
                                        <Td><Center>{item.metaDescription}</Center></Td>
                                        <Td><Center>{item.link}</Center></Td>

                                        <Td><Center>{item.sequence}</Center></Td>

                                        <Td><Center>
                                            <Button colorScheme="red" onClick={() => handleDelete(item._id)}>Delete </Button>
                                            <Button colorScheme="teal" onClick={() => {
                                                handleEdit(item._id);
                                                setEditID(item._id);
                                            }}>Edit </Button>
                                        </Center></Td>

                                    </Tr>))) :
                                    (
                                        <Tr>
                                            <Td colSpan="5" className="tw-p-1 tw-text-center">
                                                <Center>No data available</Center></Td>
                                        </Tr>
                                    )
                                }
                            </Tbody>
                        </Table>
                    </TableContainer>
                )

                    : <LoadingIcon />
                } </Container>
        </main>
    );
};

export default Announcement;
