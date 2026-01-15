import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useNavigate, useLocation, Form, Link } from "react-router-dom";
import getEnvironment from "../getenvironment";
import ViewTimetable from "./viewttmerged";
import TimetableSummary from "./ttsummary";
import "./Timetable.css";
import { Container, Box, VStack, HStack, Flex } from "@chakra-ui/layout";
import { 
    FormControl, 
    FormLabel, 
    Heading, 
    Select, 
    UnorderedList, 
    ListItem, 
    background, 
    Spinner,
    Card,
    CardHeader,
    CardBody,
    Badge,
    IconButton,
} from "@chakra-ui/react";
import {
    CustomTh,
    CustomLink,
    CustomBlueButton,
    CustomPlusButton,
    CustomDeleteButton,
} from "../styles/customStyles";
import { Text, Center, Portal, ChakraProvider, Spacer } from "@chakra-ui/react";

import { CloseIcon, AddIcon } from "@chakra-ui/icons";

import {
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/table";
import { Button } from "@chakra-ui/button";
import Header from "../components/header";
import { Helmet } from "react-helmet-async";

function CommonSlot() {
    const [viewData, setViewData] = useState({});
    const [viewFacultyData, setViewFacultyData] = useState({});
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [commonLoad, setCommonLoad] = useState();
    const [mergedData, setMergedData] = useState({});

    const apiUrl = getEnvironment();

    const [availableFaculties, setAvailableFaculties] = useState([]);
    const [allsessions, setAllSessions] = useState([]);
    const [availableDepts, setAvailableDepts] = useState([]);
    const [currentCode, setCurrentCode] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [faculties, setFaculties] = useState([]);

   
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await fetch(
                    `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`,
                    { credentials: "include" }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                const { uniqueSessions, uniqueDept } = data;
                
                setAllSessions(uniqueSessions);
                const currentSession = uniqueSessions.find(session => session.currentSession === true);
                setSelectedSession(currentSession || uniqueSessions[0]);
                setAvailableDepts(uniqueDept);
            } catch (error) {
                console.error("Error fetching existing timetable data:", error);
            }
        };

        fetchSessions();
    }, []);

    useEffect(() => {
        const fetchCode = async (session, dept) => {
            try {
                const response = await fetch(
                    `${apiUrl}/timetablemodule/timetable/getcode/${session?.session}/${dept}`,
                    { credentials: "include" }
                );
                const data1 = await response.json();
                setCurrentCode(data1)
            } catch (error) {
                console.error("Error fetching existing timetable data:", error);
                return {};
            }
        }
        fetchCode(selectedSession, selectedDept);
    }, [selectedSession, selectedDept])


    useEffect(() => {
        const facultyData = async (currentCode, faculty) => {
            try {
                const response = await fetch(
                    `${apiUrl}/timetablemodule/lock/lockfacultytt/${currentCode}/${faculty}`,
                    { credentials: "include" }
                );
                const data1 = await response.json();
                const data = data1.timetableData;
                const initialData = generateInitialTimetableData(data, "faculty");
                return initialData;
            } catch (error) {
                console.error("Error fetching existing timetable data:", error);
                return {};
            }
        };

        const mergeData = (obj,faculty) => {
            if (Object.keys(mergedData).length == 0) {
                for (let i in obj) {
                    for (let j in obj[i]) {
                        if (j != "lunch") {
                            let arr = obj[i][j][0].length;
                            if(obj[i][j][0].length!=0)obj[i][j] = [faculty];
                            else obj[i][j]=[]
                        }
                    }
                }
                setMergedData(obj);
                return;
            }
            let newobj = mergedData;
            for (let i in newobj) {
                for (let j in newobj[i]) {
                    if (j != "lunch") {
                        if(obj[i][j][0].length!=0)newobj[i][j] = [...newobj[i][j] , faculty];
                    }
                }
            }
            setMergedData(newobj,faculty);
        }

        const fetchFacultyData = async (faculty) => {
            const data = await facultyData(currentCode, faculty);
            setViewFacultyData(data);

            console.log("merged", mergedData)
            console.log("dtataaa", data)
            mergeData(data,faculty)
        };

        const fetchCommonLoad = async (currentCode, viewFaculty) => {
            try {
                const response = await fetch(
                    `${apiUrl}/timetablemodule/commonLoad/${currentCode}/${viewFaculty}`,
                    { credentials: "include" }
                );
                if (response.ok) {
                    const data = await response.json();
                    setCommonLoad(data);
                }
            } catch (error) {
                console.error("Error fetching commonload:", error);
            }
        };
        fetchCommonLoad(currentCode, selectedFaculty);
        fetchFacultyData(selectedFaculty);
    }, [selectedFaculty]);


    useEffect(() => {
        const fetchFaculty = async (currentCode) => {
            try {
                const fetchedttdetails = await fetchTTData(currentCode);
                console.log("fetchedttdetails", fetchedttdetails)
                const response = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${fetchedttdetails?.dept}`, { credentials: 'include', });
                if (response.ok) {
                    const data = await response.json();
                    const facultydata = data.map(faculty => faculty.name);
                    setAvailableFaculties(facultydata);
                    return data;
                }
            } catch (error) {
                console.error('Error fetching subject data:', error);
            }
        };

        fetchFaculty(currentCode);
    }, [apiUrl, currentCode, selectedFaculty]);

   
    const fetchTTData = async (currentCode) => {
        try {
            const response = await fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();
            setTTData(data);
            return data;
        } catch (error) {
            console.error('Error fetching TTdata:', error);
        }
    };

    const generateInitialTimetableData = (fetchedData, type) => {
        const initialData = {};
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const periods = [1, 2, 3, 4, 5, 6, 7, 8, 'lunch'];

        for (const day of days) {
            initialData[day] = {};
            for (const period of periods) {
                if (period == 'lunch') {
                    initialData[day]['lunch'] = [];

                    if (fetchedData[day] && fetchedData[day]['lunch']) {
                        const slotData = fetchedData[day]['lunch'];

                        for (const slot of slotData) {
                            const slotSubjects = [];
                            let faculty = "";
                            let room = "";
                            for (const slotItem of slot) {
                                const subj = slotItem.subject || "";
                                if (type == "room") {
                                    room = slotItem.sem || "";
                                } else {
                                    room = slotItem.room || "";
                                }
                                if (type == "faculty") {
                                    faculty = slotItem.sem || "";
                                } else {
                                    faculty = slotItem.faculty || "";
                                }
                                if (subj || room || faculty) {
                                    slotSubjects.push({
                                        subject: subj,
                                        room: room,
                                        faculty: faculty,
                                    });
                                }

                                if (slotSubjects.length > 0) {
                                    initialData[day]['lunch'].push(slotSubjects);
                                }
                            }
                        }
                    }
                }
                else {
                    initialData[day][`period${period}`] = [];

                    if (fetchedData[day] && fetchedData[day][`period${period}`]) {
                        const slotData = fetchedData[day][`period${period}`];

                        for (const slot of slotData) {
                            const slotSubjects = [];
                            let faculty = "";
                            let room = "";
                            for (const slotItem of slot) {
                                const subj = slotItem.subject || "";
                                if (type == "room") {
                                    room = slotItem.sem || "";
                                } else {
                                    room = slotItem.room || "";
                                }
                                if (type == "faculty") {
                                    faculty = slotItem.sem || "";
                                } else {
                                    faculty = slotItem.faculty || "";
                                }
                                if (subj || room || faculty) {
                                    slotSubjects.push({
                                        subject: subj,
                                        room: room,
                                        faculty: faculty,
                                    });
                                }
                            }

                            if (slotSubjects.length === 0) {
                                slotSubjects.push({
                                    subject: "",
                                    room: "",
                                    faculty: "",
                                });
                            }

                            initialData[day][`period${period}`].push(slotSubjects);
                        }
                    } else {
                        initialData[day][`period${period}`].push([]);
                    }
                }
            }
        }

        return initialData;
    };

    const [subjectData, setSubjectData] = useState([]);
    const [TTData, setTTData] = useState([]);

    useEffect(() => {
        const fetchSubjectData = async (currentCode) => {
            try {
                const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`,
                    { credentials: "include" }
                );
                const data = await response.json();
                setSubjectData(data);
            } catch (error) {
                console.error('Error fetching subject data:', error);
            }
        };

        fetchSubjectData(currentCode);
        fetchTTData(currentCode);
    }, [currentCode]);

    const removeData = async (e, index) => {
        const facultyData = async (currentCode, faculty) => {
            try {
                const response = await fetch(
                    `${apiUrl}/timetablemodule/lock/lockfacultytt/${currentCode}/${faculty}`,
                    { credentials: "include" }
                );
                const data1 = await response.json();
                const data = data1.timetableData;
                const initialData = generateInitialTimetableData(data, "faculty");
                return initialData;
            } catch (error) {
                console.error("Error fetching existing timetable data:", error);
                return {};
            }
        };

        const updateMergeData = (obj,fac) => {
            if (Object.keys(mergedData).length == 0) {
                setMergedData(obj);
                return;
            }
            let newobj = mergedData;
            for (let i in newobj) {
                for (let j in newobj[i]) {
                    if (j != "lunch") {
                        if(newobj[i][j].length!=0 && j!= "lunch"){
                            let ind = newobj[i][j].indexOf(fac)
                            console.log(ind,newobj[i][j])
                            if(ind!=-1) newobj[i][j].splice(ind,1);
                            console.log(ind,newobj[i][j])
                        }
                    }
                }
            }
            return newobj;
        }

        const fac = faculties[index]["faculty"];
        faculties.splice(index,1)
        const fetchFacultyData = async (fac) => {
            const data = await facultyData(currentCode, fac);
            console.log("dtataaa", data)
            let newobj = updateMergeData(data,fac)
            return newobj;
        };

        let newobj = await fetchFacultyData(fac);
        const obj = {...newobj}
        setMergedData(obj);
    }

    const changeFaculty = (value) => {
        setFaculties([...faculties, { "department": selectedDept, "faculty": value }])
        setSelectedFaculty(value);
    }

    return (
        <>
            <Helmet>
                <title>View Meet - Slots | XCEED NITJ</title>
            </Helmet>
            
            <Box bg="white" minH="100vh">
                {/* Hero Header Section */}
                <Box
                    bgGradient="linear(to-r, cyan.400, teal.500, green.500)"
                    pt={0}
                    pb={{ base: 16, md: 20, lg: 24 }}
                    position="relative"
                    overflow="hidden"
                >
                    <Box
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        opacity="0.1"
                        bgImage="radial-gradient(circle, white 1px, transparent 1px)"
                        bgSize="30px 30px"
                    />

                    {/* Header/Navbar integrated into hero */}
                    <Box
                        position="relative"
                        zIndex={2}
                        sx={{
                            '& button[aria-label="Go back"]': { display: "none" },
                            '& .chakra-button:first-of-type': { display: "none" },
                        }}
                    >
                        <Header />
                    </Box>

                    <Container 
                        maxW="7xl" 
                        position="relative" 
                        mt={{ base: 4, md: 6, lg: 8 }}
                        px={{ base: 4, md: 6, lg: 8 }}
                    >
                        <VStack 
                            spacing={{ base: 3, md: 4 }}
                            align={{ base: "center", lg: "start" }}
                            textAlign={{ base: "center", lg: "left" }}
                        >
                            <Badge
                                colorScheme="whiteAlpha"
                                fontSize={{ base: "xs", md: "sm" }}
                                px={{ base: 2, md: 3 }}
                                py={1}
                                borderRadius="full"
                            >
                                Faculty Management
                            </Badge>
                            <Heading 
                                size={{ base: "xl", md: "2xl" }}
                                color="white" 
                                fontWeight="bold" 
                                lineHeight="1.2"
                            >
                                View Meet - Slots
                            </Heading>
                            <Text 
                                color="whiteAlpha.900" 
                                fontSize={{ base: "md", md: "lg" }}
                                maxW={{ base: "full", lg: "2xl" }}
                            >
                                Manage faculty schedules and view available meeting slots
                            </Text>
                        </VStack>
                    </Container>
                </Box>

                <Container maxW="7xl" mt={-12} position="relative" zIndex={1} pb={16}>
                    <VStack spacing={6} align="stretch">
                        {/* Add Faculty Card */}
                        <Card
                            bg="white"
                            borderRadius="2xl"
                            shadow="2xl"
                            border="1px"
                            borderColor="gray.300"
                            overflow="hidden"
                        >
                            <CardHeader bg="teal.600" color="white" p={4}>
                                <Flex justify="space-between" align="center">
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md">Add Faculty</Heading>
                                        <Text fontSize="xs" color="whiteAlpha.800" mt={1}>
                                            Select department and faculty to view slots
                                        </Text>
                                    </VStack>
                                    <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                                        {faculties.length} Selected
                                    </Badge>
                                </Flex>
                            </CardHeader>
                            <CardBody p={6}>
                                <Box
                                    overflowX="auto"
                                    sx={{
                                        '&::-webkit-scrollbar': {
                                            height: '10px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: 'gray.100',
                                            borderRadius: 'full',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: 'teal.400',
                                            borderRadius: 'full',
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                            background: 'teal.500',
                                        },
                                    }}
                                >
                                    <Table variant="simple" size="md">
                                        <Thead bg="teal.50">
                                            <Tr>
                                                <Th
                                                    color="teal.700"
                                                    fontSize="sm"
                                                    fontWeight="bold"
                                                    borderBottom="2px"
                                                    borderColor="teal.200"
                                                >
                                                    Department
                                                </Th>
                                                <Th
                                                    color="teal.700"
                                                    fontSize="sm"
                                                    fontWeight="bold"
                                                    borderBottom="2px"
                                                    borderColor="teal.200"
                                                >
                                                    Faculty
                                                </Th>
                                                <Th
                                                    color="teal.700"
                                                    fontSize="sm"
                                                    fontWeight="bold"
                                                    borderBottom="2px"
                                                    borderColor="teal.200"
                                                    textAlign="center"
                                                >
                                                    Action
                                                </Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {faculties.map((elem, index) => (
                                                <Tr
                                                    key={index}
                                                    _hover={{ bg: "teal.50" }}
                                                    transition="background 0.2s"
                                                >
                                                    <Td>
                                                        <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                                                            {elem["department"]}
                                                        </Badge>
                                                    </Td>
                                                    <Td fontWeight="medium">{elem["faculty"]}</Td>
                                                    <Td textAlign="center">
                                                        <IconButton
                                                            icon={<CloseIcon />}
                                                            onClick={(e) => { removeData(e, index) }}
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            aria-label="Remove faculty"
                                                            _hover={{ bg: "red.50" }}
                                                        />
                                                    </Td>
                                                </Tr>
                                            ))}
                                            <Tr bg="gray.50">
                                                <Td>
                                                    <Select
                                                        value={selectedDept}
                                                        onChange={(e) => setSelectedDept(e.target.value)}
                                                        isRequired
                                                        borderColor="teal.300"
                                                        _hover={{ borderColor: "teal.400" }}
                                                        _focus={{
                                                            borderColor: "teal.500",
                                                            boxShadow: "0 0 0 1px #319795",
                                                        }}
                                                        size="md"
                                                        bg="white"
                                                    >
                                                        <option value="">Select Department</option>
                                                        {availableDepts.map((dept, index) => (
                                                            <option key={index} value={dept}>
                                                                {dept}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </Td>
                                                <Td>
                                                    <Select
                                                        value={selectedFaculty}
                                                        onChange={(e) => changeFaculty(e.target.value)}
                                                        borderColor="teal.300"
                                                        _hover={{ borderColor: "teal.400" }}
                                                        _focus={{
                                                            borderColor: "teal.500",
                                                            boxShadow: "0 0 0 1px #319795",
                                                        }}
                                                        size="md"
                                                        bg="white"
                                                    >
                                                        <option value="">Select Faculty</option>
                                                        {availableFaculties.map((faculty, index) => (
                                                            <option key={index} value={faculty}>
                                                                {faculty}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </Td>
                                                <Td textAlign="center">
                                                    <IconButton
                                                        icon={<AddIcon />}
                                                        colorScheme="teal"
                                                        size="sm"
                                                        aria-label="Add faculty"
                                                        isDisabled={!selectedDept || !selectedFaculty}
                                                    />
                                                </Td>
                                            </Tr>
                                        </Tbody>
                                    </Table>
                                </Box>
                            </CardBody>
                        </Card>

                        {/* Timetable View Card */}
                        {Object.keys(mergedData).length > 0 && (
                            <Card
                                bg="white"
                                borderRadius="2xl"
                                shadow="2xl"
                                border="1px"
                                borderColor="gray.300"
                                overflow="hidden"
                            >
                                <CardHeader bg="cyan.600" color="white" p={4}>
                                    <Heading size="md">Faculty Meeting Slots</Heading>
                                </CardHeader>
                                <CardBody p={6}>
                                    <ViewTimetable timetableData={mergedData} />
                                </CardBody>
                            </Card>
                        )}
                    </VStack>
                </Container>
            </Box>
        </>
    );
}

export default CommonSlot;