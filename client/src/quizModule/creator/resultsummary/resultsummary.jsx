import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
// import './results.css'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'; // Import react-tabs components
import 'react-tabs/style/react-tabs.css'; // Import the default styling for react-tabs
import getEnvironment from '../../../../getenvironment';


const ResultSummary = () => {
  const [quizDetails, setQuizDetails] = useState([]);
  const [studentDetails, setStudentDetails] = useState({}); // Initialize as an empty object
  const [studentSummary, setStudentSummary] = useState([]);
  const [consolidatedData, setConsolidatedData] = useState([]);

  const apiurl = getEnvironment();
  

  //get ther student results including id, score and questions attempted, correct and wrong
  // useEffect(() => {
  //   const fetchResultDetails = async () => {
  //     try {
  //       const token = localStorage.getItem('token');
  //       const code = window.location.pathname.split('/')[2];

  //       const response = await fetch(`${apiurl}/studentresult/${code}/all`, {
  //         method: 'GET',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });

  //       if (response.ok) {
  //         const data = await response.json();
  //         // console.log(data.data);
  //         setQuizDetails(data.data); // Update the state with fetched quiz details
  //       } else {
  //         console.error('Failed to fetch quiz details:', response.status);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching quiz details:', error);
  //     }
  //   };

  //   fetchResultDetails();
  // }, []);

  // match the student id with the profile data to get details of student like roll no, name, etc..
  // useEffect(() => {
  //   const fetchStudentDetails = async () => {
  //     try {
  //       const token = localStorage.getItem('token');

  //       // Create an array to store all the student IDs
  //       const studentIds = quizDetails.map((quizResult) => quizResult.studentId);

  //       // Fetch student details for each student ID and store in an object
  //       const studentDetailsObj = {};
  //       for (const studentId of studentIds) {
  //         const response = await fetch(`${apiurl}/users/${studentId}`, {
  //           method: 'GET',
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         });

  //         if (response.ok) {
  //           const data = await response.json();
  //           studentDetailsObj[studentId] = data;
  //         } else {
  //           console.error('Failed to fetch student details:', response.status);
  //         }
  //       }

  //       // console.log(studentDetailsObj);
  //       setStudentDetails(studentDetailsObj); // Update the state with fetched student details
  //     } catch (error) {
  //       console.error('Error fetching student details:', error);
  //     }
  //   };

  //   if (quizDetails.length > 0) {
  //     fetchStudentDetails();
  //   }
  // }, [quizDetails]);

  // get the individual anwers of student for each question
  // useEffect(() => {
  //   const fetchStudentSummary = async () => {
  //     try {
  //       const token = localStorage.getItem('token');
  //       const code = window.location.pathname.split('/')[2];
  
  //       const response = await fetch(`${apiurl}/studentresultsummary/${code}/all`, {
  //         method: 'GET',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  
  //       if (response.ok) {
  //         const data = await response.json();
  //         console.log(data.data)
  //         setStudentSummary(data.data);
  //       } else {
  //         console.error('Failed to fetch student summary answers:', response.status);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching student summary answers:', error);
  //     }
  //   };
  
  //   fetchStudentSummary();
  // }, []);
  
// get the detailed summary results organised with custom function

// const consolidateStudentData = (studentSummary) => {
//   const consolidatedData = {};

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

// const consolidatedData = consolidateStudentData(studentSummary);

// // Calculate the total number of questions in the quiz
const totalQuestionsInQuiz = Object.values(consolidatedData).reduce((total, studentData) => {
  const { totalCorrect, totalWrong } = studentData.answers.reduce((acc, answer) => {
    if (answer.score === 1) {
      acc.totalCorrect += 1;
    } else if (answer.score === 0) {
      acc.totalWrong += 1;
    }
    return acc;
  }, { totalCorrect: 0, totalWrong: 0 });

  return Math.max(total, totalCorrect + totalWrong);
}, 0);


//Fetch questions and correct answer form the quizquestion table

const [questionDetails, setQuestionDetails] = useState([]);

