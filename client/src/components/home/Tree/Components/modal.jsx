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
                <HStack p="10px">
                    <VStack align="left">
                        <VStack align="left" spacing={0}>
                            <Text fontSize="20px" fontWeight="bold">ABC DEF</Text>
                            <Text fontSize="16px" fontWeight="semibold">Designation</Text>
                            <HStack>
                                <Icon as={FaGithub} h={5} w={5}  />
                                <Icon as={FaLinkedinIn} h={5} w={5}  />
                                <Icon as={FaTwitter} h={5} w={5}  />
                            </HStack>
                        </VStack>
                        <Text textAlign="justify" >
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta? Refert tamen, quo modo.
                        </Text>
                    </VStack>
                    <Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" h="200px" w="133px" />
                </HStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }
  
  export default BasicUsage;
  