import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Button, Card, CardHeader, CardBody,
  Alert, AlertIcon, Badge, Heading, Collapse, useDisclosure,
  useColorModeValue, Flex, SimpleGrid, useToast,
  Progress, Radio, RadioGroup, Stack, Code, 
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, RepeatIcon } from '@chakra-ui/icons';

// Code Block Component
const CodeBlock = ({ children, highlight = false }) => {
  const bg = useColorModeValue(highlight ? 'yellow.100' : 'gray.900', highlight ? 'yellow.800' : 'gray.900');
  const color = useColorModeValue(highlight ? 'yellow.900' : 'green.300', highlight ? 'yellow.100' : 'green.300');
  
  return (
    <Box
      as="pre"
      bg={bg}
      color={color}
      p={3}
      borderRadius="md"
      fontSize="sm"
      fontFamily="'Fira Code', 'Consolas', monospace"
      overflowX="auto"
      whiteSpace="pre-wrap"
      my={2}
    >
      <code>{children}</code>
    </Box>
  );
};

// MCQ Question Component for Code
const CodeMCQQuestion = ({ question, index, onAnswer, isAnswered, isCorrect, selectedAnswer, showSolution }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const correctBg = useColorModeValue('green.50', 'green.900');
  const incorrectBg = useColorModeValue('red.50', 'red.900');
  
  let borderColor = 'gray.200';
  let bg = cardBg;
  
  if (isAnswered) {
    bg = isCorrect ? correctBg : incorrectBg;
    borderColor = isCorrect ? 'green.500' : 'red.500';
  }

  return (
    <Box bg={bg} p={4} borderRadius="md" borderWidth="2px" borderColor={borderColor} mb={4}>
      <HStack mb={3} justify="space-between">
        <HStack>
          <Flex
            align="center"
            justify="center"
            bg={isAnswered ? (isCorrect ? 'green.500' : 'red.500') : 'blue.500'}
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
      
      {question.codeSnippet && (
        <CodeBlock highlight={question.highlightCode}>
          {question.codeSnippet}
        </CodeBlock>
      )}

      {question.context && (
        <Alert status="info" mb={4} borderRadius="md" size="sm">
          <AlertIcon />
          <Text fontSize="sm">{question.context}</Text>
        </Alert>
      )}

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
                <Radio value={option.value} colorScheme="blue">
                  {option.isCode ? (
                    <Code fontSize="sm" colorScheme={isAnswered && isCorrectOption ? 'green' : 'gray'} p={1}>
                      {option.label}
                    </Code>
                  ) : (
                    <Text fontSize="sm" color={isAnswered && isCorrectOption ? 'green.700' : 'inherit'}>
                      {option.label}
                    </Text>
                  )}
                  {isAnswered && isCorrectOption && <CheckIcon color="green.500" ml={2} />}
                </Radio>
              </Box>
            );
          })}
        </Stack>
      </RadioGroup>

      {showSolution && isAnswered && (
        <Box mt={4} p={3} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.300">
          <Text fontWeight="bold" color="yellow.800" mb={2}>💡 Explanation:</Text>
          <Text fontSize="sm" whiteSpace="pre-wrap" mb={2}>{question.explanation}</Text>
          {question.correctCode && (
            <Box>
              <Text fontWeight="bold" color="green.700" fontSize="sm" mb={1}>✅ Correct Code:</Text>
              <CodeBlock>{question.correctCode}</CodeBlock>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// Quiz Section Component
const QuizSection = ({ section, onComplete, isCompleted }) => {
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
    section.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    
    if ((correct / section.questions.length) >= 0.8) {
      onComplete();
      toast({ title: '🎉 Section Completed!', status: 'success', duration: 3000 });
    } else {
      toast({ title: `${correct}/${section.questions.length} correct. Need 80% to pass.`, status: 'warning', duration: 3000 });
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = section.questions.length;

  return (
    <Card bg={cardBg} mb={6} shadow="md" borderWidth="2px" borderColor={isCompleted ? 'green.400' : 'transparent'}>
      {isCompleted && <Badge colorScheme="green" position="absolute" top={2} right={2} px={2} py={1}>✓ Completed</Badge>}
      <CardHeader pb={2}>
        <HStack>
          <Text fontSize="2xl">{section.icon}</Text>
          <Box>
            <Heading size="md" color="blue.600">{section.title}</Heading>
            <Text fontSize="sm" color="gray.500">{section.description}</Text>
          </Box>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        <Box mb={4}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600">Answered: {answeredCount}/{totalQuestions}</Text>
            {submitted && (
              <Text fontWeight="bold" color={score >= totalQuestions * 0.8 ? 'green.500' : 'orange.500'}>
                Score: {score}/{totalQuestions} ({Math.round((score/totalQuestions)*100)}%)
              </Text>
            )}
          </HStack>
          <Progress 
            value={(answeredCount / totalQuestions) * 100} 
            colorScheme={submitted ? (score >= totalQuestions * 0.8 ? 'green' : 'orange') : 'blue'}
            size="sm" 
            borderRadius="full"
          />
        </Box>

        {section.questions.map((question, idx) => (
          <CodeMCQQuestion
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

        <HStack spacing={3} mt={4} flexWrap="wrap">
          <Button 
            colorScheme="green" 
            onClick={handleSubmit} 
            isDisabled={answeredCount < totalQuestions || (submitted && score >= totalQuestions * 0.8)}
          >
            {submitted ? (score >= totalQuestions * 0.8 ? '✓ Passed' : 'Try Again') : 'Submit'}
          </Button>
          <Button colorScheme="gray" leftIcon={<RepeatIcon />} onClick={handleReset}>Reset</Button>
          {submitted && (
            <Button colorScheme="yellow" variant="outline" onClick={toggleSolutions}>
              {showSolutions ? 'Hide' : 'Show'} Solutions
            </Button>
          )}
        </HStack>
      </CardBody>
    </Card>
  );
};

// Python Reference Card
const PythonReferenceCard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  return (
    <Accordion allowMultiple mb={6}>
      <AccordionItem>
        <AccordionButton bg={'purple.500'} _hover={{ bg: 'purple.600' }} _expanded={{ bg: 'blue.500' }}>
          <Box flex="1" textAlign="left" fontWeight="bold">📚 Python/NumPy Reference for Linear Regression</Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel pb={4} bg={cardBg}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontWeight="bold" color="blue.700" mb={2}>📊 Data Setup</Text>
              <CodeBlock>{`import numpy as np

# m samples, n features
X = np.array([[1, x1, x2],  # Add 1s for bias
              [1, x1, x2],
              ...])  # Shape: (m, n+1)

y = np.array([[y1],
              [y2],
              ...])  # Shape: (m, 1)

theta = np.zeros((n+1, 1))  # Shape: (n+1, 1)`}</CodeBlock>
            </Box>
            <Box p={3} bg="green.50" borderRadius="md">
              <Text fontWeight="bold" color="green.700" mb={2}>🎯 Key Operations</Text>
              <CodeBlock>{`# Hypothesis (predictions)
h = X @ theta  # or X.dot(theta)
# Shape: (m, 1)

# Cost Function
J = (1/(2*m)) * np.sum((h - y)**2)
# or: J = (1/(2*m)) * (h-y).T @ (h-y)

# Gradient
grad = (1/m) * X.T @ (h - y)
# Shape: (n+1, 1)

# Update
theta = theta - alpha * grad`}</CodeBlock>
            </Box>
            <Box p={3} bg="purple.50" borderRadius="md">
              <Text fontWeight="bold" color="purple.700" mb={2}>🔄 Full Gradient Descent</Text>
              <CodeBlock>{`def gradient_descent(X, y, theta, alpha, iters):
    m = len(y)
    costs = []
    
    for i in range(iters):
        h = X @ theta
        error = h - y
        grad = (1/m) * X.T @ error
        theta = theta - alpha * grad
        
        cost = (1/(2*m)) * np.sum(error**2)
        costs.append(cost)
    
    return theta, costs`}</CodeBlock>
            </Box>
            <Box p={3} bg="orange.50" borderRadius="md">
              <Text fontWeight="bold" color="orange.700" mb={2}>⚠️ Common Mistakes</Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text>• Forgetting to add bias column to X</Text>
                <Text>• Wrong matrix dimensions in @ operator</Text>
                <Text>• Using * instead of @ for matrix multiply</Text>
                <Text>• Forgetting to divide by m in cost/gradient</Text>
                <Text>• Not initializing theta correctly</Text>
              </VStack>
            </Box>
          </SimpleGrid>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

// Generate quiz sections
const generateSections = () => {
  return [
    // Section 1: NumPy Basics & Setup
    {
      id: 'numpy_basics',
      title: 'NumPy Basics & Data Setup',
      icon: '📊',
      description: 'Setting up data structures for linear regression',
      questions: [
        {
          id: 'np1',
          title: 'Adding Bias Column',
          description: 'How do you add a column of 1s (bias term) to your feature matrix X?',
          codeSnippet: `X = np.array([[2, 3], [4, 5], [6, 7]])  # Shape: (3, 2)
# Add bias column to get shape (3, 3)
X_bias = ???`,
          options: [
            { value: 'a', label: 'np.c_[np.ones((3, 1)), X]', isCode: true },
            { value: 'b', label: 'np.append(X, np.ones((3, 1)))', isCode: true },
            { value: 'c', label: 'X + np.ones((3, 1))', isCode: true },
            { value: 'd', label: 'np.hstack([X, 1])', isCode: true },
          ],
          correctAnswer: 'a',
          explanation: 'np.c_ concatenates column-wise. We create a column of ones with np.ones((3, 1)) and prepend it to X.',
          correctCode: `X_bias = np.c_[np.ones((3, 1)), X]
# Result: [[1, 2, 3], [1, 4, 5], [1, 6, 7]]`
        },
        {
          id: 'np2',
          title: 'Initialize Parameters',
          description: 'For a dataset with 4 features (plus bias), how do you initialize theta?',
          context: 'theta should be a column vector of zeros',
          options: [
            { value: 'a', label: 'theta = np.zeros(4)', isCode: true },
            { value: 'b', label: 'theta = np.zeros((5, 1))', isCode: true },
            { value: 'c', label: 'theta = np.zeros((4, 1))', isCode: true },
            { value: 'd', label: 'theta = [0, 0, 0, 0, 0]', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: 'With 4 features + 1 bias = 5 parameters. We need shape (5, 1) for proper matrix multiplication.',
          correctCode: `theta = np.zeros((5, 1))  # Shape: (5, 1)`
        },
        {
          id: 'np3',
          title: 'Matrix Multiplication',
          description: 'Which operator performs matrix multiplication in NumPy?',
          codeSnippet: `A = np.array([[1, 2], [3, 4]])  # (2, 2)
B = np.array([[5], [6]])          # (2, 1)
result = ???  # Should be (2, 1)`,
          options: [
            { value: 'a', label: 'A * B', isCode: true },
            { value: 'b', label: 'A @ B', isCode: true },
            { value: 'c', label: 'A + B', isCode: true },
            { value: 'd', label: 'np.multiply(A, B)', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: '@ is the matrix multiplication operator. * performs element-wise multiplication (broadcasting).',
          correctCode: `result = A @ B  # or A.dot(B)
# [[1*5 + 2*6], [3*5 + 4*6]] = [[17], [39]]`
        },
        {
          id: 'np4',
          title: 'Transpose',
          description: 'How do you transpose matrix X in NumPy?',
          options: [
            { value: 'a', label: 'X.transpose()', isCode: true },
            { value: 'b', label: 'X.T', isCode: true },
            { value: 'c', label: 'np.transpose(X)', isCode: true },
            { value: 'd', label: 'All of the above', isCode: false },
          ],
          correctAnswer: 'd',
          explanation: 'All three methods work! X.T is the most concise and commonly used.',
          correctCode: `X.T  # Most common
X.transpose()  # Method call
np.transpose(X)  # Function call`
        },
      ]
    },
    
    // Section 2: Hypothesis Computation
    {
      id: 'hypothesis',
      title: 'Computing Hypothesis (Predictions)',
      icon: '🎯',
      description: 'Implementing h(X) = Xθ in Python',
      questions: [
        {
          id: 'h1',
          title: 'Vectorized Hypothesis',
          description: 'Complete the code to compute predictions for all samples:',
          codeSnippet: `# X shape: (m, n+1), theta shape: (n+1, 1)
def hypothesis(X, theta):
    return ???`,
          options: [
            { value: 'a', label: 'X * theta', isCode: true },
            { value: 'b', label: 'X @ theta', isCode: true },
            { value: 'c', label: 'theta @ X', isCode: true },
            { value: 'd', label: 'np.sum(X * theta)', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: 'X @ theta performs matrix multiplication: (m, n+1) @ (n+1, 1) = (m, 1)',
          correctCode: `def hypothesis(X, theta):
    return X @ theta  # Shape: (m, 1)`
        },
        {
          id: 'h2',
          title: 'Single Sample Prediction',
          description: 'Given trained theta, predict for a single sample:',
          codeSnippet: `theta = np.array([[2], [3], [4]])  # bias=2, w1=3, w2=4
x_new = np.array([1, 5, 2])  # [bias, x1, x2]
prediction = ???`,
          options: [
            { value: 'a', label: 'x_new @ theta', isCode: true },
            { value: 'b', label: 'theta @ x_new', isCode: true },
            { value: 'c', label: 'np.sum(x_new * theta)', isCode: true },
            { value: 'd', label: 'x_new.dot(theta)', isCode: true },
          ],
          correctAnswer: 'd',
          explanation: 'For 1D array @ 2D array, use .dot() or reshape x_new to (1, 3) first.',
          correctCode: `prediction = x_new.dot(theta)  # or x_new @ theta
# = 1*2 + 5*3 + 2*4 = 2 + 15 + 8 = 25`
        },
        {
          id: 'h3',
          title: 'Hypothesis Output Shape',
          description: 'What is the output shape of h = X @ theta?',
          context: 'X has 100 samples and 5 features (plus bias)',
          options: [
            { value: 'a', label: '(100, 6)', isCode: false },
            { value: 'b', label: '(6, 1)', isCode: false },
            { value: 'c', label: '(100, 1)', isCode: false },
            { value: 'd', label: '(100,)', isCode: false },
          ],
          correctAnswer: 'c',
          explanation: 'X is (100, 6), theta is (6, 1). Result: (100, 6) @ (6, 1) = (100, 1)',
        },
        {
          id: 'h4',
          title: 'Error Computation',
          description: 'How do you compute the error vector (predictions - actual)?',
          codeSnippet: `h = X @ theta  # predictions, shape (m, 1)
y = ...        # actual values, shape (m, 1)
error = ???`,
          options: [
            { value: 'a', label: 'h - y', isCode: true },
            { value: 'b', label: 'np.subtract(h, y)', isCode: true },
            { value: 'c', label: 'h + (-y)', isCode: true },
            { value: 'd', label: 'All of the above', isCode: false },
          ],
          correctAnswer: 'd',
          explanation: 'All methods produce the same result. h - y is most readable.',
          correctCode: `error = h - y  # Shape: (m, 1)`
        },
      ]
    },
    
    // Section 3: Cost Function
    {
      id: 'cost_function',
      title: 'Cost Function Implementation',
      icon: '📉',
      description: 'Implementing J(θ) = (1/2m) Σ(h(x) - y)²',
      questions: [
        {
          id: 'c1',
          title: 'MSE Cost Function',
          description: 'Complete the cost function implementation:',
          codeSnippet: `def compute_cost(X, y, theta):
    m = len(y)
    h = X @ theta
    error = h - y
    J = ???
    return J`,
          options: [
            { value: 'a', label: '(1/m) * np.sum(error)', isCode: true },
            { value: 'b', label: '(1/(2*m)) * np.sum(error**2)', isCode: true },
            { value: 'c', label: 'np.mean(error**2)', isCode: true },
            { value: 'd', label: '(1/m) * np.sum(error**2)', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: 'MSE cost with 1/2 factor: J = (1/2m) × Σ(error²). The 1/2 simplifies gradient.',
          correctCode: `J = (1/(2*m)) * np.sum(error**2)
# Alternative: J = (1/(2*m)) * (error.T @ error)[0,0]`
        },
        {
          id: 'c2',
          title: 'Vectorized Cost',
          description: 'Which is a valid vectorized form of the cost function?',
          options: [
            { value: 'a', label: '(1/(2*m)) * error.T @ error', isCode: true },
            { value: 'b', label: '(1/(2*m)) * np.dot(error.T, error)', isCode: true },
            { value: 'c', label: '(1/(2*m)) * np.sum(np.square(error))', isCode: true },
            { value: 'd', label: 'All of the above', isCode: false },
          ],
          correctAnswer: 'd',
          explanation: 'All compute the sum of squared errors. error.T @ error gives a scalar (1×1 matrix).',
          correctCode: `# All equivalent:
J = (1/(2*m)) * np.sum(error**2)
J = (1/(2*m)) * (error.T @ error)[0,0]
J = (1/(2*m)) * np.dot(error.flatten(), error.flatten())`
        },
        {
          id: 'c3',
          title: 'Cost Value Interpretation',
          description: 'If cost J = 25 with m = 50 samples, what is the average squared error per sample?',
          options: [
            { value: 'a', label: '0.5', isCode: false },
            { value: 'b', label: '1.0', isCode: false },
            { value: 'c', label: '25', isCode: false },
            { value: 'd', label: '50', isCode: false },
          ],
          correctAnswer: 'b',
          explanation: 'J = (1/2m) × Σ(error²), so Σ(error²) = 2mJ = 2×50×25 = 2500. Average = 2500/50 = 50. But with 1/2 factor: avg squared error = 2J/m = 1.0',
        },
        {
          id: 'c4',
          title: 'Cost with Regularization',
          description: 'How do you add L2 regularization to the cost function?',
          codeSnippet: `# lambda_reg is regularization parameter
# Don't regularize theta[0] (bias term)
J_base = (1/(2*m)) * np.sum(error**2)
J_reg = ???`,
          options: [
            { value: 'a', label: '(lambda_reg/(2*m)) * np.sum(theta**2)', isCode: true },
            { value: 'b', label: '(lambda_reg/(2*m)) * np.sum(theta[1:]**2)', isCode: true },
            { value: 'c', label: 'lambda_reg * np.sum(theta**2)', isCode: true },
            { value: 'd', label: '(lambda_reg/m) * np.sum(theta[1:])', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: 'L2 regularization: (λ/2m) × Σθⱼ² (excluding bias θ₀)',
          correctCode: `J = J_base + (lambda_reg/(2*m)) * np.sum(theta[1:]**2)`
        },
      ]
    },
    
    // Section 4: Gradient Descent
    {
      id: 'gradient_descent',
      title: 'Gradient Descent Implementation',
      icon: '⚡',
      description: 'Implementing the gradient descent algorithm',
      questions: [
        {
          id: 'g1',
          title: 'Gradient Computation',
          description: 'Complete the gradient computation:',
          codeSnippet: `def compute_gradient(X, y, theta):
    m = len(y)
    h = X @ theta
    error = h - y
    gradient = ???
    return gradient`,
          options: [
            { value: 'a', label: '(1/m) * X @ error', isCode: true },
            { value: 'b', label: '(1/m) * X.T @ error', isCode: true },
            { value: 'c', label: '(1/m) * error.T @ X', isCode: true },
            { value: 'd', label: 'X.T @ error', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: 'Gradient: ∇J = (1/m) × Xᵀ × (Xθ - y). X.T @ error gives shape (n+1, 1).',
          correctCode: `gradient = (1/m) * X.T @ error  # Shape: (n+1, 1)`
        },
        {
          id: 'g2',
          title: 'Parameter Update',
          description: 'How do you update theta in gradient descent?',
          codeSnippet: `alpha = 0.01  # learning rate
gradient = compute_gradient(X, y, theta)
theta = ???`,
          options: [
            { value: 'a', label: 'theta + alpha * gradient', isCode: true },
            { value: 'b', label: 'theta - alpha * gradient', isCode: true },
            { value: 'c', label: 'theta - gradient / alpha', isCode: true },
            { value: 'd', label: 'theta * (1 - alpha * gradient)', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: 'θ := θ - α × ∇J. We subtract because we want to move opposite to gradient (downhill).',
          correctCode: `theta = theta - alpha * gradient`
        },
        {
          id: 'g3',
          title: 'Full Gradient Descent Loop',
          description: 'What is the correct order of operations in gradient descent?',
          options: [
            { value: 'a', label: '1. Update theta → 2. Compute gradient → 3. Compute cost', isCode: false },
            { value: 'b', label: '1. Compute cost → 2. Update theta → 3. Compute gradient', isCode: false },
            { value: 'c', label: '1. Compute predictions → 2. Compute gradient → 3. Update theta', isCode: false },
            { value: 'd', label: '1. Compute gradient → 2. Compute predictions → 3. Update theta', isCode: false },
          ],
          correctAnswer: 'c',
          explanation: 'Correct order: Predict (h = Xθ) → Compute gradient from error → Update theta',
          correctCode: `for i in range(iterations):
    h = X @ theta           # 1. Predictions
    error = h - y
    grad = (1/m) * X.T @ error  # 2. Gradient
    theta = theta - alpha * grad  # 3. Update`
        },
        {
          id: 'g4',
          title: 'Complete Implementation',
          description: 'Which implementation is correct?',
          options: [
            { value: 'a', label: `theta = theta - alpha * (1/m) * X.T @ (X @ theta - y)`, isCode: true },
            { value: 'b', label: `theta = theta - alpha * (1/m) * X @ (X.T @ theta - y)`, isCode: true },
            { value: 'c', label: `theta = theta + alpha * (1/m) * X.T @ (y - X @ theta)`, isCode: true },
            { value: 'd', label: 'Both A and C are correct', isCode: false },
          ],
          correctAnswer: 'd',
          explanation: 'A: Standard form. C: Equivalent (adding negative of reversed error). B is wrong (X and X.T swapped).',
          correctCode: `# Both equivalent:
theta = theta - alpha * (1/m) * X.T @ (X @ theta - y)
theta = theta + alpha * (1/m) * X.T @ (y - X @ theta)`
        },
      ]
    },
    
    // Section 5: Complete Pipeline
    {
      id: 'pipeline',
      title: 'Complete Implementation',
      icon: '🔄',
      description: 'Putting it all together',
      questions: [
        {
          id: 'p1',
          title: 'Convergence Check',
          description: 'How do you check if gradient descent has converged?',
          options: [
            { value: 'a', label: 'When theta stops changing', isCode: false },
            { value: 'b', label: 'When cost change is below a threshold', isCode: false },
            { value: 'c', label: 'When gradient norm is very small', isCode: false },
            { value: 'd', label: 'All of the above are valid methods', isCode: false },
          ],
          correctAnswer: 'd',
          explanation: 'All are valid convergence criteria. Cost change threshold is most common.',
          correctCode: `# Example convergence check:
if abs(prev_cost - cost) < 1e-6:
    print("Converged!")
    break`
        },
        {
          id: 'p2',
          title: 'Feature Scaling Code',
          description: 'Complete the z-score normalization:',
          codeSnippet: `def normalize(X):
    mu = np.mean(X, axis=0)
    sigma = np.std(X, axis=0)
    X_norm = ???
    return X_norm, mu, sigma`,
          options: [
            { value: 'a', label: '(X - mu) / sigma', isCode: true },
            { value: 'b', label: '(X - mu) * sigma', isCode: true },
            { value: 'c', label: 'X / sigma - mu', isCode: true },
            { value: 'd', label: '(X + mu) / sigma', isCode: true },
          ],
          correctAnswer: 'a',
          explanation: 'Z-score: (x - μ) / σ. axis=0 computes mean/std for each feature column.',
          correctCode: `X_norm = (X - mu) / sigma`
        },
        {
          id: 'p3',
          title: 'Making Predictions',
          description: 'After training, how do you predict on new data (with scaling)?',
          codeSnippet: `# Trained: theta, mu, sigma (from training data)
# New data: X_new (raw features, no bias)
prediction = ???`,
          options: [
            { value: 'a', label: 'np.c_[np.ones((len(X_new), 1)), X_new] @ theta', isCode: true },
            { value: 'b', label: 'np.c_[np.ones((len(X_new), 1)), (X_new - mu) / sigma] @ theta', isCode: true },
            { value: 'c', label: '(X_new - mu) / sigma @ theta', isCode: true },
            { value: 'd', label: 'X_new @ theta', isCode: true },
          ],
          correctAnswer: 'b',
          explanation: 'Must: 1) Scale using TRAINING mu/sigma, 2) Add bias column, 3) Multiply by theta',
          correctCode: `X_scaled = (X_new - mu) / sigma
X_bias = np.c_[np.ones((len(X_new), 1)), X_scaled]
prediction = X_bias @ theta`
        },
        {
          id: 'p4',
          title: 'Debugging Gradient Descent',
          description: 'Your cost is increasing instead of decreasing. What is the most likely cause?',
          options: [
            { value: 'a', label: 'Learning rate is too small', isCode: false },
            { value: 'b', label: 'Learning rate is too large', isCode: false },
            { value: 'c', label: 'Too few iterations', isCode: false },
            { value: 'd', label: 'Features are already scaled', isCode: false },
          ],
          correctAnswer: 'b',
          explanation: 'If α is too large, gradient descent overshoots the minimum and diverges (cost increases).',
        },
      ]
    },
  ];
};

// Main Component
const PythonQuizTab = ({ progress, onCorrect }) => {
  const [sections] = useState(() => generateSections());
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleComplete = useCallback((sectionId) => {
    onCorrect(`python_${sectionId}`);
  }, [onCorrect]);

  const completedCount = sections.filter(s => progress[`python_${s.id}`]).length;

  return (
    <Box>
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">📚 Python Coding Quiz</Text>
          <Text fontSize="sm">Test your understanding of implementing linear regression in Python/NumPy.</Text>
        </Box>
      </Alert>

      {/* <Card bg={cardBg} mb={6} shadow="md">
        <CardBody>
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="bold">Progress</Text>
            <Badge colorScheme={completedCount === 5 ? 'green' : 'blue'} fontSize="md" px={3} py={1}>
              {completedCount}/5 Sections
            </Badge>
          </HStack>
          <Progress value={(completedCount / 5) * 100} colorScheme={completedCount === 5 ? 'green' : 'blue'} size="lg" borderRadius="full" hasStripe isAnimated />
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={2} mt={4}>
            {sections.map((s) => (
              <HStack key={s.id} p={2} bg={progress[`python_${s.id}`] ? 'green.50' : 'gray.50'} borderRadius="md" borderWidth="1px" borderColor={progress[`python_${s.id}`] ? 'green.300' : 'gray.200'}>
                <Text fontSize="sm">{s.icon}</Text>
                <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{s.title.split(' ')[0]}</Text>
                {progress[`python_${s.id}`] && <CheckIcon color="green.500" boxSize={3} />}
              </HStack>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card> */}

      <PythonReferenceCard />

      {sections.map((section) => (
        <QuizSection
          key={section.id}
          section={section}
          onComplete={() => handleComplete(section.id)}
          isCompleted={progress[`python_${section.id}`]}
        />
      ))}

      {completedCount === 5 && (
        <Alert status="success" borderRadius="md" mt={4}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">🎉 Python Master!</Text>
            <Text fontSize="sm">You can now implement linear regression from scratch in Python!</Text>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default PythonQuizTab;