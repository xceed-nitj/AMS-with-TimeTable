import { VStack, Text, HStack, Avatar, Icon } from "@chakra-ui/react";
import { AiOutlineLinkedin } from "react-icons/ai";
import { GrCertificate } from "react-icons/gr";
import BasicUsage from "./Components/modal";

const GrowthTree = () => {
  return (
    <VStack spacing={{ base: 3, lg: 5}} color="white">
      <VStack
        border="10px solid #02D496"
        borderTopEndRadius="50%"
        fontSize={{ base: "12px", md: "18px", lg: "24px" }}
        fontWeight="bold"
        borderBottomLeftRadius="50%"
        sx={{ transform: 'rotate(225deg)' }}
      >
        <VStack
          sx={{ transform: 'rotate(-225deg)' }}
          w={{ base: "80px", md: "120px", lg: "150px" }} 
          h={{ base: "80px", md: "120px", lg: "150px" }} 
          textAlign="center"
          justify="center"
        >
          <Text>We are growing from 2020</Text>
        </VStack>
      </VStack>

      <HStack spacing={0} w="100%">
        <VStack color="white" w="50%" borderRight="5px solid #02D496" h={{ base: "600px", md: "720px", lg: "800px", xl:"900px"}} spacing={0}> 
          <VStack w="100%" justify="left" spacing={0}  align="end">
            <HStack w={{ base: "70%", md: "70%", lg:"50%" }} spacing={0} justify={{ base: "end", md: "none" }}>
              <VStack
                border="5px solid #02D496" 
                borderTopEndRadius="25%"
                borderBottomLeftRadius="25%"
                p="15px" 
                w={{ base: "150px", md: "200px" }} 
                h={{ base: "150px", md: "200px" }} 
              >
                <HStack>
                  <Icon as={GrCertificate} w={4} h={4} /> 
                  <Text fontWeight="bold" fontSize="14px">Certificate Module</Text> 
                </HStack>
                <Text fontSize={{ base: "8px", md: "12px" }}> 
                Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis. 
                </Text>
              </VStack>
              <HStack
                borderBottom="5px solid #02D496"
                borderLeft="5px solid #02D496"
                w={{ base: "100px", md: "120px" }} 
                h={{ base: "100px", md: "120px" }} 
                pos="relative"
                top={{ base: "60px", md: "80px" }}
                right="4px"
                borderBottomLeftRadius="45%"
              >
                <Text color="#02D496" fontWeight="semibold"></Text>
              </HStack>
            </HStack>

            <HStack w={{ base: "90%", md: "90%", lg: "60%" }} spacing={{ base: 2, md: 3 }}  >
              <VStack
                border="5px solid #02D496"
                borderTopEndRadius="50%"
                fontSize="20px"
                fontWeight="bold"
                color="#02D496"
                borderBottomLeftRadius="50%"
                sx={{ transform: 'rotate(-225deg)' }}
                h={{ base: "70px", md: "80px" }}
                w={{ base: "70px", md: "80px" }} 
                textAlign="center"
                justify="center"
              >
                <Text sx={{ transform: 'rotate(225deg)' }}>2021</Text>
              </VStack>
              <HStack border="5px solid #02D496" w={{ base: "75%", md: "80%" }}>
                <Text color="#02D496" fontWeight="semibold"></Text>
              </HStack>
            </HStack>

            <HStack w={{ base: "70%", md:"70%" ,lg: "50%" }} spacing={0} >
              <VStack
                border="5px solid #02D496"
                borderTopLeftRadius="25%"
                borderBottomEndRadius="25%"
                p="15px"
                spacing={1}
                w={{ base: "150px", md: "200px" }}
                h={{ base: "150px", md: "200px" }}
              >
                <Text fontWeight="bold" fontSize={{ base: "10px", md: "14px" }}>Certificate Module</Text>
                <Text color="#197676" 
                fontSize={{ base: "8px", md: "12px" }} fontWeight="semibold">Top Contributors:</Text>
                <VStack>
                  <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                  <HStack>
                    <Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }} />
                    <VStack spacing={0} align="start">
                      <BasicUsage student="ABC EFG" />
                      <Text fontWeight="light" fontSize={{ base: "8px", md: "10px" }} color="gray.500">
                        Designation
                      </Text>
                    </VStack>
                  </HStack>

                    <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }}  />
                  </HStack>

                  <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }} />
                      <VStack spacing={0} align="baseline">
                      <BasicUsage student="ABC EFG" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }}  />
                  </HStack>

                  <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }}  />
                      <VStack spacing={0} align="baseline">
                      <BasicUsage student="ABC EFG" />
                      <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }}  />
                  </HStack>
                </VStack>
              </VStack>

              <HStack
                borderTop="5px solid #02D496"
                borderLeft="5px solid #02D496"
                w={{ base: "100px", md: "120px" }} 
                h={{ base: "100px", md: "120px" }} 
                pos="relative"
                bottom={{ base: "60px", md: "80px" }}
                right="4px"
                borderTopLeftRadius="45%"
              >
                <Text color="#02D496" fontWeight="semibold"></Text>
              </HStack>
            </HStack>
          </VStack>
        </VStack>

        <VStack color="white" w="50%" borderLeft="5px solid #197676" h={{ base: "600px", md: "720px", lg: "800px", xl:"900px" }}   spacing={0} pb="25px" pt="25%">
          <VStack w="100%" align="baseline" spacing={0}>
            <HStack w="80%" spacing={0}>
              <HStack
                borderRight="5px solid #197676"
                borderBottom="5px solid #197676"
                w={{ base: "100px", md: "100px", lg: "120px"
                 }} 
                h={{ base: "100px", md: "120px" }} 
                pos="relative"
                top={{ base: "65px", md: "80px" }}
                left="4px"
                borderBottomEndRadius="45%"
              >
                <Text color="#197676" fontWeight="semibold"></Text>
              </HStack>
              <VStack
                border="5px solid #197676"
                borderTopLeftRadius="25%"
                borderBottomEndRadius="25%"
                p="15px"
                w={{ base: "150px", md: "200px" }}
                h={{ base: "150px", md: "200px" }}
              >
                <HStack>
                  <Icon as={GrCertificate} w={4} h={4} />
                  <Text fontWeight="bold" fontSize={{ base: "8px", md: "14px" }}>Certificate Module</Text>
                </HStack>
                <Text fontSize={{ base: "8px", md: "12px" }}>
                  Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis.
                </Text>
              </VStack>
            </HStack>

            <HStack w={{ base: "90%", md: "90%", lg:"70%" }} spacing={{ base: 2, md: 3 }} >
            <HStack border="5px solid #197676" w={{ base: "75%", md: "80%" }}>
                <Text color="#197676" fontWeight="semibold"></Text>
              </HStack>
              <VStack
                border="5px solid #197676"
                borderTopEndRadius="50%"
                fontSize="20px"
                fontWeight="bold"
                color="#197676"
                borderBottomLeftRadius="50%"
                sx={{ transform: 'rotate(-225deg)' }}
                h={{ base: "70px", md: "80px" }}
                w={{ base: "70px", md: "80px" }} 
                textAlign="center"
                justify="center"
              >
                <Text sx={{ transform: 'rotate(225deg)' }}>2020</Text>
              </VStack>
            </HStack>

            <HStack w={{ base: "70%", md: "70%" ,lg: "50%"
             }} spacing={0} >

            <HStack
                borderTop="5px solid #197676"
                borderRight="5px solid #197676"
                w={{ base: "100px", md: "120px" }} 
                h={{ base: "100px", md: "120px" }} 
                pos="relative"
                bottom={{ base: "65px", md: "80px" }}
                left="5px"
                borderTopEndRadius="45%"
              >
                <Text color="#02D496" fontWeight="semibold"></Text>
              </HStack>

              <VStack
                border="5px solid #197676"
                borderTopEndRadius="25%"
                borderBottomLeftRadius="25%"
                p="15px"
                w={{ base: "150px", md: "200px" }}
                spacing={1}
                h={{ base: "150px", md: "200px" }}
              >
                <Text fontWeight="bold" fontSize={{ base: "8px", md: "14px" }}>Certificate Module</Text>
                <Text color="#197676" fontSize={{ base: "8px", md: "12px" }} fontWeight="semibold">Top Contributors:</Text>
                <VStack>
                  <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                      <VStack spacing={0} align="baseline">
                      <BasicUsage student="ABC EFG" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                  </HStack>

                  <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                      <VStack spacing={0} align="baseline">
                      <BasicUsage student="ABC EFG" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                  </HStack>

                  <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                      <VStack spacing={0} align="baseline">
                      <BasicUsage student="ABC EFG" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                  </HStack>
                </VStack>
              </VStack>    
            </HStack>
          </VStack>
        </VStack>
      </HStack>
    </VStack>
  );
};

export default GrowthTree;
