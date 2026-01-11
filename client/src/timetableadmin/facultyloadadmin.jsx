// import React, { useEffect, useState, useMemo, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Box,
//   Table,
//   Thead,
//   Tbody,
//   HStack,
//   Tr,
//   Th,
//   Td,
//   Spinner,
//   Alert,
//   AlertIcon,
//   Container,
//   FormControl,
//   FormLabel,
//   Select,
//   Button,
//   VStack,
//   Text,
//   IconButton,
//   Badge,
//   Card,
//   CardHeader,
//   CardBody,
//   Heading,
//   Flex,
//   SimpleGrid,
//   Tooltip,
//   AlertDescription,
//   Tabs,
//   TabList,
//   TabPanels,
//   Tab,
//   TabPanel,
//   Progress,
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
//   PopoverHeader,
//   PopoverBody,
//   PopoverArrow,
//   PopoverCloseButton,
//   Divider,
//   useBreakpointValue,
//   Wrap,
//   WrapItem,
//   Stat,
//   StatLabel,
//   StatNumber,
//   StatHelpText,
//   Grid,
//   GridItem,
// } from '@chakra-ui/react';
// import { 
//   FaSearch, 
//   FaBuilding, 
//   FaUserTie, 
//   FaChalkboardTeacher,
//   FaFlask,
//   FaBook,
//   FaUsers,
// } from 'react-icons/fa';
// import { DownloadIcon, ArrowBackIcon, InfoIcon } from '@chakra-ui/icons';
// import { Parser } from '@json2csv/plainjs';
// import { Helmet } from 'react-helmet-async';
// import getEnvironment from '../getenvironment';
// import Header from '../components/header';

// // Designation color mapping
// const getDesignationStyle = (designation) => {
//   const lowerDesignation = designation?.toLowerCase() || '';
  
//   if (lowerDesignation.includes('professor') && !lowerDesignation.includes('assistant') && !lowerDesignation.includes('associate')) {
//     return { bg: 'purple.50', hoverBg: 'purple.100', borderLeft: '4px solid', borderColor: 'purple.500', badge: 'purple' };
//   } else if (lowerDesignation.includes('associate')) {
//     return { bg: 'blue.50', hoverBg: 'blue.100', borderLeft: '4px solid', borderColor: 'blue.500', badge: 'blue' };
//   } else if (lowerDesignation.includes('assistant')) {
//     return { bg: 'teal.50', hoverBg: 'teal.100', borderLeft: '4px solid', borderColor: 'teal.500', badge: 'teal' };
//   } else {
//     return { bg: 'gray.50', hoverBg: 'gray.100', borderLeft: '4px solid', borderColor: 'gray.400', badge: 'gray' };
//   }
// };

// // Faculty Summary Tooltip Component
// const FacultySummaryTooltip = ({ faculty, children }) => {
//   const subjects = faculty.subjects || [];
  
//   return (
//     <Popover trigger="hover" placement="right" openDelay={200}>
//       <PopoverTrigger>
//         {children}
//       </PopoverTrigger>
//       <PopoverContent 
//         w={{ base: "280px", md: "350px" }} 
//         boxShadow="xl" 
//         borderRadius="lg"
//         border="2px solid"
//         borderColor="teal.200"
//       >
//         <PopoverArrow />
//         <PopoverHeader 
//           bg="teal.500" 
//           color="white" 
//           fontWeight="bold" 
//           borderTopRadius="md"
//           py={3}
//         >
//           <HStack spacing={2}>
//             <FaUserTie />
//             <Text fontSize={{ base: "sm", md: "md" }}>{faculty.faculty}</Text>
//           </HStack>
//           {faculty.designation && (
//             <Badge colorScheme="whiteAlpha" mt={1} fontSize="xs">
//               {faculty.designation}
//             </Badge>
//           )}
//         </PopoverHeader>
//         <PopoverBody p={0} maxH="300px" overflowY="auto">
//           {subjects.length > 0 ? (
//             <Box>
//               <Box bg="gray.50" px={3} py={2} borderBottom="1px" borderColor="gray.200">
//                 <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
//                   Subject Load Summary
//                 </Text>
//               </Box>
//               {subjects.map((subject, idx) => (
//                 <Box 
//                   key={idx} 
//                   px={3} 
//                   py={2} 
//                   borderBottom="1px" 
//                   borderColor="gray.100"
//                   _hover={{ bg: 'gray.50' }}
//                 >
//                   <Flex justify="space-between" align="center" flexWrap="wrap" gap={1}>
//                     <VStack align="start" spacing={0} flex="1" minW="0">
//                       <Text 
//                         fontSize={{ base: "xs", md: "sm" }} 
//                         fontWeight="medium" 
//                         noOfLines={2}
//                         wordBreak="break-word"
//                       >
//                         {subject.subjectFullName || subject.subCode}
//                       </Text>
//                       <HStack spacing={1} flexWrap="wrap">
//                         <Badge 
//                           size="sm" 
//                           colorScheme={
//                             subject.subType?.toLowerCase() === 'theory' ? 'green' :
//                             subject.subType?.toLowerCase() === 'laboratory' ? 'red' : 'orange'
//                           }
//                           fontSize="2xs"
//                         >
//                           {subject.subType}
//                         </Badge>
//                         <Text fontSize="2xs" color="gray.500">{subject.subSem}</Text>
//                       </HStack>
//                     </VStack>
//                     <Badge colorScheme="blue" fontSize={{ base: "xs", md: "sm" }} px={2}>
//                       {subject.count} hrs
//                     </Badge>
//                   </Flex>
//                 </Box>
//               ))}
//               <Box bg="teal.50" px={3} py={2}>
//                 <Flex justify="space-between" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
//                   <Text>Total Load:</Text>
//                   <Text color="teal.600">{faculty.total?.total || 0} hrs</Text>
//                 </Flex>
//               </Box>
//             </Box>
//           ) : (
//             <Box p={4} textAlign="center">
//               <Text color="gray.500" fontSize="sm">No subject data available</Text>
//             </Box>
//           )}
//         </PopoverBody>
//       </PopoverContent>
//     </Popover>
//   );
// };

// // Student Count Tooltip Component
// const StudentCountTooltip = ({ faculty, type, children }) => {
//   const subjects = (faculty.subjects || []).filter(s => 
//     s.subType?.toLowerCase() === type.toLowerCase()
//   );
  
//   return (
//     <Popover trigger="hover" placement="top" openDelay={200}>
//       <PopoverTrigger>
//         {children}
//       </PopoverTrigger>
//       <PopoverContent 
//         w={{ base: "250px", md: "300px" }} 
//         boxShadow="xl" 
//         borderRadius="lg"
//         border="2px solid"
//         borderColor="pink.200"
//       >
//         <PopoverArrow />
//         <PopoverHeader 
//           bg="pink.500" 
//           color="white" 
//           fontWeight="bold" 
//           borderTopRadius="md"
//           py={2}
//         >
//           <HStack spacing={2}>
//             <FaUsers />
//             <Text fontSize={{ base: "xs", md: "sm" }}>
//               {type.charAt(0).toUpperCase() + type.slice(1)} - Student Count Details
//             </Text>
//           </HStack>
//         </PopoverHeader>
//         <PopoverBody p={0} maxH="200px" overflowY="auto">
//           {subjects.length > 0 ? (
//             <Box>
//               {subjects.map((subject, idx) => (
//                 <Box 
//                   key={idx} 
//                   px={3} 
//                   py={2} 
//                   borderBottom="1px" 
//                   borderColor="gray.100"
//                   _hover={{ bg: 'gray.50' }}
//                 >
//                   <Flex justify="space-between" align="center" gap={2}>
//                     <Text fontSize={{ base: "xs", md: "sm" }} noOfLines={1} flex="1">
//                       {subject.subjectFullName || subject.subCode}
//                     </Text>
//                     <Badge colorScheme="purple" fontSize="xs">
//                       {subject.studentCount || 0} students
//                     </Badge>
//                   </Flex>
//                 </Box>
//               ))}
//             </Box>
//           ) : (
//             <Box p={3} textAlign="center">
//               <Text color="gray.500" fontSize="sm">No {type} subjects</Text>
//             </Box>
//           )}
//         </PopoverBody>
//       </PopoverContent>
//     </Popover>
//   );
// };

// const MasterLoadDataTable = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, stage: '' });
//   const [error, setError] = useState(null);
//   const [allSessions, setAllSessions] = useState([]);
//   const [selectedSession, setSelectedSession] = useState('');
//   const [previousSession, setPreviousSession] = useState('');
  
//   // Department-wise faculty load data
//   const [currentLoad, setCurrentLoad] = useState({});
//   const [previousLoad, setPreviousLoad] = useState({});
//   const [departments, setDepartments] = useState([]);
//   const [facultyDetails, setFacultyDetails] = useState({});
  
//   const apiUrl = getEnvironment();
  
//   // Responsive values
//   const tableSize = useBreakpointValue({ base: "sm", md: "md" });
//   const headingSize = useBreakpointValue({ base: "sm", md: "md", lg: "lg" });
//   const buttonSize = useBreakpointValue({ base: "sm", md: "md" });

//   // Fetch all sessions on mount
//   useEffect(() => {
//     const fetchSessions = async () => {
//       try {
//         const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         const data = await response.json();
//         const { uniqueSessions } = data;
//         setAllSessions(uniqueSessions);
        
//         if (uniqueSessions && uniqueSessions.length > 0) {
//           setSelectedSession(uniqueSessions[0].session);
//           if (uniqueSessions.length > 1) {
//             setPreviousSession(uniqueSessions[1].session);
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching session and department data:', error);
//       }
//     };
//     fetchSessions();
//   }, [apiUrl]);

//   // Generate initial timetable data structure from fetched data
//   const generateInitialTimetableData = useCallback((fetchedData, type) => {
//     const initialData = {};
//     const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
//     const periods = [1, 2, 3, 4, 5, 6, 7, 8, 'lunch'];

//     for (const day of days) {
//       initialData[day] = {};
//       for (const period of periods) {
//         if (period === 'lunch') {
//           initialData[day]['lunch'] = [];
//           if (fetchedData[day] && fetchedData[day]['lunch']) {
//             const slotData = fetchedData[day]['lunch'];
//             for (const slot of slotData) {
//               const slotSubjects = [];
//               for (const slotItem of slot) {
//                 const subj = slotItem.subject || "";
//                 const room = type === "room" ? (slotItem.sem || "") : (slotItem.room || "");
//                 const faculty = type === "faculty" ? (slotItem.sem || "") : (slotItem.faculty || "");
//                 if (subj || room || faculty) {
//                   slotSubjects.push({ subject: subj, room, faculty });
//                 }
//               }
//               initialData[day]['lunch'].push(slotSubjects);
//             }
//           }
//         } else {
//           initialData[day][`period${period}`] = [];
//           if (fetchedData[day] && fetchedData[day][`period${period}`]) {
//             const slotData = fetchedData[day][`period${period}`];
//             for (const slot of slotData) {
//               const slotSubjects = [];
//               for (const slotItem of slot) {
//                 const subj = slotItem.subject || "";
//                 const room = type === "room" ? (slotItem.sem || "") : (slotItem.room || "");
//                 const faculty = type === "faculty" ? (slotItem.sem || "") : (slotItem.faculty || "");
//                 if (subj || room || faculty) {
//                   slotSubjects.push({ subject: subj, room, faculty });
//                 }
//               }
//               if (slotSubjects.length === 0) {
//                 slotSubjects.push({ subject: "", room: "", faculty: "" });
//               }
//               initialData[day][`period${period}`].push(slotSubjects);
//             }
//           } else {
//             initialData[day][`period${period}`].push([]);
//           }
//         }
//       }
//     }
//     return initialData;
//   }, []);

