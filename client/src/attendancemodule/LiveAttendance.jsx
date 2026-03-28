import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Text, VStack, HStack, Badge, Heading, Alert, AlertIcon } from '@chakra-ui/react';
import axios from 'axios';

const LiveAttendance = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [attendanceState, setAttendanceState] = useState({});
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const startLiveFeed = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsRecording(true);
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && isRecording) {
          const formData = new FormData();
          formData.append('video', event.data, 'live_chunk.webm');
          try {
            // Using the full URL as setup in Node
            const res = await axios.post('http://localhost:8010/api/ml/live-video', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data) {
              if (res.data.total_enrolled) setTotalEnrolled(res.data.total_enrolled);
              if (res.data.attendance && Array.isArray(res.data.attendance)) {
                setAttendanceState(prev => {
                  const next = { ...prev };
                  res.data.attendance.forEach(s => {
                    const sid = s.student_id;
                    if (!next[sid]) {
                      next[sid] = s;
                    } else if (s.present) {
                      next[sid].present = true;
                    }
                  });
                  return next;
                });
              }
            }
          } catch (err) {
              console.error("Error processing chunk", err);
          }
        }
      };
      // Send a chunk every 7 seconds automatically
      mediaRecorderRef.current.start(7000);
    } catch (err) {
      console.error("Error accessing webcam", err);
      alert("Please allow webcam access for live attendance.");
    }
  };

  const enrollMe = async () => {
    if (!videoRef.current) return;
    setIsEnrolling(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('photo', blob, 'enroll.jpg');
        try {
          await axios.post('http://localhost:8010/api/ml/enroll', formData);
          alert('You have been successfully enrolled as "Test User"! The AI will now recognize you in the next frame.');
        } catch (e) {
          console.error(e);
          alert('Enrollment failed. See console.');
        }
        setIsEnrolling(false);
      }, 'image/jpeg');
    } catch (err) {
      console.error(err);
      setIsEnrolling(false);
    }
  };

  const stopLiveFeed = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveFeed();
    };
  }, []);

  return (
    <Box p={8} maxW="1200px" mx="auto" mt={20}>
      <Heading mb={6} color="blue.700">Live Classroom Attendance</Heading>
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        Uses your webcam to process real-time video frames. AI toggles students to 'Present' automatically as they are recognized.
      </Alert>
      <HStack spacing={8} align="flex-start">
        <VStack spacing={4} flex={1}>
          <Box w="100%" bg="black" borderRadius="xl" overflow="hidden" boxShadow="lg" border="4px solid" borderColor={isRecording ? "green.400" : "gray.200"}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }}></video>
          </Box>
          <HStack w="100%" justify="center" pt={4} spacing={4}>
            {!isRecording ? (
              <Button colorScheme="blue" size="lg" px={8} onClick={startLiveFeed} boxShadow="md">Start Monitoring</Button>
            ) : (
              <Button colorScheme="red" size="lg" px={8} onClick={stopLiveFeed} boxShadow="md">Stop Monitoring</Button>
            )}
            {isRecording && (
              <Button colorScheme="teal" size="lg" px={8} isLoading={isEnrolling} loadingText="Enrolling..." onClick={enrollMe} boxShadow="md" title="Snap a photo of yourself to magically register in the system!">Enroll Me</Button>
            )}
          </HStack>
        </VStack>
        <Box flex={1} bg="white" p={6} borderRadius="xl" boxShadow="md" minH="400px" border="1px solid" borderColor="gray.100">
          <HStack justify="space-between" mb={4} borderBottom="2px solid" borderColor="gray.100" pb={2}>
            <Heading size="md">Detected Students</Heading>
            <Badge colorScheme="purple" fontSize="0.9em" px={3} py={1} borderRadius="full">
               Total Present: {Object.values(attendanceState).filter(st => st.present).length} / {totalEnrolled || Object.keys(attendanceState).length}
            </Badge>
          </HStack>
          {Object.keys(attendanceState).length === 0 ? (
             <Text color="gray.500" fontStyle="italic" textAlign="center" mt={10}>No individuals recognized yet. Starting webcam will begin detection...</Text>
          ) : (
             <VStack align="stretch" spacing={3}>
               {Object.keys(attendanceState).map(sid => {
                 const st = attendanceState[sid];
                 return (
                   <HStack key={sid} w="100%" p={3} bg={st.present ? 'green.50' : 'gray.50'} borderRadius="md" border="1px solid" borderColor={st.present ? 'green.200' : 'gray.200'} justify="space-between">
                     <Text fontWeight="bold" fontSize="lg">{st.name}</Text>
                     <Badge colorScheme={st.present ? 'green' : 'gray'} px={3} py={1} fontSize="sm" borderRadius="full">
                       {st.present ? 'Present' : 'Absent'}
                     </Badge>
                   </HStack>
                 );
               })}
             </VStack>
          )}
        </Box>
      </HStack>
    </Box>
  );
};

export default LiveAttendance;
