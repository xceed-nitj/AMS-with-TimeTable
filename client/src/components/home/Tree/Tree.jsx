import { VStack, Text, HStack, Avatar, Icon } from "@chakra-ui/react";
import { AiOutlineLinkedin } from "react-icons/ai";
import { GrCertificate } from "react-icons/gr";
import BasicUsage from "./Components/modal";

const GrowthTree = () => {

  const handleRedirect = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
          <Text>We are growing from 2022</Text>
        </VStack>
      </VStack>
      <HStack spacing={0} w="100%">
        <VStack color="white" w="50%" borderRight="5px solid #02D496" h={{ base: "1500px", md: "1700px", lg: "1700px", xl:"1800px"}} spacing={0}> 
          <VStack w="100%" spacing={100}>
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
                  Our service caters to your unique needs, offering a robust and customizable webpage to bring your.... 
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
                  <Text sx={{ transform: 'rotate(225deg)' }}>2024</Text>
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
                        <BasicUsage student="Sarthak Sharma" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "10px" }} color="gray.500">
                        Frontend Developer
                        </Text>
                      </VStack>
                    </HStack>
                      <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }} onClick={() => handleRedirect("https://www.linkedin.com/in/sarthak-sharma-33620219b/")}cursor="pointer"  />
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Dohit Deegwal" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Club Lead</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }}  onClick={() => handleRedirect("https://www.linkedin.com/in/dohitdeegwal/")}cursor="pointer"/>
                    </HStack>

                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }}  />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Kashish Mangal" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Full Stack Developer</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }} onClick={() => handleRedirect("hhttps://www.linkedin.com/in/kashishmangal/")} cursor="pointer" />
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
                    <Text fontWeight="bold" fontSize="14px">Review Module</Text> 
                  </HStack>
                  <Text fontSize={{ base: "8px", md: "12px" }}> 
                  We specialize in crafting visually stunning and functionally robust websites that .. .. 
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
                  <Text sx={{ transform: 'rotate(225deg)' }}>2024</Text>
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
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Aditya Gupta" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Club Lead</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/aditya-gupta-6014081bb/")} cursor="pointer"/>
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Gautam Singla" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Co-Lead</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/ggsingla/")} cursor="pointer"/>
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Avnash Kumar" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Frontend Developer</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/avnashkumar/")} cursor="pointer" />
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
                    <Text fontWeight="bold" fontSize="14px">Time Table Module</Text> 
                  </HStack>
                  <Text fontSize={{ base: "8px", md: "12px" }}> 
                  Timetable Module is aimed at reducing the manual work to a great extent in... 
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
                  <Text sx={{ transform: 'rotate(225deg)' }}>2023
                  </Text>
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
                  <Text fontWeight="bold" fontSize={{ base: "10px", md: "14px" }}>Time Table Module</Text>
                  <Text color="#197676" 
                  fontSize={{ base: "8px", md: "12px" }} fontWeight="semibold">Top Contributors:</Text>
                  <VStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                    <HStack>
                      <Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }} />
                      <VStack spacing={0} align="start">
                        <BasicUsage student="Gautam Singla" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "10px" }} color="gray.500">
                        Co-lead
                        </Text>
                      </VStack>
                    </HStack>
                      <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }} onClick={() => handleRedirect("https://www.linkedin.com/in/ggsingla/")} cursor="pointer" />
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Pihu" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Co-lead</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }} onClick={() => handleRedirect("https://www.linkedin.com/in/pihu-nitj/")} cursor="pointer" />
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }}  />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Dhruv Bhardwaj" />
                        <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Frontend Developer</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }} onClick={() => handleRedirect("https://www.linkedin.com/in/dhruv-bhardwaj-6b28661bb/")} cursor="pointer"/>
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
        </VStack>
{/* right side is here         */}
        <VStack color="white" w="50%" borderLeft="5px solid #197676" h={{ base: "1500px", md: "1700px", lg: "1700px", xl:"1800px"}}   spacing={0} pb="25px" pt="12%">
          <VStack w="100%" align="baseline" spacing={100}>
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
                    <Text fontWeight="bold" fontSize={{ base: "8px", md: "14px" }}>Conference Module</Text>
                  </HStack>
                  <Text fontSize={{ base: "8px", md: "12px" }}>
                  Elevate your conference experience with our expertly crafted conference website development services....
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
                  <Text sx={{ transform: 'rotate(225deg)' }}>2023</Text>
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
                  <Text fontWeight="bold" fontSize={{ base: "8px", md: "14px" }}>Conference Module</Text>
                  <Text color="#197676" fontSize={{ base: "8px", md: "12px" }} fontWeight="semibold">Top Contributors:</Text>
                  <VStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Aditya Gupta" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Club Lead</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/aditya-gupta-6014081bb/")} cursor="pointer"/>
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Gautam Singla" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Co-Lead</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/ggsingla/")} cursor="pointer"/>
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Avnash Kumar" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Frontend Developer</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/avnashkumar/")} cursor="pointer" />
                    </HStack>
                  </VStack>
                </VStack>    
              </HStack>
            </VStack>
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
                    <Text fontWeight="bold" fontSize={{ base: "8px", md: "14px" }}>Management of NITJ's Official Website</Text>
                  </HStack>
                  <Text fontSize={{ base: "8px", md: "12px" }}>
                  This service is under the Website Development and Management Committe....
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
                  <Text sx={{ transform: 'rotate(225deg)' }}>2022</Text>
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
                        <BasicUsage student="Bhavya Mittal" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Frontend Developer</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/mbhavya09/?originalSubdomain=in")} cursor="pointer"/>
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Gautam Singla" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Frontend Developer</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/gautam-singla-12a634211/")} cursor="pointer"/>
                    </HStack>
                    <HStack justifyContent="space-between" w={{ base: "100px", md: "150px" }} spacing={0}>
                      <HStack>
                        <Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov'w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <VStack spacing={0} align="baseline">
                        <BasicUsage student="Kashish mangal" />
                          <Text fontWeight="light" fontSize={{ base: "8px", md: "9px" }} color="gray">Backend Developer</Text>
                        </VStack>
                      </HStack>
                      <Icon as={AiOutlineLinkedin} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} onClick={() => handleRedirect("https://www.linkedin.com/in/kashish-mangal-95b463228/")} cursor="pointer" />
                    </HStack>
                  </VStack>
                </VStack>    
              </HStack>
            </VStack>
          </VStack>
        </VStack>
      </HStack>
    </VStack>
  );
};
export default GrowthTree;