//   // Generate summary from timetable data
//   const generateSummary = useCallback((timetableData, subjectDataArray, type, headTitle, commonLoad) => {
//     const summaryData = {};

//     for (const day in timetableData) {
//       for (let period = 1; period <= 9; period++) {
//         let slots = period === 9 ? timetableData[day]['lunch'] : timetableData[day][`period${period}`];
//         if (slots) {
//           slots.forEach((slot) => {
//             slot.forEach((cell) => {
//               if (cell.subject) {
//                 const { subject, faculty, room } = cell;
//                 let foundSubject = null;
                
//                 if (type === 'faculty') {
//                   foundSubject = subjectDataArray.find(item => item.subName === subject && item.sem === faculty);
//                 } else if (type === 'room') {
//                   foundSubject = subjectDataArray.find(item => item.subName === subject && item.sem === room);
//                 } else if (type === 'sem') {
//                   foundSubject = subjectDataArray.find(item => item.subName === subject && item.sem === headTitle);
//                 }
                
//                 if (foundSubject) {
//                   if (!summaryData[subject]) {
//                     summaryData[subject] = {
//                       subCode: foundSubject.subCode,
//                       count: 1,
//                       faculties: [faculty],
//                       subType: foundSubject.type,
//                       rooms: [room],
//                       subjectFullName: foundSubject.subjectFullName,
//                       subSem: foundSubject.sem,
//                       studentCount: parseInt(foundSubject.studentCount) || 0,
//                     };
//                   } else {
//                     summaryData[subject].count++;
//                     if (!summaryData[subject].faculties.includes(faculty)) {
//                       summaryData[subject].faculties.push(faculty);
//                     }
//                     if (!summaryData[subject].rooms.includes(room)) {
//                       summaryData[subject].rooms.push(room);
//                     }
//                   }
//                 }
//               }
//             });
//           });
//         }
//       }
//     }

//     // Merge similar entries
//     const mergedSummaryData = {};
//     for (const key in summaryData) {
//       const entry = summaryData[key];
//       let isMerged = false;

//       for (const existingKey in mergedSummaryData) {
//         const existingEntry = mergedSummaryData[existingKey];
//         if (
//           entry.faculties.every(faculty => existingEntry.faculties.includes(faculty)) &&
//           entry.subType === existingEntry.subType &&
//           entry.subjectFullName === existingEntry.subjectFullName &&
//           entry.rooms.every(room => existingEntry.rooms.includes(room))
//         ) {
//           existingEntry.count += entry.count;
//           existingEntry.faculties = [...new Set([...existingEntry.faculties, ...entry.faculties])];
//           existingEntry.originalKeys.push(key);
//           isMerged = true;
//           break;
//         }
//       }

//       if (!isMerged) {
//         mergedSummaryData[key] = { ...entry, originalKeys: [key] };
//       }
//     }

//     // Sort by subCode and subType
//     const sortedSummary = Object.values(mergedSummaryData).sort((a, b) => {
//       const subCodeComparison = a.subCode.localeCompare(b.subCode);
//       if (subCodeComparison !== 0) return subCodeComparison;

//       const subtypePriority = (subtype) => {
//         switch (subtype?.toLowerCase()) {
//           case 'theory': return 0;
//           case 'tutorial': return 1;
//           case 'laboratory': return 2;
//           default: return 3;
//         }
//       };
//       return subtypePriority(a.subType) - subtypePriority(b.subType);
//     });

//     let sortedSummaryEntries = [...sortedSummary];

//     // Add common load items
//     if (commonLoad && Array.isArray(commonLoad)) {
//       commonLoad.forEach((commonLoadItem) => {
//         sortedSummaryEntries.push({
//           count: commonLoadItem.hrs,
//           faculties: [],
//           originalKeys: [commonLoadItem.subName],
//           rooms: [],
//           subCode: commonLoadItem.subCode,
//           subjectFullName: commonLoadItem.subFullName,
//           subType: commonLoadItem.subType,
//           subSem: commonLoadItem.sem,
//           studentCount: parseInt(commonLoadItem.studentCount) || 0,
//         });
//       });
//     }

//     return sortedSummaryEntries;
//   }, []);

//   // Compute faculty load with normalized metrics
//   const computeFacultyLoadFromSummary = useCallback((subjects, facultyName, department, designation) => {
//     const total = { theory: 0, laboratory: 0, tutorial: 0, total: 0 };
//     const studentHours = {
//       theory: { totalStudentHours: 0, totalHours: 0 },
//       laboratory: { totalStudentHours: 0, totalHours: 0 },
//       tutorial: { totalStudentHours: 0, totalHours: 0 }
//     };

//     subjects.forEach((item) => {
//       const subType = item.subType?.toLowerCase() || 'other';
//       const hours = item.count || 0;
//       const studentCount = item.studentCount || 0;

//       total.total += hours;
      
//       if (subType === 'theory') {
//         total.theory += hours;
//         studentHours.theory.totalStudentHours += studentCount * hours;
//         studentHours.theory.totalHours += hours;
//       } else if (subType === 'laboratory') {
//         total.laboratory += hours;
//         studentHours.laboratory.totalStudentHours += studentCount * hours;
//         studentHours.laboratory.totalHours += hours;
//       } else if (subType === 'tutorial') {
//         total.tutorial += hours;
//         studentHours.tutorial.totalStudentHours += studentCount * hours;
//         studentHours.tutorial.totalHours += hours;
//       }
//     });

//     const normalizedTheory = studentHours.theory.totalHours > 0
//       ? (studentHours.theory.totalStudentHours / studentHours.theory.totalHours).toFixed(2)
//       : '0.00';
//     const normalizedLab = studentHours.laboratory.totalHours > 0
//       ? (studentHours.laboratory.totalStudentHours / studentHours.laboratory.totalHours).toFixed(2)
//       : '0.00';
//     const normalizedTutorial = studentHours.tutorial.totalHours > 0
//       ? (studentHours.tutorial.totalStudentHours / studentHours.tutorial.totalHours).toFixed(2)
//       : '0.00';

//     const normalizedLoad = (
//       (total.theory * parseFloat(normalizedTheory)) +
//       (total.tutorial * parseFloat(normalizedTutorial)) +
//       ((total.laboratory / 2) * parseFloat(normalizedLab))
//     ).toFixed(2);

//     return {
//       faculty: facultyName,
//       department,
//       designation,
//       total,
//       normalizedStudentCount: {
//         theory: normalizedTheory,
//         laboratory: normalizedLab,
//         tutorial: normalizedTutorial
//       },
//       normalizedLoad,
//       subjects
//     };
//   }, []);

//   // Fetch all data for a session
//   const fetchSessionData = useCallback(async (session, isPrevious = false) => {
//     if (!session) return {};

//     try {
//       // Step 1: Get all timetable codes for this session
//       setLoadingProgress(prev => ({ ...prev, stage: `Fetching timetable codes for ${session}...` }));
//       const codesResponse = await fetch(`${apiUrl}/timetablemodule/timetable/getallcodes/${session}`, { credentials: 'include' });
//       if (!codesResponse.ok) throw new Error('Failed to fetch timetable codes');
//       const timetableCodes = await codesResponse.json();

//       const deptLoadData = {};
//       const allDepartments = new Set();
//       const allSubjectData = {};
//       const allFacultyDetails = {};

//       let processedCount = 0;
//       const totalCodes = timetableCodes.length;

//       // Step 2: Process each timetable code
//       for (const ttInfo of timetableCodes) {
//         const code = ttInfo.code;
//         const dept = ttInfo.dept;
        
//         if (!dept) continue;
//         allDepartments.add(dept);

//         setLoadingProgress(prev => ({ 
//           ...prev, 
//           current: processedCount, 
//           total: totalCodes,
//           stage: `Processing ${dept} (${processedCount + 1}/${totalCodes})...`
//         }));

//         try {
//           // Fetch subject data for this code
//           const subjectResponse = await fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${code}`, { credentials: 'include' });
//           if (subjectResponse.ok) {
//             const subjects = await subjectResponse.json();
//             allSubjectData[code] = subjects;
//           }

//           // Fetch faculty list for this department (with designation)
//           const facultyResponse = await fetch(`${apiUrl}/timetablemodule/faculty/dept/${dept}`, { credentials: 'include' });
//           if (!facultyResponse.ok) continue;
//           const faculties = await facultyResponse.json();

//           if (!Array.isArray(faculties) || faculties.length === 0) continue;

//           // Store faculty details
//           faculties.forEach(f => {
//             if (!allFacultyDetails[f.name]) {
//               allFacultyDetails[f.name] = {
//                 name: f.name,
//                 designation: f.designation,
//                 dept: f.dept
//               };
//             }
//           });

//           if (!deptLoadData[dept]) {
//             deptLoadData[dept] = [];
//           }

//           // Step 3: Fetch timetable data for each faculty
//           for (const faculty of faculties) {
//             const facultyName = faculty.name;
//             const designation = faculty.designation;
            
//             try {
//               // Fetch faculty timetable using viewfacultytt API
//               const ttResponse = await fetch(
//                 `${apiUrl}/timetablemodule/tt/viewfacultytt/${code}/${facultyName}`,
//                 { credentials: 'include' }
//               );
              
//               if (!ttResponse.ok) continue;
              
//               const ttData = await ttResponse.json();
//               const timetableData = ttData.timetableData || {};
              
//               // Generate initial timetable structure
//               const initialData = generateInitialTimetableData(timetableData, 'faculty');
              
//               // Fetch common/project load for this faculty
//               let commonLoad = [];
//               try {
//                 const commonLoadResponse = await fetch(
//                   `${apiUrl}/timetablemodule/commonLoad/${code}/${facultyName}`,
//                   { credentials: 'include' }
//                 );
//                 if (commonLoadResponse.ok) {
//                   commonLoad = await commonLoadResponse.json();
//                 }
//               } catch (e) {
//                 // Common load might not exist for all faculty
//               }

//               // Generate summary (returns array now)
//               const subjects = generateSummary(
//                 initialData,
//                 allSubjectData[code] || [],
//                 'faculty',
//                 facultyName,
//                 commonLoad
//               );

//               // Check if this faculty already exists in department data
//               const existingFacultyIndex = deptLoadData[dept].findIndex(f => f.faculty === facultyName);
              
//               if (existingFacultyIndex >= 0) {
//                 // Merge subjects
//                 const existingData = deptLoadData[dept][existingFacultyIndex];
//                 const mergedSubjects = [...existingData.subjects, ...subjects];
                
//                 deptLoadData[dept][existingFacultyIndex] = computeFacultyLoadFromSummary(
//                   mergedSubjects,
//                   facultyName,
//                   dept,
//                   designation
//                 );
//               } else {
//                 // Add new faculty entry
//                 const facultyLoad = computeFacultyLoadFromSummary(subjects, facultyName, dept, designation);
//                 if (facultyLoad.total.total > 0) {
//                   deptLoadData[dept].push(facultyLoad);
//                 }
//               }
//             } catch (e) {
//               console.error(`Error fetching data for faculty ${facultyName}:`, e);
//             }
//           }
//         } catch (e) {
//           console.error(`Error processing code ${code}:`, e);
//         }

