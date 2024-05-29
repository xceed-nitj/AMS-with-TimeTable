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
import getEnvironment from '../../getenvironment';

// const steps = [
//   { title: 'First', description: 'Contact Info' },
//   { title: 'Second', description: 'Date & Time' },
//   { title: 'Third', description: 'Select Rooms' },
// ];

function MultiStepForm() {
  const [next, setNext] = useState(true);
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
  });
  const apiUrl = getEnvironment();

  var url = window.location.href;
  // Split the URL by "/"
  var urlParts = url.split('/');
  // Extract the values from the URL
  var value1 = urlParts[4];
  var value2 = urlParts[5];
  console.log(value1, value2);
  async function handleNext(data) {
    if (!data) {
      if (activeStep === steps.length - 1) return;
      setActiveStep(activeStep + 1);
    }
    const res = await fetch(`${apiUrl}/api/v1/reviewmodule/paper/${value2}`, {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({ ...data, eventId: value1, paperId: value2 }),
    });
    const dataa = await res.json();
    console.log(dataa);
    if (res.ok) {
      if (activeStep === steps.length - 1) return;
      setActiveStep(activeStep + 1);
    } else {
      console.error('Failed to update data:', res.statusText);
    }
  }
  const steps = [
    {
      title: 'Author Details',
      component: (
        <AuthorDetails
          setNext={setNext}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
        />
      ),
    },
    {
      title: 'Paper Details',

      component: (
        <PaperDetails
          setNext={setNext}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
        />
      ),
    },
    {
      title: 'Code Details',

      component: (
        <CodeDetails
          setNext={setNext}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
        />
      ),
    },
    {
      title: 'Paper Upload',

      component: (
        <PaperUpload
          setNext={setNext}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
        />
      ),
    },
    {
      title: 'T&C',

      component: (
        <Terms
          setNext={setNext}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
        />
      ),
    },
    {
      title: 'Submission',

      component: <Submission setNext={setNext} setActiveStep={setActiveStep} />,
    },
  ];

  console.log(activeStep);
  function handlePrevious() {
    if (activeStep == 0) return;
    setActiveStep(activeStep - 1);
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

      {/* <div className="tw-flex tw-justify-between">
        <Button onClick={handlePrevious}>Back</Button>
        <Button
          onClick={() => {
            // Trigger handleNext from the current step component
            steps[activeStep].component.props.handleNext();
          }}
          isDisabled={next}
        >
          Next
        </Button>
      </div> */}
    </div>
  );
}

export default MultiStepForm;
