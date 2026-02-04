import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Button, Card, CardHeader, CardBody,
  Alert, AlertIcon, Badge, Heading, Collapse, useDisclosure,
  useColorModeValue, Flex, Icon, Divider, SimpleGrid, useToast,
  Progress, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, RepeatIcon, DragHandleIcon } from '@chakra-ui/icons';

// Draggable Step Component
const DraggableStep = ({ step, index, onDragStart, onDragOver, onDrop, isDragging, isCorrect, showResult }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const dragBg = useColorModeValue('purple.100', 'purple.800');
  const correctBg = useColorModeValue('green.100', 'green.800');
  const incorrectBg = useColorModeValue('red.100', 'red.800');
  
  let bg = cardBg;
  let borderColor = 'gray.200';
  
  if (showResult) {
    if (isCorrect) {
      bg = correctBg;
      borderColor = 'green.500';
    } else {
      bg = incorrectBg;
      borderColor = 'red.500';
    }
  } else if (isDragging) {
    bg = dragBg;
    borderColor = 'purple.500';
  }

  return (
    <Box
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      bg={bg}
      p={3}
      borderRadius="md"
      borderWidth="2px"
      borderColor={borderColor}
      cursor="grab"
      transition="all 0.2s"
      _hover={{ borderColor: showResult ? borderColor : 'purple.400', shadow: 'md' }}
      _active={{ cursor: 'grabbing' }}
      display="flex"
      alignItems="center"
      gap={3}
    >
      <Flex
        align="center"
        justify="center"
        bg={showResult ? (isCorrect ? 'green.500' : 'red.500') : 'purple.500'}
        color="white"
        borderRadius="full"
        minW="32px"
        h="32px"
        fontWeight="bold"
        fontSize="sm"
      >
        {index + 1}
      </Flex>
      <Icon as={DragHandleIcon} color="gray.400" />
      <Text flex="1" fontWeight="medium" fontSize={{ base: 'sm', md: 'md' }}>
        {step.title}
      </Text>
      {showResult && (
        isCorrect ? <CheckIcon color="green.500" /> : <CloseIcon color="red.500" />
      )}
    </Box>
  );
};

