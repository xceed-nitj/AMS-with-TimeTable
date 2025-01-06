import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    HStack,
    VStack,
    Icon,
    Avatar,
    Center,
    Divider,
    Text,
    useDisclosure,
    Grid
} from '@chakra-ui/react';
import { FaLinkedinIn } from "react-icons/fa";
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
      
     

    return (
        <>
            <Text 
                fontSize={size} 
                onClick={() => {
                    setOverlay(<OverlayOne />);
                    onOpen();
                }}
                cursor="pointer" 
                color="white">
                {student}
            </Text>

            <Modal isOpen={isOpen} onClose={onClose}>
                {overlay}
                <ModalContent
                    bg="#172144"
                    color="white"
                    border="2px solid #41DFDE"
                    maxWidth="90vw" // Adjusts width to 90% of the viewport width
                    width="70vw"
                    height="70vh" // Adjusts height to 90% of the viewport height
                    margin="auto" // Ensures proper centering
                >
                    <ModalCloseButton color="#41DFDE" />
                    <ModalBody>
                        <HStack p="10px" w="100%" h="100%" spacing={5}>
                            <VStack align="left" w="50%" h="100%">
                                <Text fontSize="20px" fontWeight="bold">{module ? module.name : "Loading module name"}</Text>
                                <Text textAlign="justify">
                                    {module ? module.description : "Loading module data..."}
                                </Text>
                            </VStack>
                            <Center h="100%">
                                <Divider orientation="vertical" />
                            </Center>
                            <VStack w="50%" h="100%" align="left">
                                <Text color="#197676" fontSize="16px" fontWeight="bold">Contributors:</Text>
                                <Grid templateColumns="repeat(3, 1fr)" gap={4} w="100%">
                                    {module && module.contributors ? (
                                        module.contributors.map((contributor, index) => (
                                            <VStack key={index} spacing={2} align="center">
                                                <Avatar name={contributor.name} src={contributor.image} w={12} h={12}  onClick={() => window.open(contributor.linkedin)} cursor="pointer" />
                                                <Text fontWeight="semibold" fontSize="14px">{contributor.name}</Text>
                                                <Text fontWeight="light" fontSize="12px" color="gray">{contributor.designation}</Text>
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
