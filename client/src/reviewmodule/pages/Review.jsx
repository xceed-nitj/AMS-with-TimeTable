import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import JoditEditor from "jodit-react";
import {
    ChakraProvider,
    Box,
    Button,
    RadioGroup,
    Radio,
    Checkbox,
    FormControl,
    FormLabel,
    Textarea,
    Select,
    useToast,
} from "@chakra-ui/react";
import getEnvironment from "../../getenvironment";

const Review = () => {
    const apiUrl = getEnvironment();
    const { eventId, paperId, userId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [comments, setComments] = useState({});
    const [decisions, setDecisions] = useState({});
    const toast = useToast();

    // Function to fetch questions based on eventId and paperId
    const fetchQuestions = async () => {
        try {
            const response = await axios.get(`${apiUrl}/reviewmodule/reviewQuestion/get/${eventId}`);
            setQuestions(response.data);
        } catch (error) {
            console.log("Error fetching questions:", error);
        }
    };

    // Handler to update answers state
    const handleAnswerChange = (index, value) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    // Handler to update comments state
    const handleCommentChange = (index, value) => {
        setComments(prev => ({ ...prev, [index]: value }));
    };

    // Handler to update decisions state
    const handleDecisionChange = (index, value) => {
        setDecisions(prev => ({ ...prev, [index]: value }));
    };

    // Handler to save answers, comments, and decisions for a question
    const handleSaveAnswer = async (index) => {
        try {
            const response = await axios.post(`${apiUrl}/reviewmodule/review/add`, {
                paperId,
                eventId,
                reviewerId: userId,
                reviewans: [answers[index]], // Assuming answers are stored in an array
                commentsAuthor: comments[index] || "",
                commentsEditor: "", // Leave empty or adjust as per your logic
                decision: decisions[index] || "Needs Revision"
            });

            if (response.status === 201) {
                toast({
                    title: "Answer saved.",
                    description: "Your answer has been saved successfully.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: "Error saving answer.",
                    description: "There was an error saving your answer. Please try again later.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error("Error saving answer:", error);
            toast({
                title: "Error saving answer.",
                description: "There was an error saving your answer. Please try again later.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Effect to fetch questions when eventId or paperId changes
    useEffect(() => {
        fetchQuestions();
    }, [eventId, paperId]);

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