// Quiz Section Component
const QuizSection = ({ title, icon, description, steps, correctOrder, onComplete, isCompleted }) => {
  const [currentOrder, setCurrentOrder] = useState(() => {
    // Shuffle the steps initially
    const indices = steps.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const { isOpen: showSolution, onToggle: toggleSolution } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    setCurrentOrder(newOrder);
    setDraggedIndex(null);
    setShowResult(false);
  };

  const checkAnswer = () => {
    let correct = 0;
    currentOrder.forEach((stepIndex, position) => {
      if (stepIndex === correctOrder[position]) {
        correct++;
      }
    });
    setScore(correct);
    setShowResult(true);
    
    if (correct === steps.length) {
      onComplete();
      toast({
        title: '🎉 Perfect!',
        description: 'All steps are in the correct order!',
        status: 'success',
        duration: 3000,
      });
    } else {
      toast({
        title: `${correct}/${steps.length} Correct`,
        description: 'Some steps need to be reordered. Check the solution for help.',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const resetQuiz = () => {
    const indices = steps.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setCurrentOrder(indices);
    setShowResult(false);
    setScore(0);
  };

  return (
    <Card bg={cardBg} mb={6} shadow="md" borderWidth="2px" borderColor={isCompleted ? 'green.400' : 'transparent'}>
      {isCompleted && (
        <Badge colorScheme="green" position="absolute" top={2} right={2} px={2} py={1}>
          ✓ Completed
        </Badge>
      )}
      <CardHeader pb={2}>
        <HStack>
          <Text fontSize="2xl">{icon}</Text>
          <Heading size="md" color="purple.600">{title}</Heading>
        </HStack>
        <Text fontSize="sm" color="gray.600" mt={2}>{description}</Text>
      </CardHeader>
      <CardBody pt={2}>
        <Text fontSize="sm" color="gray.500" mb={4}>
          📌 Drag and drop the steps to arrange them in the correct order
        </Text>
        
        <VStack spacing={2} align="stretch" mb={4}>
          {currentOrder.map((stepIndex, position) => (
            <DraggableStep
              key={stepIndex}
              step={steps[stepIndex]}
              index={position}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedIndex === position}
              isCorrect={showResult && stepIndex === correctOrder[position]}
              showResult={showResult}
            />
          ))}
        </VStack>

        {showResult && (
          <Box mb={4}>
            <Progress
              value={(score / steps.length) * 100}
              colorScheme={score === steps.length ? 'green' : score > steps.length / 2 ? 'yellow' : 'red'}
              size="lg"
              borderRadius="full"
              hasStripe
              isAnimated
            />
            <Text textAlign="center" mt={2} fontWeight="bold" color={score === steps.length ? 'green.500' : 'orange.500'}>
              {score}/{steps.length} steps in correct position
            </Text>
          </Box>
        )}

        <HStack spacing={3} flexWrap="wrap">
          <Button colorScheme="green" onClick={checkAnswer} isDisabled={isCompleted && showResult && score === steps.length}>
            Check Order
          </Button>
          <Button colorScheme="gray" leftIcon={<RepeatIcon />} onClick={resetQuiz}>
            Shuffle
          </Button>
          <Button colorScheme="yellow" variant="outline" onClick={toggleSolution}>
            {showSolution ? 'Hide' : 'Show'} Solution
          </Button>
        </HStack>

        <Collapse in={showSolution}>
          <Box mt={4} p={4} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
            <Text fontWeight="bold" color="yellow.800" mb={3}>✅ Correct Order:</Text>
            <VStack spacing={2} align="stretch">
              {correctOrder.map((stepIndex, position) => (
                <HStack key={position} p={2} bg="white" borderRadius="md" borderWidth="1px" borderColor="yellow.300">
                  <Flex
                    align="center"
                    justify="center"
                    bg="green.500"
                    color="white"
                    borderRadius="full"
                    minW="28px"
                    h="28px"
                    fontWeight="bold"
                    fontSize="sm"
                  >
                    {position + 1}
                  </Flex>
                  <Box flex="1">
                    <Text fontWeight="medium" fontSize="sm">{steps[stepIndex].title}</Text>
                    <Text fontSize="xs" color="gray.600">{steps[stepIndex].explanation}</Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Collapse>
      </CardBody>
    </Card>
  );
};

// Main Workflow Quiz Tab Component
const WorkflowQuizTab = ({ progress, onCorrect }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Define all quiz sections with steps
  const quizSections = useMemo(() => [
    {
      id: 'data_prep',
      title: 'Data Preparation Pipeline',
      icon: '📊',
      description: 'Arrange the steps for preparing data before training a linear regression model.',
      steps: [
        { title: 'Load/Import the dataset', explanation: 'First step: Read data from CSV, database, or other sources' },
        { title: 'Perform Exploratory Data Analysis (EDA)', explanation: 'Understand data distribution, statistics, and relationships' },
        { title: 'Handle missing values (imputation/removal)', explanation: 'Deal with NaN or null values before processing' },
        { title: 'Detect and handle outliers', explanation: 'Identify anomalies that might skew the model' },
        { title: 'Separate features (X) and target variable (y)', explanation: 'Split data into input features and output to predict' },
        { title: 'Split data into training and test sets', explanation: 'Typically 80-20 or 70-30 split for training and evaluation' },
        { title: 'Apply feature scaling (standardization/normalization)', explanation: 'Scale features to similar ranges for faster convergence' },
      ],
      correctOrder: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      id: 'training',
      title: 'Model Training Process',
      icon: '⚡',
      description: 'Arrange the steps involved in training a linear regression model using gradient descent.',
      steps: [
        { title: 'Initialize parameters (θ₀, θ₁) to zero or small random values', explanation: 'Starting point for optimization' },
        { title: 'Compute predictions: ŷ = h(x) = θ₀ + θ₁x', explanation: 'Calculate model output for current parameters' },
        { title: 'Compute cost function: J(θ) = (1/2m)Σ(ŷ - y)²', explanation: 'Measure how wrong the predictions are' },
        { title: 'Compute gradients: ∂J/∂θ₀ and ∂J/∂θ₁', explanation: 'Find direction to update parameters' },
        { title: 'Update parameters: θⱼ := θⱼ - α × (∂J/∂θⱼ)', explanation: 'Move parameters in direction that reduces cost' },
        { title: 'Check for convergence (cost change < threshold)', explanation: 'Determine if training should stop' },
        { title: 'Repeat steps 2-6 until convergence or max iterations', explanation: 'Iterative optimization loop' },
      ],
      correctOrder: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      id: 'evaluation',
      title: 'Model Evaluation Pipeline',
      icon: '📈',
      description: 'Arrange the steps for evaluating and validating your trained linear regression model.',
      steps: [
        { title: 'Load trained model parameters (θ₀, θ₁)', explanation: 'Use the parameters learned during training' },
        { title: 'Make predictions on training set', explanation: 'Evaluate how well model fits training data' },
        { title: 'Calculate training metrics (MSE, RMSE, R²)', explanation: 'Quantify training performance' },
        { title: 'Make predictions on test set (unseen data)', explanation: 'Apply model to held-out data' },
        { title: 'Calculate test metrics (MSE, RMSE, R²)', explanation: 'Quantify generalization performance' },
        { title: 'Compare training vs test metrics', explanation: 'Check for overfitting or underfitting' },
        { title: 'Analyze residuals (prediction errors)', explanation: 'Verify model assumptions and identify patterns' },
        { title: 'Report final model performance', explanation: 'Document results for stakeholders' },
      ],
      correctOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    },
    {
      id: 'full_pipeline',
      title: 'Complete ML Pipeline (Advanced)',
      icon: '🔄',
      description: 'Arrange ALL major steps in the complete linear regression machine learning pipeline.',
      steps: [
        { title: 'Define the problem and success metrics', explanation: 'Understand what you\'re trying to predict and how to measure success' },
        { title: 'Collect and load dataset', explanation: 'Gather data relevant to the problem' },
        { title: 'Perform EDA and data cleaning', explanation: 'Explore, clean, and preprocess the data' },
        { title: 'Feature engineering and selection', explanation: 'Create new features, select important ones' },
        { title: 'Split data into train/validation/test sets', explanation: 'Partition data for training and evaluation' },
        { title: 'Apply feature scaling on training data', explanation: 'Fit scaler on training data only' },
        { title: 'Transform validation and test data using same scaler', explanation: 'Prevent data leakage by using training statistics' },
        { title: 'Train model on training set', explanation: 'Optimize parameters using training data' },
        { title: 'Tune hyperparameters using validation set', explanation: 'Select best learning rate, iterations, etc.' },
        { title: 'Evaluate final model on test set', explanation: 'Unbiased estimate of real-world performance' },
        { title: 'Interpret results and deploy model', explanation: 'Analyze coefficients and put model into production' },
      ],
      correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  ], []);

  const handleComplete = useCallback((sectionId) => {
    onCorrect(`workflow_${sectionId}`);
  }, [onCorrect]);

  const completedCount = quizSections.filter(s => progress[`workflow_${s.id}`]).length;
  const totalSections = quizSections.length;

  return (
    <Box>
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">🔀 Rearrangement Quiz</Text>
          <Text fontSize="sm">
            Drag and drop the steps to arrange them in the correct order. 
            Complete all {totalSections} sections to master the linear regression workflow!
          </Text>
        </Box>
      </Alert>

      

      {/* Key Concepts Reference */}
      <Accordion allowMultiple mb={6}>
        <AccordionItem>
          <AccordionButton bg={'purple.500'} _expanded={{ bg: 'purple.500' }}>
            <Box flex="1" textAlign="left" fontWeight="bold">
              📖 Quick Reference: Key Concepts
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4} bg={cardBg}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontWeight="bold" color="blue.700" mb={2}>🎯 Data Splitting</Text>
                <Text fontSize="sm">
                  • <strong>Training Set:</strong> 60-80% - Used to train the model<br/>
                  • <strong>Validation Set:</strong> 10-20% - Used to tune hyperparameters<br/>
                  • <strong>Test Set:</strong> 10-20% - Final unbiased evaluation
                </Text>
              </Box>
              <Box p={3} bg="green.50" borderRadius="md">
                <Text fontWeight="bold" color="green.700" mb={2}>📏 Feature Scaling</Text>
                <Text fontSize="sm">
                  • Fit scaler on <strong>training data only</strong><br/>
                  • Transform all sets using training statistics<br/>
                  • Prevents data leakage from test set
                </Text>
              </Box>
              <Box p={3} bg="orange.50" borderRadius="md">
                <Text fontWeight="bold" color="orange.700" mb={2}>⚠️ Common Mistakes</Text>
                <Text fontSize="sm">
                  • Scaling before splitting (data leakage)<br/>
                  • Not handling missing values first<br/>
                  • Evaluating only on training data
                </Text>
              </Box>
              <Box p={3} bg="purple.50" borderRadius="md">
                <Text fontWeight="bold" color="purple.700" mb={2}>📊 Evaluation Metrics</Text>
                <Text fontSize="sm">
                  • <strong>MSE:</strong> Mean Squared Error<br/>
                  • <strong>RMSE:</strong> Root Mean Squared Error<br/>
                  • <strong>R²:</strong> Coefficient of Determination
                </Text>
              </Box>
            </SimpleGrid>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Quiz Sections */}
      {quizSections.map((section) => (
        <QuizSection
          key={section.id}
          title={section.title}
          icon={section.icon}
          description={section.description}
          steps={section.steps}
          correctOrder={section.correctOrder}
          onComplete={() => handleComplete(section.id)}
          isCompleted={progress[`workflow_${section.id}`]}
        />
      ))}

      {/* Completion Message */}
      {completedCount === totalSections && (
        <Alert status="success" borderRadius="md" mt={4}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">🎉 Outstanding Work!</Text>
            <Text fontSize="sm">
              You've mastered the complete linear regression workflow! 
              You now understand the proper sequence of steps from data preparation to model deployment.
            </Text>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default WorkflowQuizTab;