//         processedCount++;
//       }

//       if (!isPrevious) {
//         setFacultyDetails(allFacultyDetails);
//       }

//       return { loadData: deptLoadData, departments: Array.from(allDepartments).sort() };
//     } catch (error) {
//       console.error('Error fetching session data:', error);
//       throw error;
//     }
//   }, [apiUrl, generateInitialTimetableData, generateSummary, computeFacultyLoadFromSummary]);

//   // Fetch data when session changes
//   useEffect(() => {
//     const fetchAllData = async () => {
//       if (!selectedSession) return;

//       setLoading(true);
//       setError(null);
//       setLoadingProgress({ current: 0, total: 0, stage: 'Starting...' });

//       try {
//         // Fetch current session data
//         const currentResult = await fetchSessionData(selectedSession, false);
//         setCurrentLoad(currentResult.loadData || {});
//         setDepartments(currentResult.departments || []);

//         // Fetch previous session data if available
//         if (previousSession) {
//           setLoadingProgress(prev => ({ ...prev, stage: 'Fetching previous session data...' }));
//           const previousResult = await fetchSessionData(previousSession, true);
//           setPreviousLoad(previousResult.loadData || {});
//         }
//       } catch (error) {
//         setError(error);
//       } finally {
//         setLoading(false);
//         setLoadingProgress({ current: 0, total: 0, stage: '' });
//       }
//     };

//     fetchAllData();
//   }, [selectedSession, previousSession, fetchSessionData]);

//   // Sort faculty by yearly average load (descending)
//   const getSortedFacultyList = useCallback((dept) => {
//     const facultyList = currentLoad[dept] || [];
    
//     return [...facultyList].sort((a, b) => {
//       const prevA = (previousLoad[dept] || []).find(f => f.faculty === a.faculty);
//       const prevB = (previousLoad[dept] || []).find(f => f.faculty === b.faculty);
      
//       const yearlyAvgA = ((parseFloat(a.normalizedLoad) + parseFloat(prevA?.normalizedLoad || '0.00')) / 2);
//       const yearlyAvgB = ((parseFloat(b.normalizedLoad) + parseFloat(prevB?.normalizedLoad || '0.00')) / 2);
      
//       return yearlyAvgB - yearlyAvgA; // Descending order
//     });
//   }, [currentLoad, previousLoad]);

//   // Calculate department totals
//   const getDepartmentTotals = useCallback((dept) => {
//     const facultyList = currentLoad[dept] || [];
//     const totals = {
//       theory: 0,
//       laboratory: 0,
//       tutorial: 0,
//       total: 0,
//       normalizedLoad: 0,
//       facultyCount: facultyList.length
//     };

//     facultyList.forEach(f => {
//       totals.theory += f.total.theory;
//       totals.laboratory += f.total.laboratory;
//       totals.tutorial += f.total.tutorial;
//       totals.total += f.total.total;
//       totals.normalizedLoad += parseFloat(f.normalizedLoad);
//     });

//     return totals;
//   }, [currentLoad]);

