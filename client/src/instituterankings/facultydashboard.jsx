import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";
import {
  Box, Heading, Select, Table, Thead, Tbody, Tr, Th, Td, Input, Text,
  Tabs, TabList, TabPanels, Tab, TabPanel
} from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";

// Category color map
const categoryColors = {
  SCI: "#1f77b4",
  Scopus: "#ff7f0e",
  Projects: "#2ca02c",
  Patents: "#d62728",
  Events: "#9467bd",
  Books: "#8c564b",
  PhD: "#e377c2",
  TotalContribution: "#17becf"
};

const categories = ["SCI", "Scopus", "Projects", "Patents", "Events", "Books", "PhD"];

// Arrow indicator for year-wise ranks
const RankWithArrow = ({ current, prev }) => {
  if (!current) return <span>-</span>;
  if (!prev) return <Text as="span">{current}</Text>; // first row, no arrow
  if (current <= prev) {
    return (
      <Text as="span" color="green.600" fontWeight="bold">
        {current} <ChevronUpIcon color="green.600" />
      </Text>
    );
  } else {
    return (
      <Text as="span" color="red.600" fontWeight="bold">
        {current} <ChevronDownIcon color="red.600" />
      </Text>
    );
  }
};

const FacultyDashboard = () => {
  const [data, setData] = useState([]);               // year-wise rows
  const [combined, setCombined] = useState([]);       // 3-year combined rows
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]); // unique faculty (for search & dropdown)
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [facultyData, setFacultyData] = useState([]); // selected faculty (year-wise)
  const [combinedFaculty, setCombinedFaculty] = useState(null); // selected faculty (combined)
  const [deptComponent, setDeptComponent] = useState("");
  const [instComponent, setInstComponent] = useState("");

  // Load CSV and compute everything
  useEffect(() => {
    Papa.parse("/facultydata.csv", {
      download: true,
      complete: (result) => {
        const rows = result.data;
        if (!rows || rows.length < 2) return;

        // Expecting: [Faculty, Dept, SCI-2022, SCI-2023, SCI-2024, Scopus-2022, ...]
        const years = ["2022", "2023", "2024"];
        const processed = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0] || !row[1]) continue;

          const faculty = String(row[0]).trim();
          const dept = String(row[1]).trim();

          years.forEach((year, idx) => {
            const entry = {
              Faculty: faculty,
              Department: dept,
              Year: +year,
              SCI: +row[2 + idx] || 0,
              Scopus: +row[5 + idx] || 0,
              Projects: +row[8 + idx] || 0,
              Patents: +row[11 + idx] || 0,
              Events: +row[14 + idx] || 0,
              Books: +row[17 + idx] || 0,
              PhD: +row[20 + idx] || 0,
            };
            entry.TotalContribution = categories.reduce((a, c) => a + entry[c], 0);
            processed.push(entry);
          });
        }

        // -------- Year-wise ranks (Dept + Institute) --------
        const yearsUnique = [...new Set(processed.map(d => d.Year))];
        yearsUnique.forEach(y => {
          const yearData = processed.filter(d => d.Year === y);

          // Institute ranks per category + total
          categories.concat("TotalContribution").forEach(cat => {
            const sorted = [...yearData].sort((a, b) => b[cat] - a[cat]);
            sorted.forEach((d, i) => {
              d[`${cat}_InstituteRank`] = i + 1;
            });
          });

          // Department ranks per category + total
          const deptsY = [...new Set(yearData.map(d => d.Department))];
          deptsY.forEach(dep => {
            const deptDataY = yearData.filter(d => d.Department === dep);
            categories.concat("TotalContribution").forEach(cat => {
              const sorted = [...deptDataY].sort((a, b) => b[cat] - a[cat]);
              sorted.forEach((d, i) => {
                d[`${cat}_DeptRank`] = i + 1;
              });
            });
          });
        });

        // -------- 3-year combined totals --------
        const combinedMap = {};
        processed.forEach(d => {
          const key = d.Faculty + "|" + d.Department;
          if (!combinedMap[key]) {
            combinedMap[key] = {
              Faculty: d.Faculty,
              Department: d.Department,
              SCI: 0, Scopus: 0, Projects: 0,
              Patents: 0, Events: 0, Books: 0, PhD: 0,
              TotalContribution: 0,
            };
          }
          categories.forEach(c => { combinedMap[key][c] += d[c]; });
          combinedMap[key].TotalContribution += d.TotalContribution;
        });
        const combinedData = Object.values(combinedMap);

        // Combined institute ranks + Top% per category + total
        categories.concat("TotalContribution").forEach(cat => {
          const sorted = [...combinedData].sort((a, b) => b[cat] - a[cat]);
          const N = sorted.length;
          sorted.forEach((d, i) => {
            d[`${cat}_InstituteRank`] = i + 1;
            d[`${cat}_TopPercent`] = ((i + 1) / N) * 100; // Top X%
          });
        });

        // Combined department ranks per category + total
        const deptSet = [...new Set(combinedData.map(d => d.Department))];
        deptSet.forEach(dep => {
          const deptRows = combinedData.filter(d => d.Department === dep);
          categories.concat("TotalContribution").forEach(cat => {
            const sorted = [...deptRows].sort((a, b) => b[cat] - a[cat]);
            sorted.forEach((d, i) => {
              d[`${cat}_DeptRank`] = i + 1;
            });
          });
        });

        // Finalize state
        setData(processed);
        setCombined(combinedData);
        setDepartments([...new Set(processed.map(d => d.Department))]);

        // Unique faculty list for dropdowns & search suggestions
        const facPairs = processed.map(d => ({ Faculty: d.Faculty, Department: d.Department }));
        const uniqueFac = Array.from(new Map(facPairs.map(f => [f.Faculty, f])).values());
        setFacultyList(uniqueFac);
      },
    });
  }, []);

  // Refresh selected faculty's data (year-wise + combined row)
  useEffect(() => {
    if (selectedFaculty) {
      const fdata = data.filter(d => d.Faculty === selectedFaculty).sort((a, b) => a.Year - b.Year);
      setFacultyData(fdata);
      setCombinedFaculty(combined.find(d => d.Faculty === selectedFaculty) || null);
    }
  }, [selectedFaculty, data, combined]);

  return (
    <Box p={6}>
      <Heading mb={6} color="teal.600" size="xl" textAlign="center">
        Faculty Contribution Dashboard
      </Heading>

      <Tabs variant="soft-rounded" colorScheme="teal">
        <TabList justifyContent="center" mb={4} gap={3}>
  <Tab
    border="1px solid"
    borderColor="gray.300"
    borderRadius="full"
    px={4}
    py={2}
    _hover={{ bg: "gray.50" }}
    _selected={{ bg: "teal.500", borderColor: "teal.500", color: "white" }}
  >
    Individual Faculty Ranking
  </Tab>

  <Tab
    border="1px solid"
    borderColor="gray.300"
    borderRadius="full"
    px={4}
    py={2}
    _hover={{ bg: "gray.50" }}
    _selected={{ bg: "blue.500", borderColor: "blue.500", color: "white" }}
  >
    Department Summary
  </Tab>

  <Tab
    border="1px solid"
    borderColor="gray.300"
    borderRadius="full"
    px={4}
    py={2}
    _hover={{ bg: "gray.50" }}
    _selected={{ bg: "purple.500", borderColor: "purple.500", color: "white" }}
  >
    Institute Summary
  </Tab>
</TabList>


        <TabPanels>
          {/* TAB 1: Individual Faculty Ranking */}
          <TabPanel>
            {/* Search bar with dynamic dropdown */}
            <Box mb={6} width="300px" mx="auto" position="relative">
              <Input
                placeholder="Search Faculty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <Box
                  border="1px solid #ccc"
                  borderRadius="md"
                  mt={1}
                  maxH="200px"
                  overflowY="auto"
                  bg="white"
                  shadow="md"
                  zIndex={10}
                  position="absolute"
                  width="100%"
                >
                  {facultyList
                    .filter(f => f.Faculty.toLowerCase().includes(search.toLowerCase()))
                    .slice(0, 10)
                    .map((f, i) => (
                      <Box
                        key={i}
                        px={3}
                        py={2}
                        _hover={{ bg: "teal.100", cursor: "pointer" }}
                        onClick={() => {
                          setSelectedFaculty(f.Faculty);
                          setSelectedDept(""); // don't constrain by dept when selecting from search
                          setSearch("");
                        }}
                      >
                        {f.Faculty}{" "}
                        <Text as="span" color="gray.500">({f.Department})</Text>
                      </Box>
                    ))}
                </Box>
              )}
            </Box>

            {/* Department + Faculty dropdowns */}
            <Box display="flex" gap={4} mb={6} justifyContent="center">
              <Select
                placeholder="Select Department"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedFaculty("");
                  setFacultyData([]);
                }}
                width="260px"
              >
                {departments.map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </Select>

              <Select
                placeholder="Select Faculty"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                width="260px"
              >
                {facultyList
                  .filter(f => !selectedDept || f.Department === selectedDept)
                  .map((f, i) => (
                    <option key={i} value={f.Faculty}>{f.Faculty}</option>
                  ))}
              </Select>
            </Box>

            {/* Individual faculty content */}
            {facultyData.length > 0 && combinedFaculty && (
              <Box>
                <Heading size="md" mb={3}>
                  {selectedFaculty} – {facultyData[0].Department}
                </Heading>

                {/* Year-wise Contributions */}
                <Heading size="sm" mb={2}>Year-wise Contributions</Heading>
                <Table variant="striped" colorScheme="teal" size="sm" mb={6}>
                  <Thead>
                    <Tr>
                      <Th>Year</Th>
                      {categories.map(c => <Th key={c}>{c}</Th>)}
                      <Th>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {facultyData.map((row, i) => (
                      <Tr key={i}>
                        <Td>{row.Year}</Td>
                        {categories.map(c => <Td key={c}>{row[c]}</Td>)}
                        <Td>{row.TotalContribution}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                {/* Year-wise Rankings with arrows */}
                <Heading size="sm" mb={2}>Year-wise Rankings</Heading>
                <Table variant="striped" colorScheme="blue" size="sm" mb={6}>
                  <Thead>
                    <Tr>
                      <Th>Year</Th>
                      {categories.map(c => <Th key={c}>{c} (Dept | Inst)</Th>)}
                      <Th>Total (Dept | Inst)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {facultyData.map((row, i) => (
                      <Tr key={i}>
                        <Td>{row.Year}</Td>
                        {categories.map(c => (
                          <Td key={c}>
                            <RankWithArrow
                              current={row[`${c}_DeptRank`]}
                              prev={i > 0 ? facultyData[i - 1][`${c}_DeptRank`] : null}
                            />{" "}
                            |{" "}
                            <RankWithArrow
                              current={row[`${c}_InstituteRank`]}
                              prev={i > 0 ? facultyData[i - 1][`${c}_InstituteRank`] : null}
                            />
                          </Td>
                        ))}
                        <Td>
                          <RankWithArrow
                            current={row[`TotalContribution_DeptRank`]}
                            prev={i > 0 ? facultyData[i - 1][`TotalContribution_DeptRank`] : null}
                          />{" "}
                          |{" "}
                          <RankWithArrow
                            current={row[`TotalContribution_InstituteRank`]}
                            prev={i > 0 ? facultyData[i - 1][`TotalContribution_InstituteRank`] : null}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                {/* 3-Year Combined Contributions */}
                <Heading size="sm" mb={2}>3-Year Combined Contributions</Heading>
                <Table variant="striped" colorScheme="green" size="sm" mb={6}>
                  <Thead>
                    <Tr>
                      <Th>Faculty</Th>
                      <Th>Department</Th>
                      {categories.map(c => <Th key={c}>{c}</Th>)}
                      <Th>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>{combinedFaculty.Faculty}</Td>
                      <Td>{combinedFaculty.Department}</Td>
                      {categories.map(c => <Td key={c}>{combinedFaculty[c]}</Td>)}
                      <Td>{combinedFaculty.TotalContribution}</Td>
                    </Tr>
                  </Tbody>
                </Table>

                {/* 3-Year Combined Rankings */}
                <Heading size="sm" mb={2}>3-Year Combined Rankings</Heading>
                <Table variant="striped" colorScheme="purple" size="sm" mb={6}>
                  <Thead>
                    <Tr>
                      <Th>Faculty</Th>
                      <Th>Department</Th>
                      {categories.map(c => <Th key={c}>{c} (Dept | Inst)</Th>)}
                      <Th>Total (Dept | Inst)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>{combinedFaculty.Faculty}</Td>
                      <Td>{combinedFaculty.Department}</Td>
                      {categories.map(c => (
                        <Td key={c}>
                          {combinedFaculty[`${c}_DeptRank`]} | {combinedFaculty[`${c}_InstituteRank`]}
                        </Td>
                      ))}
                      <Td>
                        {combinedFaculty[`TotalContribution_DeptRank`]} | {combinedFaculty[`TotalContribution_InstituteRank`]}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>

                {/* Graphs Overview with legend */}
                <Box mt={10}>
                  <Heading size="sm" mb={2}>Graphs Overview</Heading>

                  {/* Legend */}
                  <Box mb={4} display="flex" flexWrap="wrap" gap={3} justifyContent="center">
                    {Object.entries(categoryColors).map(([key, color]) => (
                      <Box
                        key={key}
                        px={3}
                        py={1}
                        borderRadius="md"
                        bg={color}
                        color="white"
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {key}
                      </Box>
                    ))}
                  </Box>

                  {/* Graph 1: Dept Ranks over Years */}
                  <Heading size="sm" mb={2}>Department Ranks over Years</Heading>
                  <LineChart width={900} height={400} data={facultyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Year" />
                    <YAxis reversed />
                    <Tooltip />
                    <Legend />
                    {Object.entries(categoryColors).map(([c, color]) => (
                      <Line
                        key={c}
                        type="monotone"
                        dataKey={`${c}_DeptRank`}
                        name={`${c} Dept Rank`}
                        stroke={color}
                      />
                    ))}
                  </LineChart>

                  {/* Graph 2: Institute Top % (3-Year Combined) */}
                  <Heading size="sm" mt={6} mb={2}>Institute Top % (3-Year Combined)</Heading>
                  <BarChart width={900} height={400} data={[combinedFaculty]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Faculty" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Legend />
                    {Object.entries(categoryColors).map(([c, color]) => (
                      <Bar
                        key={c}
                        dataKey={`${c}_TopPercent`}
                        name={`${c} Top %`}
                        fill={color}
                      />
                    ))}
                  </BarChart>

                  {/* Graph 3: Percentage Contribution to Department (3-Year Combined) */}
                  <Heading size="sm" mt={6} mb={2}>Percentage Contribution to Department (3-Year Combined)</Heading>
                  <BarChart width={900} height={400} data={[combinedFaculty]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Faculty" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Legend />
                    {Object.entries(categoryColors).map(([c, color]) => (
                      <Bar
                        key={c}
                        dataKey={(d) => {
                          const deptTotal = combined
                            .filter(x => x.Department === d.Department)
                            .reduce((sum, x) => sum + x[c], 0);
                          return deptTotal > 0 ? (d[c] / deptTotal) * 100 : 0;
                        }}
                        name={`${c} Dept %`}
                        fill={color}
                      />
                    ))}
                  </BarChart>
                </Box>
              </Box>
            )}
          </TabPanel>

          {/* TAB 2: Department Summary */}
          <TabPanel>
            <Heading size="md" mb={4}>Department Summary</Heading>

            <Box display="flex" gap={4} mb={4}>
              <Select
                placeholder="Select Department"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                width="200px"
              >
                {departments.map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </Select>

              <Select
                placeholder="Select Component"
                value={deptComponent}
                onChange={(e) => setDeptComponent(e.target.value)}
                width="200px"
              >
                {categories.concat("TotalContribution").map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </Select>
            </Box>

            {selectedDept && deptComponent && (
              <>
                <Table variant="striped" colorScheme="teal" size="sm" mb={6}>
                  <Thead>
                    <Tr>
                      <Th>Faculty</Th>
                      <Th>{deptComponent}</Th>
                      <Th>Dept Rank</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {combined
                      .filter(d => d.Department === selectedDept)
                      .sort((a, b) => a[`${deptComponent}_DeptRank`] - b[`${deptComponent}_DeptRank`])
                      .map((row, i) => (
                        <Tr key={i}>
                          <Td>{row.Faculty}</Td>
                          <Td>{row[deptComponent]}</Td>
                          <Td>{row[`${deptComponent}_DeptRank`]}</Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>

                {/* Bar Chart: Faculty contributions in selected Department */}
                <Heading size="sm" mb={2}>
                  {deptComponent} Contributions in {selectedDept}
                </Heading>
                <BarChart
                  width={900}
                  height={400}
                  data={combined.filter(d => d.Department === selectedDept)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Faculty" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={deptComponent} fill={categoryColors[deptComponent] || "#3182CE"} />
                </BarChart>
              </>
            )}
          </TabPanel>

          {/* TAB 3: Institute Summary */}
          <TabPanel>
            <Heading size="md" mb={4}>Institute Summary</Heading>
            <Select
              placeholder="Select Component"
              value={instComponent}
              onChange={(e) => setInstComponent(e.target.value)}
              mb={4}
              width="200px"
            >
              {categories.concat("TotalContribution").map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </Select>

            {instComponent && (
              <>
                <Table variant="striped" colorScheme="purple" size="sm" mb={6}>
                  <Thead>
                    <Tr>
                      <Th>Faculty</Th>
                      <Th>Department</Th>
                      <Th>{instComponent}</Th>
                      <Th>Institute Rank</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {combined
                      .sort((a, b) => a[`${instComponent}_InstituteRank`] - b[`${instComponent}_InstituteRank`])
                      .map((row, i) => (
                        <Tr key={i}>
                          <Td>{row.Faculty}</Td>
                          <Td>{row.Department}</Td>
                          <Td>{row[instComponent]}</Td>
                          <Td>{row[`${instComponent}_InstituteRank`]}</Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>

                {/* Bar Chart: Dept-level contributions across the institute */}
                <Heading size="sm" mb={2}>
                  {instComponent} Contributions by Department
                </Heading>
                <BarChart
                  width={900}
                  height={400}
                  data={Object.values(
                    combined.reduce((acc, curr) => {
                      if (!acc[curr.Department]) {
                        acc[curr.Department] = { Department: curr.Department, Value: 0 };
                      }
                      acc[curr.Department].Value += curr[instComponent];
                      return acc;
                    }, {})
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Value" name={instComponent} fill={categoryColors[instComponent] || "#805AD5"} />
                </BarChart>
              </>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FacultyDashboard;
