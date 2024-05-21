import React, { useEffect, useState } from 'react';
import getEnvironment from '../../getenvironment';
import {
  Menu,
  MenuButton,
  MenuList,
  Button,
} from '@chakra-ui/react';
import SideBarFinal from '../components/PRMSidebar'; // Import the SideBarFinal component

const PrmEditorDashboard = () => {
  const apiUrl = getEnvironment();

  const [papers, setPapers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/reviewmodule/paper`
        );
        const data = await response.json();
        setPapers(data);
      } catch (error) {
        console.error(error);
      }
    };
    const fetchReviewers = async () => {
      try {
        const data = await fetch(`${apiUrl}/reviewmodule/reviewer`);
        const reviewersData = await data.json();
        setReviewers(reviewersData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchReviewers();
    fetchPapers();
  }, []);

  const addReviewer = async (paperId, userId) => {
    try {
      const response = await fetch(
        `${apiUrl}/reviewmodule/reviewer/addReviewer?paperId=${paperId}&userId=${userId}`,
        {
          method: 'POST',
        }
      );
      const data = await response.json();
      alert('Reviewer added successfully');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {/* Sidebar component */}
      <SideBarFinal />

      {/* Main content */}
      <div className="tw-ml-64"> {/* Adjust the margin to accommodate the sidebar */}
        <h1 className="tw-text-2xl tw-text-blue-900">Editor Dashboard</h1>
        <div className="tw-mx-16">
          <h2 className="tw-text-lg tw-font-semibold tw-italic tw-mb-6">
            Papers
          </h2>
          {papers.map((paper) => (
            <div key={paper._id}>
              <p>
                <span className="tw-font-semibold tw-text-lg">Paper:</span>{' '}
                {paper.title}
              </p>
              <p>
                <span className="tw-font-semibold tw-text-lg">Abstract:</span>{' '}
                {paper.abstract}
              </p>
              <Menu>
                <MenuButton as={Button}>Add Reviewer</MenuButton>
                <MenuList>
                  <div className="tw-flex tw-flex-col">
                    {reviewers?.map((reviewer, index) => (
                      <button
                        className="tw-bg-blue-500 tw-text-white tw-p-2 tw-rounded tw-mt-2"
                        onClick={() => addReviewer(paper._id, reviewer._id)}
                        key={`${reviewer._id}-${index}`}
                      >
                        {reviewer.email[0]}
                      </button>
                    ))}
                  </div>
                </MenuList>
              </Menu>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrmEditorDashboard;
