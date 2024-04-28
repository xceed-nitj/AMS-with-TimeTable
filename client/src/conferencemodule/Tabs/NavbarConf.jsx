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
const NavbarConf = () => {
    const params = useParams();
    const IdConf = params.confid;
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

    const { heading, subHeading, url, name ,sequence} = formData;

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
        // e.preventDefault();
        if(data && Object.keys(data).length !== 0){
            window.alert('You can Add only one Navbar for one conference');
            setFormData(initialData)
           }
           else{

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
            });}
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
        axios.delete(`${apiUrl}/conferencemodule/navbar/${deleteID}`, {
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
        <main className='tw-py-10  lg:tw-pl-72 tw-min-h-screen'>
           
            <Container maxW='5xl' >
                <Center><Heading as="h1" size="xl" mt="6" mb="6">
                Navbar
                 </Heading></Center>



                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Heading:</FormLabel>
                    <Input
                        type="text"
                        name="heading"
                        value={heading}
                        onChange={handleChange}
                        placeholder="Heading"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Sub Heading:</FormLabel>
                    <Input
                        type="text"
                        name="subHeading"
                        value={subHeading}
                        onChange={handleChange}
                        placeholder="Sub Heading"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Name:</FormLabel>
                    <Input
                        type="text"
                        name="name"
                        value={name}
                        onChange={handleChange}
                        placeholder="Name"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Url :</FormLabel>
                    <Input
                        type="text"
                        name="url"
                        value={url}
                        onChange={handleChange}
                        placeholder="Url"
                        mb='2.5'
                    />
                </FormControl>

              

                <Center>
              
                    <Button colorScheme="blue" type={editID ? "button" : "submit"} onClick={() => { editID ? handleUpdate() : handleSubmit() }}>
                        {editID ? 'Update' : 'Add'}
                    </Button>

            </Center>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Added Information </Heading>
                {!loading ? (

                    <TableContainer>
                        <Table
                            variant='striped'
                            size="md"
                            mt="1"
                        >
                            <Thead>
                                <Tr>
                                    <CustomTh>Heading</CustomTh>
                                    <CustomTh>Sub Heading</CustomTh>
                                    <CustomTh>Name  </CustomTh>
                                    <CustomTh>Url</CustomTh>
                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data ? (
                                    <Tr key={data._id}>
                                        <Td><Center>{data.heading}</Center></Td>
                                        <Td><Center>{data.subHeading}</Center></Td>
                                        <Td><Center>{data.name}</Center></Td>
                                        <Td><Center>{data.url}</Center></Td>
                                        <Td><Center>
                                            <Button colorScheme="red" onClick={() => handleDelete(data._id)}>Delete </Button>
                                            <Button colorScheme="teal" onClick={() => {
                                                handleEdit(data._id);
                                                setEditID(data._id);
                                            }}>Edit </Button>
                                        </Center></Td>

                                    </Tr>) : (
                                    <Tr>
                                        <Td colSpan="6" className="tw-p-1 tw-text-center">
                                            <Center>No data available</Center></Td>
                                    </Tr>
                                )}
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

export default NavbarConf;
