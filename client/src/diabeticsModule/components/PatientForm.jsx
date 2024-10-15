import React, { useState, useEffect } from 'react';
import getEnvironment from '../../getenvironment';
import {
    Box,
    Center,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    Text,
    chakra,
} from "@chakra-ui/react";
import { Button} from "@chakra-ui/button";

function patientForm(){
    const [patientData, setPatientData] = useState({
        name: '',
        age: '',
        // weight: '',
        // height: '',
        medicalHistory: '',
        // family: '',
        email: '',
        contactNumber: '',
        address: '',
        password: ''
        // hospital: '' // This will store the selected hospital's objectId
    });

    const apiUrl = getEnvironment();

    // const [allHospitals, setAllHospitals] = useState([]); // For storing fetched hospitals
    // const [selectedHospitalId, setSelectedHospitalId] = useState(''); // For tracking selected hospital

    // Fetch existing hospitals from backend
    // useEffect(() => {
    //     fetch(`${apiUrl}/diabeticsmodule/hospital/all`,{credentials: 'include'})
    //     .then(handleResponse)
    //     .then((data) => {
    //         setAllHospitals(data);
    //     })
    //     .catch(handleError);
    //     // console.log(allHospitals);
    // }, []);

    //handle responses of api call
    const handleResponse = (response) => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json(); 
    };

    //handle error occurred
    const handleError = (error) => {
        console.error("Error:", error);
    };

    // Handle patient input change
    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatientData({ ...patientData, [name]: value });
    };

    // Set the selected hospital
    // const handleHospitalSelect = (e) => {
    //     setSelectedHospitalId(e.target.value);
    //     setPatientData({ ...patientData, hospital: e.target.value });
    // };

    // Submit the patient form
    const handleSubmit = async (e) => {
        e.preventDefault();

        fetch(`${apiUrl}/diabeticsmodule/patient/add`,{
            method : "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        })
        .then(handleResponse)
        .catch(handleError)
        .finally(() => {
            setPatientData({
                name: '',
                age: '',
                // weight: '',
                // height: '',
                medicalHistory: '',
                // family: '',
                email: '',
                contactNumber: '',
                address: '',
                password: '',
                // hospital: ''
            });
            // setSelectedHospitalId(''); // Reset the selected hospital
        });
    };

    return (
        <chakra.form onSubmit={handleSubmit}>
            <FormControl isRequired>
                <FormLabel>Enter Name : </FormLabel>
                <Input
                    type="text"
                    name="name"
                    placeholder="Patient Name"
                    value={patientData.name}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl>

            <FormControl isRequired>
                <FormLabel>Enter Email : </FormLabel>
                <Input
                    type="email"
                    name="email"
                    placeholder="Patient Email"
                    value={patientData.email}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl>

            <FormControl >
                <FormLabel>Enter Password : </FormLabel>
                <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={patientData.password}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl>

            <FormControl isRequired>
                <FormLabel>Enter Contact : </FormLabel>
                <Input
                    type="tel"
                    name="contactNumber"
                    placeholder="Patient Contact"
                    value={patientData.contactNumber}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl>

            <FormControl isRequired>
                <FormLabel>Enter age : </FormLabel>
                <Input
                    type="number"
                    name="age"
                    placeholder="Patient Age"
                    value={patientData.age}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl>

            {/* <FormControl isRequired>
                <FormLabel>Enter Weight : </FormLabel>
                <Input
                    type="number"
                    name="weight"
                    placeholder="Patient Weight"
                    value={patientData.weight}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl> */}

            {/* <FormControl isRequired>
                <FormLabel>Enter Height : </FormLabel>
                <Input
                    type="number"
                    name="height"
                    placeholder="Patient Height"
                    value={patientData.height}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl> */}

            <FormControl>
                <FormLabel>Enter Medical History : </FormLabel>
                <Input
                    type='text'
                    name="medicalHistory"
                    placeholder="Patient Medical History"
                    value={patientData.medicalHistory}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl>

            {/* <FormControl isRequired>
                <FormLabel>Enter Family : </FormLabel>
                <Input
                    type='text'
                    name="family"
                    placeholder="Patient Family"
                    value={patientData.family}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl> */}

            <FormControl isRequired>
                <FormLabel>Enter Address : </FormLabel>
                <Input
                    type='text'
                    name="address"
                    placeholder="Patient Address"
                    value={patientData.address}
                    onChange={handlePatientChange}
                    size='sm'
                    variant='outline'
                />
            </FormControl>

            {/* <FormControl isRequired>
                <FormLabel>Select Hospital</FormLabel>
                <Select
                    value={selectedHospitalId}
                    onChange={(e) => setSelectedHospitalId(e.target.value)}
                >
                    <option value="" disabled>
                        Select Hospital
                    </option>
                    {allHospitals.map((hospital) => (
                        <option key={hospital._id} value={hospital._id}>
                            {hospital.name} - {hospital.location}
                        </option>
                    ))}
                </Select>
            </FormControl> */}

            <Button type="submit">Add Patient</Button>
        </chakra.form>
    );
};

export default patientForm;