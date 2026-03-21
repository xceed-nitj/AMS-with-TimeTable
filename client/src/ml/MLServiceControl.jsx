import React, { useState, useEffect } from "react";
import axios from "axios";
import getEnvironment from "../getenvironment";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  IconButton,
} from "@chakra-ui/react";
import { Button } from "@chakra-ui/button";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useToast } from "@chakra-ui/react";
import Header from "../components/header";

function MLServiceControl() {
  const toast = useToast();
  const apiUrl = getEnvironment();

  const [status, setStatus] = useState({ running: false, pid: null });
  const [mlHealth, setMlHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/v1/ml/status`, {
        withCredentials: true,
      });
      setStatus(res.data);

      if (res.data.running) {
        const health = await axios.get(`${apiUrl}/api/v1/ml/health`, {
          withCredentials: true,
        });
        setMlHealth(health.data);
      } else {
        setMlHealth(null);
      }
    } catch (e) {
      setStatus({ running: false, pid: null });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/api/v1/ml/${action}`, {}, {
        withCredentials: true,
      });
      toast({
        position: "bottom",
        title: `ML Service ${action}`,
        description: `ML service ${action} successful`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setTimeout(fetchStatus, 3000);
    } catch (e) {
      toast({
        position: "bottom",
        title: "Error",
        description: e.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Box bg="white" minH="100vh">
      {/* Hero Header */}
      <Box
        bgGradient="linear(to-r, blue.400, purple.500, teal.500)"
        pt={0}
        pb={24}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0" left="0" right="0" bottom="0"
          opacity="0.1"
          bgImage="radial-gradient(circle, white 1px, transparent 1px)"
          bgSize="30px 30px"
        />

        <Box position="relative" zIndex={2}>
          <Header />
        </Box>

        <Container maxW="7xl" position="relative" mt={8}>
          <Flex justify="space-between" align="center" w="full" gap={4}>
            <VStack spacing={4} align="start" flex="1">
              <Badge
                colorScheme="whiteAlpha"
                fontSize="sm"
                px={3} py={1}
                borderRadius="full"
              >
                ML Service
              </Badge>
              <Heading
                size="2xl"
                color="white"
                fontWeight="bold"
                lineHeight="1.2"
              >
                ML Service Control
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="2xl">
                Start, stop or restart the face recognition ML service.
              </Text>
            </VStack>

            <IconButton
              icon={<ArrowBackIcon />}
              aria-label="Go back"
              onClick={() => window.history.back()}
              size="lg"
              bg="rgba(255, 255, 255, 0.2)"
              color="white"
              fontSize="2xl"
              _hover={{ bg: "rgba(255, 255, 255, 0.3)" }}
              borderRadius="full"
              boxShadow="lg"
              border="2px solid"
              borderColor="whiteAlpha.400"
              flexShrink={0}
            />
          </Flex>
        </Container>
      </Box>

      <Container maxW="3xl" mt={-12} position="relative" zIndex={1} pb={16}>
        <VStack spacing={6} align="stretch">

          {/* Status Card */}
          <Card
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            border="2px"
            borderColor={status.running ? "green.300" : "red.300"}
          >
            <CardHeader
              bg={status.running ? "green.500" : "red.500"}
              borderRadius="2xl 2xl 0 0"
              p={4}
            >
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    w={4} h={4}
                    borderRadius="full"
                    bg="white"
                    opacity={status.running ? 1 : 0.5}
                  />
                  <Text color="white" fontWeight="bold" fontSize="lg">
                    {status.running ? "ML Service Running" : "ML Service Stopped"}
                  </Text>
                </HStack>
                {status.pid && (
                  <Badge colorScheme="whiteAlpha" fontSize="sm">
                    PID: {status.pid}
                  </Badge>
                )}
              </Flex>
            </CardHeader>

            <CardBody p={6}>
              <VStack spacing={4} align="stretch">

                {/* Health Info */}
                {mlHealth && (
                  <Box
                    bg="green.50"
                    border="1px"
                    borderColor="green.200"
                    borderRadius="lg"
                    p={4}
                  >
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Model Loaded
                        </Text>
                        <Text fontWeight="bold" color="green.600">
                          {mlHealth.model_loaded ? "✅ Yes" : "❌ No"}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Students Enrolled
                        </Text>
                        <Text fontWeight="bold" color="green.600">
                          {mlHealth.students_enrolled}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>
                )}

                {/* Control Buttons */}
                <HStack spacing={4} justify="center" pt={2}>
                  <Button
                    colorScheme="green"
                    size="lg"
                    isLoading={loading}
                    isDisabled={status.running}
                    onClick={() => handleAction("start")}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                    minW="100px"
                  >
                    Start
                  </Button>

                  <Button
                    colorScheme="red"
                    size="lg"
                    isLoading={loading}
                    isDisabled={!status.running}
                    onClick={() => handleAction("stop")}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                    minW="100px"
                  >
                    Stop
                  </Button>

                  <Button
                    colorScheme="orange"
                    size="lg"
                    isLoading={loading}
                    onClick={() => handleAction("restart")}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.2s"
                    minW="100px"
                  >
                    Restart
                  </Button>
                </HStack>

              </VStack>
            </CardBody>
          </Card>

        </VStack>
      </Container>
    </Box>
  );
}

export default MLServiceControl;