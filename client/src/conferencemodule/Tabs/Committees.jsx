import React, { useState, useEffect ,useRef} from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
import { Container } from "@chakra-ui/layout";
import JoditEditor from 'jodit-react';

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
const Committees = () => {
    const params = useParams();
    const ref = useRef(null);

const IdConf = params.confid;
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);  const apiUrl = getEnvironment();


    const initialData = {
        "confId": IdConf,
        "type": "",
        "description": "",
        "sequence": "",
        "feature": true
    };
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { confId, type, description, sequence, feature } = formData;
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        } else if (name === "feature") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = (e) => {
        // e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/committee`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/committee/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
                setEditID(null)
            })
            .catch(err => console.log(err));
    };
    const handleEditorChange = (value) => {
        setFormData({
            ...formData,
            description: value,
        });
    };
    const handleDelete = (deleteID) => {
        setDeleteItemId(deleteID);
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        axios.delete(`${apiUrl}/conferencemodule/committee/${deleteItemId}`, {
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
        axios.get(`${apiUrl}/conferencemodule/committee/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/committee/conference/${IdConf}`, {
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
                    Create a New Committee
                </Heading>


                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Type of the Committee :</FormLabel>
                    <Input
                        type="text"
                        name="type"
                        value={type}
                        onChange={handleChange}
                        placeholder="type"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Description :</FormLabel>
                    <JoditEditor
                        ref={ref}
                        value={description}
                        name="description"
                        onBlur={handleEditorChange}
                        classname='tw-mb-5'
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
                    Existing Committees </Heading>
                {!loading ? (

                    <TableContainer>
                        <Table
                            variant='striped'
                            size="md"
                            mt="1"
                        >
                            <Thead>
                                <Tr>
                                <CustomTh> Type</CustomTh>
                                
                                    <CustomTh>Description</CustomTh>
                                    <CustomTh>Sequence</CustomTh>
                                    <CustomTh>Featured</CustomTh>

                                    <CustomTh position={'sticky'} right={'0'}>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>                                        
                                    <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.type}</Td>



                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.description}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>{item.sequence}</Td>
                                        <Td sx={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}><Center>{item.feature?"Yes":"No"}</Center></Td>

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
            )}        </main>
    );
};

export default Committees;