//   // Download CSV for a department
//   const downloadDepartmentFacultyLoadCSV = (dept) => {
//     const facultyList = getSortedFacultyList(dept);
//     const csvData = facultyList.map((item, index) => {
//       const prevFaculty = (previousLoad[dept] || []).find(f => f.faculty === item.faculty);
//       const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
//       const yearlyAvg = (((parseFloat(item.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
//       return {
//         'Rank': index + 1,
//         'Faculty': item.faculty,
//         'Designation': item.designation || '',
//         'Department': item.department,
//         'Total Theory': item.total.theory,
//         'Total Laboratory': item.total.laboratory,
//         'Total Tutorial': item.total.tutorial,
//         'Total Load': item.total.total,
//         'Normalized Student Count (Theory)': item.normalizedStudentCount.theory,
//         'Normalized Student Count (Laboratory)': item.normalizedStudentCount.laboratory,
//         'Normalized Student Count (Tutorial)': item.normalizedStudentCount.tutorial,
//         'Normalized Load (Current)': item.normalizedLoad,
//         'Normalized Load (Previous)': prevNormLoad,
//         'Yearly Average Load': yearlyAvg,
//       };
//     });
//     const parser = new Parser();
//     const csv = parser.parse(csvData);
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     if (link.download !== undefined) {
//       const url = URL.createObjectURL(blob);
//       link.setAttribute('href', url);
//       link.setAttribute('download', `${dept}-Faculty-Load-Analysis.csv`);
//       link.style.visibility = 'hidden';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   // Download all departments CSV
//   const downloadAllDepartmentsCSV = () => {
//     const allData = [];
//     let globalRank = 1;
    
//     departments.forEach(dept => {
//       const facultyList = getSortedFacultyList(dept);
//       facultyList.forEach((item, index) => {
//         const prevFaculty = (previousLoad[dept] || []).find(f => f.faculty === item.faculty);
//         const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
//         const yearlyAvg = (((parseFloat(item.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
//         allData.push({
//           'Global Rank': globalRank++,
//           'Department Rank': index + 1,
//           'Department': item.department,
//           'Faculty': item.faculty,
//           'Designation': item.designation || '',
//           'Total Theory': item.total.theory,
//           'Total Laboratory': item.total.laboratory,
//           'Total Tutorial': item.total.tutorial,
//           'Total Load': item.total.total,
//           'Normalized Student Count (Theory)': item.normalizedStudentCount.theory,
//           'Normalized Student Count (Laboratory)': item.normalizedStudentCount.laboratory,
//           'Normalized Student Count (Tutorial)': item.normalizedStudentCount.tutorial,
//           'Normalized Load (Current)': item.normalizedLoad,
//           'Normalized Load (Previous)': prevNormLoad,
//           'Yearly Average Load': yearlyAvg,
//         });
//       });
//     });

//     if (allData.length === 0) return;

//     const parser = new Parser();
//     const csv = parser.parse(allData);
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     if (link.download !== undefined) {
//       const url = URL.createObjectURL(blob);
//       link.setAttribute('href', url);
//       link.setAttribute('download', `All-Departments-Faculty-Load-${selectedSession}.csv`);
//       link.style.visibility = 'hidden';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   return (
//     <>
//       <Helmet>
//         <title>Master Faculty Load Analysis | XCEED NITJ</title>
//         <meta name="description" content="NITJ's official faculty load analysis across all departments" />
//       </Helmet>
//       <Box bg="gray.50" minH="100vh">
//         {/* Hero Header Section */}
//         <Box
//           bgGradient="linear(to-r, teal.500, blue.600, purple.600)"
//           pt={0}
//           pb={{ base: 20, md: 24, lg: 28 }}
//           position="relative"
//           overflow="hidden"
//         >
//           <Box
//             position="absolute"
//             top="0"
//             left="0"
//             right="0"
//             bottom="0"
//             opacity="0.1"
//             bgImage="radial-gradient(circle, white 1px, transparent 1px)"
//             bgSize="30px 30px"
//           />
//           <Box
//             position="relative"
//             zIndex={2}
//             sx={{
//               '& button[aria-label="Go back"]': { display: "none" },
//               '& .chakra-button:first-of-type': { display: "none" },
//             }}
//           >
//             <Header />
//           </Box>
//           <Container
//             maxW="7xl"
//             position="relative"
//             mt={{ base: 4, md: 6, lg: 8 }}
//             px={{ base: 4, md: 6, lg: 8 }}
//           >
//             <Flex 
//               justify="space-between" 
//               align={{ base: "start", md: "center" }}
//               direction={{ base: "column", md: "row" }}
//               gap={4}
//             >
//               <VStack
//                 spacing={{ base: 2, md: 3 }}
//                 align={{ base: "center", lg: "start" }}
//                 textAlign={{ base: "center", lg: "left" }}
//               >
//                 <Badge
//                   colorScheme="whiteAlpha"
//                   fontSize={{ base: "xs", md: "sm" }}
//                   px={{ base: 2, md: 3 }}
//                   py={1}
//                   borderRadius="full"
//                 >
//                   <HStack spacing={1}>
//                     <FaChalkboardTeacher size={12} />
//                     <Text>Faculty Load Analytics</Text>
//                   </HStack>
//                 </Badge>
//                 <Heading
//                   size={{ base: "lg", md: "xl", lg: "2xl" }}
//                   color="white"
//                   fontWeight="bold"
//                   lineHeight="1.2"
//                 >
//                   Department Faculty Load Analysis
//                 </Heading>
//                 <Text
//                   color="whiteAlpha.900"
//                   fontSize={{ base: "sm", md: "md", lg: "lg" }}
//                   maxW={{ base: "full", lg: "2xl" }}
//                 >
//                   Analyze faculty workload distribution across all departments with normalized metrics
//                 </Text>
//               </VStack>

//               {/* Back Button */}
//               <IconButton
//                 icon={<ArrowBackIcon boxSize={{ base: 5, md: 6 }} />}
//                 aria-label="Go back"
//                 onClick={() => navigate(-1)}
//                 size={{ base: "md", md: "lg" }}
//                 bg="rgba(255, 255, 255, 0.2)"
//                 color="white"
//                 _hover={{ bg: 'rgba(255, 255, 255, 0.3)', transform: 'scale(1.05)' }}
//                 _active={{ bg: 'rgba(255, 255, 255, 0.4)' }}
//                 borderRadius="full"
//                 boxShadow="lg"
//                 border="2px solid"
//                 borderColor="whiteAlpha.400"
//                 transition="all 0.2s"
//               />
//             </Flex>
//           </Container>
//         </Box>

//         <Container maxW="7xl" mt={{ base: -12, md: -16 }} position="relative" zIndex={1} pb={16} px={{ base: 3, md: 6, lg: 8 }}>
//           <VStack spacing={{ base: 4, md: 6 }} align="stretch">
//             {/* Session Selection Card */}
//             <Card
//               bg="white"
//               borderRadius={{ base: "xl", md: "2xl" }}
//               shadow="2xl"
//               border="1px"
//               borderColor="gray.200"
//               overflow="hidden"
//             >
//               <CardHeader bg="teal.600" color="white" p={{ base: 3, md: 4 }}>
//                 <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
//                   <Heading size={headingSize}>Session Selection</Heading>
//                   <Button
//                     leftIcon={<DownloadIcon />}
//                     size={buttonSize}
//                     colorScheme="whiteAlpha"
//                     bg="rgba(255, 255, 255, 0.2)"
//                     color="white"
//                     onClick={downloadAllDepartmentsCSV}
//                     isDisabled={departments.length === 0}
//                     _hover={{ bg: "rgba(255, 255, 255, 0.3)" }}
//                     _active={{ bg: "rgba(255, 255, 255, 0.4)" }}
//                   >
//                     <Text display={{ base: "none", md: "inline" }}>Download All</Text>
//                     <Text display={{ base: "inline", md: "none" }}>All</Text>
//                   </Button>
//                 </Flex>
//               </CardHeader>
//               <CardBody p={{ base: 4, md: 6 }}>
//                 <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
//                   <FormControl>
//                     <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
//                       Current Session
//                     </FormLabel>
//                     <Select
//                       value={selectedSession}
//                       onChange={(e) => setSelectedSession(e.target.value)}
//                       borderColor="teal.300"
//                       _hover={{ borderColor: "teal.400" }}
//                       _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
//                       size={{ base: "md", md: "lg" }}
//                     >
//                       {allSessions.map((session, index) => (
//                         <option key={index} value={session.session}>
//                           {session.session}
//                         </option>
//                       ))}
//                     </Select>
//                   </FormControl>
//                   <FormControl>
//                     <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
//                       Previous Session (for comparison)
//                     </FormLabel>
//                     <Select
//                       value={previousSession}
//                       onChange={(e) => setPreviousSession(e.target.value)}
//                       borderColor="teal.300"
//                       _hover={{ borderColor: "teal.400" }}
//                       _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
//                       size={{ base: "md", md: "lg" }}
//                     >
//                       <option value="">None</option>
//                       {allSessions.map((session, index) => (
//                         <option key={index} value={session.session}>
//                           {session.session}
//                         </option>
//                       ))}
//                     </Select>
//                   </FormControl>
//                 </SimpleGrid>

//                 {/* Legend */}
//                 <Box mt={4} p={3} bg="gray.50" borderRadius="lg">
//                   <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" mb={2} color="gray.600">
//                     Designation Color Legend:
//                   </Text>
//                   <Wrap spacing={2}>
//                     <WrapItem>
//                       <HStack spacing={1}>
//                         <Box w={3} h={3} bg="purple.500" borderRadius="sm" />
//                         <Text fontSize={{ base: "2xs", md: "xs" }}>Professor</Text>
//                       </HStack>
//                     </WrapItem>
//                     <WrapItem>
//                       <HStack spacing={1}>
//                         <Box w={3} h={3} bg="blue.500" borderRadius="sm" />
//                         <Text fontSize={{ base: "2xs", md: "xs" }}>Associate Professor</Text>
//                       </HStack>
//                     </WrapItem>
//                     <WrapItem>
//                       <HStack spacing={1}>
//                         <Box w={3} h={3} bg="teal.500" borderRadius="sm" />
//                         <Text fontSize={{ base: "2xs", md: "xs" }}>Assistant Professor</Text>
//                       </HStack>
//                     </WrapItem>
//                     <WrapItem>
//                       <HStack spacing={1}>
//                         <Box w={3} h={3} bg="gray.400" borderRadius="sm" />
//                         <Text fontSize={{ base: "2xs", md: "xs" }}>Others</Text>
//                       </HStack>
//                     </WrapItem>
//                   </Wrap>
//                 </Box>
//               </CardBody>
//             </Card>

//             {selectedSession && (
//               <>
//                 {loading ? (
//                   <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="2xl" border="1px" borderColor="gray.200">
//                     <CardBody p={{ base: 8, md: 12 }} textAlign="center">
//                       <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="teal.500" size="xl" />
//                       <Text mt={4} color="gray.600" fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
//                         {loadingProgress.stage}
//                       </Text>
//                       {loadingProgress.total > 0 && (
//                         <Box mt={4}>
//                           <Progress 
//                             value={(loadingProgress.current / loadingProgress.total) * 100} 
//                             colorScheme="teal"
//                             borderRadius="full"
//                             size="sm"
//                           />
//                           <Text mt={2} fontSize={{ base: "xs", md: "sm" }} color="gray.500">
//                             {loadingProgress.current} / {loadingProgress.total} departments processed
//                           </Text>
//                         </Box>
//                       )}
//                       <Text mt={2} fontSize={{ base: "xs", md: "sm" }} color="gray.500">
//                         This may take a few minutes for large datasets...
//                       </Text>
//                     </CardBody>
//                   </Card>
//                 ) : error ? (
//                   <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="2xl" border="1px" borderColor="gray.200">
//                     <CardBody p={6}>
//                       <Alert status="error" borderRadius="md">
//                         <AlertIcon />
//                         <AlertDescription>{error.message}</AlertDescription>
//                       </Alert>
//                     </CardBody>
//                   </Card>
//                 ) : departments.length === 0 ? (
//                   <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="2xl" border="1px" borderColor="gray.200">
//                     <CardBody p={6}>
//                       <Alert status="info" borderRadius="md">
//                         <AlertIcon />
//                         <AlertDescription>No department data found for this session.</AlertDescription>
//                       </Alert>
//                     </CardBody>
//                   </Card>
//                 ) : (
//                   <>
//                     {/* Department Tabs */}
//                     <Card
//                       bg="white"
//                       borderRadius={{ base: "xl", md: "2xl" }}
//                       shadow="2xl"
//                       border="1px"
//                       borderColor="gray.200"
//                       overflow="hidden"
//                     >
//                       <CardHeader bg="purple.600" color="white" p={{ base: 3, md: 4 }}>
//                         <HStack spacing={2} flexWrap="wrap">
//                           <FaBuilding />
//                           <Heading size={headingSize}>Department-wise Faculty Load Analysis</Heading>
//                           <Badge colorScheme="whiteAlpha" fontSize={{ base: "xs", md: "sm" }}>
//                             {departments.length} Departments
//                           </Badge>
//                         </HStack>
//                       </CardHeader>
//                       <Tabs colorScheme="teal" isLazy>
//                         <TabList 
//                           overflowX="auto" 
//                           overflowY="hidden" 
//                           flexWrap="nowrap"
//                           css={{
//                             scrollbarWidth: 'thin',
//                             '&::-webkit-scrollbar': { height: '6px' },
//                             '&::-webkit-scrollbar-thumb': { background: '#38B2AC', borderRadius: '3px' },
//                           }}
//                         >
//                           {departments.map((dept) => (
//                             <Tab key={dept} _selected={{ color: 'teal.600', borderColor: 'teal.600', fontWeight: 'bold' }}>
//                               <Text fontSize={{ base: "xs", md: "sm" }} whiteSpace="nowrap" px={1}>
//                                 {dept}
//                               </Text>
//                             </Tab>
//                           ))}
//                         </TabList>
//                         <TabPanels>
//                           {departments.map((dept) => {
//                             const sortedFaculty = getSortedFacultyList(dept);
//                             const totals = getDepartmentTotals(dept);
                            
//                             return (
//                               <TabPanel key={dept} p={0}>
//                                 {/* Department Header with Stats */}
//                                 <Box p={{ base: 4, md: 6 }} borderBottom="1px" borderColor="gray.200" bg="gray.50">
//                                   <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
//                                     <VStack align="start" spacing={1}>
//                                       <Heading size={{ base: "sm", md: "md" }}>{dept}</Heading>
//                                       <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
//                                         Faculty Load Analysis • {sortedFaculty.length} members
//                                       </Text>
//                                     </VStack>
//                                     <Button
//                                       leftIcon={<DownloadIcon />}
//                                       onClick={() => downloadDepartmentFacultyLoadCSV(dept)}
//                                       colorScheme="green"
//                                       size={buttonSize}
//                                     >
//                                       <Text display={{ base: "none", sm: "inline" }}>Download CSV</Text>
//                                       <Text display={{ base: "inline", sm: "none" }}>CSV</Text>
//                                     </Button>
//                                   </Flex>
                                  
//                                   {/* Department Summary Stats */}
//                                   <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={{ base: 2, md: 4 }} mt={4}>
//                                     <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
//                                       <StatLabel fontSize={{ base: "2xs", md: "xs" }} color="green.600">
//                                         <HStack spacing={1}><FaBook size={10} /><Text>Theory</Text></HStack>
//                                       </StatLabel>
//                                       <StatNumber fontSize={{ base: "lg", md: "xl" }} color="green.700">{totals.theory}</StatNumber>
//                                       <StatHelpText fontSize="2xs">hours</StatHelpText>
//                                     </Stat>
//                                     <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
//                                       <StatLabel fontSize={{ base: "2xs", md: "xs" }} color="red.600">
//                                         <HStack spacing={1}><FaFlask size={10} /><Text>Lab</Text></HStack>
//                                       </StatLabel>
//                                       <StatNumber fontSize={{ base: "lg", md: "xl" }} color="red.700">{totals.laboratory}</StatNumber>
//                                       <StatHelpText fontSize="2xs">hours</StatHelpText>
//                                     </Stat>
//                                     <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
//                                       <StatLabel fontSize={{ base: "2xs", md: "xs" }} color="orange.600">
//                                         <HStack spacing={1}><FaUsers size={10} /><Text>Tutorial</Text></HStack>
//                                       </StatLabel>
//                                       <StatNumber fontSize={{ base: "lg", md: "xl" }} color="orange.700">{totals.tutorial}</StatNumber>
//                                       <StatHelpText fontSize="2xs">hours</StatHelpText>
//                                     </Stat>
//                                     <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
//                                       <StatLabel fontSize={{ base: "2xs", md: "xs" }} color="blue.600">Total Load</StatLabel>
//                                       <StatNumber fontSize={{ base: "lg", md: "xl" }} color="blue.700">{totals.total}</StatNumber>
//                                       <StatHelpText fontSize="2xs">hours</StatHelpText>
//                                     </Stat>
//                                     <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
//                                       <StatLabel fontSize={{ base: "2xs", md: "xs" }} color="purple.600">Norm. Load</StatLabel>
//                                       <StatNumber fontSize={{ base: "lg", md: "xl" }} color="purple.700">{totals.normalizedLoad.toFixed(2)}</StatNumber>
//                                       <StatHelpText fontSize="2xs">total</StatHelpText>
//                                     </Stat>
//                                   </SimpleGrid>
//                                 </Box>

//                                 {/* Table */}
//                                 <Box
//                                   overflowX="auto"
//                                   w="100%"
//                                   css={{
//                                     '&::-webkit-scrollbar': { height: '8px' },
//                                     '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
//                                     '&::-webkit-scrollbar-thumb': { background: '#38B2AC', borderRadius: '4px' },
//                                     '&::-webkit-scrollbar-thumb:hover': { background: '#319795' },
//                                   }}
//                                 >
//                                   {sortedFaculty.length === 0 ? (
//                                     <Box p={6}>
//                                       <Alert status="info" borderRadius="md">
//                                         <AlertIcon />
//                                         <AlertDescription>No faculty load data available.</AlertDescription>
//                                       </Alert>
//                                     </Box>
//                                   ) : (
//                                     <Table variant="simple" size={tableSize}>
//                                       <Thead bg="teal.50" position="sticky" top={0} zIndex={1}>
//                                         <Tr>
//                                           <Th
//                                             rowSpan={2}
//                                             color="gray.700"
//                                             fontSize={{ base: "2xs", md: "xs" }}
//                                             fontWeight="bold"
//                                             borderBottom="2px"
//                                             borderColor="teal.200"
//                                             verticalAlign="middle"
//                                             textAlign="center"
//                                             w="40px"
//                                           >
//                                             #
//                                           </Th>
//                                           <Th
//                                             rowSpan={2}
//                                             color="teal.700"
//                                             fontSize={{ base: "2xs", md: "xs" }}
//                                             fontWeight="bold"
//                                             borderBottom="2px"
//                                             borderColor="teal.200"
//                                             verticalAlign="middle"
//                                             minW={{ base: "120px", md: "180px" }}
//                                           >
//                                             Faculty
//                                           </Th>
//                                           <Th
//                                             colSpan={4}
//                                             color="green.700"
//                                             fontSize={{ base: "2xs", md: "xs" }}
//                                             fontWeight="bold"
//                                             textAlign="center"
//                                             borderBottom="2px"
//                                             borderColor="teal.200"
//                                             bg="green.50"
//                                           >
//                                             Total Load
//                                           </Th>
//                                           <Th
//                                             colSpan={3}
//                                             color="pink.700"
//                                             fontSize={{ base: "2xs", md: "xs" }}
//                                             fontWeight="bold"
//                                             textAlign="center"
//                                             borderBottom="2px"
//                                             borderColor="teal.200"
//                                             bg="pink.50"
//                                           >
//                                             <HStack spacing={1} justify="center">
//                                               <Text>Norm. Student Count</Text>
//                                               <Tooltip
//                                                 label="Total Students ÷ Total Hours (per type)"
//                                                 placement="top"
//                                                 hasArrow
//                                                 bg="gray.700"
//                                                 fontSize="xs"
//                                               >
//                                                 <InfoIcon boxSize={2.5} cursor="pointer" />
//                                               </Tooltip>
//                                             </HStack>
//                                           </Th>
//                                           <Th
//                                             rowSpan={2}
//                                             color="yellow.800"
//                                             fontSize={{ base: "2xs", md: "xs" }}
//                                             fontWeight="bold"
//                                             textAlign="center"
//                                             borderBottom="2px"
//                                             borderColor="teal.200"
//                                             bg="yellow.50"
//                                             verticalAlign="middle"
//                                           >
//                                             <HStack spacing={1} justify="center">
//                                               <Text>Current</Text>
//                                               <Tooltip
//                                                 label="(Theory × Norm.Th) + (Tutorial × Norm.Tut) + ((Lab÷2) × Norm.Lab)"
//                                                 placement="top"
//                                                 hasArrow
//                                                 bg="gray.700"
//                                                 fontSize="xs"
//                                               >
//                                                 <InfoIcon boxSize={2.5} cursor="pointer" />
//                                               </Tooltip>
//                                             </HStack>
//                                           </Th>
//                                           {previousSession && (
//                                             <>
//                                               <Th
//                                                 rowSpan={2}
//                                                 color="orange.800"
//                                                 fontSize={{ base: "2xs", md: "xs" }}
//                                                 fontWeight="bold"
//                                                 textAlign="center"
//                                                 borderBottom="2px"
//                                                 borderColor="teal.200"
//                                                 bg="orange.50"
//                                                 verticalAlign="middle"
//                                               >
//                                                 Previous
//                                               </Th>
//                                               <Th
//                                                 rowSpan={2}
//                                                 fontSize={{ base: "2xs", md: "xs" }}
//                                                 fontWeight="bold"
//                                                 textAlign="center"
//                                                 borderBottom="2px"
//                                                 borderColor="teal.200"
//                                                 bg="gradient"
//                                                 bgGradient="linear(to-r, green.100, teal.100, blue.100)"
//                                                 verticalAlign="middle"
//                                                 color="teal.800"
//                                               >
//                                                 Yearly Avg
//                                               </Th>
//                                             </>
//                                           )}
//                                         </Tr>
//                                         <Tr>
//                                           {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
//                                             <Th
//                                               key={`total-${idx}`}
//                                               color="green.700"
//                                               fontSize={{ base: "2xs", md: "xs" }}
//                                               textAlign="center"
//                                               borderBottom="2px"
//                                               borderColor="teal.200"
//                                               bg="green.50"
//                                               px={{ base: 1, md: 2 }}
//                                             >
//                                               {label}
//                                             </Th>
//                                           ))}
//                                           {['Th', 'Lab', 'Tut'].map((label, idx) => (
//                                             <Th
//                                               key={`norm-${idx}`}
//                                               color="pink.700"
//                                               fontSize={{ base: "2xs", md: "xs" }}
//                                               textAlign="center"
//                                               borderBottom="2px"
//                                               borderColor="teal.200"
//                                               bg="pink.50"
//                                               px={{ base: 1, md: 2 }}
//                                             >
//                                               {label}
//                                             </Th>
//                                           ))}
//                                         </Tr>
//                                       </Thead>
//                                       <Tbody>
//                                         {sortedFaculty.map((faculty, index) => {
//                                           const prevFaculty = (previousLoad[dept] || []).find(f => f.faculty === faculty.faculty);
//                                           const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
//                                           const yearlyAvg = (((parseFloat(faculty.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
//                                           const designationStyle = getDesignationStyle(faculty.designation);
                                          
//                                           return (
//                                             <Tr
//                                               key={index}
//                                               bg={designationStyle.bg}
//                                               _hover={{ bg: designationStyle.hoverBg }}
//                                               borderLeft={designationStyle.borderLeft}
//                                               borderColor={designationStyle.borderColor}
//                                               transition="all 0.2s"
//                                             >
//                                               <Td 
//                                                 textAlign="center" 
//                                                 fontWeight="bold" 
//                                                 color="gray.500"
//                                                 fontSize={{ base: "xs", md: "sm" }}
//                                               >
//                                                 {index + 1}
//                                               </Td>
//                                               <Td>
//                                                 <FacultySummaryTooltip faculty={faculty}>
//                                                   <Box cursor="pointer">
//                                                     <Text
//                                                       fontWeight="bold"
//                                                       fontSize={{ base: "xs", md: "sm" }}
//                                                       color="gray.800"
//                                                       _hover={{ color: 'teal.600', textDecoration: 'underline' }}
//                                                     >
//                                                       {faculty.faculty}
//                                                     </Text>
//                                                     {faculty.designation && (
//                                                       <Badge 
//                                                         colorScheme={designationStyle.badge} 
//                                                         fontSize="2xs" 
//                                                         mt={0.5}
//                                                       >
//                                                         {faculty.designation}
//                                                       </Badge>
//                                                     )}
//                                                   </Box>
//                                                 </FacultySummaryTooltip>
//                                               </Td>
//                                               <Td textAlign="center" bg="green.50" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 <Badge colorScheme="green" fontSize={{ base: "2xs", md: "xs" }}>{faculty.total.theory}</Badge>
//                                               </Td>
//                                               <Td textAlign="center" bg="green.50" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 <Badge colorScheme="red" fontSize={{ base: "2xs", md: "xs" }}>{faculty.total.laboratory}</Badge>
//                                               </Td>
//                                               <Td textAlign="center" bg="green.50" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 <Badge colorScheme="orange" fontSize={{ base: "2xs", md: "xs" }}>{faculty.total.tutorial}</Badge>
//                                               </Td>
//                                               <Td textAlign="center" bg="green.100" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 {faculty.total.total}
//                                               </Td>
//                                               <Td textAlign="center" bg="pink.50" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 <StudentCountTooltip faculty={faculty} type="theory">
//                                                   <Badge 
//                                                     colorScheme="cyan" 
//                                                     fontSize={{ base: "2xs", md: "xs" }} 
//                                                     cursor="pointer"
//                                                     _hover={{ transform: 'scale(1.1)' }}
//                                                     transition="transform 0.2s"
//                                                   >
//                                                     {faculty.normalizedStudentCount.theory}
//                                                   </Badge>
//                                                 </StudentCountTooltip>
//                                               </Td>
//                                               <Td textAlign="center" bg="pink.50" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 <StudentCountTooltip faculty={faculty} type="laboratory">
//                                                   <Badge 
//                                                     colorScheme="cyan" 
//                                                     fontSize={{ base: "2xs", md: "xs" }}
//                                                     cursor="pointer"
//                                                     _hover={{ transform: 'scale(1.1)' }}
//                                                     transition="transform 0.2s"
//                                                   >
//                                                     {faculty.normalizedStudentCount.laboratory}
//                                                   </Badge>
//                                                 </StudentCountTooltip>
//                                               </Td>
//                                               <Td textAlign="center" bg="pink.50" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 <StudentCountTooltip faculty={faculty} type="tutorial">
//                                                   <Badge 
//                                                     colorScheme="cyan" 
//                                                     fontSize={{ base: "2xs", md: "xs" }}
//                                                     cursor="pointer"
//                                                     _hover={{ transform: 'scale(1.1)' }}
//                                                     transition="transform 0.2s"
//                                                   >
//                                                     {faculty.normalizedStudentCount.tutorial}
//                                                   </Badge>
//                                                 </StudentCountTooltip>
//                                               </Td>
//                                               <Td textAlign="center" bg="yellow.50" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                 <Badge colorScheme="yellow" fontSize={{ base: "2xs", md: "xs" }} px={2} py={1}>
//                                                   {faculty.normalizedLoad}
//                                                 </Badge>
//                                               </Td>
//                                               {previousSession && (
//                                                 <>
//                                                   <Td textAlign="center" bg="orange.50" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} px={{ base: 1, md: 2 }}>
//                                                     <Badge colorScheme="orange" fontSize={{ base: "2xs", md: "xs" }} px={2} py={1}>
//                                                       {prevNormLoad}
//                                                     </Badge>
//                                                   </Td>
//                                                   <Td 
//                                                     textAlign="center" 
//                                                     fontWeight="bold" 
//                                                     fontSize={{ base: "xs", md: "sm" }}
//                                                     bgGradient="linear(to-r, green.50, teal.50, blue.50)"
//                                                     px={{ base: 1, md: 2 }}
//                                                   >
//                                                     <Badge 
//                                                       bgGradient="linear(to-r, green.400, teal.400, blue.400)"
//                                                       color="white"
//                                                       fontSize={{ base: "xs", md: "sm" }} 
//                                                       px={3} 
//                                                       py={1}
//                                                       borderRadius="full"
//                                                       boxShadow="md"
//                                                     >
//                                                       {yearlyAvg}
//                                                     </Badge>
//                                                   </Td>
//                                                 </>
//                                               )}
//                                             </Tr>
//                                           );
//                                         })}
//                                       </Tbody>
//                                     </Table>
//                                   )}
//                                 </Box>
//                               </TabPanel>
//                             );
//                           })}
//                         </TabPanels>
//                       </Tabs>
//                     </Card>
//                   </>
//                 )}
//               </>
//             )}
//           </VStack>
//         </Container>
//       </Box>
//     </>
//   );
// };

// export default MasterLoadDataTable;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  Thead,
  Tbody,
  HStack,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  FormControl,
  FormLabel,
  Select,
  Button,
  VStack,
  Text,
  IconButton,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Flex,
  SimpleGrid,
  Tooltip,
  AlertDescription,
  Progress,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  useBreakpointValue,
  Wrap,
  WrapItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
} from '@chakra-ui/react';
import { 
  FaChalkboardTeacher,
  FaFlask,
  FaBook,
  FaUsers,
  FaUserTie,
  FaCalendarAlt,
} from 'react-icons/fa';
import { DownloadIcon, ArrowBackIcon, InfoIcon, RepeatIcon } from '@chakra-ui/icons';
import { Parser } from '@json2csv/plainjs';
import { Helmet } from 'react-helmet-async';
import getEnvironment from '../getenvironment';
import Header from '../components/header';

// Designation color mapping
const getDesignationStyle = (designation) => {
  const lowerDesignation = designation?.toLowerCase() || '';
  
  if (lowerDesignation.includes('professor') && !lowerDesignation.includes('assistant') && !lowerDesignation.includes('associate')) {
    return { bg: 'purple.50', hoverBg: 'purple.100', borderLeft: '4px solid', borderColor: 'purple.500', badge: 'purple' };
  } else if (lowerDesignation.includes('associate')) {
    return { bg: 'blue.50', hoverBg: 'blue.100', borderLeft: '4px solid', borderColor: 'blue.500', badge: 'blue' };
  } else if (lowerDesignation.includes('assistant')) {
    return { bg: 'teal.50', hoverBg: 'teal.100', borderLeft: '4px solid', borderColor: 'teal.500', badge: 'teal' };
  } else {
    return { bg: 'gray.50', hoverBg: 'gray.100', borderLeft: '4px solid', borderColor: 'gray.400', badge: 'gray' };
  }
};

// Faculty Summary Tooltip Component
const FacultySummaryTooltip = ({ faculty, children }) => {
  const subjects = faculty.subjects || [];
  
  return (
    <Popover trigger="hover" placement="right" openDelay={200}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        w={{ base: "280px", md: "350px" }} 
        boxShadow="xl" 
        borderRadius="lg"
        border="2px solid"
        borderColor="teal.200"
      >
        <PopoverArrow />
        <PopoverHeader 
          bg="teal.500" 
          color="white" 
          fontWeight="bold" 
          borderTopRadius="md"
          py={3}
        >
          <HStack spacing={2}>
            <FaUserTie />
            <Text fontSize={{ base: "sm", md: "md" }}>{faculty.faculty}</Text>
          </HStack>
          {faculty.designation && (
            <Badge colorScheme="whiteAlpha" mt={1} fontSize="xs">
              {faculty.designation}
            </Badge>
          )}
        </PopoverHeader>
        <PopoverBody p={0} maxH="300px" overflowY="auto">
          {subjects.length > 0 ? (
            <Box>
              <Box bg="gray.50" px={3} py={2} borderBottom="1px" borderColor="gray.200">
                <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
                  Subject Load Summary
                </Text>
              </Box>
              {subjects.map((subject, idx) => (
                <Box 
                  key={idx} 
                  px={3} 
                  py={2} 
                  borderBottom="1px" 
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                >
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={1}>
                    <VStack align="start" spacing={0} flex="1" minW="0">
                      <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium" noOfLines={2}>
                        {subject.subjectFullName || subject.subCode}
                      </Text>
                      <HStack spacing={1} flexWrap="wrap">
                        <Badge 
                          size="sm" 
                          colorScheme={
                            subject.subType?.toLowerCase() === 'theory' ? 'green' :
                            subject.subType?.toLowerCase() === 'laboratory' ? 'red' : 'orange'
                          }
                          fontSize="2xs"
                        >
                          {subject.subType}
                        </Badge>
                        <Text fontSize="2xs" color="gray.500">{subject.subSem}</Text>
                      </HStack>
                    </VStack>
                    <Badge colorScheme="blue" fontSize={{ base: "xs", md: "sm" }} px={2}>
                      {subject.count} hrs
                    </Badge>
                  </Flex>
                </Box>
              ))}
              <Box bg="teal.50" px={3} py={2}>
                <Flex justify="space-between" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                  <Text>Total Load:</Text>
                  <Text color="teal.600">{faculty.total?.total || 0} hrs</Text>
                </Flex>
              </Box>
            </Box>
          ) : (
            <Box p={4} textAlign="center">
              <Text color="gray.500" fontSize="sm">No subject data available</Text>
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

// Student Count Tooltip Component
const StudentCountTooltip = ({ faculty, type, children }) => {
  const subjects = (faculty.subjects || []).filter(s => 
    s.subType?.toLowerCase() === type.toLowerCase()
  );
  
  return (
    <Popover trigger="hover" placement="top" openDelay={200}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        w={{ base: "250px", md: "300px" }} 
        boxShadow="xl" 
        borderRadius="lg"
        border="2px solid"
        borderColor="pink.200"
      >
        <PopoverArrow />
        <PopoverHeader 
          bg="pink.500" 
          color="white" 
          fontWeight="bold" 
          borderTopRadius="md"
          py={2}
        >
          <HStack spacing={2}>
            <FaUsers />
            <Text fontSize={{ base: "xs", md: "sm" }}>
              {type.charAt(0).toUpperCase() + type.slice(1)} - Student Details
            </Text>
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0} maxH="200px" overflowY="auto">
          {subjects.length > 0 ? (
            <Box>
              {subjects.map((subject, idx) => (
                <Box 
                  key={idx} 
                  px={3} 
                  py={2} 
                  borderBottom="1px" 
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                >
                  <Flex justify="space-between" align="center" gap={2}>
                    <Text fontSize={{ base: "xs", md: "sm" }} noOfLines={1} flex="1">
                      {subject.subjectFullName || subject.subCode}
                    </Text>
                    <Badge colorScheme="purple" fontSize="xs">
                      {subject.studentCount || 0} students
                    </Badge>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : (
            <Box p={3} textAlign="center">
              <Text color="gray.500" fontSize="sm">No {type} subjects</Text>
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const MasterLoadDataTable = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Session and department states
  const [allSessions, setAllSessions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [previousSession, setPreviousSession] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Loading states
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, stage: '' });
  
  // Data states
  const [currentLoadData, setCurrentLoadData] = useState([]);
  const [previousLoadData, setPreviousLoadData] = useState([]);
  const [showYearlyLoad, setShowYearlyLoad] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for department codes
  const deptCodesCache = useRef({});
  
  const apiUrl = getEnvironment();
  
  // Responsive values
  const tableSize = useBreakpointValue({ base: "sm", md: "md" });
  const headingSize = useBreakpointValue({ base: "sm", md: "md", lg: "lg" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });

  // Fetch all sessions and departments on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${apiUrl}/timetablemodule/timetable/sess/allsessanddept`, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        const { uniqueSessions, uniqueDept } = data;
        
        setAllSessions(uniqueSessions || []);
        setAllDepartments(uniqueDept || []);
        
        if (uniqueSessions?.length > 0) {
          setSelectedSession(uniqueSessions[0].session);
          if (uniqueSessions.length > 1) {
            setPreviousSession(uniqueSessions[1].session);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError(error);
      }
    };
    fetchInitialData();
  }, [apiUrl]);

  // Generate initial timetable data structure
  const generateInitialTimetableData = useCallback((fetchedData, type) => {
    const initialData = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 'lunch'];

    for (const day of days) {
      initialData[day] = {};
      for (const period of periods) {
        const periodKey = period === 'lunch' ? 'lunch' : `period${period}`;
        initialData[day][periodKey] = [];
        
        if (fetchedData[day]?.[periodKey]) {
          for (const slot of fetchedData[day][periodKey]) {
            const slotSubjects = [];
            for (const slotItem of slot) {
              const subj = slotItem.subject || "";
              const room = type === "room" ? (slotItem.sem || "") : (slotItem.room || "");
              const faculty = type === "faculty" ? (slotItem.sem || "") : (slotItem.faculty || "");
              if (subj || room || faculty) {
                slotSubjects.push({ subject: subj, room, faculty });
              }
            }
            if (slotSubjects.length > 0 || period !== 'lunch') {
              initialData[day][periodKey].push(slotSubjects.length > 0 ? slotSubjects : [{ subject: "", room: "", faculty: "" }]);
            }
          }
        }
        if (initialData[day][periodKey].length === 0 && period !== 'lunch') {
          initialData[day][periodKey].push([]);
        }
      }
    }
    return initialData;
  }, []);

  // Generate summary from timetable data
  const generateSummary = useCallback((timetableData, subjectDataArray, facultyName, commonLoad) => {
    const summaryData = {};

    for (const day in timetableData) {
      for (let period = 1; period <= 9; period++) {
        const periodKey = period === 9 ? 'lunch' : `period${period}`;
        const slots = timetableData[day][periodKey];
        
        if (slots) {
          slots.forEach((slot) => {
            slot.forEach((cell) => {
              if (cell.subject) {
                const { subject, faculty, room } = cell;
                const foundSubject = subjectDataArray.find(item => 
                  item.subName === subject && item.sem === faculty
                );
                
                if (foundSubject) {
                  const key = `${subject}-${faculty}-${foundSubject.type}`;
                  if (!summaryData[key]) {
                    summaryData[key] = {
                      subCode: foundSubject.subCode,
                      count: 1,
                      subType: foundSubject.type,
                      subjectFullName: foundSubject.subjectFullName,
                      subSem: foundSubject.sem,
                      studentCount: parseInt(foundSubject.studentCount) || 0,
                    };
                  } else {
                    summaryData[key].count++;
                  }
                }
              }
            });
          });
        }
      }
    }

    let subjects = Object.values(summaryData);

    // Add common load items
    if (commonLoad && Array.isArray(commonLoad)) {
      commonLoad.forEach((item) => {
        subjects.push({
          count: item.hrs,
          subCode: item.subCode,
          subjectFullName: item.subFullName,
          subType: item.subType,
          subSem: item.sem,
          studentCount: parseInt(item.studentCount) || 0,
        });
      });
    }

    return subjects;
  }, []);

  // Compute faculty load with normalized metrics
  const computeFacultyLoad = useCallback((subjects, facultyName, department, designation) => {
    const total = { theory: 0, laboratory: 0, tutorial: 0, total: 0 };
    const studentHours = {
      theory: { totalStudentHours: 0, totalHours: 0 },
      laboratory: { totalStudentHours: 0, totalHours: 0 },
      tutorial: { totalStudentHours: 0, totalHours: 0 }
    };

    subjects.forEach((item) => {
      const subType = item.subType?.toLowerCase() || 'other';
      const hours = item.count || 0;
      const studentCount = item.studentCount || 0;

      total.total += hours;
      
      if (subType === 'theory') {
        total.theory += hours;
        studentHours.theory.totalStudentHours += studentCount * hours;
        studentHours.theory.totalHours += hours;
      } else if (subType === 'laboratory') {
        total.laboratory += hours;
        studentHours.laboratory.totalStudentHours += studentCount * hours;
        studentHours.laboratory.totalHours += hours;
      } else if (subType === 'tutorial') {
        total.tutorial += hours;
        studentHours.tutorial.totalStudentHours += studentCount * hours;
        studentHours.tutorial.totalHours += hours;
      }
    });

    const normalizedTheory = studentHours.theory.totalHours > 0
      ? (studentHours.theory.totalStudentHours / studentHours.theory.totalHours).toFixed(2)
      : '0.00';
    const normalizedLab = studentHours.laboratory.totalHours > 0
      ? (studentHours.laboratory.totalStudentHours / studentHours.laboratory.totalHours).toFixed(2)
      : '0.00';
    const normalizedTutorial = studentHours.tutorial.totalHours > 0
      ? (studentHours.tutorial.totalStudentHours / studentHours.tutorial.totalHours).toFixed(2)
      : '0.00';

    const normalizedLoad = (
      (total.theory * parseFloat(normalizedTheory)) +
      (total.tutorial * parseFloat(normalizedTutorial)) +
      ((total.laboratory / 2) * parseFloat(normalizedLab))
    ).toFixed(2);

    return {
      faculty: facultyName,
      department,
      designation,
      total,
      normalizedStudentCount: {
        theory: normalizedTheory,
        laboratory: normalizedLab,
        tutorial: normalizedTutorial
      },
      normalizedLoad,
      subjects
    };
  }, []);

  // Fetch department data for a specific session
  const fetchDepartmentData = useCallback(async (session, department, isPrevious = false) => {
    if (!session || !department) return [];

    const setLoading = isPrevious ? setLoadingPrevious : setLoadingCurrent;
    setLoading(true);
    
    try {
      // Get timetable code for this department and session
      const cacheKey = `${session}-${department}`;
      let code;
      
      if (deptCodesCache.current[cacheKey]) {
        code = deptCodesCache.current[cacheKey];
      } else {
        const codeResponse = await fetch(
          `${apiUrl}/timetablemodule/timetable/getcode/${session}/${department}`,
          { credentials: 'include' }
        );
        if (!codeResponse.ok) {
          console.error(`No timetable found for ${department} in ${session}`);
          return [];
        }
        code = await codeResponse.json();
        deptCodesCache.current[cacheKey] = code;
      }

      if (!code) return [];

      setLoadingProgress({ current: 0, total: 3, stage: 'Fetching subject data...' });

      // Fetch subject data and faculty list in parallel
      const [subjectResponse, facultyResponse] = await Promise.all([
        fetch(`${apiUrl}/timetablemodule/subject/subjectdetails/${code}`, { credentials: 'include' }),
        fetch(`${apiUrl}/timetablemodule/faculty/dept/${department}`, { credentials: 'include' })
      ]);

      const subjectData = subjectResponse.ok ? await subjectResponse.json() : [];
      const faculties = facultyResponse.ok ? await facultyResponse.json() : [];

      if (!Array.isArray(faculties) || faculties.length === 0) {
        return [];
      }

      setLoadingProgress({ current: 1, total: 3, stage: `Processing ${faculties.length} faculty members...` });

      const facultyLoadData = [];
      const batchSize = 5; // Process 5 faculty members at a time

      for (let i = 0; i < faculties.length; i += batchSize) {
        const batch = faculties.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (faculty) => {
            const facultyName = faculty.name;
            const designation = faculty.designation;

            try {
              // Fetch timetable and common load in parallel
              const [ttResponse, commonLoadResponse] = await Promise.all([
                fetch(`${apiUrl}/timetablemodule/tt/viewfacultytt/${code}/${facultyName}`, { credentials: 'include' }),
                fetch(`${apiUrl}/timetablemodule/commonLoad/${code}/${facultyName}`, { credentials: 'include' }).catch(() => ({ ok: false }))
              ]);

              if (!ttResponse.ok) return null;

              const ttData = await ttResponse.json();
              const commonLoad = commonLoadResponse.ok ? await commonLoadResponse.json() : [];
              
              const timetableData = ttData.timetableData || {};
              const initialData = generateInitialTimetableData(timetableData, 'faculty');
              const subjects = generateSummary(initialData, subjectData, facultyName, commonLoad);
              
              const facultyLoad = computeFacultyLoad(subjects, facultyName, department, designation);
              
              return facultyLoad.total.total > 0 ? facultyLoad : null;
            } catch (e) {
              console.error(`Error processing faculty ${facultyName}:`, e);
              return null;
            }
          })
        );

        facultyLoadData.push(...batchResults.filter(Boolean));
        
        setLoadingProgress({ 
          current: Math.min(i + batchSize, faculties.length), 
          total: faculties.length, 
          stage: `Processed ${Math.min(i + batchSize, faculties.length)}/${faculties.length} faculty...` 
        });
      }

      // Sort by normalized load (descending)
      facultyLoadData.sort((a, b) => parseFloat(b.normalizedLoad) - parseFloat(a.normalizedLoad));

      return facultyLoadData;
    } catch (error) {
      console.error('Error fetching department data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch data for ${department}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return [];
    } finally {
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0, stage: '' });
    }
  }, [apiUrl, generateInitialTimetableData, generateSummary, computeFacultyLoad, toast]);

  // Fetch current session data when department or session changes
  useEffect(() => {
    if (selectedSession && selectedDepartment) {
      setShowYearlyLoad(false);
      setPreviousLoadData([]);
      fetchDepartmentData(selectedSession, selectedDepartment, false).then(setCurrentLoadData);
    }
  }, [selectedSession, selectedDepartment, fetchDepartmentData]);

  // Handle showing yearly load
  const handleShowYearlyLoad = async () => {
    if (!previousSession || !selectedDepartment) {
      toast({
        title: 'Missing Selection',
        description: 'Please select a previous session first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const data = await fetchDepartmentData(previousSession, selectedDepartment, true);
    setPreviousLoadData(data);
    setShowYearlyLoad(true);
  };

  // Get sorted faculty list with yearly average
  const getSortedFacultyList = useCallback(() => {
    if (!showYearlyLoad || previousLoadData.length === 0) {
      return currentLoadData;
    }

    return [...currentLoadData].sort((a, b) => {
      const prevA = previousLoadData.find(f => f.faculty === a.faculty);
      const prevB = previousLoadData.find(f => f.faculty === b.faculty);
      
      const yearlyAvgA = ((parseFloat(a.normalizedLoad) + parseFloat(prevA?.normalizedLoad || '0.00')) / 2);
      const yearlyAvgB = ((parseFloat(b.normalizedLoad) + parseFloat(prevB?.normalizedLoad || '0.00')) / 2);
      
      return yearlyAvgB - yearlyAvgA;
    });
  }, [currentLoadData, previousLoadData, showYearlyLoad]);

  // Calculate department totals
  const getDepartmentTotals = useCallback(() => {
    const totals = {
      theory: 0,
      laboratory: 0,
      tutorial: 0,
      total: 0,
      normalizedLoad: 0,
      facultyCount: currentLoadData.length
    };

    currentLoadData.forEach(f => {
      totals.theory += f.total.theory;
      totals.laboratory += f.total.laboratory;
      totals.tutorial += f.total.tutorial;
      totals.total += f.total.total;
      totals.normalizedLoad += parseFloat(f.normalizedLoad);
    });

    return totals;
  }, [currentLoadData]);

  // Download CSV
  const downloadCSV = () => {
    const sortedList = getSortedFacultyList();
    const csvData = sortedList.map((item, index) => {
      const prevFaculty = previousLoadData.find(f => f.faculty === item.faculty);
      const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
      const yearlyAvg = (((parseFloat(item.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
      
      const baseData = {
        'Rank': index + 1,
        'Faculty': item.faculty,
        'Designation': item.designation || '',
        'Department': item.department,
        'Total Theory': item.total.theory,
        'Total Laboratory': item.total.laboratory,
        'Total Tutorial': item.total.tutorial,
        'Total Load': item.total.total,
        'Normalized Student Count (Theory)': item.normalizedStudentCount.theory,
        'Normalized Student Count (Laboratory)': item.normalizedStudentCount.laboratory,
        'Normalized Student Count (Tutorial)': item.normalizedStudentCount.tutorial,
        'Normalized Load (Current)': item.normalizedLoad,
      };

      if (showYearlyLoad) {
        baseData['Normalized Load (Previous)'] = prevNormLoad;
        baseData['Yearly Average Load'] = yearlyAvg;
      }

      return baseData;
    });

    const parser = new Parser();
    const csv = parser.parse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDepartment}-Faculty-Load-${selectedSession}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedFaculty = getSortedFacultyList();
  const totals = getDepartmentTotals();

  return (
    <>
      <Helmet>
        <title>Faculty Load Analysis | XCEED NITJ</title>
        <meta name="description" content="NITJ faculty load analysis by department" />
      </Helmet>
      <Box bg="gray.50" minH="100vh">
        {/* Hero Header */}
        <Box
          bgGradient="linear(to-r, teal.500, blue.600, purple.600)"
          pt={0}
          pb={{ base: 20, md: 24 }}
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
          <Container maxW="7xl" position="relative" mt={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
            <Flex 
              justify="space-between" 
              align={{ base: "start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <VStack spacing={{ base: 2, md: 3 }} align={{ base: "center", lg: "start" }} textAlign={{ base: "center", lg: "left" }}>
                <Badge colorScheme="whiteAlpha" fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 3 }} py={1} borderRadius="full">
                  <HStack spacing={1}>
                    <FaChalkboardTeacher size={12} />
                    <Text>Faculty Load Analytics</Text>
                  </HStack>
                </Badge>
                <Heading size={{ base: "lg", md: "xl", lg: "2xl" }} color="white" fontWeight="bold" lineHeight="1.2">
                  Department Faculty Load
                </Heading>
                <Text color="whiteAlpha.900" fontSize={{ base: "sm", md: "md" }} maxW={{ base: "full", lg: "2xl" }}>
                  Analyze faculty workload with normalized metrics
                </Text>
              </VStack>

              <IconButton
                icon={<ArrowBackIcon boxSize={{ base: 5, md: 6 }} />}
                aria-label="Go back"
                onClick={() => navigate(-1)}
                size={{ base: "md", md: "lg" }}
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.3)', transform: 'scale(1.05)' }}
                borderRadius="full"
                boxShadow="lg"
                border="2px solid"
                borderColor="whiteAlpha.400"
              />
            </Flex>
          </Container>
        </Box>

        <Container maxW="7xl" mt={{ base: -12, md: -16 }} position="relative" zIndex={1} pb={16} px={{ base: 3, md: 6, lg: 8 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Selection Card */}
            <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="2xl" border="1px" borderColor="gray.200" overflow="hidden">
              <CardHeader bg="teal.600" color="white" p={{ base: 3, md: 4 }}>
                <Heading size={headingSize}>Select Department & Session</Heading>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
                      Department *
                    </FormLabel>
                    <Select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      placeholder="Select Department"
                      borderColor="teal.300"
                      _hover={{ borderColor: "teal.400" }}
                      _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                      size={{ base: "md", md: "lg" }}
                    >
                      {allDepartments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
                      Current Session
                    </FormLabel>
                    <Select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      borderColor="teal.300"
                      _hover={{ borderColor: "teal.400" }}
                      _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                      size={{ base: "md", md: "lg" }}
                    >
                      {allSessions.map((session, index) => (
                        <option key={index} value={session.session}>{session.session}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="semibold" color="gray.700" fontSize={{ base: "xs", md: "sm" }}>
                      Previous Session (for comparison)
                    </FormLabel>
                    <Select
                      value={previousSession}
                      onChange={(e) => setPreviousSession(e.target.value)}
                      borderColor="teal.300"
                      _hover={{ borderColor: "teal.400" }}
                      _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                      size={{ base: "md", md: "lg" }}
                    >
                      <option value="">None</option>
                      {allSessions.map((session, index) => (
                        <option key={index} value={session.session}>{session.session}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* Legend */}
                <Box mt={4} p={3} bg="gray.50" borderRadius="lg">
                  <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" mb={2} color="gray.600">
                    Designation Color Legend:
                  </Text>
                  <Wrap spacing={2}>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="purple.500" borderRadius="sm" /><Text fontSize="xs">Professor</Text></HStack></WrapItem>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="blue.500" borderRadius="sm" /><Text fontSize="xs">Associate Prof.</Text></HStack></WrapItem>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="teal.500" borderRadius="sm" /><Text fontSize="xs">Assistant Prof.</Text></HStack></WrapItem>
                    <WrapItem><HStack spacing={1}><Box w={3} h={3} bg="gray.400" borderRadius="sm" /><Text fontSize="xs">Others</Text></HStack></WrapItem>
                  </Wrap>
                </Box>
              </CardBody>
            </Card>

            {/* Data Display */}
            {!selectedDepartment ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={{ base: 8, md: 12 }} textAlign="center">
                  <FaChalkboardTeacher size={48} color="#38B2AC" style={{ margin: '0 auto 16px' }} />
                  <Heading size="md" color="gray.600" mb={2}>Select a Department</Heading>
                  <Text color="gray.500">Choose a department from the dropdown above to view faculty load data</Text>
                </CardBody>
              </Card>
            ) : loadingCurrent ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={{ base: 8, md: 12 }} textAlign="center">
                  <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="teal.500" size="xl" />
                  <Text mt={4} color="gray.600" fontWeight="medium">{loadingProgress.stage || 'Loading...'}</Text>
                  {loadingProgress.total > 0 && (
                    <Box mt={4} maxW="300px" mx="auto">
                      <Progress 
                        value={(loadingProgress.current / loadingProgress.total) * 100} 
                        colorScheme="teal"
                        borderRadius="full"
                        size="sm"
                      />
                      <Text mt={2} fontSize="sm" color="gray.500">
                        {loadingProgress.current} / {loadingProgress.total}
                      </Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ) : error ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={6}>
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                </CardBody>
              </Card>
            ) : currentLoadData.length === 0 ? (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="xl" border="1px" borderColor="gray.200">
                <CardBody p={6}>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>No faculty load data found for {selectedDepartment} in {selectedSession}</AlertDescription>
                  </Alert>
                </CardBody>
              </Card>
            ) : (
              <Card bg="white" borderRadius={{ base: "xl", md: "2xl" }} shadow="2xl" border="1px" borderColor="gray.200" overflow="hidden">
                {/* Header with Actions */}
                <CardHeader bg="purple.600" color="white" p={{ base: 3, md: 4 }}>
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                    <VStack align="start" spacing={0}>
                      <Heading size={headingSize}>{selectedDepartment}</Heading>
                      <Text fontSize={{ base: "xs", md: "sm" }} opacity={0.9}>
                        {sortedFaculty.length} faculty members • {selectedSession}
                      </Text>
                    </VStack>
                    <HStack spacing={2} flexWrap="wrap">
                      {!showYearlyLoad && previousSession && (
                        <Button
                          leftIcon={loadingPrevious ? <Spinner size="sm" /> : <FaCalendarAlt />}
                          onClick={handleShowYearlyLoad}
                          colorScheme="yellow"
                          size={buttonSize}
                          isLoading={loadingPrevious}
                          loadingText="Loading..."
                        >
                          <Text display={{ base: "none", sm: "inline" }}>Show Yearly Load</Text>
                          <Text display={{ base: "inline", sm: "none" }}>Yearly</Text>
                        </Button>
                      )}
                      {showYearlyLoad && (
                        <Button
                          leftIcon={<RepeatIcon />}
                          onClick={() => { setShowYearlyLoad(false); setPreviousLoadData([]); }}
                          colorScheme="gray"
                          variant="outline"
                          size={buttonSize}
                          bg="white"
                        >
                          Hide
                        </Button>
                      )}
                      <Button
                        leftIcon={<DownloadIcon />}
                        onClick={downloadCSV}
                        colorScheme="green"
                        size={buttonSize}
                      >
                        <Text display={{ base: "none", sm: "inline" }}>Download CSV</Text>
                        <Text display={{ base: "inline", sm: "none" }}>CSV</Text>
                      </Button>
                    </HStack>
                  </Flex>
                </CardHeader>

                {/* Department Summary Stats */}
                <Box p={{ base: 3, md: 4 }} bg="gray.50" borderBottom="1px" borderColor="gray.200">
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={{ base: 2, md: 3 }}>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="green.600"><HStack spacing={1}><FaBook size={10} /><Text>Theory</Text></HStack></StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="green.700">{totals.theory}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="red.600"><HStack spacing={1}><FaFlask size={10} /><Text>Lab</Text></HStack></StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="red.700">{totals.laboratory}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="orange.600"><HStack spacing={1}><FaUsers size={10} /><Text>Tutorial</Text></HStack></StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="orange.700">{totals.tutorial}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="blue.600">Total</StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="blue.700">{totals.total}</StatNumber>
                      <StatHelpText fontSize="2xs">hours</StatHelpText>
                    </Stat>
                    <Stat bg="white" p={3} borderRadius="lg" shadow="sm">
                      <StatLabel fontSize="xs" color="purple.600">Normalized</StatLabel>
                      <StatNumber fontSize={{ base: "lg", md: "xl" }} color="purple.700">{totals.normalizedLoad.toFixed(2)}</StatNumber>
                      <StatHelpText fontSize="2xs">total</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </Box>

                {/* Loading indicator for previous session */}
                {loadingPrevious && (
                  <Box p={3} bg="yellow.50" borderBottom="1px" borderColor="yellow.200">
                    <HStack justify="center" spacing={3}>
                      <Spinner size="sm" color="yellow.500" />
                      <Text fontSize="sm" color="yellow.700">Loading previous session data...</Text>
                    </HStack>
                  </Box>
                )}

                {/* Table */}
                <Box
                  overflowX="auto"
                  css={{
                    '&::-webkit-scrollbar': { height: '8px' },
                    '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb': { background: '#38B2AC', borderRadius: '4px' },
                  }}
                >
                  <Table variant="simple" size={tableSize}>
                    <Thead bg="teal.50" position="sticky" top={0} zIndex={1}>
                      <Tr>
                        <Th rowSpan={2} fontSize="xs" fontWeight="bold" borderBottom="2px" borderColor="teal.200" verticalAlign="middle" textAlign="center" w="40px">#</Th>
                        <Th rowSpan={2} color="teal.700" fontSize="xs" fontWeight="bold" borderBottom="2px" borderColor="teal.200" verticalAlign="middle" minW="150px">Faculty</Th>
                        <Th colSpan={4} color="green.700" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="green.50">Total Load</Th>
                        <Th colSpan={3} color="pink.700" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="pink.50">
                          <HStack spacing={1} justify="center">
                            <Text>Norm. Student Count</Text>
                            <Tooltip label="Total Students ÷ Total Hours" placement="top" hasArrow><InfoIcon boxSize={2.5} /></Tooltip>
                          </HStack>
                        </Th>
                        <Th rowSpan={2} color="yellow.800" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="yellow.50" verticalAlign="middle">
                          <HStack spacing={1} justify="center">
                            <Text>Current</Text>
                            <Tooltip label="(Theory × Norm.Th) + (Tutorial × Norm.Tut) + ((Lab÷2) × Norm.Lab)" placement="top" hasArrow><InfoIcon boxSize={2.5} /></Tooltip>
                          </HStack>
                        </Th>
                        {showYearlyLoad && (
                          <>
                            <Th rowSpan={2} color="orange.800" fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="orange.50" verticalAlign="middle">Previous</Th>
                            <Th rowSpan={2} fontSize="xs" fontWeight="bold" textAlign="center" borderBottom="2px" borderColor="teal.200" bgGradient="linear(to-r, green.100, teal.100, blue.100)" verticalAlign="middle" color="teal.800">Yearly Avg</Th>
                          </>
                        )}
                      </Tr>
                      <Tr>
                        {['Th', 'Lab', 'Tut', 'Tot'].map((label, idx) => (
                          <Th key={`total-${idx}`} color="green.700" fontSize="2xs" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="green.50" px={1}>{label}</Th>
                        ))}
                        {['Th', 'Lab', 'Tut'].map((label, idx) => (
                          <Th key={`norm-${idx}`} color="pink.700" fontSize="2xs" textAlign="center" borderBottom="2px" borderColor="teal.200" bg="pink.50" px={1}>{label}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sortedFaculty.map((faculty, index) => {
                        const prevFaculty = previousLoadData.find(f => f.faculty === faculty.faculty);
                        const prevNormLoad = prevFaculty ? prevFaculty.normalizedLoad : '0.00';
                        const yearlyAvg = (((parseFloat(faculty.normalizedLoad) + parseFloat(prevNormLoad)) / 2).toFixed(2));
                        const designationStyle = getDesignationStyle(faculty.designation);
                        
                        return (
                          <Tr
                            key={index}
                            bg={designationStyle.bg}
                            _hover={{ bg: designationStyle.hoverBg }}
                            borderLeft={designationStyle.borderLeft}
                            borderColor={designationStyle.borderColor}
                            transition="all 0.2s"
                          >
                            <Td textAlign="center" fontWeight="bold" color="gray.500" fontSize="xs">{index + 1}</Td>
                            <Td>
                              <FacultySummaryTooltip faculty={faculty}>
                                <Box cursor="pointer">
                                  <Text fontWeight="bold" fontSize="sm" color="gray.800" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>
                                    {faculty.faculty}
                                  </Text>
                                  {faculty.designation && (
                                    <Badge colorScheme={designationStyle.badge} fontSize="2xs" mt={0.5}>{faculty.designation}</Badge>
                                  )}
                                </Box>
                              </FacultySummaryTooltip>
                            </Td>
                            <Td textAlign="center" bg="green.50" fontSize="xs" px={1}><Badge colorScheme="green" fontSize="2xs">{faculty.total.theory}</Badge></Td>
                            <Td textAlign="center" bg="green.50" fontSize="xs" px={1}><Badge colorScheme="red" fontSize="2xs">{faculty.total.laboratory}</Badge></Td>
                            <Td textAlign="center" bg="green.50" fontSize="xs" px={1}><Badge colorScheme="orange" fontSize="2xs">{faculty.total.tutorial}</Badge></Td>
                            <Td textAlign="center" bg="green.100" fontWeight="bold" fontSize="xs" px={1}>{faculty.total.total}</Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="theory">
                                <Badge colorScheme="cyan" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.normalizedStudentCount.theory}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="laboratory">
                                <Badge colorScheme="cyan" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.normalizedStudentCount.laboratory}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="pink.50" fontSize="xs" px={1}>
                              <StudentCountTooltip faculty={faculty} type="tutorial">
                                <Badge colorScheme="cyan" fontSize="2xs" cursor="pointer" _hover={{ transform: 'scale(1.1)' }}>{faculty.normalizedStudentCount.tutorial}</Badge>
                              </StudentCountTooltip>
                            </Td>
                            <Td textAlign="center" bg="yellow.50" fontWeight="bold" fontSize="xs" px={1}>
                              <Badge colorScheme="yellow" fontSize="xs" px={2} py={1}>{faculty.normalizedLoad}</Badge>
                            </Td>
                            {showYearlyLoad && (
                              <>
                                <Td textAlign="center" bg="orange.50" fontWeight="bold" fontSize="xs" px={1}>
                                  <Badge colorScheme="orange" fontSize="xs" px={2} py={1}>{prevNormLoad}</Badge>
                                </Td>
                                <Td textAlign="center" fontWeight="bold" fontSize="xs" bgGradient="linear(to-r, green.50, teal.50, blue.50)" px={1}>
                                  <Badge bgGradient="linear(to-r, green.400, teal.400, blue.400)" color="white" fontSize="sm" px={3} py={1} borderRadius="full" boxShadow="md">
                                    {yearlyAvg}
                                  </Badge>
                                </Td>
                              </>
                            )}
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </Card>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default MasterLoadDataTable;