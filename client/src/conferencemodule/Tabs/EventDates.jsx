import React, { useState, useEffect } from "react";
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
import {
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/table";
const EventDates = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();


    const initialData = {
        "confId": IdConf,
        "title": "",
        "date": "",
        "sequence": "",
        "extended": false,
        "newDate": "",
        "completed": true,
        "featured": true
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, date, newDate, sequence } = formData;

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
        else if (name === "completed") {
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

        axios.post(`${apiUrl}/conferencemodule/eventDates`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/eventDates/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
                setEditID(null)
            })
            .catch(err => console.log(formData, err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/eventDates/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        window.scrollTo(0, 0);
        axios.get(`${apiUrl}/conferencemodule/eventDates/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/eventDates/conference/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <main className='tw-py-10  lg:tw-pl-72 tw-min-h-screen'>
            

            <Container maxW='5xl'>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Add a New Event-Date
                </Heading>
               

                <FormControl isRequired={true} >
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

                    <FormLabel>Date:</FormLabel>
                    <Input

                        type="date"
                        name="date"
                        value={date}
                        onChange={handleChange}
                        placeholder="Date"
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
                    <FormLabel >Is Date Extended:</FormLabel>
                    <Select
                        name="extended"
                        value={formData.extended}
                        onChange={handleChange}
                    >
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </Select>
                </FormControl>
                <FormControl isRequired>

                    <FormLabel>New Date:</FormLabel>
                    <Input

                        type="date"
                        name="newDate"
                        value={newDate}
                        onChange={handleChange}
                        placeholder="New Date if Extended"
                        mb='2.5'
                    />

                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Completed:</FormLabel>
                    <Select
                        name="completed"
                        value={formData.completed}
                        onChange={handleChange}
                    >
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </Select>
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Featured:</FormLabel>
                    <Select
                        name="featured"
                        value={formData.featured}
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
                    Added Event Dates </Heading>
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
                                    <CustomTh>Date</CustomTh>
                                    <CustomTh>Extended</CustomTh>
                                    <CustomTh>Completed</CustomTh>
                                    <CustomTh>New Date</CustomTh>
                                    <CustomTh>Sequence</CustomTh>


                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>
                                        <Td><Center>{item.title}</Center></Td>
                                        <Td><Center>{item.date}</Center></Td>
                                        <Td><Center>{item.extended ? 'Yes' : 'No'}</Center></Td>
                                        <Td><Center>{item.completed ? 'Yes' : 'No'}</Center></Td>
                                        <Td><Center>{item.newDate}</Center></Td>

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
                                            <Td colSpan="7" className="tw-p-1 tw-text-center">
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

export default EventDates;
