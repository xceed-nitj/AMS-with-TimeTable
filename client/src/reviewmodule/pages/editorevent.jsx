import React, { useState, useEffect } from "react";
import { Container, Box, Input, Button, VStack, Textarea } from "@chakra-ui/react";

const EventForm = () => {
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paperSubmissionDate, setPaperSubmissionDate] = useState("");
  const [reviewTime, setReviewTime] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          dates: { fromDate, toDate },
          paperSubmissionDate,
          reviewTime,
          instructions,
        }),
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Container>
      <Box p={4}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Input
              placeholder="Event Name"
              value={name}
              isDisabled
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="Paper Submission Date"
              value={paperSubmissionDate}
              onChange={(e) => setPaperSubmissionDate(e.target.value)}
            />
            <Input
              placeholder="Review Time"
              value={reviewTime}
              onChange={(e) => setReviewTime(e.target.value)}
            />
            <Textarea
              placeholder="Instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <Button type="submit">Submit</Button>
          </VStack>
        </form>
      </Box>
    </Container>
  );
};

export default EventForm;
