const QuizOrderArray = require('../../../../models/quizModule/quizOrderArray');

const { getAllQuestions, findQuiz, findQuizById } = require('../../faculty/controllers/dto');

const { calculateTotalTime, shuffleArray, getNextQuestion, calculateScore, generateResult } = require('./helper');
const { findOrderArrayById, findOrderArrayByUser, createOrderArray, findQuestion, saveAnswer, updateEndQuiz, findQuizByUser } = require('./dto');

class QuizController {
    async getFirstQuestion(req, res) {
        try {
            const user = req.user;
            const { code } = req.params;
            const quiz = await findQuiz(code);
            const now = Date.now();

            if (quiz.marginTime < now) {
                return res.status(404).json({ success: false, message: 'Time up' });
            }

            const quizQuestions = await getAllQuestions(quiz);

            if (!quizQuestions || quizQuestions.length === 0) {
                return res.status(404).json({ success: false, message: 'Quiz questions not found' });
            }

            const totalQuestions = quizQuestions.length;
            console.log(totalQuestions);

            const totalQuizTime = calculateTotalTime(quizQuestions);
            //await shuffleArray(quizQuestions);
            const randomQuestionIds = quizQuestions.map((question) => question.id);

            let quizOrder = await findOrderArrayByUser(user, quiz);
            let currentIndex;

            if (quizOrder) {
                console.log('quiz order present');
                const indexOne = quizOrder.index;
                console.log('indexOne value:', indexOne);

                if (indexOne !== 0 || quizOrder.firstQues == true) {
                    currentIndex = indexOne + 1;
                    quizOrder.index = currentIndex;
                    await quizOrder.save();
                } else {
                    currentIndex = 0;
                }
            } else {
                currentIndex = 0;
            }

            if (!quizOrder) {
                console.log('quiz order not present');
                console.log('current Index', currentIndex);
                quizOrder = await createOrderArray({ quiz, user, randomQuestionIds, index: 0 });
            }

            const firstQuestion = await getNextQuestion(quizOrder.id, currentIndex);
            if (!firstQuestion || !quizOrder.status) {
                return res.status(404).json({ success: false, message: 'No questions found' });
            }
            res.status(201).json({ success: true, data: { firstQuestion, currentIndex, totalQuizTime, totalQuestions } });

        } catch (error) {
            console.error('Error creating student answer:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    };

    async saveAnsAndGetQues(req, res) {
        try {
            const user = req.user;
            const { code, currentIndex } = req.params;
            console.log(currentIndex);

            const quiz = await findQuiz(code);
            const { answer, timeElapsed } = req.body;

            const quizOrder = await findOrderArrayByUser(user, quiz);
            if (quizOrder) {
                const currentIndex = quizOrder.index;
                await QuizOrderArray.updateOne(
                    { index: parseInt(currentIndex, 10) + 1 },
                    { where: { id: quizOrder.id } }
                );
                console.log('Updated status array:', quizOrder.status);
            } else {
                console.error('Error updating quizOrder status');
            }
            if (!quizOrder) {
                return res.status(404).json({ success: false, message: 'Quiz order not found' });
            }

            const quizQuestion = await findQuestion(quizOrder.questionOrder[currentIndex]);
            if (!quizQuestion) {
                return res.status(404).json({ success: false, message: 'Quiz question not found in currentindex' });
            }
            const studentAnswer = await saveAnswer({ quizOrder, user, questionId: quizQuestion._id, answer, timeElapsed, score: 0 });
            
            quizOrder.index = currentIndex;
            await quizOrder.save();
            const nextIndex = parseInt(currentIndex, 10) + 1;
            console.log('Updated index:', nextIndex);
            const nextQuestion = await getNextQuestion(quizOrder.id, nextIndex);
            if (!nextQuestion || !quizOrder.status) {
                await updateEndQuiz(quizOrder);
                await calculateScore(quiz, user);
                await generateResult(quiz, user);
                return res.status(410).json({ success: true, message: 'No more questions left' });
            }
            console.log('Array length', quizOrder.questionOrder.length);
            if (nextIndex < quizOrder.questionOrder.length) {
                res.status(200).json({ success: true, data: { nextQuestion, nextIndex } });
            } else {
                res.status(200).json({ success: true, message: 'End of array' });
            }
        } catch (error) {
            console.error('Error saving answer and getting next question:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    };

    async getStudentResult(req, res) {
        try {
            const { code } = req.params;
            const quiz = await findQuiz(code);
            const user = req.user;
            const finalResult = await generateResult(quiz, user);
            if (finalResult) {
                res.status(200).json({ success: true, message: 'Total marks calculated', data: finalResult });
            } else {
                res.status(404).json({ success: false, message: 'Student result not found' });
            }
        } catch (error) {
            console.error('Error fetching student result:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    };

    async getStudentQuiz(req, res) {
        try {
            const user = req.user;
            const finalQuiz = await findQuizByUser(user);
            if (finalQuiz) {
                const quizIds = finalQuiz.map((quiz) => quiz.quizId);
                const quizDetailsArray = [];
                await Promise.all(
                    quizIds.map(async (quizId) => {
                        const quizDetails = await findQuizById(quizId);
                        quizDetailsArray.push(quizDetails);
                    })
                );
                const flattenedArray = [].concat(...quizDetailsArray);
                res.status(200).json({
                    success: true,
                    message: 'Student quiz details retrieved',
                    data: flattenedArray,
                });
            } else {
                res.status(404).json({ success: false, message: 'Student quiz details not found' });
            }
        } catch (error) {
            console.error('Error fetching student quiz details:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    };
}

module.exports = QuizController;
