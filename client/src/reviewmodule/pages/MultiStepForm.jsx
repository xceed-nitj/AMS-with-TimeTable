import React, { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepTitle, StepIndicator, StepStatus, StepSeparator, Icon } from '@chakra-ui/react';
import { FaAlignJustify, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import AuthorDetails from '../components/AuthorDetails';
import PaperDetails from '../components/PaperDetails';
import CodeDetails from '../components/CodeDetails';
import PaperUpload from '../components/PaperUpload';
import Terms from '../components/Terms';
import Submission from '../components/Submission';
import { useRecoilState } from 'recoil';
import { paperState } from '../state/atoms/paperState';
import getEnvironment from '../../getenvironment';

import './revolveAnimation.css';

function MultiStepForm({ isSidebarOpen }) {
  const [activeStep, setActiveStep] = useState(0); // State to manage active step index
  const [paper, setPaper] = useRecoilState(paperState);
  const [next, setNext] = useState(false); // State to manage Next button disable
  const apiUrl = getEnvironment();

  const url = window.location.href;
  const urlParts = url.split('/');
  const value1 = urlParts[4];
  const value2 = urlParts[5];

  useEffect(() => {
    setPaper((prevPaper) => ({
      ...prevPaper,
      eventId: value1,
    }));
  }, [value1, setPaper]);
  useEffect(() => {
    const fetchPaperData = async () => {
      const searchParams = new URLSearchParams(location.search);
      const existing_paper = searchParams.get('pid');
      console.log("existing: ", existing_paper);
      if (existing_paper) {
        try {
          const response = await fetch(
            `${apiUrl}/api/v1/reviewmodule/paper/getPaperDetail/${existing_paper}`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          if (response.ok) {
            const fetchedData = await response.json();
            
            // Update only the fields that exist in the current paper state
            const updatedPaper = Object.keys(paper).reduce((acc, key) => {
              acc[key] = fetchedData.hasOwnProperty(key) ? fetchedData[key] : paper[key];
              return acc;
            }, {});
            setPaper(updatedPaper);
            setPaper((prevPaper) => ({
              ...prevPaper,
              pid: existing_paper,
            }));

          } else {
            console.error("Error fetching papers:", response.statusText);
          }
        } catch (error) {
          console.error("Error fetching papers:", error);
        }
      }else{
        setPaper((prevPaper) => ({
          ...prevPaper,
          pid: '',
          eventId: value1,
          authors: [],
          pseudo_authors: [],
          title: '',
          tracks:[],
          abstract: '',
          codeUploads: [],
          paperUploads: [],
          terms: false,
        }));
      }
    };
  
    fetchPaperData();
  }, []);

  async function handleNext(data) {
    if (!data) {
      if (activeStep === steps.length - 1) return;
      // Check if at least one entry is required
      const isAtLeastOneEntryRequired = steps[activeStep].component.props.isAtLeastOneEntryRequired;
      if (!isAtLeastOneEntryRequired) {
        setActiveStep(activeStep + 1);
        return;
      }
    }

    const res = await fetch(`${apiUrl}/api/v1/reviewmodule/paper/${value2}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, eventId: value1, paperId: value2 }),
    });

    if (res.ok) {
      if (activeStep === steps.length - 1) return;
      setActiveStep(activeStep + 1);
    } else {
      console.error('Failed to update data:', res.statusText);
    }
  }

  useEffect(() => {
    // Check if both title and abstract fields have values
    setNext(!(paper.title && paper.abstract));
  }, [paper.title, paper.abstract]);

  const steps = [
    { title: 'Author Details', component: <AuthorDetails setNext={setNext} handleNext={handleNext} isAtLeastOneEntryRequired={true} handlePrevious={handlePrevious} /> },
    { title: 'Paper Details', component: <PaperDetails setNext={setNext} handleNext={handleNext} isAtLeastOneEntryRequired={true} handlePrevious={handlePrevious} /> },
    { title: 'Code Details', component: <CodeDetails setNext={setNext} handleNext={handleNext} handlePrevious={handlePrevious} /> },
    { title: 'Paper Upload', component: <PaperUpload setNext={setNext} handleNext={handleNext} handlePrevious={handlePrevious} /> },
    { title: 'T&C', component: <Terms setNext={setNext} handleNext={handleNext} handlePrevious={handlePrevious} /> },
    { title: 'Submission', component: <Submission setActiveStep={setActiveStep} handlePrevious={handlePrevious} /> }, // Pass setActiveStep and handlePrevious props to Submission component
  ];

  function handlePrevious() {
    if (activeStep === 0) return;
    setActiveStep(activeStep - 1);
  }

  function handleNext() {
    if (activeStep === steps.length - 1) return;
    setActiveStep(activeStep + 1);
  }

  const containerStyle = {
    paddingTop: '35px',
    margin: 'auto',
    width: isSidebarOpen ? '82vw' : '82vw',
    overflowX: 'hidden',
    zIndex: '9997',
  };

  const iconSize = '1.5em'; // Define the size of the icons

  return (
    <div style={containerStyle}>
      <Stepper size="md" index={activeStep} style={{ display: 'flex', flexWrap: 'wrap' }} colorScheme="green">
        {steps.map((step, index) => (
          <Step
            key={index}
            cursor="pointer" // Add pointer cursor
            style={{ padding: '1px' }}
            onClick={() => setActiveStep(index)}
          >
            <StepStatus
              complete={
                <StepIndicator>
                  <Icon boxSize={iconSize} as={FaAngleLeft} />
                </StepIndicator>
              }
              incomplete={
                <StepIndicator>
                  <Icon boxSize={iconSize} as={FaAngleRight} />
                </StepIndicator>
              }
              active={
                <div
                  style={{
                    border: '2px solid #3182ce',
                    borderRadius: '50px',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div className="revolveAnimation" style={{ zIndex: '60', position: 'absolute', height: '100%' }}>
                    <div
                      style={{
                        border: '4px solid #3182ce',
                        borderRadius: '50px',
                        top: '0',
                        transform: 'translateY(-20%)',
                      }}
                    ></div>
                  </div>
                  <StepIndicator style={{ zIndex: '3', backgroundColor: '#3182ce', border: '2px solid #3182ce' }}>
                    <Icon boxSize={iconSize} as={FaAngleRight} style={{ color: 'white' }} />
                  </StepIndicator>
                </div>
              }
            />
            <Box flexShrink="0">
              <StepTitle>{step.title}</StepTitle>
            </Box>
            <StepSeparator />
          </Step>
        ))}
      </Stepper>
      <Box mt={50}>{steps[activeStep].component}</Box>
    </div>
  );
}

export default MultiStepForm;
