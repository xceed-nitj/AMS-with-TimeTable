import { useState, useEffect } from "react";
import React from 'react';
import { useParams } from "react-router-dom";
import getEnvironment from "../../getenvironment";
import axios from 'axios';
import JoditEditor from "jodit-react";
import { useToast, ChakraProvider, Box, Button, RadioGroup, Radio, Checkbox, FormControl, FormLabel, Textarea, Select } from "@chakra-ui/react";

const Review = () => {
    const apiUrl = getEnvironment();
    const { eventId, paperId, userId } = useParams();
    const [isPaperAssigned, setIsPaperAssigned] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [comments, setComments] = useState({});
    const [decisions, setDecisions] = useState({});
    const toast = useToast();

    const checkAssignedPaper = async () => {
        try {
            const paperResponse = await axios.get(`${apiUrl}/reviewmodule/paper/getpaperdetail/${paperId}`);
            const reviewers = paperResponse.data.reviewers;
            const userResponse = await axios.get(`${apiUrl}/reviewmodule/user/getuser/${userId}`);
            const user = userResponse.data;

            let matchFound = false;
            reviewers.forEach(reviewer => {
                user.email.forEach(email => {
                    if (reviewer.username === email) {
                        matchFound = true;
                    }
                });
            });

            if (matchFound) {
                setIsPaperAssigned(true);
                fetchQuestions();
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await axios.get(`${apiUrl}/reviewmodule/reviewQuestion/${eventId}/${paperId}`);
            setQuestions(response.data);
        } catch (error) {
            console.log("Error fetching questions:", error);
        }
    };

    const handleAnswerChange = (index, value) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    const handleCommentChange = (index, value) => {
        setComments(prev => ({ ...prev, [index]: value }));
    };

    const handleDecisionChange = (index, value) => {
        setDecisions(prev => ({ ...prev, [index]: value }));
    };

    const handleSaveAnswer = async (index) => {
        try {
            await axios.post(`${apiUrl}/reviewmodule/review/add`, {
                eventId,
                paperId,
                reviewerId: userId,
                reviewans: answers[index],
                commentsAuthor: comments[index] || "",
                commentsEditor: "",
                decision: decisions[index] || "Needs Revision"
            });
            toast({
                title: "Answer saved.",
                description: "Your answer has been saved successfully.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error saving answer.",
                description: "There was an error saving your answer.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        checkAssignedPaper();
    }, [paperId, userId]);

    if (!isPaperAssigned) {
        return <h1>This paper is not assigned to you</h1>;
    }

    return (
        <ChakraProvider>
            <Box p={4}>
                <h1>Review Questions</h1>
                {questions.map((question, index) => (
                    <Box key={question._id} p={4} shadow="md" borderWidth="1px">
                        <p dangerouslySetInnerHTML={{ __html: question.question[0] }}></p>
                        {question.type[0] === "Single Correct" && (
                            <FormControl as="fieldset">
                                <RadioGroup
                                    name={`question-${index}`}
                                    onChange={(value) => handleAnswerChange(index, value)}
                                    value={answers[index] || ""}
                                >
                                    {question.options.map((option, i) => (
                                        <Radio key={i} value={option}>
                                            {option}
                                        </Radio>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        )}
                        {question.type[0] === "Multiple Correct" && (
                            <FormControl as="fieldset">
                                {question.options.map((option, i) => (
                                    <Checkbox
                                        key={i}
                                        value={option}
                                        onChange={(e) => {
                                            const updatedAnswers = answers[index] ? [...answers[index]] : [];
                                            if (e.target.checked) {
                                                updatedAnswers.push(option);
                                            } else {
                                                const optionIndex = updatedAnswers.indexOf(option);
                                                if (optionIndex > -1) {
                                                    updatedAnswers.splice(optionIndex, 1);
                                                }
                                            }
                                            handleAnswerChange(index, updatedAnswers);
                                        }}
                                        isChecked={answers[index] && answers[index].includes(option)}
                                    >
                                        {option}
                                    </Checkbox>
                                ))}
                            </FormControl>
                        )}
                        {question.type[0] === "Text" && (
                            <JoditEditor
                                value={answers[index] || ""}
                                onChange={(newContent) => handleAnswerChange(index, newContent)}
                            />
                        )}
                        <FormControl mt={4}>
                            <FormLabel>Comments</FormLabel>
                            <Textarea
                                value={comments[index] || ""}
                                onChange={(e) => handleCommentChange(index, e.target.value)}
                            />
                        </FormControl>
                        <FormControl mt={4}>
                            <FormLabel>Decision</FormLabel>
                            <Select
                                value={decisions[index] || "Needs Revision"}
                                onChange={(e) => handleDecisionChange(index, e.target.value)}
                            >
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Needs Revision">Needs Revision</option>
                            </Select>
                        </FormControl>
                        <Button mt={4} onClick={() => handleSaveAnswer(index)}>
                            Save Answer
                        </Button>
                    </Box>
                ))}
            </Box>
        </ChakraProvider>
    );
};

export default Review;
