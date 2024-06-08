const Quiz = require("../../../../models/quizModule/quiz");

class QuizController {
    async getFirstQuestion (req, res) {
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
            const totalQuizTime = calculateTotalTime(quizQuestions);
            shuffleArray(quizQuestions);
            const randomQuestionIds = quizQuestions.map((question) => question.id);
    
            let quizOrder = await findOrderArrayByUser(user, quiz);
            let currentIndex;
    
            if (quizOrder) {
                const indexOne = quizOrder.index;
                currentIndex = indexOne !== 0 || quizOrder.firstQues ? indexOne + 1 : 0;
                quizOrder.index = currentIndex;
                await quizOrder.save();
            } else {
                currentIndex = 0;
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
}

module.exports = QuizController