import React, { useState } from 'react';
// import { paperState } from '../state/atoms/paperState';
// import { useRecoilState } from 'recoil';
import {
  Box,
  Button,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from '@chakra-ui/react';
import AuthorDetails from '../components/AuthorDetails';
import PaperDetails from '../components/PaperDetails';
import CodeDetails from '../components/CodeDetails';
import PaperUpload from '../components/PaperUpload';
import Terms from '../components/Terms';
import Submission from '../components/Submission';

// const steps = [
//   { title: 'First', description: 'Contact Info' },
//   { title: 'Second', description: 'Date & Time' },
//   { title: 'Third', description: 'Select Rooms' },
// ];

function MultiStepForm() {
  const [next, setNext] = useState(true);
  console.log(next);
  const steps = [
    {
      title: 'Author Details',
      component: <AuthorDetails setNext={setNext} />,
    },
    {
      title: 'Paper Details',

      component: <PaperDetails setNext={setNext} />,
    },
    {
      title: 'Code Details',

      component: <CodeDetails setNext={setNext} />,
    },
    {
      title: 'Paper Upload',

      component: <PaperUpload setNext={setNext} />,
    },
    {
      title: 'T&C',

      component: <Terms setNext={setNext} />,
    },
    {
      title: 'Submission',

      component: <Submission setNext={setNext} />,
    },
  ];

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  console.log(activeStep);
  function handlePrevious() {
    if (activeStep == 0) return;
    setActiveStep(activeStep - 1);
  }

  function handleNext() {
    if (activeStep == steps.length - 1) return;
    setActiveStep(activeStep + 1);
  }

  function stepOptional(step) {
    return step == 2;
  }
  const style = { padding: '35px' };
  return (
    <div style={style}>
      <Stepper size="md" index={activeStep}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>

            <Box flexShrink="0">
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>
                {stepOptional(index) ? 'Optional' : ''}
              </StepDescription>
            </Box>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>
      {steps[activeStep].component}
      <div className='tw-flex tw-justify-between'>
        <Button onClick={handlePrevious}>Back</Button>
        <Button onClick={handleNext} isDisabled={next}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default MultiStepForm;
