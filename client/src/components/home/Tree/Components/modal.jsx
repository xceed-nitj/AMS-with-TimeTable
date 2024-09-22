import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    HStack,
    VStack,
    Icon,
    Avatar,
    Center,
    Divider
  } from '@chakra-ui/react'
  import { FaGithub } from "react-icons/fa6";
  import { FaLinkedinIn } from "react-icons/fa";
  import { FaTwitter } from "react-icons/fa6";  
  import { Button, Text, useDisclosure } from '@chakra-ui/react';
  import React from 'react';
  
  function BasicUsage({ student }) {
    // Define the custom overlay
    const OverlayOne = () => (
      <ModalOverlay
        bg='blackAlpha.600'
        backdropFilter='blur(10px)'
      />
    );
  
    const [overlay, setOverlay] = React.useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure(); 
  
    return (
      <>
        <Text 
          fontSize={{ base: "8px", md: "11px" }} 
          onClick={() => {
            setOverlay(<OverlayOne />);
            onOpen();
          }}
          cursor="pointer" 
          color="white">
          {student}
        </Text>
  
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          {overlay}
          <ModalContent bg="#172144" color="white" border="2px solid #41DFDE">
            <ModalCloseButton color="#41DFDE"/>
            <ModalBody>
                <HStack p="10px" w="100%" spacing={5}>
                    <VStack align="left" w="300px">
                        <Text fontSize="20px" fontWeight="bold">Certificate Module</Text>
                        <Text textAlign="justify" >
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta? Refert tamen, quo modo.
                        </Text>
                    </VStack>
                    <Center h="200px">
                      <Divider orientation='vertical' />
                    </Center>
                    <VStack w="50%">
                      <Text color="#197676" fontSize="16px" fontWeight="bold">Contributors:</Text>
                      <VStack w="100%">
                        <HStack justifyContent="space-between" w="100%" spacing={0}>
                          <HStack>
                            <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' w={8} h={8} />
                            <VStack spacing={0} align="baseline">
                            <Text fontWeight="semibold" fontSize="14px">ABC EFG</Text>
                              <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                            </VStack>
                          </HStack>
                          <Icon as={FaLinkedinIn} w={5} h={5} />
                        </HStack>

                        <HStack justifyContent="space-between" w="100%" spacing={0}>
                        <HStack justifyContent="space-between" w="100%" spacing={0}>
                          <HStack>
                            <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' w={8} h={8} />
                            <VStack spacing={0} align="baseline">
                            <Text fontWeight="semibold" fontSize="14px">ABC EFG</Text>
                              <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                            </VStack>
                          </HStack>
                          <Icon as={FaLinkedinIn} w={5} h={5} />
                        </HStack>
                      </HStack>

                        <HStack justifyContent="space-between" w="100%" spacing={0}>
                        <HStack justifyContent="space-between" w="100%" spacing={0}>
                          <HStack>
                            <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' w={8} h={8} />
                            <VStack spacing={0} align="baseline">
                            <Text fontWeight="semibold" fontSize="14px">ABC EFG</Text>
                              <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                            </VStack>
                          </HStack>
                          <Icon as={FaLinkedinIn} w={5} h={5} />
                        </HStack>
                        </HStack>
                      </VStack>
                    </VStack>
                </HStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }
  
  export default BasicUsage;
  