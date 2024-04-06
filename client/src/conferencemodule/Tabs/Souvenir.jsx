import React, { useState, useEffect, useRef } from "react";
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

const Souvenir = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();

    const initialData = {
        "confId": IdConf,
        "location": "",
        "price": "",
        "description": "",
        "featured": true,
        "sequence": ""
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState({});
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);


    const { description, location, price, featured, sequence } = formData;

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
        // e.preventDefault();


        axios.post(`${apiUrl}/conferencemodule/souvenir`, formData, { withCredentials: true })
            .then(res => {
                setData(res.data);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });


    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/souvenir/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/souvenir/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/souvenir/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/souvenir/conf/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <main className='tw-py-10 lg:tw-pl-72 tw-min-h-screen'>

            <Container maxW='5xl' >
                <Center><Heading as="h1" size="xl" mt="6" mb="6">
                    Souvenir
                </Heading></Center>




                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Location:</FormLabel>
                    <Input
                        type="text"
                        name="location"
                        value={location}
                        onChange={handleChange}
                        placeholder="Location"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Price:</FormLabel>
                    <Input
                        type="text"
                        name="price"
                        value={price}
                        onChange={handleChange}
                        placeholder="Price"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Description :</FormLabel>
                    <Input
                        type="text"
                        name="description"
                        value={description}
                        onChange={handleChange}
                        placeholder="Description"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
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
                    <FormLabel >Feature:</FormLabel>
                    <Select
                        name="feature"
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
                    Added Souvenirs </Heading>
                {!loading ? (

                    <TableContainer>
                        <Table
                            variant='striped'
                            size="md"
                            mt="1"
                        >
                            <Thead>
                                <Tr>
                                    <CustomTh> Location</CustomTh>
                                    <CustomTh> Price</CustomTh>
                                    <CustomTh>Description</CustomTh>
                                    <CustomTh>Sequence</CustomTh>
                                    <CustomTh>Feature</CustomTh>

                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>
                                        <Td><Center>{item.location}</Center></Td>
                                        <Td><Center>{item.price}</Center></Td>
                                        <Td><Center>{item.description}</Center></Td>
                                        <Td><Center>{item.sequence}</Center></Td>
                                        <Td><Center>{item.featured ?"Yes":"No"}</Center></Td>


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
                                            <Td colSpan="6" className="tw-p-1 tw-text-center">
                                                <Center>No data available</Center></Td>
                                        </Tr>
                                    )
                                }
                            </Tbody>
                        </Table>
                    </TableContainer>
                )

                    : <LoadingIcon />
                }
            </Container >
        </main>
    );
};

export default Souvenir;
