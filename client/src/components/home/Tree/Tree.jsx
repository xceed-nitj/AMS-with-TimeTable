import React, { useState, useEffect } from 'react';
import { VStack, HStack, Icon, Text, Avatar, Button } from '@chakra-ui/react';
import { GrCertificate } from 'react-icons/gr';
import { AiOutlineLinkedin } from 'react-icons/ai';
import BasicUsage from './Components/modal';
import getEnviroment from '../../../getenvironment';
import axios from 'axios';
import  { useBreakpointValue } from '@chakra-ui/react';

const getYearColor = (year) => {
  const yearColors = {
    2026: "#80EBC6",
    2025: "#4AE1AA",
    2024: "#02D496",
    2023: "#02A976",
    2022: "#027F5A",
  };
  return yearColors[year] || "#02D496"; // Default to black if year is not found
};
const GrowthTree = () => {
  const [modules, setModules] = useState([]);
  const [modulr, setModulr] = useState([]);
  const [modull, setModull] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = getEnviroment();
  const [showAll, setShowAll] = useState(false);
  const slicedModuler = showAll ? modulr : modulr.slice(0, 2);
  const slicedModulel = showAll ? modull : modull.slice(0, 2);


  // Fetch modules from the backend
  useEffect(() => {
    const fetchModules = async () => {

      try {
        const response = await axios.get(`${apiUrl}/platform/get-modules` ,  {
          credentials: 'include'
        });

        let fetchedModules = response.data;

        // Sort modules by yearLaunched in descending order
        fetchedModules = fetchedModules.sort((a, b) => b.yearLaunched - a.yearLaunched);

        setModules(fetchedModules); // Store the sorted full data

        // Distribute data between modulr and modull alternately
        const modr = [];
        const modl = [];

        fetchedModules.forEach((module, index) => {
          if (index % 2 === 0) {
            modl.push(module); // Even index to modulr
          } else {
            modr.push(module); // Odd index to modull
          }
        });

        setModulr(modr);
        setModull(modl);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching modules:", err);
        setError('Failed to fetch modules');
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  if (loading) {
    console.log("Loading state...");
    return <div>Loading...</div>;
  }

  if (error) {
    console.log("Error state:", error);
    return <div>{error}</div>;
  }


  return (
    <VStack color="white" w="100%" spacing={{ base: "0px", md: "1px", lg: "2"}} align="center">
        <VStack
        border="25px solid #02D496"
        borderWidth={{ base: "15px", md: "20px", lg: "25px" }}
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
          <Text fontSize={{ base: "12px", md: "16px", lg: "20px" }}>
            We are growing from 2022
          </Text>
        </VStack>
      </VStack>
    <HStack spacing={0} w="100%" h="100%">
    <VStack color="white" w="50%" borderRight="10px solid #02D496" spacing={0} align="end" borderRightWidth={{ base: "5px", md: "10px" , lg:"15px" }}>
    {slicedModulel.map((module, index) => (
      <VStack w="100%" spacing={0} pt="100px">
        <CertificateDetails1 Module={module} />
        <HStack spacing={0} w="85%" justify="right">
          <HStack
          border={`5px solid ${getYearColor(module.yearLaunched)}`}
          borderTopLeftRadius="25%"
          borderBottomEndRadius="25%"
          p="15px"
          w={{ base: "150px", md: "200px" }}
          h={{ base: "150px", md: "200px" }}>
              <ContributorsList module={module}/>
          </HStack>
          <HStack
                    borderTop={`5px solid ${getYearColor(module.yearLaunched)}`}
                    borderLeft={`5px solid ${getYearColor(module.yearLaunched)}`}
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
    ))}
    </VStack>
    <VStack color="white" w="50%" borderLeft="5px solid #02D496" spacing={0} align="baseline" pt="50px">
      {slicedModuler.map((module, index) => (
      <VStack w="100%" spacing={0} align="baseline" pt="100px">
        <CertificateDetails Module={module} />
        <HStack spacing={0}>
            <HStack
                    borderTop={`5px solid ${getYearColor(module.yearLaunched)}`}
                    borderRight={`5px solid ${getYearColor(module.yearLaunched)}`}
                    w={{ base: "50px", md: "120px" }} 
                    h={{ base: "100px", md: "120px" }} 
                    pos="relative"
                    bottom={{ base: "60px", md: "80px" }}
                    left="4px"
                    borderTopRightRadius="45%"
                    >
                    <Text color="#02D496" fontWeight="semibold"></Text>
            </HStack>
            <HStack
            border={`5px solid ${getYearColor(module.yearLaunched)}`}
            borderTopEndRadius="25%"
            borderBottomLeftRadius="25%"
            p="15px"
            w={{ base: "150px", md: "200px" }}
            h={{ base: "150px", md: "200px" }}
            align="baseline">
                <ContributorsListRight module={module}/>
            </HStack>
        </HStack>
      </VStack>
      ))}
    </VStack>
    </HStack>
    {!showAll && (modulr.length > 2 || modull.length > 2) && (
      <Button onClick={() => setShowAll(true)} colorScheme="teal" size="sm">
        View All
      </Button>
    )}
    {showAll && (modulr.length > 2 || modull.length > 2) && (
      <Button onClick={() => setShowAll(false)} colorScheme="teal" size="sm">
        View Less
      </Button>
    )}
    </VStack>
  );
};

const CertificateDetails = ({ Module }) => (
  <VStack w="100%" justify="left" spacing={0} align="baseline" >
    <HStack w={{ base: "90%", md: "70%", lg: "50%" }} spacing={0} justify={{ base: "end", md: "none" }}>
         <HStack
                  borderBottom={`5px solid ${getYearColor(Module.yearLaunched)}`}
                  borderRight={`5px solid ${getYearColor(Module.yearLaunched)}`}
                  w={{ base: "100px", md: "120px" }} 
                  h={{ base: "100px", md: "120px" }} 
                  pos="relative"
                  top={{ base: "60px", md: "80px" }}
                  left="4px"
                  borderBottomRightRadius="45%"
                >
                  <Text color="#02D496" fontWeight="semibold"></Text>
        </HStack>
      <VStack
        border={`5px solid ${getYearColor(Module.yearLaunched)}`}
        borderTopLeftRadius="25%"
        borderBottomEndRadius="25%"
        p="15px"
        w={{ base: "150px", md: "200px" }}
        h={{ base: "150px", md: "200px" }}
        align="center"
        justify="center"
      >
        <HStack>
          <Icon as={GrCertificate} w={4} h={4} />
          <Text fontWeight="bold" fontSize="14px"><BasicUsage student={Module.name} id={Module._id}/></Text>
        </HStack>
        <Text 
        fontSize={{ base: "8px", md: "12px" }} 
        noOfLines={3} 
        overflow="hidden" 
        textOverflow="ellipsis">
        {Module.description}
        </Text>
      </VStack>
    </HStack>
    <HStack w={{ base: "90%", md: "90%", lg: "60%" }} spacing={{ base: 2, md: 3 }}  >
                <HStack border={`5px solid ${getYearColor(Module.yearLaunched)}`} w={{ base: "75%", md: "80%" }}>
                  <Text color="#02D496" fontWeight="semibold"></Text>
                </HStack>
                <VStack
                  border={`5px solid ${getYearColor(Module.yearLaunched)}`}
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
                  <Text sx={{ transform: 'rotate(225deg)' }}>{Module.yearLaunched}</Text>
                </VStack>
    </HStack>
  </VStack>
);


const ContributorsListRight = ({ module}) => { 
  const contributorCount = useBreakpointValue({ base: 1, md: 2 });

  return (
  <VStack>
    <VStack 
      spacing={2} 
      align="center"
      justify="center"
    >
        <Text fontWeight="bold" fontSize="12px">
            <BasicUsage student={module.name} id={module._id}/>
        </Text>
        <Text fontWeight="bold" fontSize="10px" color="#02D496">Top Contributors:</Text>
        <VStack spacing={1}>
        {module.contributors
                    .slice(0, contributorCount) // Ensure the hook is called inside the component
                    .map((contributor, index) => (
                <ContributorRight key={index} contributor={contributor} />
            ))}
        </VStack>
    </VStack>
</VStack>

);

};

const ContributorRight = ({ contributor }) => (
  <HStack justifyContent="space-between" w={{ base: "100px", md: "170px" }} spacing={0} justify="right">
    <HStack>
      <Avatar name={contributor.name} src={contributor.avatar} h={{ base: "4", md: "6" }} w={{ base: "4", md: "6" }} />
      <VStack spacing={0} align="start">
        <Text fontWeight="bold" fontSize={{ base: "10px", md: "14px" }}>{contributor.name}</Text>
        <Text fontWeight="light" fontSize={{ base: "8px", md: "10px" }} color="gray.500">{contributor.designation}</Text>
      </VStack>
    </HStack>
    <Icon as={AiOutlineLinkedin} h={{ base: "4", md: "5" }} w={{ base: "4", md: "5" }} onClick={() => window.open(contributor.linkedin)} cursor="pointer" />
  </HStack>
);

const CertificateDetails1 = (Module) => (
    <VStack w="100%" justify="left" spacing={0} align="end">
      <HStack w={{ base: "90%", md: "70%", lg: "50%" }} spacing={0} justify={{ base: "end", md: "none" }}>
        <VStack
          border={`5px solid ${getYearColor(Module.Module.yearLaunched)}`}
          borderTopEndRadius="25%"
          borderBottomLeftRadius="25%"
          p="15px"
          w={{ base: "150px", md: "200px" }}
          h={{ base: "150px", md: "200px" }}
          align="center"
          justify="center"
        >
          <HStack>
            <Icon as={GrCertificate} w={4} h={4} />
            <Text fontWeight="bold" fontSize="14px"><BasicUsage student={Module.Module.name} id={Module.Module._id}/></Text>
          </HStack>
          <Text 
              fontSize={{ base: "8px", md: "12px" }} 
              noOfLines={3} 
              overflow="hidden" 
              textOverflow="ellipsis"
          >
              {Module.Module.description}
          </Text>
        </VStack>
        <HStack
                    borderBottom={`5px solid ${getYearColor(Module.Module.yearLaunched)}`}
                    borderLeft={`5px solid ${getYearColor(Module.Module.yearLaunched)}`}
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
                    border={`5px solid ${getYearColor(Module.Module.yearLaunched)}`}
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
                    <Text sx={{ transform: 'rotate(225deg)' }}>{Module.Module.yearLaunched}</Text>
                  </VStack>
                  <HStack border={`5px solid ${getYearColor(Module.Module.yearLaunched)}`} w={{ base: "75%", md: "80%" }}>
                    <Text color="#02D496" fontWeight="semibold"></Text>
                  </HStack>
      </HStack>
    </VStack>
  );
  
  
  const ContributorsList = ({ module }) => {
    const contributorCount = useBreakpointValue({ base: 1, md: 2 });

    return (
        <VStack spacing={2} align="center" justify="center">
            <Text fontWeight="bold" fontSize="12px">{module.name}</Text>
            <Text fontWeight="bold" fontSize="10px" color="#02D496">Top Contributors:</Text>
            <VStack spacing={1}>
                {module.contributors
                    .slice(0, contributorCount) // Ensure the hook is called inside the component
                    .map((contributor, index) => (
                        <ContributorRight key={index} contributor={contributor} />
                    ))}
            </VStack>
        </VStack>
    );
};

  

export default GrowthTree;
