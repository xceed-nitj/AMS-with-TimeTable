const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const User = require('../../../../models/usermanagement/user');
const Quiz = require('../../../../models/quizModule/quiz');
const QuizQuestion = require('../../../../models/quizModule/quizQuestion');
const StudentAnswer = require('../../../../models/quizModule/studentAns');
const StudentResult = require('../../../../models/quizModule/studentResult');

const newQuiz = async (details) => {
  const {
    generatedLink,
    startTime,
    marginTime,
    resultTime,
    quizName,
    sectionName,
    negativeMarking,
    preventMobile,
    allowTabchange,
    userId
  } = details;

  const newquiz = await Quiz.create({
    code: generatedLink,
    startTime,
    marginTime,
    resultTime,
    quizName,
    sectionName,
    negativeMarking,
    preventMobile,
    allowTabchange,
    creator: userId,
    collaborators: []
  });
  return newquiz;
}

const findQuiz = async (code) => {
  try {
    const quiz = await Quiz.findOne({ code });
    // console.log(quiz);
    return quiz;
  } catch (error) {
    console.error('Error finding quiz:', error);
    throw error;
  }
};

const findQuizById = async (reqId) => {
	if (reqId) {
		const quizzes = await Quiz.find({
      _id: reqId
    });
		if (!quizzes) throw new Error('Unable to find quizzes.');
		return quizzes;
	} else {
		throw new Error('Quiz search by ID not found');

	}
}

const getAllQuestions = async(quiz) =>{
  if (quiz.id) {
    const questions = await QuizQuestion.find({ quizId: quiz._id });
    return questions;
  } else {
    throw new Error('No Quiz Questions found');
  }
}


const findQuestionById = async (id) => {
  if (id) {
    try {
      // Convert string id to ObjectId using the new keyword
      const objectId = new ObjectId(id);
      const ques = await QuizQuestion.findOne({ _id: objectId });

      if (!ques) {
        console.error(`Question with id ${id} not found in the database.`);
      }

      return ques;
    } catch (error) {
      console.error(`Error fetching question with id ${id}:`, error);
      return null;
    }
  } else {
    throw new Error('No Quiz Question found: Invalid ID');
  }
};



const verifyQuiz = async (code, user) => {
  const foundQuiz = await Quiz.findOne({ code: code });
  return foundQuiz;
};

// finding all quizzes by user Id
const findallQuiz = async (reqId) => {
  const user = await User.findById(reqId);
  if (user) {
    const quizzes = await Quiz.find({ userId: reqId });
    if (!quizzes.length) throw new Error('Unable to find quizzes.');
    return quizzes;
  } else {
    throw new Error('User not found');
  }
};



const deleteQuizByCode = async (code) => {
  if (code) {
    const result = await Quiz.deleteOne({ code: code });
    if (result.deletedCount === 0) throw new Error('Quiz not found');
    return true;
  } else {
    throw new Error('Quiz not found');
  }
};


const getAllAnswers = async (quiz) => {
  const ans = await StudentAnswer.find({ quizId: quiz.id });
  if (!ans.length) throw new Error('No Answer found');
  return ans;
};


const getAllResults = async (quiz) => {
  const ans = await StudentResult.find({ quizId: quiz.id });
  if (!ans.length) throw new Error('No Result found');
  return ans;
};


module.exports = {
  findQuiz,
  findQuizById,
  getAllQuestions,
  findQuestionById
}