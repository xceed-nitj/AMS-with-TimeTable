import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import AuthorDetails from "../components/AuthorDetails.tsx";
import CodeDetails from "../components/CodeDetails.tsx";
import PaperDetails from "../components/PaperDetails.tsx";
import PaperUpload from "../components/PaperUpload.tsx";
import Submission from "../components/Submission.tsx";
import Terms from "../components/Terms.tsx";

export default function MultiStepForm() {
  const [next, setNext] = React.useState(true);

  const steps = [
    { label: "Author Details", content: <AuthorDetails setNext={setNext} /> },
    { label: "Paper Details", content: <PaperDetails setNext={setNext} /> },
    { label: "Code Details", content: <CodeDetails setNext={setNext} /> },
    { label: "Paper Upload", content: <PaperUpload setNext={setNext} /> },
    {
      label: "Terms and Conditions",
      content: <Terms setNext={setNext} />,
    },
    { label: "Submission", content: <Submission setNext={setNext} /> },
  ];
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const isStepOptional = (step) => {
    return step === 2;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

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
    //route to submit the data
  };

  return (
    <div className="p-20 bg-slate-100 min-h-dvh h-fit">
      <Box sx={{ width: "100%" }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => {
            console.log(label);

            const stepProps: { completed } = {};
            const labelProps: {
              optional;
            } = {};
            if (isStepOptional(index)) {
              labelProps.optional = (
                <Typography variant="caption">Optional</Typography>
              );
            }
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label.label} {...stepProps}>
                <StepLabel {...labelProps}>{label.label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            {/* <div>Step {activeStep + 1}</div> */}
            <div>{steps[activeStep].content}</div>
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />

            {activeStep !== steps.length - 1 ? (
              <Button onClick={handleNext} disabled={next}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Submit</Button>
            )}
          </Box>
        </React.Fragment>
      </Box>
    </div>
  );
}
