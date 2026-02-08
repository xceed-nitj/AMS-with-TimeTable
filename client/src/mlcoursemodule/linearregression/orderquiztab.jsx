import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Button, Card, CardHeader, CardBody,
  Alert, AlertIcon, Badge, Heading, Collapse, useDisclosure,
  useColorModeValue, Flex, Divider, SimpleGrid, useToast,
  Progress, Radio, RadioGroup, Stack, Code, Table, Thead, Tbody, Tr, Th, Td,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, RepeatIcon } from '@chakra-ui/icons';

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Matrix notation component
const MatrixNotation = ({ rows, cols, label, color = "purple" }) => (
  <Box 
    display="inline-flex" 
    alignItems="center" 
    bg={`${color}.50`} 
    px={3} 
    py={1} 
    borderRadius="md"
    borderWidth="1px"
    borderColor={`${color}.200`}
  >
    <Text fontWeight="bold" color={`${color}.700`} fontFamily="mono">
      {label}: {rows} × {cols}
    </Text>
  </Box>
);

// Single MCQ Question Component
const MCQQuestion = ({ question, index, onAnswer, isAnswered, isCorrect, selectedAnswer, showSolution }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const correctBg = useColorModeValue('green.50', 'green.900');
  const incorrectBg = useColorModeValue('red.50', 'red.900');
  
  let borderColor = 'gray.200';
  let bg = cardBg;
  
  if (isAnswered) {
    if (isCorrect) {
      borderColor = 'green.500';
      bg = correctBg;
    } else {
      borderColor = 'red.500';
      bg = incorrectBg;
    }
  }

  return (
    <Box
      bg={bg}
      p={4}
      borderRadius="md"
      borderWidth="2px"
      borderColor={borderColor}
      mb={4}
    >
      <HStack mb={3} justify="space-between">
        <HStack>
          <Flex
            align="center"
            justify="center"
            bg={isAnswered ? (isCorrect ? 'green.500' : 'red.500') : 'purple.500'}
            color="white"
            borderRadius="full"
            minW="28px"
            h="28px"
            fontWeight="bold"
            fontSize="sm"
          >
            {index + 1}
          </Flex>
          <Text fontWeight="bold" fontSize="md">{question.title}</Text>
        </HStack>
        {isAnswered && (
          isCorrect ? 
            <Badge colorScheme="green" px={2} py={1}><CheckIcon mr={1} />Correct</Badge> : 
            <Badge colorScheme="red" px={2} py={1}><CloseIcon mr={1} />Incorrect</Badge>
        )}
      </HStack>
      
      <Text mb={3} color="gray.600" fontSize="sm">{question.description}</Text>
      
      {/* Dataset info */}
      <Alert status="info" mb={4} borderRadius="md" size="sm">
        <AlertIcon />
        <Box>
          <Text fontSize="sm" fontWeight="bold">Given Dataset:</Text>
          <Text fontSize="sm">
            <Code colorScheme="blue">m = {question.m}</Code> samples, {' '}
            <Code colorScheme="green">n = {question.n}</Code> features
            {question.extraInfo && <Text as="span"> • {question.extraInfo}</Text>}
          </Text>
        </Box>
      </Alert>

      <RadioGroup 
        onChange={(val) => onAnswer(question.id, val)} 
        value={selectedAnswer || ''}
        isDisabled={isAnswered}
      >
        <Stack spacing={2}>
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option.value;
            const isCorrectOption = option.value === question.correctAnswer;
            let optionBg = 'transparent';
            let optionBorder = 'gray.200';
            
            if (isAnswered) {
              if (isCorrectOption) {
                optionBg = 'green.100';
                optionBorder = 'green.500';
              } else if (isSelected && !isCorrect) {
                optionBg = 'red.100';
                optionBorder = 'red.500';
              }
            }
            
            return (
              <Box
                key={idx}
                p={3}
                bg={optionBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={optionBorder}
                transition="all 0.2s"
                _hover={{ bg: isAnswered ? optionBg : 'gray.50' }}
              >
                <Radio value={option.value} colorScheme="purple">
                  <HStack spacing={3}>
                    <Code fontSize="md" colorScheme={isAnswered && isCorrectOption ? 'green' : 'gray'}>
                      {option.label}
                    </Code>
                    {isAnswered && isCorrectOption && <CheckIcon color="green.500" />}
                  </HStack>
                </Radio>
              </Box>
            );
          })}
        </Stack>
      </RadioGroup>

      {/* Solution explanation */}
      {showSolution && isAnswered && (
        <Box mt={4} p={3} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.300">
          <Text fontWeight="bold" color="yellow.800" mb={2}>💡 Explanation:</Text>
          <Text fontSize="sm" whiteSpace="pre-wrap">{question.explanation}</Text>
        </Box>
      )}
    </Box>
  );
};

