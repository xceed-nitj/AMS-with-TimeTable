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

function HospitalForm() {
    const [hospitalData, setHospitalData] = useState({
        name: "",
        location: "",
        phone: "",
        doctors: [],
        patients: []
    });

    const [allDoctors, setAllDoctors] = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');

    const apiUrl = getEnvironment();

    // Fetch patients data
    useEffect(() => {
        fetch(`${apiUrl}/diabeticsModule/patient/all`, { credentials: 'include' })
            .then(handleResponse)
            .then((data) => {
                setAllPatients(data);
            })
            .catch(handleError);
            console.log(allPatients);
    }, []);

    // Fetch doctors data
    useEffect(() => {
        fetch(`${apiUrl}/diabeticsModule/doctor/all`, { credentials: 'include' })
            .then(handleResponse)
            .then((data) => {
                setAllDoctors(data);
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

    // Handling hospital detail changes
    const handleHospitalChange = (e) => {
        const { name, value } = e.target;
        setHospitalData({ ...hospitalData, [name]: value });
    };

    // Add selected doctor
    const addDoctor = () => {
        if (!selectedDoctorId) {
            console.error("No doctor selected");
            return;
        }
        console.log(selectedDoctorId);

        const selectedDoctor = allDoctors.find((doctor) => doctor._id === selectedDoctorId);

        if (!selectedDoctor) {
            console.error(`Doctor with id ${selectedDoctorId} not found`);
            return;
        }

        // Ensure that the patient doesn't already exist in the list
        if (hospitalData.doctors.some((doctor) => doctor._id === selectedDoctorId)) {
            console.error(`Doctor with id ${selectedDoctorId} is already added`);
            return;
        }

        // Add the patient to the hospitalData
        setHospitalData((prevData) => ({
            ...prevData,
            doctors: [...prevData.doctors, selectedDoctor]
        }));

        // Reset the selected patient ID after adding
        setSelectedDoctorId('');
    };

    // Add existing patient to hospital
    const addPatient = () => {
        if (!selectedPatientId) {
            console.error("No patient selected");
            return;
        }
        console.log(selectedPatientId);

        const selectedPatient = allPatients.find((patient) => patient._id === selectedPatientId);

        if (!selectedPatient) {
            console.error(`Patient with id ${selectedPatientId} not found`);
            return;
        }

        // Ensure that the patient doesn't already exist in the list
        if (hospitalData.patients.some((patient) => patient._id === selectedPatientId)) {
            console.error(`Patient with id ${selectedPatientId} is already added`);
            return;
        }

        // Add the patient to the hospitalData
        setHospitalData((prevData) => ({
            ...prevData,
            patients: [...prevData.patients, selectedPatient]
        }));

        // Reset the selected patient ID after adding
        setSelectedPatientId('');
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        fetch(`${apiUrl}/diabeticsModule/hospital/add`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hospitalData)
        })
            .then(handleResponse)
            .catch(handleError)
            .finally(() => {
                setHospitalData({
                    name: '',
                    location: '',
                    phone: '',
                    doctors: [],
                    patients: []
                });
            });
    };

    return (
        <chakra.form onSubmit={handleSubmit} mt="1">
            <FormControl isRequired mt="1">
                <FormLabel>Enter hospital name:</FormLabel>
                <Input
                    type="text"
                    name="name"
                    placeholder="Hospital Name"
                    value={hospitalData.name}
                    onChange={handleHospitalChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Enter location:</FormLabel>
                <Input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={hospitalData.location}
                    onChange={handleHospitalChange}
                />
            </FormControl>

            <FormControl isRequired mt="1">
                <FormLabel>Enter Contact:</FormLabel>
                <Input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={hospitalData.phone}
                    onChange={handleHospitalChange}
                />
            </FormControl>

            {/* Doctor Selection */}
            <FormControl mt="3">
                <FormLabel>Add Doctor:</FormLabel>
                <Select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                    <option value="" disabled>
                        Select Doctor
                    </option>
                    {allDoctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                            {doctor.name} - {doctor.specialization}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <Button type="button" mt="2" onClick={addDoctor}>Add Doctor</Button>

            {/* List Added Doctors */}
            <Text mt="2">Added Doctors:</Text>
            <ul>
                {hospitalData.doctors.map((doctor) => (
                    <li key={doctor._id}>
                        {doctor.name} - {doctor.specialization}
                    </li>
                ))}
            </ul>

            {/* Patient Selection */}
            <FormControl mt="3">
                <FormLabel>Add Patient:</FormLabel>
                <Select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                    <option value="">
                        Select Patient
                    </option>
                    {allPatients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                            {patient.name} - {patient.age}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <Button type="button" mt="2" onClick={addPatient}>Add Patient</Button>

            {/* List Added Patients */}
            <Text mt="2">Added Patients:</Text>
            <ul>
                {hospitalData.patients.map((patient) => (
                    <li key={patient._id}>
                        {patient.name} - {patient.age}
                    </li>
                ))}
            </ul>

            {/* Submit Button */}
            <Button type="submit" className="bg-blue-500 text-white px-4 py-2" mt="4">
                Create Hospital
            </Button>
        </chakra.form>
    );
}

export default HospitalForm;