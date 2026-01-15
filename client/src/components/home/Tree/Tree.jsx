import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Icon,
  Text,
  Avatar,
  Button,
  Box,
  Flex,
  Spinner,
  keyframes,
  useBreakpointValue,
} from '@chakra-ui/react';
import { GrCertificate } from 'react-icons/gr';
import { AiOutlineLinkedin } from 'react-icons/ai';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import BasicUsage from './Components/modal';
import getEnviroment from '../../../getenvironment';
import axios from 'axios';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionFlex = motion(Flex);

// Refined color palette with gradient support
const getYearTheme = (year) => {
  const themes = {
    2026: {
      primary: '#00D9A5',
      secondary: '#00B88A',
      gradient: 'linear-gradient(135deg, #00D9A5 0%, #00B88A 100%)',
      glow: 'rgba(0, 217, 165, 0.3)',
      leaf: '#00D9A5',
      leafDark: '#00996F',
    },
    2025: {
      primary: '#10B981',
      secondary: '#059669',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      glow: 'rgba(16, 185, 129, 0.3)',
      leaf: '#10B981',
      leafDark: '#047857',
    },
    2024: {
      primary: '#22C55E',
      secondary: '#16A34A',
      gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      glow: 'rgba(34, 197, 94, 0.3)',
      leaf: '#22C55E',
      leafDark: '#15803D',
    },
    2023: {
      primary: '#84CC16',
      secondary: '#65A30D',
      gradient: 'linear-gradient(135deg, #84CC16 0%, #65A30D 100%)',
      glow: 'rgba(132, 204, 22, 0.3)',
      leaf: '#84CC16',
      leafDark: '#4D7C0F',
    },
    2022: {
      primary: '#A3E635',
      secondary: '#84CC16',
      gradient: 'linear-gradient(135deg, #A3E635 0%, #84CC16 100%)',
      glow: 'rgba(163, 230, 53, 0.3)',
      leaf: '#A3E635',
      leafDark: '#65A30D',
    },
  };
  return themes[year] || themes[2024];
};

// Animations
const pulseKeyframes = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
`;

const swayKeyframes = keyframes`
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
`;

const floatKeyframes = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(2deg); }
`;

const rustleKeyframes = keyframes`
  0%, 100% { transform: rotate(-3deg) scale(1); }
  25% { transform: rotate(2deg) scale(1.02); }
  50% { transform: rotate(-2deg) scale(1); }
  75% { transform: rotate(3deg) scale(1.01); }
`;

