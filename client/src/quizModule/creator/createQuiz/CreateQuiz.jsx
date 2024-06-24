import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Text, Heading,FormLabel} from '@chakra-ui/react'
import * as Yup from 'yup';
import moment from 'moment-timezone';
// import './createquiz.css';
// import StudentProfileChecker from '../../../../components/privateroutes/studentprofilechecker';
import getEnvironment from '../../../getenvironment';

const CreateQuiz = () => {
  const initialValues = {
    quizName: '',
    startTime: '',
    marginTime: '',
    resultTime: '',
    negativeMarking: '',
    preventMobile: false,
    allowTabchange: false,
  };

  const [message, setMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const apiurl = getEnvironment();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem('token');

      // Format the date and time values using moment and set the timezone to Indian Standard Time (IST)
      const formattedValues = {
        ...values,
        startTime: moment.tz(values.startTime, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        marginTime: moment.tz(values.marginTime, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        resultTime: moment.tz(values.resultTime, 'YYYY-MM-DDTHH:mm', 'Asia/Kolkata').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      };
      
      // Submit the data to the backend
      const response = await fetch(`${apiurl}/quizmodule/faculty/quiz`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedValues),
      });

      if (response.ok) {
        // Request was successful
        const data = await response.json();
        const allquiz = data.data;
        console.log(allquiz.code);

        // Access the necessary details from the updated allquiz array
        const generatedLink = allquiz.code;

        // Set the generated link and submitted state in the component state
        setGeneratedLink(generatedLink);
        setSubmitted(true);

        // Redirect to the quiz page
        const redirectTo = `/quiz/${generatedLink}`;
        navigate(redirectTo);
      } else {
        // Handle error response
        console.error('Error creating quiz:', response.status);
        setMessage('An error occurred during quiz creation.');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setMessage('An error occurred during quiz creation.');
    }

    setSubmitting(false);
  };

  const validationSchema = Yup.object().shape({
    quizName: Yup.string().required('Quiz name is required'),
    startTime: Yup.string().required('Start date and time are required'),
    marginTime: Yup.string().required('Margin date and time are required').test({
      name: 'is-after-start',
      message: 'Margin date must be greater than the start date',
      test: function(value) {
        const { startTime } = this.parent;
        return moment(value).isAfter(startTime);
      },
    }),
    resultTime: Yup.string().required('Result date and time are required').test({
      name: 'is-after-margin',
      message: 'Result date must be greater than the margin date',
      test: function (value) {
        const { marginTime } = this.parent;
        return moment(value).isAfter(marginTime);
      },
    }),
    negativeMarking: Yup.number().required('Negative marking is required'),
  });

  return (
    <div id="outer_div">
   {/* <StudentProfileChecker />    */}
        {submitted ? (
          <div>{message}</div>
        ) : (
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ values }) => (
          
              <Form id="container">
           <div className='left'>
  <div className='logo'>
  <img src="/clublogo.png" alt="X Logo"/>
  <div className='create-text'>
  <Heading size='lg' fontSize='50px'> CREATE<br/>QUIZ</Heading>
  </div>
 
</div>
</div>
<div className='right'>
<div id="div1">
               
                <div id="createquiz_edit">
                <div id="label">
                  <FormLabel className="custom-label" htmlFor="quizName">
                  <Text fontSize="lg" fontWeight="bold">
                    Course Quiz:
                    </Text>
                  </FormLabel>
                  <div className='createquiz_container'>
                  <Field type="text" id="quizName" name="quizName" className='createquiz_inputbox_edit2'/>
                  <ErrorMessage name="quizName" component="div" className="error-message1" />
                  </div>
                  </div>
               

                <div id="createquiz_input">
                  <FormLabel className="createquiz_inputbox" htmlFor="startTime">
                  <Text fontSize="lg" fontWeight="bold">
                    Start Date and Time:
                    </Text>
                  </FormLabel>
                  <div className='createquiz_container'>
                  <Field type="datetime-local" id="startTime" name="startTime" className="createquiz_inputbox_edit" />
                  <ErrorMessage name="startTime" component="div" className="error-message1" />
                  </div>
                </div>

                <div id="createquiz_input">
                  <FormLabel className="createquiz_inputbox" htmlFor="marginTime">
                  <Text fontSize="lg" fontWeight="bold">  
                    
                    Margin Date and Time:
                    </Text>
                  </FormLabel>
                  <div className='createquiz_container'>
                  <Field type="datetime-local" id="marginTime" name="marginTime" className="createquiz_inputbox_edit" />
                  <ErrorMessage name="marginTime" component="div" className="error-message1" />
                  </div>
                </div>

                <div id="createquiz_input">
                  <FormLabel className="createquiz_inputbox" htmlFor="resultTime">
                  <Text fontSize="lg" fontWeight="bold">
                    Result Date and Time:
                    </Text>
                  </FormLabel>
                  <div className='createquiz_container'>
                  <Field type="datetime-local" id="resultTime" name="resultTime" className="createquiz_inputbox_edit" />
                  <ErrorMessage name="resultTime" component="div" className="error-message1" />
                  </div>
                </div>

                <div id="createquiz_input4">
                  <FormLabel className="createquiz_inputbox" htmlFor="negativeMarking">
                  <Text fontSize="lg" fontWeight="bold">
                    Negative Marking:
                    </Text>
                  </FormLabel>
                  <Field type="number" id="negativeMarking" name="negativeMarking" className="createquiz_inputbox_edit" />
                  <ErrorMessage name="negativeMarking" component="div" className="error-message1" />
                </div>

                <div id="createquiz_input5">
                  <FormLabel className="createquiz_inputbox" htmlFor="preventMobile">
                  <Text fontSize="lg" fontWeight="bold">
                    Prevent Mobile:
                    </Text>
                  </FormLabel>
                  <Field type="checkbox" id="preventMobile" name="preventMobile" className="createquiz_inputbox_edit" />
                  <ErrorMessage name="preventMobile" component="div" className="error-message1" />
                </div>

                <div id="createquiz_input6">
                  <FormLabel className="createquiz_inputbox" htmlFor="allowTabchange">
                  <Text fontSize="lg" fontWeight="bold">
                    Allow Tab Change:
                    </Text>
                  </FormLabel>
                  <Field type="checkbox" id="allowTabchange" name="allowTabchange" className="createquiz_inputbox_edit" />
                  <ErrorMessage name="allowTabchange" component="div" className="error-message1" />
                </div>

                <div id="submit">
                  <button type="submit" id="button">
                    Create Quiz
                  </button>
                </div>
               </div>
               </div>
               </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    
  );
};

export default CreateQuiz;