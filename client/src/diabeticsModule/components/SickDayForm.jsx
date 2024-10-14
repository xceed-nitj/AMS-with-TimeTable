import React, { useState, useEffect } from 'react';
import getEnvironment from '../../getenvironment';
import {
    Box,
    FormControl,
    FormLabel,
    Input,
    Select,
    chakra,
    Text,
} from "@chakra-ui/react";
import { Button } from "@chakra-ui/button";

function SickDayForm() {
    const [formData, setFormData] = useState({
        patientId: '',
        data: {
            date: '',
            time: '',
            bloodSugar: '',
            carboLevel: '',
            insulin: '',
            longLastingInsulin: '',
        }
    });

    const [allPatients, setAllPatients] = useState([]);
    const apiUrl = getEnvironment();

    // Fetch patients data
    useEffect(() => {
        fetch(`${apiUrl}/diabeticsModule/patient/all`, { credentials: 'include' })
            .then(handleResponse)
            .then((data) => {
                setAllPatients(data);
            })
            .catch(handleError);
    }, []);

    // Handle API responses
    const handleResponse = (response) => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json(); 
    };

    const handleError = (error) => {
        console.error("Error:", error);
    };

    // Handle input changes for form fields
    const handleChange = (e) => {
        const { name, value } = e.target;

        // If the field is part of the data object
        if (name in formData.data) {
            setFormData(prev => ({
                ...prev,
                data: { ...prev.data, [name]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData.patientId);
        const Id = formData.patientId;
        
        fetch(`${apiUrl}/diabeticsModule/sickday/add`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(handleResponse)
            .catch(handleError)
            .finally(() => {
                // Reset form fields
                setFormData({
                    patientId: '',
                    data: {
                        date: '',
                        time: '',
                        bloodSugar: '',
                        carboLevel: '',
                        insulin: '',
                        longLastingInsulin: '',
                    }
                });
            });
    };

    return (
        <chakra.form onSubmit={handleSubmit} mt="1">
            <FormControl isRequired mt="1">
                <FormLabel>Select Patient:</FormLabel>
                <Select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                >
                    <option value="">Select Patient</option>
                    {allPatients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                            {patient.name} - {patient.age}
                        </option>
                    ))}
                </Select>
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Date:</FormLabel>
                <Input
                    type="date"
                    name="date"
                    value={formData.data.date}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Time:</FormLabel>
                <Input
                    type="time"
                    name="time"
                    value={formData.data.time}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Blood Sugar (mg/dL):</FormLabel>
                <Input
                    type="number"
                    name="bloodSugar"
                    value={formData.data.bloodSugar}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Carbohydrate Level (g):</FormLabel>
                <Input
                    type="number"
                    name="carboLevel"
                    value={formData.data.carboLevel}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Insulin (units):</FormLabel>
                <Input
                    type="number"
                    name="insulin"
                    value={formData.data.insulin}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Long-lasting Insulin (units):</FormLabel>
                <Input
                    type="number"
                    name="longLastingInsulin"
                    value={formData.data.longLastingInsulin}
                    onChange={handleChange}
                />
            </FormControl>

            <Button type="submit" colorScheme="teal" mt="4">
                Submit Sick Day Data
            </Button>
        </chakra.form>
    );
}

export default SickDayForm;
