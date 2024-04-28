import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../../getenvironment";
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
import JoditEditor from 'jodit-react';

const HomeConf = () => {
    const navigate = useNavigate();
    const ref = useRef(null);

    const params = useParams();
    const apiUrl = getEnvironment();

    const IdConf = params.confid;
    const initialData = {
        "confId": IdConf,
        "confName": "",
        "confStartDate": "",
        "confEndDate": "",
        "aboutConf": "",
        "aboutIns": "",
        "youtubeLink": "",
        "instaLink": "",
        "facebookLink": "",
        "twitterLink": "",
        "logo": "",
        "shortName": ""
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { confName, confStartDate, confEndDate, aboutConf, aboutIns, youtubeLink, instaLink, facebookLink, twitterLink, logo, shortName } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        if (data) {
            window.alert('You cannot Add multiple values of this for one conference');
            setFormData(initialData)

        }
        else {
            axios.post(`${apiUrl}/conferencemodule/home`, formData, { withCredentials: true })
                .then(res => {
                    setData(res.data);
                    console.log(res.data);
                    setFormData(initialData);
                    setRefresh(refresh + 1);
                })
                .catch(err => {
                    console.log(err);
                    console.log(formData);
                });

        }

    };
    const handleEditorChange = (value, fieldName) => {
        setFormData({
            ...formData,
            [fieldName]: value,
        });
    };
    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/home/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/home/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setData(null)
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/home/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        var currentURL = window.location.href;
        const IdConf = params.confid;
        if (!currentURL.includes("/cf/" + IdConf + "/home")) {
            navigate("/cf/" + IdConf + "/home")
        }

        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/home/conf/${IdConf}`, {
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
                    About Conference
                </Heading></Center>



                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Name of the Conference :</FormLabel>
                    <Input
                        type="text"
                        name="confName"
                        value={confName}
                        onChange={handleChange}
                        placeholder="Name"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Starting Date of the Conference :</FormLabel>
                    <Input
                        type="date"
                        name="confStartDate"
                        value={confStartDate}
                        onChange={handleChange}
                        placeholder="Starting Date of the Conference"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Ending Date of the Conference :</FormLabel>
                    <Input
                        type="date"
                        name="confEndDate"
                        value={confEndDate}
                        onChange={handleChange}
                        placeholder="Ending Date of the Conference "
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >About the Conference :</FormLabel>
                    {/* <Input
                        type="text"
                        name="aboutConf"
                        value={aboutConf}
                        onChange={handleChange}
                        placeholder="About Conference"
                        mb='2.5'
                    /> */}
                    <JoditEditor
                        ref={ref}
                        value={aboutConf}
                        onChange={(value) => handleEditorChange(value, "aboutConf")}
                        classname='tw-mb-5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >About the Institute :</FormLabel>
                    <JoditEditor
                        ref={ref}
                        value={aboutIns}
                        onChange={(value) => handleEditorChange(value, "aboutIns")}
                        classname='tw-mb-5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >You Tube Link :</FormLabel>
                    <Input
                        type="text"
                        name="youtubeLink"
                        value={youtubeLink}
                        onChange={handleChange}
                        placeholder="YouTube Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Instagram Link :</FormLabel>
                    <Input
                        type="text"
                        name="instaLink"
                        value={instaLink}
                        onChange={handleChange}
                        placeholder="Instagram Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >FaceBook Link:</FormLabel>
                    <Input
                        type="text"
                        name="facebookLink"
                        value={facebookLink}
                        onChange={handleChange}
                        placeholder="FaceBook Link"
                        mb='2.5'
                    />
                </FormControl>

                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Twitter Link:</FormLabel>
                    <Input
                        type="text"
                        name="twitterLink"
                        value={twitterLink}
                        onChange={handleChange}
                        placeholder="Twitter Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Logo:</FormLabel>
                    <Input
                        type="text"
                        name="logo"
                        value={logo}
                        onChange={handleChange}
                        placeholder="Logo"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Short Name of Conference :</FormLabel>
                    <Input
                        type="text"
                        name="shortName"
                        value={shortName}
                        onChange={handleChange}
                        placeholder="Short Name"
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
                                    <CustomTh>Conference Name</CustomTh>
                                    <CustomTh>Starting Date</CustomTh>
                                    <CustomTh>Ending Date </CustomTh>
                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data ? (
                                    <Tr key={data._id}>
                                        <Td><Center>{data.confName}</Center></Td>
                                        <Td><Center>{data.confStartDate}</Center></Td>
                                        <Td><Center>{data.confEndDate}</Center></Td>
                                        <Td><Center>
                                            <Button colorScheme="red" onClick={() => handleDelete(data._id)}>Delete </Button>
                                            <Button colorScheme="teal" onClick={() => {
                                                handleEdit(data._id);
                                                setEditID(data._id);
                                            }}>Edit </Button>
                                        </Center></Td>

                                    </Tr>) : (
                                    <Tr>
                                        <Td colSpan="5" className="tw-p-1 tw-text-center">
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

export default HomeConf;
