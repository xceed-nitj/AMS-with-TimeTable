import { VStack, Text, HStack, Avatar, Icon } from "@chakra-ui/react";
import { AiOutlineLinkedin } from "react-icons/ai";
import { GrCertificate } from "react-icons/gr";

const GrowthTree = () => {
  return (
    <VStack spacing={3} color="white">
      <VStack
        border="10px solid #02D496" // Reduced from 20px
        borderTopEndRadius="50%"
        fontSize="18px" // Reduced from 28px
        fontWeight="bold"
        borderBottomLeftRadius="50%"
        sx={{ transform: 'rotate(225deg)' }}
      >
        <VStack
          sx={{ transform: 'rotate(-225deg)' }}
          w="120px"
          h="120px" 
          textAlign="center"
          justify="center"
        >
          <Text>We are growing from 2020</Text>
        </VStack>
      </VStack>

      <HStack spacing={0} w="100%">
        <VStack color="white" w="50%" borderRight="5px solid #02D496" h="600px" spacing={0}> 
          <VStack w="100%" justify="left" spacing={0}  align="end">
            <HStack w="50%" spacing={0}>
              <VStack
                border="5px solid #02D496" 
                borderTopEndRadius="25%"
                borderBottomLeftRadius="25%"
                p="15px" 
                w="200px" 
              >
                <HStack>
                  <Icon as={GrCertificate} w={4} h={4} /> 
                  <Text fontWeight="bold" fontSize="14px">Certificate Module</Text> 
                </HStack>
                <Text fontSize="12px"> 
                Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis. Lorem ipsum dolor sit amet consectetur  Lorem ipsum dolor sit amet consectetur....
                </Text>
              </VStack>
              <HStack
                borderBottom="5px solid #02D496"
                borderLeft="5px solid #02D496"
                h="120px" 
                w="120px" 
                pos="relative"
                top="80px"
                right="4px"
                borderBottomLeftRadius="45%"
              >
                <Text color="#02D496" fontWeight="semibold"></Text>
              </HStack>
            </HStack>

            <HStack w="60%" spacing={3}  >
              <VStack
                border="5px solid #02D496"
                borderTopEndRadius="50%"
                fontSize="20px"
                fontWeight="bold"
                color="#02D496"
                borderBottomLeftRadius="50%"
                sx={{ transform: 'rotate(-225deg)' }}
                w="80px" 
                h="80px" 
                textAlign="center"
                justify="center"
              >
                <Text sx={{ transform: 'rotate(225deg)' }}>2021</Text>
              </VStack>
              <HStack border="5px solid #02D496" w="80%">
                <Text color="#02D496" fontWeight="semibold"></Text>
              </HStack>
            </HStack>

            <HStack w="50%" spacing={0}>
              <VStack
                border="5px solid #02D496"
                borderTopLeftRadius="25%"
                borderBottomEndRadius="25%"
                p="15px"
                w="200px"
              >
                <Text fontWeight="bold" fontSize="14px">Certificate Module</Text>
                <Text color="#197676" fontSize="14px" fontWeight="semibold">Top Contributors:</Text>
                <VStack>
                  <HStack justifyContent="space-between" w="150px" spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={7} w={7} />
                      <VStack spacing={0}>
                        <Text fontSize="12px">ABC EFG</Text>
                        <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={6} h={6} />
                  </HStack>

                  <HStack justifyContent="space-between" w="150px" spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={7} w={7} />
                      <VStack spacing={0}>
                        <Text fontSize="12px">ABC EFG</Text>
                        <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={6} h={6} />
                  </HStack>

                  <HStack justifyContent="space-between" w="150px" spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={7} w={7} />
                      <VStack spacing={0}>
                        <Text fontSize="12px">ABC EFG</Text>
                        <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={6} h={6} />
                  </HStack>
                </VStack>
              </VStack>

              <HStack
                borderTop="5px solid #02D496"
                borderLeft="5px solid #02D496"
                h="120px"
                w="120px"
                pos="relative"
                bottom="88px"
                right="4px"
                borderTopLeftRadius="45%"
              >
                <Text color="#02D496" fontWeight="semibold"></Text>
              </HStack>
            </HStack>
          </VStack>
        </VStack>

        <VStack color="white" w="50%" borderLeft="5px solid #197676" h="600px"  pt="150px" spacing={0} pb="25px">
          <VStack w="100%" align="baseline" spacing={0}>
            <HStack w="80%" spacing={0}>
              <HStack
                borderBottom="5px solid #197676"
                borderRight="5px solid #197676"
                h="120px"
                w="120px"
                pos="relative"
                top="80px"
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
                w="200px"
              >
                <HStack>
                  <Icon as={GrCertificate} w={4} h={4} />
                  <Text fontWeight="bold" fontSize="14px">Certificate Module</Text>
                </HStack>
                <Text fontSize="12px">
                  Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis. Lorem ipsum dolor sit amet consectetur  Lorem ipsum dolor sit amet consectetur....
                </Text>
              </VStack>
            </HStack>

            <HStack w="90%" spacing={3}>
              <HStack border="4px solid #197676" w="50%">
                <Text color="#197676" fontWeight="semibold"></Text>
              </HStack>
              <VStack
                border="7px solid #197676"
                borderTopEndRadius="50%"
                fontSize="20px"
                fontWeight="bold"
                color="#197676"
                borderBottomLeftRadius="50%"
                sx={{ transform: 'rotate(-225deg)' }}
                w="80px"
                h="80px"
                textAlign="center"
                justify="center"
              >
                <Text sx={{ transform: 'rotate(225deg)' }}>2020</Text>
              </VStack>
            </HStack>

            <HStack w="80%" spacing={0}>
              <HStack
                borderTop="5px solid #197676"
                borderRight="5px solid #197676"
                h="120px"
                w="120px"
                pos="relative"
                bottom="85px"
                left="4px"
                borderTopEndRadius="45%"
              >
                <Text color="#41DFDE" fontWeight="semibold"></Text>
              </HStack>
              <VStack
                border="5px solid #197676"
                borderTopEndRadius="25%"
                borderBottomLeftRadius="25%"
                p="15px"
                w="200px"
                spacing={1}
              >
                <Text fontWeight="bold" fontSize="14px">Certificate Module</Text>
                <Text color="#197676" fontSize="14px" fontWeight="semibold">Top Contributors:</Text>
                <VStack>
                  <HStack justifyContent="space-between" w="150px" spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={7} w={7} />
                      <VStack spacing={0}>
                        <Text fontSize="12px">ABC EFG</Text>
                        <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={6} h={6} />
                  </HStack>

                  <HStack justifyContent="space-between" w="150px" spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={7} w={7} />
                      <VStack spacing={0}>
                        <Text fontSize="12px">ABC EFG</Text>
                        <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={6} h={6} />
                  </HStack>

                  <HStack justifyContent="space-between" w="150px" spacing={0}>
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={7} w={7} />
                      <VStack spacing={0}>
                        <Text fontSize="12px">ABC EFG</Text>
                        <Text fontWeight="light" fontSize="10px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={6} h={6} />
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