// Quiz Problem Set Component
const QuizProblemSet = ({ problemSet, onComplete, isCompleted, progress, onUpdateProgress }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const { isOpen: showSolutions, onToggle: toggleSolutions } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    let correct = 0;
    problemSet.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    setScore(correct);
    setSubmitted(true);
    
    const percentage = (correct / problemSet.questions.length) * 100;
    if (percentage >= 80) {
      onComplete();
      toast({
        title: '🎉 Excellent!',
        description: `You scored ${correct}/${problemSet.questions.length}! Section completed.`,
        status: 'success',
        duration: 4000,
      });
    } else {
      toast({
        title: `Score: ${correct}/${problemSet.questions.length}`,
        description: 'You need 80% or higher to complete this section. Review and try again!',
        status: 'warning',
        duration: 4000,
      });
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = problemSet.questions.length;

  return (
    <Card bg={cardBg} mb={6} shadow="md" borderWidth="2px" borderColor={isCompleted ? 'green.400' : 'transparent'}>
      {isCompleted && (
        <Badge colorScheme="green" position="absolute" top={2} right={2} px={2} py={1}>
          ✓ Completed
        </Badge>
      )}
      <CardHeader pb={2}>
        <HStack>
          <Text fontSize="2xl">{problemSet.icon}</Text>
          <Box>
            <Heading size="md" color="purple.600">{problemSet.title}</Heading>
            <Text fontSize="sm" color="gray.500">{problemSet.description}</Text>
          </Box>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        {/* Progress indicator */}
        <Box mb={4}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600">
              Answered: {answeredCount}/{totalQuestions}
            </Text>
            {submitted && (
              <Text fontWeight="bold" color={score >= totalQuestions * 0.8 ? 'green.500' : 'orange.500'}>
                Score: {score}/{totalQuestions} ({Math.round((score/totalQuestions)*100)}%)
              </Text>
            )}
          </HStack>
          <Progress 
            value={(answeredCount / totalQuestions) * 100} 
            colorScheme={submitted ? (score >= totalQuestions * 0.8 ? 'green' : 'orange') : 'purple'}
            size="sm" 
            borderRadius="full"
          />
        </Box>

        {/* Questions */}
        {problemSet.questions.map((question, idx) => (
          <MCQQuestion
            key={question.id}
            question={question}
            index={idx}
            onAnswer={handleAnswer}
            isAnswered={submitted}
            isCorrect={answers[question.id] === question.correctAnswer}
            selectedAnswer={answers[question.id]}
            showSolution={showSolutions}
          />
        ))}

        {/* Action buttons */}
        <HStack spacing={3} mt={4} flexWrap="wrap">
          <Button 
            colorScheme="green" 
            onClick={handleSubmit} 
            isDisabled={answeredCount < totalQuestions || (submitted && score >= totalQuestions * 0.8)}
          >
            {submitted ? (score >= totalQuestions * 0.8 ? '✓ Passed' : 'Submit Again') : 'Submit Answers'}
          </Button>
          <Button 
            colorScheme="gray" 
            leftIcon={<RepeatIcon />} 
            onClick={handleReset}
            isDisabled={!submitted && answeredCount === 0}
          >
            Reset
          </Button>
          {submitted && (
            <Button colorScheme="yellow" variant="outline" onClick={toggleSolutions}>
              {showSolutions ? 'Hide' : 'Show'} Explanations
            </Button>
          )}
        </HStack>

        {submitted && score < totalQuestions * 0.8 && (
          <Alert status="info" mt={4} borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              You need <strong>80% or higher</strong> to complete this section. 
              Review the explanations and try again!
            </Text>
          </Alert>
        )}
      </CardBody>
    </Card>
  );
};

// Theory/Reference Card
const MatrixTheoryCard = () => {
  const cardBg = useColorModeValue('white', 'green.800');
  
  return (
    <Accordion allowMultiple mb={6}>
      <AccordionItem>
        <AccordionButton bg={'purple.500'} _hover={'green.500'} _expanded={{ bg: 'blue.500' }}>
          <Box flex="1" textAlign="left" fontWeight="bold">
            📐 Matrix Dimensions Reference for Multiple Linear Regression
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel pb={4} bg={cardBg}>
          <Text mb={4} fontSize="sm" color="gray.600">
            For a dataset with <Code colorScheme="blue">m</Code> samples and <Code colorScheme="green">n</Code> features:
          </Text>
          
          <Table size="sm" variant="simple" mb={4}>
            <Thead bg="purple.50">
              <Tr>
                <Th>Matrix/Vector</Th>
                <Th>Symbol</Th>
                <Th>Dimensions</Th>
                <Th>Description</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td fontWeight="bold">Feature Matrix</Td>
                <Td><Code>X</Code></Td>
                <Td><Code colorScheme="purple">m × (n+1)</Code></Td>
                <Td fontSize="xs">Includes bias column of 1s</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Output Vector</Td>
                <Td><Code>y</Code></Td>
                <Td><Code colorScheme="blue">m × 1</Code></Td>
                <Td fontSize="xs">Target values</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Parameters</Td>
                <Td><Code>θ</Code></Td>
                <Td><Code colorScheme="green">(n+1) × 1</Code></Td>
                <Td fontSize="xs">Weights including bias θ₀</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Hypothesis</Td>
                <Td><Code>h(X) = Xθ</Code></Td>
                <Td><Code colorScheme="teal">m × 1</Code></Td>
                <Td fontSize="xs">Predictions for all samples</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Cost Function</Td>
                <Td><Code>J(θ)</Code></Td>
                <Td><Code colorScheme="orange">1 × 1 (scalar)</Code></Td>
                <Td fontSize="xs">Single error value</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">Gradient</Td>
                <Td><Code>∂J/∂θ</Code></Td>
                <Td><Code colorScheme="red">(n+1) × 1</Code></Td>
                <Td fontSize="xs">Same shape as θ</Td>
              </Tr>
            </Tbody>
          </Table>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontWeight="bold" color="blue.700" mb={2}>🔢 Key Formulas (Matrix Form)</Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text><Code>h(X) = X · θ</Code></Text>
                <Text><Code>J(θ) = (1/2m) · (Xθ - y)ᵀ · (Xθ - y)</Code></Text>
                <Text><Code>∇J = (1/m) · Xᵀ · (Xθ - y)</Code></Text>
                <Text><Code>θ := θ - α · ∇J</Code></Text>
              </VStack>
            </Box>
            <Box p={3} bg="green.50" borderRadius="md">
              <Text fontWeight="bold" color="green.700" mb={2}>⚠️ Common Pitfalls</Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text>• Don't forget the bias column (+1 to n)</Text>
                <Text>• X is m×(n+1), NOT m×n</Text>
                <Text>• θ has (n+1) parameters, not n</Text>
                <Text>• Gradient has same shape as θ</Text>
              </VStack>
            </Box>
          </SimpleGrid>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

// Generate random MCQ questions
const generateQuestions = () => {
  const problemSets = [];

  // Problem Set 1: Basic Matrix Dimensions
  const m1 = randInt(50, 200);
  const n1 = randInt(3, 8);
  
  problemSets.push({
    id: 'basic_dimensions',
    title: 'Basic Matrix Dimensions',
    icon: '📊',
    description: 'Identify the correct dimensions for each matrix/vector in multiple linear regression.',
    questions: [
      {
        id: 'q1_feature',
        title: 'Feature Matrix X',
        description: 'What are the dimensions of the feature matrix X (with bias column)?',
        m: m1,
        n: n1,
        extraInfo: 'X includes a column of 1s for the bias term',
        options: [
          { value: 'a', label: `${m1} × ${n1}` },
          { value: 'b', label: `${m1} × ${n1 + 1}` },
          { value: 'c', label: `${n1 + 1} × ${m1}` },
          { value: 'd', label: `${n1} × ${m1}` },
        ],
        correctAnswer: 'b',
        explanation: `The feature matrix X has m=${m1} rows (one per sample) and n+1=${n1+1} columns (n=${n1} features + 1 bias column of 1s).\n\nSo X is ${m1} × ${n1+1}.`
      },
      {
        id: 'q1_output',
        title: 'Output Vector y',
        description: 'What are the dimensions of the target/output vector y?',
        m: m1,
        n: n1,
        options: [
          { value: 'a', label: `${m1} × 1` },
          { value: 'b', label: `1 × ${m1}` },
          { value: 'c', label: `${m1} × ${n1}` },
          { value: 'd', label: `${n1 + 1} × 1` },
        ],
        correctAnswer: 'a',
        explanation: `The output vector y contains one target value for each sample.\n\nWith m=${m1} samples, y is a column vector of size ${m1} × 1.`
      },
      {
        id: 'q1_theta',
        title: 'Parameter Vector θ',
        description: 'What are the dimensions of the parameter vector θ?',
        m: m1,
        n: n1,
        extraInfo: 'θ includes the bias parameter θ₀',
        options: [
          { value: 'a', label: `${n1} × 1` },
          { value: 'b', label: `${m1} × 1` },
          { value: 'c', label: `${n1 + 1} × 1` },
          { value: 'd', label: `1 × ${n1 + 1}` },
        ],
        correctAnswer: 'c',
        explanation: `The parameter vector θ has one weight for each feature plus the bias term θ₀.\n\nWith n=${n1} features + 1 bias, θ is ${n1+1} × 1.`
      },
      {
        id: 'q1_hypothesis',
        title: 'Hypothesis h(X) = Xθ',
        description: 'What are the dimensions of the hypothesis (predictions) vector?',
        m: m1,
        n: n1,
        options: [
          { value: 'a', label: `${n1 + 1} × 1` },
          { value: 'b', label: `${m1} × ${n1 + 1}` },
          { value: 'c', label: `${m1} × 1` },
          { value: 'd', label: `1 × ${m1}` },
        ],
        correctAnswer: 'c',
        explanation: `h(X) = Xθ where X is ${m1}×${n1+1} and θ is ${n1+1}×1.\n\nMatrix multiplication: (${m1}×${n1+1}) · (${n1+1}×1) = ${m1}×1\n\nWe get one prediction per sample.`
      },
    ]
  });

  // Problem Set 2: Advanced Operations
  const m2 = randInt(100, 500);
  const n2 = randInt(5, 12);

  problemSets.push({
    id: 'advanced_operations',
    title: 'Gradient & Cost Dimensions',
    icon: '⚡',
    description: 'Understand the dimensions of gradient descent operations.',
    questions: [
      {
        id: 'q2_cost',
        title: 'Cost Function J(θ)',
        description: 'What are the dimensions of the cost function output J(θ)?',
        m: m2,
        n: n2,
        extraInfo: 'J(θ) = (1/2m) Σ(h(x) - y)²',
        options: [
          { value: 'a', label: `${m2} × 1` },
          { value: 'b', label: `${n2 + 1} × 1` },
          { value: 'c', label: `${m2} × ${m2}` },
          { value: 'd', label: `1 × 1 (scalar)` },
        ],
        correctAnswer: 'd',
        explanation: `The cost function J(θ) computes a single number representing the average squared error across all samples.\n\nIt's a scalar value (1×1), not a matrix or vector.`
      },
      {
        id: 'q2_gradient',
        title: 'Gradient ∂J/∂θ',
        description: 'What are the dimensions of the gradient vector?',
        m: m2,
        n: n2,
        extraInfo: '∇J = (1/m) · Xᵀ · (Xθ - y)',
        options: [
          { value: 'a', label: `${m2} × 1` },
          { value: 'b', label: `${n2 + 1} × 1` },
          { value: 'c', label: `${n2} × 1` },
          { value: 'd', label: `${m2} × ${n2 + 1}` },
        ],
        correctAnswer: 'b',
        explanation: `The gradient has the same dimensions as θ (one partial derivative per parameter).\n\nXᵀ is (${n2+1}×${m2}), (Xθ-y) is (${m2}×1)\n\nSo ∇J = (${n2+1}×${m2}) · (${m2}×1) = ${n2+1}×1`
      },
      {
        id: 'q2_xtranspose',
        title: 'Transpose Xᵀ',
        description: 'What are the dimensions of Xᵀ (X transpose)?',
        m: m2,
        n: n2,
        options: [
          { value: 'a', label: `${m2} × ${n2 + 1}` },
          { value: 'b', label: `${n2 + 1} × ${m2}` },
          { value: 'c', label: `${n2} × ${m2}` },
          { value: 'd', label: `${m2} × ${n2}` },
        ],
        correctAnswer: 'b',
        explanation: `X is ${m2}×${n2+1}, so Xᵀ swaps rows and columns.\n\nXᵀ is ${n2+1}×${m2}.`
      },
      {
        id: 'q2_error',
        title: 'Error Vector (Xθ - y)',
        description: 'What are the dimensions of the error vector (Xθ - y)?',
        m: m2,
        n: n2,
        options: [
          { value: 'a', label: `${n2 + 1} × 1` },
          { value: 'b', label: `${m2} × ${n2 + 1}` },
          { value: 'c', label: `${m2} × 1` },
          { value: 'd', label: `1 × ${m2}` },
        ],
        correctAnswer: 'c',
        explanation: `Xθ is ${m2}×1 and y is ${m2}×1.\n\nSubtracting them: (Xθ - y) is ${m2}×1.\n\nOne error value per sample.`
      },
    ]
  });

  // Problem Set 3: Matrix Multiplication Validity
  const m3 = randInt(80, 300);
  const n3 = randInt(4, 10);

  problemSets.push({
    id: 'multiplication_validity',
    title: 'Matrix Multiplication Validity',
    icon: '✖️',
    description: 'Determine which matrix multiplications are valid.',
    questions: [
      {
        id: 'q3_valid1',
        title: 'Is X · θ valid?',
        description: `Can we compute X · θ? If yes, what's the result dimension?`,
        m: m3,
        n: n3,
        extraInfo: `X is ${m3}×${n3+1}, θ is ${n3+1}×1`,
        options: [
          { value: 'a', label: `Yes, result is ${m3} × 1` },
          { value: 'b', label: `Yes, result is ${n3 + 1} × 1` },
          { value: 'c', label: `No, dimensions don't match` },
          { value: 'd', label: `Yes, result is ${m3} × ${n3 + 1}` },
        ],
        correctAnswer: 'a',
        explanation: `For matrix multiplication A·B, columns of A must equal rows of B.\n\nX is ${m3}×${n3+1}, θ is ${n3+1}×1.\n\nColumns of X (${n3+1}) = Rows of θ (${n3+1}) ✓\n\nResult: ${m3}×1`
      },
      {
        id: 'q3_valid2',
        title: 'Is θ · X valid?',
        description: `Can we compute θ · X (θ times X)?`,
        m: m3,
        n: n3,
        extraInfo: `θ is ${n3+1}×1, X is ${m3}×${n3+1}`,
        options: [
          { value: 'a', label: `Yes, result is ${n3 + 1} × ${n3 + 1}` },
          { value: 'b', label: `Yes, result is ${m3} × 1` },
          { value: 'c', label: `No, dimensions don't match` },
          { value: 'd', label: `Yes, result is 1 × ${m3}` },
        ],
        correctAnswer: 'c',
        explanation: `For θ·X: θ is ${n3+1}×1, X is ${m3}×${n3+1}.\n\nColumns of θ (1) ≠ Rows of X (${m3}) ✗\n\nThis multiplication is NOT valid!`
      },
      {
        id: 'q3_valid3',
        title: 'Is Xᵀ · (Xθ - y) valid?',
        description: `Can we compute Xᵀ · (Xθ - y)? What's the result?`,
        m: m3,
        n: n3,
        extraInfo: `Xᵀ is ${n3+1}×${m3}, (Xθ-y) is ${m3}×1`,
        options: [
          { value: 'a', label: `No, dimensions don't match` },
          { value: 'b', label: `Yes, result is ${m3} × 1` },
          { value: 'c', label: `Yes, result is ${n3 + 1} × 1` },
          { value: 'd', label: `Yes, result is ${n3 + 1} × ${m3}` },
        ],
        correctAnswer: 'c',
        explanation: `Xᵀ is ${n3+1}×${m3}, (Xθ-y) is ${m3}×1.\n\nColumns of Xᵀ (${m3}) = Rows of (Xθ-y) (${m3}) ✓\n\nResult: ${n3+1}×1\n\nThis is exactly the gradient dimension!`
      },
      {
        id: 'q3_valid4',
        title: 'Is (Xθ - y)ᵀ · (Xθ - y) valid?',
        description: `Can we compute (Xθ - y)ᵀ · (Xθ - y)? What's the result?`,
        m: m3,
        n: n3,
        extraInfo: `(Xθ-y) is ${m3}×1, so (Xθ-y)ᵀ is 1×${m3}`,
        options: [
          { value: 'a', label: `Yes, result is ${m3} × ${m3}` },
          { value: 'b', label: `Yes, result is 1 × 1 (scalar)` },
          { value: 'c', label: `No, dimensions don't match` },
          { value: 'd', label: `Yes, result is ${m3} × 1` },
        ],
        correctAnswer: 'b',
        explanation: `(Xθ-y)ᵀ is 1×${m3}, (Xθ-y) is ${m3}×1.\n\nColumns (${m3}) = Rows (${m3}) ✓\n\nResult: 1×1 (a scalar!)\n\nThis is the sum of squared errors used in cost function.`
      },
    ]
  });

  // Problem Set 4: Real-world Scenarios
  const scenarios = [
    { name: 'House Prices', m: randInt(1000, 5000), n: randInt(8, 15), desc: 'bedrooms, bathrooms, sqft, etc.' },
    { name: 'Stock Prediction', m: randInt(500, 2000), n: randInt(20, 30), desc: 'technical indicators' },
    { name: 'Medical Diagnosis', m: randInt(200, 800), n: randInt(50, 100), desc: 'patient features' },
  ];
  const s = scenarios[randInt(0, 2)];

  problemSets.push({
    id: 'real_world',
    title: 'Real-World Scenario',
    icon: '🏠',
    description: `Apply your knowledge to a ${s.name} prediction problem.`,
    questions: [
      {
        id: 'q4_scenario_x',
        title: `${s.name}: Feature Matrix`,
        description: `You're building a ${s.name.toLowerCase()} model. What size is your feature matrix X?`,
        m: s.m,
        n: s.n,
        extraInfo: `Features: ${s.desc}`,
        options: [
          { value: 'a', label: `${s.m} × ${s.n}` },
          { value: 'b', label: `${s.m} × ${s.n + 1}` },
          { value: 'c', label: `${s.n} × ${s.m}` },
          { value: 'd', label: `${s.n + 1} × ${s.m}` },
        ],
        correctAnswer: 'b',
        explanation: `With ${s.m} samples and ${s.n} features, plus the bias column:\n\nX is ${s.m} × ${s.n+1}`
      },
      {
        id: 'q4_scenario_params',
        title: `${s.name}: Number of Parameters`,
        description: `How many parameters (weights) need to be learned?`,
        m: s.m,
        n: s.n,
        options: [
          { value: 'a', label: `${s.n}` },
          { value: 'b', label: `${s.n + 1}` },
          { value: 'c', label: `${s.m}` },
          { value: 'd', label: `${s.m * s.n}` },
        ],
        correctAnswer: 'b',
        explanation: `We need one weight for each feature plus one bias term.\n\n${s.n} features + 1 bias = ${s.n+1} parameters`
      },
      {
        id: 'q4_scenario_predictions',
        title: `${s.name}: Batch Predictions`,
        description: `If you predict for all ${s.m} samples at once, what's the output shape?`,
        m: s.m,
        n: s.n,
        options: [
          { value: 'a', label: `${s.m} × ${s.n}` },
          { value: 'b', label: `${s.n + 1} × 1` },
          { value: 'c', label: `${s.m} × 1` },
          { value: 'd', label: `1 × ${s.m}` },
        ],
        correctAnswer: 'c',
        explanation: `Predictions h(X) = Xθ gives one value per sample.\n\n${s.m} samples → ${s.m}×1 output vector`
      },
      {
        id: 'q4_scenario_gradient',
        title: `${s.name}: Gradient Vector Size`,
        description: `During training, what's the size of each gradient update?`,
        m: s.m,
        n: s.n,
        extraInfo: 'The gradient tells us how to update each parameter',
        options: [
          { value: 'a', label: `${s.m} × 1` },
          { value: 'b', label: `${s.n} × 1` },
          { value: 'c', label: `${s.n + 1} × 1` },
          { value: 'd', label: `1 × 1` },
        ],
        correctAnswer: 'c',
        explanation: `The gradient has one value per parameter (same shape as θ).\n\n${s.n+1} parameters → gradient is ${s.n+1}×1`
      },
    ]
  });

  return problemSets;
};

// Main Component
const MatrixQuizTab = ({ progress, onCorrect }) => {
  const [problemSets, setProblemSets] = useState(() => generateQuestions());
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const handleComplete = useCallback((setId) => {
    onCorrect(`matrix_${setId}`);
  }, [onCorrect]);

  const regenerateQuestions = () => {
    setProblemSets(generateQuestions());
    toast({
      title: 'Questions Regenerated!',
      description: 'New random values have been generated.',
      status: 'info',
      duration: 2000,
    });
  };

  const completedCount = problemSets.filter(ps => progress[`matrix_${ps.id}`]).length;
  const totalSets = problemSets.length;

  return (
    <Box>
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box flex="1">
          <Text fontWeight="bold">📐 Multiple Linear Regression: Matrix Dimensions Quiz</Text>
          <Text fontSize="sm">
            Test your understanding of matrix dimensions in vectorized linear regression.
            Score 80% or higher on each section to complete it.
          </Text>
        </Box>
        <Button 
          leftIcon={<RepeatIcon />} 
          colorScheme="purple" 
          size="sm" 
          onClick={regenerateQuestions}
          ml={4}
        >
          New Values
        </Button>
      </Alert>

      {/* Overall Progress */}
      {/* <Card bg={cardBg} mb={6} shadow="md">
        <CardBody>
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="bold">Quiz Progress</Text>
            <Badge 
              colorScheme={completedCount === totalSets ? 'green' : 'purple'} 
              fontSize="md" 
              px={3} 
              py={1}
            >
              {completedCount}/{totalSets} Sections Passed
            </Badge>
          </HStack>
          <Progress
            value={(completedCount / totalSets) * 100}
            colorScheme={completedCount === totalSets ? 'green' : 'purple'}
            size="lg"
            borderRadius="full"
            hasStripe
            isAnimated
          />
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mt={4}>
            {problemSets.map((ps) => (
              <HStack
                key={ps.id}
                p={2}
                bg={progress[`matrix_${ps.id}`] ? 'green.50' : 'gray.50'}
                borderRadius="md"
                borderWidth="1px"
                borderColor={progress[`matrix_${ps.id}`] ? 'green.300' : 'gray.200'}
              >
                <Text>{ps.icon}</Text>
                <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                  {ps.title.split(':')[0]}
                </Text>
                {progress[`matrix_${ps.id}`] && <CheckIcon color="green.500" boxSize={3} />}
              </HStack>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card> */}

      {/* Theory Reference */}
      <MatrixTheoryCard />

      {/* Quiz Sections */}
      {problemSets.map((ps) => (
        <QuizProblemSet
          key={ps.id}
          problemSet={ps}
          onComplete={() => handleComplete(ps.id)}
          isCompleted={progress[`matrix_${ps.id}`]}
          progress={progress}
          onUpdateProgress={onCorrect}
        />
      ))}

      {/* Completion Message */}
      {completedCount === totalSets && (
        <Alert status="success" borderRadius="md" mt={4}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">🎉 Matrix Master!</Text>
            <Text fontSize="sm">
              You've mastered matrix dimensions in multiple linear regression!
              You understand how X, y, θ, h(X), J(θ), and ∇J all fit together.
            </Text>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default MatrixQuizTab;
