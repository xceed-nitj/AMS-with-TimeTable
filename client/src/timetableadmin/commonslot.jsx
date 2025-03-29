import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useNavigate, useLocation, Form, Link } from "react-router-dom";
import getEnvironment from "../getenvironment";
import ViewTimetable from "./viewttmerged";
import TimetableSummary from "./ttsummary";
import "./Timetable.css";
import { Container } from "@chakra-ui/layout";
import { FormControl, FormLabel, Heading, Select, UnorderedList, ListItem, background, Spinner } from "@chakra-ui/react";
import {
    CustomTh,
    CustomLink,
    CustomBlueButton,
    CustomPlusButton,
    CustomDeleteButton,
} from "../styles/customStyles";
import { Box, Text, HStack, Center, Portal, ChakraProvider, Spacer } from "@chakra-ui/react";

import { CloseIcon } from "@chakra-ui/icons";

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

// import PDFViewTimetable from '../filedownload/chakrapdf'

function CommonSlot() {
    // console.log("chakrapdf");
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
                // console.log('Fetching sessions');
                const response = await fetch(
                    `${apiUrl}/timetablemodule/timetable/sess/allsessanddept`,
                    { credentials: "include" }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                // console.log("response object",response);

                const data = await response.json();
                // console.log("data",data)
                const { uniqueSessions, uniqueDept } = data;
                
                setAllSessions(uniqueSessions);
                setSelectedSession(uniqueSessions[0]);
                setAvailableDepts(uniqueDept);
            } catch (error) {
                console.error("Error fetching existing timetable data:", error);
            }
        };

        fetchSessions();
    }, []); // Empty dependency array means this effect runs once on mount

    useEffect(() => {
        const fetchCode = async (session, dept) => {
            try {
                // console.log(session,dept);
                const response = await fetch(
                    `${apiUrl}/timetablemodule/timetable/getcode/${session?.session}/${dept}`,
                    { credentials: "include" }
                );
                const data1 = await response.json();
                // console.log(data1);

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
                            // obj[i][j] = arr;
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
                        // newobj[i][j] = newobj[i][j] + obj[i][j][0].length;
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
                    // console.log('faculty response',data[0]);
                    setCommonLoad(data);
                    // console.log('coomomo load', data);
                }
            } catch (error) {
                console.error("Error fetching commonload:", error);
            }
        };
        fetchCommonLoad(currentCode, selectedFaculty); // Call the function to fetch subject data
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

                    // console.log('faculty response',data);
                    setAvailableFaculties(facultydata);
                    // console.log('deptfaculties', facultydata);
                    return data;
                }

            } catch (error) {
                console.error('Error fetching subject data:', error);
            }
        };

        fetchFaculty(currentCode); // Call the function to fetch subject data
    }, [apiUrl, currentCode, selectedFaculty]);

   
    const fetchTTData = async (currentCode) => {
        try {
             const response = await fetch(`${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // body: JSON.stringify(userData),
                credentials: 'include'
            });

            const data = await response.json();
            // console.log('ttdata',data)
            setTTData(data);
            return data;
            //   
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
                            let faculty = ""; // Declare faculty here
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
                                // Only push the values if they are not empty
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
                            let faculty = ""; // Declare faculty here
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
                                // Only push the values if they are not empty
                                if (subj || room || faculty) {
                                    slotSubjects.push({
                                        subject: subj,
                                        room: room,
                                        faculty: faculty,
                                    });
                                }
                            }

                            // Push an empty array if no data is available for this slot
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
                        // Assign an empty array if day or period data is not available
                        initialData[day][`period${period}`].push([]);
                    }
                }
            }

        }

        // console.log("initial datat to be received",initialData);
        return initialData;
    };




    const [subjectData, setSubjectData] = useState([]); // Initialize as an empty array
    const [TTData, setTTData] = useState([]); // Initialize as an empty array

    useEffect(() => {
        const fetchSubjectData = async (currentCode) => {
            try {
                const response = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${currentCode}`,
                    { credentials: "include" }
                );
                const data = await response.json();
                setSubjectData(data);
                // console.log('subjectdata',data)
            } catch (error) {
                console.error('Error fetching subject data:', error);
            }
        };



        fetchSubjectData(currentCode);
        fetchTTData(currentCode);


    }, [currentCode]);
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
                <title>Time Table | XCEED NITJ</title>
            </Helmet>
            <Container maxW="7xl">
                <Header title="View Meet - Slots "></Header>

                <FormLabel fontWeight="bold" fontSize="larger">Add Faculty:
                </FormLabel>
                <Table>
                    <Thead><Tr><Th textAlign="center">Department</Th><Th textAlign="center">Faculty</Th><Th textAlign="center"></Th></Tr></Thead>
                    <Tbody>
                        {faculties.map((elem, index) => (
                            <Tr key={index}><Td>{elem["department"]}</Td><Td>{elem["faculty"]}</Td><Td><CloseIcon value={elem} onClick={(e, elem) => { removeData(e, index) }} cursor="pointer" height="20px" width="20px" /></Td></Tr>
                        ))}
                        <Tr><Td><Select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            isRequired
                        >
                            <option value="">Select Department</option>
                            {availableDepts.map((dept, index) => (
                                <option key={index} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </Select></Td><Td><Select
                            value={selectedFaculty}
                            onChange={(e) => changeFaculty(e.target.value)}
                        // onChange={(e) => setSelectedFaculty(e.target.value)}
                        >
                            <option value="">Select Faculty</option>
                            {availableFaculties.map((faculty, index) => (
                                <option key={index} value={faculty}>
                                    {faculty}
                                </option>
                            ))}
                        </Select></Td><Td></Td></Tr>
                    </Tbody>
                </Table>
                <br />
                <br />
                <>
                    <ViewTimetable timetableData={mergedData} />
                </>

            </Container>
            
        </>

    );
}

export default CommonSlot