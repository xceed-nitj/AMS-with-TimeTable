import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
} from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';

const StatCard = ({ title, value, description, icon, color }) => {
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box
      p={5}
      borderRadius="lg"
      boxShadow="md"
      bg={bgColor}
      borderLeft="4px solid"
      borderLeftColor={color}
    >
      <Flex justify="space-between">
        <Box>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">
              {title}
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold">
              {value}
            </StatNumber>
            <StatHelpText m={0} fontSize="xs">
              {description}
            </StatHelpText>
          </Stat>
        </Box>
        <Flex
          align="center"
          justify="center"
          h="50px"
          w="50px"
          borderRadius="md"
          bg={`${color}15`}
        >
          <Icon as={icon} boxSize={6} color={color} />
        </Flex>
      </Flex>
    </Box>
  );
};

export default StatCard;
