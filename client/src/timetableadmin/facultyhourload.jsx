import React, { useEffect, useState } from "react";
import {
    Table, Thead, Tbody, Tr, Th, Td,
    Select, Spinner, Box, Heading, Flex
} from "@chakra-ui/react";
import getEnvironment from "../getenvironment";

const FacultyHourLoad = () => {
    const apiUrl = getEnvironment();

    const [departments, setDepartments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [table, setTable] = useState([]);
    const [loading, setLoading] = useState(false);

    const pathParts = window.location.pathname.split("/");
    const generatedLink = pathParts[pathParts.length - 3];

    /* Fetch Sessions */

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch(
                `${apiUrl}/timetablemodule/allotment/session`,
                { credentials: "include" }
            );

            const data = await res.json();

            if (!Array.isArray(data)) {
                setSessions([]);
                return;
            }


            const filtered = data.filter(
                s =>
                    s.startsWith("2024-2025") ||
                    s.startsWith("2025-2026")
            );


            const formatted = filtered.map(s => ({ session: s }));

            setSessions(formatted);
        } catch (err) {
            console.error("Error fetching sessions", err);
        }
    };


    /* Fetch Departments */

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch(
                `${apiUrl}/timetablemodule/faculty`,
                { credentials: "include" }
            );
            const data = await res.json();

            if (!Array.isArray(data)) return;

            const uniqueDepts = [...new Set(data.map(f => f.dept))];
            setDepartments(uniqueDepts);
        } catch (err) {
            console.error(err);
        }
    };

    /* CALCULATION */

    const fetchFacultyHourLoad = async () => {
        if (!selectedDept || !selectedSession) return;

        setLoading(true);
        try {

            const facRes = await fetch(
                `${apiUrl}/timetablemodule/faculty/dept/${selectedDept}`,
                { credentials: "include" }
            );
            const faculties = await facRes.json();

            if (!Array.isArray(faculties)) return;

            const rows = [];

            for (const fac of faculties) {
                const res = await fetch(
                    `${apiUrl}/timetablemodule/tt/viewfacultytt/${generatedLink}/${fac.name}?session=${selectedSession}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                const tt = data?.timetableData;

                let firstHour = 0;
                let secondHour = 0;

                ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach(day => {
                    if (tt?.[day]?.period1) firstHour += tt[day].period1.length;
                    if (tt?.[day]?.period2) secondHour += tt[day].period2.length;
                });

                rows.push({
                    faculty: fac.name,
                    firstHour,
                    secondHour,
                    total: firstHour + secondHour
                });
            }

            setTable(rows);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFacultyHourLoad();
    }, [selectedDept, selectedSession]);

    return (
        <Box p={6}>
            <Heading mb={4}>Faculty Hour Load</Heading>

            <Flex gap={4} mb={4}>
                <Select
                    placeholder="Select Department"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                >
                    {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </Select>

                <Select
                    placeholder="Select Session"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                >
                    {sessions.map(s => (
                        <option key={s.session} value={s.session}>
                            {s.session}
                        </option>
                    ))}
                </Select>
            </Flex>

            {loading ? (
                <Spinner />
            ) : (
                <Table variant="striped">
                    <Thead>
                        <Tr>
                            <Th>Faculty</Th>
                            <Th>First Hour Load</Th>
                            <Th>Second Hour Load</Th>
                            <Th>Total</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {table.map((row, idx) => (
                            <Tr key={idx}>
                                <Td>{row.faculty}</Td>
                                <Td>{row.firstHour}</Td>
                                <Td>{row.secondHour}</Td>
                                <Td>{row.total}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}
        </Box>
    );
};

export default FacultyHourLoad;
