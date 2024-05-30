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
const Contacts = () => {
    const params = useParams();
  const apiUrl = getEnvironment();

const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);    const initialData={
        "confId": IdConf,
        "title": "",
        "name": "",
        "designation": "",
        "imgLink": "",
        "institute": "",
        "profileLink": "",
        "phone": "",
        "email": "",
        "fax": "",
        "feature": true,
        "sequence": ""

    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, name, designation, imgLink, institute, profileLink, phone, email, fax,sequence } = formData;

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
                [name]: value==="true",
            });
        }
    
        else{
            setFormData({
                ...formData,
                [name]: value,
            });
        }
        
    };

    const handleSubmit = (e) => {
        // e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/contactUs`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/contactUs/${editID}`, formData, {
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
        axios.delete(`${apiUrl}/conferencemodule/contactUs/${deleteItemId}`, {
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
        axios.get(`${apiUrl}/conferencemodule/contactUs/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/contactUs/conference/${IdConf}`, {
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
                    Create New Contact Details
                </Heading>
       

                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Title :</FormLabel>
                    <Input
                        type="text"
                        name="title"
                        value={title}
                        onChange={handleChange}
                        placeholder="title"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Name :</FormLabel>
                    <Input
                        type="text"
                        name="name"
                        value={name}
                        onChange={handleChange}
                        placeholder="name"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired>

                    <FormLabel>Designation:</FormLabel>
                    <Input

                        type="text"
                        name="designation"
                        value={designation}
                        onChange={handleChange}
                        placeholder="Designation"
                        mb='2.5'
                    />

                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Institute:</FormLabel>
                    <Input
                        type="text"
                        name="institute"
                        value={institute}
                        onChange={handleChange}
                        placeholder="Institute"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Profile Link:</FormLabel>
                    <Input
                        type="text"
                        name="profileLink"
                        value={profileLink}
                        onChange={handleChange}
                        placeholder="Profile Link"
                        mb='2.5'
                    />
                </FormControl>

                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Image Link :</FormLabel>
                    <Input
                        type="text"
                        name="imgLink"
                        value={imgLink}
                        onChange={handleChange}
                        placeholder="ImageLink"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Phone:</FormLabel>
                    <Input
                        type="text"
                        name="phone"
                        value={phone}
                        onChange={handleChange}
                        placeholder="Phone No."
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >E-mail:</FormLabel>
                    <Input
                        type="text"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        placeholder="E-mail"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Fax :</FormLabel>
                    <Input
                        type="text"
                        name="fax"
                        value={fax}
                        onChange={handleChange}
                        placeholder="Fax"
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
                    Existing Contacts </Heading>
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
                                <CustomTh> Name</CustomTh>
                                    <CustomTh>Designation</CustomTh>
                                    <CustomTh>Institute</CustomTh>
                                    <CustomTh>Phone</CustomTh>
                                    <CustomTh>E-Mail</CustomTh>
                                    <CustomTh>Fax</CustomTh>
                                    <CustomTh>Featured</CustomTh>

                                    <CustomTh>Sequence</CustomTh>

                                    <CustomTh position={'sticky'} right={'0'}>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>
                                        
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.title}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.name}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.designation}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.institute}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.phone}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.email}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.fax}</Td>
                                        <Td sx={{ maxWidth: '100px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.feature?"Yes":"No"}</Td>
                                        <Td sx={{ maxWidth: '100px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.sequence}</Td>

                                        <Td position={'sticky'} right={'0'}><Center>
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
            )}</main>

    );
};

export default Contacts;
