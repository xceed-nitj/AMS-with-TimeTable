const StudentResult = require('../../../../models/quizModule/studentResult');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const { getAllQuestions, findQuestionById } = require('../../faculty/controllers/dto');
const {
    findOrderArrayById,
    findQuestion,
    findStudentAnswer,
    findAanswer,
    updateScore,
    findQuizResult,
    createResult,
    deleteResult
} = require('./dto');

async function getNextQuestion(quizOrderId, currentIndex) {
    try {
        const quizOrder = await findOrderArrayById(quizOrderId);
        if (!quizOrder) {
            return null; // Quiz order not found
        }
        const { questionOrder } = quizOrder;
        const totalQuestions = questionOrder.length;

        if (currentIndex >= totalQuestions) {
            return false; // No more questions left
        }
        const questionId = questionOrder[currentIndex];
        const quizQuestion = await findQuestion(questionId);
        const sanitizedQuizQuestion = {
            question: quizQuestion.question,
            options: quizQuestion.options.map(option => option.value),
            questionTime: quizQuestion.questionTime,
            questionType: quizQuestion.questionType,
            mark: quizQuestion.mark,
        };
        return sanitizedQuizQuestion;
    } catch (error) {
        console.error('Error getting next question:', error);
        return null; // Return null on error
    }
}

const areArraysEqual = (array1, array2) => {
    if (array1.length !== array2.length) return false;
    const frequencyMap = {};
    for (const element of array1) {
        frequencyMap[element] = (frequencyMap[element] || 0) + 1;
    }
    for (const element of array2) {
        if (!frequencyMap[element]) {
            // If an element in array2 doesn't exist in array1, arrays are not equal
            return false;
        }
        frequencyMap[element]--;
    }
    for (const element in frequencyMap) {
        if (frequencyMap[element] !== 0) {
            return false;
        }
    }
    return true;
};

const calculateTotalTime = (questions) => {
    let totalTime = 0;
    for (const question of questions) {
        totalTime += question.questionTime;
    }
    return totalTime;
};

// fn to shuffle an array in place using Fisher-Yates algorithm
async function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const calculateScore = async (quiz, user) => {
    try {
        const allAnswers = await findStudentAnswer(quiz, user);

        for (const ans of allAnswers) {
            const ques = await findQuestionById(ans.questionId);
            const answer = ans.answer;
            let score = 0;

            console.log(`Question ID: ${ans.questionId}`);
            console.log(`Student Answer: ${answer}`);
            console.log(`Correct Answers: ${ques.options.filter(a => a.isCorrect).map(a => a.value)}`);

            if (ques.questionType === 'single' || ques.questionType === 'numerical') {
                if (ques.options.some(a => a.isCorrect && a.value === answer[0])) {
                    score = ques.mark;
                    console.log(`Correct single/numerical answer. Score: ${score}`);
                } else {
                    score = quiz.negativeMarking;
                    console.log(`Incorrect single/numerical answer. Applying negative marking: ${score}`);
                }
                await updateScore(ans.id, score); // Use ans.id to update the score for the specific answer
            }

            if (ques.questionType === 'multiple') {
                if (areArraysEqual(
                    ques.options.filter(a => a.isCorrect).map(a => a.value),
                    answer
                )) {
                    score = ques.mark;
                    console.log(`Correct multiple answer. Score: ${score}`);
                } else {
                    score = quiz.negativeMarking;
                    console.log(`Incorrect multiple answer. Applying negative marking: ${score}`);
                }
                await updateScore(ans.id, score); // Use ans.id to update the score for the specific answer
            }
        }
    } catch (error) {
        console.error('Error calculating and updating scores:', error);
    }
};

const generateResult = async (quiz, user) => {
    try {
        const studentAnswers = await findStudentAnswer(quiz, user);

        if (!studentAnswers || studentAnswers.length === 0) {
            console.error('No student answers found for the given quiz and user.');
            return null;
        }

        const totalScore = studentAnswers.reduce((accumulator, answer) => {
            return accumulator + (answer.score || 0);
        }, 0);

        let correctlyAnswered = 0;
        let wronglyAnswered = 0;
        let unattempted = 0;

        for (const answer of studentAnswers) {
            if (answer.score > 0) {
                correctlyAnswered++;
            } else if (answer.score < 0) {
                wronglyAnswered++;
            } else if (answer.score === 0) {
                wronglyAnswered++; // Assuming 0 score means an attempted but incorrect answer
            } else if (answer.score === null || isNaN(answer.score)) {
                unattempted++;
            }
        }

        const finalResult = await findQuizResult(quiz, user);
        if (finalResult) {
            finalResult.totalScore = totalScore;
            finalResult.totalCorrect = correctlyAnswered;
            finalResult.totalWrong = wronglyAnswered;
            finalResult.totalUnattempt = unattempted;
            await finalResult.save();
            return finalResult;
        } else {
            const newResult = await createResult({
                quiz, 
                user,
                totalScore,
                totalCorrect: correctlyAnswered,
                totalWrong: wronglyAnswered,
                totalUnattempt: unattempted
            });
            return newResult;
        }
    } catch (error) {
        console.error('Error fetching student result:', error);
    }
};

module.exports = {
    getNextQuestion,
    areArraysEqual,
    calculateTotalTime,
    shuffleArray,
    calculateScore,
    generateResult
};
