import { VStack, Text, HStack, Avatar , Icon} from "@chakra-ui/react";
import { AiOutlineLinkedin } from "react-icons/ai";
import { GrCertificate } from "react-icons/gr";
const GrowthTree = () => {
  return (
    <VStack spacing={5} color="white">
      <VStack
            border="20px solid #41DFDE"
            borderTopEndRadius="50%"
            fontSize="28px"
            fontWeight="bold"
            borderBottomLeftRadius="50%"
            sx={{ transform: 'rotate(225deg)' }}
          >
            <VStack sx={{ transform: 'rotate(-225deg)' }} w="200px" h="200px" textAlign="center" justify="center">
              <Text>We are growing from 2020</Text>
            </VStack>
      </VStack>
      <HStack spacing={0} w="100%">
      <VStack color="white" w="50%" borderRight="10px solid #41DFDE" spacing={0}>
        <VStack w="100%" align="end" spacing={0}>
          <HStack w="80%" spacing={0}>
            <VStack border="10px solid #41DFDE" borderTopEndRadius="25%" borderBottomLeftRadius="25%" p="25px" w="350px">
              <HStack>
                <Icon as={GrCertificate} w={6} h={6}></Icon>
                <Text fontWeight="bold" fontSize="24px">Certificate Module</Text>
              </HStack>
              <Text>Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis. Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis.Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis...</Text>
            </VStack>
            <HStack borderBottom="10px solid #41DFDE" borderLeft="9px solid #41DFDE" h="250px" w="250px" pos="relative" top="95px" right="9px" borderBottomLeftRadius="45%" >
              <Text color="#41DFDE" fontWeight="semibold"></Text>
            </HStack>
          </HStack>
          <HStack w="90%" spacing={5}>
            <VStack
              border="10px solid #41DFDE"
              borderTopEndRadius="50%"
              fontSize="32px"
              fontWeight="bold"
              color="#41DFDE"
              borderBottomLeftRadius="50%"
              sx={{ transform: 'rotate(-45deg)' }}
              w="150px"
              h="150px"
              textAlign="center"
              justify="center"
            >
              <Text sx={{ transform: 'rotate(45deg)' }}>2021</Text>
            </VStack>
            <HStack border="7px solid #41DFDE" w="78%">
              <Text color="#41DFDE" fontWeight="semibold"></Text>
            </HStack>
          </HStack>
          <HStack w="80%" spacing={0}>
              <VStack border="10px solid #41DFDE" borderTopEndRadius="25%" borderBottomLeftRadius="25%" p="25px" w="350px">
                <Text fontWeight="bold" fontSize="24px">Certificate Module</Text>
                <Text color="#41DFDE" fontWeight="semibold">Top Contributors:</Text>
                <VStack>
                  <HStack justifyContent="space-between" w="300px">
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                      <VStack spacing={0}>
                        <Text>ABC EFG</Text>
                        <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
                  </HStack>
                  <HStack justifyContent="space-between" w="300px">
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                      <VStack spacing={0}>
                        <Text>ABC EFG</Text>
                        <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
                  </HStack>
                  <HStack justifyContent="space-between" w="300px">
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                      <VStack spacing={0}>
                        <Text>ABC EFG</Text>
                        <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
                  </HStack>
                  <HStack justifyContent="space-between" w="300px">
                    <HStack>
                      <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                      <VStack spacing={0}>
                        <Text>ABC EFG</Text>
                        <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                      </VStack>
                    </HStack>
                    <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
                  </HStack>
                </VStack>
            </VStack>
            <HStack borderTop="10px solid #41DFDE" borderLeft="9px solid #41DFDE" h="250px" w="250px" pos="relative" bottom="134px" right="9px" borderTopLeftRadius="45%" >
              <Text color="#41DFDE" fontWeight="semibold"></Text>
            </HStack>
          </HStack>
        </VStack>
      </VStack>
        {/* <VStack color="white" w="50%" borderRight="10px solid #41DFDE">
        <VStack w="40%">
          <VStack border="10px solid #41DFDE" borderTopEndRadius="25%" borderBottomLeftRadius="25%" p="25px" w="350px">
            <HStack>
              <Icon as={GrCertificate} w={6} h={6}></Icon>
              <Text fontWeight="bold" fontSize="24px">Certificate Module</Text>
            </HStack>
            <Text>Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis. Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis.Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis...</Text>
          </VStack>
          <VStack
            border="10px solid #41DFDE"
            borderTopEndRadius="50%"
            fontSize="32px"
            fontWeight="bold"
            color="#41DFDE"
            mr="150%"
            borderBottomLeftRadius="50%"
            sx={{ transform: 'rotate(-45deg)' }}
            w="150px"
            h="150px"
            textAlign="center"
            justify="center"
          >
            <Text sx={{ transform: 'rotate(45deg)' }}>2021</Text>
          </VStack>
          <VStack border="10px solid #41DFDE" borderTopLeftRadius="25%" borderBottomEndRadius="25%" p="25px" w="350px">
            <Text fontWeight="bold" fontSize="24px">Certificate Module</Text>
            <Text color="#41DFDE" fontWeight="semibold">Top Contributors:</Text>
            <VStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
              </HStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
              </HStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
              </HStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
              </HStack>
            </VStack>
          </VStack>
        </VStack>
      </VStack> */}
      <VStack color="white" w="50%" borderLeft="10px solid #41DFDE" spacing={0}>
        <VStack w="100%" align="baseline" spacing={0}>
          <HStack w="80%" spacing={0}>
            <HStack borderBottom="10px solid #41DFDE" borderRight="9px solid #41DFDE" h="250px" w="250px" pos="relative" top="95px" left="9px" borderBottomEndRadius="45%" >
              <Text color="#41DFDE" fontWeight="semibold"></Text>
            </HStack>
            <VStack border="10px solid #41DFDE" borderTopLeftRadius="25%" borderBottomEndRadius="25%" p="25px" w="350px">
              <HStack>
                <Icon as={GrCertificate} w={6} h={6}></Icon>
                <Text fontWeight="bold" fontSize="24px">Certificate Module</Text>
              </HStack>
              <Text>Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis. Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis.Lorem ipsum dolor sit amet consectetur. Enim augue arcu amet auctor lobortis...</Text>
            </VStack>
          </HStack>
          <HStack w="90%" spacing={5}>
            <HStack border="7px solid #41DFDE" w="80%">
              <Text color="#41DFDE" fontWeight="semibold"></Text>
            </HStack>
            <VStack
              border="10px solid #41DFDE"
              borderTopEndRadius="50%"
              fontSize="32px"
              fontWeight="bold"
              color="#41DFDE"
              borderBottomLeftRadius="50%"
              sx={{ transform: 'rotate(-45deg)' }}
              w="150px"
              h="150px"
              textAlign="center"
              justify="center"
            >
              <Text sx={{ transform: 'rotate(45deg)' }}>2021</Text>
            </VStack>
          </HStack>
          <HStack w="80%" spacing={0}>
            <HStack borderTop="10px solid #41DFDE" borderRight="9px solid #41DFDE" h="250px" w="250px" pos="relative" bottom="134px" left="9px" borderTopEndRadius="45%" >
              <Text color="#41DFDE" fontWeight="semibold"></Text>
            </HStack>
            <VStack border="10px solid #41DFDE" borderTopEndRadius="25%" borderBottomLeftRadius="25%" p="25px" w="350px">
            <Text fontWeight="bold" fontSize="24px">Certificate Module</Text>
            <Text color="#41DFDE" fontWeight="semibold">Top Contributors:</Text>
            <VStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
              </HStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
              </HStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
              </HStack>
              <HStack justifyContent="space-between" w="300px">
                <HStack>
                  <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />
                  <VStack spacing={0}>
                    <Text>ABC EFG</Text>
                    <Text fontWeight="light" fontSize="12px" color="gray">Designation</Text>
                  </VStack>
                </HStack>
                <Icon as={AiOutlineLinkedin} w={8} h={8}></Icon>
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
