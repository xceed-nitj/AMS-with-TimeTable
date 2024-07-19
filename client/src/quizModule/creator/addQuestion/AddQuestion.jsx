import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faL, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
// import './AddQuestion.css';
import QuillEditor from '../../components/quill/quillEditor';
import getEnvironment from '../../../getenvironment';
import { Box } from '@chakra-ui/react';

function AddQuestion({ editQuestionData, onClose }) {
  // console.log(editQuestionData);
  const apiurl = getEnvironment();
  const [data, setData] = useState({
    questionTime: 60,
    question: editQuestionData?.question ? editQuestionData.question : '',
    marks: editQuestionData?.mark ? editQuestionData.mark : 1,
    file: '',
    correctAnsInteger: editQuestionData?.answer ? editQuestionData.answer : '',
    explanation: editQuestionData?.explanation
      ? editQuestionData.explanation
      : '',
  });
  const [options, setOptions] = useState([]);
  const [correctOptions, setCorrectOptions] = useState([]);
  const [currentOption, setCurrentOption] = useState([]);
  const [questionType, setQuestionType] = useState(
    editQuestionData?.questionType ? editQuestionData.questionType : 'single'
  );
  const [questionLevel, setQuestionLevel] = useState(
    editQuestionData?.questionLevel ? editQuestionData.questionLevel : 'easy'
  );
  const [showHeading, setShowHeading] = useState(false);
  const [showButton, setShowButton] = useState({
    display: 'initial',
  });
  const [showCorrectAns, setShowCorrectAns] = useState({
    display: 'none',
  });
  const [saveConditionButton, setSaveConditionButton] = useState({
    display: 'none',
  });
  const [submitted, setSubmitted] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);

  useEffect(() => {
    if (editQuestionData) {
      if (editQuestionData.questionType === 'numerical') {
        setShowCorrectAns({
          display: 'initial',
        });
        setShowButton({
          display: 'none',
        });
        setData({ ...data, correctAnsInteger: editQuestionData.answer });
      } else if (
        editQuestionData.questionType === 'multiple' ||
        editQuestionData.questionType === 'single'
      ) {
        setShowCorrectAns({
          display: 'none',
        });
        setShowButton({
          display: 'initial',
        });

        let newOptions = [];
        let newCorrectOptions = [];
        let newsetCurrentOption = [];

        editQuestionData.options.forEach((option, index) => {
          newOptions.push(option.value);
          newCorrectOptions.push(option.isCorrect);
          newsetCurrentOption.push(index);
        });

        setOptions(newOptions);
        setCorrectOptions(newCorrectOptions);
        setCurrentOption(newsetCurrentOption);
        // fetchData();
      }
    }
  }, [editQuestionData]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const code = window.location.pathname.split('/').pop();
    const id = editQuestionData._id;
    try {
      const response = await fetch(
        `${apiurl}/quizmodule/faculty/quiz/${code}/questions/${id}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const dat = await response.json();
        // console.log('Fetched data:', dat);
        const data = dat.data;
        if (data.options && Array.isArray(data.options)) {
          const parsedOptions = data.options.map((option) =>
            JSON.parse(option)
          );

          let newOptions = [];
          let newCorrectOptions = [];
          let newsetCurrentOption = [];

          parsedOptions.forEach((option, index) => {
            newOptions.push(option.value);
            newCorrectOptions.push(option.isCorrect);
            newsetCurrentOption.push(index);
          });

          setOptions(newOptions);
          setCorrectOptions(newCorrectOptions);
          setCurrentOption(newsetCurrentOption);

          setData({
            questionTime: data.questionTime,
            question: data.question,
            marks: data.mark,
            correctAnsInteger: '',
            explanation: data.explanation,
          });

          setQuestionType(data.questionType);
          setQuestionLevel(data.questionLevel);
        } else {
          console.error('Invalid options data:', data.options);
        }
      } else {
        console.error('Failed to fetch data:', response);
      }
    } catch (error) {
      console.error('An error occurred while fetching data:', error);
    }
  };

  const handleCancel = () => {
    // Call the onClose function to close the AddQuestion component
    onClose();
  };

  const handleChangeData = async (values) => {
    const token = localStorage.getItem('token');
    const code = window.location.pathname.split('/').pop();

    if (editQuestionData) {
      const id = editQuestionData._id;
      try {
        const response = await fetch(
          `${apiurl}/quizmodule/faculty/quiz/${code}/questions/${id}`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
          }
        );

        if (response.ok) {
          setSubmitted(true);
          window.location.reload();
        } else {
          console.error('Failed to edit question:', response.status);
        }
      } catch (error) {
        console.error('An error occurred while editing question:', error);
      }
    } else {
      try {
        const response = await fetch(
          `${apiurl}/quizmodule/faculty/quiz/${code}/questions`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
          }
        );

        if (response.ok) {
          setSubmitted(true);
          window.location.reload();
        } else {
          console.error('Failed to create question:', response.status);
        }
      } catch (error) {
        console.error('An error occurred while creating question:', error);
      }
    }
  };

  const handleTypeChange = (event) => {
    setQuestionType(event.target.value);
    setCurrentOption([]);
    setOptions([]);
    setCorrectOptions([]);
    if (event.target.value === 'numerical') {
      setShowCorrectAns({
        display: 'initial',
      });
      setShowButton({
        display: 'none',
      });
    } else if (
      event.target.value === 'multiple' ||
      event.target.value === 'single'
    ) {
      setShowCorrectAns({
        display: 'none',
      });
      setShowButton({
        display: 'initial',
      });
    }
  };

  const handleLevelChange = (event) => {
    setQuestionLevel(event.target.value);
  };

  const handleChange = (event, inputField) => {
    setOptions((oldOptions) =>
      oldOptions.map((data, index) => {
        if (index === inputField) return event.target.value;
        else return data;
      })
    );
  };

  const handleAddFields = () => {
    if (currentOption.length === 0) {
      setCurrentOption([0]);
      setOptions(['']);
      setCorrectOptions([false]);
    } else {
      let unfiledOption = true;
      currentOption.forEach((data, index) => {
        if (options[data] === '') {
          unfiledOption = false;
          alert('Please fill all option');
        }
      });
      if (unfiledOption) {
        setCurrentOption((oldCurrentOption) => [
          ...oldCurrentOption,
          options.length,
        ]);
        setOptions((oldOptions) => [...oldOptions, '']);
        setCorrectOptions((oldCorrectOptions) => [...oldCorrectOptions, false]);
      }
    }
  };

  // console.log(currentOption);
  // console.log(options);
  // console.log(correctOptions);

  const handleRemoveFields = (e, inputField) => {
    let newOptions = [...options];
    newOptions[inputField] = '';

    let newCorrectOptions = [...correctOptions];
    newCorrectOptions[inputField] = false;

    let newsetCurrentOption = currentOption.filter((d) => {
      return d != inputField;
    });

    setCurrentOption(newsetCurrentOption);
    setOptions(newOptions);
    setCorrectOptions(newCorrectOptions);
  };

  const handleRadiobox = (e, inputField) => {
    setCorrectOptions((oldData) =>
      oldData.map((data, index) => {
        if (index === inputField) return !data;
        else return false;
      })
    );
  };

  const handleCheckbox = (e, inputField) => {
    setCorrectOptions((oldData) =>
      oldData.map((data, index) => {
        if (index === inputField) return !data;
        else return data;
      })
    );
  };

  const quillRef = useRef(null);
  // const quillRef2 = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const field1 = data.questionTime;
    const field2 = data.question;
    const field3 = data.explanation;
    // console.log(field3);
    // console.log(field1);

    if (field1 === '' || field2 === '' || field3 === '') {
      setShowHeading(true);
      alert('Please fill all the fields!');
      setTimeout(() => {
        setShowHeading(false);
      }, 3000);
      setSaveConditionButton({
        display: 'initial',
      });
      return;
    }
    const quillEditor = quillRef.current;

    let isCorrectOption = true;
    if (questionType !== 'numerical') {
      let text = correctOptions.toString();
      isCorrectOption = text.includes('true');
    }

    if (isCorrectOption) {
      let isFilledOption = true;
      currentOption.map((option, index) => {
        if (options[option] === '') {
          isFilledOption = false;
        }
      });
      if (isFilledOption) {
        const questionData = {
          questionType,
          questionLevel,
          questionTime: data.questionTime,
          question: data.question,
          marks: data.marks,
          answer: data.correctAnsInteger,
          explanation: data.explanation,
          options: currentOption.map((option, index) => ({
            value: options[option],
            isCorrect: correctOptions[option],
          })),
        };
        // console.log('Submitted data', questionData);
        handleChangeData(questionData);
      } else {
        alert('Please fill all the options');
      }
    } else {
      alert('Please select correct option');
    }
  };

  const renderOptions = () => {
    return currentOption.map((inputField, index) => {
      return (
        <Box key={index} className="option1">
          {questionType === 'single' && (
            <input
              type="radio"
              name="o"
              value={options[inputField]}
              onChange={(e) => handleRadiobox(e, inputField)}
              // checked={inputField}
              checked={correctOptions[inputField]}
            />
          )}
          {questionType === 'multiple' && (
            <input
              type="checkbox"
              name="m"
              value={options[inputField]}
              onChange={(e) => handleCheckbox(e, inputField)} // Add the index parameter here
              checked={correctOptions[inputField]}
            />
          )}
          <input
            className="options_written"
            placeholder={'Option ' + (index + 1)}
            type="text"
            value={options[inputField]}
            onChange={(event) => handleChange(event, inputField)}
          />
          <button
            className="delete_opt"
            type="button"
            onClick={(e) => handleRemoveFields(e, inputField)}
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </Box>
      );
    });
  };

  return (
    <div className="add-question-container">
      {!submitted && (
        <form onSubmit={handleSubmit} method="POST" id="top-level">
          <div className="addQuestion-main_box">
            {showHeading && (
              <div className="alert alert-error" style={saveConditionButton}>
                Please fill all the fields!
              </div>
            )}

            <div className="type_box">
              <div className="type">
                <label>Type:</label>
                <select
                  id="questionType"
                  value={questionType}
                  onChange={handleTypeChange}
                >
                  <option value="single">Objective Type Question</option>
                  <option value="multiple">Multiple Correct Question</option>
                  <option value="numerical">Integer Type Question</option>
                </select>
              </div>
              <div className="level">
                <label>Level: </label>
                <select value={questionLevel} onChange={handleLevelChange}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="time">
                Time(s):
                <input
                  type="number"
                  id="quantity"
                  name="questionTime"
                  value={data.questionTime}
                  onChange={(e) =>
                    setData({ ...data, questionTime: e.target.value })
                  }
                  min="1"
                  max="360"
                />
              </div>
              <div className="mark">
                Mark:
                <input
                  type="number"
                  id="quantity"
                  name="mark"
                  value={data.marks}
                  onChange={(e) => setData({ ...data, marks: e.target.value })}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            {/* <textarea
              type="text"
              className="question2"
              id="question"
              name="question"
              value={data.question}
              onChange={(e) => setData({ ...data, question: e.target.value })}
              placeholder="Write the question here"
              rows="2"
              cols="50"
            ></textarea> */}
            <div className="instruction-container">
              Enter the question below:
            </div>

            <QuillEditor
              // ref={quillRef2}
              value={data.question}
              placeholder="Write the question here"
              onChange={(content) => setData({ ...data, question: content })}
            />
            <div className="instruction-container">
              Enter the options and select correct answer:
            </div>

            {questionType && (
              <div>
                {renderOptions()}
                <button
                  type="button"
                  className="add-option"
                  id="add-BUTTON"
                  style={showButton}
                  onClick={handleAddFields}
                >
                  <FontAwesomeIcon className="faPlus" icon={faPlus} /> Add
                  Options
                </button>
              </div>
            )}

            <input
              type="number"
              id="hide"
              name="correctAnsInteger"
              value={data.correctAnsInteger}
              onChange={(e) =>
                setData({ ...data, correctAnsInteger: e.target.value })
              }
              style={showCorrectAns}
              placeholder="Correct answer"
            />
            <div className="instruction-container">Enter the explanation:</div>
            <QuillEditor
              // ref={quillRef}
              value={data.explanation}
              onChange={(content) => {
                setData({ ...data, explanation: content });
              }}
              placeholder="Write the explanation here"
            />
            {/* <MyckEditor
              data={data.explanation}
              placeholder="Write the explanation here"
              onChange={(content) => setData({ ...data, explanation: content })}
            /> */}
            <div className="last">
              <button type="submit" className="btn_save btn" id="save_btn">
                Save
              </button>
              <button
                className="btn_cancel btn"
                id="cancel_btn"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
      <script
        src="http://kit.fontawesome.com/7e7a25b297.js"
        crossOrigin="anonymous"
      ></script>
      {fetchedData && (
        <div>{/* <p>Fetched Data: {JSON.stringify(fetchedData)}</p> */}</div>
      )}
    </div>
  );
}

export default AddQuestion;
