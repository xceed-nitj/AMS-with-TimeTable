import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import formatDate from "../utils/formatDate";
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
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);

    const IdConf = params.confid;
    const initialData = {
        "confId": IdConf,
        "confName": "",
        "confStartDate": "",
        "confEndDate": "",
        "about": [{ title: "", description: "" }],
        "youtubeLink": "",
        "instaLink": "",
        "facebookLink": "",
        "twitterLink": "",
        "logo": "",
        "shortName": "",
        "abstractLink" : "",
        "paperLink" : "",
        "regLink" : "",
        "flyerLink" : "",
        "brochureLink" : "",
        "posterLink": "",
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { confName, confStartDate, confEndDate, aboutConf, about, youtubeLink, instaLink, facebookLink, twitterLink, logo, shortName,abstractLink,paperLink,
     regLink,flyerLink,brochureLink,posterLink } = formData;
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleArrayChange = (e, index) => {
        const { name, value } = e.target;
        const newAboutIns = [...about];
        newAboutIns[index][name] = value;
        setFormData({ ...formData, about: newAboutIns });
    };
    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const handleDescriptionChange = (value, index) => {
        const newAboutIns = [...about];
        newAboutIns[index].description = value;
        setFormData({ ...formData, about: newAboutIns });
    };

    const addNewAbout = () => {
        setFormData({ ...formData, about: [...about, { title: "", description: "" }] });
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

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/home/${deleteItemId}`, {
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
                <FormLabel isRequired={true} >About:</FormLabel>

                {about.map((about, index) => (
                    <div key={index}>
                        <FormControl mb='3'    >
                            <p >Title:</p>
                            <Input
                                type="text"
                                name="title"
                                value={about.title}
                                onChange={(e) => handleArrayChange(e, index)}
                                placeholder="Title"
                            />
                        </FormControl>
                        <FormControl mb='3' >
                            <p >Description:</p>
                            <JoditEditor
                                ref={ref}
                                value={about.description}
                                onBlur={(value) => handleDescriptionChange(value, index)}
                                classname='tw-mb-5'
                            />
                        </FormControl>
                    </div>
                ))}
                <Button colorScheme="blue" onClick={addNewAbout} mb="4">Add New About</Button>

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
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Abstract Link :</FormLabel>
                    <Input
                        type="text"
                        name="abstractLink"
                        value={abstractLink}
                        onChange={handleChange}
                        placeholder="Abstract Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Registration Link :</FormLabel>
                    <Input
                        type="text"
                        name="regLink"
                        value={regLink}
                        onChange={handleChange}
                        placeholder="Registration Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Flyer Link of Conference :</FormLabel>
                    <Input
                        type="text"
                        name="flyerLink"
                        value={flyerLink}
                        onChange={handleChange}
                        placeholder="Flyer Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Brochure Link of Conference :</FormLabel>
                    <Input
                        type="text"
                        name="brochureLink"
                        value={brochureLink}
                        onChange={handleChange}
                        placeholder="Brochure Link"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Poster Link :</FormLabel>
                    <Input
                        type="text"
                        name="posterLink"
                        value={posterLink}
                        onChange={handleChange}
                        placeholder="Poster Link"
                        mb='2.5'
                    />
                </FormControl>
       
                <Center>
                    <Button colorScheme="blue" type={editID ? "button" : "submit"} onClick={() => { editID ? handleUpdate() : handleSubmit() }}>
                        {editID ? 'Update' : 'Add'}
                    </Button>
                </Center>
                <Heading as="h1" size="xl" mt="6" mb="6">
                    Added Information
                </Heading>
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
                                    <CustomTh position={'sticky'} right={'0'}>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data ? (
                                    <Tr key={data._id}>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{data.confName}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{formatDate(data.confStartDate)}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{formatDate(data.confEndDate)}</Td>
                                        <Td position={'sticky'} right={'0'}><Center>
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
            </Container>
            {showDeleteConfirmation && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
                    <div className="tw-bg-white tw-rounded tw-p-8 tw-w-96">
                        <p className="tw-text-lg tw-font-semibold tw-text-center tw-mb-4">
                            Are you sure you want to delete?
                        </p>
                        <div className="tw-flex tw-justify-center">
                            <Button
                                colorScheme="red"
                                onClick={confirmDelete}
                                mr={4}
                            >
                                Yes, Delete
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={() => setShowDeleteConfirmation(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}       
        </main>
    );
};

export default HomeConf;
