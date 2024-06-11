// import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  Button,
  Text,
  Flex
} from "@chakra-ui/react";
import AuthorDetails from '../components/AuthorDetails';
import CodeDetails from '../components/CodeDetails';
import PaperDetails from '../components/PaperDetails';
import PaperUpload from '../components/PaperUpload';
import Submission from '../components/Submission';
import Terms from '../components/Terms';

const StepLabel = ({ children, isComplete }) => {
  return (
    <Flex align="center">
      <Box mr={2} fontSize="20px" fontWeight={isComplete ? 'bold' : 'normal'}>
        {isComplete ? '✓' : ''}
      </Box>
      <Text fontSize="md" fontWeight={isComplete ? 'bold' : 'normal'}>
        {children}
      </Text>
    </Flex>
  );
};

export default function MultiStepForm() {
  const [next, setNext] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());

  const steps = [
    { label: 'Author Details', content: <AuthorDetails setNext={setNext} /> },
    { label: 'Paper Details', content: <PaperDetails setNext={setNext} /> },
    { label: 'Code Details', content: <CodeDetails setNext={setNext} /> },
    { label: 'Paper Upload', content: <PaperUpload setNext={setNext} /> },
    { label: 'Terms and Conditions', content: <Terms setNext={setNext} /> },
    { label: 'Submission', content: <Submission setNext={setNext} /> },
  ];

  const isStepOptional = (step) => step === 2;
  const isStepSkipped = (step) => skipped.has(step);

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setNext(true);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setNext(false);
  };

  const handleSubmit = () => {
    // Route to submit the data
  };

  return (
    <Box className="p-20 bg-slate-100 min-h-dvh h-fit">
      <Box w="100%">
        <Stepper currentStep={activeStep}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel isComplete={isStepSkipped(index)}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box>
          <Text mt={2} mb={1}>
            {steps[activeStep].content}
          </Text>
          <Flex flexDirection="row" pt={2}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '0.1 1 auto' }} />
            {activeStep !== steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!next}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Submit</Button>
            )}
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
