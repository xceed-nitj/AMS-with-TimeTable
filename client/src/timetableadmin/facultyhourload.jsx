import React, { useEffect, useState } from "react";
import { Table, Tbody, Td, Th, Tr } from "@chakra-ui/table";
import { Spinner } from "@chakra-ui/react";
import getEnvironment from "../getenvironment";

const FacultyHourLoad = () => {
    const [table, setTable] = useState([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = getEnvironment();
    const currentURL = window.location.pathname;
    const parts = currentURL.split("/");
    const currentCode = parts[parts.length - 3];

    useEffect(() => {
        fetchFacultyHourLoad();
    }, []);

    const fetchFacultyHourLoad = async () => {
        try {
            // get dept faculties
            const ttRes = await fetch(
                `${apiUrl}/timetablemodule/timetable/alldetails/${currentCode}`,
                { credentials: "include" }
            );
            const ttData = await ttRes.json();

            const facRes = await fetch(
                `${apiUrl}/timetablemodule/faculty/dept/${ttData.dept}`,
                { credentials: "include" }
            );
            const faculties = await facRes.json();

            const rows = [];

            for (const fac of faculties) {
                const res = await fetch(
                    `${apiUrl}/timetablemodule/tt/viewfacultytt/${currentCode}/${fac.name}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                const tt = data.timetableData;

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
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="tw-p-2">
            <h1 className="tw-m-1 tw-p-2 tw-font-jakarta tw-text-2xl tw-font-extrabold tw-text-slate-800">
                Faculty First & Second Hour Load
            </h1>

            <Table colorScheme="black">
                <Tbody>
                    <Tr>
                        <Th>Faculty Name</Th>
                        <Th>First Hour Load</Th>
                        <Th>Second Hour Load</Th>
                        <Th>Total</Th>
                    </Tr>

                    {loading && (
                        <Tr>
                            <Td colSpan={4}>
                                Fetching data… <Spinner />
                            </Td>
                        </Tr>
                    )}

                    {!loading &&
                        table.map((row, i) => (
                            <Tr key={i} bgColor={i % 2 === 0 ? "paleGreen" : "lightCyan"}>
                                <Td>{row.faculty}</Td>
                                <Td>{row.firstHour}</Td>
                                <Td>{row.secondHour}</Td>
                                <Td>{row.total}</Td>
                            </Tr>
                        ))}
                </Tbody>
            </Table>
        </div>
    );
};

export default FacultyHourLoad;
