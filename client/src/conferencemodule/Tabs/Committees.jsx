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
const Committees = () => {
    const params = useParams();
    const IdConf = params.confid;
  const apiUrl = getEnvironment();


    const initialData = {
        "ConfId": IdConf,
        "Type": "",
        "Subtype": "",
        "Name": "",
        "Designation": "",
        "Institute": "",
        "ProfileLink": "",
        "ImgLink": "",
        "sequence": "",
        "feature": true
    };
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { ConfId, Type, Subtype, Name, Designation, Institute, ProfileLink, ImgLink, sequence, feature } = formData;
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

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/committee/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh - 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
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
                        name="Type"
                        value={Type}
                        onChange={handleChange}
                        placeholder="Type"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired>

                    <FormLabel>Subtype of Committee:</FormLabel>
                    <Input

                        type="text"
                        name="Subtype"
                        value={Subtype}
                        onChange={handleChange}
                        placeholder="Subtype"
                        mb='2.5'
                    />

                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Name of the Committee :</FormLabel>
                    <Input
                        type="text"
                        name="Name"
                        value={Name}
                        onChange={handleChange}
                        placeholder="Name"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Designation of the Committee :</FormLabel>
                    <Input
                        type="text"
                        name="Designation"
                        value={Designation}
                        onChange={handleChange}
                        placeholder="Designation"
                        mb='2.5'
                    />
                </FormControl>

                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Image Link of the Committee :</FormLabel>
                    <Input
                        type="text"
                        name="ImgLink"
                        value={ImgLink}
                        onChange={handleChange}
                        placeholder="ImageLink"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Institute:</FormLabel>
                    <Input
                        type="text"
                        name="Institute"
                        value={Institute}
                        onChange={handleChange}
                        placeholder="Institute"
                        mb='2.5'
                    />
                </FormControl>
                <FormControl isRequired={true} mb='3' >
                    <FormLabel >Profile Link :</FormLabel>
                    <Input
                        type="text"
                        name="ProfileLink"
                        value={ProfileLink}
                        onChange={handleChange}
                        placeholder="ProfileLink"
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
                                <CustomTh> Subtype</CustomTh>

                                    <CustomTh> Name</CustomTh>
                                    <CustomTh>Designation</CustomTh>
                                    <CustomTh>Institute</CustomTh>
                                    <CustomTh>Sequence</CustomTh>

                                    <CustomTh>Action</CustomTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.length > 0 ? (data.map((item) => (
                                    <Tr key={item._id}>                                        <Td><Center>{item.Type}</Center></Td>
                                    <Td><Center>{item.Subtype}</Center></Td>



                                        <Td><Center>{item.Name}</Center></Td>
                                        <Td><Center>{item.Designation}</Center></Td>
                                        <Td><Center>{item.Institute}</Center></Td>
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

export default Committees;
