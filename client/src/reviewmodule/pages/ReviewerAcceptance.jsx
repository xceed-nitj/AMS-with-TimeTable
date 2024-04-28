import React, { useState } from 'react';
import axios from 'axios'; // Import Axios for making HTTP requests

const ReviewerAcceptance = () => {
  const [paperId, setPaperId] = useState('');
  const [accepted, setAccepted] = useState('');

  const handlePaperIdChange = (event) => {
    setPaperId(event.target.value);
  };

  const handleAcceptedChange = (value) => {
    setAccepted(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Make an HTTP POST request to your backend API
      const response = await axios.post('http://localhost:8010/api/v1/reviewmodule/updateReviewerAcceptanceStatus', {
        paperId,
        status: accepted === 'yes' ? true : false,
      });

      console.log(response.data); // Log the response from the backend
    } catch (error) {
      console.error('Error updating reviewer acceptance status:', error);
    }
  };

  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-h-screen">
      <div className="tw-bg-white tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-mb-4">
        <h2 className="tw-text-2xl tw-mb-4 tw-text-center">Accept Paper</h2>
        <form onSubmit={handleSubmit}>
          <div className="tw-mb-4">
            <label htmlFor="paperId" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2">
              Paper ID:
            </label>
            <input
              type="text"
              id="paperId"
              value={paperId}
              onChange={handlePaperIdChange}
              className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
              required
            />
          </div>
          <div className="tw-mb-6">
            <label className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2">Accepted:</label>
            <div className="tw-flex tw-items-center">
              <button
                type="button"
                className={`tw-bg-green-500 tw-hover:bg-green-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-focus:tw-outline-none tw-focus:tw-shadow-outline ${
                  accepted === 'yes' ? 'tw-bg-green-700' : ''
                }`}
                onClick={() => handleAcceptedChange('yes')}
              >
                Yes
              </button>
              <button
                type="button"
                className={`tw-bg-red-500 tw-hover:bg-red-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-ml-4 tw-focus:tw-outline-none tw-focus:tw-shadow-outline ${
                  accepted === 'no' ? 'tw-bg-red-700' : ''
                }`}
                onClick={() => handleAcceptedChange('no')}
              >
                No
              </button>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-justify-center">
            <button
              type="submit"
              className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
            >
              Accept Paper
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewerAcceptance;
