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
import JoditEditor from 'jodit-react';

const Location = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();
    const ref = useRef(null);

    const initialData = {
        "confId": IdConf,
        "description": "",
        "address": "",
        "latitude": "",
        "longitude": "",
        "feature": true,
        "sequence": ""
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState({});
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);


    const { description, address, latitude, longitude,sequence } = formData;

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
    const handleEditorChange = (value) => {
        setFormData({
            ...formData,
            description: value,
        });
    };
    const handleSubmit = (e) => {
        // e.preventDefault();

        if(data && Object.keys(data).length !== 0){
         window.alert('You can Add only one Location for one conference');
         setFormData(initialData)
        }
        else{
            axios.post(`${apiUrl}/conferencemodule/location`, formData, { withCredentials: true })
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
        axios.put(`${apiUrl}/conferencemodule/location/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/location/${deleteID}`, {
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
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
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
                Location
                 </Heading></Center>



                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Description:</FormLabel>
                    <JoditEditor
                        ref={ref}
                        value={description}
                        name="description"
                        onChange={handleEditorChange}
                        classname='tw-mb-5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Address:</FormLabel>
                    <Input
                        type="text"
                        name="address"
                        value={address}
                        onChange={handleChange}
                        placeholder="Address"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Latitude:</FormLabel>
                    <Input
                        type="text"
                        name="latitude"
                        value={latitude}
                        onChange={handleChange}
                        placeholder="Latitude"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Longitude :</FormLabel>
                    <Input
                        type="text"
                        name="longitude"
                        value={longitude}
                        onChange={handleChange}
                        placeholder="Longitude"
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
                        value={formData.feature}
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
                    Added Location </Heading>
                {!loading ? (

                    <TableContainer>
                        <Table
                            variant='striped'
                            size="md"
                            mt="1"
                        >
                            <Thead>
                                <Tr>
                                    <CustomTh>Description</CustomTh>
                                    <CustomTh>Address</CustomTh>
                                    <CustomTh>Latitude  </CustomTh>
                                    <CustomTh>Longitude</CustomTh>
                                    <CustomTh>Sequence</CustomTh>
                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data ? (
                                    <Tr key={data._id}>
                                        <Td><Center>{data.description}</Center></Td>
                                        <Td><Center>{data.address}</Center></Td>
                                        <Td><Center>{data.latitude}</Center></Td>
                                        <Td><Center>{data.longitude}</Center></Td>
                                        <Td><Center>{data.sequence}</Center></Td>
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

export default Location;
