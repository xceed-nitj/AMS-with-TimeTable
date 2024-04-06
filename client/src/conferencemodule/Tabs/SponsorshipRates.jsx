import React, { useState, useEffect,useRef } from "react";
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
const SponsorshipRate = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();

    // Define your initial data here
    const initialData = {
        "confId": IdConf,
        "category": "",
        "price": "",
        "description": "",
        "sequence": "",
        "featured": true
    };

    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { confId, category, price, description, sequence, featured } = formData;

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

        axios.post(`${apiUrl}/conferencemodule/sponsorship-rates`, formData, {
            withCredentials: true

        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData); // Reset the form data to initialData
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });

    };

    const handleUpdate = () => {

        axios.put(`${apiUrl}/conferencemodule/sponsorship-rates/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData); // Reset the form data to initialData
                setRefresh(refresh + 1);
                setEditID(null)
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {

        axios.delete(`${apiUrl}/conferencemodule/sponsorship-rates/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/sponsorship-rates/${editIDNotState}`, {
            withCredentials: true

        })

            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true)
        axios.get(`${apiUrl}/conferencemodule/sponsorship-rates/conf/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    }, [refresh]);

    return (
        <main className='tw-py-10 lg:tw-pl-72 tw-min-h-screen'>

            <Container maxW='5xl'>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Add New Sponsorship Rate
                </Heading>


                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Category :</FormLabel>
                    <Input
                        type="text"
                        name="category"
                        value={category}
                        onChange={handleChange}
                        placeholder="Category"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired>

                    <FormLabel>Price:</FormLabel>
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
                    Added Sponsorship-Rates </Heading>
                {!loading ? (

                    <TableContainer>
                        <Table
                            variant='striped'
                            size="md"
                            mt="1"
                        >
                            <Thead>
                                <Tr>
                                    <CustomTh>Category</CustomTh>
                                    <CustomTh>Price</CustomTh>
                                    <CustomTh>Description</CustomTh>
                                    <CustomTh>Sequence</CustomTh>
                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>
                                        <Td><Center>{item.category}</Center></Td>
                                        <Td><Center>{item.price}</Center></Td>
                                        <Td><Center>{item.description}</Center></Td>
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

export default SponsorshipRate;
