import React, { useState, useEffect } from 'react';
import getEnvironment from '../../getenvironment';
import {
    FormControl,
    FormLabel,
    Input,
    Select,
    chakra,
    Text,
} from "@chakra-ui/react";
import { Button } from "@chakra-ui/button";

function GamificationForm() {
    const [formData, setFormData] = useState({
        patientId: "",
        date: "",
        progress: "",
        entryTime: "",
        badgeCount: "",
        starCount: "",
        TotalStars: "",
        TotalBadges: ""
    });

    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');

    const apiUrl = getEnvironment();

    // Fetch all patients
    useEffect(() => {
        fetch(`${apiUrl}/diabeticsModule/patient/all`, { credentials: 'include' })
            .then(handleResponse)
            .then((data) => {
                setPatients(data);
            })
            .catch(handleError);
    }, []);

    // Separate function to handle API responses
    const handleResponse = (response) => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    };

    // Separate function to handle errors
    const handleError = (error) => {
        console.error("Error:", error);
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle patient selection change
    const handlePatientChange = (e) => {
        setSelectedPatientId(e.target.value);
        setFormData({ ...formData, patientId: e.target.value });
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData.patientId);
        
        fetch(`${apiUrl}/diabeticsModule/gamification/add`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(handleResponse)
        .catch(handleError)
        .finally(() => {
            setFormData({
                patientId: "",
                date: "",
                progress: "",
                entryTime: "",
                badgeCount: "",
                starCount: "",
                totalStars: "",
                totalBadges: ""
            });
        })
    };

    return (
        <chakra.form onSubmit={handleSubmit} mt="1">
            {/* Patient Selection */}
            <FormControl isRequired mt="1">
                <FormLabel>Select Patient:</FormLabel>
                <Select
                    placeholder="Select Patient"
                    value={selectedPatientId}
                    onChange={handlePatientChange}
                >
                    {patients.map((patient) => (
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
                    value={formData.date}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Progress:</FormLabel>
                <Input
                    type="text"
                    name="progress"
                    placeholder="Progress"
                    value={formData.progress}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl mt="1">
                <FormLabel>Entry Time:</FormLabel>
                <Input
                    type="time"
                    name="entryTime"
                    value={formData.entryTime}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl mt="1">
                <FormLabel>Badge Count:</FormLabel>
                <Input
                    type="number"
                    name="badgeCount"
                    placeholder="Badge Count"
                    value={formData.badgeCount}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl mt="1">
                <FormLabel>Star Count:</FormLabel>
                <Input
                    type="number"
                    name="starCount"
                    placeholder="Star Count"
                    value={formData.starCount}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl mt="1">
                <FormLabel>Total Stars:</FormLabel>
                <Input
                    type="number"
                    name="totalStars"
                    placeholder="Total Stars"
                    value={formData.totalStars}
                    onChange={handleChange}
                />
            </FormControl>

            <FormControl mt="1">
                <FormLabel>Total Badges:</FormLabel>
                <Input
                    type="number"
                    name="totalBadges"
                    placeholder="Total Badges"
                    value={formData.totalBadges}
                    onChange={handleChange}
                />
            </FormControl>

            {/* Submit Button */}
            <Button type="submit" className="bg-blue-500 text-white px-4 py-2" mt="4">
                Submit Gamification Data
            </Button>
        </chakra.form>
    );
}

export default GamificationForm;