useEffect(() => {
  const fetchQuestionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const code = window.location.pathname.split('/')[2];

      // Fetch all question details and store in state
      const response = await fetch(`${apiurl}/api/quiz/studentresultsummary/${code}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // console.log(data);
        // setQuizDetails(data.quiz);
        setQuestionDetails(data.data.questionDetails); 
        setStudentSummary(data.data.allAnswers);
        setQuizDetails(data.data.summaryResults);
        setStudentDetails(data.data.studentDetailsObj);
        setConsolidatedData(data.data.consolidatedData);
        // Update the state with fetched question details
      } else {
        console.error('Failed to fetch question details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
    }
  };

  fetchQuestionDetails();
},  []);

console.log(quizDetails);
        console.log(studentDetails);
        console.log('questiondetails',questionDetails);
        console.log('consolidated',consolidatedData);
// // Conditional rendering when studentDetails or quizDetails are not available yet
  if (Object.keys(studentDetails).length === 0 || quizDetails.length === 0) {
    return <div>Loading...</div>;
  }
// summary tab result download
  const handleCSVDownload = (data, fileName) => {
    const csvData = data.map((quizResult, index) => ({
      'Serial No': index + 1,
      'Roll No': studentDetails[quizResult.studentId].rollNo,
      'Student Name':studentDetails[quizResult.studentId].firstName,
      'Last Name': studentDetails[quizResult.studentId].lastName,
      'Total Score': quizResult.totalScore,
      'Total Correct': quizResult.totalCorrect,
      'Total Unattempted': quizResult.totalUnattempt,
      'Total Wrong': quizResult.totalWrong,
    }));
  
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'summary_results.csv');
  };

  //Detailed result tab csv download
  const handleCSVDownloadTab2 = () => {
    const headersRow1 = ['Serial No', 'Roll No', 'Student Name', '', '', ''];
    // const headersRow2 = ['', '', '', 'Question', '', '', 'Correct Answer', 'Time Elapsed', 'Score'];
  
    const questionHeaders = questionDetails.reduce((acc, question) => {
      const questionHeader = [
        '',
        '',
        '',
        `Question: ${question.question.substring(3,20)+'...'}`,
        '',
        '',
        question.answer?.join(', ') || '',
        '',
        '',
      ];
      return [...acc, ...questionHeader];
    }, []);
  
    const csvData = [];
    Object.keys(consolidatedData).forEach((studentId, index) => {
      const studentData = consolidatedData[studentId];
      const studentName = `${studentDetails[studentId].firstName} ${studentDetails[studentId].lastName}`;
  
      const rowData = [index + 1, studentDetails[studentId].rollNo, studentName];
      questionDetails.forEach((question) => {
        const answer = studentData.answers.find((a) => a.questionId === question.id) || {};
        rowData.push(answer.answer?.join(', ') || '');
        rowData.push(answer.timeElapsed || '');
        rowData.push(answer.score || '');
      });
  
      csvData.push(rowData);
    });
  
    const csv = Papa.unparse([headersRow1, questionHeaders, ...csvData]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'Detailed_results.csv');
  };
   
  
  
  return (
    <div>
      <h1>Quiz Result Page</h1>
      <Tabs>
        <TabList>
          <Tab>Summary Result</Tab>
          <Tab>Detailed Result</Tab>
          <Tab>Analytics</Tab>
        </TabList>

        {/* First Tab: Table */}
        <TabPanel>
          <table className="table"> {/* Use "table" class from the CSS file */}
            <thead>
              <tr>
                <th>Serial No</th>
                {/* <th>Quiz ID</th> */}
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Last Name</th>
                <th>Total Score</th>
                <th>Total Correct</th>
                <th>Total Unattempted</th>
                <th>Total Wrong</th>
              </tr>
            </thead>
            <tbody>
              {quizDetails.map((quizResult, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  {/* <td>{quizResult.quizId}</td> */}
                  <td>{studentDetails[quizResult.studentId].rollNo}</td>
                  <td>{studentDetails[quizResult.studentId].firstName}</td>
                  <td>{studentDetails[quizResult.studentId].lastName}</td>
                  <td>{quizResult.totalScore}</td>
                  <td>{quizResult.totalCorrect}</td>

                  <td>{quizResult.totalUnattempt}</td>
                  <td>{quizResult.totalWrong}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={() => handleCSVDownload(quizDetails)}>Download Summary Result</button>
          {/* <button onClick={() => handleCSVDownload(Object.values(quizDetails), 'Summart_results.csv')}>Download Tab 2 CSV</button> */}

        </TabPanel>

        {/* Second Tab: Detailed Table */}
        <TabPanel>
      <table className="table">
        <thead>
          <tr>
            <th>Serial No</th>
            <th>Roll No</th>
            <th>Student Name</th>
            {questionDetails.map((question) => (
              <React.Fragment key={question.id}>
                <th colSpan="3">
                  Q: {question.question.substring(3,20)+'...'} (Correct Answer: {question.answer?.join(', ')})
                </th>
              </React.Fragment>
            ))}
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            {questionDetails.map((question) => (
              <React.Fragment key={question.id}>
                <th>Student Answer</th>
                <th>Time Elapsed</th>
                <th>Score</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.keys(consolidatedData).map((studentId, index) => {
            const studentData = consolidatedData[studentId];
            // <p>{studentData}</p>
            return (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{studentDetails[studentId].rollNo}</td>
                <td>{`${studentDetails[studentId].firstName} ${studentDetails[studentId].lastName}`}</td>
                {questionDetails.map((question) => {
                  const answer = studentData.answers.find((a) => a.questionId === question.id) || {};

                  return (
                    <React.Fragment key={question.id}>
                      <td>{answer.answer?.join(', ')}</td>
                      <td>{answer.timeElapsed}</td>
                      <td>{answer.score}</td>
                    </React.Fragment>
                  );
                })}
                {/* Add empty cells for remaining questions if any */}
                {questionDetails.length < totalQuestionsInQuiz && (
                  <React.Fragment>
                    {Array(totalQuestionsInQuiz - questionDetails.length).fill().map((_, idx) => (
                      <React.Fragment key={idx}>
                        <td></td>
                        <td></td>
                        <td></td>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={handleCSVDownloadTab2}>Download Detailed result</button>

      
    </TabPanel>

    {/* ... (previous code) */}
        {/* Third Tab: Graphs */}
        <TabPanel>
          {/* Add the graphs content here */}
        </TabPanel>
      </Tabs>

    </div>
  );
};

export default ResultSummary;
