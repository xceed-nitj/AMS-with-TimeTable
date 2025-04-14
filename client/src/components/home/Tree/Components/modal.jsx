import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    HStack,
    VStack,
    Avatar,
    Center,
    Divider,
    Text,
    useDisclosure,
    Grid,
    useBreakpointValue
} from '@chakra-ui/react';
import getEnvironment from '../../../../getenvironment';

function BasicUsage({ student, size, id }) {
    const OverlayOne = () => (
        <ModalOverlay bg='blackAlpha.600' backdropFilter='blur(10px)' />
    );
    const apiUrl = getEnvironment();
    const [overlay, setOverlay] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [module, setModule] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchModule = async () => {
            try {
                const response = await fetch(`${apiUrl}/platform/get-modules/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const moduleData = await response.json();
                setModule(moduleData);
            } catch (err) {
                setError(err.message);
                console.error("Error fetching module:", err);
            }
        };

        fetchModule();
    }, [id, apiUrl]);

    // Responsive values
    const modalWidth = useBreakpointValue({ base: "90vw", md: "70vw" });
    const modalHeight = useBreakpointValue({ base: "80vh", md: "70vh" });
    const gridTemplateColumns = useBreakpointValue({ base: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" });
    
    return (
        <>
            <Text
                fontSize={size}
                onClick={() => {
                    setOverlay(<OverlayOne />);
                    onOpen();
                }}
                cursor="pointer"
                color="white"
            >
                {student}
            </Text>

            <Modal isOpen={isOpen} onClose={onClose}>
                {overlay}
                <ModalContent
                    bg="#172144"
                    color="white"
                    border="2px solid #41DFDE"
                    maxWidth="90vw"
                    width={modalWidth}
                    height={modalHeight}
                    margin="auto"
                >
                    <ModalCloseButton color="#41DFDE" />
                    <ModalBody
                        maxHeight="90vh"
                        sx={{
                            // Custom Scrollbar Styles
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: '#41DFDE',
                                borderRadius: '4px',
                                border: '2px solid #172144', // Match modal background
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#349a9a',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: '#2c3e50',
                            },
                        }}
                        overflowY="auto"
                    >
                        <HStack p="10px" w="100%" h="100%" spacing={5} flexDirection={{ base: "column", md: "row" }}>
                            <VStack align="left" w={{ base: "100%", md: "50%" }} h="100%">
                                <Text fontSize="20px" fontWeight="bold">
                                    {module ? module.name : "Loading module name"}
                                </Text>
                                <Text textAlign="justify">
                                    {module ? module.description : "Loading module data..."}
                                </Text>
                            </VStack>
                            <Center h="100%" display={{ base: "none", md: "block" }}>
                                <Divider orientation="vertical" />
                            </Center>
                            <VStack w={{ base: "100%", md: "50%" }} h="100%" align="left">
                                <Text color="#197676" fontSize="16px" fontWeight="bold">Contributors:</Text>
                                <Grid templateColumns={gridTemplateColumns} gap={4} w="100%">
                                    {module && module.contributors ? (
                                        module.contributors.map((contributor, index) => (
                                            <VStack key={index} spacing={2} align="center">
                                                <Avatar
                                                    name={contributor.name}
                                                    src={contributor.image}
                                                    w={{ base: 10, sm: 12 }}
                                                    h={{ base: 10, sm: 12 }}
                                                    onClick={() => window.open(contributor.linkedin)}
                                                    cursor="pointer"
                                                />
                                                <Text fontWeight="semibold" fontSize={{ base: "12px", sm: "14px" }}>
                                                    {contributor.name}
                                                </Text>
                                                <Text fontWeight="light" fontSize={{ base: "10px", sm: "12px" }} color="gray">
                                                    {contributor.designation}
                                                </Text>
                                            </VStack>
                                        ))
                                    ) : (
                                        <Text>Loading contributors...</Text>
                                    )}
                                </Grid>
                            </VStack>
                        </HStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

export default BasicUsage;
