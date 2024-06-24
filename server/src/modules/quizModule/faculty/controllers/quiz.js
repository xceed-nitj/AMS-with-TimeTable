const {generateUniqueLink} = require('../controllers/helper');
const Quiz = require('../../../../models/quizModule/quiz');
const QuizQuestion = require('../../../../models/quizModule/quizQuestion');
const StudentAnswer = require('../../../../models/quizModule/studentAns');
const StudentResult = require('../../../../models/quizModule/studentResult');

const {findQuiz} = require('../controllers/dto');

//const HttpException = require('../../../../models/http-exception');
  
class QuizController {
  // quiz related functions
  
  async createQuiz(req, res) {
    const user = req.user;
    try {
      const {
        startTime,
        marginTime,
        resultTime,
        quizName,
        sectionName,
        negativeMarking,
        preventMobile,
        allowTabchange
      } = req.body;
      
      const generatedLink = await generateUniqueLink();
      // const creatorString = user.email[0];
      // console.log(creatorString);
      
      const quiz = new Quiz({
        code: generatedLink,
        startTime,
        marginTime,
        resultTime,
        quizName,
        sectionName,
        negativeMarking,
        preventMobile,
        allowTabchange,
        creator: user.email[0],
        user: user._id 
      });
  
      await quiz.save();
  
      res.status(201).json({
        success: true,
        data: quiz
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
  
  async getAllQuiz(req, res) {
    try {
      const user = req.user;
      const reqId = user._id;
      console.log(reqId);
      const allQuizzes = await Quiz.find({ user: reqId });
      res.status(200).json({
        success: true,
        data: allQuizzes
      });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }

  async getQuizByCode (req, res) {
    try {
      const {
        code
      } = req.params;
      const quiz = await Quiz.findOne({
        code
      });

      if (quiz) {
        res.status(200).json({
          success: true,
          data: quiz
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }

  async getQuizByCodeDTO(req, res) {
    try {
      const { code } = req.params;
      const quiz = await findQuiz(code); // Add await here
      console.log(quiz);
      if (quiz) {
        res.status(200).json({
          success: true,
          data: quiz
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }

  async editQuizByCode(req, res) {
    try {
      const user = req.user;
      const {
        code
      } = req.params;
      const {
        ...fields
      } = req.body;

      const quiz = await Quiz.findOne({
        code
      });
      if (quiz) {
        for (const key of Object.keys(fields)) {
          quiz[key] = fields[key];
        }
        await quiz.save();
        res.status(200).json({
          success: true,
          data: quiz
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  };

  async deleteQuiz(req, res) {
    try {
      const {
        code
      } = req.params;
      await Quiz.deleteOne({
        code
      });
      res.status(201).json({
        success: true,
        message: 'Quiz deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  };

  // questions related functions

  async addQuizQuestion (req, res) {
    try {
      const { code } = req.params;
      const { question, options, correctAnswer, explanation, questionTime, mark, sectionId, questionType, questionLevel, negativeMark } = req.body;

      // Find the quiz by code to get the ObjectId
      const quiz = await Quiz.findOne({ code });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      const newQuestion = new QuizQuestion({
        quizId: quiz._id, // Use the ObjectId of the Quiz
        question,
        options,
        answer: correctAnswer,
        explanation,
        questionTime,
        mark,
        sectionId,
        questionType,
        questionLevel,
        negativeMark
      });

      await newQuestion.save();
      res.status(201).json({
        success: true,
        data: newQuestion
      });
    } catch (error) {
      console.error('Error adding quiz question:', error);
      res.status(500).json({
          success: false,
          message: 'Internal Server Error'
      });
    }
  };

  async editQuizQuestion(req, res) {
    try {
        const { code, id } = req.params;
        const updatedFields = req.body;

        // Find the quiz by code to get the ObjectId
        const quiz = await Quiz.findOne({ code });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        const question = await QuizQuestion.findOne({ quizId: quiz._id, _id: id });
        if (question) {
            for (const key in updatedFields) {
                if (updatedFields.hasOwnProperty(key)) {
                    question[key] = updatedFields[key];
                }
            }
            await question.save();
            res.status(200).json({
                success: true,
                data: question
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }
    } catch (error) {
        console.error('Error editing quiz question:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
  };

  async getAllQuestion(req, res) {
    try {
      const { code } = req.params;

      // Find the quiz by code to get the ObjectId
      const quiz = await Quiz.findOne({ code });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      const questions = await QuizQuestion.find({ quizId: quiz._id });
      res.status(200).json({
        success: true,
        data: questions
      });
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  };

  async findQuestionById(req, res) {
    try {
      const { code, id } = req.params;

      // Find the quiz by code to get the ObjectId
      const quiz = await Quiz.findOne({ code });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      const question = await QuizQuestion.findOne({ quizId: quiz._id, _id: id });
      if (question) {
        res.status(200).json({
          success: true,
          data: question
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
    } catch (error) {
      console.error('Error fetching quiz question:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  };

  async deleteQuizQuestion(req, res) {
    try {
      const { code, id } = req.params;

      // Find the quiz by code to get the ObjectId
      const quiz = await Quiz.findOne({ code });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      const question = await QuizQuestion.findOneAndDelete({ quizId: quiz._id, _id: id });
      if (question) {
        res.status(200).json({
          success: true,
          message: 'Question deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
    } catch (error) {
        console.error('Error deleting quiz question:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
  };

  // Response - testing is pending

  async deleteQuizResponse(req, res) {
    try {
        const { code } = req.params;

        // Find the quiz by code to get the ObjectId
        const quiz = await Quiz.findOne({ code });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        const response = await StudentAnswer.findOneAndDelete({ quizId: quiz._id });
        if (response) {
            res.status(200).json({
                success: true,
                message: 'Response deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Response not found'
            });
        }
    } catch (error) {
        console.error('Error deleting response:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
  };

  async studentResultSummary(req, res) {
    try {
      const { code } = req.params;

      // Find the quiz by code to get the ObjectId
      const quiz = await Quiz.findOne({ code });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      const results = await StudentResult.find({ quizId: quiz._id });
      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error fetching student result summary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
};

}

module.exports = QuizController;