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
    chakra,
} from "@chakra-ui/react";
import { Button } from "@chakra-ui/button";

function DailyDosageForm() {
    const [dosageData, setDosageData] = useState({
        patientId: '',
        data : {
            date: '',
            session: '', //"pre-breakfast", "pre-lunch", "pre-dinner", "night"
            bloodSugar: '',
            carboLevel: '',
            insulin: '',
            longLastingInsulin: '',
            physicalActivity: ''
        }
    });

    const [allPatients, setAllPatients] = useState([]); // For storing fetched patients
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

    // Handle API response
    const handleResponse = (response) => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    };

    // Handle API errors
    const handleError = (error) => {
        console.error("Error:", error);
    };

    // Handle changes in dosage form inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
    
        // Update the state for the nested data object
        setDosageData((prevData) => ({
            ...prevData,
            data: {
                ...prevData.data,
                [name]: value
            }
        }));
    };

    // Submit the form
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(dosageData);
        
        fetch(`${apiUrl}/diabeticsModule/dailyDosage/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dosageData),
        })
            .then(handleResponse)
            .catch(handleError)
            .finally(() => {
                setDosageData({
                    patientId: '',
                    data : {
                        date: '',
                        session: '', //"pre-breakfast", "pre-lunch", "pre-dinner", "night"
                        bloodSugar: '',
                        carboLevel: '',
                        insulin: '',
                        longLastingInsulin: '',
                        physicalActivity: ''
                    }
                });
            });
    };

    return (
        <chakra.form onSubmit={handleSubmit} mt="4">
            <FormControl isRequired mt="2">
                <FormLabel>Date:</FormLabel>
                <Input
                    type="date"
                    name="date"
                    value={dosageData.data.date}
                    onChange={handleInputChange}
                />
            </FormControl>

            <FormControl isRequired mt="2">
                <FormLabel>Select Patient:</FormLabel>
                <Select
                    name="patientId"
                    value={dosageData.patientId}
                    onChange={(e) => setDosageData({ ...dosageData, patientId: e.target.value })}
                >
                    <option value="">Select Patient</option>
                    {allPatients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                            {patient.name} - {patient.age}
                        </option>
                    ))}
                </Select>
            </FormControl>

            {/* "pre-breakfast", "pre-lunch", "pre-dinner", "night" */}
            <FormControl isRequired mt="2"> 
                <FormLabel>Session:</FormLabel>
                <Select
                    name="session"
                    value={dosageData.data.session}
                    onChange={handleInputChange}
                >
                    <option value="">Select Session</option>
                    <option value="pre-breakfast">Pre-Breakfast</option>
                    <option value="pre-lunch">Pre-Lunch</option>
                    <option value="pre-dinner">Pre-Dinner</option>
                    <option value="night">Night</option>
                </Select>
            </FormControl>

            <FormControl isRequired mt="2">
                <FormLabel>Blood Sugar (mg/dL):</FormLabel>
                <Input
                    type="number"
                    name="bloodSugar"
                    value={dosageData.data.bloodSugar}
                    onChange={handleInputChange}
                />
            </FormControl>

            <FormControl isRequired mt="2">
                <FormLabel>Carbohydrate Level (g):</FormLabel>
                <Input
                    type="number"
                    name="carboLevel"
                    value={dosageData.data.carboLevel}
                    onChange={handleInputChange}
                />
            </FormControl>

            <FormControl isRequired mt="2">
                <FormLabel>Insulin (units):</FormLabel>
                <Input
                    type="number"
                    name="insulin"
                    value={dosageData.data.insulin}
                    onChange={handleInputChange}
                />
            </FormControl>

            <FormControl isRequired mt="2">
                <FormLabel>Long-lasting Insulin (units):</FormLabel>
                <Input
                    type="number"
                    name="longLastingInsulin"
                    value={dosageData.data.longLastingInsulin}
                    onChange={handleInputChange}
                />
            </FormControl>

            <FormControl mt="2">
                <FormLabel>Physical Activity :</FormLabel>
                <Input
                    type="text"
                    name="physicalActivity"
                    value={dosageData.data.physicalActivity}
                    onChange={handleInputChange}
                />
            </FormControl>

            <Button type="submit" colorScheme="teal" mt="4">
                Submit Dosage
            </Button>
        </chakra.form>
    );
}

export default DailyDosageForm;
