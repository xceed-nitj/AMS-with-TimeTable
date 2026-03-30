import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import getEnvironment from "../getenvironment";
import {
  Box, Container, Heading, Text, VStack, HStack,
  Badge, Flex, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, IconButton, Card, CardBody,
  CardHeader, SimpleGrid, Input, FormControl,
  FormLabel, Select, Tooltip, Divider, Avatar, Image,
  Progress, List, ListItem, ListIcon
} from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { ArrowBackIcon, CheckIcon, CloseIcon, RepeatIcon, TimeIcon } from "@chakra-ui/icons";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";

function MLDashboard() {
  const toast = useToast();
  const apiUrl = getEnvironment();

  // ── ML Service State ──
  const [serviceStatus, setServiceStatus] = useState({ running: false, pid: null });
  const [mlHealth, setMlHealth] = useState(null);
  const [serviceLoading, setServiceLoading] = useState(false);

  // ── Student Enrollment State ──
  const [students, setStudents] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ── Roll List State ──
  const [courseCode, setCourseCode] = useState("");
  const [rollFile, setRollFile] = useState(null);
  const [rollLists, setRollLists] = useState([]);
  const [rollLoading, setRollLoading] = useState(false);

  // ── Attendance State ──
  const [videoPath, setVideoPath] = useState("");
  const [frameSkip, setFrameSkip] = useState(10);
  const [autoThreshold, setAutoThreshold] = useState(0.60);
  const [reviewThreshold, setReviewThreshold] = useState(0.40);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState("all");
  const [manualApprovals, setManualApprovals] = useState({});

  // ── Live Progress State ──
  const [progressStage, setProgressStage] = useState(null);   // "extracting" | "clustering" | "identifying" | "done"
  const [progressData, setProgressData] = useState(null);     // { frame, totalFrames, facesFound, progress, elapsedSec, etaSec }
  const [progressLog, setProgressLog] = useState([]);         // array of { time, message, stage }
  const progressLogRef = useRef(null);

  // ── Fetch service status every 5s ──
  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/v1/ml/status`, { withCredentials: true });
      setServiceStatus(res.data);
      if (res.data.running) {
        const health = await axios.get(`${apiUrl}/api/v1/ml/health`, { withCredentials: true });
        setMlHealth(health.data);
      } else {
        setMlHealth(null);
      }
    } catch (e) {
      setServiceStatus({ running: false, pid: null });
    }
  };

  // ── Fetch Students ──
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/v1/ml/enrolled-students`, { withCredentials: true });
      setStudents(res.data.students || []);
      setStudentSummary(res.data);
    } catch (e) {}
    setStudentsLoading(false);
  };

  // ── Fetch Roll Lists ──
  const fetchRollLists = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/v1/ml/rolllists`, { withCredentials: true });
      setRollLists(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    fetchStudents();
    fetchRollLists();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Service Control ──
  const handleServiceAction = async (action) => {
    setServiceLoading(true);
    try {
      await axios.post(`${apiUrl}/api/v1/ml/${action}`, {}, { withCredentials: true });
      toast({ position: "bottom", title: `ML Service ${action}`, status: "success", duration: 2000, isClosable: true });
      setTimeout(fetchStatus, 3000);
    } catch (e) {
      toast({ position: "bottom", title: "Error", description: e.response?.data?.error || e.message, status: "error", duration: 3000, isClosable: true });
    }
    setServiceLoading(false);
  };

  // ── Upload Roll List ──
  const handleRollListUpload = async () => {
    if (!courseCode || !rollFile) {
      toast({ position: "bottom", title: "Enter course code and select file", status: "error", duration: 2000, isClosable: true });
      return;
    }
    setRollLoading(true);
    try {
      const formData = new FormData();
      formData.append("rollList", rollFile);
      await axios.post(
        `${apiUrl}/api/v1/ml/upload-rolllist/${courseCode}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      toast({ position: "bottom", title: `Roll list saved for ${courseCode}`, status: "success", duration: 3000, isClosable: true });
      setCourseCode("");
      setRollFile(null);
      fetchRollLists();
    } catch (e) {
      toast({ position: "bottom", title: "Error", description: e.response?.data?.error || e.message, status: "error", duration: 3000, isClosable: true });
    }
    setRollLoading(false);
  };

  // ── Cluster Attendance (SSE streaming) ──
  const handleCluster = async () => {
    if (!videoPath) {
      toast({ position: "bottom", title: "Enter video path", status: "error", duration: 2000, isClosable: true });
      return;
    }
    setClusterLoading(true);
    setManualApprovals({});
    setResult(null);
    setProgressStage("start");
    setProgressData(null);
    setProgressLog([]);

    const addLog = (message, stage) => {
      const entry = { time: new Date().toLocaleTimeString(), message, stage };
      setProgressLog(prev => {
        const next = [...prev, entry];
        return next.slice(-20); // keep last 20 entries
      });
      // auto-scroll log
      setTimeout(() => {
        if (progressLogRef.current)
          progressLogRef.current.scrollTop = progressLogRef.current.scrollHeight;
      }, 50);
    };

    try {
      const formData = new FormData();
      formData.append("videoPath", videoPath);
      formData.append("frameSkip", frameSkip);
      formData.append("autoThreshold", autoThreshold);
      formData.append("reviewThreshold", reviewThreshold);
      formData.append("clusterThreshold", 0.45);
      formData.append("minSamples", 2);

      const response = await fetch(
        `${apiUrl}/api/v1/ml/process-clustering-stream`,
        { method: "POST", body: formData, credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop(); // keep incomplete last chunk

        for (const chunk of chunks) {
          const dataLine = chunk.split("\n").find(l => l.startsWith("data: "));
          if (!dataLine) continue;
          let data;
          try { data = JSON.parse(dataLine.slice(6)); } catch { continue; }

          if (data.type === "error") {
            toast({ position: "bottom", title: "Processing Error", description: data.message, status: "error", duration: 5000, isClosable: true });
            addLog(`❌ ${data.message}`, "error");
            setProgressStage("error");

          } else if (data.type === "stage") {
            setProgressStage(data.stage);
            addLog(`▶ ${data.message}`, data.stage);

          } else if (data.type === "progress") {
            setProgressData(data);
            addLog(`⏳ ${data.message}`, data.stage);

          } else if (data.type === "done") {
            setResult(data.result);
            setProgressStage("done");
            addLog(`✅ ${data.message}`, "done");
            const s = data.result?.summary || {};
            toast({
              position: "bottom",
              title: "Clustering Done! 🧠",
              description: `Present: ${s.present} | Review: ${s.review} | Absent: ${s.absent} | Unknown: ${s.unknown_faces}`,
              status: "success", duration: 5000, isClosable: true,
            });
          }
        }
      }
    } catch (e) {
      toast({ position: "bottom", title: "Error", description: e.message, status: "error", duration: 3000, isClosable: true });
      setProgressStage("error");
    }
    setClusterLoading(false);
  };

  // ── Manual Approval ──
  const handleManualApproval = (rollNo, approved) => {
    setManualApprovals(prev => ({ ...prev, [rollNo]: approved }));
  };

  const getFinalStatus = (student) => {
    const mlStatus = student.ml_status || student.status;
    if (mlStatus === "review") {
      if (manualApprovals[student.roll_no] === true) return "present";
      if (manualApprovals[student.roll_no] === false) return "absent";
      return "review";
    }
    return mlStatus;
  };

  const getTableData = () => {
    if (!result) return [];
    const all = result.comparison ||
      Object.entries(result.attendance || {}).map(([roll_no, v]) => ({ roll_no, ...v }));
    if (filter === "all") return all;
    if (filter === "present") return all.filter(s => getFinalStatus(s) === "present");
    if (filter === "absent") return all.filter(s => getFinalStatus(s) === "absent");
    if (filter === "review") return all.filter(s => getFinalStatus(s) === "review");
    if (filter === "not_enrolled") return all.filter(s => (s.ml_status || s.status) === "not_enrolled");
    if (filter === "unknown") return all.filter(s => (s.ml_status || s.status) === "unknown");
    return all;
  };

  const getStatusBadge = (student) => {
    const final = getFinalStatus(student);
    if (final === "present") return <Badge colorScheme="green">Present ✅</Badge>;
    if (final === "absent") return <Badge colorScheme="red">Absent ❌</Badge>;
    if (final === "review") return <Badge colorScheme="yellow">Review ⚠️</Badge>;
    if (final === "not_enrolled") return <Badge colorScheme="orange">Not Enrolled</Badge>;
    if (final === "unknown") return <Badge colorScheme="purple">Unknown 👤</Badge>;
    return <Badge colorScheme="gray">—</Badge>;
  };

  const getConfBadge = (conf) => {
    if (!conf || conf <= 0) return <Badge colorScheme="gray">—</Badge>;
    const pct = (conf * 100).toFixed(1);
    if (conf >= autoThreshold) return <Badge colorScheme="green">{pct}%</Badge>;
    if (conf >= reviewThreshold) return <Badge colorScheme="yellow">{pct}%</Badge>;
    return <Badge colorScheme="red">{pct}%</Badge>;
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_result.json`;
    a.click();
  };

  const summary = result?.summary || {};
  const pendingReview = getTableData().filter(s => getFinalStatus(s) === "review").length;

  return (
    <Box bg="gray.50" minH="100vh">
      <Header />
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">

          {/* ══════════════════════════════════════════
              SECTION 1 — ML SERVICE CONTROL
          ══════════════════════════════════════════ */}
          <Card bg="white" borderRadius="2xl" shadow="md" border="1px" borderColor="gray.200">
            <CardHeader
              bg={serviceStatus.running ? "green.500" : "red.500"}
              borderRadius="2xl 2xl 0 0" p={4}
            >
              <Flex justify="space-between" align="center">
                <HStack>
                  <Box w={4} h={4} borderRadius="full" bg="white" opacity={serviceStatus.running ? 1 : 0.5} />
                  <Heading size="md" color="white">
                    {serviceStatus.running ? "ML Service Running" : "ML Service Stopped"}
                  </Heading>
                  {serviceStatus.pid && (
                    <Badge colorScheme="whiteAlpha">PID: {serviceStatus.pid}</Badge>
                  )}
                </HStack>
                <Badge colorScheme="whiteAlpha" fontSize="sm">Section 1 — Service Control</Badge>
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Button colorScheme="green" flex={1} isLoading={serviceLoading} isDisabled={serviceStatus.running} onClick={() => handleServiceAction("start")}>Start</Button>
                    <Button colorScheme="red" flex={1} isLoading={serviceLoading} isDisabled={!serviceStatus.running} onClick={() => handleServiceAction("stop")}>Stop</Button>
                    <Button colorScheme="orange" flex={1} isLoading={serviceLoading} onClick={() => handleServiceAction("restart")}>Restart</Button>
                  </HStack>
                  <Text fontSize="xs" color="gray.400">Auto refreshes every 5 seconds</Text>
                </VStack>

                {mlHealth ? (
                  <SimpleGrid columns={2} spacing={4}>
                    <Box bg="green.50" borderRadius="lg" p={3} textAlign="center">
                      <Text fontSize="xl" fontWeight="bold" color="green.600">{mlHealth.students_enrolled}</Text>
                      <Text fontSize="xs" color="gray.500">Students Enrolled</Text>
                    </Box>
                    <Box bg="blue.50" borderRadius="lg" p={3} textAlign="center">
                      <Text fontSize="xl" fontWeight="bold" color="blue.600">{mlHealth.model_loaded ? "✅ Yes" : "❌ No"}</Text>
                      <Text fontSize="xs" color="gray.500">Model Loaded</Text>
                    </Box>
                  </SimpleGrid>
                ) : (
                  <Box bg="gray.50" borderRadius="lg" p={4} textAlign="center">
                    <Text color="gray.400" fontSize="sm">Start the service to see health info</Text>
                  </Box>
                )}
              </SimpleGrid>
            </CardBody>
          </Card>

          <Divider />

          {/* ══════════════════════════════════════════
              SECTION 2 — STUDENT ENROLLMENT + ROLL LISTS
          ══════════════════════════════════════════ */}
          <Card bg="white" borderRadius="2xl" shadow="md" border="1px" borderColor="gray.200">
            <CardHeader bg="blue.500" borderRadius="2xl 2xl 0 0" p={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md" color="white">Student Enrollment & Roll Lists</Heading>
                <HStack>
                  <Badge colorScheme="whiteAlpha">Section 2</Badge>
                  <Button size="sm" variant="ghost" color="white" leftIcon={<RepeatIcon />} onClick={fetchStudents} isLoading={studentsLoading} _hover={{ bg: "whiteAlpha.200" }}>
                    Refresh
                  </Button>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">

                {/* Enrollment Stats */}
                {studentSummary && (
                  <SimpleGrid columns={3} spacing={4}>
                    <Box bg="blue.50" borderRadius="lg" p={4} textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="blue.600">{studentSummary.total}</Text>
                      <Text fontSize="sm" color="gray.500">Total in Folder</Text>
                    </Box>
                    <Box bg="green.50" borderRadius="lg" p={4} textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">{studentSummary.enrolled_in_db}</Text>
                      <Text fontSize="sm" color="gray.500">Enrolled in DB</Text>
                    </Box>
                    <Box bg="orange.50" borderRadius="lg" p={4} textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                        {(studentSummary.total || 0) - (studentSummary.enrolled_in_db || 0)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">Not in DB Yet</Text>
                    </Box>
                  </SimpleGrid>
                )}

                {/* Info */}
                <Box bg="blue.50" border="1px" borderColor="blue.200" borderRadius="lg" p={3}>
                  <Text fontSize="sm" color="blue.700">
                    📁 Add student folders to <strong>client/public/ground-truth/</strong> with format:
                    <strong> ROLLNO_FirstName_LastName/</strong>
                    — embeddings rebuild automatically when photos added.
                  </Text>
                </Box>

                {/* Student Grid */}
                {students.length > 0 ? (
                  <SimpleGrid columns={{ base: 3, md: 5, lg: 8 }} spacing={3}>
                    {students.map((student) => (
                      <Box
                        key={student.student_id}
                        textAlign="center" p={2} borderRadius="lg"
                        border="2px"
                        borderColor={student.enrolled_in_db ? "green.200" : "orange.200"}
                        bg={student.enrolled_in_db ? "green.50" : "orange.50"}
                      >
                        {student.first_photo ? (
                          <Image
                            src={`http://localhost:8500${student.first_photo}`}
                            alt={student.name}
                            boxSize="48px" borderRadius="full"
                            objectFit="cover" mx="auto" mb={1}
                            fallback={<Avatar size="sm" name={student.name} mx="auto" mb={1} />}
                          />
                        ) : (
                          <Avatar size="sm" name={student.name} mx="auto" mb={1} />
                        )}
                        <Text fontSize="9px" fontWeight="bold" noOfLines={1}>{student.student_id}</Text>
                        <Text fontSize="9px" color="gray.500" noOfLines={1}>{student.name.split(" ")[0]}</Text>
                        <Badge fontSize="8px" colorScheme={student.enrolled_in_db ? "green" : "orange"}>
                          {student.enrolled_in_db ? "✅" : "⚠️"}
                        </Badge>
                      </Box>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Box textAlign="center" py={4} color="gray.400">
                    <Text>No students found in ground-truth folder</Text>
                  </Box>
                )}

                <Divider />

                {/* ── Roll List Upload ── */}
                <Box>
                  <Text fontWeight="bold" fontSize="md" color="gray.700" mb={3}>
                    📋 Course Roll Lists
                  </Text>

                  <Text fontSize="xs" color="gray.500" mb={3}>
                    Upload Excel roll list once per course. System automatically uses it
                    when video filename starts with course code.
                    e.g. <strong>ECE301</strong>_2026_03_22.mp4
                  </Text>

                  {/* Upload form */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold">Course Code</FormLabel>
                      <Input
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                        placeholder="ECE301"
                        size="sm" bg="gray.50"
                        border="2px" borderColor="gray.200"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold">Roll List Excel/CSV</FormLabel>
                      <Input
                        type="file" accept=".xlsx,.xls,.csv"
                        onChange={(e) => setRollFile(e.target.files[0])}
                        size="sm" bg="gray.50"
                        border="2px" borderColor="gray.200"
                        pt={1}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="transparent">.</FormLabel>
                      <Button
                        colorScheme="blue" size="sm" w="full"
                        isLoading={rollLoading}
                        loadingText="Saving..."
                        onClick={handleRollListUpload}
                      >
                        Save Roll List
                      </Button>
                    </FormControl>
                  </SimpleGrid>

                  {/* Saved roll lists */}
                  {rollLists.length > 0 ? (
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.600">
                        Saved Roll Lists:
                      </Text>
                      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={2}>
                        {rollLists.map((list) => (
                          <Box
                            key={list.courseCode}
                            bg="blue.50" border="1px"
                            borderColor="blue.200"
                            borderRadius="lg" p={3}
                            textAlign="center"
                          >
                            <Text fontWeight="bold" color="blue.700" fontSize="sm">
                              {list.courseCode}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {list.totalStudents} students
                            </Text>
                            <Text fontSize="9px" color="gray.400">
                              {new Date(list.uploadedAt).toLocaleDateString()}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  ) : (
                    <Box
                      bg="gray.50" border="1px" borderColor="gray.200"
                      borderRadius="lg" p={3} textAlign="center"
                    >
                      <Text fontSize="sm" color="gray.400">
                        No roll lists saved yet. Upload one above.
                      </Text>
                    </Box>
                  )}
                </Box>

              </VStack>
            </CardBody>
          </Card>

          <Divider />

          {/* ══════════════════════════════════════════
              SECTION 3 — PROCESS ATTENDANCE
          ══════════════════════════════════════════ */}
          <Card bg="white" borderRadius="2xl" shadow="md" border="1px" borderColor="gray.200">
            <CardHeader bg="teal.500" borderRadius="2xl 2xl 0 0" p={4}>
              <Flex justify="space-between" align="center">
                <Heading size="md" color="white">Process Attendance</Heading>
                <Badge colorScheme="whiteAlpha">Section 3</Badge>
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">

                <Box bg="purple.50" border="1px" borderColor="purple.200" borderRadius="lg" p={3}>
                  <Text fontSize="sm" color="purple.700">
                    🧠 <strong>Automatic:</strong> Drop video in <strong>classroom-videos/</strong> folder
                    — system processes automatically using saved roll list for that course.
                    <br />
                    ⚡ <strong>Manual:</strong> Enter path below and click process to trigger manually.
                  </Text>
                </Box>

                <FormControl>
                  <FormLabel fontWeight="semibold">Video Path (manual trigger)</FormLabel>
                  <Input
                    value={videoPath}
                    onChange={(e) => setVideoPath(e.target.value)}
                    placeholder="ECE301_2026_03_22_0900.mp4 — name must start with course code"
                    bg="gray.50" border="2px" borderColor="gray.200"
                  />
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    Video filename format: COURSECODE_date_time.mp4
                    (e.g. ECE301_2026_03_22_0900.mp4)
                  </Text>
                </FormControl>

                {/* Thresholds */}
                <Box bg="yellow.50" border="1px" borderColor="yellow.200" borderRadius="lg" p={4}>
                  <Text fontWeight="bold" mb={3} color="yellow.700" fontSize="sm">
                    Confidence Settings
                  </Text>
                  <SimpleGrid columns={3} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="xs">Frame Skip</FormLabel>
                      <Input
                        type="number" min="1" max="30"
                        value={frameSkip}
                        onChange={(e) => setFrameSkip(parseInt(e.target.value))}
                        size="sm" bg="white" border="2px" borderColor="gray.200"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" color="green.600">Auto Present (above)</FormLabel>
                      <Input
                        type="number" step="0.05" min="0.5" max="0.9"
                        value={autoThreshold}
                        onChange={(e) => setAutoThreshold(parseFloat(e.target.value))}
                        size="sm" bg="white" border="2px" borderColor="green.300"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" color="yellow.600">Review Zone (above)</FormLabel>
                      <Input
                        type="number" step="0.05" min="0.3" max="0.6"
                        value={reviewThreshold}
                        onChange={(e) => setReviewThreshold(parseFloat(e.target.value))}
                        size="sm" bg="white" border="2px" borderColor="yellow.300"
                      />
                    </FormControl>
                  </SimpleGrid>
                  <HStack mt={2} spacing={2} fontSize="xs">
                    <Badge colorScheme="red">Below {reviewThreshold} = Absent</Badge>
                    <Text>→</Text>
                    <Badge colorScheme="yellow">{reviewThreshold}–{autoThreshold} = Review</Badge>
                    <Text>→</Text>
                    <Badge colorScheme="green">Above {autoThreshold} = Present</Badge>
                  </HStack>
                </Box>

                <Button
                  colorScheme="purple" size="lg"
                  isLoading={clusterLoading}
                  loadingText="Processing..."
                  onClick={handleCluster}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  🧠 Process Video (Cluster Mode)
                </Button>

                {/* ── Live Progress Panel ── */}
                {clusterLoading && progressStage && progressStage !== "done" && (
                  <Box
                    bg="gray.900" borderRadius="xl" p={4}
                    border="1px" borderColor="purple.500"
                  >
                    {/* Stage indicator */}
                    <HStack mb={3} spacing={3}>
                      <Box w={3} h={3} borderRadius="full" bg="purple.400"
                        animation="pulse 1.5s infinite" />
                      <Text color="purple.300" fontWeight="bold" fontSize="sm">
                        {{
                          start:       "🚀 Starting...",
                          extracting:  "🎞 Extracting faces from video",
                          clustering:  "🔵 Clustering face embeddings",
                          identifying: "🔍 Identifying people",
                          saving:      "💾 Saving cluster images",
                        }[progressStage] || `⚙ ${progressStage}`}
                      </Text>
                    </HStack>

                    {/* Progress bar — only shown during extraction */}
                    {progressStage === "extracting" && progressData?.progress != null && (
                      <Box mb={3}>
                        <HStack justify="space-between" mb={1}>
                          <Text color="gray.400" fontSize="xs">
                            Frame {(progressData.frame || 0).toLocaleString()} / {(progressData.total_frames || 0).toLocaleString()}
                          </Text>
                          <HStack spacing={3}>
                            <Text color="green.300" fontSize="xs">
                              {progressData.faces_found} faces found
                            </Text>
                            <Text color="gray.400" fontSize="xs">
                              {progressData.elapsed_sec}s elapsed
                            </Text>
                            {progressData.eta_sec != null && (
                              <Text color="yellow.300" fontSize="xs">
                                ~{Math.round(progressData.eta_sec)}s left
                              </Text>
                            )}
                          </HStack>
                        </HStack>
                        <Progress
                          value={progressData.progress}
                          colorScheme="purple" size="sm"
                          borderRadius="full" hasStripe isAnimated
                        />
                        <Text color="gray.500" fontSize="xs" mt={1} textAlign="right">
                          {progressData.progress}%
                        </Text>
                      </Box>
                    )}

                    {/* Stats row for non-extraction stages */}
                    {progressStage !== "extracting" && progressData && (
                      <HStack spacing={4} mb={3}>
                        <Badge colorScheme="green">{progressData.faces_found} faces</Badge>
                        <Badge colorScheme="blue">{progressData.elapsed_sec}s elapsed</Badge>
                      </HStack>
                    )}

                    {/* Scrollable log */}
                    <Box
                      ref={progressLogRef}
                      maxH="150px" overflowY="auto"
                      bg="black" borderRadius="md" p={2}
                      fontFamily="mono" fontSize="xs"
                    >
                      {progressLog.map((entry, i) => (
                        <HStack key={i} spacing={2} align="start" py="1px">
                          <Text color="gray.600" flexShrink={0}>{entry.time}</Text>
                          <Text color={
                            entry.stage === "error"      ? "red.300" :
                            entry.stage === "done"       ? "green.300" :
                            entry.stage === "extracting" ? "cyan.300" :
                            entry.stage === "clustering" ? "blue.300" :
                            "gray.300"
                          }>
                            {entry.message}
                          </Text>
                        </HStack>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Final summary after done */}
                {progressStage === "done" && progressLog.length > 0 && !clusterLoading && (
                  <Box bg="green.50" border="1px" borderColor="green.300" borderRadius="lg" p={3}>
                    <Text fontSize="sm" fontWeight="bold" color="green.700">
                      ✅ {progressLog[progressLog.length - 1]?.message}
                    </Text>
                  </Box>
                )}

                {result?.output_dir && (
                  <Box bg="purple.50" border="1px" borderColor="purple.300" borderRadius="lg" p={3}>
                    <Text fontSize="xs" fontWeight="bold" color="purple.700">
                      📁 Face folders saved at:
                    </Text>
                    <Text fontSize="xs" color="purple.600" fontFamily="mono">
                      {result.output_dir}
                    </Text>
                  </Box>
                )}

              </VStack>
            </CardBody>
          </Card>

          {/* ── Attendance Results ── */}
          {result && (
            <Card bg="white" borderRadius="2xl" shadow="md" border="1px" borderColor="gray.200">
              <CardHeader bg="gray.700" borderRadius="2xl 2xl 0 0" p={4}>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Heading size="md" color="white">Attendance Results</Heading>
                    <Badge colorScheme="purple">🧠 Cluster Mode</Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.300">
                    {summary.processing_time}s processing time
                  </Text>
                </Flex>
              </CardHeader>
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">

                  {pendingReview > 0 && (
                    <Box bg="yellow.50" border="2px" borderColor="yellow.400" borderRadius="xl" p={3}>
                      <HStack>
                        <Text fontSize="xl">⚠️</Text>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color="yellow.700" fontSize="sm">
                            {pendingReview} students need manual review
                          </Text>
                          <Text fontSize="xs" color="yellow.600">
                            Open face folder → check photo → use ✓ / ✗ buttons
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  )}

                  <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
                    {[
                      { label: "Clusters Found", value: summary.unique_clusters_found, color: "blue"   },
                      { label: "Present ✅",     value: summary.present,              color: "green"  },
                      { label: "Review ⚠️",      value: summary.review,               color: "yellow" },
                      { label: "Absent ❌",      value: summary.absent,               color: "red"    },
                      { label: "Unknown 👤",     value: summary.unknown_faces,         color: "orange" },
                    ].map((stat) => (
                      <Box
                        key={stat.label}
                        bg={`${stat.color}.50`}
                        border="1px" borderColor={`${stat.color}.200`}
                        borderRadius="xl" p={3} textAlign="center"
                      >
                        <Text fontSize="2xl" fontWeight="bold" color={`${stat.color}.600`}>
                          {stat.value ?? 0}
                        </Text>
                        <Text fontSize="xs" color="gray.600">{stat.label}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>

                  <HStack justify="space-between">
                    <Select value={filter} onChange={(e) => setFilter(e.target.value)} maxW="180px" size="sm">
                      <option value="all">All Students</option>
                      <option value="present">Present ✅</option>
                      <option value="review">Review ⚠️</option>
                      <option value="absent">Absent ❌</option>
                      <option value="not_enrolled">Not Enrolled</option>
                      <option value="unknown">Unknown 👤</option>
                    </Select>
                    <Button colorScheme="blue" size="sm" onClick={handleDownload}>
                      Download JSON
                    </Button>
                  </HStack>

                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead bg="gray.100">
                        <Tr>
                          <Th>Roll No</Th>
                          <Th>Name</Th>
                          <Th>Status</Th>
                          <Th isNumeric>Detections</Th>
                          <Th>Confidence</Th>
                          <Th>First Seen</Th>
                          <Th>Approve</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {getTableData().map((student, idx) => (
                          <Tr
                            key={idx}
                            bg={
                              getFinalStatus(student) === "present" ? "green.50"  :
                              getFinalStatus(student) === "review"  ? "yellow.50" :
                              getFinalStatus(student) === "absent"  ? "red.50"    :
                              "orange.50"
                            }
                            _hover={{ opacity: 0.85 }}
                          >
                            <Td fontWeight="bold">{student.roll_no}</Td>
                            <Td>{student.name}</Td>
                            <Td>{getStatusBadge(student)}</Td>
                            <Td isNumeric>
                              {student.detections ?? student.detection_count ?? 0}
                            </Td>
                            <Td>{getConfBadge(student.avg_confidence)}</Td>
                            <Td fontSize="xs" color="gray.500">
                              {student.first_seen_sec ? `${student.first_seen_sec}s` : "—"}
                            </Td>
                            <Td>
                              {(student.ml_status === "review" || student.status === "review") ? (
                                <HStack spacing={1}>
                                  <Tooltip label="Mark Present">
                                    <IconButton
                                      icon={<CheckIcon />} size="xs"
                                      colorScheme={manualApprovals[student.roll_no] === true ? "green" : "gray"}
                                      onClick={() => handleManualApproval(student.roll_no, true)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Mark Absent">
                                    <IconButton
                                      icon={<CloseIcon />} size="xs"
                                      colorScheme={manualApprovals[student.roll_no] === false ? "red" : "gray"}
                                      onClick={() => handleManualApproval(student.roll_no, false)}
                                    />
                                  </Tooltip>
                                </HStack>
                              ) : (
                                <Text fontSize="xs" color="gray.400">Auto</Text>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>

                </VStack>
              </CardBody>
            </Card>
          )}

        </VStack>
      </Container>
    </Box>
  );
}

export default MLDashboard;