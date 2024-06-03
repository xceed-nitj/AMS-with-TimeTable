import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormErrorMessage, FormLabel, Center, Heading, Input, Button } from '@chakra-ui/react';
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
import getEnvironment from "../../getenvironment";
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
        axios.delete(`${apiUrl}/conferencemodule/conf/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
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
        <Container maxW='5xl'>
            <Heading as="h1" size="xl" mt="6" mb="6">
                Create a New Conference
            </Heading>


            <FormControl isRequired={true} mb='3' >
                <FormLabel >Name of the Conference :</FormLabel>
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
            <Center>
              
                    <Button colorScheme="blue" type={editID ? "button" : "submit"} onClick={() => { editID ? handleUpdate() : handleSubmit() }}>
                        {editID ? 'Update' : 'Add'}
                    </Button>

            </Center>
            <Heading as="h1" size="xl" mt="6" mb="6">
                Existing Conferences </Heading>
            {!loading ? (

                <TableContainer>
                    <Table
                        variant='striped'
                        size="md"
                        mt="1"
                    >
                        <Thead>
                            <Tr>
                                <CustomTh>Conference Name</CustomTh>
                                <CustomTh>Email</CustomTh>
                                <CustomTh>Link</CustomTh>
                                <CustomTh>Action</CustomTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data.length > 0 ? (data.map((item) => (
                                <Tr key={item._id}>
                                    <Td><Center>{item.name}</Center></Td>
                                    <Td><Center>{item.email}</Center></Td>
                                    <Td><Center>
                                        <Link key={item._id} to={`/cf/${item._id}`}>
                                            <CustomLink >
                                                Click Here
                                            </CustomLink>
                                        </Link>
                                    </Center>
                                    </Td>
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
    );
};

export default ConferencePage;