// Leaf SVG Component - Realistic leaf shape
const LeafSVG = ({ color, darkColor, size = 40, rotation = 0, style = {} }) => (
  <Box
    as="svg"
    width={`${size}px`}
    height={`${size * 1.4}px`}
    viewBox="0 0 40 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    transform={`rotate(${rotation}deg)`}
    style={style}
  >
    <defs>
      <linearGradient id={`leafGrad-${rotation}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor={darkColor} />
      </linearGradient>
    </defs>
    {/* Main leaf shape */}
    <path
      d="M20 2C20 2 8 14 8 28C8 42 20 54 20 54C20 54 32 42 32 28C32 14 20 2 20 2Z"
      fill={`url(#leafGrad-${rotation}-${size})`}
      opacity="0.9"
    />
    {/* Center vein */}
    <path
      d="M20 8V50"
      stroke={darkColor}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
    {/* Side veins */}
    <path
      d="M20 16L12 22M20 24L10 30M20 32L12 38M20 40L14 44"
      stroke={darkColor}
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M20 16L28 22M20 24L30 30M20 32L28 38M20 40L26 44"
      stroke={darkColor}
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.4"
    />
  </Box>
);

// Small decorative leaf
const SmallLeaf = ({ color, darkColor, size = 24, rotation = 0 }) => (
  <Box
    as="svg"
    width={`${size}px`}
    height={`${size * 1.2}px`}
    viewBox="0 0 24 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    transform={`rotate(${rotation}deg)`}
  >
    <defs>
      <linearGradient id={`smallLeaf-${rotation}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor={darkColor} />
      </linearGradient>
    </defs>
    <path
      d="M12 2C12 2 4 10 4 18C4 26 12 28 12 28C12 28 20 26 20 18C20 10 12 2 12 2Z"
      fill={`url(#smallLeaf-${rotation}-${size})`}
    />
    <path d="M12 6V26" stroke={darkColor} strokeWidth="1" opacity="0.5" />
  </Box>
);

// Tree Top with Leaves Cluster
const TreeTopLeaves = () => (
  <MotionBox
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
    position="relative"
    w="200px"
    h="180px"
    mb={-4}
  >
    {/* Center large leaf */}
    <Box
      position="absolute"
      left="50%"
      top="10px"
      transform="translateX(-50%)"
      animation={`${floatKeyframes} 4s ease-in-out infinite`}
    >
      <LeafSVG color="#10B981" darkColor="#047857" size={50} rotation={0} />
    </Box>
    
    {/* Left leaves */}
    <Box
      position="absolute"
      left="25%"
      top="30px"
      animation={`${swayKeyframes} 3s ease-in-out infinite`}
    >
      <LeafSVG color="#22C55E" darkColor="#15803D" size={40} rotation={-30} />
    </Box>
    <Box
      position="absolute"
      left="15%"
      top="60px"
      animation={`${swayKeyframes} 3.5s ease-in-out infinite 0.2s`}
    >
      <LeafSVG color="#84CC16" darkColor="#4D7C0F" size={35} rotation={-45} />
    </Box>
    <Box
      position="absolute"
      left="5%"
      top="95px"
      animation={`${rustleKeyframes} 4s ease-in-out infinite 0.5s`}
    >
      <SmallLeaf color="#A3E635" darkColor="#65A30D" size={28} rotation={-60} />
    </Box>
    
    {/* Right leaves */}
    <Box
      position="absolute"
      right="25%"
      top="30px"
      animation={`${swayKeyframes} 3.2s ease-in-out infinite 0.3s`}
    >
      <LeafSVG color="#22C55E" darkColor="#15803D" size={40} rotation={30} />
    </Box>
    <Box
      position="absolute"
      right="15%"
      top="60px"
      animation={`${swayKeyframes} 3.8s ease-in-out infinite 0.1s`}
    >
      <LeafSVG color="#84CC16" darkColor="#4D7C0F" size={35} rotation={45} />
    </Box>
    <Box
      position="absolute"
      right="5%"
      top="95px"
      animation={`${rustleKeyframes} 4.2s ease-in-out infinite 0.4s`}
    >
      <SmallLeaf color="#A3E635" darkColor="#65A30D" size={28} rotation={60} />
    </Box>

    {/* Additional small leaves for fullness */}
    <Box
      position="absolute"
      left="35%"
      top="55px"
      animation={`${floatKeyframes} 5s ease-in-out infinite 0.6s`}
    >
      <SmallLeaf color="#10B981" darkColor="#047857" size={22} rotation={-15} />
    </Box>
    <Box
      position="absolute"
      right="35%"
      top="55px"
      animation={`${floatKeyframes} 4.5s ease-in-out infinite 0.8s`}
    >
      <SmallLeaf color="#10B981" darkColor="#047857" size={22} rotation={15} />
    </Box>
  </MotionBox>
);

// Card Leaf Decoration Component
const CardLeafDecoration = ({ theme, position = 'topRight' }) => {
  const positions = {
    topRight: {
      top: '-15px',
      right: '-10px',
      rotation: 45,
    },
    topLeft: {
      top: '-15px',
      left: '-10px',
      rotation: -45,
    },
    bottomRight: {
      bottom: '-15px',
      right: '-10px',
      rotation: 135,
    },
  };

  const pos = positions[position];

  return (
    <Box
      position="absolute"
      {...pos}
      animation={`${rustleKeyframes} 5s ease-in-out infinite`}
      zIndex={2}
    >
      <LeafSVG 
        color={theme.leaf} 
        darkColor={theme.leafDark} 
        size={32} 
        rotation={pos.rotation} 
      />
    </Box>
  );
};

// Leaf Branch Connector
const LeafBranchConnector = ({ theme, isLeft }) => (
  <HStack spacing={0} position="relative">
    {/* Branch line */}
    <Box
      w="50px"
      h="3px"
      bg={`linear-gradient(${isLeft ? '90deg' : '270deg'}, ${theme.primary}, ${theme.leafDark})`}
      borderRadius="full"
    />
    {/* Small leaf at the end of branch */}
    <Box
      position="absolute"
      left={isLeft ? 'auto' : '-20px'}
      right={isLeft ? '-20px' : 'auto'}
      animation={`${swayKeyframes} 3s ease-in-out infinite`}
    >
      <SmallLeaf 
        color={theme.leaf} 
        darkColor={theme.leafDark} 
        size={20} 
        rotation={isLeft ? 90 : -90} 
      />
    </Box>
  </HStack>
);

const GrowthTree = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const apiUrl = getEnviroment();

  const visibleModules = showAll ? modules : modules.slice(0, 4);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axios.get(`${apiUrl}/platform/get-modules`, {
          credentials: 'include',
        });
        let fetchedModules = response.data;
        fetchedModules = fetchedModules.sort((a, b) => b.yearLaunched - a.yearLaunched);
        setModules(fetchedModules);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to fetch modules');
        setLoading(false);
      }
    };
    fetchModules();
  }, [apiUrl]);

  if (loading) {
    return (
      <Flex
        minH="400px"
        align="center"
        justify="center"
        bg="linear-gradient(180deg, #0A0F1A 0%, #111827 100%)"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="#10B981" thickness="4px" />
          <Text color="whiteAlpha.700" fontFamily="'DM Sans', sans-serif">
            Growing the tree...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        minH="400px"
        align="center"
        justify="center"
        bg="linear-gradient(180deg, #0A0F1A 0%, #111827 100%)"
      >
        <Text color="red.400" fontFamily="'DM Sans', sans-serif">
          {error}
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      bg="linear-gradient(180deg, #0A0F1A 0%, #0F172A 50%, #111827 100%)"
      minH="100vh"
      py={{ base: 8, md: 16 }}
      px={{ base: 4, md: 8 }}
      position="relative"
      overflow="hidden"
      fontFamily="'DM Sans', sans-serif"
    >
      {/* Background ambient effects */}
      <Box
        position="absolute"
        top="5%"
        left="10%"
        w="400px"
        h="400px"
        bg="radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="30%"
        right="5%"
        w="350px"
        h="350px"
        bg="radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)"
        borderRadius="full"
        filter="blur(50px)"
        pointerEvents="none"
      />

      {/* Header with Leaf Cluster */}
      <VStack mb={{ base: 6, md: 10 }} align="center">
        <TreeTopLeaves />
        
        <MotionVStack
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          textAlign="center"
          spacing={3}
        >
          <Text
            fontSize={{ base: '2xl', md: '4xl', lg: '5xl' }}
            fontWeight="800"
            bgGradient="linear(to-r, #10B981, #22C55E, #84CC16)"
            bgClip="text"
            letterSpacing="-0.02em"
          >
            Our Growth Journey
          </Text>
          <Text
            fontSize={{ base: 'sm', md: 'lg' }}
            color="whiteAlpha.600"
            maxW="500px"
            lineHeight="1.6"
          >
            From seed to forest — watch how we've grown since 2022
          </Text>
        </MotionVStack>
      </VStack>

      {/* Timeline Container */}
      <Box position="relative" maxW="1200px" mx="auto">
        {/* Central Trunk - styled as tree bark */}
        <Box
          position="absolute"
          left="50%"
          top="0"
          transform="translateX(-50%)"
          w="8px"
          h="100%"
          bg="linear-gradient(180deg, #15803D 0%, #14532D 50%, #1C1917 100%)"
          borderRadius="full"
          display={{ base: 'none', md: 'block' }}
          boxShadow="inset 2px 0 4px rgba(0,0,0,0.3), inset -2px 0 4px rgba(255,255,255,0.1)"
          _before={{
            content: '""',
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            w: '20px',
            h: '20px',
            bg: 'radial-gradient(circle, #22C55E 0%, #15803D 100%)',
            borderRadius: 'full',
            boxShadow: '0 0 30px rgba(34,197,94,0.6)',
          }}
        />

        {/* Mobile Trunk */}
        <Box
          position="absolute"
          left="20px"
          top="0"
          w="6px"
          h="100%"
          bg="linear-gradient(180deg, #15803D 0%, #14532D 50%, #1C1917 100%)"
          borderRadius="full"
          display={{ base: 'block', md: 'none' }}
          boxShadow="inset 1px 0 3px rgba(0,0,0,0.3)"
        />

        {/* Module Cards */}
        <VStack spacing={{ base: 8, md: 0 }} position="relative">
          {visibleModules.map((module, index) => (
            <ModuleCard
              key={module._id}
              module={module}
              index={index}
              isLeft={index % 2 === 0}
            />
          ))}
        </VStack>

        {/* Root decoration at bottom */}
        <Box
          position="absolute"
          bottom="-40px"
          left="50%"
          transform="translateX(-50%)"
          display={{ base: 'none', md: 'block' }}
        >
          <RootDecoration />
        </Box>
      </Box>

      {/* View More/Less Button */}
      {modules.length > 4 && (
        <MotionFlex
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          justify="center"
          mt={{ base: 8, md: 16 }}
        >
          <Button
            onClick={() => setShowAll(!showAll)}
            bg="rgba(34,197,94,0.1)"
            border="2px solid"
            borderColor="#22C55E"
            color="#22C55E"
            px={8}
            py={6}
            borderRadius="full"
            fontWeight="600"
            fontSize="sm"
            letterSpacing="0.05em"
            textTransform="uppercase"
            _hover={{
              bg: 'rgba(34,197,94,0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 30px rgba(34,197,94,0.3)',
            }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.3s ease"
            rightIcon={showAll ? <FiChevronUp /> : <FiChevronDown />}
          >
            {showAll ? 'Show Less' : `View All ${modules.length} Modules`}
          </Button>
        </MotionFlex>
      )}
    </Box>
  );
};

// Root decoration at the bottom of the tree
const RootDecoration = () => (
  <Box position="relative" w="100px" h="60px">
    <Box
      position="absolute"
      left="50%"
      top="0"
      transform="translateX(-50%)"
      w="12px"
      h="30px"
      bg="linear-gradient(180deg, #1C1917 0%, #292524 100%)"
      borderRadius="0 0 6px 6px"
    />
    {/* Left root */}
    <Box
      position="absolute"
      left="20%"
      top="20px"
      w="30px"
      h="6px"
      bg="#292524"
      borderRadius="full"
      transform="rotate(30deg)"
    />
    {/* Right root */}
    <Box
      position="absolute"
      right="20%"
      top="20px"
      w="30px"
      h="6px"
      bg="#292524"
      borderRadius="full"
      transform="rotate(-30deg)"
    />
  </Box>
);

// Module Card Component
const ModuleCard = ({ module, index, isLeft }) => {
  const theme = getYearTheme(module.yearLaunched);
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <MotionBox
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      w="100%"
      py={{ base: 2, md: 8 }}
    >
      <Flex
        direction={{ base: 'row', md: isLeft ? 'row' : 'row-reverse' }}
        align="center"
        justify={{ base: 'flex-start', md: 'center' }}
        gap={{ base: 4, md: 8 }}
      >
        {/* Card */}
        <Box
          flex={{ base: 1, md: '0 0 45%' }}
          ml={{ base: 10, md: 0 }}
        >
          <Box
            bg="rgba(255,255,255,0.03)"
            backdropFilter="blur(20px)"
            borderRadius="24px"
            border="2px solid"
            borderColor={`${theme.primary}40`}
            p={{ base: 5, md: 8 }}
            position="relative"
            overflow="visible"
            _hover={{
              borderColor: theme.primary,
              transform: 'translateY(-4px)',
              boxShadow: `0 20px 40px ${theme.glow}`,
            }}
            transition="all 0.4s ease"
          >
            {/* Leaf decorations on card */}
            <CardLeafDecoration theme={theme} position="topRight" />
            <CardLeafDecoration theme={theme} position="topLeft" />

            {/* Glow effect */}
            <Box
              position="absolute"
              top="-30%"
              right="-30%"
              w="60%"
              h="60%"
              bg={`radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`}
              opacity={0.4}
              pointerEvents="none"
              borderRadius="full"
            />

            {/* Year Badge with leaf accent */}
            <Box
              position="absolute"
              top={6}
              right={6}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Box
                bg={theme.gradient}
                px={4}
                py={2}
                borderRadius="full"
                boxShadow={`0 4px 15px ${theme.glow}`}
              >
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color="white"
                  letterSpacing="0.05em"
                >
                  {module.yearLaunched}
                </Text>
              </Box>
            </Box>

            {/* Content */}
            <VStack align="flex-start" spacing={4} position="relative" pt={2}>
              <HStack spacing={3}>
                <Box
                  p={3}
                  bg={`${theme.primary}15`}
                  borderRadius="16px"
                  border="1px solid"
                  borderColor={`${theme.primary}30`}
                  position="relative"
                >
                  <Icon as={GrCertificate} w={5} h={5} color={theme.primary} />
                  {/* Tiny leaf on icon */}
                  <Box position="absolute" top="-8px" right="-8px">
                    <SmallLeaf color={theme.leaf} darkColor={theme.leafDark} size={16} rotation={45} />
                  </Box>
                </Box>
                <Text
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight="700"
                  color="white"
                  _hover={{ color: theme.primary }}
                  transition="color 0.2s"
                  cursor="pointer"
                >
                  <BasicUsage student={module.name} id={module._id} />
                </Text>
              </HStack>

              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color="whiteAlpha.700"
                lineHeight="1.7"
                noOfLines={3}
              >
                {module.description}
              </Text>

              {/* Contributors Section */}
              <Box
                w="100%"
                pt={4}
                borderTop="1px solid"
                borderColor="whiteAlpha.100"
              >
                <HStack mb={3} spacing={2}>
                  <SmallLeaf color={theme.leaf} darkColor={theme.leafDark} size={14} rotation={0} />
                  <Text
                    fontSize="xs"
                    color={theme.primary}
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing="0.1em"
                  >
                    Top Contributors
                  </Text>
                </HStack>
                <VStack spacing={3} align="stretch">
                  {module.contributors.slice(0, 2).map((contributor, i) => (
                    <ContributorRow
                      key={i}
                      contributor={contributor}
                      theme={theme}
                    />
                  ))}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Box>

        {/* Timeline Node with Leaf - Desktop only */}
        {!isMobile && (
          <Box position="relative" flex="0 0 auto">
            {/* Main node */}
            <Box position="relative">
              <Box
                w="24px"
                h="24px"
                bg={theme.gradient}
                borderRadius="full"
                border="4px solid #0F172A"
                boxShadow={`0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`}
                animation={`${pulseKeyframes} 2s ease-in-out infinite`}
                animationDelay={`${index * 0.2}s`}
              />
              {/* Leaf sprouting from node */}
              <Box
                position="absolute"
                top="-25px"
                left="50%"
                transform="translateX(-50%)"
                animation={`${swayKeyframes} 3s ease-in-out infinite`}
                animationDelay={`${index * 0.3}s`}
              >
                <SmallLeaf color={theme.leaf} darkColor={theme.leafDark} size={22} rotation={0} />
              </Box>
            </Box>
            
            {/* Branch line with leaf */}
            <Box
              position="absolute"
              top="50%"
              left={isLeft ? '100%' : 'auto'}
              right={isLeft ? 'auto' : '100%'}
              transform="translateY(-50%)"
              pl={isLeft ? 2 : 0}
              pr={isLeft ? 0 : 2}
            >
              <LeafBranchConnector theme={theme} isLeft={isLeft} />
            </Box>
          </Box>
        )}

        {/* Mobile Timeline Node with Leaf */}
        {isMobile && (
          <Box
            position="absolute"
            left="20px"
            transform="translateX(-50%)"
          >
            <Box position="relative">
              <Box
                w="16px"
                h="16px"
                bg={theme.gradient}
                borderRadius="full"
                border="3px solid #0F172A"
                boxShadow={`0 0 15px ${theme.glow}`}
              />
              <Box
                position="absolute"
                top="-18px"
                left="50%"
                transform="translateX(-50%)"
                animation={`${swayKeyframes} 3s ease-in-out infinite`}
              >
                <SmallLeaf color={theme.leaf} darkColor={theme.leafDark} size={16} rotation={0} />
              </Box>
            </Box>
          </Box>
        )}

        {/* Spacer for desktop layout */}
        {!isMobile && <Box flex="0 0 45%" />}
      </Flex>
    </MotionBox>
  );
};

// Contributor Row Component
const ContributorRow = ({ contributor, theme }) => (
  <HStack
    justify="space-between"
    p={3}
    borderRadius="16px"
    bg="whiteAlpha.50"
    _hover={{ bg: 'whiteAlpha.100', transform: 'translateX(4px)' }}
    transition="all 0.2s"
  >
    <HStack spacing={3}>
      <Avatar
        name={contributor.name}
        src={contributor.avatar}
        size="sm"
        border="2px solid"
        borderColor={theme.primary}
      />
      <VStack spacing={0} align="start">
        <Text fontSize="sm" fontWeight="600" color="white">
          {contributor.name}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.500">
          {contributor.designation}
        </Text>
      </VStack>
    </HStack>
    <Box
      as="button"
      p={2}
      borderRadius="full"
      bg={`${theme.primary}20`}
      color={theme.primary}
      _hover={{
        bg: theme.primary,
        color: 'white',
        transform: 'scale(1.1)',
      }}
      transition="all 0.2s"
      onClick={() => window.open(contributor.linkedin, '_blank')}
      cursor="pointer"
    >
      <Icon as={AiOutlineLinkedin} w={4} h={4} />
    </Box>
  </HStack>
);

export default GrowthTree;