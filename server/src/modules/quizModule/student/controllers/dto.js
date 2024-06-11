const QuizOrderArray = require('../../../../models/quizModule/quizOrderArray');
const QuizQuestion = require('../../../../models/quizModule/quizQuestion');
const StudentAnswer = require('../../../../models/quizModule/studentAns');
const StudentResult = require('../../../../models/quizModule/studentResult');

const findOrderArrayById = async (quizOrderId) => {
  const orderArray = await QuizOrderArray.findById(quizOrderId);
  return orderArray;
}

const findOrderArrayByUser = async (user, quiz) => {
  const quizOrder = await QuizOrderArray.findOne({
    studentId: user.id,
    quizId: quiz.id
  });
  return quizOrder;
}

const findQuestion = async (questionId) => {
  const quizQuestion = await QuizQuestion.findById(questionId);
  if (!quizQuestion) throw new Error('Unable to find question.');
  return quizQuestion;
}

const createOrderArray = async (details) => {
  const { quiz, user, randomQuestionIds, index } = details;
  const quizOrder = await QuizOrderArray.create({
    quizId: quiz.id,
    studentId: user.id,
    questionOrder: randomQuestionIds,
    index: index,
    firstQues: true
  });
  if (!quizOrder) throw new Error('Unable to create order array.');
  return quizOrder;
}

const saveAnswer = async (details) => {
  const { quizOrder, user, answer, timeElapsed, score } = details;
  const studentAnswer = StudentAnswer.create({
    questionId: quizOrder.questionOrder[quizOrder.index],
    studentId: user.id,
    answer: answer,
    timeElapsed: timeElapsed,
    score: score,
    quizId: quizOrder.quizId,
  });
  return studentAnswer;
}

const updateEndQuiz = async (quizOrder) => {
  await QuizOrderArray.updateOne(
    { _id: quizOrder._id },
    { status: false }
  );
  return true;
}

const findStudentAnswer = async (quiz, user) => {
  const allStudentAnswer = await StudentAnswer.find({
    quizId: quiz.id,
    studentId: user.id
  });
  return allStudentAnswer;
}

const updateScore = async (studentAnsId, score) => {
  await StudentAnswer.updateOne(
    { _id: studentAnsId },
    { score: score }
  );
  return true;
}

const findAanswer = async (questionId) => {
  const studentAnswer = await StudentAnswer.findOne({
    questionId: questionId
  });
  return studentAnswer;
}

const findQuizResult = async (quiz, user) => {
  const finalResult = await StudentResult.findOne({
    quizId: quiz.id,
    studentId: user.id,
  });
  return finalResult;
}

const findQuizByUser = async (user) => {
  const allQuiz = await StudentResult.find({
    studentId: user.id,
  });
  return allQuiz;
}

const createResult = async (details) => {
  const { user, quiz, totalScore, correctlyAnswered, wronglyAnswered, unattempted } = details;
  const finalResult = await StudentResult.create({
    studentId: user.id,
    quizId: quiz.id,
    totalScore: totalScore,
    totalCorrect: correctlyAnswered,
    totalWrong: wronglyAnswered,
    totalUnattempt: unattempted,
  });
  return finalResult;
}

const deleteResult = async (quiz, user) => {
  await StudentResult.deleteOne({
    studentId: user.id,
    quizId: quiz.id,
  });
  return true;
}

module.exports = {
  findOrderArrayById,
  findOrderArrayByUser,
  findQuestion,
  createOrderArray,
  saveAnswer,
  updateEndQuiz,
  findStudentAnswer,
  updateScore,
  findAanswer,
  findQuizResult,
  createResult,
  deleteResult,
  findQuizByUser
}
