const Quiz = require('../../../../models/quizModule/quiz')
const {findQuiz} = require('./dto');

// const QuizQuestion = require('../../../../models/quizquestion');
// const { validateUserData, getUserDetails, sendVerificationEmail} = require('../../userManagement/helper');
// const { createUser, findUser, updateUser, findResetDetails} = require('../../userManagement/dto');


const generateUniqueLink = async () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';

  const generateRandomLink = () => {
    let link = '';
    for (let i = 0; i < 3; i++) {
      link += letters[Math.floor(Math.random() * letters.length)];
    }
    link += '-';
    for (let i = 0; i < 3; i++) {
      link += letters[Math.floor(Math.random() * letters.length)];
    }
    link += '-';
    for (let i = 0; i < 3; i++) {
      link += letters[Math.floor(Math.random() * letters.length)];
    }
   return link;
  };

  let generatedLink;
  let isLinkUnique = false;
  while (!isLinkUnique) {
    generatedLink = generateRandomLink();
    const existingQuiz = await findQuiz(generatedLink);
    if (!existingQuiz) {
      isLinkUnique = true;
    }
  }
  return generatedLink;
};

const quizBelongsToUser = async (req, res, next) => {
  try {
      const user = req.user;
      const { code } = req.params;

      const quiz = await Quiz.findOne({ code, user: user._id });
      if (!quiz) {
          return res.status(404).json({ error: 'Quiz not found' });
      }

      req.user = user;
      req.quiz = quiz;
      next(); // Call the next middleware or route handler
  } catch (error) {
      console.error('Error in quizBelongsToUser middleware:', error);
      return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  generateUniqueLink,
  quizBelongsToUser
};

// async function facultyCheck(req, res, next){
//   try {
//     user=req.user;
//     if (user.profileType != 'faculty') {
//       return res.status(401);
//     }
//     req.user = user; // Attach the user object to the request for further use
//     next(); // Call the next middleware or route handler
//   } catch (error) {
//     return res.status(401).json({ error: 'Error in authorisation' });
//   }
// };

// // save answer from the option structure
// const correctAnswer = async(options, correctAnsInteger, questionType) =>{
// let ans = [];
// if(questionType=='numerical')
// {
//     ans=[correctAnsInteger];
//     return ans;
// }
// if(questionType=='single' || questionType=='multiple')
// {
//  // Initialize an empty array to store the correct options
// // Loop through the options to find the correct ones
// for (const option of options) {
// if (option.isCorrect === true) {
//   ans.push(option.value);
// }
// }
// return ans;
// }

// };

// const addQuestion= async(details)=>{
//   const {question, ans, explanation, questionTime, marks, options, questionLevel,
//         sectionId, questionType, negativeMark, quiz}=details;
//   const quizQuestion = await QuizQuestion.create({
//     question, 
//     answer:ans,
//      explanation, questionTime, 
//      mark:marks,
//     options:options,
//     questionLevel:questionLevel,
//     sectionId, 
//     questionType:questionType,
//     negativeMark, quizId: quiz.id,
// });
// return quizQuestion;
// }

// const editQuestion= async(details)=>{
//   const {question, ans, explanation, questionTime, marks, options, questionLevel,
//         sectionId, questionType, negativeMark, quiz,id}=details;
//   const quizQuestion = await QuizQuestion.update({
//     question, 
//     answer:ans,
//      explanation, questionTime, 
//      mark:marks,
//     options:options,
//     questionLevel:questionLevel,
//     sectionId, 
//     questionType:questionType,
//     negativeMark, quizId: quiz.id,
// }, {where: {id:id}});
// return quizQuestion;
// }


// const consolidateStudentData = (studentSummary) => {
//   const consolidatedData = {};
//   console.log(studentSummary);

//   // Sort the student summary by questionId value
//   studentSummary.sort((a, b) => a.questionId - b.questionId);

//   // Loop through the sorted data and group it based on studentId
//   studentSummary.forEach((item) => {
//     const studentId = item.studentId;

//     if (!consolidatedData[studentId]) {
//       consolidatedData[studentId] = {
//         studentDetails: {
//           // rollNo: studentDetails[studentId].rollNo,
//           // firstName: studentDetails[studentId].firstName,
//           // lastName: studentDetails[studentId].lastName,
//         },
//         answers: [],
//       };
//     }

//     consolidatedData[studentId].answers.push({
//       // id: item.id,
//       // quizId: item.quizId,
//       questionId: item.questionId,
//       answer: item.answer,
//       timeElapsed: item.timeElapsed,
//       score: item.score,
//     });
//   });

//   return consolidatedData;
// };